import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma, type Post } from "@/generated/prisma/client";
import { allSections, pageOfSection, sectionByKey, sectionHref } from "@/lib/studio/fields";
import { defaults, type SectionKey, type Sections } from "@/lib/studio/defaults";
import { ApiError } from "./api";
import { db } from "./db";
import { STUDIO_TAG } from "./refresh";
import { readSection, UNTIL_CHANGED } from "./site";
import type { PostData } from "./validate";

// What the studio works on: the draft of each section where there is one, else what is published.
// Read from the database once, then kept until something is saved, uploaded, deleted or published (refreshStudio).

function untilSaved() {
  cacheTag(STUDIO_TAG);
  cacheLife(UNTIL_CHANGED);
}

export type Pending = { kind: "section" | "image" | "post"; id: string; label: string; href: string; discardable: boolean };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** The database does not keep the order of keys: put a section in the order of its fields before comparing */
const normal = (key: SectionKey, value: unknown) => readSection(key, JSON.parse(JSON.stringify(value)));

export const postDraft = (post: Post) => post.draft as PostData;
const postPending = (post: Post) => post.dirty && (postDraft(post).live || post.published !== null);

export async function getPending(): Promise<Pending[]> {
  "use cache";
  untilSaved();
  const [entries, media, posts] = await Promise.all([
    db.entry.findMany({ where: { draft: { not: Prisma.DbNull } }, select: { key: true } }),
    db.media.findMany({ where: { draftAlt: { not: null } }, select: { id: true, name: true } }),
    db.post.findMany({ where: { dirty: true } }),
  ]);
  return [
    ...entries.flatMap(({ key }): Pending[] => {
      const section = sectionByKey(key);
      const page = pageOfSection(key);
      return section ? [{ kind: "section", id: key, label: page ? `${page.label}: ${section.label}` : section.label, href: sectionHref(key), discardable: true }] : [];
    }),
    ...media.map((m): Pending => ({ kind: "image", id: m.id, label: `Alt text: ${m.name}`, href: "/studio/images", discardable: true })),
    ...posts
      .filter(postPending)
      .map(
        (p): Pending => ({
          kind: "post",
          id: p.id,
          label: `Post: ${postDraft(p).title}`,
          href: `/studio/blog/${p.id}`,
          discardable: p.published !== null, // a new post has nothing to go back to
        }),
      ),
  ];
}

export async function getSections() {
  "use cache";
  untilSaved();
  const rows = new Map((await db.entry.findMany()).map((e) => [e.key, e]));
  return Object.fromEntries(
    allSections.map(({ key }) => {
      const k = key as SectionKey;
      const row = rows.get(key);
      const value = normal(k, row?.draft ?? row?.published ?? defaults[k]);
      return [key, { value, draft: row?.draft != null, edited: !same(value, normal(k, defaults[k])), original: normal(k, defaults[k]) }];
    }),
  ) as { [K in SectionKey]: { value: Sections[K]; draft: boolean; edited: boolean; original: Sections[K] } };
}

export async function saveDraft(key: SectionKey, value: Sections[SectionKey], by: string) {
  const row = await db.entry.findUnique({ where: { key } });
  // back to what is on the website: nothing left to publish
  const unchanged = same(normal(key, value), normal(key, row?.published ?? defaults[key]));
  const draft = unchanged ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  await db.entry.upsert({ where: { key }, create: { key, draft, updatedBy: by }, update: { draft, updatedBy: by } });
  return { pending: !unchanged };
}

export const discardDraft = (key: SectionKey) => db.entry.updateMany({ where: { key }, data: { draft: Prisma.DbNull } });

/** An address may be used by one post only: as a draft, or on the website until its next publish */
export async function slugFree(slug: string, except?: string) {
  const taken = await db.post.findFirst({ where: { OR: [{ slug }, { publishedSlug: slug }], NOT: except ? { id: except } : undefined } });
  if (taken) throw new ApiError(422, "Some fields need another look", { slug: "Another post has this address" });
}

const ordered = (post: unknown) => JSON.stringify(Object.entries(post ?? {}).sort(([a], [b]) => (a < b ? -1 : 1)));

export async function savePost(post: Post, draft: PostData, by: string) {
  await slugFree(draft.slug, post.id);
  const dirty = ordered(draft) !== ordered(post.published);
  await db.post.update({ where: { id: post.id }, data: { slug: draft.slug, draft, dirty, updatedBy: by } });
}

export async function discardPost(post: Post) {
  if (!post.published) throw new ApiError(409, "This post has no published version to go back to");
  const published = post.published as PostData;
  await db.post.update({ where: { id: post.id }, data: { draft: published, slug: published.slug, dirty: false } });
}

/** Puts every draft on the website, all or nothing */
export async function publishAll(by: string) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    const entries = await tx.entry.findMany({ where: { draft: { not: Prisma.DbNull } } });
    for (const e of entries)
      await tx.entry.update({
        where: { key: e.key },
        data: { published: e.draft as Prisma.InputJsonValue, draft: Prisma.DbNull, publishedAt: now },
      });
    const media = await tx.media.findMany({ where: { draftAlt: { not: null } } });
    for (const m of media) await tx.media.update({ where: { id: m.id }, data: { alt: m.draftAlt!, draftAlt: null } });
    const posts = (await tx.post.findMany({ where: { dirty: true } })).filter(postPending);
    // addresses are unique: free the old ones first, so two posts can swap
    await tx.post.updateMany({ where: { id: { in: posts.map((p) => p.id) } }, data: { publishedSlug: null } });
    for (const p of posts)
      await tx.post.update({
        where: { id: p.id },
        data: postDraft(p).live
          ? { published: p.draft as Prisma.InputJsonValue, publishedSlug: p.slug, publishedAt: p.publishedAt ?? now, dirty: false }
          : { published: Prisma.DbNull, dirty: false },
      });
    const changes = entries.length + media.length + posts.length;
    if (changes) await tx.publish.create({ data: { by, changes, at: now } });
    return changes;
  });
}

export async function lastPublished() {
  "use cache";
  untilSaved();
  return db.publish.findFirst({ orderBy: { id: "desc" }, select: { at: true, by: true } });
}

export async function getStudioPosts() {
  "use cache";
  untilSaved();
  return db.post.findMany({ orderBy: { updatedAt: "desc" } });
}

/** Every picture, with where it is used */
export async function getMedia() {
  "use cache";
  untilSaved();
  const [media, uses] = await Promise.all([
    db.media.findMany({
      orderBy: [{ uploaded: "desc" }, { decorative: "asc" }, { createdAt: "desc" }, { name: "asc" }],
      omit: { createdAt: true },
    }),
    imageUses(),
  ]);
  return media.map((m) => ({ ...m, uses: uses(m.path) }));
}

/** Where a picture is used: in the text on the website, in drafts and in posts */
export async function imageUses() {
  const [entries, posts] = await Promise.all([db.entry.findMany(), db.post.findMany()]);
  const rows = new Map(entries.map((e) => [e.key, e]));
  const places: { label: string; text: string }[] = allSections.map(({ key, label }) => {
    const row = rows.get(key);
    const page = pageOfSection(key);
    return {
      label: page ? `${page.label}: ${label}` : label,
      text: JSON.stringify([row?.published ?? defaults[key as SectionKey], row?.draft]),
    };
  });
  for (const p of posts) places.push({ label: `Post: ${postDraft(p).title}`, text: JSON.stringify([p.draft, p.published]) });
  return (path: string) => places.filter((p) => p.text.includes(path)).map((p) => p.label);
}

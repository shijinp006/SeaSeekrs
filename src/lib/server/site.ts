import "server-only";
import { cacheLife, cacheTag, revalidatePath, revalidateTag } from "next/cache";
import { draftMode } from "next/headers";
import { allSections, sectionByKey } from "@/lib/studio/fields";
import { defaultAlts, defaults, type SectionKey, type Sections } from "@/lib/studio/defaults";
import { db } from "./db";
import { log } from "./log";
import { getUser } from "./session";
import { postSchema, sectionSchema, type PostData } from "./validate";

// What the website shows: the published text of each section, or the starting text where nothing was published.
//
// On-demand ISR: the pages are static. The database is asked once, the answer is kept with the pages made from it, and
// nothing is asked again until something new is published (refreshSite). No page is made again on a timer.

/** Every cached read of published content carries this tag; publishing expires it */
const SITE_TAG = "site";

/** The next visitor gets the new text: the cached content is dropped, and the pages made from it */
export function refreshSite() {
  revalidateTag(SITE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

const YEAR = 365 * 24 * 60 * 60;
/** Until it is published again */
export const UNTIL_CHANGED = { stale: 300, revalidate: YEAR, expire: 10 * YEAR };
/** Without a database (a build, an outage) the site shows its starting text and looks again a minute later */
const RETRY = { stale: 300, revalidate: 60, expire: 60 * 60 };

export type Site = {
  content: Sections;
  /** alt text by picture */
  alts: Record<string, string>;
  hasBlog: boolean;
  /** shown to an editor: drafts that are not on the website yet */
  preview: boolean;
};

/** Stored JSON → a section, or the starting text if it no longer fits the fields */
export function readSection<K extends SectionKey>(key: K, stored: unknown): Sections[K] {
  if (stored == null) return defaults[key];
  const parsed = sectionSchema(sectionByKey(key)!).safeParse(stored);
  return parsed.success ? (parsed.data as Sections[K]) : defaults[key];
}

/** An editor in preview: the draft cookie alone is not enough, they must be signed in */
const previewing = async () => (await draftMode()).isEnabled && (await getUser()) !== null;

async function readSite(drafts: boolean): Promise<Site> {
  const [entries, media, posts] = await Promise.all([
    db.entry.findMany({ select: { key: true, published: true, draft: drafts } }),
    db.media.findMany({ select: { path: true, alt: true, draftAlt: drafts } }),
    db.post.findMany({ select: { publishedSlug: true, draft: drafts } }),
  ]);
  const stored = new Map(entries.map((e) => [e.key, (drafts && e.draft) || e.published]));
  const content = Object.fromEntries(allSections.map(({ key }) => [key, readSection(key as SectionKey, stored.get(key))]));
  return {
    content: content as Sections,
    alts: { ...defaultAlts, ...Object.fromEntries(media.map((m) => [m.path, (drafts ? m.draftAlt : null) ?? m.alt])) },
    hasBlog: posts.some((p) => (drafts ? (p.draft as PostData).live : p.publishedSlug !== null)),
    preview: drafts,
  };
}

export const getSite = async (): Promise<Site> => ((await previewing()) ? readSite(true) : publishedSite());

/** For what has no request to be a preview of: generateStaticParams */
export async function publishedSite(): Promise<Site> {
  "use cache";
  cacheTag(SITE_TAG);
  try {
    const site = await readSite(false);
    cacheLife(UNTIL_CHANGED);
    return site;
  } catch (error) {
    log.error({ err: error }, "database not reachable: showing the starting text");
    cacheLife(RETRY);
    return { content: defaults, alts: defaultAlts, hasBlog: false, preview: false };
  }
}

export type PublicPost = PostData & { publishedAt: string };

/** In preview: the drafts that will be on the website */
export const getPosts = async () => ((await previewing()) ? (await draftPosts()).filter((p) => p.live) : publishedPosts());

async function draftPosts(): Promise<PublicPost[]> {
  const rows = await db.post.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.flatMap((row) => {
    const post = postSchema.safeParse(row.draft);
    return post.success ? [{ ...post.data, publishedAt: (row.publishedAt ?? row.updatedAt).toISOString() }] : [];
  });
}

export async function publishedPosts(): Promise<PublicPost[]> {
  "use cache";
  cacheTag(SITE_TAG);
  try {
    const rows = await db.post.findMany({ where: { publishedSlug: { not: null } }, orderBy: { publishedAt: "desc" } });
    cacheLife(UNTIL_CHANGED);
    return rows.flatMap((row) => {
      const post = postSchema.safeParse(row.published);
      if (!post.success || !row.publishedAt) return [];
      return [{ ...post.data, publishedAt: row.publishedAt.toISOString() }];
    });
  } catch {
    cacheLife(RETRY);
    return [];
  }
}

/** In preview any draft, also one that is not to be shown yet */
export async function getPost(slug: string) {
  const posts = (await previewing()) ? await draftPosts() : await publishedPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export const siteUrl = (path = "/") => new URL(path, process.env.SITE_URL || "https://seaseakersyachts.com").toString();

import { ApiError, body, route } from "@/lib/server/api";
import type { SessionUser } from "@/lib/server/session";
import { refreshSite } from "@/lib/server/site";
import { discardDraft, publishSection, saveDraft } from "@/lib/server/studio";
import { sectionSchema } from "@/lib/server/validate";
import type { SectionKey, Sections } from "@/lib/studio/defaults";
import { sectionByKey } from "@/lib/studio/fields";

/** The sections the admin works on in /admin; every other one belongs to the SEO studio */
const ADMIN_SECTIONS = new Set(["services.items"]);

function find(key: string, user: SessionUser) {
  const section = sectionByKey(key);
  if (!section) throw new ApiError(404, "Not found");
  if (user.role === "ADMIN" && !ADMIN_SECTIONS.has(section.key)) throw new ApiError(403, "This is edited in the SEO studio");
  return section;
}

/** The SEO specialist saves a section as a draft; the admin puts it on the website straight away */
export const PUT = route<{ key: string }>(async (request, { user, params }) => {
  const section = find(params.key, user);
  const value = (await body(request, sectionSchema(section))) as Sections[SectionKey];
  if (user.role === "SEO") return saveDraft(section.key as SectionKey, value, user.email);
  await publishSection(section.key as SectionKey, value, user.email);
  refreshSite();
  return { pending: false };
});

/** Throws the draft away */
export const DELETE = route<{ key: string }>(
  async (_request, { user, params }) => {
    await discardDraft(find(params.key, user).key as SectionKey);
  },
  { role: "SEO" },
);

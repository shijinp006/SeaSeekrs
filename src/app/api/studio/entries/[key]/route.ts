import { ApiError, body, route } from "@/lib/server/api";
import { discardDraft, saveDraft } from "@/lib/server/studio";
import { sectionSchema } from "@/lib/server/validate";
import type { SectionKey, Sections } from "@/lib/studio/defaults";
import { sectionByKey } from "@/lib/studio/fields";

function find(key: string) {
  const section = sectionByKey(key);
  if (!section) throw new ApiError(404, "Not found");
  return section;
}

/** Saves a section as a draft */
export const PUT = route<{ key: string }>(async (request, { user, params }) => {
  const section = find(params.key);
  const value = await body(request, sectionSchema(section));
  return saveDraft(section.key as SectionKey, value as Sections[SectionKey], user.email);
});

/** Throws the draft away */
export const DELETE = route<{ key: string }>(async (_request, { params }) => {
  await discardDraft(find(params.key).key as SectionKey);
});

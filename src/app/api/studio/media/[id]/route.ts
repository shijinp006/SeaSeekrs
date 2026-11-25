import { ApiError, body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { imageUses } from "@/lib/server/studio";
import { removeImage } from "@/lib/server/upload";
import { altSchema, uuidSchema } from "@/lib/server/validate";

async function find(id: string) {
  const media = uuidSchema.safeParse(id).success ? await db.media.findUnique({ where: { id } }) : null;
  if (!media) throw new ApiError(404, "Not found");
  return media;
}

/** Saves alt text as a draft */
export const PATCH = route<{ id: string }>(async (request, { params }) => {
  const media = await find(params.id);
  const { alt } = await body(request, altSchema);
  return db.media.update({ where: { id: media.id }, data: { draftAlt: alt === media.alt ? null : alt } });
});

/** ?draft=1 throws the draft of the alt text away; otherwise deletes the picture: uploads only, while nothing uses them */
export const DELETE = route<{ id: string }>(async (request, { params }) => {
  const media = await find(params.id);
  if (new URL(request.url).searchParams.has("draft")) {
    await db.media.update({ where: { id: media.id }, data: { draftAlt: null } });
    return;
  }
  if (!media.uploaded) throw new ApiError(409, "This picture is part of the website and cannot be deleted");
  const uses = (await imageUses())(media.path);
  if (uses.length) throw new ApiError(409, `Still used in ${uses.join(", ")}`);
  await db.media.delete({ where: { id: media.id } });
  await removeImage(media.path);
});

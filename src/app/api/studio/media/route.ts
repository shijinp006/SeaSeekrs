import { route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { getMedia } from "@/lib/server/studio";
import { readUpload, removeImage, storeImage } from "@/lib/server/upload";
import { altSchema } from "@/lib/server/validate";

export const GET = route(() => getMedia());

export const POST = route(async (request) => {
  const { file, alt: rawAlt } = await readUpload(request);
  const { alt } = altSchema.parse({ alt: rawAlt });
  const image = await storeImage(file.buffer);
  const name = file.originalname.replace(/[^\w. -]/g, "").slice(0, 80) || "upload";
  try {
    return await db.media.create({ data: { ...image, name, alt, uploaded: true } });
  } catch (error) {
    await removeImage(image.path);
    throw error;
  }
});

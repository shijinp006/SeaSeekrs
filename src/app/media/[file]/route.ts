import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_NAME, uploadDir } from "@/lib/server/upload";

/** Pictures uploaded in the studio */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = UPLOAD_NAME.test(file) ? await readFile(path.join(uploadDir(), file)).catch(() => null) : null;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

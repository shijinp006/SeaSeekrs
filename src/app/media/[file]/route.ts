import { readImage } from "@/lib/server/upload";

/** Pictures uploaded in the studio */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = await readImage(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      // the name never comes back with another picture; s-maxage lets Vercel's network keep it too
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

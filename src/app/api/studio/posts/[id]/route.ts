import { ApiError, body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { refreshSite } from "@/lib/server/site";
import { discardPost, savePost } from "@/lib/server/studio";
import { postSchema, uuidSchema } from "@/lib/server/validate";

async function find(id: string) {
  const post = uuidSchema.safeParse(id).success ? await db.post.findUnique({ where: { id } }) : null;
  if (!post) throw new ApiError(404, "Not found");
  return post;
}

/** Saves a post as a draft */
export const PUT = route<{ id: string }>(async (request, { user, params }) => {
  const post = await find(params.id);
  await savePost(post, await body(request, postSchema), user.email);
}, { role: "SEO" });

/** ?draft=1 goes back to the published version; otherwise the post is deleted, on the website too */
export const DELETE = route<{ id: string }>(async (request, { params }) => {
  const post = await find(params.id);
  if (new URL(request.url).searchParams.has("draft")) {
    await discardPost(post);
    return;
  }
  await db.post.delete({ where: { id: post.id } });
  if (post.published) refreshSite();
}, { role: "SEO" });

import { body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { slugFree } from "@/lib/server/studio";
import { postSchema } from "@/lib/server/validate";

export const POST = route(async (request, { user }) => {
  const draft = await body(request, postSchema);
  await slugFree(draft.slug);
  const { id } = await db.post.create({ data: { slug: draft.slug, draft, updatedBy: user.email } });
  return { id };
});

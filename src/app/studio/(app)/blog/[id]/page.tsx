import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Heading from "@/components/studio/Heading";
import PostForm from "@/components/studio/PostForm";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/site";
import { postDraft } from "@/lib/server/studio";
import { uuidSchema } from "@/lib/server/validate";

export const instant = false;
export const metadata: Metadata = { title: "Edit post" };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const post = uuidSchema.safeParse(id).success ? await db.post.findUnique({ where: { id } }) : null;
  if (!post) notFound();
  const { title, slug, excerpt, body, cover, seoTitle, seoDescription, live } = postDraft(post);
  return (
    <>
      <Heading title={title} back={{ href: "/studio/blog", label: "Blog posts" }} />
      <PostForm
        key={post.id}
        id={post.id}
        host={siteUrl().replace(/\/$/, "")}
        value={{ title, slug, excerpt, body, cover, seoTitle, seoDescription, live }}
        published={post.publishedSlug}
      />
    </>
  );
}

import type { Metadata } from "next";
import Heading from "@/components/studio/Heading";
import PostForm from "@/components/studio/PostForm";
import { requireUser } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/site";

export const instant = false;
export const metadata: Metadata = { title: "New post" };

export default async function NewPost() {
  await requireUser("SEO");
  return (
    <>
      <Heading title="New post" back={{ href: "/studio/blog", label: "Blog posts" }} />
      <PostForm host={siteUrl().replace(/\/$/, "")} value={{ title: "", slug: "", excerpt: "", body: "", cover: "", seoTitle: "", seoDescription: "", live: true }} />
    </>
  );
}

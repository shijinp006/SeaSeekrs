import type { Metadata } from "next";
import Link from "next/link";
import Heading from "@/components/studio/Heading";
import Rows from "@/components/studio/Rows";
import { CARD, GOLD } from "@/components/studio/styles";
import { Icon } from "@/components/studio/ui";

import { requireUser } from "@/lib/server/session";
import { getStudioPosts, postDraft } from "@/lib/server/studio";
import { seoIssues } from "@/lib/studio/seo";

export const instant = false;
export const metadata: Metadata = { title: "Blog posts" };

export default async function Posts() {
  await requireUser();
  const posts = await getStudioPosts();
  return (
    <>
      <Heading title="Blog posts" text="Each post gets its own page, its own Google result and a place in the sitemap." />
      <Link href="/studio/blog/new" className={`${GOLD} mb-5`}>
        <Icon name="plus" className="size-4" /> New post
      </Link>
      {posts.length ? (
        <Rows
          title={`${posts.length} post${posts.length === 1 ? "" : "s"}`}
          rows={posts.map((post) => {
            const d = postDraft(post);
            return {
              href: `/studio/blog/${post.id}`,
              title: d.title,
              path: `/blog/${d.slug}`,
              text: d.excerpt,
              issues: seoIssues({ title: d.seoTitle || d.title, description: d.seoDescription || d.excerpt }),
              ok: "Title & description OK",
              notes: [post.published ? "On the website" : "Not on the website", post.dirty && post.published !== null && "Draft"],
            };
          })}
        />
      ) : (
        <p className={`${CARD} p-6 text-(--mute)`}>No posts yet. Write the first one.</p>
      )}
    </>
  );
}

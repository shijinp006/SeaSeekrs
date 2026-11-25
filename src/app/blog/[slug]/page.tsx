import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import Markdown from "@/components/Markdown";
import PageTransition from "@/components/PageTransition";
import SmoothScroll from "@/components/SmoothScroll";
import SiteHeader from "@/components/SiteHeader";
import { Footer } from "@/components/sections/Charter";
import { book } from "@/lib/links";
import { BTN_GOLD } from "@/lib/motion";
import { breadcrumbLd, pageMetadata, postLd } from "@/lib/server/seo";
import { getPost, getSite, publishedPosts } from "@/lib/server/site";

// Waits for the post instead of streaming it in, so an unknown address answers with a real 404
export const instant = false;

type Props = { params: Promise<{ slug: string }> };

// With this the posts are kept as static pages too, also those published after the build. The build needs at least one
// address to check this route; "-" is never a post, and answers 404.
export const generateStaticParams = async () => {
  const posts = await publishedPosts();
  return posts.length ? posts.map(({ slug }) => ({ slug })) : [{ slug: "-" }];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [post, site] = await Promise.all([getPost((await params).slug), getSite()]);
  if (!post) return { title: "Not found", robots: { index: false } };
  const seo = {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.cover || site.content["blog.seo"].image,
  };
  return pageMetadata(seo, `/blog/${post.slug}`, "article");
}

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

export default async function PostPage({ params }: Props) {
  const [post, site] = await Promise.all([getPost((await params).slug), getSite()]);
  if (!post) notFound();
  return (
    <>
      <JsonLd
        data={[
          postLd(post, site),
          breadcrumbLd([
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <SiteHeader site={site} home={false} />
      <PageTransition>
<main id="top" tabIndex={-1} className="outline-none">
        <article>
          <header className="bg-navy-deep pb-16 pt-40 text-white md:pb-24 md:pt-52">
            <div className="mx-auto max-w-[52rem] px-4 md:px-12">
              <div className="text-white/70">
                <Breadcrumb steps={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: post.title }]} />
              </div>
              <h1 className="display t-hero mt-6">{post.title}</h1>
              <time dateTime={post.publishedAt} className="mt-5 block text-[0.875rem] text-white/65">
                {day.format(new Date(post.publishedAt))}
              </time>
            </div>
          </header>
          <section data-tone="foam" className="pb-20">
            <div className="mx-auto max-w-[52rem] px-4 md:px-12">
              {post.cover && (
                <div className="relative -top-8 aspect-[3/2] overflow-hidden rounded-port md:-top-12">
                  <Image
                    src={post.cover}
                    alt={site.alts[post.cover] || post.title}
                    fill
                    preload
                    sizes="(min-width: 832px) 46rem, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className={post.cover ? "pt-2" : "pt-16"}>
                <Markdown text={post.body} />
              </div>
              <a href={book(site.content.business, post.title)} target="_blank" rel="noopener noreferrer" className={`${BTN_GOLD} mt-12`}>
                Book on WhatsApp
              </a>
            </div>
          </section>
        </article>
      </main>
</PageTransition>
      <Footer site={site} home={false} />
      <SmoothScroll />
    </>
  );
}

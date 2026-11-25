import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageTransition from "@/components/PageTransition";
import SmoothScroll from "@/components/SmoothScroll";
import SiteHeader from "@/components/SiteHeader";
import Title, { Tagged } from "@/components/Title";
import { Footer } from "@/components/sections/Charter";
import { breadcrumbLd, pageMetadata } from "@/lib/server/seo";
import { getPosts, getSite } from "@/lib/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [site, posts] = await Promise.all([getSite(), getPosts()]);
  // nothing for Google to find here before the first post
  return { ...pageMetadata(site.content["blog.seo"], "/blog"), ...(posts.length === 0 && { robots: { index: false } }) };
}

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

export default async function Blog() {
  const [site, posts] = await Promise.all([getSite(), getPosts()]);
  const intro = site.content["blog.intro"];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Blog", path: "/blog" }])} />
      <SiteHeader site={site} home={false} />
      <PageTransition>
<main id="top" tabIndex={-1} className="outline-none">
        <section data-tone="deep" className="pb-16 pt-40 md:pb-24 md:pt-52">
          <div className="container-x">
            <Title heading={intro} as="h1" className="display t-hero" />
            <Tagged tag={intro.bodyTag} as="p" className="mt-5 max-w-xl t-lead text-(--mute)">
              {intro.body}
            </Tagged>
          </div>
        </section>
        <section data-tone="foam" className="min-h-[40vh] py-16 md:py-24">
          <div className="container-x">
            {posts.length ? (
              <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p, i) => (
                  <li key={p.slug} data-aos="fade-up" data-aos-delay={(i % 3) * 130}>
                    <article>
                      <Link href={`/blog/${p.slug}`} className="group card-focus block">
                        <span className="relative block aspect-[3/2] overflow-hidden rounded-port bg-navy-deep/10">
                          {p.cover && (
                            <Image
                              src={p.cover}
                              alt={site.alts[p.cover] || p.title}
                              fill
                              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                              className="card-img object-cover"
                            />
                          )}
                        </span>
                        <time dateTime={p.publishedAt} className="mt-5 block text-[0.8125rem] text-(--mute)">
                          {day.format(new Date(p.publishedAt))}
                        </time>
                        <h2 className="display t-card mt-2">{p.title}</h2>
                        <p className="mt-3 leading-relaxed text-(--mute)">{p.excerpt}</p>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-lead text-(--mute)">The first post is on its way.</p>
            )}
          </div>
        </section>
      </main>
</PageTransition>
      <Footer site={site} home={false} />
      <SmoothScroll />
    </>
  );
}

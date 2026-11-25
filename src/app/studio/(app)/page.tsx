import Image from "next/image";
import Link from "next/link";
import Rows from "@/components/studio/Rows";
import { CARD } from "@/components/studio/styles";
import { Badge, Icon, type IconName } from "@/components/studio/ui";
import { tours } from "@/lib/content";

import { STATUS_LABEL } from "@/lib/booking";
import { countNewBookings, latestBookings } from "@/lib/server/bookings";
import { siteUrl } from "@/lib/server/site";
import { requireUser } from "@/lib/server/session";
import { getMedia, getSections, getStudioPosts, postDraft } from "@/lib/server/studio";
import type { SectionKey } from "@/lib/studio/defaults";
import { pages } from "@/lib/studio/fields";
import { altIssue, seoIssues } from "@/lib/studio/seo";

export const instant = false;

const tools = () => {
  const url = encodeURIComponent(siteUrl());
  return [
    { title: "Google Search Console", text: "Indexing, keywords and clicks", href: "https://search.google.com/search-console" },
    { title: "Rich Results Test", text: "The business and FAQ details Google reads", href: `https://search.google.com/test/rich-results?url=${url}` },
    { title: "PageSpeed Insights", text: "Speed and Core Web Vitals", href: `https://pagespeed.web.dev/analysis?url=${url}` },
    { title: "Sitemap", text: "The page list Google crawls", href: "/sitemap.xml" },
  ];
};

export default async function Overview() {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const [sections, all, posts, newBookings, bookings] = await Promise.all([
    getSections(),
    getMedia(),
    getStudioPosts(),
    admin ? countNewBookings() : 0,
    admin ? latestBookings() : [],
  ]);
  const media = all.filter((m) => !m.decorative);

  const pageRows = pages.map((p) => {
    const states = p.sections.map((s) => sections[s.key as SectionKey]);
    const seo = p.sections.find((s) => s.seo);
    const value = seo && (sections[seo.key as SectionKey].value as { title: string; description: string });
    return {
      href: `/studio/pages/${p.id}`,
      title: p.label,
      path: p.id === "layout" ? "every page" : p.path,
      text: value?.title,
      issues: value ? seoIssues(value) : [],
      ok: value && "Title & description OK",
      notes: [`${states.filter((s) => s.edited).length} of ${states.length} sections edited`, states.some((s) => s.draft) && "Draft"],
    };
  });
  const postRows = posts.map((post) => {
    const d = postDraft(post);
    return {
      href: `/studio/blog/${post.id}`,
      title: d.title,
      path: `/blog/${d.slug}`,
      issues: seoIssues({ title: d.seoTitle || d.title, description: d.seoDescription || d.excerpt }),
      ok: "Title & description OK",
      notes: [post.published ? "On the website" : "Not on the website", post.dirty && post.published !== null && "Draft"],
    };
  });
  

  const issues = [...pageRows, ...postRows].reduce((n, r) => n + r.issues.length, 0);
  const missing = media.filter((m) => altIssue(m.draftAlt ?? m.alt)).length;
  const stats: { label: string; value: string; icon: IconName; href: string; warn?: boolean }[] = [
    ...(admin ? [{ label: "New bookings", value: String(newBookings), icon: "calendar" as const, href: "/studio/bookings?status=NEW", warn: newBookings > 0 }] : []),
    { label: "Pages and posts", value: String(pageRows.length + postRows.length), icon: "page", href: "#pages" },
    { label: "SEO issues", value: String(issues), icon: "warn", href: "#pages", warn: issues > 0 },
    { label: "Images missing good alt text", value: `${missing} / ${media.length}`, icon: "image", href: "/studio/images", warn: missing > 0 },
  ];

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-[1.4rem] bg-navy text-white">
        <Image src={tours.find((t) => t.name === "Skyline")!.src} alt="" fill preload sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" style={{ objectPosition: "54% 58%" }} />
        <span className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy-deep/60 to-navy-deep/10" />
        <div className="relative px-6 py-10 sm:px-9 sm:py-12">
          <h1 className="display text-[clamp(2.1rem,4vw,3.1rem)]">Overview</h1>
          <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-white/85">
            Welcome, {user.name}. Edit every page&apos;s text, Google title, share image and photo alt text. Save keeps changes as a draft; Confirm &amp;
            Publish puts them on the website.
          </p>
        </div>
      </div>

      <ul className={`grid gap-4 sm:grid-cols-2 ${admin ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`${CARD} flex h-full items-center gap-4 p-5 transition-colors hover:border-(--accent)`}>
              <span className={`grid size-12 shrink-0 place-items-center rounded-full ${s.warn ? "bg-[#fdefcb] text-[#7a4d00]" : "bg-[#d3e9e7] text-[#08656b]"}`}>
                <Icon name={s.icon} className="size-5" />
              </span>
              <span>
                <span className="block text-[0.875rem] leading-snug text-(--mute)">{s.label}</span>
                <span className="display mt-1 block text-[1.8rem]">{s.value}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {admin && (
        <section className={`${CARD} mt-6`}>
          <div className="flex items-center justify-between gap-4 border-b border-(--rule) px-5 py-4">
            <h2 className="font-serif text-[1.25rem]">Latest bookings</h2>
            <Link href="/studio/bookings" className="text-[0.875rem] text-(--accent) underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          {bookings.length ? (
            <ul className="divide-y divide-(--rule)">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/studio/bookings?q=${b.ref}`}
                    className="grid gap-x-6 gap-y-1 px-5 py-3.5 text-[0.9375rem] transition-colors hover:bg-ink/3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto] sm:items-center"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{b.name}</span> <span className="text-(--mute)">{b.phone}</span>
                    </span>
                    <span className="min-w-0 truncate text-(--mute)">
                      {b.service}, {b.when}, {b.guests} guests
                    </span>
                    <Badge tone={b.status === "NEW" ? "warn" : b.status === "CONFIRMED" ? "good" : "calm"}>{STATUS_LABEL[b.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-(--mute)">No bookings yet.</p>
          )}
        </section>
      )}

      <div id="pages" className="mt-6 scroll-mt-24 space-y-6">
        <Rows title="Pages" rows={pageRows} />
        
        {postRows.length > 0 && <Rows title="Blog posts" rows={postRows} />}
      </div>

      <h2 className="mb-4 mt-10 font-serif text-[1.25rem]">Google tools</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tools().map((t) => (
          <li key={t.title}>
            <a href={t.href} target="_blank" rel="noopener noreferrer" className={`${CARD} block h-full p-5 transition-colors hover:border-(--accent)`}>
              <span className="flex items-start justify-between gap-3 font-medium">
                {t.title} <Icon name="link" className="size-4 text-(--mute)" />
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-relaxed text-(--mute)">{t.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

import type { MetadataRoute } from "next";
import { getPosts, getSite, siteUrl } from "@/lib/server/site";
import { servicePages, servicesHref, servicesOf } from "@/lib/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, posts] = await Promise.all([getSite(), getPosts()]);
  const shown = (key: "home.seo" | "services.seo" | "blog.seo") => !site.content[key].noindex;
  return [
    ...(shown("home.seo") ? [{ url: siteUrl("/") }] : []),
    ...(shown("services.seo") ? Array.from({ length: servicePages(site) }, (_, i) => ({ url: siteUrl(servicesHref(i + 1)) })) : []),
    ...servicesOf(site).map((s) => ({ url: siteUrl(`/services/${s.slug}`) })),
    ...(posts.length && shown("blog.seo") ? [{ url: siteUrl("/blog"), lastModified: posts[0].publishedAt }] : []),
    ...posts.map((p) => ({ url: siteUrl(`/blog/${p.slug}`), lastModified: p.publishedAt })),
  ];
}

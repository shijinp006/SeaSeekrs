import "server-only";
import type { Metadata } from "next";
import { company } from "@/lib/content";
import { whatsapp } from "@/lib/links";
import type { Service } from "@/lib/services";
import { siteUrl, type PublicPost, type Site } from "./site";

type Seo = { title: string; description: string; image: string; noindex?: boolean };

export function pageMetadata({ title, description, image, noindex }: Seo, path: string, type: "website" | "article" = "website"): Metadata {
  const images = image ? [image] : undefined;
  return {
    title,
    description,
    robots: noindex ? { index: false } : undefined,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, siteName: company.name, locale: "en_AE", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

const BUSINESS = { "@id": siteUrl("/#business") };

export function businessLd({ content: { business: b, "home.seo": seo } }: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    ...BUSINESS,
    name: b.name,
    legalName: b.legal,
    url: siteUrl(),
    logo: siteUrl(company.logo.src),
    image: siteUrl(seo.image),
    description: seo.description,
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Dubai", addressCountry: "AE" },
    email: b.email,
    telephone: b.mobile,
    sameAs: [b.instagram, b.youtube, b.trustpilot, whatsapp(b)],
    priceRange: b.priceRange || undefined,
    openingHours: b.openingHours || undefined,
  };
}

export const websiteLd = ({ content: { business } }: Site) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": siteUrl("/#website"),
  name: business.name,
  url: siteUrl(),
  inLanguage: "en",
  publisher: BUSINESS,
});

/** Home is always the first step */
export const breadcrumbLd = (steps: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...steps].map(({ name, path }, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: siteUrl(path),
  })),
});

export const serviceLd = (service: Service, { content: { business } }: Site) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: service.title,
  description: service.summary,
  url: siteUrl(`/services/${service.slug}`),
  image: service.photos.map((p) => siteUrl(p)),
  areaServed: { "@type": "City", name: "Dubai" },
  provider: { "@type": "LocalBusiness", ...BUSINESS, name: business.name, url: siteUrl(), telephone: business.mobile },
});

export const serviceListLd = (services: Service[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.title, url: siteUrl(`/services/${s.slug}`) })),
});

export const faqLd = ({ content }: Site) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: content["home.faq"].items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

export const postLd = (post: PublicPost, { content: { business } }: Site) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.seoDescription || post.excerpt,
  image: post.cover ? siteUrl(post.cover) : undefined,
  datePublished: post.publishedAt,
  author: { "@type": "Organization", name: business.name, url: siteUrl() },
  mainEntityOfPage: siteUrl(`/blog/${post.slug}`),
  publisher: { "@type": "Organization", name: business.name, logo: siteUrl(company.logo.src) },
});

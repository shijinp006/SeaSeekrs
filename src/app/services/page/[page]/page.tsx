import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceList from "@/components/sections/ServiceList";
import { pageMetadata } from "@/lib/server/seo";
import { getSite, publishedSite } from "@/lib/server/site";
import { readServicesPage, servicePages, servicesHref } from "@/lib/services";

// Waits for the page instead of streaming it in, so an unknown address answers with a real 404
export const instant = false;

type Props = { params: Promise<{ page: string }> };

// The first page is /services; the build needs at least one address to check this route
export const generateStaticParams = async () =>
  Array.from({ length: Math.max(1, servicePages(await publishedSite()) - 1) }, (_, i) => ({ page: String(i + 2) }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSite();
  const page = readServicesPage((await params).page, servicePages(site));
  if (!page) return { title: "Not found", robots: { index: false } };
  const seo = site.content["services.seo"];
  return pageMetadata({ ...seo, title: `${seo.title}, page ${page}` }, servicesHref(page));
}

export default async function ServicesPageN({ params }: Props) {
  const page = readServicesPage((await params).page, servicePages(await getSite()));
  if (!page) notFound();
  return <ServiceList page={page} />;
}

import type { Metadata } from "next";
import ServiceList from "@/components/sections/ServiceList";
import { pageMetadata } from "@/lib/server/seo";
import { getSite } from "@/lib/server/site";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata((await getSite()).content["services.seo"], "/services");
}

export default function ServicesPage() {
  return <ServiceList page={1} />;
}

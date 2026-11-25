import Image from "next/image";
import JsonLd from "@/components/JsonLd";
import Pagination from "@/components/Pagination";
import ServiceCard from "@/components/ServiceCard";
import PageTransition from "@/components/PageTransition";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { Footer } from "@/components/sections/Charter";
import { breadcrumbLd, serviceListLd } from "@/lib/server/seo";
import { getSite } from "@/lib/server/site";
import { servicePages, servicesHref, servicesOn } from "@/lib/services";
import Title, { Tagged } from "@/components/Title";

/** One page of the services: /services, /services/page/2 … */
export default async function ServiceList({ page }: { page: number }) {
  const site = await getSite();
  const intro = site.content["services.intro"];
  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: intro.title.replace(/\s+/g, " "), path: "/services" }]), serviceListLd(servicesOn(site, page))]} />
      <SiteHeader site={site} home={false} />
      <PageTransition>
<main id="top" tabIndex={-1} className="outline-none">
        <section data-tone="deep" className="relative flex min-h-[52svh] items-end overflow-hidden pb-14 pt-40 md:pb-20">
          <Image src={intro.image} alt={site.alts[intro.image] ?? ""} fill preload fetchPriority="high" sizes="100vw" className="object-cover" />
          <span className="stage-shade" />
          <div className="container-x relative text-white">
            <Title heading={intro} as="h1" className="display t-hero" />
            <Tagged tag={intro.bodyTag} as="p" className="mt-5 max-w-xl t-lead text-white/90">
              {intro.body}
            </Tagged>
          </div>
        </section>
        <section id="list" data-after-hero data-tone="foam" className="py-16 md:py-24">
          <div className="container-x">
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {servicesOn(site, page).map((s, i) => (
                <li key={s.slug} data-aos="fade-up" data-aos-delay={(i % 3) * 130}>
                  <article className="h-full">
                    <ServiceCard service={s} site={site} />
                  </article>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={servicePages(site)} href={servicesHref} label="Pages of services" />
          </div>
        </section>
      </main>
</PageTransition>
      <Footer site={site} home={false} />
      <SmoothScroll key={page} />
    </>
  );
}

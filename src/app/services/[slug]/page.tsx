import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookNow from "@/components/BookNow";
import Gallery from "@/components/Gallery";
import { fleetPhotos } from "@/lib/fleet";
import { Check } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import PageTransition from "@/components/PageTransition";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { Footer } from "@/components/sections/Charter";
import { book, whatsapp } from "@/lib/links";
import { LINK } from "@/lib/motion";
import { breadcrumbLd, pageMetadata, serviceLd } from "@/lib/server/seo";
import { getSite, publishedSite } from "@/lib/server/site";
import { getService, servicesOf, yachtsFor } from "@/lib/services";

// Waits for the service instead of streaming it in, so an unknown address answers with a real 404
export const instant = false;

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () => servicesOf(await publishedSite()).map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSite();
  const service = getService(site, (await params).slug);
  if (!service) return { title: "Not found", robots: { index: false } };
  return pageMetadata(
    {
      title: service.seoTitle || `${service.title} in Dubai | Sea Seakers Yachts`,
      description: service.seoDescription || `${service.summary} Book it in Dubai with Sea Seakers on WhatsApp.`,
      image: service.photos[0],
    },
    `/services/${service.slug}`,
  );
}

function Checks({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={className}>
      {items.map((p) => (
        <li key={p} className="flex gap-3 leading-snug">
          <Check className="mt-0.5 size-4 shrink-0 text-(--accent)" />
          {p}
        </li>
      ))}
    </ul>
  );
}

export default async function ServicePage({ params }: Props) {
  const site = await getSite();
  const service = getService(site, (await params).slug);
  if (!service) notFound();
  const { business } = site.content;
  // the yachts and the trips on board them open on the picture they had on the home page, and show only that boat
  const photos = fleetPhotos(service.slug, service.photos);
  const alts = Object.fromEntries(photos.map((p) => [p, site.alts[p] ?? ""]));
  return (
    <>
      <JsonLd
        data={[
          serviceLd(service, site),
          breadcrumbLd([
            { name: site.content["services.intro"].title.replace(/\s+/g, " "), path: "/services" },
            { name: service.title, path: `/services/${service.slug}` },
          ]),
        ]}
      />
      <SiteHeader site={site} home={false} />
      <PageTransition>
<main id="top" tabIndex={-1} className="outline-none">
        <div data-after-hero>
          {/* the page opens on the service itself: room for the menu above */}
          <section data-tone="foam" className="pb-14 pt-28 md:pb-20 md:pt-36">
            <div className="container-x grid gap-x-12 gap-y-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Gallery aos="fade-up" morph={`service-${service.slug}`} first name={service.title} photos={photos} alts={alts} />
              </div>
              <div className="lg:col-span-5">
                <h1 className="display t-section">{service.title}</h1>
                <h2 data-aos="fade-up" className="mt-6 font-serif text-[1.35rem]">About this service</h2>
                <div data-aos="fade-up" className="mt-3 space-y-4 t-lead text-(--mute)">
                  {service.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <Checks items={service.points} className="mt-7 space-y-3 border-t border-(--rule) pt-7" />
                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <BookNow
                    service={{ slug: service.slug, title: service.title }}
                    yachts={yachtsFor(service, site).map((y) => y.title)}
                    chat={book(business, service.title)}
                  />
                  <a href={whatsapp(business)} {...out} className={LINK}>
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
</PageTransition>
      <Footer site={site} home={false} />
      <SmoothScroll key={service.slug} />
    </>
  );
}

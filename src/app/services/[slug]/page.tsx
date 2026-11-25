import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import Gallery from "@/components/Gallery";
import { Check } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import ServiceCard from "@/components/ServiceCard";
import SiteHeader from "@/components/SiteHeader";
import { Footer } from "@/components/sections/Charter";
import { book, whatsapp } from "@/lib/links";
import { BTN_GOLD, LINK } from "@/lib/motion";
import { breadcrumbLd, pageMetadata, serviceLd } from "@/lib/server/seo";
import { getSite, publishedSite } from "@/lib/server/site";
import { getService, moreServices, pageOf, servicesHref, servicesOf, yachtsFor } from "@/lib/services";

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
  const alts = Object.fromEntries(service.photos.map((p) => [p, site.alts[p] ?? ""]));
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
      <main id="top" tabIndex={-1} className="outline-none">
        <section data-tone="deep" className="pb-14 pt-36 md:pb-20 md:pt-48">
          <div className="container-x">
            <div className="text-(--mute)">
              <Breadcrumb
                steps={[{ name: "Home", href: "/" }, { name: "Services", href: servicesHref(pageOf(site, service)) }, { name: service.title }]}
              />
            </div>
            <h1 className="display t-hero mt-6">{service.title}</h1>
            <p className="mt-5 max-w-xl t-lead text-(--mute)">{service.summary}</p>
          </div>
        </section>

        <div data-after-hero>
          <section data-tone="foam" className="py-14 md:py-20">
            <div className="container-x grid gap-x-12 gap-y-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Gallery aos="fade-up" first name={service.title} photos={service.photos} alts={alts} />
              </div>
              <div className="lg:col-span-5">
                <h2 className="display t-title">About this service</h2>
                <div className="mt-5 space-y-4 t-lead text-(--mute)">
                  {service.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <Checks items={service.points} className="mt-7 space-y-3 border-t border-(--rule) pt-7" />
                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <a href={book(business, service.title)} {...out} className={BTN_GOLD}>
                    Book now
                  </a>
                  <a href={whatsapp(business)} {...out} className={LINK}>
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section data-tone="shallow" className="py-14 md:py-20">
            <div className="container-x">
              <h2 className="display t-section">{service.yacht ? "On board" : "Our fleet"}</h2>
              {yachtsFor(service, site).map((y) => (
                <article key={y.title} className="mt-10 grid gap-x-12 gap-y-8 border-t border-(--rule) pt-8 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <h3 className="display t-card">{y.title}</h3>
                    <p className="mt-4">
                      <span className="display block text-[1.9rem]">{y.daily}</span>
                      <span className="text-(--mute)">a day, or {y.hourly}</span>
                    </p>
                    <dl className="mt-6 grid grid-cols-2 gap-x-6 border-t border-(--rule)">
                      {y.specs.map(({ label, value }) => (
                        <div key={label} className="border-b border-(--rule) py-3">
                          <dt className="text-[0.8125rem] text-(--mute)">{label}</dt>
                          <dd className="mt-0.5">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="lg:col-span-7">
                    <h4 className="font-serif text-xl">Features</h4>
                    <Checks items={y.features} className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2" />
                    {y.addons.length > 0 && (
                      <>
                        <h4 className="mt-8 font-serif text-xl">Addons</h4>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {y.addons.map((a) => (
                            <li key={a} className="rounded-full border border-(--rule) px-3.5 py-1.5 text-[0.85rem]">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section data-tone="foam" className="py-14 md:py-20">
            <div className="container-x">
              <h2 className="display t-section">More services</h2>
              <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {moreServices(site, service, 3).map((s) => (
                  <li key={s.slug}>
                    <ServiceCard service={s} site={site} heading="h3" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
      <Footer site={site} home={false} />
    </>
  );
}

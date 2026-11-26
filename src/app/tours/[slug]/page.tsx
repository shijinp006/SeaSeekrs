import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import BookNow from "@/components/BookNow";
import { CardArrow, Check } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import PageTransition from "@/components/PageTransition";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { Footer } from "@/components/sections/Charter";
import { book, whatsapp } from "@/lib/links";
import { LINK } from "@/lib/motion";
import { breadcrumbLd, pageMetadata } from "@/lib/server/seo";
import { getSite, publishedSite } from "@/lib/server/site";
import { getService, yachtsFor } from "@/lib/services";
import { getTour, tourSlug, toursOf } from "@/lib/tours";

// Waits for the tour instead of streaming it in, so an unknown address answers with a real 404
export const instant = false;

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () => toursOf(await publishedSite()).map(({ name }) => ({ slug: tourSlug(name) }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSite();
  const tour = getTour(site, (await params).slug);
  if (!tour) return { title: "Not found", robots: { index: false } };
  return pageMetadata(
    {
      title: `${tour.name} yacht tour in Dubai | Sea Seakers`,
      description: `See ${tour.name} from the water on a private yacht tour with Sea Seakers. ${site.content["home.tours"].body}`,
      image: tour.image,
    },
    `/tours/${tourSlug(tour.name)}`,
  );
}

/** One tour: its landmark large (carried across from the card that led here), what the tour is, and the way to book it */
export default async function TourPage({ params }: Props) {
  const site = await getSite();
  const slug = (await params).slug;
  const tour = getTour(site, slug);
  if (!tour) notFound();
  const { business } = site.content;
  const tours = site.content["home.tours"];
  // what a tour is and what comes with it: the Tour service, where there is one
  const service = getService(site, "tour");
  const others = toursOf(site).filter((t) => t !== tour);
  const title = `${tour.name} tour`;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Tours", path: "/#tours" },
            { name: tour.name, path: `/tours/${slug}` },
          ]),
        ]}
      />
      <SiteHeader site={site} home={false} />
      <PageTransition>
        <main id="top" tabIndex={-1} className="outline-none">
          <div data-after-hero>
            <section data-tone="foam" className="pb-14 pt-28 md:pb-20 md:pt-36">
              <div className="container-x grid gap-x-12 gap-y-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <ViewTransition name={`tour-${slug}`} share="morph" default="none">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-port bg-navy-deep/10 lg:aspect-[3/2]">
                      <Image
                        src={tour.image}
                        alt={site.alts[tour.image] || `${tour.name}, Dubai`}
                        fill
                        priority
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="object-cover"
                        style={{ objectPosition: tour.focus || undefined }}
                      />
                    </div>
                  </ViewTransition>
                </div>
                <div className="lg:col-span-5">
                  <p data-aos="fade-up" className="kicker text-(--accent)">
                    Dubai, from the water
                  </p>
                  <h1 className="display t-section mt-3">{tour.name}</h1>
                  <div data-aos="fade-up" className="mt-5 space-y-4 t-lead text-(--mute)">
                    <p>{tours.body}</p>
                    {service?.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {service && service.points.length > 0 && (
                    <ul data-aos="fade-up" className="mt-7 space-y-3 border-t border-(--rule) pt-7">
                      {service.points.map((p) => (
                        <li key={p} className="flex gap-3 leading-snug">
                          <Check className="mt-0.5 size-4 shrink-0 text-(--accent)" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                    {service ? (
                      <BookNow service={{ slug: service.slug, title }} yachts={yachtsFor(service, site).map((y) => y.title)} chat={book(business, title)} />
                    ) : (
                      <a href={book(business, title)} {...out} className={LINK}>
                        Book on WhatsApp
                      </a>
                    )}
                    <a href={whatsapp(business)} {...out} className={LINK}>
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* the other landmarks */}
            {others.length > 0 && (
              <section data-tone="deep" className="py-14 md:py-20">
                <div className="container-x">
                  <h2 data-aos="fade-up" className="display t-title">
                    More tours
                  </h2>
                  <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-5">
                    {others.map((t, i) => (
                      <li key={t.name} data-aos="fade-up" data-aos-delay={(i % 5) * 90}>
                        <Link
                          href={`/tours/${tourSlug(t.name)}`}
                          className="group card-focus relative block aspect-[4/5] overflow-hidden rounded-port text-white"
                        >
                          <ViewTransition name={`tour-${tourSlug(t.name)}`} share="morph" default="none">
                            <div className="absolute inset-0">
                              <Image
                                src={t.image}
                                alt={site.alts[t.image] || `${t.name}, Dubai`}
                                fill
                                sizes="(min-width: 1024px) 20vw, 50vw"
                                className="card-img object-cover"
                                style={{ objectPosition: t.focus || undefined }}
                              />
                            </div>
                          </ViewTransition>
                          <span className="card-shade absolute inset-0" />
                          <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                            <span className="display t-card">{t.name}</span>
                            <span className="max-sm:hidden">
                              <CardArrow />
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </main>
      </PageTransition>
      <Footer site={site} home={false} />
      <SmoothScroll key={slug} />
    </>
  );
}

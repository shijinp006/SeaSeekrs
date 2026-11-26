import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import Frame from "@/components/Frame";
import { CardArrow } from "@/components/Icons";
import Title, { headingStyle, Tagged } from "@/components/Title";
import { book, whatsapp } from "@/lib/links";
import { tourSlug } from "@/lib/tours";
import { BTN_GOLD, LINK } from "@/lib/motion";
import type { Site } from "@/lib/server/site";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Welcome({ site }: { site: Site }) {
  const welcome = site.content["home.welcome"];
  const H = (welcome.tag || "h2") as "h2";
  return (
    <section id="welcome" data-tone="foam" data-stage="open" data-shape="portal" className="stage">
      <div className="stage-view">
        <div className="stage-pic">
          <Image src={welcome.image} alt={site.alts[welcome.image] ?? ""} fill sizes="max(100vw, 150vh)" className="object-cover" />
          <span className="stage-shade" />
        </div>
        <div className="stage-words container-x flex flex-col justify-end text-white">
          <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
            <H data-step="fade-up" className="display t-hero lg:col-span-7" style={headingStyle(welcome.size)}>
              {welcome.line1}
              <br /> {welcome.line2}
            </H>
            <div className="lg:col-span-5">
              <Tagged tag={welcome.bodyTag} as="p" data-step="fade-left" className="max-w-md t-lead text-white/90 [text-wrap:pretty]">
                {welcome.body}
              </Tagged>
              <div data-step="fade-left" className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#yachts" className={BTN_GOLD}>
                  {welcome.cta}
                </a>
                <a href={whatsapp(site.content.business)} {...out} className={LINK}>
                  {welcome.ask}
                </a>
              </div>
            </div>
          </div>
          <dl className="mt-[clamp(1.5rem,3vw,3rem)] grid gap-x-12 sm:grid-cols-3">
            {welcome.included.map(({ label, value }) => (
              <div key={label} data-step="fade-up" className="border-t border-white/30 py-2.5 max-sm:flex max-sm:items-baseline max-sm:gap-4 sm:py-4">
                <dt className="text-[0.8125rem] text-white/75 max-sm:w-16 max-sm:shrink-0">{label}</dt>
                <dd className="mt-0.5 font-serif text-[1rem] leading-snug sm:text-[1.125rem]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function About({ site }: { site: Site }) {
  const about = site.content["home.about"];
  const [lead, ...more] = about.body;
  return (
    <section id="about" data-tone="foam" className="py-[clamp(2rem,3.5vw,3.5rem)]">
      <div>
        <div className="container-x grid items-center gap-x-12 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Title heading={about} as="h2" data-lines className="display t-section" />
            <Tagged tag={about.bodyTag} as="p" data-aos="fade-up" className="mt-6 max-w-[38em] t-lead [text-wrap:pretty]">
              {lead}
            </Tagged>
            <div className="mt-6 grid max-w-[46rem] gap-8 leading-relaxed text-(--mute) sm:grid-cols-2">
              {more.map((p, i) => (
                <Tagged tag={about.bodyTag} as="p" key={i} data-aos="fade-up">
                  {p}
                </Tagged>
              ))}
            </div>
          </div>
          {/* two photos from on board, one lapping over the other; on phones they come first */}
          <div className="relative max-lg:order-first max-lg:pb-[18%] lg:col-span-5 lg:h-[min(72vh,42rem)]">
            <div
              data-aos="fade-up"
              data-aos-img
              className="relative ml-auto rounded-port aspect-[4/5] w-[84%] overflow-hidden lg:aspect-auto lg:h-full lg:w-[min(86%,56vh)]"
            >
              <Image
                src={about.portrait}
                alt={site.alts[about.portrait] ?? ""}
                fill
                sizes="(min-width: 1024px) 50vw, 84vw"
                className="object-cover"
              />
            </div>
            <div data-aos="fade-up" className="absolute bottom-0 left-0 w-[58%] rounded-[calc(var(--radius-port)+0.5rem)] bg-(--bg) p-2 md:p-3">
              <div className="relative aspect-[3/2] overflow-hidden rounded-port">
                <Image src={about.inset} alt={site.alts[about.inset] ?? ""} fill sizes="(min-width: 1024px) 24vw, 56vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The tours: Dubai through its letters first, then the landmarks seen from the water, a card each (WhatsApp to book) */
export function Tours({ site }: { site: Site }) {
  const tours = site.content["home.tours"];
  const [opener] = tours.items;
  return (
    <>
      {/* the city seen through the letters of DUBAI, which open until it fills the screen (lib/stages: word) */}
      <section id="tours" data-tone="deep" data-stage="open" data-shape="word" data-word="DUBAI" className="stage">
        <div className="stage-view">
          <div className="stage-pic">
            <Image
              src={opener.image}
              alt={site.alts[opener.image] || `${opener.name}, Dubai`}
              fill
              sizes="max(100vw, 150vh)"
              style={{ objectPosition: opener.focus || undefined }}
              className="object-cover"
            />
            <span className="stage-shade" />
          </div>
          <div className="stage-words container-x flex flex-col justify-end text-white">
            <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
              <Title heading={tours} as="h2" data-step="fade-up" className="display t-hero lg:col-span-7" />
              <div className="lg:col-span-5">
                <Tagged tag={tours.bodyTag} as="p" data-step="fade-left" className="max-w-md t-lead text-white/90">
                  {tours.body}
                </Tagged>
                <a
                  data-step="fade-up"
                  href={book(site.content.business, `${opener.name} tour`)}
                  {...out}
                  className="group mt-6 inline-flex items-center gap-5"
                >
                  <span>
                    <span className="display block t-card">{opener.name}</span>
                    <span className="mt-1 block text-[0.8125rem] text-white/85">Book this tour</span>
                  </span>
                  <CardArrow />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* the landmarks on the same dark ground, right after the letters: one section with them */}
      <section aria-label={tours.title} data-tone="deep" className="-mt-px pb-[clamp(2.5rem,5vw,5rem)] pt-[clamp(1rem,2.5vw,2rem)]">
        <div className="container-x">
          <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {tours.items.map((t, i) => (
              <li key={t.name}>
                <Link href={`/tours/${tourSlug(t.name)}`} className="group card-focus block">
                  <ViewTransition name={`tour-${tourSlug(t.name)}`} share="morph" default="none">
                    <Frame
                      src={t.image}
                      alt={site.alts[t.image] || `${t.name}, Dubai`}
                      focus={t.focus || undefined}
                      aos="fade-up"
                      delay={(i % 3) * 120}
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="aspect-[4/5] text-white sm:aspect-[4/3]"
                    >
                      <span className="card-shade absolute inset-0" />
                      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 md:inset-x-6 md:bottom-6">
                        <div>
                          <Tagged tag={tours.itemTag} as="h3" className="display t-card">
                            {t.name}
                          </Tagged>
                          <p className="mt-1 text-[0.8125rem] text-white/85">View the tour</p>
                        </div>
                        <span className="max-sm:hidden">
                          <CardArrow />
                        </span>
                      </div>
                    </Frame>
                  </ViewTransition>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

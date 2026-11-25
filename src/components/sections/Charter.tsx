import Image from "next/image";
import Frame from "@/components/Frame";
import Rail from "@/components/Rail";
import Title, { Tagged } from "@/components/Title";
import { company } from "@/lib/content";
import { contact as contactOf, whatsapp } from "@/lib/links";
import { BTN_GOLD, LINK } from "@/lib/motion";
import type { Site } from "@/lib/server/site";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Reviews({ site }: { site: Site }) {
  const reviews = site.content["home.reviews"];
  const { business } = site.content;
  return (
    <section id="reviews" data-tone="foam" className="overflow-x-clip py-[clamp(4rem,7.5vw,7.5rem)]">
      <Rail
        label={reviews.title}
        head={
          <Title heading={reviews} as="h2" data-lines className="display t-section" />
        }
      >
        {reviews.items.map((r, i) => (
          <li key={i} className="w-[84vw] max-w-[34rem] shrink-0 snap-start md:w-[54vw] lg:w-[38vw]">
            <figure>
              <Frame
                src={r.image}
                alt={site.alts[r.image] ?? ""}
                delay={Math.min(i, 2) * 130}
                sizes="(min-width: 1024px) 38vw, (min-width: 768px) 54vw, 84vw"
                className="aspect-[3/2]"
              />
              <blockquote data-aos="fade-up" data-aos-delay="150" className="mt-6 pr-4 font-serif text-[clamp(1.0625rem,1.25vw,1.2rem)] leading-[1.5] [text-wrap:pretty]">
                “{r.quote}”
              </blockquote>
              <figcaption data-aos="fade-up" data-aos-delay="220" className="mt-4 text-(--mute)">
                <cite className="not-italic">{r.who}</cite>
              </figcaption>
            </figure>
          </li>
        ))}
      </Rail>

      <div className="container-x">
        <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {reviews.short.map((r, i) => (
            <li key={i} data-aos="fade-up" data-aos-delay={(i % 3) * 100}>
              <figure>
                <blockquote className="leading-relaxed">{r.quote}</blockquote>
                <figcaption className="mt-2 text-[0.8125rem] text-(--mute)">
                  <cite className="not-italic">{r.who}</cite>, {r.date}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <p data-aos="fade-up" className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
          <a href={business.trustpilot} {...out} className={LINK}>
            Review on Trustpilot
          </a>
          <a href={business.google} {...out} className={LINK}>
            Review on Google
          </a>
        </p>
      </div>
    </section>
  );
}

export function Faq({ site }: { site: Site }) {
  const faq = site.content["home.faq"];
  return (
    <section id="faq" data-tone="shallow" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Title heading={faq} as="h2" data-lines className="display t-section" />
          <Tagged tag={faq.bodyTag} as="p" data-aos="fade-up" className="mt-6 max-w-sm t-lead text-(--mute)">
            {faq.body}
          </Tagged>
          <p data-aos="fade-up" className="mt-7">
            <a href={whatsapp(site.content.business)} {...out} className={LINK}>
              Ask us on WhatsApp
            </a>
          </p>
        </div>
        <div className="border-b border-(--rule) lg:col-span-7">
          {faq.items.map((f, i) => (
            <details key={i} name="faq" data-aos="fade-left" className="faq group border-t border-(--rule)">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1rem] leading-snug outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--accent) [&::-webkit-details-marker]:hidden">
                <Tagged tag={faq.itemTag} as="div">
                  {f.q}
                </Tagged>
                <span aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-(--rule) text-lg leading-none transition-[rotate,background-color,color] duration-500 group-open:rotate-45 group-open:bg-gold group-open:text-ink"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-8 leading-relaxed text-(--mute)">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}



/** The last look at the sea, full width */
export function Bow({ site }: { site: Site }) {
  const bow = site.content["home.bow"];
  return (
    <section id="closing" data-over data-tone="deep" data-stage="open" data-shape="slices" className="stage">
      <div className="stage-view">
        <div className="stage-pic">
          {/* taller than the section, so the yacht lies below the words */}
          <div className="absolute inset-x-0 -bottom-[10%] -top-[4%] md:-bottom-[38%]">
            <Image src={bow.image} alt={site.alts[bow.image] ?? ""} fill sizes="max(100vw, 150vh)" className="object-cover" />
          </div>
          <span className="stage-shade stage-shade-bow" />
        </div>
        <div className="stage-words container-x flex flex-col justify-between gap-10 text-white">
          <Title heading={bow} as="h2" data-step="fade-down" className="display max-w-[16em] t-section" />
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <Tagged tag={bow.bodyTag} as="p" data-step="fade-up" className="max-w-lg t-lead text-white/90">
              {bow.body}
            </Tagged>
            <div data-step="fade-up" className="shrink-0">
              <a href={whatsapp(site.content.business)} {...out} className={BTN_GOLD}>
                {bow.cta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** `home`: on the home page, where #links stay on the page */
export function Footer({ site, home = true }: { site: Site; home?: boolean }) {
  const { business, "layout.footer": footer } = site.content;
  const contact = contactOf(business);
  const explore = [...footer.explore, ...(site.hasBlog ? [{ label: "Blog", href: "/blog" }] : [])];
  const follow = [
    { label: "WhatsApp", href: whatsapp(business) },
    { label: "Instagram", href: business.instagram },
    { label: "YouTube", href: business.youtube },
  ];
  const link = `${LINK} bg-[length:0%_1px]! hover:bg-[length:100%_1px]!`;
  return (
    <footer id="contact" className={`relative z-10 bg-navy-deep pb-8 pt-16 text-white md:pt-24 ${home ? "text-[0.9375rem]" : ""}`}>
      <div className="container-x">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-12">
          <div data-aos="fade-up" className="sm:col-span-2 lg:col-span-5">
            <Image src={company.logo.src} width={125} height={112} alt={site.alts[company.logo.src] || business.name} className="h-28 w-auto" />
            <p className="mt-6 max-w-sm leading-relaxed text-white/65">
              {footer.body}
            </p>
          </div>
          <address data-aos="fade-up" data-aos-delay="120" className="not-italic lg:col-span-4">
            <h2 className="text-white/60">Get in touch</h2>
            <ul className="mt-5 space-y-2 font-serif text-[1.15rem]">
              {contact.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-60 leading-relaxed text-white/65">{business.address}</p>
          </address>
          <div data-aos="fade-up" data-aos-delay="240" className="grid grid-cols-2 gap-8 lg:col-span-3">
            {[
              { title: "Explore", links: explore, ext: {} },
              { title: "Follow", links: follow, ext: out },
            ].map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <h2 className="text-white/60">{g.title}</h2>
                <ul className="mt-5 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <a href={!home && l.href.startsWith("#") ? `/${l.href}` : l.href} {...g.ext} className={link}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p aria-hidden className="display mt-16 whitespace-nowrap text-[min(16vw,11rem)] leading-[1.05]! text-white/95">
          Sea <em>Seakers</em>
        </p>
        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-[0.8125rem] text-white/60 lg:flex-row">
          <p>Copyright © 2026 {business.legal}</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            {footer.legal.map((l) => (
              <a key={l.label} href={l.href} {...out} className={link}>
                {l.label}
              </a>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}

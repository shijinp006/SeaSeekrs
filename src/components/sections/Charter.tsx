import Image from "next/image";
import Frame from "@/components/Frame";
import Rail from "@/components/Rail";
import { bow, company, faq, guests, reviews, shortReviews } from "@/lib/content";
import { BTN_GOLD, LINK } from "@/lib/motion";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Reviews() {
  return (
    <section id="reviews" data-tone="foam" className="overflow-x-clip py-[clamp(4rem,7.5vw,7.5rem)]">
      <Rail
        label="What our clients say"
        head={
          <h2 data-lines className="display t-section">
            What our clients say
          </h2>
        }
      >
        {reviews.map((r, i) => (
          <li key={r.who} className="w-[84vw] max-w-[34rem] shrink-0 snap-start md:w-[54vw] lg:w-[38vw]">
            <figure>
              <Frame
                src={guests[i].src}
                alt={guests[i].alt}
                delay={Math.min(i, 2) * 130}
                sizes="(min-width: 1024px) 38vw, (min-width: 768px) 54vw, 84vw"
                className="aspect-[3/2]"
              />
              <blockquote data-aos="fade-up" data-aos-delay="150" className="mt-6 pr-4 font-serif text-[clamp(1.0625rem,1.25vw,1.2rem)] leading-[1.5] [text-wrap:pretty]">
                “{r.quote}”
              </blockquote>
              <figcaption data-aos="fade-up" data-aos-delay="220" className="mt-4 text-(--mute)">{r.who}</figcaption>
            </figure>
          </li>
        ))}
      </Rail>

      <div className="container-x">
        <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {shortReviews.map((r, i) => (
            <li key={r.who} data-aos="fade-up" data-aos-delay={(i % 3) * 100}>
              <p className="leading-relaxed">{r.quote}</p>
              <p className="mt-2 text-[0.8125rem] text-(--mute)">
                {r.who}, {r.date}
              </p>
            </li>
          ))}
        </ul>
        <p data-aos="fade-up" className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
          <a href={company.trustpilot} {...out} className={LINK}>
            Review on Trustpilot
          </a>
          <a href={company.google} {...out} className={LINK}>
            Review on Google
          </a>
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" data-tone="shallow" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 data-lines className="display t-section">
            {faq.title.join(" ")}
          </h2>
          <p data-aos="fade-up" className="mt-6 max-w-sm t-lead text-(--mute)">
            {faq.body}
          </p>
          <p data-aos="fade-up" className="mt-7">
            <a href={company.whatsapp} {...out} className={LINK}>
              Ask us on WhatsApp
            </a>
          </p>
        </div>
        <div className="border-b border-(--rule) lg:col-span-7">
          {faq.items.map((f) => (
            <details key={f.q} name="faq" data-aos="fade-up" className="faq group border-t border-(--rule)">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1rem] leading-snug outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--accent) [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
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

const explore = [
  { label: "About Us", href: "#about" },
  { label: "Tours", href: "#tours" },
  { label: "Yacht & Boat Rental", href: "#yachts" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];

/** The last look at the sea, full width */
export function Bow() {
  return (
    <section data-over className="relative overflow-hidden bg-navy text-white">
      {/* taller than the section, so the yacht lies below the words */}
      <div data-drift className="absolute inset-x-0 -bottom-[10%] -top-[4%] md:-bottom-[38%]">
        <Image src={bow.src} alt={bow.alt} fill sizes="max(100vw, 150vh)" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(4_22_30/0.6),rgb(4_22_30/0.05)_45%,rgb(4_22_30/0.1)_60%,rgb(4_22_30/0.85))] max-md:bg-[linear-gradient(to_bottom,rgb(4_22_30/0.65),rgb(4_22_30/0.1)_42%,rgb(4_22_30/0.72)_64%,rgb(4_22_30/0.95))]" />
      <div className="container-x relative flex min-h-[max(92svh,38rem)] flex-col justify-between gap-10 pb-[clamp(3rem,5vw,5rem)] pt-[clamp(6rem,9vw,9rem)]">
        <h2 data-lines className="display max-w-[16em] t-section">
          {bow.lines.join(" ")}
        </h2>
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <p data-aos="fade-up" className="max-w-lg t-lead text-white/90">
            {bow.body}
          </p>
          <div data-aos="fade-up" data-aos-delay="100" className="shrink-0">
            <a href={company.whatsapp} {...out} className={BTN_GOLD}>
              {bow.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const contact = [
    { label: company.mobile.label, href: company.mobile.href },
    { label: company.phone.label, href: company.phone.href },
    { label: company.email, href: `mailto:${company.email}` },
  ];
  const follow = [
    { label: "WhatsApp", href: company.whatsapp },
    { label: "Instagram", href: company.instagram },
    { label: "YouTube", href: company.youtube },
  ];
  const link = `${LINK} bg-[length:0%_1px]! hover:bg-[length:100%_1px]!`;
  return (
    <footer id="contact" className="bg-navy-deep pb-8 pt-16 text-white md:pt-24">
      <div className="container-x">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-12">
          <div data-aos="fade-up" className="sm:col-span-2 lg:col-span-5">
            <Image {...company.logo} alt={`${company.name} Leisure Yachts & Boats Rental`} className="h-28 w-auto" />
            <p className="mt-6 max-w-sm leading-relaxed text-white/65">
              Sea Seakers Yacht and Boat Rental, located in the heart of Dubai, is your gateway to luxury yacht charters
              in Dubai. We are one of the leading charter companies in Dubai to own its own fleet of yachts.
            </p>
          </div>
          <div data-aos="fade-up" data-aos-delay="120" className="lg:col-span-4">
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
            <p className="mt-5 max-w-60 leading-relaxed text-white/65">{company.address}</p>
          </div>
          <div data-aos="fade-up" data-aos-delay="240" className="grid grid-cols-2 gap-8 lg:col-span-3">
            {[
              { title: "Explore", links: explore, ext: {} },
              { title: "Follow", links: follow, ext: out },
            ].map((g) => (
              <div key={g.title}>
                <h2 className="text-white/60">{g.title}</h2>
                <ul className="mt-5 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} {...g.ext} className={link}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p aria-hidden className="display mt-16 whitespace-nowrap text-[min(16vw,11rem)] leading-[1.05]! text-white/95">
          Sea <em>Seakers</em>
        </p>
        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-[0.8125rem] text-white/60 lg:flex-row">
          <p>Copyright © 2026 {company.legal}</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            {company.legalLinks.map((l) => (
              <a key={l.href} href={l.href} {...out} className={link}>
                {l.label}
              </a>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}

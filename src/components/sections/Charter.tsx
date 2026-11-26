import Image from "next/image";
import Title, { Tagged } from "@/components/Title";
import { company } from "@/lib/content";
import { contact as contactOf, whatsapp } from "@/lib/links";
import { BTN_GOLD, LINK } from "@/lib/motion";
import type { Site } from "@/lib/server/site";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

type Said = { who: string; quote: string; image?: string; date?: string };

// For the reviews without a photo of their own: our boats and Dubai from the water (no people, so nobody seems to be
// someone they are not), taken in turn
const SCENES = ["y48-main", "tour-burj", "y31-main", "tour-ain", "y48-5", "tour-atlantis", "y31-2", "tour-harbour", "y48-1", "tour-lagoon"].map(
  (n) => `/site/${n}.webp`,
);

/** One small card: a picture on top (the guest's own, or a scene), the words below */
function ReviewCard({ r, alt, scene }: { r: Said; alt: string; scene: string }) {
  return (
    <figure className="flex h-[21rem] w-[min(72vw,19rem)] flex-col overflow-hidden rounded-port bg-white shadow-[0_1px_0_rgb(23_32_42/0.06),0_10px_30px_-18px_rgb(23_32_42/0.25)]">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[#ece3d3]">
        <Image src={r.image || scene} alt={r.image ? alt : ""} fill sizes="20rem" className="object-cover" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <blockquote className="line-clamp-4 text-[0.9375rem] leading-normal">“{r.quote}”</blockquote>
        <figcaption className="mt-3 text-[0.8125rem] text-(--mute)">
          <cite className="font-medium not-italic text-(--fg)">{r.who}</cite>
          {r.date && <span className="block">{r.date}</span>}
        </figcaption>
      </div>
    </figure>
  );
}

/** What guests said: small cards that keep moving across the screen (they stop only when a keyboard is in them) */
export function Reviews({ site }: { site: Site }) {
  const reviews = site.content["home.reviews"];
  const { business } = site.content;
  const said: Said[] = [...reviews.items, ...reviews.short];
  return (
    <section id="reviews" data-tone="foam" className="overflow-x-clip py-[clamp(2rem,3.5vw,3.5rem)]">
      <div className="container-x flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <Title heading={reviews} as="h2" data-lines className="display t-section" />
        <p data-aos="fade-up" className="flex flex-wrap gap-x-8 gap-y-3">
          <a href={business.trustpilot} {...out} className={LINK}>
            Review on Trustpilot
          </a>
          <a href={business.google} {...out} className={LINK}>
            Review on Google
          </a>
        </p>
      </div>
      <div data-aos="fade-up" className="mt-[clamp(1.75rem,3vw,2.75rem)]">
        <div className="marquee">
          {/* twice over, so the row runs on without a seam; the copy is for the eye only */}
          <ul className="marquee-track" aria-label={reviews.title}>
            {said.map((r, i) => (
              <li key={i}>
                <ReviewCard r={r} alt={r.image ? (site.alts[r.image] ?? "") : ""} scene={SCENES[i % SCENES.length]} />
              </li>
            ))}
          </ul>
          <ul className="marquee-track" aria-hidden>
            {said.map((r, i) => (
              <li key={i}>
                <ReviewCard r={r} alt="" scene={SCENES[i % SCENES.length]} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The questions, beside a picture of the yacht with an invitation to ask on WhatsApp */
export function Faq({ site }: { site: Site }) {
  const faq = site.content["home.faq"];
  const picture = "/site/cta-yacht.webp";
  return (
    <section id="faq" data-tone="foam" className="py-[clamp(2rem,3.5vw,3.5rem)]">
      <div className="container-x grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <div
          data-aos="fade-up"
          data-aos-img
          className="relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-port p-6 text-white sm:p-8 lg:sticky lg:top-24 lg:col-span-5 lg:min-h-[min(76svh,40rem)]"
        >
          <Image src={picture} alt={site.alts[picture] ?? ""} fill sizes="(min-width: 1024px) 40vw, 100vw" className="-z-10 object-cover" />
          <span className="absolute inset-0 -z-10 bg-linear-to-t from-navy-deep/95 via-navy-deep/55 to-navy-deep/5" />
          <Title heading={faq} as="h2" className="display t-section" />
          <Tagged tag={faq.bodyTag} as="p" className="mt-4 max-w-sm text-white/85">
            {faq.body}
          </Tagged>
          <p className="mt-6">
            <a href={whatsapp(site.content.business)} {...out} className={BTN_GOLD}>
              Ask us on WhatsApp
            </a>
          </p>
        </div>
        <div className="space-y-3 lg:col-span-7">
          {faq.items.map((f, i) => (
            <details
              key={i}
              name="faq"
              data-aos="fade-up"
              className="faq group rounded-port border border-(--rule) bg-white/55 transition-colors open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-[1rem] leading-snug outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--accent) sm:px-6 [&::-webkit-details-marker]:hidden">
                <span className="w-7 shrink-0 font-semibold tabular-nums text-(--accent)">{String(i + 1).padStart(2, "0")}</span>
                <Tagged tag={faq.itemTag} as="div" className="flex-1 font-medium">
                  {f.q}
                </Tagged>
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-xl border border-(--rule) text-lg leading-none transition-[rotate,background-color,color] duration-500 group-open:rotate-45 group-open:bg-gold group-open:text-ink"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl px-5 pb-5 pl-[4.25rem] leading-relaxed text-(--mute) sm:px-6 sm:pl-[4.75rem]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <footer id="contact" className={`relative z-10 bg-navy-deep pb-6 pt-12 text-white md:pt-16 ${home ? "text-[0.9375rem]" : ""}`}>
      <div className="container-x">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div data-aos="fade-up" className="sm:col-span-2 lg:col-span-5">
            <Image src={company.logo.src} width={125} height={112} alt={site.alts[company.logo.src] || business.name} className="h-20 w-auto" />
            <p className="mt-4 max-w-sm leading-relaxed text-white/65">{footer.body}</p>
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
        <p aria-hidden className="display mt-10 whitespace-nowrap text-[min(13vw,6.5rem)] leading-[1.05]! text-white/95">
          Sea <em>Seakers</em>
        </p>
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/15 pt-5 text-[0.8125rem] text-white/60 lg:flex-row">
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

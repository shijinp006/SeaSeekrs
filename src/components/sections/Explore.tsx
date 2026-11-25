import Image from "next/image";
import Frame from "@/components/Frame";
import Gallery from "@/components/Gallery";
import { Check } from "@/components/Icons";
import Title, { Tagged } from "@/components/Title";
import { book } from "@/lib/links";
import { BTN_GOLD } from "@/lib/motion";
import type { Site } from "@/lib/server/site";

export function Yachts({ site }: { site: Site }) {
  const yachts = site.content["home.yachts"];
  return (
    <section id="yachts" data-tone="foam" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
          <Title heading={yachts} as="h2" data-lines className="display t-section lg:col-span-8" />
          <Tagged tag={yachts.bodyTag} as="p" data-aos="fade-left" className="max-w-md t-lead text-(--mute) lg:col-span-4">
            {yachts.body}
          </Tagged>
        </div>

        {yachts.items.map((y, i) => (
          <article key={i} className="mt-[clamp(3.5rem,6vw,6rem)]">
            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
              <div className={`lg:col-span-8 ${i % 2 ? "lg:order-2" : ""}`}>
                <Gallery aos={i % 2 ? "fade-left" : "fade-right"} name={y.title} photos={y.photos} alts={Object.fromEntries(y.photos.map((p) => [p, site.alts[p] ?? ""]))} />
              </div>
              <div className="flex flex-col justify-between gap-8 lg:col-span-4">
                <div>
                  <Tagged tag={yachts.itemTag} as="h3" data-lines className="display t-title">
                    {y.title}
                  </Tagged>
                  <p data-aos="fade-up" className="mt-3 text-(--accent)">
                    {y.kicker}
                  </p>
                  <div data-aos="fade-up" className="mt-5 space-y-3 leading-relaxed text-(--mute)">
                    {y.body.map((p, n) => (
                      <p key={n}>{p}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <dl data-aos="fade-up" className="grid grid-cols-2 gap-x-6 border-t border-(--rule)">
                    {y.specs.map(({ label, value }) => (
                      <div key={label} className="border-b border-(--rule) py-3">
                        <dt className="text-[0.8125rem] text-(--mute)">{label}</dt>
                        <dd className="mt-0.5">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div data-aos="fade-up" className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
                    <p>
                      <span className="display block text-[1.9rem]">{y.daily}</span>
                      <span className="text-(--mute)">a day, or {y.hourly}</span>
                    </p>
                    <a href={book(site.content.business, y.title)} target="_blank" rel="noopener noreferrer" className={BTN_GOLD}>
                      Book now
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-x-12 gap-y-10 border-t border-(--rule) pt-10 lg:grid-cols-12">
              <div data-aos="fade-up" className="lg:col-span-8">
                <h4 className="font-serif text-xl">Features</h4>
                <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {y.features.map((f) => (
                    <li key={f} className="flex gap-3 leading-snug">
                      <Check className="mt-0.5 size-4 shrink-0 text-(--accent)" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div data-aos="fade-up" data-aos-delay="80" className="lg:col-span-4">
                <h4 className="font-serif text-xl">Addons</h4>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {y.addons.map((f) => (
                    <li key={f} className="rounded-full border border-(--rule) px-3.5 py-1.5 text-[0.85rem]">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OnBoard({ site }: { site: Site }) {
  const onboard = site.content["home.onboard"];
  return (
    <>
      <section id="on-board" data-tone="deep" data-stage="aside" data-shape="letterbox" className="stage">
        <div className="stage-view pb-12 pt-[clamp(4rem,7.5vw,7.5rem)] max-lg:min-h-0 lg:py-20">
          <div className="container-x grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:h-[min(70vh,42rem)]">
              <div
                data-stage-pic
                className="relative aspect-[4/5] rounded-port overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:h-full"
              >
                <Image src={onboard.salon} alt={site.alts[onboard.salon] ?? ""} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <Title heading={onboard} as="h2" data-step="fade-left" className="display t-section" />
              <Tagged tag={onboard.bodyTag} as="p" data-step="fade-up" className="mt-6 max-w-md t-lead text-(--mute)">
                {onboard.body}
              </Tagged>
            </div>
          </div>
        </div>
      </section>
      <section data-tone="deep" className="pb-[clamp(4rem,7.5vw,7.5rem)]">
        <div className="container-x grid items-center gap-x-12 gap-y-12 lg:grid-cols-12">
          <Frame
            src={onboard.cabin}
            alt={site.alts[onboard.cabin] ?? ""}
            sizes="(min-width: 1024px) 40vw, 100vw"
            aos="fade-right"
            opens="up"
            className="aspect-[4/5] lg:col-span-5"
          />
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7">
            {onboard.items.map((c, i) => (
              <li key={i} data-aos="fade-up" data-aos-delay={(i % 2) * 110} className="flex items-start gap-5">
                <Image src={c.icon} alt="" width={48} height={48} className="size-10 shrink-0" />
                <div>
                  <Tagged tag={onboard.itemTag} as="h3" className="font-serif text-[1.2rem] leading-tight">
                    {c.label}
                  </Tagged>
                  <p className="mt-1.5 leading-relaxed text-(--mute)">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

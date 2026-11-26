import Image from "next/image";
import Frame from "@/components/Frame";
import YachtShowcase, { type ShowcaseItem } from "@/components/YachtShowcase";
import Title, { Tagged } from "@/components/Title";
import { FLEET } from "@/lib/fleet";
import { book } from "@/lib/links";
import type { Site } from "@/lib/server/site";

/** The fleet: our two yachts and the trips on board them, as a showcase that moves on by itself (YachtShowcase) */
export function Yachts({ site }: { site: Site }) {
  const yachts = site.content["home.yachts"];
  const { business } = site.content;
  const services = site.content["services.items"].items;
  const items: ShowcaseItem[] = FLEET.flatMap((f) => {
    const s = services.find((x) => x.slug === f.slug);
    if (!s) return [];
    const boat = yachts.items.find((y) => y.title.startsWith(f.yacht));
    const own = f.slug === "yacht-rental" || f.slug === "boat-rental";
    return [
      {
        slug: s.slug,
        title: own && boat ? boat.title : s.title,
        badge: own ? "Yacht" : `On the ${f.yacht} yacht`,
        summary: s.summary,
        meta: boat ? (own ? `${boat.daily} a day · ${boat.hourly}` : `From ${boat.hourly}`) : "",
        photo: f.photo,
        alt: site.alts[f.photo] || (boat ? boat.title : s.title),
        book: book(business, own && boat ? boat.title : s.title),
        tint: f.tint,
      },
    ];
  });
  return (
    <section id="yachts" data-tone="foam" className="relative overflow-hidden py-[clamp(2rem,3.5vw,3.5rem)]">
      <div className="container-x relative z-10 mb-[clamp(1rem,2.5vw,2rem)]">
        <Title heading={yachts} as="h2" data-lines className="display max-w-[18em] t-section" />
      </div>
      <YachtShowcase items={items} />
    </section>
  );
}

export function OnBoard({ site }: { site: Site }) {
  const onboard = site.content["home.onboard"];
  return (
    <>
      <section id="on-board" data-tone="foam" className="py-[clamp(2rem,3.5vw,3.5rem)]">
        <div>
          <div className="container-x grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:h-[min(70vh,42rem)]">
              <div data-aos="fade-up" data-aos-img className="relative aspect-[4/5] rounded-port overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:h-full">
                <Image src={onboard.salon} alt={site.alts[onboard.salon] ?? ""} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <Title heading={onboard} as="h2" data-lines className="display t-section" />
              <Tagged tag={onboard.bodyTag} as="p" data-aos="fade-up" className="mt-6 max-w-md t-lead text-(--mute)">
                {onboard.body}
              </Tagged>
            </div>
          </div>
        </div>
      </section>
      <section id="comforts" data-tone="foam" className="pb-[clamp(2rem,3.5vw,3.5rem)]">
        <div className="container-x grid items-center gap-x-12 gap-y-12 lg:grid-cols-12">
          <Frame
            src={onboard.cabin}
            alt={site.alts[onboard.cabin] ?? ""}
            sizes="(min-width: 1024px) 40vw, 100vw"
            aos="fade-right"
            opens="up"
 className=" aspect-[4/5] lg:col-span-5"
          />
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7">
            {onboard.items.map((c, i) => (
              <li key={i} data-aos="fade-up" data-aos-delay={(i % 2) * 110} className="flex items-start gap-5">
                <Image src={c.icon} alt="" width={48} height={48} loading="eager" className="size-10 shrink-0 brightness-0 opacity-70" />
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

import Image from "next/image";
import Frame from "@/components/Frame";
import Gallery from "@/components/Gallery";
import { Check } from "@/components/Icons";
import { bookOnWhatsApp, comforts, onBoardPhotos, why, yachts, yachtsIntro } from "@/lib/content";
import { BTN_GOLD } from "@/lib/motion";

export function Yachts() {
  return (
    <section id="yachts" data-tone="foam" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
          <h2 data-lines className="display t-section lg:col-span-8">
            {yachtsIntro.title.join(" ")}
          </h2>
          <p data-aos="fade-left" className="max-w-md t-lead text-(--mute) lg:col-span-4">
            {yachtsIntro.body}
          </p>
        </div>

        {yachts.map((y, i) => (
          <article key={y.title} className="mt-[clamp(3.5rem,6vw,6rem)]">
            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
              <div className={`lg:col-span-8 ${i % 2 ? "lg:order-2" : ""}`}>
                <Gallery aos={i % 2 ? "fade-left" : "fade-right"} name={y.title} photos={[y.src, ...y.gallery]} />
              </div>
              <div className="flex flex-col justify-between gap-8 lg:col-span-4">
                <div>
                  <h3 data-lines className="display t-title">
                    {y.title}
                  </h3>
                  <p data-aos="fade-up" className="mt-3 text-(--accent)">
                    {y.kicker}
                  </p>
                  <div data-aos="fade-up" className="mt-5 space-y-3 leading-relaxed text-(--mute)">
                    {y.body.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <dl data-aos="fade-up" className="grid grid-cols-2 gap-x-6 border-t border-(--rule)">
                    {y.specs.map(([k, v]) => (
                      <div key={k} className="border-b border-(--rule) py-3">
                        <dt className="text-[0.8125rem] text-(--mute)">{k}</dt>
                        <dd className="mt-0.5">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div data-aos="fade-up" className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
                    <p>
                      <span className="display block text-[1.9rem]">{y.daily}</span>
                      <span className="text-(--mute)">a day, or {y.hourly}</span>
                    </p>
                    <a href={bookOnWhatsApp(y.title)} target="_blank" rel="noopener noreferrer" className={BTN_GOLD}>
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

export function OnBoard() {
  const [salon, cabin] = onBoardPhotos;
  const size = "h-[clamp(15rem,44vw,40rem)]";
  return (
    <section data-tone="deep" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
          <h2 data-lines className="display t-section lg:col-span-8">
            {why.title.join(" ")}
          </h2>
          <p data-aos="fade-left" className="max-w-md t-lead text-(--mute) lg:col-span-4">
            {why.body}
          </p>
        </div>
        <div className="mt-10 grid grid-cols-[1.75fr_1fr] gap-3 md:mt-16 md:gap-5">
          <Frame src={salon.src} alt={salon.alt} sizes="64vw" aos="fade-right" className={size} />
          <Frame src={cabin.src} alt={cabin.alt} sizes="36vw" aos="fade-left" delay={120} className={size} />
        </div>
        <ul className="mt-12 grid gap-x-12 gap-y-9 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
          {comforts.map((c, i) => (
            <li key={c.label} data-aos="fade-up" data-aos-delay={(i % 3) * 100} className="flex items-start gap-5">
              <Image src={c.icon} alt="" width={48} height={48} className="size-10 shrink-0" />
              <div>
                <h3 className="font-serif text-[1.2rem] leading-tight">{c.label}</h3>
                <p className="mt-1.5 leading-relaxed text-(--mute)">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

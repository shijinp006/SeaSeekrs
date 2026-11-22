import Photo from "@/components/Photo";
import { comforts, features, moments } from "@/lib/content";

export function Features() {
  return (
    <section className="bg-paper py-24 md:py-40">
      <div className="container-x space-y-28 md:space-y-44">
        {features.map((f, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={f.title} className="grid items-center gap-10 md:grid-cols-12 md:gap-8 lg:gap-6">
              <div className={`md:col-span-6 lg:col-span-4 ${flip ? "md:order-2 lg:col-start-8" : "lg:col-start-2"}`}>
                <p data-reveal className="kicker text-muted">
                  {String(i + 1).padStart(2, "0")} — {f.kicker}
                </p>
                <h3 data-reveal data-delay="0.1" className="serif mt-6 text-4xl leading-[1.1] lg:text-5xl">
                  {f.title}
                </h3>
                <div data-reveal data-delay="0.15" className="mt-8 h-px w-16 bg-ink/25" />
                <p data-reveal data-delay="0.2" className="mt-8 max-w-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </div>
              <div className={`md:col-span-6 lg:col-span-5 ${flip ? "md:order-1 lg:col-start-2" : "lg:col-start-7"}`}>
                <Photo
                  src={f.src}
                  alt={f.title}
                  className={`${f.dark ? "aspect-square shadow-[0_40px_80px_-30px_rgba(7,18,31,0.6)]" : "aspect-[4/5]"}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Comforts() {
  return (
    <section className="bg-paper pb-28 md:pb-44">
      <div className="container-x">
        <div className="text-center">
          <p data-reveal className="kicker text-muted">
            On board
          </p>
          <h2 data-reveal data-delay="0.1" className="serif mt-6 text-5xl leading-[1.05] md:text-7xl">
            Every comfort,
            <br />
            considered
          </h2>
        </div>

        <div className="mt-16 grid auto-rows-[52vw] grid-cols-2 gap-3 md:mt-24 md:auto-rows-[23vw] md:grid-cols-12 md:gap-4 lg:auto-rows-[17vw] 2xl:auto-rows-[15rem]">
          {comforts.map((c) => (
            <Photo key={c.label} src={c.src} alt={c.label} className={c.cls} sizes="(min-width: 768px) 33vw, 50vw">
              <span className="kicker absolute bottom-4 left-4 text-white drop-shadow">{c.label}</span>
            </Photo>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Moments() {
  return (
    <section className="overflow-hidden bg-paper pb-28 md:pb-44">
      <div className="container-x text-center">
        <h2 data-reveal className="serif text-5xl md:text-7xl">
          Moments aboard
        </h2>
        <p data-reveal data-delay="0.1" className="mx-auto mt-6 max-w-md text-muted">
          Sunrise swims, long lunches, a sky full of stars. The days you came for.
        </p>
      </div>
      <div data-drift="18" className="mt-16 flex w-max items-start gap-4 pl-4 md:mt-24 md:gap-6 md:pl-[12vw]">
        {moments.map((m) => (
          <Photo key={m.src} src={m.src} alt={m.alt} className={`shrink-0 ${m.cls}`} sizes="(min-width: 768px) 32vw, 74vw" />
        ))}
      </div>
    </section>
  );
}

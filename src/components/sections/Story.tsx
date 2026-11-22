import Image from "next/image";
import Photo from "@/components/Photo";
import { bow, crew, fleet, stats } from "@/lib/content";

export function Stats() {
  return (
    <section className="relative z-10 bg-paper py-28 md:py-44">
      <div className="container-x text-center">
        <p data-reveal className="kicker text-muted">
          SeaSeekers · Since 2001
        </p>
        <h2 data-reveal data-delay="0.1" className="serif mx-auto mt-6 max-w-4xl text-5xl leading-[1.05] md:text-7xl">
          The art of being
          <br />
          <em className="italic">perfectly</em> at sea.
        </h2>
        <div data-reveal data-delay="0.2" className="mx-auto mt-10 h-px w-24 bg-ink/25" />
        <p data-reveal data-delay="0.25" className="mx-auto mt-10 max-w-xl text-[0.95rem] leading-relaxed text-muted">
          For a quarter of a century we have matched discerning travellers with the right yacht, the right crew and
          the right stretch of water — quietly, precisely, and always around you.
        </p>

        <dl className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-y-14 md:mt-28 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} data-reveal data-delay={String(0.1 * i)} className="flex flex-col items-center">
              <dt className="serif flex items-start text-6xl md:text-7xl">
                <span data-count={s.value}>{s.value}</span>
                {s.suffix && <span className="ml-1 mt-2 text-2xl">{s.suffix}</span>}
              </dt>
              <dd className="kicker mt-4 text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Crew() {
  return (
    <section id="experience" className="bg-paper py-24 md:py-40">
      <div className="container-x grid items-center gap-12 md:grid-cols-12 md:gap-6">
        <Photo src={crew.src} alt={crew.alt} className="aspect-[4/5] md:col-span-6 md:aspect-[5/6]" />
        <div className="md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
          <p data-reveal className="kicker text-muted">
            The crew
          </p>
          <h2 data-reveal data-delay="0.1" className="serif mt-6 text-4xl leading-[1.1] md:text-5xl xl:text-6xl">
            {crew.title[0]}
            <br />
            {crew.title[1]}
          </h2>
          <p data-reveal data-delay="0.2" className="mt-8 max-w-md leading-relaxed text-muted">
            {crew.body}
          </p>
          <a data-reveal data-delay="0.3" href="#inquire" className="kicker mt-10 inline-block border-b border-ink/40 pb-1 hover:border-ink">
            Meet your crew
          </a>
        </div>
      </div>
    </section>
  );
}

export function Fleet() {
  return (
    <section id="fleet" className="bg-paper pb-28 md:pb-44">
      <div className="container-x">
        <div className="text-center">
          <p data-reveal className="kicker text-muted">
            The fleet
          </p>
          <h2 data-reveal data-delay="0.1" className="serif mt-6 text-5xl md:text-7xl">
            Vessels of distinction
          </h2>
          <p data-reveal data-delay="0.2" className="mx-auto mt-6 max-w-lg text-muted">
            A private collection of motor and sailing yachts, each inspected by us every season.
          </p>
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-16 md:mt-24 md:grid-cols-2 md:gap-y-24">
          {fleet.map((y, i) => (
            <article key={y.name} className={i % 2 ? "md:mt-24" : ""}>
              <Photo src={y.src} alt={`${y.name} yacht`} className="aspect-[4/3]" />
              <div data-reveal className="mt-6 flex flex-col gap-2 border-b border-line pb-5 sm:flex-row sm:items-baseline sm:justify-between md:flex-col md:items-start lg:flex-row lg:items-baseline">
                <h3 className="serif text-3xl">{y.name}</h3>
                <p className="kicker text-muted">{y.spec}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Bow() {
  return (
    <section className="relative h-[130svh] overflow-hidden bg-teal text-white">
      <div data-parallax="8" className="absolute inset-[-12%_0]">
        <Image src={bow.src} alt={bow.alt} fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-teal/45 via-teal/10 to-black/35" />
      <div className="relative flex h-full items-center justify-center px-4 text-center">
        <h2 data-reveal className="serif text-[clamp(2.75rem,min(11vw,13svh),7rem)] leading-[1.05]">
          {bow.lines[0]}
          <br />
          {bow.lines[1]}
        </h2>
      </div>
    </section>
  );
}

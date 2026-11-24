import Frame from "@/components/Frame";
import { CardArrow } from "@/components/Icons";
import Rail from "@/components/Rail";
import {
  about,
  bookOnWhatsApp,
  company,
  included,
  services,
  servicesIntro,
  tours,
  toursIntro,
  welcome,
} from "@/lib/content";
import { BTN_GOLD, LINK } from "@/lib/motion";

const out = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Welcome() {
  return (
    <section data-tone="foam" className="min-h-[100svh] pb-[clamp(4rem,7vw,7rem)] pt-[clamp(6rem,9.5vw,9rem)]">
      <div className="container-x">
        <h2 data-lines className="display t-hero">
          {welcome.lines[0]}
          <br /> {welcome.lines[1]} {welcome.accent}
        </h2>
        <div className="mt-[clamp(2rem,3.5vw,3.5rem)] grid gap-x-12 gap-y-10 lg:grid-cols-12">
          <Frame
            src={about.src}
            alt={about.alt}
            sizes="(min-width: 1024px) 66vw, 100vw"
            aos="fade-right"
            className="aspect-[4/3] sm:aspect-[16/10] lg:col-span-8"
          />
          <div className="flex flex-col justify-between gap-10 lg:col-span-4">
            <div>
              <p data-aos="fade-left" className="t-lead [text-wrap:pretty]">
                {welcome.body}
              </p>
              <div data-aos="fade-left" data-aos-delay="120" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
                <a href="#yachts" className={BTN_GOLD}>
                  See the yachts
                </a>
                <a href={company.whatsapp} {...out} className={LINK}>
                  Ask on WhatsApp
                </a>
              </div>
            </div>
            <dl>
              {included.map(([k, v], i) => (
                <div key={k} data-aos="fade-up" data-aos-delay={i * 110} className="border-t border-(--rule) py-4 last:pb-0">
                  <dt className="text-[0.8125rem] text-(--mute)">{k}</dt>
                  <dd className="mt-0.5 font-serif text-[1.125rem] leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" data-tone="foam" className="py-[clamp(4rem,8vw,8rem)]">
      <div className="container-x grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 data-lines className="display t-section">
            {about.title.join(" ")}
          </h2>
          <p data-aos="fade-up" className="mt-6 max-w-[38em] t-lead [text-wrap:pretty]">
            {about.body[0]}
          </p>
          <div className="mt-6 grid max-w-[46rem] gap-8 leading-relaxed text-(--mute) sm:grid-cols-2">
            <p data-aos="fade-up">{about.body[1]}</p>
            <p data-aos="fade-up" data-aos-delay="80">
              {about.body[2]}
            </p>
          </div>
        </div>
        {/* two photos from on board, one lapping over the other */}
        <div className="relative pb-[22%] lg:col-span-5">
          <Frame
            src={about.portrait.src}
            alt={about.portrait.alt}
            sizes="(min-width: 1024px) 34vw, 80vw"
            aos="fade-left"
            className="ml-auto aspect-[4/5] w-[84%]"
          />
          <div className="absolute bottom-0 left-0 w-[58%] rounded-[calc(var(--radius-port)+0.5rem)] bg-(--bg) p-2 md:p-3">
            <Frame
              src={about.inset.src}
              alt={about.inset.alt}
              sizes="(min-width: 1024px) 24vw, 56vw"
              aos="zoom-in"
              delay={250}
              className="aspect-[3/2]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section data-tone="foam" className="overflow-x-clip pb-[clamp(4rem,7.5vw,7.5rem)] pt-[clamp(4rem,6vw,6rem)]">
      <Rail
        label={servicesIntro.title}
        head={
          <h2 data-lines className="display max-w-[12em] t-section">
            {servicesIntro.title}
          </h2>
        }
      >
        {services.map((s, i) => (
          <li key={s.title} className="w-[78vw] max-w-[25rem] shrink-0 snap-start sm:w-[46vw] lg:w-[29vw]">
            <a href={bookOnWhatsApp(s.title)} {...out} className="group card-focus block">
              <Frame
                src={s.src}
                alt={s.alt}
                delay={Math.min(i, 3) * 120}
                sizes="(min-width: 1024px) 54vw, (min-width: 640px) 90vw, 150vw"
                className="aspect-[3/4] text-white"
              >
                <span className="card-shade absolute inset-0" />
                <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 md:inset-x-7 md:bottom-7">
                  <h3 className="display t-title">{s.title}</h3>
                  <CardArrow />
                </span>
              </Frame>
              <p className="mt-5 pr-4 leading-relaxed text-(--mute)">{s.body}</p>
            </a>
          </li>
        ))}
      </Rail>
    </section>
  );
}

// Where each landmark hangs on the wall (wide screens), from morning at the Burj to night at the wheel
const wall = [
  "col-span-2 aspect-[4/3] lg:col-span-7 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-5 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-5 lg:aspect-auto",
  "col-span-2 aspect-[4/3] lg:col-span-12 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-5 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-7 lg:row-span-2 lg:aspect-auto",
];
// …and the side it comes in from
const wallAos = ["fade-right", "fade-left", "fade-left", "zoom-in", "fade-right", "fade-left"] as const;
const wallSizes = ["58vw", "42vw", "42vw", "100vw", "42vw", "58vw"];

export function Tours() {
  return (
    <section id="tours" data-tone="deep" className="py-[clamp(4rem,7.5vw,7.5rem)]">
      <div className="container-x">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12">
          <h2 data-lines className="display t-section lg:col-span-7">
            {toursIntro.title}
          </h2>
          <p data-aos="fade-left" className="max-w-md t-lead text-(--mute) lg:col-span-5">
            {toursIntro.body}
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-16 md:gap-5 lg:auto-rows-[clamp(13rem,20vw,19rem)] lg:grid-cols-12">
          {tours.map((t, i) => (
            <li key={t.name} className={wall[i]}>
              <a href={bookOnWhatsApp(`${t.name} tour`)} {...out} className="group card-focus block h-full">
                <Frame
                  src={t.src}
                  alt={`${t.name}, Dubai`}
                  focus={t.focus}
                  aos={wallAos[i]}
                  delay={i === 2 ? 140 : 0}
                  sizes={`(min-width: 1024px) ${wallSizes[i]}, 100vw`}
                  className="h-full text-white"
                >
                  <span className="card-shade absolute inset-0" />
                  <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 md:inset-x-8 md:bottom-7">
                    <span className="block">
                      <h3 className={`display ${i === 1 || i === 2 ? "t-card" : "t-title"}`}>
                        {t.name}
                      </h3>
                      <span className="mt-1.5 block text-[0.8125rem] text-white/85">Book this tour</span>
                    </span>
                    <span className="max-sm:hidden">
                      <CardArrow />
                    </span>
                  </span>
                </Frame>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

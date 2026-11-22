import InquiryForm from "@/components/InquiryForm";
import { steps, testimonial } from "@/lib/content";

export function Process() {
  return (
    <section id="charter" className="bg-paper pb-24 md:pb-36">
      <div className="container-x">
        <div className="text-center">
          <p data-reveal className="kicker text-muted">
            How it works
          </p>
          <h2 data-reveal data-delay="0.1" className="serif mt-6 text-5xl leading-[1.05] md:text-7xl">
            Chartering, made
            <br />
            effortless
          </h2>
        </div>
        <ol className="mx-auto mt-16 grid max-w-5xl gap-12 md:mt-24 md:grid-cols-3 md:gap-10">
          {steps.map((s, i) => (
            <li key={s.n} data-reveal data-delay={String(0.12 * i)} className="border-t border-ink/20 pt-6">
              <span className="serif text-sm text-muted">{s.n}</span>
              <h3 className="serif mt-3 text-2xl">{s.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Testimonial() {
  return (
    <section className="bg-paper pb-32 md:pb-48">
      <figure className="container-x text-center">
        <blockquote data-reveal className="serif mx-auto max-w-4xl text-3xl italic leading-[1.3] md:text-5xl">
          “{testimonial.quote}”
        </blockquote>
        <figcaption data-reveal data-delay="0.15" className="kicker mt-10 text-muted">
          {testimonial.who}
        </figcaption>
      </figure>
    </section>
  );
}

export function Inquiry() {
  return (
    <section id="inquire" className="bg-navy py-28 text-white md:py-40">
      <div className="container-x">
        <div className="text-center">
          <p data-reveal className="kicker text-gold">
            — Begin —
          </p>
          <h2 data-reveal data-delay="0.1" className="serif mt-6 text-5xl leading-[1.05] md:text-7xl">
            Your voyage starts
            <br />
            with a single word.
          </h2>
          <p data-reveal data-delay="0.2" className="mx-auto mt-6 max-w-md text-white/60">
            Share a few details and a charter specialist will reply within 24 hours.
          </p>
        </div>
        <div data-reveal data-delay="0.25">
          <InquiryForm />
        </div>
      </div>
    </section>
  );
}

const cols = [
  { title: "Explore", items: ["Fleet", "Experience", "Journal"] },
  { title: "Charter", items: ["How it works", "Crewed charters", "Corporate events", "Yacht management"] },
  { title: "Contact", items: ["hello@seaseekers.com", "+377 00 00 00 00", "Port Hercule, Monaco"] },
];

export function Footer() {
  return (
    <footer className="bg-navy-deep pb-10 pt-20 text-white md:pt-28">
      <div className="container-x">
        <div className="grid gap-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12">
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-5">
            <span className="serif text-5xl">S</span>
            <p className="kicker mt-4">SeaSeekers</p>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/50">
              Private yacht charters across the Mediterranean, the Caribbean and the Indian Ocean.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="lg:col-span-2 lg:last:col-span-3">
              <p className="kicker text-white/40">{c.title}</p>
              <ul className="mt-6 space-y-3 text-sm text-white/75">
                {c.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-20 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 md:flex-row">
          <p>© 2026 SeaSeekers. All rights reserved.</p>
          <p>Privacy · Terms · Cookies</p>
        </div>
      </div>
    </footer>
  );
}

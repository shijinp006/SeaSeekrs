import ScrollFilm from "@/components/ScrollFilm";
import MotionRoot from "@/components/MotionRoot";
import { Bow, Crew, Fleet, Stats } from "@/components/sections/Story";
import { Comforts, Features, Moments } from "@/components/sections/Explore";
import { Footer, Inquiry, Process, Testimonial } from "@/components/sections/Charter";
import { heroFilm } from "@/lib/content";

function HeroIntro() {
  return (
    <div className="container-x flex h-full flex-col justify-end pb-10 sm:pb-14 lg:pb-20">
      {/* sized by both width and height so it fits portrait phones, landscape phones and wide screens */}
      <h1 className="serif text-[min(22vw,30svh)] leading-[0.9] md:text-[min(13vw,24svh)] lg:text-[min(11vw,26svh)]">
        <span className="rise">
          <span style={{ ["--d" as string]: "0.35s" }}>Sea</span>
        </span>
        <span className="rise">
          <span className="italic" style={{ ["--d" as string]: "0.5s" }}>
            Seekers
          </span>
        </span>
      </h1>
      <div className="fade-in mt-6 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-end sm:justify-between" style={{ ["--d" as string]: "1s" }}>
        <p className="max-w-sm text-sm leading-relaxed text-white/80">
          Private yacht charters across the world&apos;s most beautiful waters — crewed, curated and composed around you.
        </p>
        <p className="kicker flex items-center gap-3 text-white/70">
          <span className="inline-block h-px w-10 bg-white/60" /> Scroll to explore
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="top">
      <ScrollFilm
        frames={heroFilm.frames}
        src={heroFilm.src}
        length={heroFilm.length}
        captions={heroFilm.captions}
        intro={<HeroIntro />}
        overlap
      />
      {/* Slides up over the last 100vh of the hero while the film is still playing */}
      <div data-after-hero className="relative z-10 -mt-[100svh] before:pointer-events-none before:absolute before:inset-x-0 before:-top-24 before:h-24 before:bg-gradient-to-t before:from-black/30 before:to-transparent">
        <Stats />
      </div>
      <Crew />
      <Fleet />
      <Bow />
      <Features />
      <Comforts />
      <Moments />
      <Process />
      <Testimonial />
      <Inquiry />
      <Footer />
      {/* Last child: its effect runs after the page has hydrated and the pinned sequences exist */}
      <MotionRoot />
    </main>
  );
}

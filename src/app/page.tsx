import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageTransition from "@/components/PageTransition";
import SiteHeader from "@/components/SiteHeader";
import { headingStyle, Tagged } from "@/components/Title";
import ScrollFilm from "@/components/ScrollFilm";
import MotionRoot from "@/components/MotionRoot";
import { About, Tours, Welcome } from "@/components/sections/Story";
import { OnBoard, Yachts } from "@/components/sections/Explore";
import { Faq, Footer, Reviews } from "@/components/sections/Charter";
import { heroFilm } from "@/lib/content";
import { businessLd, faqLd, pageMetadata, websiteLd } from "@/lib/server/seo";
import { getSite, type Site } from "@/lib/server/site";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata((await getSite()).content["home.seo"], "/");
}

function HeroIntro({ hero }: { hero: Site["content"]["home.hero"] }) {
  const H = (hero.tag || "h1") as "h1";
  return (
    <div className="container-x flex h-full flex-col justify-end pb-10 sm:pb-14 lg:pb-20">
      {/* sized by both width and height so it fits portrait phones, landscape phones and wide screens */}
      <H
        className="serif text-[calc(min(22vw,30svh)*var(--h-scale,1))] leading-[0.9] md:text-[calc(min(13vw,24svh)*var(--h-scale,1))] lg:text-[calc(min(11vw,26svh)*var(--h-scale,1))]"
        style={headingStyle(hero.size)}
      >
        <span className="block">{hero.line1}</span>
        <span className="block italic">{hero.line2}</span>
      </H>
      <div className="mt-6 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
        <Tagged tag={hero.bodyTag} as="p" className="max-w-sm text-sm leading-relaxed text-white/80">
          {hero.body}
        </Tagged>
        <p className="kicker flex items-center gap-3 text-white/70">
          <span className="inline-block h-px w-10 bg-white/60" /> {hero.hint}
        </p>
      </div>
    </div>
  );
}

export default async function Home() {
  const site = await getSite();
  const hero = site.content["home.hero"];
  const captions = heroFilm.captions.map((c, i) => ({ ...c, lines: [hero.captions[i].line1, hero.captions[i].line2] as [string, string] }));
  return (
    <>
      <JsonLd data={[businessLd(site), websiteLd(site), faqLd(site)]} />
      <SiteHeader site={site} />
      <PageTransition>
<main id="top" tabIndex={-1} className="outline-none">
        <ScrollFilm
          frames={heroFilm.frames}
          pace={heroFilm.pace}
          src={heroFilm.src}
          length={heroFilm.length}
          captions={captions}
          intro={<HeroIntro hero={hero} />}
          overlap
        />
        {/* Slides up over the last 100vh of the hero while the film is still playing */}
        <div
          data-after-hero
          className="relative z-10 -mt-[100svh] bg-foam motion-reduce:mt-0 noscript:mt-0 before:pointer-events-none before:absolute before:inset-x-0 before:-top-24 before:h-24 before:bg-gradient-to-t before:from-black/30 before:to-transparent"
        >
          <Welcome site={site} />
          <About site={site} />
          <Yachts site={site} />
          <Tours site={site} />
          <OnBoard site={site} />
          <Reviews site={site} />
          <Faq site={site} />
        </div>
      </main>
</PageTransition>
      <Footer site={site} />
      {/* Last: its effect runs after the page has hydrated and the pinned sequences exist */}
      <MotionRoot />
    </>
  );
}

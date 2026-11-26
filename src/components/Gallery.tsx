"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import type { Aos } from "@/lib/motion";

/** How long each photo stays before the carousel moves on by itself (wide screens) */
const STAY = 4500;

/**
 * The photos of a yacht, with their thumbnails underneath.
 * Phones and tablets: one large picture that cross-fades between the photos, chosen by the thumbnails. Only the first
 * large photo is loaded with the page; the others when their thumbnail is pointed at or chosen.
 * Wide screens: a carousel that slides from photo to photo by itself, or by a drag; no thumbnails.
 */
export default function Gallery({
  name,
  photos,
  alts,
  aos,
  morph,
  first = false,
}: {
  name: string;
  photos: string[];
  /** alt text by picture */
  alts: Record<string, string>;
  aos: Aos;
  /** the name its picture keeps from the card that led here (view transition) */
  morph?: string;
  /** at the top of the page: its picture is loaded straight away */
  first?: boolean;
}) {
  const n = photos.length;
  const [at, setAt] = useState(0);
  const [asked, setAsked] = useState([0]); // large photos that have been wanted so far (phones)
  const [ready, setReady] = useState([0]); // …and those that have arrived
  const want = (i: number) => setAsked((old) => (old.includes(i) ? old : [...old, i]));
  const shown = ready.includes(at) ? at : (ready.at(-1) ?? 0); // the one before stays until the new one is there
  const alt = (src: string, i: number) => alts[src] || (i ? `${name}, photo ${i + 1}` : name);
  const go = useCallback((by: number) => setAt((a) => (a + by + n) % n), [n]);

  // wide screens: on by itself while it is on the screen and the page is in front; a choice by hand starts the wait again
  const box = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const check = () => setWide(mq.matches && !still);
    check();
    mq.addEventListener("change", check);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 });
    if (box.current) io.observe(box.current);
    return () => {
      mq.removeEventListener("change", check);
      io.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!wide || !seen || n < 2) return;
    const t = window.setTimeout(() => !document.hidden && go(1), STAY);
    return () => window.clearTimeout(t);
  }, [at, wide, seen, n, go]);

  // a swipe or drag on the carousel
  const from = useRef<number | null>(null);

  const fading = (
    <div className="relative isolate aspect-[4/3] overflow-hidden rounded-port bg-navy-deep/10 lg:hidden">
      {photos.map(
        (src, i) =>
          asked.includes(i) && (
            <Image
              key={src}
              src={src}
              alt={alt(src, i)}
              aria-hidden={i !== shown}
              fill
              onLoad={() => setReady((old) => (old.includes(i) ? old : [...old, i]))}
              loading={(first && i === 0) || i > 0 ? "eager" : "lazy"}
              fetchPriority={first && i === 0 ? "high" : undefined}
              sizes="100vw"
              className={`object-cover transition-[opacity,scale] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                i === shown ? "opacity-100" : "scale-[1.05] opacity-0"
              }`}
            />
          ),
      )}
    </div>
  );

  const sliding = (
    <div
      ref={box}
      className="relative isolate hidden aspect-[3/2] cursor-grab overflow-hidden rounded-port bg-navy-deep/10 select-none active:cursor-grabbing lg:block"
      onPointerDown={(e) => (from.current = e.clientX)}
      onPointerUp={(e) => {
        if (from.current === null) return;
        const d = e.clientX - from.current;
        from.current = null;
        if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Photos of ${name}`}
    >
      <div className="flex h-full transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.25,1)]" style={{ transform: `translateX(-${at * 100}%)` }}>
        {photos.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0 overflow-hidden" aria-hidden={i !== at}>
            <Image
              src={src}
              alt={alt(src, i)}
              fill
              draggable={false}
              loading={i < 2 ? "eager" : "lazy"}
              fetchPriority={first && i === 0 ? "high" : undefined}
              sizes="62vw"
              className={`object-cover transition-[scale] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${i === at ? "scale-100" : "scale-[1.06]"}`}
            />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <p className="absolute bottom-4 left-4 rounded-xl bg-navy-deep/55 px-3 py-1.5 text-[0.8125rem] tabular-nums text-white backdrop-blur-sm">
            {at + 1} / {n}
          </p>
          {/* a dot for each photo: the one shown is longer; a dot takes you to its photo */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy-deep/45 px-3 py-2 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Show photo ${i + 1} of ${name}`}
                aria-current={i === at}
                onClick={() => setAt(i)}
                className={`h-2.5 rounded-full transition-[width,background-color] duration-500 ${i === at ? "w-7 bg-white" : "w-2.5 bg-white/50 hover:bg-white/85"}`}
              />
            ))}
          </div>
          {/* how long until it moves on */}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-white/25">
            <span key={`${at}-${wide && seen}`} className={`showcase-timer bg-white! ${wide && seen ? "" : "is-still"}`} style={{ animationDuration: `${STAY}ms` }} />
          </span>
        </>
      )}
    </div>
  );

  const pictures = (
    <div data-aos={aos} data-aos-img>
      {fading}
      {sliding}
    </div>
  );

  return (
    <div>
      {morph ? (
        <ViewTransition name={morph} share="morph" default="none">
          {pictures}
        </ViewTransition>
      ) : (
        pictures
      )}
      <div className="mt-3 grid grid-cols-5 gap-2 md:mt-4 md:gap-4 lg:hidden">
        {/* the wrapper is animated, so the button keeps its own fade */}
        {photos.map((src, i) => (
          <div key={src} data-aos="zoom-in" data-aos-delay={i * 80}>
            <button
              type="button"
              aria-label={`Show photo ${i + 1} of ${name}`}
              aria-pressed={i === at}
              onPointerEnter={() => want(i)}
              onFocus={() => want(i)}
              onClick={() => {
                want(i);
                setAt(i);
              }}
              className={`group relative block w-full aspect-[4/3] overflow-hidden rounded-[0.6rem] outline-2 outline-offset-2 transition-[opacity,outline-color] duration-300 md:rounded-[0.8rem] ${
                i === at ? "outline-(--accent)" : "opacity-70 outline-transparent hover:opacity-100 focus-visible:outline-(--fg)"
              }`}
            >
              <Image src={src} alt={alt(src, i)} fill sizes="(min-width: 1024px) 13vw, 20vw" className="card-img object-cover" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

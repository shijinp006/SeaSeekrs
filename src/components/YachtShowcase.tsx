"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { Arrow } from "@/components/Icons";
import { BTN_GOLD, LINK } from "@/lib/motion";

export type ShowcaseItem = {
  slug: string;
  title: string;
  badge: string;
  summary: string;
  /** a price, or where it is on board */
  meta: string;
  photo: string;
  alt: string;
  /** the WhatsApp chat to book it */
  book: string;
  /** the soft colour of the page behind it */
  tint: string;
};

/** Where a picture stands, by how far it is from the one in front: in front, then smaller, softer and further back */
const PLACE = [
  { x: 0, s: 1, blur: 0, o: 1 },
  { x: 64, s: 0.62, blur: 2, o: 0.9 },
  { x: 102, s: 0.44, blur: 4, o: 0.65 },
  { x: 128, s: 0.3, blur: 6, o: 0 },
];
const GONE = { x: -42, s: 1.08, blur: 6, o: 0 }; // the one that has just left, to the left

/**
 * The fleet as a showcase: one yacht in front, sharp, with the next ones waiting behind it, smaller and out of focus.
 * Moving on, the one in front goes out to the left and the next comes forward into focus while its words rise in;
 * the colour of the page changes with it. It moves on by itself while it is on the screen and not pointed at.
 * Its picture (or "View details") opens the yacht's page, the picture carried across (view transition).
 */
export default function YachtShowcase({ items }: { items: ShowcaseItem[] }) {
  const n = items.length;
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const go = useCallback((by: number) => setAt((a) => (a + by + n) % n), [n]);

  // on by itself, every few seconds, while it is in view and nobody is pointing at it or using it
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), 5200);
    return () => window.clearTimeout(t);
  }, [at, seen, paused, go]);

  // a swipe moves it on or back
  const from = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => (from.current = e.clientX);
  const onUp = (e: React.PointerEvent) => {
    if (from.current === null) return;
    const d = e.clientX - from.current;
    from.current = null;
    if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
  };

  const item = items[at];
  return (
    <div
      ref={root}
      className="showcase"
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {/* the colour behind it, one layer per yacht, crossing over */}
      {items.map((it, i) => (
        <span key={it.slug} aria-hidden className="showcase-tint" style={{ background: it.tint, opacity: i === at ? 1 : 0 }} />
      ))}

      <div className="container-x relative grid items-center gap-x-10 gap-y-6 lg:grid-cols-12">
        {/* the pictures */}
        <div className="showcase-stage lg:order-2 lg:col-span-7" onPointerDown={onDown} onPointerUp={onUp}>
          {items.map((it, i) => {
            const d = (i - at + n) % n;
            const p = d === n - 1 && n > 2 ? GONE : (PLACE[d] ?? PLACE[3]);
            const front = d === 0;
            const style = {
              transform: `translateX(${p.x}%) scale(${p.s})`,
              filter: p.blur ? `blur(${p.blur}px)` : "none",
              opacity: p.o,
              zIndex: d === n - 1 ? 40 : 30 - d,
            };
            const picture = (
              <Image
                src={it.photo}
                alt={it.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 85vw"
                priority={i === 0}
                className="object-cover"
              />
            );
            return (
              <div key={it.slug} className="showcase-item" style={style} aria-hidden={!front}>
                {front ? (
                  <Link href={`/services/${it.slug}`} className="card-focus absolute inset-0 overflow-hidden rounded-port" aria-label={`${it.title}: view details`}>
                    <ViewTransition name={`service-${it.slug}`} share="morph" default="none">
                      <div className="absolute inset-0">{picture}</div>
                    </ViewTransition>
                  </Link>
                ) : (
                  <button type="button" tabIndex={-1} onClick={() => setAt(i)} className="absolute inset-0 overflow-hidden rounded-port">
                    {picture}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* the words of the one in front: they rise in anew each time */}
        <div className="flex flex-col lg:order-1 lg:col-span-5" aria-live="polite">
          <div key={item.slug} className="showcase-words">
            <p className="showcase-line" style={{ animationDelay: "0.25s" }}>
              <span className="inline-block rounded-full border border-(--rule) bg-white/80 px-3 py-1 text-[0.75rem] font-medium text-ink">{item.badge}</span>
            </p>
            <h3 className="showcase-line display mt-4 text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.05]" style={{ animationDelay: "0.35s" }}>
              <span>{item.title}</span>
            </h3>
            <p className="showcase-line mt-4 max-w-md leading-relaxed text-(--mute)" style={{ animationDelay: "0.45s" }}>
              <span>{item.summary}</span>
            </p>
            <p className="showcase-line mt-3 font-medium" style={{ animationDelay: "0.52s" }}>
              <span>{item.meta}</span>
            </p>
            <div className="showcase-line mt-6 flex flex-wrap items-center gap-x-7 gap-y-3" style={{ animationDelay: "0.6s" }}>
              <Link href={`/services/${item.slug}`} className={BTN_GOLD}>
                View details
              </Link>
              <a href={item.book} target="_blank" rel="noopener noreferrer" className={LINK}>
                Book on WhatsApp
              </a>
            </div>
          </div>

          {/* where it is, and the way on: under the picture on phones and tablets, under the words on wide screens */}
          <div className="flex items-center gap-5 max-lg:order-first max-lg:mb-6 lg:mt-8">
            <button type="button" aria-label="Previous yacht" onClick={() => go(-1)} className="showcase-arrow">
              <Arrow className="size-5 rotate-180" />
            </button>
            <button type="button" aria-label="Next yacht" onClick={() => go(1)} className="showcase-arrow">
              <Arrow />
            </button>
            <p className="text-[0.875rem] tabular-nums text-(--mute)">
              <span className="font-semibold text-(--fg)">{String(at + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
            </p>
            <span aria-hidden className="relative h-px flex-1 overflow-hidden bg-(--rule)">
              <span key={`${at}-${paused || !seen}`} className={`showcase-timer ${paused || !seen ? "is-still" : ""}`} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Arrow } from "@/components/Icons";

/**
 * A row of cards that runs off the edge of the screen: swipe it, drag it, or use the arrows.
 * Plain native sideways scrolling, so it never gets in the way of scrolling down the page.
 */
const stopsOf = (el: HTMLElement) => {
  const cards = [...el.children] as HTMLElement[];
  const max = el.scrollWidth - el.clientWidth;
  return [...new Set(cards.map((c) => Math.min(c.offsetLeft - cards[0].offsetLeft, max)))];
};
const nearest = (stops: number[], x: number) =>
  stops.reduce((best, s, i) => (Math.abs(s - x) < Math.abs(stops[best] - x) ? i : best), 0);

export default function Rail({
  label,
  head,
  children,
}: {
  label: string;
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const aim = useRef<number | null>(null); // where a glide under way will come to rest
  const [edge, setEdge] = useState({ start: true, end: false });

  // ---- the arrows: each is off at its end of the row
  useEffect(() => {
    const el = rail.current!;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      const next = { start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 };
      setEdge((old) => (old.start === next.start && old.end === next.end ? old : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Snapping pulls against an animated scroll, so it is off while the rail glides
  const halt = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    gsap.killTweensOf(el, "scrollLeft");
    aim.current = null;
    el.style.scrollSnapType = "";
  }, []);
  const glide = useCallback((to: number) => {
    const el = rail.current!;
    aim.current = to;
    el.style.scrollSnapType = "none";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(el, { scrollLeft: to, duration: still ? 0 : 0.95, ease: "power3.out", overwrite: true, onComplete: halt });
  }, [halt]);

  // ---- drag with the mouse (touch already scrolls by itself)
  useEffect(() => {
    const el = rail.current!;
    let from = 0;
    let left = 0;
    let speed = 0;
    let lastX = 0;
    let down = false;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      moved = false;
      halt();
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      speed = 0;
      from = lastX = e.clientX;
      left = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const d = e.clientX - from;
      if (!moved && Math.abs(d) < 6) return;
      if (!moved) {
        moved = true;
        el.style.scrollSnapType = "none";
        el.dataset.dragging = "";
      }
      speed = speed * 0.6 + (e.clientX - lastX) * 0.4;
      lastX = e.clientX;
      el.scrollLeft = left - d;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      delete el.dataset.dragging;
      // carry on in the direction of the throw and come to rest on a card
      const stops = stopsOf(el);
      glide(stops[nearest(stops, el.scrollLeft - speed * 14)]);
    };
    // letting go over a card is not a click on it
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("wheel", halt, { passive: true });
    return () => {
      halt();
      el.removeEventListener("wheel", halt);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [glide, halt]);

  const go = (dir: 1 | -1) => {
    const el = rail.current!;
    const stops = stopsOf(el);
    const i = nearest(stops, aim.current ?? el.scrollLeft) + dir;
    glide(stops[Math.max(0, Math.min(stops.length - 1, i))]);
  };
  const button =
    "grid size-11 place-items-center rounded-xl border border-(--rule) transition-[background-color,border-color,color,opacity] duration-300 hover:border-gold hover:bg-gold hover:text-ink disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";

  return (
    <div>
      <div className="container-x flex items-end justify-between gap-8">
        {head}
        <div data-aos="fade-up" className="hidden shrink-0 gap-3 pb-1 md:flex">
          <button type="button" aria-label={`Previous, ${label}`} disabled={edge.start} onClick={() => go(-1)} className={button}>
            <Arrow className="size-5 rotate-180" />
          </button>
          <button type="button" aria-label={`Next, ${label}`} disabled={edge.end} onClick={() => go(1)} className={button}>
            <Arrow />
          </button>
        </div>
      </div>
      <ul ref={rail} aria-label={label} tabIndex={0} className="rail mt-7 flex gap-4 md:mt-9 md:gap-6">
        {children}
      </ul>
    </div>
  );
}

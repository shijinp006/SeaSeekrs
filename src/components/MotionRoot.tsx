"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// Mobile browsers resize the viewport as the address bar hides/shows; don't re-measure pins for that.
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Smooth scrolling (Lenis, synced to GSAP's ticker) plus the declarative scroll animations:
 *  data-reveal   fade + rise + unblur when it enters (data-delay="0.2" to stagger)
 *  data-img      image wrapper that unmasks while its inner <img> settles from a zoom
 *  data-parallax vertical drift while scrolling (value = yPercent strength, can be negative)
 *  data-drift    horizontal drift of a row (value = xPercent strength)
 *  data-count    number that counts up when visible
 */
export default function MotionRoot() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Always open at the hero (pinned camera sequences shouldn't resume half-way through on reload),
    // unless the URL points at a section. The <head> script in layout.tsx does the same before load.
    history.scrollRestoration = "manual";
    if (!location.hash) window.scrollTo(0, 0);

    const lenis = reduce
      ? null
      : new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // In-page anchor links scroll smoothly through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || !lenis) return;
      const target = document.querySelector(a.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      lenis.start(); // a link inside the open menu: resume before scrolling
      lenis.scrollTo(target as HTMLElement, { duration: 1.8, force: true });
    };
    document.addEventListener("click", onClick);

    // The mobile menu pauses smooth scrolling while it is open
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis?.stop() : lenis?.start());
    window.addEventListener("seaseekers:scroll-lock", onLock);

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      if (reduce) return;

      /**
       * Plays `tween` every time `el` enters the view and plays it backwards as `el` leaves —
       * in both scroll directions. So scrolling up away from a section (even a little) and
       * coming back into it always animates it in again.
       */
      const replayOnScroll = (el: HTMLElement, tween: gsap.core.Tween, start = "top 88%") => {
        // from a full reset, restart keeps the stagger delay; mid-way, just turn around
        const enter = () => (tween.progress() === 0 ? tween.restart(true) : tween.play());
        const leave = () => tween.reverse();
        ScrollTrigger.create({
          trigger: el,
          start,
          end: "bottom 12%",
          onEnter: enter,
          onEnterBack: enter,
          onLeave: leave,
          onLeaveBack: leave,
        });
      };

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const tween = gsap.from(el, {
          y: 48,
          opacity: 0,
          filter: "blur(10px)",
          duration: 1.5,
          ease: "power3.out",
          delay: Number(el.dataset.delay || 0),
          paused: true,
        });
        replayOnScroll(el, tween);
      });

      gsap.utils.toArray<HTMLElement>("[data-img]").forEach((el) => {
        const inner = el.querySelector("img");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 98%", end: "top 35%", scrub: 1 },
        });
        tl.fromTo(el, { clipPath: "inset(14% 10% 14% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0);
        if (inner) tl.fromTo(inner, { scale: 1.3 }, { scale: 1, ease: "none" }, 0);
      });

      const parallax = (el: HTMLElement, s: number) =>
        gsap.fromTo(
          el,
          { yPercent: s },
          { yPercent: -s, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => parallax(el, Number(el.dataset.parallax || 10)));
      // Cards in a tight grid would drift into each other — only drift where the layout spreads them out.
      mm.add("(min-width: 1024px)", () => {
        gsap.utils
          .toArray<HTMLElement>("[data-parallax-lg]")
          .forEach((el) => parallax(el, Number(el.dataset.parallaxLg || 10)));
      });

      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
        const s = Number(el.dataset.drift || 15);
        gsap.fromTo(
          el,
          { xPercent: 0 },
          { xPercent: -s, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const obj = { v: 0 };
        const tween = gsap.to(obj, {
          v: end,
          duration: 2.4,
          ease: "power2.out",
          paused: true,
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        });
        replayOnScroll(el, tween, "top 88%");
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    refresh();

    // The page width changes without a window resize event when the vertical scrollbar
    // appears/disappears — re-measure the pins then too.
    let lastWidth = document.documentElement.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = document.documentElement.clientWidth;
      if (w !== lastWidth) {
        lastWidth = w;
        refresh();
      }
    });
    ro.observe(document.documentElement);

    return () => {
      ctx.revert();
      mm.revert();
      ro.disconnect();
      document.removeEventListener("click", onClick);
      window.removeEventListener("seaseekers:scroll-lock", onLock);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}

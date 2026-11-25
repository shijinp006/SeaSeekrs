"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { Aos } from "@/lib/motion";
import { heldIn, openings, stagePoint, stages } from "@/lib/stages";

gsap.registerPlugin(ScrollTrigger, SplitText);
// Mobile browsers resize the viewport as the address bar hides/shows; don't re-measure pins for that.
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Smooth scrolling (Lenis, synced to GSAP's ticker) plus the declarative scroll animations.
 * Pieces come in every time they are scrolled to, going down (from below) and coming back up (from above).
 * They are put away again only once they are completely out of sight, so nothing vanishes while it is read.
 *  data-aos        fade-up, fade-down, fade-left, fade-right or zoom-in (data-aos-delay="120": milliseconds)
 *  data-aos-img    on a picture frame: the picture inside also settles from a slight zoom
 *  data-lines      heading whose lines rise one after another
 *  data-drift      inside a frame: gentle parallax
 * Tied to the scroll (lib/stages): data-stage sections, and data-opens picture frames.
 */
export default function MotionRoot() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;

    // Always open at the hero (pinned camera sequences shouldn't resume half-way through on reload),
    // unless the URL points at a section. The <head> script in layout.tsx does the same before load.
    history.scrollRestoration = "manual";
    if (!location.hash) window.scrollTo(0, 0);

    // One continuous glide for the whole page, hero included
    const lenis = reduce ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const glideTo = (y: number) => {
      const screens = Math.abs(y - window.scrollY) / window.innerHeight;
      lenis?.scrollTo(y, {
        duration: gsap.utils.clamp(1.2, 2.6, 1 + screens * 0.12),
        easing: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
        force: true,
      });
    };
    const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

    // In-page anchor links scroll smoothly through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = a && lenis && document.querySelector(a.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      lenis.start(); // a link inside the open menu: resume before scrolling
      glideTo(top(target) + stagePoint(target));
    };
    document.addEventListener("click", onClick);

    // The mobile menu pauses smooth scrolling while it is open
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis?.stop() : lenis?.start());
    window.addEventListener("seaseekers:scroll-lock", onLock);

    const moving: Element[] = []; // everything the arrivals move, to be put back on unmount
    const ctx = gsap.context(() => {
      if (reduce) return;
      const all = (q: string) => gsap.utils.toArray<HTMLElement>(q);

      // ---- fetch every picture a screen ahead, so none arrives empty
      all("[data-aos-img], [data-stage]").forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 220%",
          once: true,
          // and unpacked before they are needed, which would otherwise hold up the scroll for a moment
          onEnter: () =>
            el.querySelectorAll("img").forEach((img) => {
              img.loading = "eager";
              img.decode().catch(() => {});
            }),
        }),
      );

      // the large pictures of the stages one after another from the start: they take a while, and must not come late
      const large = all("[data-stage] .stage-pic img, [data-stage-pic] img") as HTMLImageElement[];
      const next = () => {
        const img = large.shift();
        if (!img) return;
        img.loading = "eager";
        img.fetchPriority = "high"; // ahead of the rest of the hero film, which plays from what it has
        if (img.complete) next();
        else for (const type of ["load", "error"]) img.addEventListener(type, next, { once: true });
      };
      next();

      // ---- arrivals
      /** `show` each time the piece scrolls into view, from either side; `hide` once it is fully out of sight */
      const eachVisit = (trigger: HTMLElement, show: (dir: 1 | -1) => void, hide: () => void) => {
        let shown = false;
        const enter = (dir: 1 | -1) => {
          if (shown) return;
          shown = true;
          show(dir);
        };
        const leave = () => {
          if (!shown) return;
          shown = false;
          hide();
        };
        hide();
        const endTrigger = heldIn(trigger) ?? trigger; // inside a held section it stays in view until that one leaves
        // in this order: a jump right past a piece shows and then hides it
        ScrollTrigger.create({
          trigger,
          endTrigger,
          start: "clamp(top 90%)",
          end: "bottom 10%",
          onEnter: () => enter(1),
          onEnterBack: () => enter(-1),
        });
        ScrollTrigger.create({ trigger, endTrigger, start: "top bottom", end: "bottom top", onLeave: leave, onLeaveBack: leave });
      };

      const narrow = window.innerWidth < 768; // sideways moves become up and down ones: there is no room beside the text
      const FROM: Record<Aos, (dir: 1 | -1) => gsap.TweenVars> = {
        "fade-up": (dir) => ({ y: 56 * dir }),
        "fade-down": (dir) => ({ y: -56 * dir }),
        "fade-left": (dir) => (narrow ? { y: 48 * dir } : { x: 72 }),
        "fade-right": (dir) => (narrow ? { y: 48 * dir } : { x: -72 }),
        "zoom-in": () => ({ scale: 0.88 }),
      };
      all("[data-aos]").forEach((el) => {
        const imgs = el.hasAttribute("data-aos-img") ? [...el.querySelectorAll("img")] : [];
        const delay = Number(el.dataset.aosDelay || 0) / 1000;
        moving.push(el, ...imgs);
        eachVisit(
          el,
          (dir) => {
            gsap.fromTo(
              el,
              { opacity: 0, x: 0, y: 0, scale: 1, ...FROM[el.dataset.aos as Aos](dir) },
              { opacity: 1, x: 0, y: 0, scale: 1, duration: 1, delay, ease: "power3.out", overwrite: true },
            );
            if (imgs.length) gsap.fromTo(imgs, { scale: 1.18 }, { scale: 1, duration: 1.6, delay, ease: "power3.out", overwrite: true });
          },
          // hidden without any offset, so that its place on the page is always measured right
          () => gsap.set(el, { opacity: 0, x: 0, y: 0, scale: 1, overwrite: true }),
        );
      });

      all("[data-lines]").forEach((el) => {
        let lines: Element[] = [];
        let up = false;
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          // split anew when the width changes: the new lines take over the state of the old ones
          onSplit: (self) => {
            lines = self.lines;
            moving.push(...lines);
            gsap.set(lines, { yPercent: up ? 0 : 115 });
          },
        });
        eachVisit(
          el,
          (dir) => {
            up = true;
            gsap.fromTo(
              lines,
              { yPercent: 115 * dir },
              { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: { each: 0.11, from: dir > 0 ? "start" : "end" }, overwrite: true },
            );
          },
          () => {
            up = false;
            gsap.set(lines, { yPercent: 115, overwrite: true });
          },
        );
      });

      // ---- tied to the scroll
      stages();
      openings();
      all("[data-drift]").forEach((el) =>
        gsap.fromTo(
          el,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement!, start: "top bottom", end: "bottom top", scrub: true },
          },
        ),
      );
    });

    // Pins change the page height; without this Lenis can cap the first anchor jump short of its target
    const syncLenis = () => lenis?.resize();
    ScrollTrigger.addEventListener("refresh", syncLenis);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    refresh();
    // The hero's pin has just been added above every section: go where the address asked for
    const asked = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (asked) {
      if (lenis) lenis.scrollTo(top(asked) + stagePoint(asked), { immediate: true, force: true });
      else window.scrollTo(0, top(asked));
    }

    // The page changes size without a window resize: the scrollbar appears, a question opens
    let timer = 0;
    let lastWidth = root.clientWidth;
    let lastHeight = document.body.offsetHeight;
    const ro = new ResizeObserver(() => {
      const w = root.clientWidth;
      const h = document.body.offsetHeight;
      if (w === lastWidth && Math.abs(h - lastHeight) < 2) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refresh();
        lastWidth = root.clientWidth;
        lastHeight = document.body.offsetHeight;
      }, 250);
    });
    ro.observe(document.body);

    return () => {
      window.clearTimeout(timer);
      ScrollTrigger.removeEventListener("refresh", syncLenis);
      gsap.killTweensOf(moving);
      ctx.revert();
      gsap.set(moving, { clearProps: "transform,opacity" });
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

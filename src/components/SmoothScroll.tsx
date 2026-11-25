"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** For the pages without MotionRoot: its glide, and the arrival of what carries data-aos (below the first screen, once) */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 0.95, stopInertiaOnNavigate: true });
    // In-page links, without the address: in the studio's preview the browser would scroll the studio around it too
    const onClick = (e: MouseEvent) => {
      const href = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')?.getAttribute("href");
      const target = href && href.length > 1 && document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      lenis.start(); // a link inside the open menu: resume before scrolling
      lenis.scrollTo(target, { force: true });
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    // The mobile menu pauses smooth scrolling while it is open
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start());
    window.addEventListener("seaseekers:scroll-lock", onLock);
    // What is on the first screen is there with the page; the rest comes in as it is scrolled to
    const later = [...document.querySelectorAll<HTMLElement>("main [data-aos], footer [data-aos]")].filter(
      (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().top > window.innerHeight * 0.92,
    );
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          io.unobserve(target);
          const el = target as HTMLElement;
          el.style.opacity = "";
          const timing = { duration: 1400, delay: Number(el.dataset.aosDelay || 0), easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" as const };
          el.animate([{ opacity: 0, transform: "translateY(48px)" }, { opacity: 1, transform: "none" }], timing);
          el.querySelectorAll("img").forEach((img) =>
            img.animate([{ transform: "scale(1.16)" }, { transform: "none" }], { ...timing, duration: 2200 }),
          );
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    later.forEach((el) => {
      el.style.opacity = "0";
      io.observe(el);
    });
    return () => {
      io.disconnect();
      later.forEach((el) => (el.style.opacity = ""));
      document.removeEventListener("click", onClick);
      window.removeEventListener("seaseekers:scroll-lock", onLock);
      lenis.destroy();
    };
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** The glide of the home page (MotionRoot), without its animations: for the pages that only scroll */
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
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("seaseekers:scroll-lock", onLock);
      lenis.destroy();
    };
  }, []);
  return null;
}

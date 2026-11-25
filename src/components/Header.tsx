"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { company } from "@/lib/content";
import { BTN } from "@/lib/motion";

/** Tells MotionRoot to pause / resume smooth scrolling while the menu covers the page. */
const setScrollLocked = (locked: boolean) => {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  window.dispatchEvent(new CustomEvent("seaseekers:scroll-lock", { detail: locked }));
};

export default function Header({
  links: items,
  cta,
  email,
  mobile,
  logoAlt,
  home = true,
}: {
  links: { href: string; label: string }[];
  cta: string;
  email: string;
  mobile: string;
  logoAlt: string;
  /** on the home page, where #links stay on the page */
  home?: boolean;
}) {
  const at = (href: string) => (!home && href.startsWith("#") ? `/${href}` : href);
  const links = items.map((l) => ({ ...l, href: at(l.href) }));
  const [open, setOpen] = useState(false);
  // Clear over the hero and the full-screen pictures; frosted glass in the page's own tone elsewhere
  const [glass, setGlass] = useState(false);
  // Steps aside while reading on, comes back at the first scroll up
  const [away, setAway] = useState(false);

  useEffect(() => {
    let raf = 0;
    let turn = window.scrollY; // where the scroll last changed direction
    let last = turn;
    let down = false;
    const check = () => {
      raf = 0;
      const after = document.querySelector("[data-after-hero]");
      const past = after ? after.getBoundingClientRect().top <= 72 : window.scrollY > 40;
      const over = [...document.querySelectorAll("[data-over]")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 40 && r.bottom > 40;
      });
      setGlass(past && !over);

      const y = window.scrollY;
      if (y !== last && y > last !== down) {
        down = y > last;
        turn = last;
      }
      last = y;
      if (!past) setAway(false);
      else if (Math.abs(y - turn) > 60) setAway(down);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // The hero's pin spacer is added after first paint and changes where the next section sits
    const ro = new ResizeObserver(check);
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const solid = glass && !open; // over the open (navy) menu the bar stays light-on-dark

  useEffect(() => {
    setScrollLocked(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Rotating a tablet to landscape (desktop nav) closes the menu
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  useEffect(() => () => setScrollLocked(false), []);

  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Full-screen menu (phones & tablets) */}
      <div
        id="site-menu"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-0 bg-navy-deep text-white transition-[clip-path] duration-[900ms] ease-[cubic-bezier(0.77,0,0.18,1)] lg:hidden ${
          open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        <div className="container-x flex h-full flex-col justify-between pb-10 pt-28 sm:pt-32">
          <nav aria-label="Menu">
            <ul className="space-y-2 sm:space-y-4">
              {links.map((l, i) => (
                <li key={i} className="overflow-hidden">
                  <a
                    href={l.href}
                    onClick={close}
                    style={{ transitionDelay: open ? `${300 + i * 80}ms` : "0ms" }}
                    className={`group flex items-baseline gap-5 py-1 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                      open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                    }`}
                  >
                    <span className="kicker text-white/40">0{i + 1}</span>
                    <span className="serif text-[clamp(2rem,min(10vw,7svh),4.5rem)] leading-[1.05] transition-colors group-hover:text-gold">
                      {l.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            style={{ transitionDelay: open ? "650ms" : "0ms" }}
            className={`flex flex-col gap-6 border-t border-white/15 pt-8 transition-opacity duration-700 sm:flex-row sm:items-end sm:justify-between ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            <address className="space-y-1 text-sm not-italic text-white/60">
              <p>{email}</p>
              <p>{mobile} · Dubai UAE</p>
            </address>
            <a
              href={at("#contact")}
              onClick={close}
              className={`self-start bg-gold px-10 py-4 font-medium text-navy-deep hover:bg-[#e0c07d] sm:self-auto ${BTN}`}
            >
              {cta}
            </a>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div
        className={`relative border-b transition-[translate,border-color,background-color] duration-500 ease-out ${
          solid
            ? "border-(--rule) bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] text-(--fg)"
            : "border-transparent text-white"
        } ${away && !open ? "-translate-y-full focus-within:translate-y-0" : ""}`}
      >
        <div
          className={`container-x flex items-center justify-between transition-[padding] duration-500 ${
            solid ? "py-2" : "py-3 md:py-4"
          }`}
        >
          <a href={home ? "#top" : "/"} onClick={close} className="shrink-0 cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <Image
              src={company.logo.src}
              width={81}
              height={72}
              alt={logoAlt}
              preload
              className={`w-auto transition-[height,filter] duration-500 ${solid ? "h-11 md:h-12" : "h-14 brightness-150 md:h-[4.5rem]"}`}
            />
          </a>
          <nav aria-label="Main" className="flex items-center gap-6 sm:gap-8">
            <ul className="hidden items-center gap-8 lg:flex">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="relative cursor-pointer py-2 text-[0.95rem] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-[scale] after:duration-500 hover:after:scale-x-100">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Three-line menu button → turns into an X */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative -mr-2 grid h-10 w-10 place-items-center lg:hidden"
            >
              <span className="relative block h-3.5 w-7">
                <span
                  className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    open ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-px w-full bg-current transition-[opacity,transform] duration-300 ${
                    open ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-px bg-current transition-[transform,width] duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    open ? "w-full -translate-y-[7px] -rotate-45" : "w-4"
                  }`}
                />
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

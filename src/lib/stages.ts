import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Aos } from "./motion";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = gsap.utils.clamp(0, 1);
const px = (v: number) => `${v.toFixed(1)}px`;
const FROM: Record<Aos, gsap.TweenVars> = {
  "fade-up": { y: 56 },
  "fade-down": { y: -56 },
  "fade-left": { x: 72 },
  "fade-right": { x: -72 },
  "zoom-in": { scale: 0.86 },
};
/** Seconds the picture takes to catch up with the scroll: one turn of the wheel becomes one even movement */
const SOFT = 0.4;

/** How words come in: headings rise out of a line, as if from behind an edge; the rest floats up */
const words = (el: HTMLElement, from: gsap.TweenVars): gsap.TweenVars =>
  el.matches("h1, h2, h3, .display")
    ? { opacity: 0, y: 46, clipPath: "inset(0% 0% 100% 0%)" }
    : { opacity: 0, clipPath: "inset(-10% -10% -10% -10%)", ...from };
const THERE = { opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(-20% -10% -20% -10%)" };

/** Stages are only held where there is room for them: see .stage in globals.css */
const held = (view: Element) => getComputedStyle(view).position === "sticky";

/** The held stage a piece belongs to, if any */
export const heldIn = (el: Element) => {
  const stage = el.closest<HTMLElement>("[data-stage]");
  return stage && held(stage.firstElementChild!) ? stage : null;
};

/** For links: how far into a stage its words are there */
export const stagePoint = (el: Element) => {
  if (!(el instanceof HTMLElement) || !["open", "aside"].includes(el.dataset.stage ?? "") || !held(el.firstElementChild!)) return 0;
  return (el.offsetHeight - window.innerHeight) * 0.88;
};

// ---------------------------------------------------------------- ways for a picture to fill the screen
// Each gets 0 → 1, and whatever it needs is measured anew by `fit`.
type Opening = { fit: () => void; draw: (t: number) => void; clear: () => void };

/** An arch one goes in through: it keeps its form and comes closer until it lies behind the edges of the screen */
const portal = (view: HTMLElement, pic: HTMLElement): Opening => {
  let w = 0, h = 0, arch = 0, tall = 0, most = 1;
  return {
    fit() {
      w = view.clientWidth;
      h = view.clientHeight;
      arch = Math.min(w * (w < 768 ? 0.62 : 0.28), h * 0.5);
      tall = Math.min(arch * 1.35, h * 0.72);
      // how close until the corners of the screen are inside
      for (most = 1; most < 60; most *= 1.02) {
        const r = (arch * most) / 2, below = (tall * most) / 2 - r; // the round part starts this far above the middle
        const up = h / 2 - below;
        if (r > w / 2 && (tall * most) / 2 > h / 2 && (up <= 0 || Math.hypot(w / 2, up) < r)) break;
      }
    },
    draw(t) {
      if (t >= 1) return void (pic.style.clipPath = "none");
      const s = most ** t; // evenly nearer, as when walking up to it
      const side = (w - arch * s) / 2, above = (h - tall * s) / 2, r = (arch * s) / 2;
      pic.style.clipPath = `inset(${px(above)} ${px(side)} ${px(above)} ${px(side)} round ${px(r)} ${px(r)} 0 0)`;
    },
    clear: () => void (pic.style.clipPath = ""),
  };
};

/** Upright slices of the picture, of different heights, that grow together */
const slices = (view: HTMLElement, pic: HTMLElement): Opening => {
  let w = 0, h = 0;
  const HEIGHT = [0.34, 0.56, 0.78, 0.5, 0.86, 0.62, 0.42];
  return {
    fit() {
      w = view.clientWidth;
      h = view.clientHeight;
    },
    draw(t) {
      if (t >= 1) return void (pic.style.clipPath = "none");
      const n = w < 768 ? 4 : 7, cell = w / n;
      let d = "";
      for (let i = 0; i < n; i++) {
        const own = clamp(t * 1.35 - (Math.abs(i - (n - 1) / 2) / n) * 0.7); // from the middle outwards
        const wide = cell * mix(0.62, 1, own) + (own >= 1 ? 1 : 0), high = h * mix(HEIGHT[i % HEIGHT.length], 1, own);
        const x = cell * i + (cell - wide) / 2, y = (h - high) / 2;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}h${wide.toFixed(1)}v${high.toFixed(1)}h${(-wide).toFixed(1)}z`;
      }
      pic.style.clipPath = `path("${d}")`;
    },
    clear: () => void (pic.style.clipPath = ""),
  };
};

/** A word cut out of the colour of the section; one goes in through one of its letters */
const word = (view: HTMLElement, pic: HTMLElement, text: string): Opening => {
  const cover = document.createElement("canvas");
  cover.className = "stage-cover";
  cover.ariaHidden = "true";
  pic.append(cover);
  const c = cover.getContext("2d")!;
  let w = 0, h = 0, size = 0, most = 1, at = { x: 0, y: 0 };
  let colour = "", font = "";
  return {
    fit() {
      w = view.clientWidth;
      h = view.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      cover.width = Math.round(w * scale);
      cover.height = Math.round(h * scale);
      colour = getComputedStyle(view.parentElement!).backgroundColor;
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-hero") || "serif";
      size = Math.min(w * 0.27, h * 0.62);
      font = `500 ${size}px ${family}`;
      // the widest stroke near the middle of the word is the way in
      const probe = document.createElement("canvas");
      probe.width = Math.ceil(w);
      probe.height = 1;
      const p = probe.getContext("2d")!;
      p.font = font;
      p.textAlign = "center";
      p.textBaseline = "middle";
      p.fillText(text, w / 2, size * 0.08);
      const ink = p.getImageData(0, 0, probe.width, 1).data;
      let best = { x: w / 2, wide: 2, worth: 0 };
      for (let x = 0, from = -1; x <= probe.width; x++) {
        const on = x < probe.width && ink[x * 4 + 3] > 200;
        if (on && from < 0) from = x;
        if (!on && from >= 0) {
          const middle = (from + x) / 2, wide = x - from;
          const worth = wide * (1 - Math.abs(middle - w / 2) / w);
          if (worth > best.worth) best = { x: middle, wide, worth };
          from = -1;
        }
      }
      at = { x: best.x - w / 2, y: -size * 0.08 };
      most = Math.max((w * 1.25) / best.wide, (h * 1.25) / (size * 0.3));
    },
    draw(t) {
      cover.style.display = t >= 1 ? "none" : "block";
      if (t >= 1) return;
      const z = most ** t, k = cover.width / w, near = t * t * (3 - 2 * t);
      c.setTransform(k, 0, 0, k, 0, 0);
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, w, h);
      c.fillStyle = colour;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = "destination-out";
      c.translate(w / 2 + at.x * (1 - near), h / 2 + at.y * (1 - near));
      c.scale(z, z);
      c.font = font;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, -at.x, -at.y);
    },
    clear: () => cover.remove(),
  };
};

/**
 * Stages: at first there is only a picture. With the scroll it changes size, and then the words come, each from its own
 * side (data-step, named like data-aos).
 *  open   the picture fills the screen and the words come over it
 *         data-shape: portal (through an arch), word (through the letters of data-word), slices
 *  aside  the picture stands in the middle, then moves to its place beside the words
 *         data-shape: settle (stands large in the middle first), curtain (opens where it is)
 *  rail   a row of cards runs sideways with the scroll
 * Call inside a gsap.context.
 */
export function stages() {
  const mm = gsap.matchMedia();
  mm.add({ room: "(min-height: 420px)", wide: "(min-width: 1024px) and (min-height: 480px)", narrow: "(max-width: 767px)" }, (ctx) => {
    const { narrow } = ctx.conditions as { narrow: boolean };
    gsap.utils.toArray<HTMLElement>("[data-stage]").forEach((stage) => {
      const view = stage.firstElementChild as HTMLElement;
      const { stage: kind, shape } = stage.dataset;
      // text that does not fit on one screen (it can be changed in the studio) is not held: nothing may be cut off
      if (held(view)) {
        const box = view.getBoundingClientRect();
        const parts = kind === "rail" ? [...view.children] : [...view.querySelectorAll("[data-step]")];
        if (parts.some((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && (r.top < box.top - 1 || r.bottom > box.bottom + 1); })) {
          stage.dataset.flat = "";
          ctx.add(() => () => void delete stage.dataset.flat);
        }
      }

      if (kind === "rail") {
        const rail = view.querySelector<HTMLElement>(".rail")!;
        if (!held(view)) return;
        const at = { x: 0 };
        gsap.to(at, {
          x: 1,
          ease: "none",
          onUpdate: () => void (rail.scrollLeft = at.x * (rail.scrollWidth - rail.clientWidth)),
          scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: SOFT },
        });
        return;
      }

      const steps = gsap.utils.toArray<HTMLElement>("[data-step]", stage);
      const aside = kind === "aside";
      const pic = stage.querySelector<HTMLElement>(aside ? "[data-stage-pic]" : ".stage-pic")!;
      const from = (el: HTMLElement) => {
        const way = el.dataset.step as Aos;
        return narrow && (way === "fade-left" || way === "fade-right") ? { y: 40 } : FROM[way];
      };

      if (!held(view)) {
        // no room to hold it: the picture opens and the words come while the section is scrolled in
        if (aside) opening(pic, "up");
        steps.forEach((el) =>
          gsap.fromTo(el, words(el, from(el)), {
            ...THERE,
            ease: "sine.out",
            scrollTrigger: { trigger: el, start: "top 98%", end: "top 64%", scrub: SOFT },
          }),
        );
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: shape === "settle" ? "top 70%" : shape === "curtain" ? "top 45%" : shape === "portal" ? "top 22%" : shape === "slices" ? "top 40%" : "top 8%", // under way before it is held: no scroll without something moving
          end: "bottom bottom",
          scrub: shape === "portal" ? true : SOFT,
          invalidateOnRefresh: true,
        },
      });
      if (aside) {
        // where the picture rests, as seen from the middle of the screen
        const rest = () => {
          let x = pic.offsetWidth / 2, y = pic.offsetHeight / 2;
          for (let e: HTMLElement | null = pic; e && e !== view; e = e.offsetParent as HTMLElement | null) {
            x += e.offsetLeft;
            y += e.offsetTop;
          }
          return { x: view.clientWidth / 2 - x, y: view.clientHeight / 2 - y };
        };
        const inner = pic.querySelector("img")!;
        if (shape === "curtain") {
          const open = { t: 0 };
          const draw = () => {
            const t = open.t;
            pic.style.clipPath = t >= 1 ? "" : `inset(${mix(12, 0, t).toFixed(2)}% ${mix(46, 0, t).toFixed(2)}% round ${mix(40, 20, t).toFixed(1)}px)`;
          };
          draw();
          tl.to(open, { t: 1, duration: 0.5, ease: "power1.inOut", onUpdate: draw }, 0);
          tl.fromTo(inner, { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "power1.out" }, 0);
          ctx.add(() => () => void (pic.style.clipPath = ""));
        } else {
          const large = () => Math.min(1.22, (view.clientHeight * 0.88) / pic.offsetHeight);
          tl.fromTo(pic, { x: () => rest().x, y: () => rest().y, scale: () => large() * 0.9, opacity: 0 }, { scale: large, opacity: 1, duration: 0.22, ease: "sine.out" }, 0);
          tl.to(pic, { x: 0, y: 0, scale: 1, duration: 0.38, ease: "power2.inOut" }, 0.2);
          tl.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 0.58, ease: "sine.inOut" }, 0);
        }
      } else {
        const image = pic.querySelector("img")!;
        const shade = pic.querySelector(".stage-shade")!;
        const still = shape === "portal";
        const way = still ? portal(view, pic) : shape === "word" ? word(view, pic, stage.dataset.word ?? "") : slices(view, pic);
        const open = { t: 0 };
        const draw = () => way.draw(open.t);
        const refit = () => {
          way.fit();
          draw();
        };
        refit();
        tl.to(open, { t: 1, duration: 0.5, ease: still ? "none" : shape === "word" ? "sine.in" : "sine.inOut", onUpdate: draw }, 0.02);
        // a layer of its own from well before it is needed: drawn once, then only moved by the graphics chip
        ScrollTrigger.create({
          trigger: stage,
          start: "top 220%",
          end: "bottom -50%",
          onToggle: (self) => void (image.style.willChange = self.isActive ? "transform" : ""),
        });
        // going in: what lies behind comes nearer too, only more slowly
        tl.fromTo(image, { scale: shape === "slices" ? 1.2 : 1 }, { scale: shape === "slices" ? 1 : 1.12, duration: 0.58, ease: "power1.inOut" }, 0);
        tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.18 }, 0.5);
        ScrollTrigger.addEventListener("refresh", refit);
        ctx.add(() => () => {
          ScrollTrigger.removeEventListener("refresh", refit);
          way.clear();
        });
      }
      const still = shape === "portal";
      const first = still ? 0.54 : 0.5;
      const gap = Math.min(0.08, 0.28 / steps.length);
      steps.forEach((el, i) => {
        if (still) tl.fromTo(el, { opacity: 0, ...from(el) }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.14, ease: "power2.out" }, first + i * gap);
        else tl.fromTo(el, words(el, from(el)), { ...THERE, duration: 0.22, ease: "sine.out" }, first + i * gap);
      });
      tl.set({}, {}, 1);
    });
  });
}

// ---------------------------------------------------------------- single pictures
export type Opens = "up" | "left" | "right" | "expand";
/** What is covered at first, as parts of the picture: from the top, right, bottom and left */
const COVERED: Record<Opens, [number, number, number, number]> = {
  up: [0.5, 0.04, 0, 0.04],
  left: [0.06, 0.42, 0.06, 0], // grows from its left edge
  right: [0.06, 0, 0.06, 0.42],
  expand: [0.14, 0.16, 0.14, 0.16],
};

/** One picture frame opening while it is scrolled in; what is written on it comes last */
function opening(el: HTMLElement, how: Opens) {
  const captions = [...el.children].slice(1).filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName !== "IMG");
  const corner = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const state = { p: 0 };
  const draw = () => {
    const left = 1 - state.p;
    el.style.clipPath = left <= 0 ? "" : `inset(${COVERED[how].map((v) => `${(v * left * 100).toFixed(2)}%`).join(" ")} round ${px(corner)})`;
    captions.forEach((c) => (c.style.opacity = clamp((state.p - 0.45) / 0.55).toFixed(3)));
  };
  draw();
  gsap.to(state, {
    p: 1,
    ease: "sine.out",
    onUpdate: draw,
    scrollTrigger: {
      trigger: el,
      start: "clamp(top 100%)",
      end: () => (el.offsetHeight > window.innerHeight * 0.75 ? "top 18%" : "center 48%"),
      scrub: 0.5,
    },
  });
  gsap.context(() => () => {
    el.style.clipPath = "";
    captions.forEach((c) => (c.style.opacity = ""));
  });
}

export const openings = () => gsap.utils.toArray<HTMLElement>("[data-opens]").forEach((el) => opening(el, el.dataset.opens as Opens));

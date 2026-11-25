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
  "zoom-in": { scale: 0.8 },
};
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
      const family = getComputedStyle(view.querySelector("h2") ?? view).fontFamily;
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
 *         data-shape: tilt (rises from lying flat), letterbox (opens from a narrow band)
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
        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            rail.scrollLeft = clamp((self.progress - 0.01) / 0.97) * (rail.scrollWidth - rail.clientWidth);
          },
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
        if (aside) opening(pic, shape === "letterbox" ? "slit" : "expand");
        steps.forEach((el) =>
          gsap.from(el, { opacity: 0, ...from(el), ease: "none", scrollTrigger: { trigger: el, start: "top 96%", end: "top 72%", scrub: true } }),
        );
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: aside ? "top 75%" : shape === "slices" ? "top 40%" : shape === "word" ? "top 8%" : "top 22%", // under way before it is held: no scroll without something moving
          end: "bottom bottom",
          scrub: true,
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
        const large = () => Math.min(1.2, (view.clientHeight * 0.86) / pic.offsetHeight);
        if (shape === "letterbox") {
          const band = { t: 0 };
          const draw = () => {
            const t = band.t;
            pic.style.clipPath = t >= 1 ? "" : `inset(${mix(43, 0, t).toFixed(2)}% ${mix(6, 0, t).toFixed(2)}% round ${mix(0, 20, t).toFixed(1)}px)`;
          };
          draw();
          tl.to(band, { t: 1, duration: 0.34, ease: "sine.inOut", onUpdate: draw }, 0.02);
          tl.fromTo(pic.querySelector("img"), { scale: 1.3 }, { scale: 1, duration: 0.36, ease: "power1.out" }, 0);
          tl.fromTo(pic, { x: () => rest().x, y: () => rest().y, scale: large }, { x: 0, y: 0, scale: 1, duration: 0.26, ease: "sine.inOut" }, 0.36);
          ctx.add(() => () => void (pic.style.clipPath = ""));
        } else {
          tl.fromTo(
            pic,
            { x: () => rest().x, y: () => rest().y, scale: () => large() * 0.8, transformPerspective: 1100, rotateX: 58 },
            { scale: large, rotateX: 0, duration: 0.36, ease: "sine.out" },
            0,
          );
          tl.to(pic, { x: 0, y: 0, scale: 1, duration: 0.26, ease: "sine.inOut" }, 0.36);
        }
      } else {
        const image = pic.querySelector("img")!;
        const shade = pic.querySelector(".stage-shade")!;
        const way = shape === "word" ? word(view, pic, stage.dataset.word ?? "") : shape === "slices" ? slices(view, pic) : portal(view, pic);
        const open = { t: 0 };
        const draw = () => way.draw(open.t);
        const refit = () => {
          way.fit();
          draw();
        };
        refit();
        tl.to(open, { t: 1, duration: 0.5, ease: shape === "slices" ? "sine.inOut" : shape === "word" ? "sine.in" : "none", onUpdate: draw }, 0.02);
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
      const first = 0.54;
      const gap = Math.min(0.08, 0.28 / steps.length);
      steps.forEach((el, i) => {
        tl.fromTo(el, { opacity: 0, ...from(el) }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.14, ease: "power2.out" }, first + i * gap);
      });
      tl.set({}, {}, 1);
    });
  });
}

// ---------------------------------------------------------------- single pictures
export type Opens = "up" | "left" | "right" | "slit" | "expand";
/** What is covered at first, as parts of the picture: from the top, right, bottom and left */
const COVERED: Record<Opens, [number, number, number, number]> = {
  up: [0.78, 0, 0, 0],
  left: [0, 0.8, 0, 0], // grows from its left edge
  right: [0, 0, 0, 0.8],
  slit: [0.42, 0, 0.42, 0],
  expand: [0.28, 0.3, 0.28, 0.3],
};

/** One picture frame opening while it is scrolled in; what is written on it comes last */
function opening(el: HTMLElement, how: Opens) {
  const words = [...el.children].slice(1).filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName !== "IMG");
  const corner = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const draw = (p: number) => {
    const left = (1 - p) ** 2;
    el.style.clipPath = left <= 0 ? "" : `inset(${COVERED[how].map((v) => `${(v * left * 100).toFixed(2)}%`).join(" ")} round ${px(corner)})`;
    words.forEach((c) => (c.style.opacity = clamp((p - 0.6) / 0.4).toFixed(3)));
  };
  ScrollTrigger.create({
    trigger: el,
    start: "clamp(top 96%)",
    end: () => (el.offsetHeight > window.innerHeight * 0.75 ? "top 30%" : "center 52%"),
    onUpdate: (self) => draw(self.progress),
    onRefresh: (self) => draw(self.progress),
  });
  gsap.context(() => () => {
    el.style.clipPath = "";
    words.forEach((c) => (c.style.opacity = ""));
  });
}

export const openings = () => gsap.utils.toArray<HTMLElement>("[data-opens]").forEach((el) => opening(el, el.dataset.opens as Opens));

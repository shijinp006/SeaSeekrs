"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type FilmCaption = { lines: [string, string]; from: number; to: number };

type Props = {
  /** Number of frames, named 001.webp … in each folder */
  frames: number;
  /** Folder for wide screens, and a lighter one for phones */
  src: { lg: string; sm: string };
  captions: FilmCaption[];
  intro?: React.ReactNode;
  /** Scroll distance for the whole film, in viewport heights */
  length?: number;
  /** Keep the film running for the last 100vh while the next section slides over it */
  overlap?: boolean;
};

const pad = (n: number) => String(n).padStart(3, "0");

/**
 * Scroll-scrubbed film: a frame sequence drawn to a canvas, so the camera moves
 * exactly with the scroll in both directions (smooth on iOS too, unlike seeking a <video>).
 */
export default function ScrollFilm({ frames, src, captions, intro, length = 6, overlap = false }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasIntro = Boolean(intro);

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const small = window.matchMedia("(max-width: 767px)").matches;
    const dir = small ? src.sm : src.lg;
    const images: HTMLImageElement[] = new Array(frames);
    const loaded: boolean[] = new Array(frames).fill(false);
    let current = 0;
    let cancelled = false;

    // ---- drawing: cover-fit like object-fit: cover, at device pixel ratio
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw(current);
    };
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < frames; d++) {
        if (loaded[i - d]) return i - d;
        if (loaded[i + d]) return i + d;
      }
      return -1;
    };
    const draw = (i: number) => {
      const k = nearestLoaded(i);
      if (k < 0) return;
      const img = images[k];
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    // ---- loading: first frame, then a coarse pass (every 8th), then fill in the gaps
    const order: number[] = [0];
    for (let i = 8; i < frames; i += 8) order.push(i);
    for (let i = 1; i < frames; i++) if (i % 8) order.push(i);
    let next = 0;
    const loadOne = () => {
      if (cancelled || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      img.src = `${dir}/${pad(i + 1)}.webp`;
      img.onload = () => {
        if (cancelled) return;
        loaded[i] = true;
        if (Math.abs(i - current) <= 8) draw(current);
        loadOne();
      };
      img.onerror = loadOne;
      images[i] = img;
    };
    for (let c = 0; c < 6; c++) loadOne(); // 6 parallel requests

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const caps = el.querySelectorAll<HTMLElement>(".sf-cap");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      caps.forEach((c, i) => (c.style.opacity = i === 0 && !hasIntro ? "1" : "0"));
      return () => {
        cancelled = true;
        ro.disconnect();
      };
    }

    const k = window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches ? 0.5 : 1;
    const blur = (px: number) => `blur(${Math.round(px * k)}px)`;
    const tail = overlap ? 1 : 0; // last viewport: next section slides over the still-moving film
    const total = length + tail;

    const gctx = gsap.context(() => {
      const playhead = { f: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => "+=" + window.innerHeight * total,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Film runs across the whole pinned scroll, including the overlap tail
      tl.to(
        playhead,
        {
          f: frames - 1,
          duration: total,
          onUpdate: () => {
            const i = Math.round(playhead.f);
            if (i !== current) {
              current = i;
              draw(i);
            }
          },
        },
        0,
      );

      if (hasIntro) tl.to(".sf-intro", { opacity: 0, y: -80, filter: blur(14), duration: 0.5, ease: "power1.in" }, 0.1);

      // Captions: `from` / `to` are fractions of the film
      captions.forEach((c, i) => {
        const a = c.from * total, b = c.to * total;
        tl.fromTo(
          caps[i],
          { opacity: 0, y: 60, filter: blur(18), letterSpacing: "0.04em" },
          { opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0em", duration: 0.5, ease: "power2.out" },
          a,
        );
        if (c.to < 1) tl.to(caps[i], { opacity: 0, y: -60, filter: blur(18), duration: 0.4, ease: "power2.in" }, b - 0.4);
      });
      tl.set({}, {}, total);
    }, el);

    return () => {
      cancelled = true;
      ro.disconnect();
      gctx.revert();
    };
  }, [frames, src.lg, src.sm, captions, hasIntro, length, overlap]);

  return (
    // React-owned wrapper keeps GSAP's pin-spacer DOM move invisible to React
    <div>
      <section ref={root} className="relative h-[100svh] overflow-hidden bg-navy-deep text-white">
        {/* poster until the first frame is decoded */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${src.sm}/001.webp)` }}
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Camera flies toward a superyacht at anchor, over its aft-deck pool and into the main salon"
        />
        {/* cinematic grade + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/5 to-black/45" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.4)]" />

        {intro && <div className="sf-intro absolute inset-0">{intro}</div>}

        {captions.map((c, i) => (
          <div
            key={i}
            className="sf-cap pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center"
            style={{ opacity: 0 }}
          >
            <h2 className="serif text-[clamp(2.4rem,min(9.5vw,11svh),5.75rem)] leading-[1.05] drop-shadow-[0_2px_30px_rgba(0,0,0,0.45)]">
              {c.lines[0]}
              <br />
              {c.lines[1]}
            </h2>
          </div>
        ))}
      </section>
    </div>
  );
}

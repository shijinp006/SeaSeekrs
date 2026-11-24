"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type FilmCaption = { lines: [string, string]; from: number; to: number };

type Props = {
  /** Number of frames. Each folder holds them as film.bin + film.json, and as stills 001.avif / 001.webp … */
  frames: number;
  /** Folder with full 16:9 frames, and one with a 3:4 centre crop for portrait phones */
  src: { lg: string; sm: string };
  captions: FilmCaption[];
  intro?: React.ReactNode;
  /** Scroll distance for the whole film, in viewport heights */
  length?: number;
  /** Keep the film running for the last 100vh while the next section slides over it */
  overlap?: boolean;
};

/** film.json, written by scripts/export-hero-film.mjs: the pieces of film.bin, in the order they are stored */
type FilmIndex = { codec: string; width: number; height: number; gop: number; order: number[]; sizes: number[] };

const pad = (n: number) => String(n).padStart(3, "0");

/** Screens no wider than the 3:4 crop, so it covers them at full source height */
const PORTRAIT = "(max-width: 767px) and (max-aspect-ratio: 3/4)";

/**
 * Scroll-scrubbed film drawn to a canvas, so the camera moves exactly with the scroll in both directions (smooth on
 * iOS too, unlike seeking a <video>). The frames come from the device's video decoder through WebCodecs, which costs
 * next to no processor time; browsers without it get the same film as still pictures.
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

    const portrait = window.matchMedia(PORTRAIT);
    let blobs: (Blob | undefined)[] = []; // downloaded frames, still compressed
    let bitmaps = new Map<number, ImageBitmap>(); // decoded frames around the playhead, ready to draw
    let decoding = new Set<number>();
    let current = 0;
    let heading = 1; // which way the playhead last moved
    let visible = true;
    let batch = 0; // bumped to abandon work in flight (rotation, unmount)
    let aborter = new AbortController();
    let ext = "avif";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- drawing: cover-fit like object-fit: cover, at most once per screen refresh.
    // A frame lasts some 20px of scroll, which shows as steps when scrolling slowly. So while the film moves
    // slowly the next frame fades in over this one; at rest it always settles on one clean frame.
    const playhead = { f: 0 };
    let dirty = true;
    let lastF = 0;
    let rest = 1; // 0 while moving → 1 once still
    const size = () => {
      // never more pixels than the film has: the browser scales the finished picture up for free
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1920 / cw, 1080 / ch);
      const w = Math.round(cw * scale), h = Math.round(ch * scale);
      if (w === canvas.width && h === canvas.height) return; // setting it clears the picture
      canvas.width = w;
      canvas.height = h;
      paint();
    };
    const put = (img: ImageBitmap, alpha: number) => {
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.width, ch / img.height);
      const w = img.width * s, h = img.height * s;
      ctx2d.globalAlpha = alpha;
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };
    const paint = () => {
      dirty = false;
      ctx2d.imageSmoothingEnabled = true;
      ctx2d.imageSmoothingQuality = "high"; // resizing the canvas resets it
      const i = Math.floor(playhead.f);
      const a = bitmaps.get(i), b = bitmaps.get(i + 1);
      const part = playhead.f - i;
      const mix = part + (Math.round(part) - part) * rest;
      if (a && b && mix > 0.02 && mix < 0.98) {
        put(a, 1);
        put(b, mix);
        ctx2d.globalAlpha = 1;
        return;
      }
      let best = -1;
      for (const k of bitmaps.keys()) if (best < 0 || Math.abs(k - current) < Math.abs(best - current)) best = k;
      const img = bitmaps.get(best);
      if (img) put(img, 1);
    };
    const draw = () => {
      dirty = true;
    };
    let stride = 1; // decode every frame, or while rushing through only every 2nd or 4th
    const tick = (_time: number, delta: number) => {
      const speed = Math.abs(playhead.f - lastF);
      lastF = playhead.f;
      const step = speed > 3 ? 4 : speed > 1.4 ? 2 : 1;
      if (step !== stride) {
        stride = step;
        pump();
      }
      const was = rest;
      // quick moves need no in-between pictures; they would only blur
      if (speed > 1.2) rest = 1;
      else if (speed > 0.004) rest = Math.max(0, rest - delta / 120);
      else rest = Math.min(1, rest + delta / 220);
      if (rest !== was || speed > 0) dirty = true;
      if (dirty && visible) paint();
    };
    gsap.ticker.add(tick);

    // ---- decoding: a window of frames around the playhead is kept decoded, mostly ahead of it
    const AHEAD = 16, BEHIND = 8;
    const DECODERS = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) >> 1)); // leave room for the page itself
    const inWindow = (i: number, slack = 0) => {
      const d = (i - current) * heading;
      return i === current || (visible && d <= AHEAD + slack && d >= -BEHIND - slack);
    };

    // ---- the film: groups of `gop` frames, each starting on a key frame, decoded one group at a time
    let units: (Uint8Array<ArrayBuffer> | undefined)[] | null = null; // the pieces downloaded so far; null: using stills
    let gop = 4;
    let config: VideoDecoderConfig;
    let decoder: VideoDecoder | null = null;
    let pending: Promise<void>[] = [];
    let working = false;
    let failures = 0;
    let made = 0; // frames the decoder has handed back
    const openDecoder = () => {
      if (decoder && decoder.state !== "closed") return decoder; // the browser may take an idle one away
      const id = batch;
      decoder = new VideoDecoder({
        output: (frame) => {
          made++;
          const i = Math.round(frame.timestamp / 1000);
          if (id !== batch || bitmaps.has(i) || !(inWindow(i, gop) || !bitmaps.size)) return frame.close();
          const copy = createImageBitmap(frame)
            .then((img) => {
              if (id !== batch || bitmaps.has(i)) return img.close();
              bitmaps.set(i, img);
              draw();
            })
            .finally(() => frame.close());
          pending.push(copy);
        },
        error: () => {}, // flush() rejects as well
      });
      decoder.configure(config);
      return decoder;
    };
    /** The next group worth decoding, and how many of its frames */
    const nextGroup = (): [number, number] | null => {
      if (!units) return null;
      const here = Math.floor(current / gop);
      const last = Math.floor((frames - 1) / gop);
      const reach = Math.ceil(AHEAD / gop) + 1;
      for (let d = 0; d <= reach; d++) {
        for (const g of d ? [here + d * heading, here - d * heading] : [here]) {
          if (g < 0 || g > last) continue;
          let n = 0;
          while (n < gop && units[g * gop + n]) n++;
          if (stride > 2) n = Math.min(n, 1); // rushing through: key frames will do
          for (let k = 0; k < n; k++) if (inWindow(g * gop + k) && !bitmaps.has(g * gop + k)) return [g, n];
        }
      }
      // not downloaded yet: the nearest key frame there is stands in
      if (!bitmaps.size) {
        for (let d = 0; d <= last; d++) {
          for (const g of [here - d, here + d]) if (g >= 0 && g <= last && units[g * gop]) return [g, 1];
        }
      }
      return null;
    };
    const work = async () => {
      if (working) return;
      working = true;
      const id = batch;
      try {
        for (let next = nextGroup(); next && id === batch; next = nextGroup()) {
          const [g, n] = next;
          const dec = openDecoder();
          made = 0;
          for (let k = 0; k < n; k++) {
            const timestamp = (g * gop + k) * 1000;
            dec.decode(new EncodedVideoChunk({ type: k ? "delta" : "key", timestamp, data: units![g * gop + k]! }));
          }
          await dec.flush();
          if (!made) throw new Error("no picture");
          await Promise.all(pending);
          pending = [];
          if (id === batch && failures && bitmaps.size) failures = 0;
        }
      } catch {
        pending = [];
        if (id === batch && ++failures > 3) {
          units = null; // this device's decoder won't have it
          loadStills();
        }
      }
      working = false;
      if (id !== batch || (failures && units)) work();
    };

    const pump = () => {
      let nearest = -1; // stays whatever happens: something to show
      for (const i of bitmaps.keys()) if (nearest < 0 || Math.abs(i - current) < Math.abs(nearest - current)) nearest = i;
      for (const [i, img] of bitmaps) {
        if (i !== nearest && !inWindow(i, gop)) {
          img.close();
          bitmaps.delete(i);
        }
      }
      if (units) {
        work();
        return;
      }
      const wanted: number[] = [];
      for (let d = 0; d < frames && wanted.length < DECODERS; d++) {
        const near = d ? [current + d * heading, current - d * heading] : [current];
        for (const i of near) {
          if (!blobs[i] || (i % stride && i !== frames - 1 && bitmaps.size)) continue;
          // until the gaps are downloaded, the nearest frame there is stands in
          if (!inWindow(i) && (wanted.length || bitmaps.size)) continue;
          if (!bitmaps.has(i) && !decoding.has(i)) wanted.push(i);
        }
        if (d > AHEAD && (wanted.length || bitmaps.size)) break;
      }
      for (const i of wanted) if (decoding.size < DECODERS) decode(i);
    };
    const decode = async (i: number) => {
      const id = batch;
      const busy = decoding;
      busy.add(i);
      try {
        const img = await createImageBitmap(blobs[i]!);
        if (id !== batch) return img.close();
        bitmaps.set(i, img);
        if (Math.abs(i - current) <= 8 || bitmaps.size === 1) draw();
      } catch {
        blobs[i] = undefined; // damaged download: its neighbours stand in
      } finally {
        busy.delete(i);
      }
      if (id === batch) pump();
    };

    // ---- loading the film: its pieces arrive coarse to fine, and play as they come
    const load = async () => {
      const id = ++batch;
      aborter.abort();
      aborter = new AbortController();
      const { signal } = aborter;
      if (decoder && decoder.state !== "closed") decoder.close();
      decoder = null;
      units = null;
      failures = 0;
      if (reduce || !("VideoDecoder" in window)) return loadStills();
      try {
        const dir = portrait.matches ? src.sm : src.lg;
        const index: FilmIndex = await fetch(`${dir}/film.json`, { signal }).then((r) => r.json());
        config = { codec: index.codec, codedWidth: index.width, codedHeight: index.height, optimizeForLatency: true };
        const { supported } = await VideoDecoder.isConfigSupported(config);
        if (id !== batch) return;
        if (!supported || index.order.length !== frames) return loadStills();
        const body = (await fetch(`${dir}/film.bin`, { signal })).body!.getReader();
        if (id !== batch) return;
        bitmaps.forEach((img) => img.close());
        bitmaps = new Map();
        gop = index.gop;
        const pieces: (Uint8Array<ArrayBuffer> | undefined)[] = new Array(frames);
        units = pieces;
        let k = 0, filled = 0;
        let piece = new Uint8Array(index.sizes[0]);
        for (;;) {
          const { done, value } = await body.read();
          if (done || id !== batch) return;
          let from = 0;
          while (from < value.length && k < frames) {
            const part = value.subarray(from, from + piece.length - filled);
            piece.set(part, filled);
            filled += part.length;
            from += part.length;
            if (filled < piece.length) break;
            const i = index.order[k++];
            pieces[i] = piece;
            filled = 0;
            if (k < frames) piece = new Uint8Array(index.sizes[k]);
            if (!bitmaps.size || inWindow(i)) work();
          }
        }
      } catch {
        if (id === batch && !units) loadStills();
      }
    };

    // ---- loading the stills: first frame (settles AVIF or WebP), then a coarse pass (every 8th), then fill in the gaps
    const order: number[] = [];
    for (let i = 8; i < frames; i += 8) order.push(i);
    for (let i = 1; i < frames; i++) if (i % 8) order.push(i);
    const loadStills = async () => {
      const id = ++batch;
      aborter.abort();
      aborter = new AbortController();
      const { signal } = aborter;
      const dir = portrait.matches ? src.sm : src.lg;
      const get = async (i: number) => {
        const r = await fetch(`${dir}/${pad(i + 1)}.${ext}`, { signal });
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      };
      let first: Blob | undefined;
      let poster: ImageBitmap | undefined;
      try {
        first = await get(0);
        poster = await createImageBitmap(first);
      } catch {
        if (id !== batch) return;
        if (ext === "avif") {
          ext = "webp"; // no AVIF support
          return loadStills();
        }
      }
      if (id !== batch) return poster?.close();
      // swap sets only once there is something to draw, so rotating never blanks the canvas
      bitmaps.forEach((img) => img.close());
      blobs = new Array(frames);
      bitmaps = new Map();
      decoding = new Set();
      blobs[0] = first;
      if (poster) bitmaps.set(0, poster);
      draw();
      if (reduce) return; // nothing moves: one frame is all it takes
      let next = 0;
      const lane = async () => {
        while (id === batch && next < order.length) {
          const i = order[next++];
          try {
            const blob = await get(i);
            if (id !== batch) return;
            blobs[i] = blob;
            if (Math.abs(i - current) <= AHEAD) pump();
          } catch {
            // missing frame or cancelled: its neighbours stand in
          }
        }
      };
      for (let c = 0; c < 6; c++) lane();
    };
    load();
    portrait.addEventListener("change", load);

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    // once the film is out of sight only the frame on screen stays in memory
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      dirty = true;
      pump();
    });
    io.observe(el);
    const stop = () => {
      batch++;
      aborter.abort();
      if (decoder && decoder.state !== "closed") decoder.close();
      gsap.ticker.remove(tick);
      portrait.removeEventListener("change", load);
      ro.disconnect();
      io.disconnect();
      bitmaps.forEach((img) => img.close());
      bitmaps.clear();
    };

    const caps = el.querySelectorAll<HTMLElement>(".sf-cap");
    if (reduce) {
      caps.forEach((c, i) => (c.style.opacity = i === 0 && !hasIntro ? "1" : "0"));
      return () => {
        stop();
      };
    }

    const tail = overlap ? 1 : 0; // last viewport: next section slides over the still-moving film
    const total = length + tail;

    const gctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => "+=" + window.innerHeight * total,
          pin: true,
          scrub: true, // Lenis already eases the scroll; easing the film again on top would make it trail behind
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
              heading = i > current ? 1 : -1;
              current = i;
              pump();
            }
          },
        },
        0,
      );

      // The words only fade in and out: the film is the one thing that moves
      if (hasIntro) tl.to(".sf-intro", { opacity: 0, duration: 0.5 }, 0.1);

      // Captions: `from` / `to` are fractions of the film
      captions.forEach((c, i) => {
        tl.fromTo(caps[i], { opacity: 0 }, { opacity: 1, duration: 0.5 }, c.from * total);
        if (c.to < 1) tl.to(caps[i], { opacity: 0, duration: 0.4 }, c.to * total - 0.4);
      });
      tl.set({}, {}, total);
    }, el);

    return () => {
      stop();
      gctx.revert();
    };
  }, [frames, src.lg, src.sm, captions, hasIntro, length, overlap]);

  return (
    // React-owned wrapper keeps GSAP's pin-spacer DOM move invisible to React
    <div>
      <section ref={root} className="relative h-[100svh] overflow-hidden bg-navy-deep text-white">
        {/* poster until the first frame is decoded */}
        <picture>
          <source media={PORTRAIT} type="image/avif" srcSet={`${src.sm}/001.avif`} />
          <source media={PORTRAIT} srcSet={`${src.sm}/001.webp`} />
          <source type="image/avif" srcSet={`${src.lg}/001.avif`} />
          <img src={`${src.lg}/001.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Camera flies toward a superyacht at anchor, over its aft deck and into the main salon"
        />
        {/* just enough shade for the menu and the words; the picture itself stays clear */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.45),transparent_24%,transparent_58%,rgb(0_0_0/0.5))]" />

        {intro && <div className="sf-intro absolute inset-0">{intro}</div>}

        {captions.map((c, i) => (
          <div
            key={i}
            className="sf-cap pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_55%_38%_at_center,rgb(4_22_30/0.5),transparent)] px-4 text-center"
            style={{ opacity: 0 }}
          >
            <h2 className="serif text-[clamp(2.4rem,min(9.5vw,11svh),5.75rem)] leading-[1.05] [text-shadow:0_2px_30px_rgb(0_0_0/0.45)]">
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

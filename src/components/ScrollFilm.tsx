"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type FilmCaption = { lines: [string, string]; from: number; to: number };

type Props = {
  /** Number of frames. Each folder holds them as film.bin + film.json, and as stills 001.avif / 001.webp … */
  frames: number;
  /** The frame to show at even steps of the scroll, first to last: more scroll where the camera is fast */
  pace: number[];
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

/** The stills are every second frame: STEP in scripts/export-hero.mjs */
const STILLS = 2;

/** Screens no wider than the 3:4 crop, so it covers them at full source height */
const PORTRAIT = "(max-width: 767px) and (max-aspect-ratio: 3/4)";

/**
 * Scroll-scrubbed film drawn to a canvas, so the camera moves exactly with the scroll in both directions (smooth on
 * iOS too, unlike seeking a <video>). The frames come from the device's video decoder through WebCodecs, which costs
 * next to no processor time; browsers without it get the same film as still pictures.
 * A light version of the film (preview.bin) comes first, so it runs smoothly almost at once; the full one takes its place.
 */
export default function ScrollFilm({ frames, pace: givenPace, src, captions: given, intro, length = 6, overlap = false }: Props) {
  // the same values in a new array are no reason to take the pin down and put it up again
  const paceKey = givenPace.join();
  const pace = useMemo(() => paceKey.split(",").map(Number), [paceKey]);
  const key = JSON.stringify(given);
  const captions = useMemo(() => JSON.parse(key) as FilmCaption[], [key]);
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasIntro = Boolean(intro);

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx2d = canvas.getContext("2d"); // see-through until the first frame, so the poster shows
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
    const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const thrifty = Boolean(net?.saveData || (net?.effectiveType && net.effectiveType !== "4g")); // the light film will do

    // ---- drawing: cover-fit like object-fit: cover, at most once per screen refresh.
    // A frame lasts some 20px of scroll, which shows as steps when scrolling slowly. So while the film moves
    // slowly the next frame fades in over this one; at rest it always settles on one clean frame.
    const playhead = { at: 0, f: 0 }; // how far through the scroll, and the frame that belongs there
    let dirty = true;
    let lastF = 0;
    let rest = 1; // 0 while moving → 1 once still
    const size = () => {
      // never more pixels than the film has: the browser scales the finished picture up for free
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const scale = upright() ? Math.min(window.devicePixelRatio || 1, 2, 1920 / cw) : Math.min(window.devicePixelRatio || 1, 1920 / cw, 1080 / ch);
      const w = Math.round(cw * scale), h = Math.round(ch * scale);
      if (w === canvas.width && h === canvas.height) return; // setting it clears the picture
      canvas.width = w;
      canvas.height = h;
      paint();
      upgrade(); // a larger window may want the full film now
    };
    const upright = () => portrait.matches;
    /** The picture covers the screen, as object-fit: cover does */
    const put = (img: ImageBitmap, alpha: number) => {
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.width, ch / img.height);
      const w = img.width * s, h = img.height * s;
      ctx2d.imageSmoothingQuality = s < 0.75 ? "high" : s > 1.1 ? "medium" : "low"; // near its own size the cheap way looks the same
      ctx2d.globalAlpha = alpha;
      ctx2d.drawImage(img, Math.round((cw - w) / 2), Math.round((ch - h) / 2), w, h);
    };
    const paint = () => {
      dirty = false;
      ctx2d.imageSmoothingEnabled = true; // resizing the canvas resets it
      // at the very top the poster, which is the first frame, is the better picture until the full film is there
      if (playhead.f < 0.02 && light) return ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      // the nearest pictures there are on either side: while the film is still coming in they may lie a little apart
      let i = Math.floor(playhead.f), j = i + 1;
      while (i > playhead.f - 8 && !bitmaps.has(i)) i--;
      while (j < playhead.f + 8 && !bitmaps.has(j)) j++;
      const a = bitmaps.get(i), b = bitmaps.get(j);
      const part = (playhead.f - i) / (j - i);
      const mix = part + (Math.round(part) - part) * rest;
      if (a && b && mix >= 0.98) return put(b, 1);
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
    let slowFor = 0;
    let stride = 1; // decode every frame, or while rushing through only every 2nd or 4th
    const tick = (_time: number, delta: number) => {
      const speed = Math.abs(playhead.f - lastF);
      lastF = playhead.f;
      const step = speed > 2.6 ? 4 : speed > 1.1 ? 2 : 1;
      if (step >= stride) slowFor = 0;
      else slowFor += delta;
      // not back and forth while the speed wavers
      if (step > stride || slowFor > 160) {
        stride = step;
        slowFor = 0;
        pump();
      }
      lead = Math.min(24, Math.round(speed * 4));
      copySome(Math.ceil(speed) + 1);
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
    const AHEAD = 11, BEHIND = 4;
    let lead = 0; // the faster it goes, the further ahead the next pictures are made
    const DECODERS = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) >> 1)); // leave room for the page itself
    const inWindow = (i: number, slack = 0) => {
      const d = (i - current) * heading;
      return i === current || (visible && d <= AHEAD + lead + slack && d >= -BEHIND - slack);
    };

    // ---- the film: groups of `gop` frames, each starting on a key frame, decoded one group at a time
    type Units = (Uint8Array<ArrayBuffer> | undefined)[];
    let units: Units | null = null; // the pieces downloaded so far; null: using stills
    let gop = 4;
    let config: VideoDecoderConfig;
    let light = true; // playing the light version
    let full: { units: Units; gop: number; config: VideoDecoderConfig } | null = null; // downloaded, to be played from now on
    let soft = new Set<number>(); // pictures left from the light version
    const has = (i: number) => bitmaps.has(i) && !soft.has(i);
    let decoder: VideoDecoder | null = null;
    let waiting: VideoFrame[] = []; // decoded, not yet copied
    let allCopied: (() => void) | null = null;
    let copying = 0;
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
          if (id !== batch || has(i) || !(inWindow(i, gop) || !bitmaps.size)) return frame.close();
          waiting.push(frame);
        },
        error: () => {}, // flush() rejects as well
      });
      decoder.configure(config);
      return decoder;
    };
    const fitted = (w: number, h: number): ImageBitmapOptions | undefined => {
      const s = Math.max(canvas.width / w, canvas.height / h);
      return s < 0.9 ? { resizeWidth: Math.round(w * s), resizeHeight: Math.round(h * s), resizeQuality: "medium" } : undefined;
    };
    /**
     * Copies decoded frames for drawing, a few per screen refresh: a whole group at once makes the graphics chip miss
     * a refresh, which shows as a small hitch every few frames.
     */
    const copySome = (most: number) => {
      if (!bitmaps.has(current) && !bitmaps.has(current + heading)) most = waiting.length; // nothing to show yet: hurry
      while (most > 0 && waiting.length) {
        const frame = waiting.shift()!;
        const id = batch, i = Math.round(frame.timestamp / 1000);
        if (i % stride && i !== frames - 1 && bitmaps.size) {
          frame.close(); // rushing past: decoded only for the sake of the next one
          if (!waiting.length && !copying) allCopied?.();
          continue;
        }
        most--;
        copying++;
        createImageBitmap(frame, fitted(frame.displayWidth, frame.displayHeight))
          .then((img) => {
            if (id !== batch || has(i)) return img.close();
            bitmaps.get(i)?.close();
            soft.delete(i);
            bitmaps.set(i, img);
            draw();
          })
          .catch(() => {})
          .finally(() => {
            frame.close();
            copying--;
            if (!copying && !waiting.length) allCopied?.();
          });
      }
    };
    const dropWaiting = () => {
      waiting.forEach((frame) => frame.close());
      waiting = [];
      if (!copying) allCopied?.();
    };
    /** The next group worth decoding, and how many of its frames */
    const nextGroup = (): [number, number] | null => {
      if (!units) return null;
      const here = Math.floor(Math.min(frames - 1, Math.max(0, current + heading * Math.round(lead / 2))) / gop);
      const last = Math.floor((frames - 1) / gop);
      const reach = Math.ceil((AHEAD + lead) / gop) + 1;
      for (let d = 0; d <= reach; d++) {
        for (const g of d ? [here + d * heading, here - d * heading] : [here]) {
          if (g < 0 || g > last) continue;
          let n = 0;
          while (n < gop && units[g * gop + n]) n++;
          if (stride > 2) n = Math.min(n, 1); // rushing through: key frames will do
          for (let k = 0; k < n; k++) {
            const i = g * gop + k;
            if (i % stride && i !== frames - 1 && bitmaps.size) continue;
            if (inWindow(i) && !has(i)) return [g, n];
          }
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
        for (;;) {
          if (full) {
            // between two groups: nothing is on its way that belongs to the light version
            ({ units, gop, config } = full);
            full = null;
            light = false;
            if (decoder && decoder.state !== "closed") decoder.close();
            decoder = null;
            soft = new Set(bitmaps.keys());
          }
          const next = nextGroup();
          if (!next || id !== batch) break;
          const [g, n] = next;
          const dec = openDecoder();
          made = 0;
          for (let k = 0; k < n; k++) {
            const timestamp = (g * gop + k) * 1000;
            dec.decode(new EncodedVideoChunk({ type: k ? "delta" : "key", timestamp, data: units![g * gop + k]! }));
          }
          await dec.flush();
          if (!made) throw new Error("no picture");
          if (waiting.length || copying) await new Promise<void>((done) => (allCopied = done));
          allCopied = null;
          if (id === batch && failures && bitmaps.size) failures = 0;
        }
      } catch {
        if (id === batch && ++failures > 3) {
          dropWaiting();
          units = full = null; // this device's decoder won't have it
          light = false;
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
          soft.delete(i);
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
      dropWaiting();
      aborter.abort();
      aborter = new AbortController();
      const { signal } = aborter;
      if (decoder && decoder.state !== "closed") decoder.close();
      decoder = null;
      units = full = null;
      light = true;
      soft.clear();
      failures = 0;
      if (reduce || !("VideoDecoder" in window)) return loadStills();
      const dir = portrait.matches ? src.sm : src.lg; // phones held upright: the 3:4 centre crop, which covers them
      /** Reads one version of the film; `open` gets its pieces before they are there, `each` is told of every one */
      const read = async (name: string, priority: RequestPriority, open: (f: NonNullable<typeof full>) => void, each: (i: number) => void) => {
        const index: FilmIndex = await fetch(`${dir}/${name}.json`, { signal }).then((r) => r.json());
        const film = {
          units: new Array(frames) as Units,
          gop: index.gop,
          config: { codec: index.codec, codedWidth: index.width, codedHeight: index.height, optimizeForLatency: true },
        };
        const { supported } = await VideoDecoder.isConfigSupported(film.config);
        if (!supported || index.order.length !== frames) throw new Error("not playable");
        const body = (await fetch(`${dir}/${name}.bin`, { signal, priority })).body!.getReader();
        if (id !== batch) return null;
        open(film);
        let k = 0, filled = 0;
        let piece = new Uint8Array(index.sizes[0]);
        for (;;) {
          const { done, value } = await body.read();
          if (id !== batch) return null;
          if (done) return k === frames ? film : null;
          let from = 0;
          while (from < value.length && k < frames) {
            const part = value.subarray(from, from + piece.length - filled);
            piece.set(part, filled);
            filled += part.length;
            from += part.length;
            if (filled < piece.length) break;
            const i = index.order[k++];
            film.units[i] = piece;
            filled = 0;
            if (k < frames) piece = new Uint8Array(index.sizes[k]);
            each(i);
          }
        }
      };
      try {
        await read(
          "preview",
          "auto",
          (film) => {
            bitmaps.forEach((img) => img.close());
            bitmaps = new Map();
            ({ units, gop, config } = film);
          },
          (i) => {
            if (units && (!bitmaps.size || inWindow(i))) work();
          },
        );
      } catch {
        if (id === batch && !units) loadStills();
        return;
      }
      if (id !== batch || !units || thrifty) return;
      let asked = false;
      upgrade = async () => {
        // the light version is as sharp as a canvas of its own size can show: the full one only for a larger one
        if (asked || id !== batch || canvas.width * canvas.height <= 1344 * 756) return;
        asked = true;
        try {
          const film = await read("film", "low", () => {}, () => {});
          if (!film || id !== batch || !units) return;
          full = film;
          work();
        } catch {
          // the light version plays on
        }
      };
      upgrade();
    };
    let upgrade: () => void = () => {};

    // ---- loading the stills: first frame (settles AVIF or WebP), then a coarse pass (every 8th), then fill in the gaps
    const order: number[] = [];
    for (let i = 8; i < frames; i += 8) order.push(i);
    if (!thrifty) for (let i = STILLS; i < frames; i += STILLS) if (i % 8) order.push(i);
    if ((frames - 1) % STILLS) order.push(frames - 1);
    const loadStills = async () => {
      const id = ++batch;
      light = false;
      soft.clear();
      aborter.abort();
      aborter = new AbortController();
      const { signal } = aborter;
      const dir = portrait.matches ? src.sm : src.lg; // phones held upright: the 3:4 centre crop, which covers them
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
    // The poster is the first frame, so the film can wait until everything the page opens with is there, or until it is
    // scrolled to
    const START = ["load", "wheel", "touchstart", "keydown", "scroll"] as const;
    const forgetStart = () => START.forEach((e) => window.removeEventListener(e, start));
    const start = () => {
      forgetStart();
      load();
      portrait.addEventListener("change", load);
    };
    if (document.readyState === "complete") start();
    else START.forEach((e) => window.addEventListener(e, start, { passive: true }));

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
      forgetStart();
      batch++;
      dropWaiting();
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
          refreshPriority: 1, // measured before everything below it, whenever it was made
          invalidateOnRefresh: true,
        },
      });

      // Film runs across the whole pinned scroll, including the overlap tail
      tl.to(
        playhead,
        {
          at: 1,
          duration: total,
          onUpdate: () => {
            const step = playhead.at * (pace.length - 1);
            const n = Math.min(pace.length - 2, Math.floor(step));
            playhead.f = pace[n] + (pace[n + 1] - pace[n]) * (step - n);
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
  }, [frames, pace, src.lg, src.sm, captions, hasIntro, length, overlap]);

  return (
    // React-owned wrapper keeps GSAP's pin-spacer DOM move invisible to React. It is as tall as the pin will make it from the
    // start, or the next section would cover the hero until the scripts have run. Without scripts or motion nothing is pinned.
    <div style={{ "--film": `${(1 + length + (overlap ? 1 : 0)) * 100}svh` } as React.CSSProperties} className="min-h-(--film) motion-reduce:min-h-0 noscript:min-h-0">
      <section ref={root} data-film className="relative h-[100svh] overflow-hidden bg-navy-deep text-white">
        {/* poster until the first frame is decoded */}
        <picture>
          <source media={PORTRAIT} type="image/avif" srcSet={`${src.sm}/001.avif`} />
          <source media={PORTRAIT} srcSet={`${src.sm}/001.webp`} />
          <source type="image/avif" srcSet={`${src.lg}/001.avif`} />
          <img src={`${src.lg}/001.webp`} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Camera flies toward a yacht at anchor off Dubai, over its aft deck and into the main salon"
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
            <p className="serif text-[clamp(2.4rem,min(9.5vw,11svh),5.75rem)] leading-[1.05] [text-shadow:0_2px_30px_rgb(0_0_0/0.45)]">
              {c.lines[0]}
              <br />
              {c.lines[1]}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

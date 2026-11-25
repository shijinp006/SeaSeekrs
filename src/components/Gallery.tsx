"use client";

import Image from "next/image";
import { useState } from "react";
import type { Aos } from "@/lib/motion";

/**
 * One large picture that cross-fades between the photos of a yacht, with its thumbnails underneath.
 * Only the first large photo is loaded with the page; the others when their thumbnail is pointed at or chosen.
 */
export default function Gallery({
  name,
  photos,
  alts,
  aos,
  first = false,
}: {
  name: string;
  photos: string[];
  /** alt text by picture */
  alts: Record<string, string>;
  aos: Aos;
  /** at the top of the page: its picture is loaded straight away */
  first?: boolean;
}) {
  const [at, setAt] = useState(0);
  const [asked, setAsked] = useState([0]); // large photos that have been wanted so far
  const [ready, setReady] = useState([0]); // …and those that have arrived
  const want = (i: number) => setAsked((old) => (old.includes(i) ? old : [...old, i]));
  const shown = ready.includes(at) ? at : (ready.at(-1) ?? 0); // the one before stays until the new one is there
  return (
    <div>
      <div data-aos={aos} data-aos-img data-opens="slit" className="relative isolate aspect-[4/3] overflow-hidden rounded-port bg-navy-deep/10 lg:aspect-[3/2]">
        {photos.map((src, i) => asked.includes(i) && (
          <Image
            key={src}
            src={src}
            alt={alts[src] || (i ? `${name}, photo ${i + 1}` : name)}
            aria-hidden={i !== shown}
            fill
            onLoad={() => setReady((old) => (old.includes(i) ? old : [...old, i]))}
            loading={(first && i === 0) || i > 0 ? "eager" : "lazy"}
            fetchPriority={first && i === 0 ? "high" : undefined}
            sizes="(min-width: 1024px) 62vw, 100vw"
            className={`object-cover transition-[opacity,scale] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === shown ? "opacity-100" : "scale-[1.05] opacity-0"
            }`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2 md:mt-4 md:gap-4">
        {/* the wrapper is animated, so the button keeps its own fade */}
        {photos.map((src, i) => (
          <div key={src} data-aos="zoom-in" data-aos-delay={i * 80}>
            <button
              type="button"
              aria-label={`Show photo ${i + 1} of ${name}`}
              aria-pressed={i === at}
              onPointerEnter={() => want(i)}
              onFocus={() => want(i)}
              onClick={() => {
                want(i);
                setAt(i);
              }}
              className={`group relative block w-full aspect-[4/3] overflow-hidden rounded-[0.6rem] outline-2 outline-offset-2 transition-[opacity,outline-color] duration-300 md:rounded-[0.8rem] ${
                i === at ? "outline-(--accent)" : "opacity-70 outline-transparent hover:opacity-100 focus-visible:outline-(--fg)"
              }`}
            >
              <Image src={src} alt={alts[src] || (i ? `${name}, photo ${i + 1}` : name)} fill sizes="(min-width: 1024px) 13vw, 20vw" className="card-img object-cover" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import type { Aos } from "@/lib/motion";

/** One large picture that cross-fades between the photos of a yacht, with its thumbnails underneath. */
export default function Gallery({
  name,
  photos,
  aos,
}: {
  name: string;
  photos: string[];
  aos: Aos;
}) {
  const [at, setAt] = useState(0);
  return (
    <div>
      <div data-aos={aos} data-aos-img className="relative isolate aspect-[4/3] overflow-hidden rounded-port bg-navy-deep/10 lg:aspect-[3/2]">
        {photos.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i ? `${name}, photo ${i + 1}` : name}
            aria-hidden={i !== at}
            fill
            sizes="(min-width: 1024px) 62vw, 100vw"
            className={`object-cover transition-[opacity,scale] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === at ? "opacity-100" : "scale-[1.05] opacity-0"
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
              onClick={() => setAt(i)}
              className={`group relative block w-full aspect-[4/3] overflow-hidden rounded-[0.6rem] outline-2 outline-offset-2 transition-[opacity,outline-color] duration-300 md:rounded-[0.8rem] ${
                i === at ? "outline-(--accent)" : "opacity-70 outline-transparent hover:opacity-100 focus-visible:outline-(--fg)"
              }`}
            >
              <Image src={src} alt="" fill sizes="(min-width: 1024px) 13vw, 20vw" className="card-img object-cover" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

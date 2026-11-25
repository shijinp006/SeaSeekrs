import Image from "next/image";
import type { Aos } from "@/lib/motion";
import type { Opens } from "@/lib/stages";

/**
 * Picture that opens as it arrives, and drifts a little inside its frame as the page scrolls (see MotionRoot).
 * Inside a `group` link it also zooms slowly on hover.
 */
export default function Frame({
  src,
  alt,
  className = "",
  sizes = "(min-width: 768px) 50vw, 100vw",
  focus,
  aos = "fade-up",
  delay,
  opens = "expand",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** object-position: the point kept in view where the frame crops the picture */
  focus?: string;
  aos?: Aos;
  /** milliseconds, to let neighbours open one after another */
  delay?: number;
  /** how the picture opens while it is scrolled in */
  opens?: Opens;
  children?: React.ReactNode;
}) {
  return (
    <div data-aos={aos} data-aos-delay={delay} data-aos-img data-opens={opens} className={`relative isolate overflow-hidden rounded-port bg-navy-deep/10 ${className}`}>
      <div data-drift className="absolute inset-x-0 inset-y-[-6%] motion-reduce:inset-y-0">
        <Image src={src} alt={alt} fill sizes={sizes} className="card-img object-cover" style={{ objectPosition: focus }} />
      </div>
      {children}
    </div>
  );
}

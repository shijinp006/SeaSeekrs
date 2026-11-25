import Image from "next/image";
import Link from "next/link";
import { CardArrow } from "@/components/Icons";
import { Tagged } from "@/components/Title";
import type { Site } from "@/lib/server/site";
import type { Service } from "@/lib/services";

export default function ServiceCard({ service: s, site, heading = "h2" }: { service: Service; site: Site; heading?: "h2" | "h3" }) {
  return (
    <Link href={`/services/${s.slug}`} className="group card-focus block h-full">
      <div className="relative aspect-[4/3] overflow-hidden rounded-port bg-navy-deep/10">
        <Image
          src={s.photos[0]}
          alt={site.alts[s.photos[0]] || s.title}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
          className="card-img object-cover"
        />
        <span className="card-shade absolute inset-0" />
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
          <Tagged tag={heading === "h2" ? site.content["services.items"].itemTag : ""} as={heading} className="display t-title">
            {s.title}
          </Tagged>
          <CardArrow />
        </div>
      </div>
      <p className="mt-5 pr-4 leading-relaxed text-(--mute)">{s.summary}</p>
      <p className="mt-3 text-(--accent) underline-offset-4 group-hover:underline">View details</p>
    </Link>
  );
}

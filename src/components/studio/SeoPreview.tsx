import Image from "next/image";
import { company } from "@/lib/content";
import { LABEL } from "./styles";

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** How the page may look in Google, and as a link on WhatsApp or Facebook */
export default function SeoPreview({ title, description, image, url }: { title: string; description: string; image: string; url: string }) {
  const host = URL.canParse(url) ? new URL(url).host : url;
  return (
    <div className="space-y-7 [overflow-wrap:anywhere]">
      <div>
        <p className={LABEL}>Google preview</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-deep">
            <Image src={company.logo.src} alt="" width={26} height={23} className="h-5 w-auto brightness-150" />
          </span>
          <span className="leading-tight">
            <span className="block text-[0.875rem]">{company.name}</span>
            <span className="block text-[0.75rem] text-[#4d5156]">{url}</span>
          </span>
        </div>
        <p className="mt-2 text-[1.25rem] leading-snug text-[#1a0dab]">{cut(title, 60) || "No title yet"}</p>
        <p className="mt-1 text-[0.875rem] leading-relaxed text-[#4d5156]">{cut(description, 160) || "No description yet"}</p>
      </div>
      <div>
        <p className={LABEL}>WhatsApp / Facebook preview</p>
        <div className="mt-3 max-w-md overflow-hidden rounded-[0.8rem] border border-(--rule)">
          <div className="relative grid aspect-[1.91/1] place-items-center bg-ink/6 text-[0.8125rem] text-(--mute)">
            {image ? <Image src={image} alt="" fill sizes="28rem" className="object-cover" /> : "No share image"}
          </div>
          <div className="bg-[#f0f2f5] px-4 py-3">
            <p className="text-[0.75rem] uppercase text-[#65676b]">{host}</p>
            <p className="text-[0.9375rem] font-semibold leading-snug text-[#050505]">{cut(title, 70) || "No title yet"}</p>
            <p className="line-clamp-2 text-[0.8125rem] text-[#65676b]">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

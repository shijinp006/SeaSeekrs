import Link from "next/link";

export default function Heading({ title, text, back }: { title: string; text?: string; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="text-[0.875rem] text-(--accent) underline-offset-4 hover:underline">
          ← {back.label}
        </Link>
      )}
      <h1 className={`display text-[clamp(1.9rem,3vw,2.5rem)] ${back ? "mt-3" : ""}`}>{title}</h1>
      {text && <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-(--mute)">{text}</p>}
    </div>
  );
}

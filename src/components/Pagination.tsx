import Link from "next/link";
import { Arrow } from "@/components/Icons";

const round =
  "grid size-11 place-items-center rounded-xl border transition-[background-color,border-color,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";
const link = `${round} border-(--rule) hover:border-gold hover:bg-gold hover:text-ink`;

/** Page numbers between two arrows. Nothing when everything fits on one page. */
export default function Pagination({
  page,
  pages,
  href,
  label,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
  label: string;
}) {
  if (pages < 2) return null;
  const step = (to: number, name: string, turn = "") =>
    to < 1 || to > pages ? (
      <span aria-hidden className={`${round} border-(--rule) opacity-35`}>
        <Arrow className={`size-5 ${turn}`} />
      </span>
    ) : (
      <Link href={href(to)} aria-label={name} className={link}>
        <Arrow className={`size-5 ${turn}`} />
      </Link>
    );
  return (
    <nav aria-label={label} className="mt-16 flex flex-wrap items-center justify-center gap-3">
      {step(page - 1, "Previous page", "rotate-180")}
      <ul className="flex flex-wrap gap-3">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={n === page ? `${round} border-gold bg-gold text-ink` : link}
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
      {step(page + 1, "Next page")}
    </nav>
  );
}

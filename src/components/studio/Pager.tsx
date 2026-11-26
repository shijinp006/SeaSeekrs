import Link from "next/link";
import { Icon } from "./ui";

// Page numbers for the admin and the studio. With `href` each page is an address (a list read on the server); with
// `onPage` it is a button (a list held in a form). Nothing when everything fits on one page.

const box =
  "grid h-9 min-w-9 place-items-center rounded-full border px-2 text-[0.875rem] transition-colors focus-visible:outline-2 focus-visible:outline-(--accent)";
const idle = `${box} border-(--rule) bg-white hover:border-(--accent) hover:text-(--accent)`;
const here = `${box} border-(--accent) bg-(--accent) text-white`;
const off = `${box} border-(--rule) bg-white opacity-35`;

/** 1 … 4 5 6 … 12: the first, the last, and those next to the current page */
function numbers(page: number, pages: number) {
  const out: (number | null)[] = [];
  for (let n = 1; n <= pages; n++)
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) out.push(n);
    else if (out.at(-1) !== null) out.push(null);
  return out;
}

export default function Pager({
  page,
  pages,
  label,
  summary,
  href,
  onPage,
  marked = [],
}: {
  page: number;
  pages: number;
  label: string;
  /** shown beside the numbers, like "13–24 of 30 users" */
  summary?: string;
  href?: (page: number) => string;
  onPage?: (page: number) => void;
  /** pages to mark, e.g. where a field needs another look */
  marked?: number[];
}) {
  if (pages < 2) return null;
  const go = (to: number, name: string, content: React.ReactNode, className: string, current = false) =>
    href ? (
      <Link href={href(to)} aria-label={name} aria-current={current ? "page" : undefined} className={className}>
        {content}
      </Link>
    ) : (
      <button type="button" aria-label={name} aria-current={current ? "page" : undefined} className={className} onClick={() => onPage?.(to)}>
        {content}
      </button>
    );
  const step = (to: number, name: string, icon: React.ReactNode) =>
    to < 1 || to > pages ? (
      <span aria-hidden className={off}>
        {icon}
      </span>
    ) : (
      go(to, name, icon, idle)
    );

  return (
    <nav aria-label={label} className="mt-5 flex flex-wrap items-center justify-between gap-3">
      {summary ? <p className="text-[0.875rem] text-(--mute)">{summary}</p> : <span />}
      <div className="flex flex-wrap items-center gap-1.5">
        {step(page - 1, "Previous page", <Icon name="arrow" className="size-4 rotate-180" />)}
        {numbers(page, pages).map((n, i) =>
          n === null ? (
            <span key={`gap${i}`} aria-hidden className="px-1 text-(--mute)">
              …
            </span>
          ) : (
            <span key={n} className="relative">
              {go(n, `Page ${n}`, n, n === page ? here : idle, n === page)}
              {marked.includes(n) && <span title="Needs another look" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#a52a2a]" />}
            </span>
          ),
        )}
        {step(page + 1, "Next page", <Icon name="arrow" className="size-4" />)}
      </div>
    </nav>
  );
}

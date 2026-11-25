import Link from "next/link";
import { CARD } from "./styles";
import { Badge, Icon } from "./ui";

export type RowData = {
  href: string;
  title: string;
  path?: string;
  text?: string;
  issues?: string[];
  ok?: string;
  notes?: (string | false)[];
};

/** The list of pages or sections, each with how it stands */
export default function Rows({ title, rows }: { title: string; rows: RowData[] }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <h2 className="border-b border-(--rule) px-5 py-4 font-serif text-[1.25rem] sm:px-6">{title}</h2>
      <ul className="divide-y divide-(--rule)">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="group flex items-center gap-5 px-5 py-4 outline-offset-[-3px] transition-colors hover:bg-foam focus-visible:outline-2 focus-visible:outline-(--accent) sm:px-6">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-medium">{r.title}</span>
                  {r.path && <span className="text-[0.8125rem] text-(--mute)">{r.path}</span>}
                </span>
                {r.text && <span className="mt-0.5 block truncate text-[0.875rem] text-(--mute)">{r.text}</span>}
                <span className="mt-2 flex flex-wrap items-center gap-2 empty:hidden">
                  {r.issues?.map((i) => (
                    <Badge key={i} tone="warn">
                      {i}
                    </Badge>
                  ))}
                  {r.ok && !r.issues?.length && <Badge tone="good">{r.ok}</Badge>}
                  {r.notes?.map((n) => n && (
                    <Badge key={n} tone="calm">
                      {n}
                    </Badge>
                  ))}
                </span>
              </span>
              <Icon name="arrow" className="size-5 text-(--mute) transition-[translate,color] group-hover:translate-x-1 group-hover:text-(--accent)" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

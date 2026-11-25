import Link from "next/link";
import { LINK } from "@/lib/motion";

/** Where a page stands in the site. The last step is the page itself. */
export default function Breadcrumb({ steps }: { steps: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {steps.map(({ name, href }, i) => (
          <li key={name} className="flex items-center gap-x-3" aria-current={href ? undefined : "page"}>
            {i > 0 && <span aria-hidden>/</span>}
            {href ? (
              <Link href={href} className={LINK}>
                {name}
              </Link>
            ) : (
              name
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

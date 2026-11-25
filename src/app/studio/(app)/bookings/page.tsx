import type { Metadata } from "next";
import Link from "next/link";
import BookingList from "@/components/studio/BookingList";
import Heading from "@/components/studio/Heading";
import { CARD, INPUT, LINE } from "@/components/studio/styles";
import { STATUS_LABEL, STATUSES, type BookingStatus } from "@/lib/booking";
import { countBookings, findBookings } from "@/lib/server/bookings";
import { requireUser } from "@/lib/server/session";

export const instant = false;
export const metadata: Metadata = { title: "Bookings" };

type Query = { status?: string | string[]; q?: string | string[]; page?: string | string[] };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Bookings({ searchParams }: { searchParams: Promise<Query> }) {
  await requireUser("ADMIN");
  const query = await searchParams;
  const status = STATUSES.find((s) => s === one(query.status)) as BookingStatus | undefined;
  const search = one(query.q).trim().slice(0, 80);
  const [counts, found] = await Promise.all([
    countBookings(),
    findBookings({ status, search, page: Math.floor(Number(one(query.page))) || 1 }),
  ]);
  const href = (change: { status?: BookingStatus | ""; page?: number }) => {
    const p = new URLSearchParams();
    const s = change.status ?? status;
    if (s) p.set("status", s);
    if (search) p.set("q", search);
    if (change.page && change.page > 1) p.set("page", String(change.page));
    return `/studio/bookings${p.size ? `?${p}` : ""}`;
  };
  const tabs = [
    { label: "All", count: counts.all, value: "" as const },
    ...STATUSES.map((s) => ({ label: STATUS_LABEL[s], count: counts[s], value: s })),
  ];
  return (
    <>
      <Heading title="Bookings" text="Sent with “Book now” on the service pages. Only admins see this page." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Bookings by status" className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const here = (status ?? "") === t.value;
            return (
              <Link
                key={t.label}
                href={href({ status: t.value })}
                aria-current={here ? "page" : undefined}
                className={here ? `${LINE} border-(--accent) bg-(--accent)! text-white!` : LINE}
              >
                {t.label} <span className="opacity-70">{t.count}</span>
              </Link>
            );
          })}
        </nav>
        <form action="/studio/bookings" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" type="search" defaultValue={search} placeholder="Name, phone, email or number" aria-label="Search bookings" className={`${INPUT} w-64!`} />
          <button type="submit" className={LINE}>
            Search
          </button>
        </form>
      </div>

      {found.rows.length ? (
        <BookingList rows={found.rows} />
      ) : (
        <p className={`${CARD} p-8 text-center text-(--mute)`}>
          {search || status ? "No bookings match." : "No bookings yet. They appear here as soon as someone sends the form on a service page."}
        </p>
      )}

      {found.pages > 1 && (
        <nav aria-label="Pages of bookings" className="mt-6 flex items-center justify-between gap-4 text-[0.875rem] text-(--mute)">
          {found.page > 1 ? (
            <Link href={href({ page: found.page - 1 })} className={LINE}>
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {found.page} of {found.pages}, {found.total} bookings
          </span>
          {found.page < found.pages ? (
            <Link href={href({ page: found.page + 1 })} className={LINE}>
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

import Link from "next/link";
import { CARD } from "@/components/studio/styles";
import { Badge, Icon, type IconName } from "@/components/studio/ui";
import { STATUS_LABEL } from "@/lib/booking";
import { countBookings, latestBookings } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";
import { getSections } from "@/lib/server/studio";

export const instant = false;

export default async function AdminOverview() {
  const user = await requireUser("ADMIN");
  const [counts, bookings, sections, users] = await Promise.all([
    countBookings(),
    latestBookings(),
    getSections(),
    db.user.count({ where: { active: true } }),
  ]);
  const stats: { label: string; value: number; icon: IconName; href: string; warn?: boolean }[] = [
    { label: "New bookings", value: counts.NEW, icon: "calendar", href: "/admin/bookings?status=NEW", warn: counts.NEW > 0 },
    { label: "All bookings", value: counts.all, icon: "calendar", href: "/admin/bookings" },
    { label: "Services", value: sections["services.items"].value.items.length, icon: "wave", href: "/admin/services" },
    { label: "Active users", value: users, icon: "users", href: "/admin/users" },
  ];

  return (
    <>
      <div className="mb-6 rounded-[1.4rem] bg-navy-deep px-6 py-10 text-white sm:px-9">
        <h1 className="display text-[clamp(2.1rem,4vw,3.1rem)]">Overview</h1>
        <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-white/85">
          Welcome, {user.name}. See the bookings sent from the website, add and change services, and manage who can sign in.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`${CARD} flex h-full items-center gap-4 p-5 transition-colors hover:border-(--accent)`}>
              <span className={`grid size-12 shrink-0 place-items-center rounded-full ${s.warn ? "bg-[#fdefcb] text-[#7a4d00]" : "bg-[#d3e9e7] text-[#08656b]"}`}>
                <Icon name={s.icon} className="size-5" />
              </span>
              <span>
                <span className="block text-[0.875rem] leading-snug text-(--mute)">{s.label}</span>
                <span className="display mt-1 block text-[1.8rem]">{s.value}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className={`${CARD} mt-6`}>
        <div className="flex items-center justify-between gap-4 border-b border-(--rule) px-5 py-4">
          <h2 className="font-serif text-[1.25rem]">Latest bookings</h2>
          <Link href="/admin/bookings" className="text-[0.875rem] text-(--accent) underline-offset-4 hover:underline">
            See all
          </Link>
        </div>
        {bookings.length ? (
          <ul className="divide-y divide-(--rule)">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/bookings?q=${b.ref}`}
                  className="grid gap-x-6 gap-y-1 px-5 py-3.5 text-[0.9375rem] transition-colors hover:bg-ink/3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto] sm:items-center"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{b.name}</span> <span className="text-(--mute)">{b.phone}</span>
                  </span>
                  <span className="min-w-0 truncate text-(--mute)">
                    {b.service}, {b.when}, {b.guests} guests
                  </span>
                  <Badge tone={b.status === "NEW" ? "warn" : b.status === "CONFIRMED" ? "good" : "calm"}>{STATUS_LABEL[b.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-(--mute)">No bookings yet.</p>
        )}
      </section>
    </>
  );
}

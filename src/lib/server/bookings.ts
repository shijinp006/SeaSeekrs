import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { BookingRow } from "@/components/studio/BookingList";
import { dayLabel, hoursLabel, STATUSES, type BookingStatus } from "@/lib/booking";
import { db } from "./db";

// Read afresh each time: bookings come in from the website, not from the studio

const PER_PAGE = 20;
const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

/** For wa.me: digits with the country code. A number written the local way (050 123 4567) is taken as one of the UAE */
const international = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  return !phone.trim().startsWith("+") && digits.startsWith("0") ? `971${digits.slice(1)}` : digits;
};

const row = (b: Prisma.BookingModel): BookingRow => ({
  id: b.id,
  ref: b.ref,
  service: b.serviceTitle,
  yacht: b.yacht,
  name: b.name,
  email: b.email,
  phone: b.phone,
  when: `${dayLabel(b.date.toISOString().slice(0, 10))}, ${b.time}`,
  duration: hoursLabel(b.hours),
  guests: b.guests,
  message: b.message,
  status: b.status,
  note: b.note,
  received: when.format(b.createdAt),
  chat: international(b.phone),
});

export async function countBookings() {
  const groups = await db.booking.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<BookingStatus, number>;
  for (const g of groups) counts[g.status] = g._count._all;
  return { ...counts, all: Object.values(counts).reduce((a, b) => a + b, 0) };
}

export const countNewBookings = () => db.booking.count({ where: { status: "NEW" } });

export const latestBookings = async (take = 5) => (await db.booking.findMany({ orderBy: { createdAt: "desc" }, take })).map(row);

export async function findBookings({ status, search, page }: { status?: BookingStatus; search: string; page: number }) {
  const where: Prisma.BookingWhereInput = {
    status,
    OR: search
      ? (["ref", "name", "email", "phone", "serviceTitle"] as const).map((key) => ({ [key]: { contains: search } }))
      : undefined,
  };
  const total = await db.booking.count({ where });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const at = Math.min(Math.max(1, page), pages);
  const rows = await db.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip: (at - 1) * PER_PAGE, take: PER_PAGE });
  return { rows: rows.map(row), total, pages, page: at };
}

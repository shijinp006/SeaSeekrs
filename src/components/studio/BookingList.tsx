"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABEL, STATUSES, type BookingStatus } from "@/lib/booking";
import { send } from "@/lib/studio/client";
import { Badge, CARD, DANGER, INPUT, LABEL, LINE, Note } from "./ui";

export type BookingRow = {
  id: string;
  ref: string;
  service: string;
  yacht: string;
  name: string;
  email: string;
  phone: string;
  when: string;
  duration: string;
  guests: number;
  message: string;
  status: BookingStatus;
  note: string;
  received: string;
  /** the customer's number, digits only, for a WhatsApp chat */
  chat: string;
};

const TONE = { NEW: "warn", CONFIRMED: "good", DONE: "calm", CANCELLED: "calm" } as const;

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 break-words text-[0.9375rem]">{children}</dd>
    </div>
  );
}

function Booking({ b }: { b: BookingRow }) {
  const router = useRouter();
  const [note, setNote] = useState(b.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (method: string, data?: unknown) => {
    setBusy(true);
    const r = await send(method, `/api/studio/bookings/${b.id}`, data);
    setBusy(false);
    setError(r.ok ? "" : (Object.values(r.fields ?? {})[0] ?? r.error));
    if (r.ok) router.refresh();
  };

  return (
    <li id={b.ref} className={`${CARD} p-5 sm:p-6 ${b.status === "CANCELLED" ? "opacity-65" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2.5">
            <span className="text-[1.0625rem] font-medium">{b.name}</span>
            <Badge tone={TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
          </p>
          <p className="mt-1 text-[0.875rem] text-(--mute)">
            {b.ref}, received {b.received}
          </p>
        </div>
        <select
          aria-label={`Status of ${b.ref}`}
          value={b.status}
          disabled={busy}
          onChange={(e) => run("PATCH", { status: e.target.value })}
          className={`${INPUT} w-auto!`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Service">
          {b.service}
          {b.yacht && <span className="block text-[0.875rem] text-(--mute)">{b.yacht}</span>}
        </Detail>
        <Detail label="When">
          {b.when}
          <span className="block text-[0.875rem] text-(--mute)">{b.duration}</span>
        </Detail>
        <Detail label="Guests">{b.guests}</Detail>
        <Detail label="Contact">
          {b.phone}
          <span className="block text-[0.875rem] text-(--mute)">{b.email}</span>
        </Detail>
        {b.message && (
          <div className="sm:col-span-2 xl:col-span-4">
            <Detail label="Message">
              <span className="whitespace-pre-line">{b.message}</span>
            </Detail>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-(--rule) pt-5">
        <label className="block min-w-56 flex-1">
          <span className={LABEL}>Note for the crew</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className={`${INPUT} mt-1.5`} />
        </label>
        {note !== b.note && (
          <button type="button" className={LINE} disabled={busy} onClick={() => run("PATCH", { note })}>
            Save note
          </button>
        )}
        <a href={`https://wa.me/${b.chat}`} target="_blank" rel="noopener noreferrer" className={LINE}>
          WhatsApp
        </a>
        <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className={LINE}>
          Call
        </a>
        <a href={`mailto:${b.email}?subject=${encodeURIComponent(`Your booking ${b.ref}`)}`} className={LINE}>
          Email
        </a>
        <button
          type="button"
          className={DANGER}
          disabled={busy}
          onClick={() => window.confirm(`Delete the booking ${b.ref} of ${b.name}? This cannot be undone.`) && run("DELETE")}
        >
          Delete
        </button>
      </div>
      {error && (
        <div className="mt-3">
          <Note text={error} bad />
        </div>
      )}
    </li>
  );
}

export default function BookingList({ rows }: { rows: BookingRow[] }) {
  return (
    <ul className="space-y-4">
      {rows.map((b) => (
        <Booking key={b.id} b={b} />
      ))}
    </ul>
  );
}

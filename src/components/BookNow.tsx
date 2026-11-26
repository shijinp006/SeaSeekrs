"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dubaiDay, HOURS, hoursLabel, MAX_GUESTS } from "@/lib/booking";
import { BTN_GOLD, LINK } from "@/lib/motion";

type Props = {
  service: { slug: string; title: string };
  /** the yachts to choose from */
  yachts: string[];
  /** the plain WhatsApp chat: without JavaScript, and when the booking cannot be kept */
  chat: string;
  className?: string;
  children?: React.ReactNode;
};

/** “Book now”: opens the booking form. What is sent is kept for the studio, and goes on as a WhatsApp chat. */
export default function BookNow({ className = BTN_GOLD, children = "Book now", ...props }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={props.chat}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-haspopup="dialog"
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && createPortal(<BookingDialog {...props} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

const INPUT =
  "w-full rounded-[0.8rem] border border-[#17202a33] bg-white px-4 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#5a5f6799] focus:border-(--accent) focus:shadow-[0_0_0_3px_#cfa75f40] aria-invalid:border-[#a52a2a]";

type Errors = Record<string, string>;

function Field({ label, name, errors, optional, wide, children }: { label: string; name: string; errors: Errors; optional?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[0.875rem] font-medium">
        {label}
        {optional && <span className="font-normal text-(--mute)"> (optional)</span>}
      </span>
      {children}
      {errors[name] && (
        <span id={`booking-${name}-error`} className="mt-1.5 block text-[0.8125rem] text-[#a52a2a]">
          {errors[name]}
        </span>
      )}
    </label>
  );
}

function BookingDialog({ service, yachts, chat, onClose }: Props & { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; whatsapp: string } | null>(null);
  const [days] = useState(() => {
    const now = Date.now();
    return { min: dubaiDay(new Date(now)), max: dubaiDay(new Date(now + 365 * 24 * 60 * 60 * 1000)) };
  });

  useEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    const lock = (on: boolean) => {
      document.documentElement.style.overflow = on ? "hidden" : "";
      window.dispatchEvent(new CustomEvent("seaseekers:scroll-lock", { detail: on }));
    };
    lock(true);
    return () => lock(false);
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setErrors({});
    // opened now, while the browser still counts it as part of the click; the chat goes into it once the booking is kept
    const tab = window.open("about:blank", "_blank");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, service: service.slug, hours: Number(data.hours), guests: Number(data.guests) }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json?.ref) {
        if (tab && json.whatsapp) {
          tab.opener = null;
          tab.location.href = json.whatsapp;
        } else tab?.close();
        setDone(json);
        return;
      }
      tab?.close();
      const fields: Errors = json?.fields ?? {};
      setErrors(fields);
      setError(json?.error ?? "The booking could not be sent.");
      const first = Object.keys(fields).find((name) => form.elements.namedItem(name));
      if (first) (form.elements.namedItem(first) as HTMLElement).focus();
    } catch {
      tab?.close();
      setError("No connection. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = (name: string) => ({
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `booking-${name}-error` : undefined,
    className: INPUT,
  });

  return (
    <dialog
      ref={ref}
      data-tone="foam"
      data-lenis-prevent
      aria-labelledby="booking-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
      className="m-auto max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-hidden rounded-[1.5rem] bg-foam p-0 text-ink shadow-2xl backdrop:bg-navy-deep/75"
    >
      <div className="flex max-h-[92svh] flex-col">
        <div className="flex items-start justify-between gap-4 bg-navy-deep px-6 py-5 text-white sm:px-8">
          <div>
            <h2 id="booking-title" className="display text-[1.6rem]">
              {done ? "Booking received" : "Book now"}
            </h2>
            <p className="mt-1.5 text-[0.9375rem] text-white/75">{service.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/25 text-xl leading-none transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7">
          {done ? (
            <div role="status">
              <p className="t-lead">
                Thank you. Your booking number is <strong className="whitespace-nowrap font-semibold">{done.ref}</strong>.
              </p>
              <p className="mt-3 text-(--mute)">
                Send us the WhatsApp message to finish: it opens with your details already written. Our crew confirms the time with you there.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={done.whatsapp || chat} target="_blank" rel="noopener noreferrer" className={BTN_GOLD}>
                  Open WhatsApp
                </a>
                <button type="button" onClick={onClose} className={LINK}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="name" errors={errors} wide>
                  <input {...field("name")} autoComplete="name" required maxLength={80} />
                </Field>
                <Field label="Phone / WhatsApp" name="phone" errors={errors}>
                  <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+971 50 123 4567" required minLength={7} maxLength={30} />
                </Field>
                <Field label="Email" name="email" errors={errors}>
                  <input {...field("email")} type="email" autoComplete="email" required maxLength={160} />
                </Field>
                <Field label="Date" name="date" errors={errors}>
                  <input {...field("date")} type="date" min={days.min} max={days.max} required />
                </Field>
                <Field label="Start time" name="time" errors={errors}>
                  <input {...field("time")} type="time" defaultValue="16:00" required />
                </Field>
                <Field label="Duration" name="hours" errors={errors}>
                  <select {...field("hours")} defaultValue="2">
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {hoursLabel(h)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Guests" name="guests" errors={errors}>
                  <input {...field("guests")} type="number" inputMode="numeric" min={1} max={MAX_GUESTS} step={1} defaultValue={4} required />
                </Field>
                {yachts.length > 0 && (
                  <Field label="Yacht" name="yacht" errors={errors} optional wide>
                    <select {...field("yacht")} defaultValue={yachts.length === 1 ? yachts[0] : ""}>
                      <option value="">No preference</option>
                      {yachts.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Anything else?" name="message" errors={errors} optional wide>
                  <textarea {...field("message")} rows={3} maxLength={1000} placeholder="Occasion, addons, pickup point…" />
                </Field>
              </div>
              {/* for programs that fill in every field; people do not see it */}
              <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
                <label>
                  Website <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {error && (
                <p role="alert" className="mt-5 text-[#a52a2a]">
                  {error}{" "}
                  <a href={chat} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    Or write to us on WhatsApp
                  </a>
                </p>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="submit" disabled={busy} className={`${BTN_GOLD} disabled:opacity-60`}>
                  {busy ? "Sending…" : "Send booking"}
                </button>
                <p className="max-w-xs text-[0.8125rem] leading-relaxed text-(--mute)">
                  Opens WhatsApp with your details. We use them only to arrange this booking.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}

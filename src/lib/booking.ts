// What the booking form asks for, shared by the form, the API and the studio

export const STATUSES = ["NEW", "CONFIRMED", "DONE", "CANCELLED"] as const;
export type BookingStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<BookingStatus, string> = { NEW: "New", CONFIRMED: "Confirmed", DONE: "Done", CANCELLED: "Cancelled" };

export const MAX_GUESTS = 50;
/** Hours on the water; 24 is the whole day */
export const HOURS = [1, 2, 3, 4, 5, 6, 8, 10, 24] as const;
export const hoursLabel = (h: number) => (h === 24 ? "Full day" : h === 1 ? "1 hour" : `${h} hours`);

/** The date in Dubai, 2026-11-25 */
export const dubaiDay = (at: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(at);

const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** 2026-11-25 → Wed, 25 Nov 2026 */
export const dayLabel = (iso: string) => day.format(new Date(`${iso}T00:00:00Z`));

export type BookingText = {
  ref: string;
  serviceTitle: string;
  yacht: string;
  name: string;
  email: string;
  phone: string;
  /** 2026-11-25 */
  date: string;
  time: string;
  hours: number;
  guests: number;
  message: string;
};

/** The message the customer sends on WhatsApp */
export const bookingMessage = (business: string, b: BookingText) =>
  [
    `Hello ${business}, I would like to book:`,
    "",
    `Booking: ${b.ref}`,
    `Service: ${b.serviceTitle}`,
    ...(b.yacht ? [`Yacht: ${b.yacht}`] : []),
    `Date: ${dayLabel(b.date)}, ${b.time}`,
    `Duration: ${hoursLabel(b.hours)}`,
    `Guests: ${b.guests}`,
    "",
    `Name: ${b.name}`,
    `Phone: ${b.phone}`,
    `Email: ${b.email}`,
    ...(b.message ? [`Message: ${b.message}`] : []),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

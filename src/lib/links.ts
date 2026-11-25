import type { Sections } from "@/lib/studio/defaults";

type Business = Sections["business"];

export const whatsapp = (b: Business) => `https://api.whatsapp.com/send/?phone=${b.whatsapp}`;

/** Prefilled WhatsApp chat, used by every "Book now" */
export const book = (b: Business, what: string) =>
  `${whatsapp(b)}&text=${encodeURIComponent(`Hello ${b.name}, I would like to book: ${what}`)}`;

const tel = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

export const contact = (b: Business) => [
  { label: b.mobile, href: tel(b.mobile) },
  { label: b.phone, href: tel(b.phone) },
  { label: b.email, href: `mailto:${b.email}` },
];

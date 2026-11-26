import "server-only";
import { z } from "zod";
import { HOURS, MAX_GUESTS, STATUSES } from "@/lib/booking";
import type { Field, Section } from "@/lib/studio/fields";

const IMAGE_PATH = /^\/(site|media)\/[a-z0-9-]+\.webp$/;
const CONTROL = new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f]");

const plain = (max: number, optional = false) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .refine((s) => optional || s.length > 0, "This is required")
    .refine((s) => !CONTROL.test(s), "Contains characters that are not allowed");
const oneLine = (max: number, optional = false) => plain(max, optional).refine((s) => !/[\r\n]/.test(s), "Must be a single line");

/** http(s), mailto, tel, a path of this site, or #section. Never javascript: and the like. */
const safeUrl = (s: string) =>
  /^#[\w-]+$/.test(s) || /^\/(?![/\\])[^\s\\]*$/.test(s) || (/^(https?:|mailto:|tel:)\S+$/i.test(s) && URL.canParse(s));

const imagePath = (optional = false) => z.string().refine((s) => (optional && s === "") || IMAGE_PATH.test(s), "Choose an image");

const slug = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(80, "Keep it under 80 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Small letters, numbers and single dashes only");

function items<T extends z.ZodType>(f: Field, item: T) {
  const min = f.minItems ?? 0;
  const max = f.maxItems ?? 50;
  return z.array(item).min(min, `Needs at least ${min}`).max(max, `At most ${max}`);
}

function fieldSchema(f: Field): z.ZodType {
  switch (f.type) {
    case "text":
      if (f.key === "slug") return slug;
      return f.key === "focus"
        ? oneLine(20, true).refine((s) => !s || /^\d{1,3}% \d{1,3}%$/.test(s), "Write it like 54% 55%")
        : f.key === "highlight" ? oneLine(f.max ?? 160, true).default("") : oneLine(f.max ?? 160, f.optional);
    case "area":
      return plain(f.max ?? 1200, f.optional);
    case "url":
      return oneLine(f.max ?? 400, f.optional).refine((s) => (f.optional && !s) || safeUrl(s), "Not a valid link");
    case "image":
      return imagePath(f.optional);
    case "strings":
      return items(f, plain(f.max ?? 1200));
    case "images":
      return items(f, imagePath());
    case "list": {
      const list = items(f, objectSchema(f.of!));
      if (!f.of!.some((x) => x.key === "slug")) return list;
      return list.superRefine((rows, ctx) => {
        const seen = new Set<unknown>();
        rows.forEach(({ slug }, i) => {
          if (seen.has(slug)) ctx.addIssue({ code: "custom", path: [i, "slug"], message: "Another one has this address" });
          seen.add(slug);
        });
      });
    }
    // added later: text saved before that does not have them
    case "select":
      return z.enum(f.options!.map(([v]) => v)).default("");
    case "check":
      return z.boolean().default(false);
  }
}

const objectSchema = (fields: Field[]) => z.strictObject(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));

/** Email, WhatsApp and phone numbers are checked more closely than plain text */
function businessSchema(section: Section) {
  return objectSchema(section.fields).superRefine((v, ctx) => {
    const fail = (key: string, message: string) => ctx.addIssue({ code: "custom", path: [key], message });
    if (!z.email().safeParse(v.email).success) fail("email", "Not a valid email");
    if (!/^\d{8,15}$/.test(String(v.whatsapp))) fail("whatsapp", "Digits only, 8 to 15");
    for (const key of ["mobile", "phone"]) if (!/^\+?[\d\s()-]{7,30}$/.test(String(v[key]))) fail(key, "Not a valid number");
  });
}

export const sectionSchema = (section: Section): z.ZodType<Record<string, unknown>> =>
  section.key === "business" ? businessSchema(section) : objectSchema(section.fields);

export const postSchema = z
  .strictObject({
    title: oneLine(120),
    slug,
    excerpt: plain(300, true),
    body: plain(40_000, true),
    cover: imagePath(true),
    seoTitle: oneLine(120, true),
    seoDescription: plain(320, true),
    live: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (!p.live) return;
    for (const key of ["excerpt", "body"] as const)
      if (!p[key]) ctx.addIssue({ code: "custom", path: [key], message: "Needed before it can go on the website" });
  });
export type PostData = z.infer<typeof postSchema>;

export const altSchema = z.strictObject({ alt: oneLine(200, true) });

const email = z.string().trim().toLowerCase().max(160).pipe(z.email("Not a valid email"));
const password = z.string().min(12, "Use 12 characters or more").max(200, "Keep it under 200 characters");
const role = z.enum(["ADMIN", "SEO"]);

/** `area`: the sign-in page it was sent from, which lets in that role only */
export const loginSchema = z.strictObject({ email, password: z.string().min(1, "This is required").max(200), area: role.optional() });
export const passwordSchema = z.strictObject({ current: z.string().min(1, "This is required").max(200), password });
export const newUserSchema = z.strictObject({ name: oneLine(80), email, role, password });
export const userPatchSchema = z
  .strictObject({ name: oneLine(80), role, active: z.boolean(), password })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to change");
export const seedUserSchema = z.strictObject({ email, password });
export const uuidSchema = z.uuid();

/** The booking form of a service */
export const bookingSchema = z.strictObject({
  service: slug,
  yacht: oneLine(191, true).default(""),
  name: oneLine(80),
  email,
  phone: oneLine(30).refine((s) => /^\+?[\d\s().-]+$/.test(s) && /^\d{7,15}$/.test(s.replace(/\D/g, "")), "Not a valid phone number"),
  date: z.iso.date("Choose a day"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time"),
  hours: z.number().refine((h) => (HOURS as readonly number[]).includes(h), "Choose from the list"),
  guests: z.number("How many guests?").int("A whole number").min(1, "At least 1").max(MAX_GUESTS, `At most ${MAX_GUESTS}. For more, write to us on WhatsApp.`),
  message: plain(1000, true).default(""),
  /** hidden from people */
  website: z.string().max(200).default(""),
});

export const bookingPatchSchema = z
  .strictObject({ status: z.enum(STATUSES), note: oneLine(1000, true) })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to change");

/** { "items.2.title": "This is required" } — the first problem of each field */
export const issuesOf = (error: z.ZodError) =>
  Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]).reverse()) as Record<string, string>;

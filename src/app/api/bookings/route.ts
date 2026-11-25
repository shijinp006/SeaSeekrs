import { randomInt } from "node:crypto";
import { bookingMessage, dubaiDay } from "@/lib/booking";
import { whatsapp } from "@/lib/links";
import { ApiError, body, clientIp, openRoute } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { log } from "@/lib/server/log";
import { sameOrigin } from "@/lib/server/origin";
import { publishedSite } from "@/lib/server/site";
import { bookingSchema } from "@/lib/server/validate";
import { getService, yachtsFor } from "@/lib/services";

const MINUTE = 60 * 1000;
const PER_QUARTER = 5;
const PER_DAY = 20;

/** Without the letters and digits that are easily mixed up */
const LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newRef = () => `SS-${Array.from({ length: 6 }, () => LETTERS[randomInt(LETTERS.length)]).join("")}`;

/** The booking form of a service: kept for the studio, and answered with the WhatsApp chat to go on in */
export const POST = openRoute(async (request) => {
  if (!sameOrigin(request)) throw new ApiError(403, "Not allowed from another site");
  const { website, ...data } = await body(request, bookingSchema);
  // people do not see this field, programs fill it in: nothing is kept, and they are not told
  if (website) return { ref: newRef(), whatsapp: "" };

  const site = await publishedSite();
  const service = getService(site, data.service);
  if (!service) throw new ApiError(422, "This service is not offered any more");
  if (data.yacht && !yachtsFor(service, site).some((y) => y.title === data.yacht))
    throw new ApiError(422, "Some fields need another look", { yacht: "Choose one from the list" });
  const today = dubaiDay(new Date());
  const last = dubaiDay(new Date(Date.now() + 366 * 24 * 60 * MINUTE));
  if (data.date < today || data.date > last)
    throw new ApiError(422, "Some fields need another look", { date: data.date < today ? "Choose today or a later day" : "Choose a day within a year" });

  const ip = clientIp(request);
  const since = (minutes: number) => ({ ip, createdAt: { gt: new Date(Date.now() - minutes * MINUTE) } });
  const [lately, inADay] = await Promise.all([db.booking.count({ where: since(15) }), db.booking.count({ where: since(24 * 60) })]);
  if (lately >= PER_QUARTER || inADay >= PER_DAY) {
    log.warn({ ip, lately, inADay }, "booking blocked");
    throw new ApiError(429, "Too many bookings from here. Wait a little, or write to us on WhatsApp.");
  }

  const { service: serviceSlug, date, ...rest } = data;
  const record = { ...rest, serviceSlug, serviceTitle: service.title, date: new Date(`${date}T00:00:00Z`), ip };
  const { ref, id } = await create(record);
  log.info({ bookingId: id, ref }, "booking received");
  const { business } = site.content;
  const text = bookingMessage(business.name, { ...rest, ref, date, serviceTitle: service.title });
  return { ref, whatsapp: `${whatsapp(business)}&text=${encodeURIComponent(text)}` };
});

type Record = Omit<Parameters<typeof db.booking.create>[0]["data"], "ref">;

async function create(data: Record) {
  for (let tries = 0; ; tries++) {
    try {
      return await db.booking.create({ data: { ...data, ref: newRef() }, select: { id: true, ref: true } });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002" || tries > 3) throw error; // the number is taken: another one
    }
  }
}

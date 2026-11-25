import { ApiError, body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { log } from "@/lib/server/log";
import { bookingPatchSchema, uuidSchema } from "@/lib/server/validate";

/** Names and phone numbers of customers: admins only. Nothing the rest of the studio shows depends on it. */
const admin = { role: "ADMIN" as const, changes: false };

const idOf = (id: string) => {
  if (!uuidSchema.safeParse(id).success) throw new ApiError(404, "Not found");
  return id;
};

export const PATCH = route<{ id: string }>(async (request, { user, params }) => {
  const id = idOf(params.id);
  const data = await body(request, bookingPatchSchema);
  await db.booking.update({ where: { id }, data, select: { id: true } });
  log.info({ userId: user.id, bookingId: id, status: data.status }, "booking changed");
}, admin);

export const DELETE = route<{ id: string }>(async (_request, { user, params }) => {
  const id = idOf(params.id);
  await db.booking.delete({ where: { id }, select: { id: true } });
  log.info({ userId: user.id, bookingId: id }, "booking deleted");
}, admin);

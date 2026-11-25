import type { Prisma } from "@/generated/prisma/client";
import { ApiError, body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { getSessionId } from "@/lib/server/session";
import { userPatchSchema, uuidSchema } from "@/lib/server/validate";

type Tx = Prisma.TransactionClient;
const admin = { role: "ADMIN" as const };
const committed = { isolationLevel: "ReadCommitted" as const };

/** Changes to accounts wait for each other, so two of them cannot each take away what they think is not the last admin */
const inTurn = (tx: Tx) => tx.$queryRaw`SELECT id FROM \`User\` WHERE role = 'ADMIN' ORDER BY id FOR UPDATE`;

async function find(tx: Tx, id: string) {
  const user = uuidSchema.safeParse(id).success ? await tx.user.findUnique({ where: { id } }) : null;
  if (!user) throw new ApiError(404, "Not found");
  return user;
}

/** Someone must always be able to manage the accounts */
async function keepAnAdmin(tx: Tx) {
  if (!(await tx.user.count({ where: { role: "ADMIN", active: true } })))
    throw new ApiError(409, "The studio needs at least one active admin");
}

export const PATCH = route<{ id: string }>(async (request, { params }) => {
  const { password, ...data } = await body(request, userPatchSchema);
  const passwordHash = password && (await hashPassword(password));
  const current = (await getSessionId()) ?? undefined;
  await db.$transaction(async (tx) => {
    await inTurn(tx);
    const user = await find(tx, params.id);
    await tx.user.update({ where: { id: user.id }, data: { ...data, ...(passwordHash && { passwordHash }) } });
    await keepAnAdmin(tx);
    // a new password, a new role or a closed account ends the sessions it had
    if (passwordHash || data.active === false || (data.role && data.role !== user.role))
      await tx.session.deleteMany({ where: { userId: user.id, id: { not: current } } });
  }, committed);
}, admin);

export const DELETE = route<{ id: string }>(async (_request, { user, params }) => {
  if (params.id === user.id) throw new ApiError(409, "You cannot delete your own account");
  await db.$transaction(async (tx) => {
    await inTurn(tx);
    await tx.user.delete({ where: { id: (await find(tx, params.id)).id } });
    await keepAnAdmin(tx);
  }, committed);
}, admin);

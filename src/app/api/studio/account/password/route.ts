import { ApiError, body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { checkPassword, hashPassword } from "@/lib/server/password";
import { getSessionId } from "@/lib/server/session";
import { passwordSchema } from "@/lib/server/validate";

export const PUT = route(async (request, { user }) => {
  const { current, password } = await body(request, passwordSchema);
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await checkPassword(current, row.passwordHash)))
    throw new ApiError(422, "Some fields need another look", { current: "That is not your password" });
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  // signs out every other browser
  await db.session.deleteMany({ where: { userId: user.id, id: { not: (await getSessionId()) ?? undefined } } });
});

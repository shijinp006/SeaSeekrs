import { body, route } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { newUserSchema } from "@/lib/server/validate";

export const POST = route(
  async (request) => {
    const { password, ...data } = await body(request, newUserSchema);
    const { id } = await db.user.create({ data: { ...data, passwordHash: await hashPassword(password) } });
    return { id };
  },
  { role: "ADMIN" },
);

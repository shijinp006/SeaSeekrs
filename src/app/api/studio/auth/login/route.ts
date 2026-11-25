import { ApiError, body, clientIp, openRoute } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { log } from "@/lib/server/log";
import { checkPassword } from "@/lib/server/password";
import { startSession } from "@/lib/server/session";
import { loginSchema } from "@/lib/server/validate";

const WINDOW = 15 * 60 * 1000;
const KEEP = 30 * 24 * 60 * 60 * 1000;
const PER_IP = 30;
const PER_EMAIL_AND_IP = 10;
/** From everywhere together. Higher, so that a stranger cannot lock someone out of their account with a few tries */
const PER_EMAIL = 100;

export const POST = openRoute(async (request) => {
  const { email, password } = await body(request, loginSchema);
  const ip = clientIp(request);
  const failed = { success: false, createdAt: { gt: new Date(Date.now() - WINDOW) } };

  // Written before the password is checked, so parallel tries are counted too
  const attempt = await db.loginAttempt.create({ data: { email, ip } });
  const [byIp, byBoth, byEmail] = await Promise.all([
    db.loginAttempt.count({ where: { ip, ...failed } }),
    db.loginAttempt.count({ where: { email, ip, ...failed } }),
    db.loginAttempt.count({ where: { email, ...failed } }),
  ]);
  if (byIp > PER_IP || byBoth > PER_EMAIL_AND_IP || byEmail > PER_EMAIL) {
    log.warn({ ip, byIp, byBoth, byEmail }, "sign-in blocked");
    throw new ApiError(429, "Too many tries. Wait 15 minutes and try again.");
  }

  const user = await db.user.findUnique({ where: { email } });
  const ok = await checkPassword(password, user?.passwordHash);
  if (!ok || !user?.active) {
    log.warn({ ip, userId: user?.id }, "sign-in failed");
    throw new ApiError(401, "Wrong email or password");
  }

  await db.loginAttempt.update({ where: { id: attempt.id }, data: { success: true } });
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP) } } });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(user.id, { ip, userAgent: request.headers.get("user-agent") });
  log.info({ ip, userId: user.id }, "signed in");
});

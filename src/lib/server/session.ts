import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { db } from "./db";
import { COOKIE, signSession, verifyToken } from "./jwt";

const HOUR = 60 * 60 * 1000;
const LIFETIME = 12 * HOUR; // signed out after this, whatever happens
const IDLE = 2 * HOUR; // …or after this long without a request
const TOUCH = 5 * 60 * 1000; // how often lastSeenAt is written

export type SessionUser = { id: string; name: string; email: string; role: Role };

const hash = (sid: string) => createHash("sha256").update(sid).digest("hex");

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
  path: "/",
});

export async function startSession(userId: string, meta: { ip: string; userAgent: string | null }) {
  const sid = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LIFETIME);
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.session.create({ data: { id: hash(sid), userId, expiresAt, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 300) } });
  (await cookies()).set(COOKIE, await signSession(sid, userId, expiresAt), { ...cookieOptions(), expires: expiresAt });
}

export async function endSession() {
  const jar = await cookies();
  const token = await verifyToken(jar.get(COOKIE)?.value);
  if (token) await db.session.deleteMany({ where: { id: hash(token.sid) } });
  jar.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  (await draftMode()).disable();
}

/** Signed token → session in the database → active user. Null at the first thing that does not hold. */
const readSession = cache(async () => {
  await connection(); // the time is read below: never while prerendering
  const token = await verifyToken((await cookies()).get(COOKIE)?.value);
  if (!token) return null;
  const id = hash(token.sid);
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session || session.userId !== token.userId || !session.user.active) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + IDLE <= now) {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  if (session.lastSeenAt.getTime() + TOUCH <= now) await db.session.updateMany({ where: { id }, data: { lastSeenAt: new Date(now) } });
  const { user } = session;
  return { id, user: { id: user.id, name: user.name, email: user.email, role: user.role } satisfies SessionUser };
});

export const getUser = async (): Promise<SessionUser | null> => (await readSession())?.user ?? null;
export const getSessionId = async () => (await readSession())?.id ?? null;

/** For pages: both roles may work in the studio; some pages are for the admin only */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/studio/login");
  if (role && user.role !== role) redirect("/studio");
  return user;
}

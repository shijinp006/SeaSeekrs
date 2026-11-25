import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Role } from "@/generated/prisma/client";
import { defaultAlts } from "@/lib/studio/defaults";
import { db } from "./db";
import { log } from "./log";
import { hashPassword } from "./password";
import { refreshToken } from "./refresh-token";
import { seedUserSchema } from "./validate";

async function siteImages() {
  const dir = path.join(process.cwd(), "public", "site");
  const known = new Set((await db.media.findMany({ where: { uploaded: false }, select: { path: true } })).map((m) => m.path));
  // on Vercel the pictures are served from its network and are not next to the server: they are listed from a computer once
  const fresh = (await readdir(dir).catch(() => [])).filter((f) => /^[a-z0-9-]+\.webp$/.test(f) && !known.has(`/site/${f}`));
  const data = await Promise.all(
    fresh.map(async (name) => {
      const file = path.join(dir, name);
      const [{ width = 0, height = 0 }, { size }] = await Promise.all([sharp(file).metadata(), stat(file)]);
      const src = `/site/${name}`;
      return { path: src, name, alt: defaultAlts[src] ?? "", decorative: name.startsWith("icon-"), width, height, size };
    }),
  );
  if (data.length) await db.media.createMany({ data, skipDuplicates: true });
}

async function firstUsers() {
  if (await db.user.count()) return;
  const seeds: { role: Role; name: string; email?: string; password?: string }[] = [
    { role: "ADMIN", name: "Admin", email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
    { role: "SEO", name: "SEO Specialist", email: process.env.SEED_SEO_EMAIL, password: process.env.SEED_SEO_PASSWORD },
  ];
  for (const { role, name, email, password } of seeds) {
    if (!email && !password) continue;
    const seed = seedUserSchema.safeParse({ email, password });
    if (!seed.success) {
      log.warn(`SEED_${role}_EMAIL / _PASSWORD skipped: not a valid email, or a password under 12 characters`);
      continue;
    }
    await db.user.create({ data: { role, name, email: seed.data.email, passwordHash: await hashPassword(seed.data.password) } });
  }
}

export async function bootstrap() {
  await firstUsers();
  await siteImages();
}

/** Pages are only made again when something is published, and a server that was down then would not know */
export async function refreshOnce() {
  const url = `http://127.0.0.1:${process.env.PORT || 3000}/api/refresh`;
  await fetch(url, { method: "POST", headers: { authorization: `Bearer ${refreshToken()}` } }).catch((error) =>
    log.warn({ err: error }, "could not refresh the pages at start"),
  );
}

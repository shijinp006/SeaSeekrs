import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const OPTIONS: ScryptOptions = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, 64, OPTIONS, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${(await derive(password, salt)).toString("base64")}`;
}

let dummy: Promise<string> | undefined;

/** Takes as long for an unknown user (no hash) as for a wrong password */
export async function checkPassword(password: string, stored: string | undefined) {
  const [, salt, key] = (stored ?? (await (dummy ??= hashPassword("no such user")))).split("$");
  const expected = Buffer.from(key, "base64");
  const same = timingSafeEqual(await derive(password, Buffer.from(salt, "base64")), expected);
  return same && stored !== undefined;
}

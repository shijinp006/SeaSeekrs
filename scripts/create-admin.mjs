// Creates an admin account for the studio, or resets the password of an existing one, in the DATABASE_URL database.
// It does not apply the studio's 12-character rule, so use it only when you mean to.
//
//   node scripts/create-admin.mjs <email> <password> [name]

import { randomBytes, randomUUID, scrypt } from "node:crypto";
import mariadb from "mariadb";

process.loadEnvFile?.(".env");

const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
  process.exit(1);
}

// the same as src/lib/server/password.ts
const OPTIONS = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const hash = (pw) =>
  new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(pw.normalize("NFKC"), salt, 64, OPTIONS, (err, key) =>
      err ? reject(err) : resolve(`scrypt$${salt.toString("base64")}$${key.toString("base64")}`),
    );
  });

const url = new URL(process.env.DATABASE_URL);
const hosted = url.searchParams.get("sslaccept") === "strict" || /[a-z].[a-z]/i.test(url.hostname);
const conn = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ...(hosted ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : { allowPublicKeyRetrieval: true }),
});

try {
  const lower = email.trim().toLowerCase();
  const passwordHash = await hash(password);
  const [found] = await conn.query("SELECT id FROM User WHERE email = ?", [lower]);
  if (found) {
    await conn.query("UPDATE User SET passwordHash = ?, role = 'ADMIN', active = 1, updatedAt = NOW(3) WHERE id = ?", [passwordHash, found.id]);
    await conn.query("DELETE FROM Session WHERE userId = ?", [found.id]); // signed out everywhere
    console.log(`Updated ${lower}: admin, active, new password`);
  } else {
    await conn.query(
      "INSERT INTO User (id, email, name, passwordHash, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'ADMIN', 1, NOW(3), NOW(3))",
      [randomUUID(), lower, name, passwordHash],
    );
    console.log(`Created admin ${lower}`);
  }
} finally {
  await conn.end();
}

import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/** The MySQL pool, from DATABASE_URL. Without one (the build of the Docker image) every query fails soon, and the site shows its starting text. */
function pool() {
  const given = process.env.DATABASE_URL ?? "";
  const known = URL.canParse(given);
  const url = new URL(known ? given : "mysql://localhost");
  // A hosted database (TiDB Cloud, say) is reached over the internet: always encrypted, with a certificate that is checked
  const hosted = url.searchParams.get("sslaccept") === "strict" || /[a-z].[a-z]/i.test(url.hostname);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: hosted ? 5 : 10, // Vercel runs several copies of the app, each with a pool of its own
    connectTimeout: hosted ? 6000 : 2000,
    acquireTimeout: hosted ? 8000 : known ? 3000 : 500, // how long a visitor waits while the database is down
    ...(hosted
      ? { ssl: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true } }
      : // MySQL 8 signs in with the server's public key when the connection is not encrypted; the database is on this
        // machine or in the private Docker network
        { allowPublicKeyRetrieval: true }),
  };
}

const create = () => new PrismaClient({ adapter: new PrismaMariaDb(pool()), transactionOptions: { maxWait: 8000, timeout: 15000 } });

// One client across hot reloads
const store = globalThis as unknown as { prisma?: PrismaClient };
export const db = (store.prisma ??= create());

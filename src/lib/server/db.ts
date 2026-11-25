import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/** The MySQL pool, from DATABASE_URL. Without one (the build of the Docker image) every query fails soon, and the site shows its starting text. */
function pool() {
  const given = process.env.DATABASE_URL ?? "";
  const known = URL.canParse(given);
  const url = new URL(known ? given : "mysql://localhost");
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 10,
    connectTimeout: 3000,
    acquireTimeout: known ? 8000 : 500,
    // MySQL 8 signs in with the server's public key when the connection is not encrypted; the database is on this
    // machine or in the private Docker network
    allowPublicKeyRetrieval: true,
  };
}

const create = () => new PrismaClient({ adapter: new PrismaMariaDb(pool()) });

// One client across hot reloads
const store = globalThis as unknown as { prisma?: PrismaClient };
export const db = (store.prisma ??= create());

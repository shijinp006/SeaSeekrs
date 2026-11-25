import "server-only";
import { z } from "zod";
import type { Role } from "@/generated/prisma/client";
import { log } from "./log";
import { getUser, type SessionUser } from "./session";
import { refreshStudio } from "./refresh";
import { issuesOf } from "./validate";

/** Thrown inside a route: becomes a JSON answer with this status */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function failure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message, fields: error.fields }, error.status);
  if (error instanceof z.ZodError) {
    const fields = issuesOf(error);
    return json({ error: fields[""] ?? "Some fields need another look", fields }, 422);
  }
  // Prisma: a unique value is taken / the row is gone
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return json({ error: "That is already in use" }, 409);
  if (code === "P2025") return json({ error: "Not found" }, 404);
  // …or two changes met at the same moment, and the database let only one through
  if (code === "P2034") return json({ error: "Something else was being saved at the same moment. Please try again." }, 409);
  log.error({ err: error }, "studio api failed");
  return json({ error: "Something went wrong on the server" }, 500);
}

type Ctx<P> = { params: Promise<P> };

/** A studio route: signed-in users only (or one role), errors turned into JSON */
export function route<P = Record<string, never>>(
  handler: (request: Request, args: { user: SessionUser; params: P }) => Promise<unknown>,
  { role, changes = true }: { role?: Role; /** false: nothing in the database is different afterwards */ changes?: boolean } = {},
) {
  return async (request: Request, ctx: Ctx<P>) => {
    try {
      const user = await getUser();
      if (!user) throw new ApiError(401, "Please sign in again");
      const what = { userId: user.id, method: request.method, path: new URL(request.url).pathname };
      if (role && user.role !== role) {
        log.warn(what, "not allowed");
        throw new ApiError(403, "Only an admin can do this");
      }
      const answer = (await handler(request, { user, params: await ctx.params })) ?? { ok: true };
      if (changes && request.method !== "GET") {
        log.info(what, "studio change");
        refreshStudio(); // the studio reads its data again, once
      }
      return json(answer);
    } catch (error) {
      return failure(error);
    }
  };
}

/** The same without a session: signing in */
export const openRoute = (handler: (request: Request) => Promise<unknown>) => async (request: Request) => {
  try {
    return json((await handler(request)) ?? { ok: true });
  } catch (error) {
    return failure(error);
  }
};

const MAX_JSON = 512 * 1024;

/** Reads and validates a JSON body */
export async function body<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "Expected JSON");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_JSON) throw new ApiError(413, "That is too much text");
  const raw = await request.text();
  if (raw.length > MAX_JSON) throw new ApiError(413, "That is too much text");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Not valid JSON");
  }
  return schema.parse(value);
}

/**
 * Each proxy adds the address it was called from to the right of X-Forwarded-For; whatever stands further left was sent
 * by the visitor and may be made up. PROXY_HOPS is the number of our own proxies in front of the app.
 */
export function clientIp(request: Request) {
  const hops = Math.max(1, Math.floor(Number(process.env.PROXY_HOPS)) || 1);
  const chain = (request.headers.get("x-forwarded-for") ?? "").split(",").map((ip) => ip.trim()).filter(Boolean);
  return (chain.at(-hops) ?? chain[0] ?? "unknown").slice(0, 64);
}

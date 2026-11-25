import { timingSafeEqual } from "node:crypto";
import { refreshSite } from "@/lib/server/site";
import { refreshToken } from "@/lib/server/refresh-token";

/** Called once by the server itself when it starts (instrumentation.ts) */
export async function POST(request: Request) {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${refreshToken()}`);
  if (!process.env.AUTH_SECRET || given.length !== expected.length || !timingSafeEqual(given, expected))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  refreshSite();
  return Response.json({ ok: true });
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { COOKIE, verifyToken } from "@/lib/server/jwt";
import { sameOrigin } from "@/lib/server/origin";
import { pagesOf, readServicesPage, services } from "@/lib/services";

// Middleware (called Proxy since Next.js 16) for the SEO studio (/studio) and the admin panel (/admin): checks the JWT in the session cookie before any studio
// page or API route runs. The database session and the role are checked again in the page / route itself.

const OPEN = new Set(["/studio/login", "/admin/login", "/api/studio/auth/login"]);

function secured(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

/**
 * A page that streams has already answered 200 when it finds out there is nothing to show, so this is checked first:
 * an unknown address gets a real 404, which is what Google expects
 */
const orNotFound = (request: NextRequest, known: boolean) =>
  known ? NextResponse.next() : NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });

async function postExists(slug: string) {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return false; // no need to ask the database
  return (await db.post.count({ where: { publishedSlug: slug } }).catch(() => 1)) > 0; // without a database, let the page decide
}

/** The addresses of the published services, or of the starting ones */
async function serviceSlugs() {
  const entry = await db.entry.findUnique({ where: { key: "services.items" }, select: { published: true } }).catch(() => null);
  return ((entry?.published as { items?: { slug: string }[] } | null)?.items ?? services).map((s) => s.slug);
}

async function serviceExists(name: string, page: string | undefined) {
  const slugs = await serviceSlugs();
  return page ? readServicesPage(page, pagesOf(slugs.length)) !== null : slugs.includes(name);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, top, name, page] = pathname.split("/");
  const preview = request.cookies.has("__prerender_bypass"); // the page decides, and shows drafts to editors only
  if (top === "blog") return orNotFound(request, preview || (await postExists(name)));
  if (top === "services") return orNotFound(request, preview || (await serviceExists(name, page)));
  const api = pathname.startsWith("/api/");

  if (api && !["GET", "HEAD"].includes(request.method) && !sameOrigin(request))
    return secured(NextResponse.json({ error: "Not allowed from another site" }, { status: 403 }));

  if (OPEN.has(pathname) || (await verifyToken(request.cookies.get(COOKIE)?.value))) return secured(NextResponse.next());

  if (api) return secured(NextResponse.json({ error: "Please sign in again" }, { status: 401 }));
  const area = top === "admin" ? "/admin" : "/studio"; // each area has a sign-in page of its own
  const login = new URL(`${area}/login`, request.url);
  if (pathname !== area) login.searchParams.set("next", pathname);
  return secured(NextResponse.redirect(login));
}

export const config = { matcher: ["/studio/:path*", "/admin/:path*", "/api/studio/:path*", "/blog/:slug", "/services/:slug", "/services/page/:page"] };

/** A browser sends the Origin of the page a write comes from: it must be this site */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  // not X-Forwarded-Host: anyone can send that
  return URL.canParse(origin) && new URL(origin).host === request.headers.get("host");
}

import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// What a page may load: this site only. Scripts and styles may be inline, because the pages are prerendered and Next.js
// writes its data into them; 'unsafe-eval' and the websocket are for `next dev`.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'", // the studio shows the pages in its preview
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=31536000" }, // browsers ignore it over plain http
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// These files keep their names when they are exported again, so browsers check them again after a day
const pictures = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig: NextConfig = {
  // the Docker image runs the standalone server
  output: process.env.NEXT_STANDALONE ? "standalone" : undefined,
  poweredByHeader: false,
  devIndicators: false, // the badge of `next dev` lies over the page and its preview; errors are still shown
  cacheComponents: true,
  partialPrefetching: true,
  // the cache of the last build keeps the old styles after globals.css has changed (Vercel keeps it between deployments)
  experimental: { turbopackFileSystemCacheForBuild: false },
  images: {
    formats: ["image/webp"],
    // nothing else goes through the image optimiser: no other sites, no API routes, no query strings
    localPatterns: [
      { pathname: "/site/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
  },
  headers: async () => [
    { source: "/:path*", headers: security },
    {
      source: "/studio/:path*", // nothing may frame the studio itself
      headers: [
        { key: "Content-Security-Policy", value: csp.replace("frame-ancestors 'self'", "frame-ancestors 'none'") },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
    ...(dev ? [] : ["/hero/:path*", "/site/:path*"].map((source) => ({ source, headers: pictures }))),
  ],
  redirects: async () => [{ source: "/services/page/1", destination: "/services", permanent: true }],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

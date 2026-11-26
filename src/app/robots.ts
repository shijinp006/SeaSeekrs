import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/admin", "/api/"] }, sitemap: siteUrl("/sitemap.xml") };
}

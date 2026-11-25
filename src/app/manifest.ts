import type { MetadataRoute } from "next";
import { company } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sea Seakers Yachts & Boats Rental",
    short_name: company.name,
    start_url: "/",
    display: "browser",
    background_color: "#04161e",
    theme_color: "#0b1a2b",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}

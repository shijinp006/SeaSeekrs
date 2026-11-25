import type { MetadataRoute } from "next";
import { company } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sea Seakers Yachts & Boats Rental",
    short_name: company.name,
    start_url: "/",
    display: "browser",
    background_color: "#081320",
    theme_color: "#081320",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}

// The tours on the home page (home.tours) each have a page of their own: /tours/<name as an address>
import type { Site } from "@/lib/server/site";

export type Tour = Site["content"]["home.tours"]["items"][number];

/** "Burj Al Arab" becomes "burj-al-arab" */
export const tourSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export const toursOf = (site: Site): Tour[] => site.content["home.tours"].items;
export const getTour = (site: Site, slug: string) => toursOf(site).find((t) => tourSlug(t.name) === slug);

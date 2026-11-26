/**
 * The fleet showcase on the home page (sections/Explore, YachtShowcase): our own boats, seen clearly from outside,
 * one picture each, by the page it opens. That page starts on the same picture, so it can be carried across.
 */
export const FLEET = [
  { slug: "yacht-rental", photo: "/site/y48-main.webp", yacht: "48 ft", tint: "radial-gradient(80% 90% at 75% 40%, #cfe6f4 0%, #ffffff 70%)" },
  { slug: "boat-rental", photo: "/site/y31-main.webp", yacht: "31 ft", tint: "radial-gradient(80% 90% at 75% 40%, #cde3f7 0%, #ffffff 70%)" },
  { slug: "fishing", photo: "/site/y31-2.webp", yacht: "31 ft", tint: "radial-gradient(80% 90% at 75% 40%, #d3ece8 0%, #ffffff 70%)" },
  { slug: "party-celebration", photo: "/site/y48-1.webp", yacht: "48 ft", tint: "radial-gradient(80% 90% at 75% 40%, #f1dfd6 0%, #ffffff 70%)" },
  { slug: "jet-ski", photo: "/site/y48-5.webp", yacht: "48 ft", tint: "radial-gradient(80% 90% at 75% 40%, #d8e2f4 0%, #ffffff 70%)" },
];

/** Pictures of our own boats only (not guests, not other yachts) */
const OWN = /\/site\/(y48|y31)-[\w-]+\.webp$/;
const BOAT = { "48 ft": ["y48-main", "y48-1", "y48-5", "y48-3", "y48-4", "y48-12"], "31 ft": ["y31-main", "y31-2", "y31-1", "y31-3", "y31-4"] } as const;

/** The photos a showcased page opens with: its showcase picture first, then only pictures of that boat */
export function fleetPhotos(slug: string, photos: string[]): string[] {
  const f = FLEET.find((x) => x.slug === slug);
  if (!f) return photos;
  const boat = BOAT[f.yacht as keyof typeof BOAT].map((n) => `/site/${n}.webp`);
  const own = photos.filter((p) => OWN.test(p));
  return [...new Set([f.photo, ...own, ...boat])].slice(0, 5);
}

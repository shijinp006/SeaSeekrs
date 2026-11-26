// The services page: one entry per service, in the order they are shown. Prices, specifications and what is
// included are not repeated here: the detail pages take them from the yachts (home.yachts), so they stay in step.

import type { Site } from "@/lib/server/site";
import type { Sections } from "@/lib/studio/defaults";

const photo = (name: string) => `/site/${name}.webp`;

export const SERVICES_PER_PAGE = 6;

/** The starting text of a service; what is published is edited in the SEO studio */
export type ServiceText = {
  slug: string;
  title: string;
  /** on the card, and under the heading of the detail page */
  summary: string;
  body: string[];
  points: string[];
  /** the first one is on the card; at most five */
  photos: string[];
  /** only the yachts with this in their name; all of them when left out */
  yacht?: string;
};

export const servicesPage = {
  title: "Our services",
  body: "Charters, sea trips and celebrations on Dubai's waters. Choose one to see the details.",
  image: photo("cta-yacht"),
  seo: {
    title: "Yacht Charter Services in Dubai | Sea Seakers",
    description:
      "Yacht and boat rental, fishing, diving, sailing, tours and celebrations on the water in Dubai. See every Sea Seakers service and book on WhatsApp.",
    image: photo("cta-yacht"),
  },
};

export const services: ServiceText[] = [
  {
    slug: "yacht-rental",
    title: "Yacht Rental",
    summary: "Rent a private 48 ft Sea Ray with captain and crew, by the hour or for the whole day.",
    body: [
      "Powered by two 580 HP engines, our 48 ft yacht hosts up to 11 guests with two crew members and one captain.",
      "Two ample cabins give up to four guests a comfortable night on board, and the sundeck and salon are yours for the day.",
    ],
    points: ["Private, fully equipped yacht", "Captain and two crew members", "Two cabins and bath", "Sundeck and salon"],
    photos: ["y48-main", "y48-1", "y48-3", "y48-12", "about-2"].map(photo),
    yacht: "48 ft",
  },
  {
    slug: "boat-rental",
    title: "Boat Rental",
    summary: "Take out our 31 ft boat with two crew members, for up to 10 guests.",
    body: [
      "Powered by two 200 HP engines, the 31 ft boat is equipped with all fishing and safety equipment.",
      "It hosts up to 10 guests with two crew members, with a cabin, a salon, air conditioning and music speakers on board.",
    ],
    points: ["Private, fully equipped boat", "Two crew members", "One cabin and a salon", "Fishing and safety equipment"],
    photos: ["y31-2", "y31-main", "y31-1", "y31-3", "y31-4"].map(photo),
    yacht: "31 ft",
  },
  {
    slug: "sailing",
    title: "Sailing",
    summary: "Sail Dubai's waters in affordable luxury, past iconic landmarks and over serene seas.",
    body: [
      "Sail Dubai's waters in affordable luxury with Sea Seakers. Iconic landmarks, serene seas, and memorable moments await.",
      "Tell us your preferred route and the size of your group, and our team will check availability and arrange the rest.",
    ],
    points: ["A route planned with you", "Experienced captain and crew", "Safety equipment on board"],
    photos: ["why", "about-aerial", "cta-yacht"].map(photo),
  },
  {
    slug: "yacht-club",
    title: "Yacht Club",
    summary: "Exclusive access to luxury yachting experiences in Dubai. Membership has its privileges.",
    body: [
      "Join our Yacht Club for exclusive access to luxury yachting experiences in Dubai. Membership has its privileges.",
      "Ask us on WhatsApp what membership includes and how to join.",
    ],
    points: ["Exclusive access for members", "Luxury yachting experiences in Dubai", "A fleet we own ourselves"],
    photos: ["y48-3", "y48-4", "about-5", "y48-1"].map(photo),
  },
  {
    slug: "diving",
    title: "Diving",
    summary: "Dive into the depths of Dubai's underwater wonders, marine life and shipwrecks.",
    body: [
      "Dive into the depths of Dubai's underwater wonders with Sea Seakers. Explore marine life and shipwrecks on your diving adventure.",
      "Contact our team before you book, so we can plan the trip around your group.",
    ],
    points: ["Marine life and shipwrecks", "Experienced crew", "Safety equipment and first aid on board"],
    photos: ["service-diving", "about-aerial", "tour-lagoon"].map(photo),
  },
  {
    slug: "fishing",
    title: "Fishing",
    summary: "Cast your line and reel in unforgettable moments on our 31 ft fishing charter.",
    body: [
      "Experience thrilling fishing expeditions in Dubai with Sea Seakers. Cast your line and reel in unforgettable moments on the water.",
      "The 31 ft boat carries all the necessary fishing equipment, and hosts up to 10 guests with two crew members.",
    ],
    points: ["All necessary fishing equipment", "Up to 10 guests", "Two crew members"],
    photos: ["y31-main", "y31-2", "y31-4", "y31-1"].map(photo),
    yacht: "31 ft",
  },
  {
    slug: "tour",
    title: "Tour",
    summary: "See the Burj Al Arab, Atlantis, Ain Wheel and the skyline from the water.",
    body: [
      "Embark on an unforgettable Dubai tour with Sea Seakers. Explore the city's beauty and history from the unique perspective of the sea.",
      "Choose from the skyline, the Burj Al Arab, Atlantis, the Ain Wheel, the lagoon and the harbour, or ask us for a route of your own.",
    ],
    points: ["Skyline and harbour", "Burj Al Arab and Atlantis", "Ain Wheel and lagoon"],
    photos: ["y48-5", "tour-skyline", "tour-burj", "tour-atlantis", "tour-ain"].map(photo),
  },
  {
    slug: "party-celebration",
    title: "Party & Celebration",
    summary: "Bring everyone on board and celebrate on the 48 ft yacht.",
    body: [
      "Hold your party or celebration on the 48 ft yacht, with a sundeck, a salon and music speakers for up to 11 guests.",
      "A DJ, catering and a photographer can be added. Tell us what you have in mind and we will quote for it.",
    ],
    points: ["Up to 11 guests", "Sundeck, salon and music speakers", "DJ, catering and photographer on request"],
    photos: ["guest-2", "guest-4", "about-5", "y48-11"].map(photo),
    yacht: "48 ft",
  },
  {
    slug: "pre-wedding-shoot",
    title: "Pre-wedding Shoot",
    summary: "Your pre-wedding photos on deck, with Dubai as the backdrop.",
    body: [
      "Add a pre-wedding shoot to your charter and have your photos taken on deck, with the Dubai skyline behind you.",
      "Available on both of our yachts. A professional photographer can be arranged as an addon.",
    ],
    points: ["Available on both yachts", "Dubai skyline as the backdrop", "Photographer on request"],
    photos: ["guest-1", "y48-1", "tour-skyline"].map(photo),
  },
  {
    slug: "honeymoon",
    title: "Honeymoon",
    summary: "A private yacht for two, with a cabin for the night.",
    body: [
      "Celebrate your honeymoon on a private yacht with its own crew. It can be added to a charter on either of our yachts.",
      "Both have cabins for overnight guests. Meals can be added too.",
    ],
    points: ["Private charter", "Cabin for overnight guests", "Meals on request"],
    photos: ["about-2", "about-5", "tour-harbour"].map(photo),
  },
  {
    slug: "professional-photographer",
    title: "Professional Photographer",
    summary: "Keep the day: add a professional photographer to your charter.",
    body: [
      "Add a professional photographer to any charter, for a family day, a celebration or a tour of the landmarks.",
      "Available on both of our yachts, for an extra fee.",
    ],
    points: ["Available on both yachts", "For families, couples and groups", "Booked together with your charter"],
    photos: ["guest-4", "guest-3", "guest-1", "guest-2"].map(photo),
  },
  {
    slug: "jet-ski",
    title: "Jet Ski",
    summary: "Add a jet ski to your day on the 48 ft yacht.",
    body: [
      "Add a jet ski to your charter of the 48 ft yacht and make more of the water while you are out.",
      "Jet skis are an addon for an extra fee. Ask us about availability when you book.",
    ],
    points: ["Addon to the 48 ft yacht", "Booked together with your charter", "Ask for availability"],
    photos: ["about-aerial", "tour-lagoon", "y48-5"].map(photo),
    yacht: "48 ft",
  },
];

export type Service = Sections["services.items"]["items"][number];

export const servicesOf = (site: Site): Service[] => site.content["services.items"].items;
export const pagesOf = (count: number) => Math.ceil(count / SERVICES_PER_PAGE);
export const servicePages = (site: Site) => pagesOf(servicesOf(site).length);
export const servicesOn = (site: Site, page: number) => servicesOf(site).slice((page - 1) * SERVICES_PER_PAGE, page * SERVICES_PER_PAGE);
export const servicesHref = (page: number) => (page === 1 ? "/services" : `/services/page/${page}`);
/** 2, 3 … up to the last page, else null */
export function readServicesPage(page: string, pages: number) {
  const n = /^[1-9]\d{0,3}$/.test(page) ? Number(page) : 0;
  return n >= 2 && n <= pages ? n : null;
}
export const getService = (site: Site, slug: string) => servicesOf(site).find((s) => s.slug === slug);
/** The page of the list a service is on */
export const pageOf = (site: Site, s: Service) => Math.floor(servicesOf(site).indexOf(s) / SERVICES_PER_PAGE) + 1;

/** Their yacht as it is published now; every yacht if none has that name any more */
export function yachtsFor({ yacht }: Service, site: Site) {
  const all = site.content["home.yachts"].items;
  const own = yacht ? all.filter((y) => y.title.includes(yacht)) : all;
  return own.length ? own : all;
}

// The text the site starts with (src/lib/content.ts), in the shape the studio edits.

import * as c from "@/lib/content";
import { services, servicesPage } from "@/lib/services";

const look = { tag: "", size: "" };
const plain = { highlight: "", ...look };
const texts = { bodyTag: "" };
const items = { itemTag: "" };

const opener = c.tours.find((t) => t.name === "Skyline")!;

export const defaults = {
  "home.seo": {
    title: "Best Yacht Rental in Dubai | Sea Seakers Yachts & Boats",
    description:
      "Welcome to Sea Seakers, where luxury meets affordability on Dubai's waters. Explore the stunning coastline and iconic landmarks in style.",
    image: c.about.src,
    noindex: false,
  },
  "home.hero": {
    line1: "Sea",
    line2: "Seakers",
    ...look,
    ...texts,
    body: "Private yacht charters across the world's most beautiful waters — crewed, curated and composed around you.",
    hint: "Scroll to explore",
    captions: c.heroFilm.captions.map(({ lines: [line1, line2] }) => ({ line1, line2 })),
  },
  "home.welcome": {
    line1: c.welcome.lines[0],
    line2: `${c.welcome.lines[1]} ${c.welcome.accent}`,
    ...look,
    ...texts,
    body: c.welcome.body,
    image: c.about.src,
    cta: "See the yachts",
    ask: "Ask on WhatsApp",
    included: c.included.map(([label, value]) => ({ label: label as string, value: value as string })),
  },
  "home.about": {
    title: c.about.title.join(" "),
    ...plain,
    ...texts,
    body: c.about.body,
    portrait: c.about.portrait.src,
    inset: c.about.inset.src,
  },
  "home.services": {
    title: c.servicesIntro.title,
    ...plain,
    ...items,
    items: c.services.map(({ title, body, src }) => ({ title, body, image: src })),
  },
  "home.tours": {
    ...c.toursIntro,
    ...plain,
    ...texts,
    ...items,
    // the city at dusk opens the tours
    items: [opener, ...c.tours.filter((t) => t !== opener)].map(({ name, src, focus }) => ({ name, image: src, focus })),
  },
  "home.yachts": {
    title: c.yachtsIntro.title.join(" "),
    ...plain,
    ...texts,
    ...items,
    body: c.yachtsIntro.body,
    items: c.yachts.map((y) => ({
      title: y.title,
      kicker: y.kicker,
      body: y.body,
      specs: y.specs.map(([label, value]) => ({ label, value })),
      daily: y.daily,
      hourly: y.hourly,
      features: y.features,
      addons: y.addons,
      photos: [y.src, ...y.gallery],
    })),
  },
  "home.onboard": {
    title: c.why.title.join(" "),
    ...plain,
    ...texts,
    ...items,
    body: c.why.body,
    salon: c.onBoardPhotos[0].src,
    cabin: c.onBoardPhotos[1].src,
    items: c.comforts,
  },
  "home.reviews": {
    title: "What our clients say",
    ...plain,
    items: c.reviews.map((r, i) => ({ who: r.who, quote: r.quote, image: c.guests[i].src })),
    short: c.shortReviews,
  },
  "home.faq": { title: c.faq.title.join(" "), ...plain, ...texts, ...items, body: c.faq.body, items: c.faq.items },
  "home.bow": { title: c.bow.lines.join(" "), ...plain, ...texts, body: c.bow.body, cta: c.bow.cta, image: c.bow.src },
  "services.seo": { ...servicesPage.seo, noindex: false },
  "services.intro": { title: servicesPage.title, ...plain, ...texts, body: servicesPage.body, image: servicesPage.image },
  "services.items": {
    ...items,
    items: services.map(({ yacht = "", ...s }) => ({ ...s, yacht, seoTitle: "", seoDescription: "" })),
  },
  "blog.seo": {
    title: "Yacht Charter Blog: Dubai Guides | Sea Seakers",
    description:
      "Guides to Dubai from the water: routes, landmarks, prices and tips for renting a yacht or fishing boat with Sea Seakers.",
    image: c.bow.src,
    noindex: false,
  },
  "blog.intro": {
    title: "Notes from the water",
    ...plain,
    ...texts,
    body: "Routes, landmarks and tips for a day at sea in Dubai.",
  },
  "layout.header": {
    links: [
      { label: "About", href: "#about" },
      { label: "Services", href: "/services" },
      { label: "Tours", href: "#tours" },
      { label: "Yachts", href: "#yachts" },
      { label: "Reviews", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
    ],
    cta: "Book now",
  },
  "layout.footer": {
    body: "Sea Seakers Yacht and Boat Rental, located in the heart of Dubai, is your gateway to luxury yacht charters in Dubai. We are one of the leading charter companies in Dubai to own its own fleet of yachts.",
    explore: [
      { label: "About Us", href: "#about" },
      { label: "Services", href: "/services" },
      { label: "Tours", href: "#tours" },
      { label: "Yacht & Boat Rental", href: "#yachts" },
      { label: "Reviews", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
    ],
    legal: c.company.legalLinks,
  },
  business: {
    name: c.company.name,
    legal: c.company.legal,
    address: c.company.address,
    email: c.company.email,
    mobile: c.company.mobile.label,
    phone: c.company.phone.label,
    whatsapp: c.company.mobile.href.replace(/\D/g, ""),
    instagram: c.company.instagram,
    youtube: c.company.youtube,
    trustpilot: c.company.trustpilot,
    google: c.company.google,
    priceRange: "",
    openingHours: "",
  },
};

export type Sections = typeof defaults;
export type SectionKey = keyof Sections;

/** The alt text each picture of the site starts with */
export const defaultAlts: Record<string, string> = Object.fromEntries([
  ...c.tours.map((t) => [t.src, `${t.name}, Dubai`]),
  ...c.yachts.map((y) => [y.src, y.title]),
  ...[c.about, c.about.portrait, c.about.inset, ...c.services, ...c.onBoardPhotos, ...c.guests, c.bow].map((p) => [p.src, p.alt]),
  [c.company.logo.src, `${c.company.name} Leisure Yachts & Boats Rental`],
]);

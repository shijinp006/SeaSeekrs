// All site copy and imagery in one place — swap photos or text here.
// Copy and photos come from seaseakersyachts.com. Photos are optimised into public/site with
//   node scripts/export-site-images.mjs

import film from "./hero-film.json";

const photo = (name: string) => `/site/${name}.webp`;

/**
 * Hero film: one continuous drone shot (yacht at anchor → stern → over the teak deck → into the salon),
 * exported from source-media/hero-yacht-2026-11-25.mp4 (kept out of public/ so it isn't deployed): full-HD frames as
 * H.264 for the hardware decoder (film.bin), plus AVIF / WebP stills for browsers without WebCodecs. The frames the
 * video leaves out are filled in, and the fast part has twice as many: see scripts/hero-frames.mjs.
 * Re-export after replacing the video:
 *   node scripts/export-hero.mjs source-media/<file>.mp4
 *   node scripts/export-hero-film.mjs source-media/<file>.mp4
 * Caption `from` / `to` are fractions of the whole scroll.
 */
export const heroFilm = {
  ...film, // frames and pace, written by scripts/export-hero-film.mjs
  src: { lg: "/hero/lg", sm: "/hero/sm" },
  length: 7, // viewport heights of scroll for the film
  captions: [
    { lines: ["Every horizon,", "privately yours."], from: 0.1, to: 0.46 },
    { lines: ["A voyage", "without compromise."], from: 0.5, to: 1 },
  ] as { lines: [string, string]; from: number; to: number }[],
};

export const company = {
  name: "Sea Seakers",
  logo: { src: photo("logo"), width: 522, height: 466 },
  legal: "SEA SEAKERS LEISURE YACHTS & BOATS RENTAL L.L.C",
  address: "Al fahidhi plaza, office no 89, Dubai UAE",
  email: "seaseakersyachts@gmail.com",
  mobile: { label: "+971 529236730", href: "tel:+971529236730" },
  phone: { label: "+971 44497276", href: "tel:+97144497276" },
  whatsapp: "https://api.whatsapp.com/send/?phone=971529236730",
  instagram: "https://www.instagram.com/seaseakers_yachts/",
  youtube: "https://youtube.com/shorts/SMyJu4zUGAA?feature=share",
  trustpilot: "https://www.trustpilot.com/review/seaseakersyachts.com",
  google: "https://g.page/r/CQzjF1DzyMvuEAI/review",
  legalLinks: [
    { label: "Payment & Cancellation Policy", href: "https://seaseakersyachts.com/refund-cancellation-policy/" },
    { label: "Privacy Policy", href: "https://seaseakersyachts.com/privacy-policy/" },
    { label: "Terms And Conditions", href: "https://seaseakersyachts.com/terms-and-conditions/" },
  ],
};

export const welcome = {
  kicker: "Most affordable yacht rental service in Dubai",
  lines: ["Luxury awaits.", "Your yacht adventure"] as [string, string],
  accent: "begins.",
  body: "Embark on your dream yacht adventure in Dubai. Experience luxury, breathtaking views, and unforgettable moments. Your journey begins here.",
};

// Facts from the yachts below, shown beside the welcome
export const included = [
  ["From", "350 AED an hour"],
  ["Crew", "Experienced captain and crew"],
  ["On board", "Fuel, soft drinks, ice and towels included"],
] as const;

export const servicesIntro = { title: "Five ways to spend a day at sea" };

export const services = [
  { src: photo("why"), alt: "A sailing yacht under way", title: "Sailing", body: "Sail Dubai's waters in affordable luxury with Sea Seakers. Iconic landmarks, serene seas, and memorable moments await. Book today!" },
  { src: photo("y48-3"), alt: "Cushioned seating on the flybridge of the 48 ft yacht", title: "Yacht Club", body: "Join our Yacht Club for exclusive access to luxury yachting experiences in Dubai. Membership has its privileges. Set sail today!" },
  { src: photo("service-diving"), alt: "Clear turquoise water over a reef", title: "Diving", body: "Dive into the depths of Dubai's underwater wonders with Sea Seakers. Explore marine life and shipwrecks on your diving adventure." },
  { src: photo("y31-main"), alt: "The 31 ft fishing boat at sea", title: "Fishing", body: "Experience thrilling fishing expeditions in Dubai with Sea Seakers. Cast your line and reel in unforgettable moments on the water." },
  { src: photo("y48-5"), alt: "The bow of the yacht heading for the Ain Dubai wheel", title: "Tour", body: "Embark on an unforgettable Dubai tour with Sea Seakers. Explore the city's beauty and history from the unique perspective of the sea." },
];

export const about = {
  src: photo("about-aerial"),
  alt: "Luxury yacht seen from the air on turquoise water",
  title: ["Your gateway to luxury", "yacht charters in Dubai."],
  body: [
    "Sea Seakers Yachts and Boat Rental, located in the heart of Dubai, is your gateway to luxury yacht charters in Dubai. We are one of the leading charter companies in Dubai to own its own fleet of yachts. Our vision is to provide unrivaled experiences at sea, and our journey began with a deep passion for the ocean.",
    "Our dedicated crew members ensure impeccable service, and we take you to stunning destinations in the Arabian Gulf, all while committing to sustainable yachting practices.",
    "Discover the epitome of luxury and embark on a voyage of a lifetime with Sea Seakers Yachts and Boat Rental. With a meticulously maintained fleet of elegant yachts, Sea Seakers is the best place for a yacht for rent in Dubai.",
  ],
  portrait: { src: photo("y48-4"), alt: "Sea Seakers cushions at the helm, off Dubai" },
  inset: { src: photo("y48-1"), alt: "The sundeck of the 48 ft yacht off Dubai Marina" },
};

export const toursIntro = {
  title: "Dubai, seen from the water",
  body: "Explore the stunning coastline and iconic landmarks in style. Create lasting memories with us.",
};

// From day to night. `focus`: the point kept in view where a narrow screen crops the picture
export const tours = [
  { name: "Burj Al Arab", src: photo("tour-burj"), focus: "72% 60%" },
  { name: "Atlantis", src: photo("tour-atlantis"), focus: "44% 75%" },
  { name: "Lagoon", src: photo("tour-lagoon"), focus: "45% 45%" },
  { name: "Skyline", src: photo("tour-skyline"), focus: "54% 55%" },
  { name: "Harbour", src: photo("tour-harbour"), focus: "72% 50%" },
  { name: "Ain Wheel", src: photo("tour-ain"), focus: "56% 35%" },
];

export const yachtsIntro = {
  title: ["Discover the perfect yacht,", "tailored to your unforgettable journey."],
  body: "Tailor your Dubai yacht adventure with personalized luxury. Our yachts, your dreams, creating memories that last a lifetime.",
};

export const yachts = [
  {
    kicker: "Sea Ray (USA made) — Yacht charter in Dubai",
    title: "48 ft Yacht Sea Seakers 3",
    body: [
      "Powered by two 580 HP engines, equipped. The boat can host up to 11 guests with two crew members and one captain. Discover the ultimate blend of luxury and excitement aboard Outlaw, a premium yacht available for rental.",
      "This well-appointed yacht boasts two ample cabins, providing comfortable accommodation for up to four guests.",
    ],
    specs: [
      ["Build", "SEA RAY (USA-MADE)"],
      ["Length", "14.6304m (48 ft)"],
      ["Capacity", "18"],
      ["Overnight guests", "4"],
    ],
    daily: "5500 AED",
    hourly: "550 AED/Hr",
    features: [
      "Private, fully equipped boat", "Maximum 11 guests per trip", "Experienced captain & crew", "Two cabins & bath",
      "Sundeck & salon", "Food not included", "Necessary safety equipment", "Boats are commercial, legal & insured",
      "Music speakers", "Water, soft drinks, icebox", "Towels", "Fuel",
    ],
    addons: ["Professional photographer", "Meal", "Pre-wedding shoot", "Party / celebration", "Rooms", "Honeymoon", "Jet ski"],
    src: photo("y48-main"),
    gallery: [photo("y48-1"), photo("y48-3"), photo("y48-4"), photo("y48-5")],
  },
  {
    kicker: "Boat rental in Dubai",
    title: "31 ft Yacht Sea Seakers 1",
    body: [
      "Powered by two 200 HP engines, equipped with all fishing and safety equipment. The boat can host up to 10 guests with two crew members.",
    ],
    specs: [
      ["Build", "Fishing Charter"],
      ["Length", "9.4488m (31 ft)"],
      ["Capacity", "10"],
      ["Overnight guests", "2"],
    ],
    daily: "3500 AED",
    hourly: "350 AED/Hour",
    features: [
      "Private, fully equipped boat", "Maximum 10 guests per trip", "Experienced captain & crew", "One cabin", "Salon",
      "Air conditioning & music speakers", "All necessary fishing equipment", "Water, soft drinks, icebox", "Towels", "Fuel",
      "Food not included", "Necessary safety equipment", "Boats are commercial, legal & insured",
    ],
    addons: ["Professional photographer", "Meal", "Pre-wedding shoot", "Rooms", "Honeymoon"],
    src: photo("y31-main"),
    gallery: [photo("y31-1"), photo("y31-2"), photo("y31-3"), photo("y31-4")],
  },
];

export const bow = {
  src: photo("cta-yacht"),
  alt: "A luxury yacht cruising offshore",
  lines: ["Discover the", "ultimate yachting", "experience today!"],
  body: "Set sail into luxury with us and experience Dubai like never before. Unforgettable yacht journeys await. Book now to discover the ultimate yachting experience.",
  cta: "Contact us now!",
};

export const why = {
  title: ["Experience yachting excellence,", "choose us for unforgettable adventures."],
  body: "Indulge in elegance with Sea Seakers, where luxury meets affordability on Dubai's waters. Create lasting memories against the backdrop of stunning views. Your extraordinary yachting journey begins now.",
};

export const onBoardPhotos = [
  { src: photo("about-5"), alt: "The salon, with its long leather sofa" },
  { src: photo("about-2"), alt: "A cabin with a made-up double bed" },
];

export const comforts = [
  { label: "Luxury bathroom", body: "Enjoy lavish sea-view bathrooms.", icon: photo("icon-bath") },
  { label: "Luxury bed", body: "Plush beds ensure restful nights at sea.", icon: photo("icon-bed") },
  { label: "Speaker", body: "Entertainment at its finest onboard.", icon: photo("icon-speaker") },
  { label: "Air conditioner", body: "Stay cool throughout your journey.", icon: photo("icon-ac") },
  { label: "Microwave", body: "Delight in three daily gourmet meals.", icon: photo("icon-microwave") },
  { label: "Safe storage", body: "Secure storage for peace of mind.", icon: photo("icon-safe") },
];

// Shown beside the reviews, in the same order
export const guests = [
  { src: photo("guest-1"), alt: "Guests on deck in front of the Dubai skyline" },
  { src: photo("guest-2"), alt: "A family gathered on board" },
  { src: photo("guest-3"), alt: "Guests on board with the Burj Al Arab behind them" },
  { src: photo("guest-4"), alt: "Guests at the rail of the yacht" },
];

export const reviews = [
  { who: "Jitesh Agarwal", quote: "Booked sea seekers , it was an amazing experience with a 2 hour hatch ride around marina and palm. The staff were very cooperative and provided very good customer service 👍👍" },
  { who: "Jackie Carroll", quote: "We did a sunset cruise with Captain Nobi and crew. The yacht was beautiful and the cruise was spectacular. Thank you for taking such good care of us. I would highly recommend. We will definitely do a day cruise with swimming when we are back in Dubai." },
  { who: "Amit Karmakar", quote: "It was awesome trip to yacht ride special thanks to Mr Nobi the man who gide me very well..it way a happy journey....😀" },
  { who: "Srinivasan Venkataraman", quote: "We went on a tour in Dubai Marina in your yacht. Had a wonderful experience. The tour started and ended on time, and your staff (the yacht operator) Mr.Nobi was very polite, professional, and helpful. Happy with your company's service and will definitely recommend to my friends." },
];

export const shortReviews = [
  { who: "Majo Rodríguez", date: "February 14, 2024", quote: "Very good prices and services" },
  { who: "Ankit singhal", date: "February 6, 2024", quote: "Had an amazing experience. Staff was very supportive and friendly." },
  { who: "Saish Sankhe", date: "February 21, 2024", quote: "Great experience ….. must visit" },
  { who: "Divya Patel", date: "February 14, 2024", quote: "Very nice experience, team members are so supportive they also take our good photos, will definitely recommend to my friends and family for sure.." },
  { who: "Kyungpyo k", date: "February 21, 2024", quote: "It’s a nice experience👍👍👍" },
  { who: "Yasser Salem", date: "February 28, 2024", quote: "It’s good person Nobi and we enjoy with him thanks" },
];

export const faq = {
  title: ["FAQs: Navigating your", "yacht journey with ease"],
  body: "Unlock answers to your questions and embark on a smooth sailing adventure with our comprehensive FAQ guide. Your voyage awaits!",
  items: [
    { q: "What is a yacht charter?", a: "A yacht charter is the rental of a yacht for a specific period. It allows you to enjoy the luxury and freedom of a private yacht for various activities, from leisurely cruises to special events." },
    { q: "How do I book a yacht with Sea Seakers Yachts?", a: "Booking is simple! Contact us through our website or directly, and our team will assist you in checking availability, providing pricing, and making reservations." },
    { q: "What types of yachts do you offer, and can they accommodate various group sizes?", a: "We offer a range of yachts to suit various group sizes and preferences. Our fleet includes luxury yachts suitable for intimate gatherings, as well as larger yachts for hosting events and parties. Please contact us for specific details on the available options." },
    { q: "Can I bring my own food and drinks?", a: "We offer catering services, but you're welcome to discuss bringing your own provisions with our team, considering any relevant guidelines." },
    { q: "What is included in the yacht rental packages, and are there any additional costs to consider?", a: "Our yacht rental packages typically include the yacht itself, a professional crew, fuel, and standard amenities. Additional services such as catering, water sports equipment, and customizations are available for an extra fee. Please refer to our pricing page or get in touch for a comprehensive breakdown of costs." },
    { q: "How experienced is your crew, and what safety measures are in place during the yacht excursions?", a: "Our crew members are highly experienced and trained to ensure your safety and enjoyment. We prioritize safety measures, including life jackets, first aid equipment, and adherence to maritime regulations, to make your yacht excursion secure and worry-free." },
    { q: "Can we customize our yacht trip, including routes, catering, and onboard services?", a: "Yes, we offer the flexibility to customize your yacht trip. You can choose your preferred route, catering options, and onboard services such as DJs, photographers, or water sports activities. Contact our team to discuss your specific requirements and preferences." },
    { q: "What is your cancellation and rescheduling policy in case of unforeseen changes in plans or weather conditions?", a: "Our cancellation and rescheduling policies may vary depending on the circumstances and the booking terms. We understand that plans can change due to weather or unforeseen events, and we aim to accommodate such situations as best as possible. Please review our terms and conditions or reach out to us for specific information regarding cancellations and rescheduling." },
    { q: "Are children and pets allowed on board?", a: "Children are generally welcome, but age restrictions may apply. Please check with us regarding pets, as policies can vary." },
  ],
};

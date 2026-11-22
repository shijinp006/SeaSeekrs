// All site copy and imagery in one place — swap photos or text here.
// Photos: Unsplash (free licence). Replace with your own by changing the id or the full URL.

export const img = (id: string, w = 2000) =>
  id.startsWith("/") || id.startsWith("http")
    ? id
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * Hero film: one continuous drone shot (yacht at anchor → stern → over the pool → into the salon),
 * exported from source-media/gemini_generated_video_29cd02c9.mp4 (kept out of public/ so it
 * isn't deployed) as 240 watermark-free WebP frames.
 * Re-export after replacing the video (run from the public folder, in = ../source-media/<file>.mp4):
 *   ffmpeg -i in.mp4 -an -vf "delogo=x=1128:y=568:w=64:h=64" -c:v libwebp -quality 60 hero/lg/%03d.webp
 *   ffmpeg -i in.mp4 -an -vf "delogo=x=1128:y=568:w=64:h=64,scale=854:-2" -c:v libwebp -quality 56 hero/sm/%03d.webp
 * Caption `from` / `to` are fractions of the whole scroll.
 */
export const heroFilm = {
  frames: 240,
  src: { lg: "/hero/lg", sm: "/hero/sm" },
  length: 6, // viewport heights of scroll for the film
  captions: [
    { lines: ["Every horizon,", "privately yours."], from: 0.1, to: 0.46 },
    { lines: ["A voyage", "without compromise."], from: 0.5, to: 1 },
  ] as { lines: [string, string]; from: number; to: number }[],
};

export const stats = [
  { value: 120, suffix: "", label: "Yachts in our fleet" },
  { value: 38, suffix: "", label: "Destinations charted" },
  { value: 25, suffix: "", label: "Years at sea" },
  { value: 100, suffix: "%", label: "Bespoke itineraries" },
];

export const crew = {
  src: img("1528154291023-a6525fabe5b4", 1600),
  alt: "Yacht seen from directly above on deep teal water",
  title: ["Crewed to perfection,", "tailored to you."],
  body: "Captain, chef, stewardess and deckhands — every SeaSeekers crew is hand-picked for discretion and warmth, and briefed on you before you step aboard.",
};

export const fleet = [
  { name: "Serenissima", spec: "54m · 12 guests · 6 cabins", src: img("1605281317010-fe5ffe798166", 1600) },
  { name: "Aurelia", spec: "38m sailing · 8 guests · 4 cabins", src: img("1540946485063-a40da27545f8", 1600) },
  { name: "Borealis", spec: "46m · 10 guests · 5 cabins", src: img("1534447677768-be436bb09401", 1600) },
  { name: "Lumière", spec: "62m · 12 guests · 7 cabins", src: img("1562281302-809108fd533c", 1600) },
];

export const bow = {
  src: img("1523496922380-91d5afba98a3", 2400),
  alt: "A yacht's bow from directly above, cutting through teal water",
  lines: ["The world,", "at your bow."] as [string, string],
};

export const features = [
  {
    kicker: "Cuisine",
    title: "Dine beyond expectation",
    body: "Private chefs source from the harbours you visit — a seven-course tasting at anchor, or grilled fish on the swim platform at noon.",
    src: img("1414235077428-338989a2e8c0", 1600),
    dark: false,
  },
  {
    kicker: "Staterooms",
    title: "Suites that rival the shore",
    body: "Full-beam master suites, panoramic glazing and linens turned down twice a day. Every cabin is a quiet room with a moving view.",
    src: img("1590490360182-c33d57733427", 1600),
    dark: false,
  },
  {
    kicker: "Water toys",
    title: "The whole sea to play in",
    body: "Tenders, jet skis, seabobs, paddleboards and dive kit — with a crew that knows exactly which cove is calm this afternoon.",
    src: img("1593351415075-3bac9f45c877", 1600),
    dark: true,
  },
];

export const comforts = [
  { label: "The Bridge", src: img("1600607687939-ce8a6c25118c", 1200), cls: "md:col-span-4 md:row-span-2" },
  { label: "The Salon", src: img("1600210492486-724fe5c67fb0", 1200), cls: "md:col-span-3" },
  { label: "The Spa", src: img("1584132967334-10e028bd69f7", 1200), cls: "md:col-span-5" },
  { label: "The Cabin", src: img("1611892440504-42a792e24d32", 1200), cls: "md:col-span-5" },
  { label: "The Deck", src: img("1566073771259-6a8506099945", 1200), cls: "md:col-span-3" },
  { label: "The View", src: img("1602002418082-a4443e081dd1", 1200), cls: "md:col-span-4" },
];

export const moments = [
  { src: img("1476673160081-cf065607f449", 1200), alt: "Sunrise over a quiet beach", cls: "aspect-[3/4] w-[62vw] md:w-[36vw] lg:w-[24vw]" },
  { src: img("1544551763-46a013bb70d5", 1200), alt: "Diving among a school of fish", cls: "aspect-[4/3] w-[72vw] md:w-[45vw] lg:w-[30vw] md:mt-24" },
  { src: img("1517248135467-4c7edcad34c4", 1200), alt: "Candle-lit evening dining room", cls: "aspect-[4/5] w-[60vw] md:w-[33vw] lg:w-[22vw]" },
  { src: img("1500930287596-c1ecaa373bb2", 1200), alt: "Pink sunset over water villas", cls: "aspect-[16/11] w-[74vw] md:w-[48vw] lg:w-[32vw] md:mt-16" },
  { src: img("1530053969600-caed2596d242", 1200), alt: "Light falling through clear blue water", cls: "aspect-[3/4] w-[60vw] md:w-[33vw] lg:w-[22vw]" },
];

export const steps = [
  { n: "01", title: "Tell us your vision", body: "Dates, guests, the feeling you are after. A short call is all we need to begin." },
  { n: "02", title: "We curate the match", body: "A shortlist of yachts, crews and routes — each chosen for you, never off a list." },
  { n: "03", title: "Step aboard", body: "Contracts, provisioning and berths handled. You simply arrive and cast off." },
];

export const testimonial = {
  quote: "SeaSeekers didn't charter us a yacht. They composed a week we still talk about years later.",
  who: "The Laurent family · Côte d'Azur, 2025",
};

// What can be edited in the SEO studio. The forms and the server-side validation are both built from this list.

export type Field = {
  key: string;
  label: string;
  type: "text" | "area" | "url" | "image" | "strings" | "images" | "list" | "select" | "check";
  hint?: string;
  optional?: boolean;
  /** characters, for text and for each line of `strings` */
  max?: number;
  /** items, for strings / images / list */
  minItems?: number;
  maxItems?: number;
  /** what one item of a list is called */
  item?: string;
  of?: Field[];
  /** for a select: [stored value, what it is called] */
  options?: [string, string][];
};

/** `anchor`: the id of the section on the page, for the preview */
export type Section = { key: string; label: string; fields: Field[]; seo?: boolean; anchor?: string };
export type Page = {
  id: string;
  label: string;
  path: string;
  sections: Section[];
};

const text = (key: string, label: string, more: Partial<Field> = {}): Field => ({ key, label, type: "text", max: 160, ...more });
const area = (key: string, label: string, more: Partial<Field> = {}): Field => ({ key, label, type: "area", max: 1200, ...more });
const url = (key: string, label: string, more: Partial<Field> = {}): Field => ({ key, label, type: "url", max: 400, ...more });
const image = (key: string, label: string, more: Partial<Field> = {}): Field => ({ key, label, type: "image", ...more });
const list = (key: string, label: string, item: string, of: Field[], more: Partial<Field> = {}): Field => ({
  key,
  label,
  type: "list",
  item,
  of,
  minItems: 1,
  maxItems: 30,
  ...more,
});

const options = (key: string, label: string, choices: [string, string][], hint: string): Field => ({ key, label, type: "select", options: choices, hint });

/** Every tag a text may have */
const TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div"].map((t): [string, string] => [t, t === "p" ? "P (paragraph)" : t === "div" ? "Div (no meaning)" : t.toUpperCase()]);
const tags = (key: string, label: string, original: string, hint = "Read by Google. Does not change how it looks.") =>
  options(key, label, [["", `Original (${original})`], ...TAGS], hint);
const bodyTag = () => tags("bodyTag", "Text tag", "P");
const itemTag = (label: string, original = "H3") => tags("itemTag", label, original);

/** The tag Google reads and the size of a heading. Empty: as it was designed. */
const headingLook = (original: "H1" | "H2"): Field[] => [
  tags("tag", "Heading tag", original, "Read by Google. Use one H1 on a page."),
  options(
    "size",
    "Font size",
    [
      ["", "Original size"],
      ["xs", "Smallest (70%)"],
      ["sm", "Smaller (85%)"],
      ["lg", "Larger (115%)"],
      ["xl", "Largest (130%)"],
    ],
    "Seen by visitors.",
  ),
];
const heading = (original: "H1" | "H2" = "H2"): Field[] => [
  area("title", "Heading", { max: 160, hint: "Press Enter for a new line." }),
  text("highlight", "Highlighted words", { max: 80, optional: true, hint: "Shown in italic and colour after the heading." }),
  ...headingLook(original),
];

const seoFields: Field[] = [
  text("title", "Page title", { max: 120, hint: "The blue link on Google and the browser tab." }),
  area("description", "Meta description", { max: 320, hint: "The grey text under the link on Google." }),
  image("image", "Share image", { hint: "Shown on WhatsApp, Facebook and X. Best size 1200 × 630." }),
  { key: "noindex", label: "Hide this page from Google", type: "check", hint: "Removes it from search results and the sitemap." },
];

const links = (key: string, label: string, more: Partial<Field> = {}) =>
  list(
    key,
    label,
    "Link",
    [text("label", "Text", { max: 60 }), url("href", "Goes to", { hint: "#about, /blog or https://…" })],
    more,
  );

export const pages: Page[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    sections: [
      { key: "home.seo", label: "Google & sharing", seo: true, fields: seoFields },
      {
        key: "home.hero", label: "Hero (film)", anchor: "top",
        fields: [
          text("line1", "Heading", { max: 24 }),
          text("line2", "Highlighted words", { max: 24, hint: "Shown in italic under the heading." }),
          ...headingLook("H1"),
          area("body", "Text", { max: 300 }),
          bodyTag(),
          text("hint", "Scroll hint", { max: 40 }),
          list(
            "captions",
            "Words over the film",
            "Caption",
            [text("line1", "First line", { max: 40 }), text("line2", "Second line", { max: 40 })],
            { minItems: 2, maxItems: 2, hint: "The film has room for exactly two." },
          ),
        ],
      },
      {
        key: "home.welcome", label: "Welcome", anchor: "welcome",
        fields: [
          text("line1", "Heading, first line"),
          text("line2", "Heading, second line"),
          ...headingLook("H2"),
          area("body", "Text"),
          bodyTag(),
          image("image", "Picture"),
          text("cta", "Button", { max: 40 }),
          text("ask", "WhatsApp link", { max: 40 }),
          list("included", "Facts", "Fact", [text("label", "Label", { max: 40 }), text("value", "Text", { max: 100 })], { maxItems: 3 }),
        ],
      },
      {
        key: "home.about", label: "About", anchor: "about", fields: [ ...heading(),
          { key: "body", label: "Paragraphs", type: "strings", max: 1200, minItems: 1, maxItems: 5, hint: "The first one is larger." },
          bodyTag(),
          image("portrait", "Large picture"),
          image("inset", "Small picture"),
        ],
      },
      {
        key: "home.services", label: "Services", anchor: "services", fields: [ ...heading(),
          itemTag("Tag of the names"),
          list("items", "Services", "Service", [text("title", "Name", { max: 60 }), area("body", "Text", { max: 400 }), image("image", "Picture")]),
        ],
      },
      {
        key: "home.tours", label: "Tours", anchor: "tours", fields: [ ...heading(), area("body", "Text", { max: 400 }),
          bodyTag(),
          itemTag("Tag of the names"),
          list(
            "items",
            "Tours",
            "Tour",
            [
              text("name", "Name", { max: 60 }),
              image("image", "Picture"),
              text("focus", "Picture focus", { max: 20, optional: true, hint: "Point kept in view, like 54% 55%" }),
            ],
            { hint: "The first tour fills the screen; the others hang below it.", maxItems: 16 },
          ),
        ],
      },
      {
        key: "home.yachts", label: "Yachts", anchor: "yachts", fields: [ ...heading(), area("body", "Text", { max: 400 }),
          bodyTag(),
          itemTag("Tag of the names"),
          list("items", "Yachts", "Yacht", [
            text("title", "Name"),
            text("kicker", "Line under the name"),
            { key: "body", label: "Paragraphs", type: "strings", max: 1000, minItems: 1, maxItems: 5 },
            list("specs", "Specifications", "Specification", [text("label", "Label", { max: 40 }), text("value", "Value", { max: 60 })], { maxItems: 12 }),
            text("daily", "Price for a day", { max: 40 }),
            text("hourly", "Price for an hour", { max: 40 }),
            { key: "features", label: "Features", type: "strings", max: 80, minItems: 1, maxItems: 30 },
            { key: "addons", label: "Addons", type: "strings", max: 60, minItems: 0, maxItems: 20 },
            { key: "photos", label: "Photos", type: "images", minItems: 1, maxItems: 5 },
          ]),
        ],
      },
      {
        key: "home.onboard", label: "On board", anchor: "on-board", fields: [ ...heading(),
          area("body", "Text", { max: 600 }),
          bodyTag(),
          itemTag("Tag of the names"),
          image("salon", "Wide picture"),
          image("cabin", "Tall picture"),
          list("items", "Comforts", "Comfort", [text("label", "Name", { max: 60 }), area("body", "Text", { max: 200 }), image("icon", "Icon")], {
            maxItems: 12,
          }),
        ],
      },
      {
        key: "home.reviews", label: "Reviews", anchor: "reviews", fields: [ ...heading(),
          list("items", "Reviews with a photo", "Review", [text("who", "Guest", { max: 80 }), area("quote", "Review"), image("image", "Photo")]),
          list(
            "short",
            "Short reviews",
            "Review",
            [text("who", "Guest", { max: 80 }), text("date", "Date", { max: 40 }), area("quote", "Review", { max: 500 })],
            { minItems: 0 },
          ),
        ],
      },
      {
        key: "home.faq", label: "FAQ", anchor: "faq", fields: [ ...heading(), area("body", "Text", { max: 400 }),
          bodyTag(),
          itemTag("Tag of the questions", "Div"),
          list("items", "Questions", "Question", [text("q", "Question", { max: 240 }), area("a", "Answer")]),
        ],
      },
      {
        key: "home.bow", label: "Closing banner", anchor: "closing", fields: [...heading(), area("body", "Text", { max: 400 }), bodyTag(), text("cta", "Button", { max: 40 }), image("image", "Picture")],
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    path: "/services",
    sections: [
      { key: "services.seo", label: "Google & sharing", seo: true, fields: seoFields },
      { key: "services.intro", label: "Page heading", anchor: "top", fields: [...heading("H1"), area("body", "Text", { max: 400 }), bodyTag(), image("image", "Picture")] },
      {
        key: "services.items", label: "Services", anchor: "list", fields: [ itemTag("Tag of the names", "H2"),
          list(
            "items",
            "Services",
            "Service",
            [
              text("title", "Name", { max: 60 }),
              text("slug", "Address", { max: 80, hint: "The last part of /services/…: small letters, numbers and dashes. Changing it breaks old links." }),
              area("summary", "Summary", { max: 300, hint: "On the card, and under the heading of its page." }),
              { key: "body", label: "Paragraphs", type: "strings", max: 1000, minItems: 1, maxItems: 8 },
              { key: "points", label: "Points", type: "strings", max: 100, minItems: 0, maxItems: 12 },
              { key: "photos", label: "Photos", type: "images", minItems: 1, maxItems: 5, hint: "The first one is on the card." },
              text("yacht", "Yacht", { max: 60, optional: true, hint: "Part of a yacht's name, like 48 ft. Empty: every yacht." }),
              text("seoTitle", "Page title", { max: 120, optional: true, hint: "For Google. Empty: made from the name." }),
              area("seoDescription", "Meta description", { max: 320, optional: true, hint: "For Google. Empty: made from the summary." }),
            ],
            { maxItems: 40 },
          ),
        ],
      },
    ],
  },
  {
    id: "blog",
    label: "Blog page",
    path: "/blog",
    sections: [
      { key: "blog.seo", label: "Google & sharing", seo: true, fields: seoFields },
      { key: "blog.intro", label: "Page heading", anchor: "top", fields: [...heading("H1"), area("body", "Text", { max: 400 }), bodyTag()] },
    ],
  },
  {
    id: "layout",
    label: "Header & Footer",
    path: "/",
    sections: [
      {
        key: "layout.header", label: "Header", anchor: "top",
        fields: [links("links", "Links", { maxItems: 8 }), text("cta", "Button in the phone menu", { max: 30 })],
      },
      {
        key: "layout.footer", label: "Footer", anchor: "contact",
        fields: [
          area("body", "Text", { max: 500 }),
          links("explore", "Explore links", { maxItems: 10 }),
          links("legal", "Legal links", { maxItems: 8, minItems: 0 }),
        ],
      },
    ],
  },
];

export const businessSection: Section = {
  key: "business",
  label: "Business Info",
  fields: [
    text("name", "Name", { max: 80 }),
    text("legal", "Registered name"),
    area("address", "Address", { max: 300 }),
    text("email", "Email", { max: 120 }),
    text("mobile", "Mobile", { max: 30, hint: "As shown, with the country code" }),
    text("phone", "Phone", { max: 30 }),
    text("whatsapp", "WhatsApp number", { max: 20, hint: "Digits only, with the country code" }),
    url("instagram", "Instagram"),
    url("youtube", "YouTube"),
    url("trustpilot", "Trustpilot"),
    url("google", "Google review link"),
    text("priceRange", "Price range for Google", { max: 60, optional: true, hint: "Like 350 AED an hour" }),
    text("openingHours", "Opening hours for Google", { max: 80, optional: true, hint: "Like Mo-Su 08:00-22:00" }),
  ],
};

export const allSections: Section[] = [...pages.flatMap((p) => p.sections), businessSection];
export const sectionByKey = (key: string) => allSections.find((s) => s.key === key);
export const pageOfSection = (key: string) => pages.find((p) => p.sections.some((s) => s.key === key));

/** home.faq → /studio/pages/home#home.faq */
export const sectionHref = (key: string) => (key === "business" ? "/studio/business" : `/studio/pages/${key.split(".")[0]}#${key}`);

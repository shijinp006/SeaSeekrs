import { route } from "@/lib/server/api";
import { getSections } from "@/lib/server/studio";

// The admin's list of services, searched and cut into pages on the server.
// GET /api/studio/services?q=yacht&page=2 → { rows: [{ index, item }], total, all, page, pages, perPage }
// `index` is the place of the service in the whole list, which the admin's edits are saved against.

const PER_PAGE = 6;
const FIELDS = ["title", "slug", "summary", "yacht"] as const;

/** Lower case, without accents: "Café" finds "cafe" */
const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

export const GET = route(
  async (request) => {
    const params = new URL(request.url).searchParams;
    const q = plain((params.get("q") ?? "").trim().slice(0, 80));
    const asked = Number(params.get("page"));
    // every word has to be found, in any of the fields
    const words = q.split(/\s+/).filter(Boolean);

    const items = (await getSections())["services.items"].value.items;
    const found = items
      .map((item, index) => ({ index, item }))
      .filter(({ item }) => {
        const text = plain(FIELDS.map((k) => String(item[k] ?? "")).join(" "));
        return words.every((w) => text.includes(w));
      });

    const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
    const page = Math.min(pages, Number.isInteger(asked) && asked > 0 ? asked : 1);
    return {
      rows: found.slice((page - 1) * PER_PAGE, page * PER_PAGE),
      total: found.length,
      all: items.length,
      page,
      pages,
      perPage: PER_PAGE,
    };
  },
  { role: "ADMIN", changes: false },
);

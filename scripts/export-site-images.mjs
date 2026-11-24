// Optimises the photos in source-media/seaseakersyachts/ into public/site/: node scripts/export-site-images.mjs
import { mkdirSync, readdirSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";

const SRC = "source-media/seaseakersyachts";
const OUT = "public/site";
const USED =
  /^(cta-yacht|about-(aerial|[125])|why|tour-.+|y48-(main|1|3|4|5|11|12)|y31-(main|1|2|3|4)|guest-.+|icon-(?!why).+)$/;

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const file of readdirSync(SRC)) {
  const { name } = parse(file);
  if (!USED.test(name)) continue;
  const icon = name.startsWith("icon-");
  const { size } = await sharp(join(SRC, file))
    .rotate()
    .resize({ width: icon ? 160 : name === "cta-yacht" ? 2400 : 1800, withoutEnlargement: true })
    .webp({ quality: icon ? 90 : 80, effort: 6 })
    .toFile(join(OUT, `${name}.webp`));
  total += size;
}
// the open water in the corner of the aerial shot, for the Diving service
await sharp(join(OUT, "about-aerial.webp"))
  .extract({ left: 0, top: 500, width: 525, height: 700 })
  .resize(900, 1200)
  .webp({ quality: 80 })
  .toFile(join(OUT, "service-diving.webp"));
console.log(`${(total / 1e6).toFixed(1)} MB written to ${OUT}`);

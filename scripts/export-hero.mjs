// Exports the hero film frames: node scripts/export-hero.mjs source-media/<file>.mp4 [lg|sm]
// Needs ffmpeg on PATH; sharp comes with Next. Takes a while: every frame, at full resolution.
// Still frames for browsers without WebCodecs: AVIF, and WebP for those without AVIF. Run export-hero-film.mjs after it
// (this one replaces the folders), which makes the film nearly every visitor gets.
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { CRISP, PORTRAIT } from "./hero-look.mjs";
import sharp from "sharp";
import { heroFrames } from "./hero-frames.mjs";

const input = process.argv[2];
if (!input) throw new Error("usage: node scripts/export-hero.mjs <video>");

const SETS = process.argv[3] ? [process.argv[3]] : ["lg", "sm"];
// Every STEP-th frame: these browsers have to fetch each picture on its own. Same as STILLS in ScrollFilm.tsx.
const STEP = 2;
const QUALITY = { lg: { avif: 80, webp: 88 }, sm: { avif: 74, webp: 84 } };

const out = mkdtempSync("public/hero-"); // swapped in at the end, so the site never shows half a film
try {
  const { files } = await heroFrames(input);
  const frames = files.map((file, i) => ({ file, i })).filter(({ i }) => i % STEP === 0 || i === files.length - 1);
  for (const dir of SETS) mkdirSync(join(out, dir));

  const exportFrame = async ({ file, i }) => {
    const name = String(i + 1).padStart(3, "0");
    for (const dir of SETS) {
      const image = sharp(file).removeAlpha();
      if (dir === "sm") image.resize({ ...PORTRAIT, fit: "cover" });
      image.sharpen(CRISP);
      const q = QUALITY[dir];
      await image.clone().avif({ quality: q.avif, effort: 4, chromaSubsampling: "4:2:0" }).toFile(join(out, dir, `${name}.avif`));
      await image.clone().webp({ quality: q.webp, effort: 5 }).toFile(join(out, dir, `${name}.webp`));
    }
  };
  let next = 0, done = 0;
  const worker = async () => {
    while (next < frames.length) {
      await exportFrame(frames[next++]);
      if (++done % 20 === 0) console.log(`${done} / ${frames.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, availableParallelism() >> 1) }, worker));

  for (const dir of SETS) {
    const live = `public/hero/${dir}`;
    if (existsSync(live)) rmSync(live, { recursive: true });
    renameSync(join(out, dir), live);
  }
  console.log(`${frames.length} frames exported`);
} finally {
  rmSync(out, { recursive: true, force: true });
}

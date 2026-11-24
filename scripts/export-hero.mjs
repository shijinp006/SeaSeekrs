// Exports the hero film frames: node scripts/export-hero.mjs source-media/<file>.mp4 [lg|sm]
// Needs ffmpeg on PATH; sharp comes with Next. Takes a while: every frame, at full resolution.
// Still frames for browsers without WebCodecs: AVIF, and WebP for those without AVIF. Run export-hero-film.mjs after it
// (this one replaces the folders), which makes the film nearly every visitor gets.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { CRISP, PORTRAIT } from "./hero-look.mjs";
import { withoutMark } from "./hero-mark.mjs";

const input = process.argv[2];
if (!input) throw new Error("usage: node scripts/export-hero.mjs <video>");

const SETS = process.argv[3] ? [process.argv[3]] : ["lg", "sm"];
// Every frame of the video (10 s at 24 fps → 240): dropping some makes an even camera move judder.
// Keep heroFilm.frames in sync.
const QUALITY = { lg: { avif: 80, webp: 88 }, sm: { avif: 74, webp: 84 } };

const tmp = mkdtempSync(join(tmpdir(), "hero-"));
const out = mkdtempSync("public/hero-"); // swapped in at the end, so the site never shows half a film
try {
  execFileSync("ffmpeg", ["-v", "error", "-i", input, "-an", "-sws_flags", "lanczos+accurate_rnd+full_chroma_int", "-fps_mode", "passthrough", join(tmp, "%03d.png")], {
    stdio: "inherit",
  });
  const frames = readdirSync(tmp).sort();
  for (const dir of SETS) mkdirSync(join(out, dir));

  const exportFrame = async (file) => {
    const name = file.replace(".png", "");
    for (const dir of SETS) {
      const image = await withoutMark(join(tmp, file));
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
  rmSync(tmp, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
}

// Exports the hero film for the browser's hardware video decoder: node scripts/export-hero-film.mjs source-media/<file>.mp4
// Needs ffmpeg on PATH. Writes public/hero/{lg,sm}/film.bin + film.json (what nearly every visitor gets) and the
// poster 001.avif / 001.webp, and src/lib/hero-film.json. export-hero.mjs makes the still frames for browsers without WebCodecs.
//
// film.bin is H.264, cut into groups of GOP frames that start on a key frame, so any spot is a few frames' work away in
// either direction. The pieces are stored coarse to fine: key frames spread over the film come first.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CRISP, PORTRAIT } from "./hero-look.mjs";
import sharp from "sharp";
import { heroFrames } from "./hero-frames.mjs";

const input = process.argv[2];
if (!input) throw new Error("usage: node scripts/export-hero-film.mjs <video>");
const GOP = 4;
const CRF = { lg: 17, sm: 19 };

/** Annex B stream → one Buffer per frame, each with the parameter sets in front of it */
function accessUnits(stream) {
  const starts = [];
  for (let i = 0; i + 3 < stream.length; i++) {
    if (stream[i] === 0 && stream[i + 1] === 0 && stream[i + 2] === 1) {
      starts.push(i > 0 && stream[i - 1] === 0 ? i - 1 : i);
      i += 2;
    }
  }
  const units = [];
  let from = starts[0];
  starts.forEach((at, n) => {
    const type = stream[stream.indexOf(1, at) + 1] & 31;
    if (type === 1 || type === 5) {
      const end = starts[n + 1] ?? stream.length;
      units.push(stream.subarray(from, end));
      from = end;
    }
  });
  return units;
}

const tmp = mkdtempSync(join(tmpdir(), "hero-film-"));
try {
  const { files: frames, pace } = await heroFrames(input);
  // the page's own copy: how many frames there are, and how they are spread over the scroll
  writeFileSync("src/lib/hero-film.json", JSON.stringify({ frames: frames.length, pace }));

  for (const dir of ["lg", "sm"]) {
    const { width, height } = dir === "sm" ? PORTRAIT : { width: 1920, height: 1080 };
    const raw = join(tmp, `${dir}.h264`);
    const ff = spawn(
      "ffmpeg",
      [
        "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${width}x${height}`, "-r", "24", "-i", "-",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
        "-c:v", "libx264", "-preset", "slower", "-profile:v", "high", "-level", "4.1", "-crf", String(CRF[dir]),
        "-g", String(GOP), "-keyint_min", String(GOP), "-sc_threshold", "0", "-bf", "0", "-refs", "1",
        "-x264-params", "repeat-headers=1:aud=0:slices=1:sliced-threads=0:ipratio=1.1:open-gop=0",
        "-f", "h264", raw,
      ],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    const closed = once(ff, "close");
    for (const [n, file] of frames.entries()) {
      const image = sharp(file).removeAlpha();
      if (dir === "sm") image.resize({ ...PORTRAIT, fit: "cover" });
      image.sharpen(CRISP);
      if (n === 0) {
        await image.clone().avif({ quality: 80, effort: 4, chromaSubsampling: "4:2:0" }).toFile(join(tmp, `${dir}.avif`));
        await image.clone().webp({ quality: 88, effort: 5 }).toFile(join(tmp, `${dir}.webp`));
      }
      if (!ff.stdin.write(await image.raw().toBuffer())) await once(ff.stdin, "drain");
      if ((n + 1) % 60 === 0) console.log(dir, n + 1, "/", frames.length);
    }
    ff.stdin.end();
    if ((await closed)[0]) throw new Error("ffmpeg failed");

    const units = accessUnits(readFileSync(raw));
    if (units.length !== frames.length) throw new Error(`${units.length} units for ${frames.length} frames`);
    const order = [];
    const add = (i) => i < units.length && !order.includes(i) && order.push(i);
    for (const step of [32, 16, 8, GOP]) for (let i = 0; i < units.length; i += step) add(i);
    for (let i = 0; i < units.length; i++) add(i);

    const out = `public/hero/${dir}`;
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "film.bin"), Buffer.concat(order.map((i) => units[i])));
    const index = { codec: "avc1.640029", width, height, gop: GOP, order, sizes: order.map((i) => units[i].length) };
    writeFileSync(join(out, "film.json"), JSON.stringify(index));
    for (const ext of ["avif", "webp"]) writeFileSync(join(out, `001.${ext}`), readFileSync(join(tmp, `${dir}.${ext}`)));
    console.log(dir, (units.reduce((s, u) => s + u.length, 0) / 1e6).toFixed(1), "MB");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

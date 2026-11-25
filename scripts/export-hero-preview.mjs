// Makes the light version of the hero film: node scripts/export-hero-preview.mjs  (after export-hero-film.mjs, from its
// film.bin). Needs ffmpeg on PATH. Writes public/hero/{lg,sm}/preview.bin + preview.json, built like film.bin.
// It is there after a moment, so the hero scrolls smoothly from the start; the full one takes its place once loaded.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { accessUnits, coarseToFine } from "./hero-units.mjs";

const GOP = 8;
const SIZE = { lg: { width: 1280, height: 720, crf: 25 }, sm: { width: 540, height: 720, crf: 25 } };

const tmp = mkdtempSync(join(tmpdir(), "hero-preview-"));
try {
  for (const dir of ["lg", "sm"]) {
    const out = `public/hero/${dir}`;
    const film = JSON.parse(readFileSync(join(out, "film.json"), "utf8"));
    const bin = readFileSync(join(out, "film.bin"));
    const full = [];
    let at = 0;
    film.order.forEach((i, k) => {
      full[i] = bin.subarray(at, at + film.sizes[k]);
      at += film.sizes[k];
    });
    writeFileSync(join(tmp, "full.h264"), Buffer.concat(full));
    const { width, height, crf } = SIZE[dir];
    execFileSync(
      "ffmpeg",
      [
        "-y", "-v", "error", "-r", "24", "-i", join(tmp, "full.h264"), "-fps_mode", "passthrough",
        "-vf", `scale=${width}:${height}:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p`,
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
        "-c:v", "libx264", "-preset", "slower", "-profile:v", "high", "-level", "4.0", "-crf", String(crf),
        "-g", String(GOP), "-keyint_min", String(GOP), "-sc_threshold", "0", "-bf", "0", "-refs", "1",
        "-x264-params", "repeat-headers=1:aud=0:slices=1:sliced-threads=0:open-gop=0",
        "-f", "h264", join(tmp, "preview.h264"),
      ],
      { stdio: "inherit" },
    );
    const units = accessUnits(readFileSync(join(tmp, "preview.h264")));
    if (units.length !== full.length) throw new Error(`${units.length} units for ${full.length} frames`);
    const order = coarseToFine(units.length, GOP);
    writeFileSync(join(out, "preview.bin"), Buffer.concat(order.map((i) => units[i])));
    const index = { codec: "avc1.640028", width, height, gop: GOP, order, sizes: order.map((i) => units[i].length) };
    writeFileSync(join(out, "preview.json"), JSON.stringify(index));
    console.log(dir, (units.reduce((s, u) => s + u.length, 0) / 1e6).toFixed(1), "MB");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

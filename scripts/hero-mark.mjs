// Takes the star in the corner of the source video off a frame. It is a fixed, see-through overlay
// (frame = (1 - ALPHA) × picture + ALPHA × WHITE), so the picture under it can be worked out again;
// only a thin band along its outline is filled in from both sides.
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BOX = { left: 1680, top: 840, width: 120, height: 120 }; // for a 1920×1080 source
const N = BOX.width;
const ALPHA = 0.29, WHITE = 255; // ALPHA differs a little from frame to frame: see strength()

const shape = await sharp(fileURLToPath(new URL("./hero-mark.png", import.meta.url)))
  .extractChannel(0)
  .raw()
  .toBuffer();
const marked = shape.map((v) => (v > 30 ? 1 : 0));
const outline = [];
for (let y = 4; y < N - 4; y++) {
  for (let x = 4; x < N - 4; x++) {
    let on = false, off = false;
    for (let v = -3; v <= 3; v++) {
      for (let u = -3; u <= 3; u++) {
        if (Math.abs(u) + Math.abs(v) > 3) continue;
        if (marked[(y + v) * N + x + u]) on = true;
        else off = true;
      }
    }
    if (on && off) outline.push(y * N + x);
  }
}

// thin bands just inside and just outside the star
const isOn = (x, y) => x >= 0 && y >= 0 && x < N && y < N && marked[y * N + x] === 1;
const near = (x, y, r, on) => {
  for (let v = -r; v <= r; v++) for (let u = -r; u <= r; u++) if (u * u + v * v <= r * r && isOn(x + u, y + v) === on) return true;
  return false;
};
const inner = [], outer = [];
for (let y = 8; y < N - 8; y++) {
  for (let x = 8; x < N - 8; x++) {
    const on = isOn(x, y);
    if (near(x, y, 7, !on) && !near(x, y, 3, !on)) (on ? inner : outer).push(y * N + x);
  }
}
/** How strong the star is in this frame: what makes the picture inside it match the picture around it */
const strength = (patch) => {
  let top = ALPHA * 12000, bottom = 12000; // leans to the usual strength where the picture is too bright to tell
  for (let c = 0; c < 3; c++) {
    const mean = (list) => list.reduce((sum, i) => sum + patch[i * 3 + c], 0) / list.length;
    const i = mean(inner), o = mean(outer);
    top += (i - o) * (WHITE - o);
    bottom += (WHITE - o) ** 2;
  }
  return Math.min(0.34, Math.max(0.2, top / bottom));
};

/** Path of a frame → sharp image of it without the mark */
export async function withoutMark(file) {
  const patch = await sharp(file).extract(BOX).removeAlpha().raw().toBuffer();
  const p = Float64Array.from(patch);
  const alpha = strength(patch);
  for (let i = 0; i < N * N; i++) {
    if (marked[i]) for (let c = 0; c < 3; c++) p[i * 3 + c] = (patch[i * 3 + c] - alpha * WHITE) / (1 - alpha);
  }
  for (let c = 0; c < 3; c++) {
    for (let pass = 0; pass < 120; pass++) {
      for (const i of outline) {
        const mean = (p[(i - 1) * 3 + c] + p[(i + 1) * 3 + c] + p[(i - N) * 3 + c] + p[(i + N) * 3 + c]) / 4;
        p[i * 3 + c] += 1.6 * (mean - p[i * 3 + c]);
      }
    }
  }
  const clean = Buffer.from(p.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < N; y++) {
    clean.copy(data, ((BOX.top + y) * info.width + BOX.left) * 3, y * N * 3, (y + 1) * N * 3);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } });
}

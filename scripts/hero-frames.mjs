// Gets the hero film's frames ready for the exports: takes the mark off, fills in the frames the source video leaves out
// (the camera jumps there), draws extra ones where the camera is fast, and works out how the film is spread over the
// scroll. The result is kept in source-media/.frames, so the two exports share it.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { basename, join } from "node:path";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import sharp from "sharp";
import { between } from "./hero-between.mjs";
import { withoutMark } from "./hero-mark.mjs";

const JUMP = 1.4; // this much more movement than around it: a frame is missing
const FAST = 0.015; // closer by more than this from one frame to the next: draw one in between
const EVEN = 0.45; // 0: the film runs at its own pace; 1: the camera keeps one speed through the whole scroll
const SAMPLES = 64;

if (!isMainThread) {
  parentPort.on("message", async ({ kind, a, b, out }) => {
    const image = kind === "clean" ? await withoutMark(a) : await between(a, b);
    await image.png({ compressionLevel: 2 }).toFile(out);
    parentPort.postMessage(out);
  });
}

const runAll = (jobs) =>
  new Promise((resolve, reject) => {
    let next = 0, done = 0;
    if (!jobs.length) return resolve();
    const workers = Array.from({ length: Math.min(jobs.length, Math.max(1, availableParallelism() >> 1)) }, () => {
      const w = new Worker(new URL(import.meta.url));
      const give = () => next < jobs.length && w.postMessage(jobs[next++]);
      w.on("error", reject);
      w.on("message", () => {
        if (++done === jobs.length) {
          workers.forEach((k) => k.terminate());
          resolve();
        } else give();
      });
      give();
      return w;
    });
  });

/** How the camera moved from each frame to the next: sideways, up and closer, as parts of the picture */
const movements = async (files) => {
  const W = 240, H = 135;
  const pics = [];
  for (const f of files) pics.push(await sharp(f).greyscale().resize(W, H).blur(2).toColourspace("b-w").raw().toBuffer());
  return pics.slice(1).map((b, k) => {
    const a = pics[k];
    const M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        const p = y * W + x;
        const gx = (a[p + 1] - a[p - 1] + b[p + 1] - b[p - 1]) / 4, gy = (a[p + W] - a[p - W] + b[p + W] - b[p - W]) / 4;
        const r = [gx, gy, gx * (x - W / 2) + gy * (y - H / 2)], d = a[p] - b[p];
        for (let m = 0; m < 3; m++) {
          for (let n = 0; n < 3; n++) M[m][n] += r[m] * r[n];
          M[m][3] += r[m] * d;
        }
      }
    for (let k = 0; k < 3; k++) {
      const q = M[k][k];
      for (let n = k; n < 4; n++) M[k][n] /= q;
      for (let m = 0; m < 3; m++) if (m !== k) {
        const f = M[m][k];
        for (let n = k; n < 4; n++) M[m][n] -= f * M[k][n];
      }
    }
    return { closer: M[2][3], total: Math.hypot(M[0][3] / W, M[1][3] / W, M[2][3] * 0.5) };
  });
};
const median = (list) => [...list].sort((a, b) => a - b)[list.length >> 1];

/** Video → { files, pace }: the frames in order, and the frame to show at SAMPLES + 1 even steps of the scroll */
export async function heroFrames(input) {
  const dir = join("source-media", ".frames");
  const key = `${basename(input)} ${statSync(input).size} ${JUMP} ${FAST} ${EVEN}`;
  const info = join(dir, "done.json");
  if (existsSync(info)) {
    const saved = JSON.parse(readFileSync(info, "utf8"));
    if (saved.key === key) return { files: saved.files, pace: saved.pace };
  }
  rmSync(dir, { recursive: true, force: true });
  const [raw, all] = ["raw", "all"].map((d) => join(dir, d));
  for (const d of [raw, all]) mkdirSync(d, { recursive: true });
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", input, "-an", "-sws_flags", "lanczos+accurate_rnd+full_chroma_int", "-fps_mode", "passthrough", join(raw, "%04d.png")],
    { stdio: "inherit" },
  );
  const names = readdirSync(raw).sort();
  await runAll(names.map((n) => ({ kind: "clean", a: join(raw, n), out: join(all, n) })));
  let files = names.map((n) => join(all, n));

  // ---- left-out frames
  let moves = await movements(files);
  const insert = async (where, suffix) => {
    const jobs = [], list = [];
    files.forEach((f, i) => {
      list.push(f);
      if (i < files.length - 1 && where(i)) {
        const out = f.replace(".png", `${suffix}.png`);
        jobs.push({ kind: "between", a: f, b: files[i + 1], out });
        list.push(out);
      }
    });
    await runAll(jobs);
    files = list;
    return jobs.length;
  };
  const jumps = moves.map((m, i) => {
    const near = moves.slice(Math.max(0, i - 4), i + 5).map((n) => n.total);
    return m.total > JUMP * median(near);
  });
  console.log("left out after frame", jumps.flatMap((j, i) => (j ? [i] : [])).join(", "));
  await insert((i) => jumps[i], "a");

  // ---- the fast part: from the first to the last fast frame, so it is all alike
  moves = await movements(files);
  const speed = moves.map((_, i) => median(moves.slice(Math.max(0, i - 4), i + 5).map((m) => Math.abs(m.closer))));
  const first = speed.findIndex((s) => s > FAST), last = speed.findLastIndex((s) => s > FAST);
  // ---- the pace: a frame's share of the scroll grows with how much happens in it
  const total = moves.map((m) => m.total);
  const share = total.map((_, i) => {
    let s = 0, n = 0;
    for (let k = -30; k <= 30; k++) {
      const v = total[Math.min(total.length - 1, Math.max(0, i + k))], g = Math.exp(-(k * k) / 200);
      s += g * v;
      n += g;
    }
    return (s / n) ** EVEN;
  });
  const drawn = first < 0 ? 0 : await insert((i) => i >= first && i <= last, "b");
  console.log(`${names.length} frames in, ${files.length} out; ${drawn} drawn in between ${first} and ${last + 1}`);

  // frame number in the finished film at each step of the scroll
  const at = [0]; // scroll at frame i of the film
  share.forEach((s, i) => {
    const parts = drawn && i >= first && i <= last ? 2 : 1;
    for (let k = 0; k < parts; k++) at.push(at[at.length - 1] + s / parts);
  });
  const end = at[at.length - 1];
  const pace = [];
  for (let s = 0, i = 0; s <= SAMPLES; s++) {
    const x = (s / SAMPLES) * end;
    while (i < at.length - 2 && at[i + 1] < x) i++;
    pace.push(+Math.min(files.length - 1, i + (x - at[i]) / (at[i + 1] - at[i])).toFixed(2));
  }
  rmSync(raw, { recursive: true, force: true });
  writeFileSync(info, JSON.stringify({ key, files, pace }));
  return { files, pace };
}

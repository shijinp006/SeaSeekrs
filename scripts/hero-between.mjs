// Draws the picture half-way between two neighbouring film frames. The generated source videos leave a frame out every
// now and then, which shows as a jump of the camera; hero-frames.mjs fills those in with this.
//
// For every pixel of the new picture it looks for the movement v that makes first(x - v/2) and second(x + v/2) agree:
// coarse to fine, small windows, pulled towards what the surroundings do.
import sharp from "sharp";

const box = (src, w, h, r) => {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  const at = (v, max) => (v < 0 ? 0 : v > max ? max : v);
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += src[y * w + at(k, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = s / n;
      s += src[y * w + at(x + r + 1, w - 1)] - src[y * w + at(x - r, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += tmp[at(k, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n;
      s += tmp[at(y + r + 1, h - 1) * w + x] - tmp[at(y - r, h - 1) * w + x];
    }
  }
  return out;
};

const bilinear = (src, w, h, x, y) => {
  x = x < 0 ? 0 : x > w - 1.001 ? w - 1.001 : x;
  y = y < 0 ? 0 : y > h - 1.001 ? h - 1.001 : y;
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (src[i] * (1 - fx) + src[i + 1] * fx) * (1 - fy) + (src[i + w] * (1 - fx) + src[i + w + 1] * fx) * fy;
};

const pyramid = async (file, levels, W, H) => {
  const all = [];
  for (let l = 0; l < levels; l++) {
    const w = W >> l, h = H >> l;
    const raw = await sharp(file).removeAlpha().greyscale().resize(w, h, { fit: "fill", kernel: "lanczos3" }).blur(0.8).toColourspace("b-w").raw().toBuffer();
    const f = Float32Array.from(raw);
    if (f.length !== w * h) throw new Error("expected one channel");
    const mean = box(f, w, h, Math.max(4, Math.min(w, h) >> 4)); // the light may change from one to the other
    for (let i = 0; i < f.length; i++) f[i] -= mean[i];
    all.push({ w, h, f });
  }
  return all;
};

const flow = (A, B, pull) => {
  let u, v, pw, ph;
  for (let l = A.length - 1; l >= 0; l--) {
    const { w, h, f: a } = A[l], b = B[l].f, n = w * h;
    const nu = new Float32Array(n), nv = new Float32Array(n);
    if (u)
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const px = ((x + 0.5) * pw) / w - 0.5, py = ((y + 0.5) * ph) / h - 0.5;
          nu[y * w + x] = (bilinear(u, pw, ph, px, py) * w) / pw;
          nv[y * w + x] = (bilinear(v, pw, ph, px, py) * h) / ph;
        }
    u = nu; v = nv; pw = w; ph = h;
    const r = l >= 3 ? 2 : 4;
    for (let it = 0; it < 8; it++) {
      const wa = new Float32Array(n), wb = new Float32Array(n);
      for (let y = 0, i = 0; y < h; y++)
        for (let x = 0; x < w; x++, i++) {
          wa[i] = bilinear(a, w, h, x - u[i] / 2, y - v[i] / 2);
          wb[i] = bilinear(b, w, h, x + u[i] / 2, y + v[i] / 2);
        }
      const xx = new Float32Array(n), xy = new Float32Array(n), yy = new Float32Array(n);
      const xt = new Float32Array(n), yt = new Float32Array(n);
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x, X = x - u[i] / 2, Y = y - v[i] / 2, P = x + u[i] / 2, Q = y + v[i] / 2;
          if (X < 0 || Y < 0 || P < 0 || Q < 0 || X > w - 1 || P > w - 1 || Y > h - 1 || Q > h - 1) continue; // outside
          const gx = (wa[i + 1] - wa[i - 1] + wb[i + 1] - wb[i - 1]) / 4;
          const gy = (wa[i + w] - wa[i - w] + wb[i + w] - wb[i - w]) / 4;
          const t = wb[i] - wa[i];
          const k = 1 / (1 + Math.abs(t) / 12); // things without a match count less
          xx[i] = k * gx * gx; xy[i] = k * gx * gy; yy[i] = k * gy * gy; xt[i] = k * gx * t; yt[i] = k * gy * t;
        }
      const [Sxx, Sxy, Syy, Sxt, Syt] = [xx, xy, yy, xt, yt].map((m) => box(m, w, h, r));
      const s = it < 4 ? 4 : 2;
      const mu = box(box(u, w, h, s), w, h, 2), mv = box(box(v, w, h, s), w, h, 2);
      for (let i = 0; i < n; i++) {
        const a11 = Sxx[i] + pull, a22 = Syy[i] + pull, a12 = Sxy[i];
        const b1 = -Sxt[i] + pull * (mu[i] - u[i]), b2 = -Syt[i] + pull * (mv[i] - v[i]);
        const d = a11 * a22 - a12 * a12;
        const du = (b1 * a22 - b2 * a12) / d, dv = (b2 * a11 - b1 * a12) / d;
        u[i] += du < -1.5 ? -1.5 : du > 1.5 ? 1.5 : du;
        v[i] += dv < -1.5 ? -1.5 : dv > 1.5 ? 1.5 : dv;
      }
    }
  }
  return { u, v };
};

/** The movement, without the places where it buckles (edges sliding past each other): those follow their surroundings */
const steadyFlow = (A, B) => {
  const { w, h } = A[0], n = w * h;
  const fine = flow(A, B, 20);
  const buckle = new Float32Array(n);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const steep = Math.max(...[fine.u, fine.v].map((f) => Math.max(Math.abs(f[i + 1] - f[i - 1]), Math.abs(f[i + w] - f[i - w])) / 2));
      if (steep > 0.9) buckle[i] = 1;
    }
  const spread = box(box(buckle, w, h, 14), w, h, 14);
  if (spread.every((s) => s < 0.004)) return fine;
  const calm = flow(A, B, 120);
  for (let i = 0; i < n; i++) {
    const m = Math.min(1, Math.max(0, (spread[i] - 0.004) / 0.02));
    fine.u[i] += (calm.u[i] - fine.u[i]) * m;
    fine.v[i] += (calm.v[i] - fine.v[i]) * m;
  }
  return fine;
};

// Catmull-Rom: keeps the picture as sharp as its neighbours
const cubic = (p, t) => {
  const t2 = t * t, t3 = t2 * t;
  p[0] = (-t3 + 2 * t2 - t) / 2; p[1] = (3 * t3 - 5 * t2 + 2) / 2; p[2] = (-3 * t3 + 4 * t2 + t) / 2; p[3] = (t3 - t2) / 2;
};
const kx = new Float32Array(4), ky = new Float32Array(4);
const sample = (src, w, h, x, y, out) => {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  cubic(kx, x - x0); cubic(ky, y - y0);
  out[0] = out[1] = out[2] = 0;
  for (let j = 0; j < 4; j++) {
    const row = Math.min(h - 1, Math.max(0, y0 + j - 1)) * w;
    for (let i = 0; i < 4; i++) {
      const p = (row + Math.min(w - 1, Math.max(0, x0 + i - 1))) * 3, k = kx[i] * ky[j];
      out[0] += k * src[p]; out[1] += k * src[p + 1]; out[2] += k * src[p + 2];
    }
  }
};

/** Two picture files of the same size → sharp image of the moment half-way between them */
export async function between(first, second) {
  const { width: W, height: H } = await sharp(first).metadata();
  const w = W >> 1, h = H >> 1;
  const [A, B] = await Promise.all([pyramid(first, 6, w, h), pyramid(second, 6, w, h)]);
  const { u, v } = steadyFlow(A, B);
  const [a, b] = await Promise.all([first, second].map((f) => sharp(f).removeAlpha().raw().toBuffer()));
  const out = Buffer.alloc(W * H * 3), ca = [0, 0, 0], cb = [0, 0, 0];
  const inside = (x, y) => Math.max(0, Math.min(1, Math.min(x, y, W - 1 - x, H - 1 - y) / 6 + 1)) + 1e-3;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // half the full-size movement, either way
      const fu = bilinear(u, w, h, (x + 0.5) / 2 - 0.5, (y + 0.5) / 2 - 0.5);
      const fv = bilinear(v, w, h, (x + 0.5) / 2 - 0.5, (y + 0.5) / 2 - 0.5);
      sample(a, W, H, x - fu, y - fv, ca);
      sample(b, W, H, x + fu, y + fv, cb);
      // near the edge one of the two has run out of picture
      const ia = inside(x - fu, y - fv), ib = inside(x + fu, y + fv), m = ib / (ia + ib);
      for (let c = 0, p = (y * W + x) * 3; c < 3; c++) out[p + c] = Math.max(0, Math.min(255, Math.round(ca[c] * (1 - m) + cb[c] * m)));
    }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } });
}

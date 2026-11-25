// Shared by the hero film exports: cutting an H.264 stream into frames, and the order they are stored in.

/** Annex B stream → one Buffer per frame, each with the parameter sets in front of it */
export function accessUnits(stream) {
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

/** Coarse to fine: key frames spread over the film come first */
export function coarseToFine(count, gop) {
  const order = [], seen = new Set();
  const add = (i) => {
    if (i < count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  for (const step of [32, 16, 8, gop]) for (let i = 0; i < count; i += step) add(i);
  for (let i = 0; i < count; i++) add(i);
  return order;
}

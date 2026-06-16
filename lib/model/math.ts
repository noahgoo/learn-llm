/** Pure math helpers shared by the worker, fixtures script, and tests. */

/** Numerically-stable softmax with optional temperature. */
export function softmax(
  logits: ArrayLike<number>,
  temperature = 1,
): Float32Array {
  const n = logits.length;
  const out = new Float32Array(n);
  let max = -Infinity;
  for (let i = 0; i < n; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    out[i] = Math.exp((logits[i] - max) / temperature);
    sum += out[i];
  }
  for (let i = 0; i < n; i++) out[i] /= sum;
  return out;
}

/** Indices of the k largest values, descending. */
export function topkIndices(values: ArrayLike<number>, k: number): number[] {
  const idx: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (idx.length < k) {
      idx.push(i);
      idx.sort((a, b) => values[b] - values[a]);
    } else if (values[i] > values[idx[k - 1]]) {
      idx[k - 1] = i;
      idx.sort((a, b) => values[b] - values[a]);
    }
  }
  return idx;
}

export interface RankedValue {
  index: number;
  value: number;
}

/** Top values with their scores, descending. */
export function topkValues(values: ArrayLike<number>, k: number): RankedValue[] {
  return topkIndices(values, k).map((index) => ({ index, value: values[index] }));
}

/** Smallest descending set whose cumulative probability reaches `topP`. */
export function nucleusIndices(
  probs: ArrayLike<number>,
  topP: number,
): number[] {
  const sorted = Array.from({ length: probs.length }, (_, i) => i).sort(
    (a, b) => probs[b] - probs[a],
  );
  const out: number[] = [];
  let cumulative = 0;
  const threshold = Math.min(1, Math.max(0, topP));
  for (const index of sorted) {
    out.push(index);
    cumulative += probs[index];
    if (cumulative >= threshold) break;
  }
  return out;
}

export function vectorNorm(values: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i] * values[i];
  return Math.sqrt(sum);
}

/** Average absolute activation per bucket, useful for compact visual summaries. */
export function summarizeAbsBuckets(
  values: ArrayLike<number>,
  buckets: number,
): Float32Array {
  const n = Math.max(1, buckets);
  const out = new Float32Array(n);
  const counts = new Uint16Array(n);
  for (let i = 0; i < values.length; i++) {
    const b = Math.min(n - 1, Math.floor((i / values.length) * n));
    out[b] += Math.abs(values[i]);
    counts[b] += 1;
  }
  for (let i = 0; i < n; i++) out[i] = counts[i] ? out[i] / counts[i] : 0;
  return out;
}

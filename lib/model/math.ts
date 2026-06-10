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

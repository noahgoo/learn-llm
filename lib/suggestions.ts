/**
 * Suggested payloads: prompts where GPT-2 small has confident, satisfying
 * continuations. Must stay in sync with scripts/generate-fixtures.mjs —
 * enforced by tests — so each suggestion also has committed fixture data
 * for illustrative mode.
 */
export const SUGGESTIONS = [
  "The cat sat on the",
  "Once upon a time, there was a",
  "The capital of France is",
  "She opened the door and saw",
  "To be or not to be, that is the",
  "The quick brown fox jumps over the",
  "It was a dark and stormy",
] as const;

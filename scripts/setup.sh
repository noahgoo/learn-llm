#!/usr/bin/env bash
# One-time local setup: produces the files that are deliberately not in git
# (model weights, ORT wasm runtime). Run after `npm install`.
set -euo pipefail
cd "$(dirname "$0")/.."

bash "$(dirname "$0")/vendor-ort.sh"

if [ ! -f public/model/gpt2-instrumented.onnx ]; then
  echo "==> Python venv + instrumented GPT-2 export (one-time, ~5 min)"
  [ -d .venv ] || python3 -m venv .venv
  .venv/bin/pip -q install torch transformers onnx onnxruntime
  .venv/bin/python scripts/export_model.py
else
  echo "==> model already exported, skipping"
fi

echo "==> done. npm run dev"

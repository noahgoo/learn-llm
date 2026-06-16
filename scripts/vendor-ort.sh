#!/usr/bin/env bash
# Copy the ONNX Runtime Web wasm/.mjs runtime files into public/ort/ so they
# are served self-hosted (the worker points ort.env.wasm.wasmPaths there).
# Single source of truth shared by local setup (scripts/setup.sh) and CI
# (.github/workflows/deploy.yml) so the vendored file list can't drift.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/ort
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.{mjs,wasm} \
   node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{mjs,wasm} \
   public/ort/
echo "==> vendored ORT wasm runtime -> public/ort/"

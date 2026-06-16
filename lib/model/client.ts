"use client";

import { create } from "zustand";
import type { ModelOutput, WorkerRequest, WorkerResponse } from "./protocol";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

interface ModelState {
  status: ModelStatus;
  /** Download progress 0..1 while status === "loading" */
  progress: number;
  backend: "webgpu" | "wasm" | null;
  output: ModelOutput | null;
  error: string | null;
  /** Begin lazy model download + init (idempotent). */
  load: () => void;
  /** Run a forward pass; stale results are dropped. */
  run: (text: string) => void;
}

let worker: Worker | null = null;
let requestId = 0;
let pendingText: string | null = null;

function getWorker(set: (partial: Partial<ModelState>) => void): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./worker.ts", import.meta.url));
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const msg = e.data;
    switch (msg.type) {
      case "progress":
        set({
          status: "loading",
          // Content-Length is the *compressed* size when the asset is served
          // gzip/brotli, but the worker reads decompressed bytes off the
          // stream — so loaded can exceed total (the >100% bug). Clamp it.
          progress: msg.total > 0 ? Math.min(1, msg.loaded / msg.total) : 0,
        });
        break;
      case "ready": {
        set({ status: "ready", progress: 1, backend: msg.backend });
        if (pendingText !== null) {
          const text = pendingText;
          pendingText = null;
          useModelStore.getState().run(text);
        }
        break;
      }
      case "result":
        // drop stale results: only the latest request wins
        if (msg.id === requestId) set({ output: msg.output, error: null });
        break;
      case "error":
        if (msg.id === undefined) set({ status: "error", error: msg.message });
        else if (msg.id === requestId) set({ error: msg.message });
        break;
    }
  };
  return worker;
}

export const useModelStore = create<ModelState>()((set, get) => ({
  status: "idle",
  progress: 0,
  backend: null,
  output: null,
  error: null,
  load: () => {
    if (get().status !== "idle") return;
    set({ status: "loading", progress: 0 });
    const req: WorkerRequest = { type: "load" };
    getWorker(set).postMessage(req);
  },
  run: (text: string) => {
    const { status, load } = get();
    if (!text.trim()) return;
    if (status !== "ready") {
      pendingText = text;
      if (status === "idle") load();
      return;
    }
    requestId += 1;
    const req: WorkerRequest = { type: "run", id: requestId, text };
    getWorker(set).postMessage(req);
  },
}));

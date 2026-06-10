"use client";

import { LensToggle } from "./LensToggle";

export function TopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-6 py-5">
      <div className="pointer-events-auto">
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-ink">
          Inside <span className="text-accent">·</span> the{" "}
          <span className="text-accent">·</span> Model
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-wide2 text-faint">
          A journey through a transformer
        </p>
      </div>
      <div className="flex items-center gap-4">
        <LensToggle />
      </div>
    </header>
  );
}

"use client";

export function TopBar() {
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-6 py-5">
        <div className="pointer-events-auto inline-block">
          <p className="font-mono text-[11px] uppercase tracking-wide3 text-ink">
            Learn <span className="text-accent">·</span> LLM
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
            Inside the Model
          </p>
        </div>
      </header>
      <aside className="pointer-events-auto fixed right-4 bottom-28 left-4 z-40 border border-line bg-abyss/92 p-4 text-center backdrop-blur-sm md:hidden">
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          Best on desktop
        </p>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          The 3D model tour works best with a wide screen. Use a desktop
          browser, or open Explain for the written journey.
        </p>
      </aside>
    </>
  );
}

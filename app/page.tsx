import { Hud } from "@/components/ui/Hud";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Scene layer — R3F canvas mounts here in M0.4 */}
      <div className="atmosphere absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />
      <div className="grain pointer-events-none absolute inset-0" />
      <Hud />
    </main>
  );
}

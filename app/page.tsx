import { Experience } from "@/components/canvas/Experience";
import { Hud } from "@/components/ui/Hud";
import { ScrollTrack } from "@/components/ui/ScrollTrack";

export default function Home() {
  return (
    <main className="relative">
      {/* Scene layer — fixed behind the HUD */}
      <div className="atmosphere fixed inset-0">
        <Experience />
      </div>
      <div className="vignette pointer-events-none fixed inset-0" />
      <div className="grain pointer-events-none fixed inset-0" />
      <Hud />
      {/* Scroll runway driving journey progress */}
      <ScrollTrack />
    </main>
  );
}

import { Experience } from "@/components/canvas/Experience";
import { SceneReveal } from "@/components/canvas/SceneReveal";
import { Hud } from "@/components/ui/Hud";
import { ScrollTrack } from "@/components/ui/ScrollTrack";

export default function Home() {
  return (
    <main className="relative">
      {/* Scene layer — fixed behind the HUD; the 3D journey itself stays
          hidden on the landing and fades in on first scroll (SceneReveal). */}
      <div className="atmosphere fixed inset-0">
        <SceneReveal>
          <Experience />
        </SceneReveal>
      </div>
      <div className="vignette pointer-events-none fixed inset-0" />
      <div className="scrim-left pointer-events-none fixed inset-0" />
      <div className="grain pointer-events-none fixed inset-0" />
      <Hud />
      {/* Scroll runway driving journey progress */}
      <ScrollTrack />
    </main>
  );
}

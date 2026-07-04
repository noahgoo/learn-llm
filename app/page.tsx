import { Experience } from "@/components/canvas/Experience";
import { SceneReveal } from "@/components/canvas/SceneReveal";
import { Hud } from "@/components/ui/Hud";
import { ScrollTrack } from "@/components/ui/ScrollTrack";

export default function Home() {
  return (
    <div className="relative">
      {/* Scene layer — fixed behind the HUD; decorative to assistive tech
          (every fact it shows is narrated by the HUD text). Stays hidden on
          the landing and fades in on first scroll (SceneReveal). */}
      <div aria-hidden className="atmosphere fixed inset-0">
        <SceneReveal>
          <Experience />
        </SceneReveal>
      </div>
      <div className="vignette pointer-events-none fixed inset-0" />
      <div className="scrim-left pointer-events-none fixed inset-0" />
      <div className="grain pointer-events-none fixed inset-0" />
      {/* <main> lives inside the Hud, around the narrative content */}
      <Hud />
      {/* Scroll runway driving journey progress */}
      <ScrollTrack />
    </div>
  );
}

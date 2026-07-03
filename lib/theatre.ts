import { getProject } from "@theatre/core";

/**
 * Theatre.js spine. One sequence unit per stage: cameraT (0..1) from
 * `journeyFromProgress` maps to sequence position 0..SEQUENCE_LENGTH, so a
 * property keyframed at position 3 fires exactly when the camera reaches
 * stage 3's station. `journey.ts` remains the source of truth for the
 * timeline; Theatre only choreographs what happens along it.
 *
 * Once choreography is authored, export the state JSON from the studio and
 * pass it here: `getProject("inside-the-model", { state })`.
 */
export const SEQUENCE_LENGTH = 10;

export const theatreProject = getProject("inside-the-model");
export const journeySheet = theatreProject.sheet("journey");

declare global {
  interface Window {
    __theatreStudioLoaded?: boolean;
  }
}

// Keyframe editor UI, dev only. The NODE_ENV check is statically false in
// production builds, so the studio chunk never ships.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  if (!window.__theatreStudioLoaded) {
    window.__theatreStudioLoaded = true;
    import("@theatre/studio").then(({ default: studio }) => {
      studio.initialize();
    });
  }
}

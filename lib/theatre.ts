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

/**
 * Project state. Empty until choreography is authored: open `/?theatre`,
 * keyframe in the studio, export the project JSON, and replace this object
 * with the export (or import it from a committed .json file). Passing an
 * explicit state silences core's "state is empty" error now that the studio
 * only loads on demand.
 */
const state = {
  sheetsById: {},
  definitionVersion: "0.4.0",
  revisionHistory: [],
};

declare global {
  interface Window {
    __theatreStudioLoaded?: boolean;
  }
  var __itmTheatreProject: ReturnType<typeof getProject> | undefined;
}

// Cache on globalThis: Theatre throws if getProject is called twice for the
// same id with a different config, which is exactly what dev HMR does when
// this module re-evaluates. Prod sees a single evaluation; same object.
export const theatreProject = (globalThis.__itmTheatreProject ??= getProject(
  "inside-the-model",
  { state },
));
export const journeySheet = theatreProject.sheet("journey");

// Keyframe editor UI, dev only AND opt-in: open the site with `?theatre`
// to author choreography (e.g. http://localhost:3000/?theatre). Left off by
// default because the studio toolbar overlaps the TopBar and StagePanel,
// which sabotages ordinary dev review. The NODE_ENV check is statically
// false in production builds, so the studio chunk never ships.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const wantsStudio = new URLSearchParams(window.location.search).has("theatre");
  if (wantsStudio && !window.__theatreStudioLoaded) {
    window.__theatreStudioLoaded = true;
    import("@theatre/studio").then(({ default: studio }) => {
      studio.initialize();
    });
  }
}

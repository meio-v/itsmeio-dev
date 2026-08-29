import assert from "node:assert/strict";
import test from "node:test";

import {
  initialMallExperienceState,
  mallExperienceReducer,
} from "./experience-state.ts";

test("adding a token starts driving and every ride exit returns to running attract mode", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "insert-token",
  });
  const exited = mallExperienceReducer(driving, { type: "exit-ride" });

  assert.equal(driving.controlMode, "driving");
  assert.equal(exited.controlMode, "attract");
  assert.equal(exited.resumeMode, "attract");
});

test("attract motion pauses and resumes without becoming a driving control", () => {
  const paused = mallExperienceReducer(initialMallExperienceState, {
    type: "pause-attract",
  });
  const resumed = mallExperienceReducer(paused, { type: "resume-attract" });

  assert.equal(paused.controlMode, "paused");
  assert.equal(paused.resumeMode, "attract");
  assert.equal(resumed.controlMode, "attract");
});

test("closing the arcade restores a deliberately paused attract ride", () => {
  const paused = mallExperienceReducer(initialMallExperienceState, {
    type: "pause-attract",
  });
  const open = mallExperienceReducer(paused, {
    type: "open-poi",
    id: "currently-playing",
  });
  const closed = mallExperienceReducer(open, { type: "close-poi" });

  assert.equal(open.poiReturnMode, "paused");
  assert.equal(closed.controlMode, "paused");
  assert.equal(closed.resumeMode, "attract");
  assert.equal(closed.poiReturnMode, null);
});

test("repeated arcade opens preserve the original ride mode", () => {
  const open = mallExperienceReducer(initialMallExperienceState, {
    type: "open-poi",
    id: "currently-playing",
  });
  const reopened = mallExperienceReducer(open, {
    type: "open-poi",
    id: "currently-playing",
  });
  const closed = mallExperienceReducer(reopened, { type: "close-poi" });

  assert.equal(reopened.poiReturnMode, "attract");
  assert.equal(closed.controlMode, "attract");
});

test("arriving at the arcade exits driving behind the dialog", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "insert-token",
  });
  const open = mallExperienceReducer(driving, {
    type: "open-poi",
    id: "currently-playing",
    restoreMode: "attract",
  });
  const closed = mallExperienceReducer(open, { type: "close-poi" });

  assert.equal(open.controlMode, "paused");
  assert.equal(closed.controlMode, "attract");
  assert.equal(closed.selectedPoi, null);
});

test("runtime failure leaves HTML content available but the ride paused", () => {
  const failed = mallExperienceReducer(initialMallExperienceState, {
    type: "runtime-unavailable",
    reason: "WebGL2 is unavailable",
  });

  assert.equal(failed.runtimeStatus, "unavailable");
  assert.equal(failed.controlMode, "paused");
  assert.equal(failed.runtimeMessage, "WebGL2 is unavailable");
});

test("runtime blur exits driving instead of offering a hidden resume state", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "insert-token",
  });
  const exited = mallExperienceReducer(driving, {
    type: "runtime-control-mode",
    mode: "attract",
  });

  assert.equal(exited.controlMode, "attract");
  assert.equal(exited.resumeMode, "attract");
});

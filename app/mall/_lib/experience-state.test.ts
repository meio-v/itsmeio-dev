import assert from "node:assert/strict";
import test from "node:test";

import {
  initialMallExperienceState,
  mallExperienceReducer,
} from "./experience-state.ts";

test("opening and closing the arcade restores the prior ride mode", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "take-control",
  });
  const open = mallExperienceReducer(driving, {
    type: "open-poi",
    id: "currently-playing",
  });
  const closed = mallExperienceReducer(open, { type: "close-poi" });

  assert.equal(open.controlMode, "paused");
  assert.equal(closed.controlMode, "driving");
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

test("runtime blur pauses React state without forgetting driving resume intent", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "take-control",
  });
  const paused = mallExperienceReducer(driving, {
    type: "runtime-control-mode",
    mode: "paused",
  });
  const open = mallExperienceReducer(paused, {
    type: "open-poi",
    id: "currently-playing",
  });
  const closed = mallExperienceReducer(open, { type: "close-poi" });

  assert.equal(paused.controlMode, "paused");
  assert.equal(paused.resumeMode, "driving");
  assert.equal(closed.controlMode, "driving");
});

test("graphics interruption recovers without forgetting driving intent", () => {
  const driving = mallExperienceReducer(initialMallExperienceState, {
    type: "take-control",
  });
  const interrupted = mallExperienceReducer(driving, {
    type: "runtime-interrupted",
    reason: "Restoring graphics",
  });
  const restored = mallExperienceReducer(interrupted, {
    type: "runtime-ready",
  });
  const resumed = mallExperienceReducer(restored, { type: "resume-ride" });

  assert.equal(interrupted.runtimeStatus, "recovering");
  assert.equal(interrupted.controlMode, "paused");
  assert.equal(interrupted.resumeMode, "driving");
  assert.equal(restored.runtimeStatus, "ready");
  assert.equal(resumed.controlMode, "driving");
});

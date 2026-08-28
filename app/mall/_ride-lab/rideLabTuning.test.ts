import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_RIDE_LAB_TUNING, parseRideLabTuning, requiresRideLabPhysicsRebuild, sanitizeRideLabTuning, serializeRideLabTuning } from "./rideLabTuning.ts";

test("configuration round-trips through a versioned public format", () => {
  const changed = { ...DEFAULT_RIDE_LAB_TUNING, engineTorque: 222 };
  assert.deepEqual(parseRideLabTuning(serializeRideLabTuning(changed)), changed);
});

test("configuration rejects unknown schema versions and malformed JSON", () => {
  assert.equal(parseRideLabTuning('{"version":2,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning("{"), null);
});

test("unsafe imported values are bounded and suspension remains ordered", () => {
  const safe = sanitizeRideLabTuning({ engineTorque: 99999, rideAssist: -4, suspensionMin: 0.6, suspensionMax: 0.2 });
  assert.equal(safe.engineTorque, 400);
  assert.equal(safe.rideAssist, 0);
  assert.ok(safe.suspensionMax > safe.suspensionMin);
});

test("presentation tuning preserves the physics world while physical tuning rebuilds it", () => {
  assert.equal(requiresRideLabPhysicsRebuild(
    { ...DEFAULT_RIDE_LAB_TUNING },
    { ...DEFAULT_RIDE_LAB_TUNING, cameraDistance: DEFAULT_RIDE_LAB_TUNING.cameraDistance + 1 },
  ), false);
  assert.equal(requiresRideLabPhysicsRebuild(
    { ...DEFAULT_RIDE_LAB_TUNING },
    { ...DEFAULT_RIDE_LAB_TUNING, engineTorque: DEFAULT_RIDE_LAB_TUNING.engineTorque + 10 },
  ), true);
});

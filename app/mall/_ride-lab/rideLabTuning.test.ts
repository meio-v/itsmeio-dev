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

test("unsafe imported values are bounded and ordered", () => {
  const safe = sanitizeRideLabTuning({ engineTorque: 99999, rideAssist: -4, suspensionMin: 0.6, suspensionMax: 0.2, ollieMinImpulse: 1500, ollieMaxImpulse: 300 });
  assert.equal(safe.engineTorque, 400);
  assert.equal(safe.rideAssist, 0);
  assert.ok(safe.suspensionMax > safe.suspensionMin);
  assert.ok(safe.ollieMaxImpulse >= safe.ollieMinImpulse);
});

test("older partial version-one configs receive every aerial default", () => {
  const tuning = parseRideLabTuning(JSON.stringify({ version: 1, tuning: { rideAssist: 0.9 } }));
  assert.ok(tuning);
  assert.equal(tuning.hoverForce, DEFAULT_RIDE_LAB_TUNING.hoverForce);
  assert.equal(tuning.grindFallSpeed, DEFAULT_RIDE_LAB_TUNING.grindFallSpeed);
  assert.equal(tuning.preloadChargeSeconds, DEFAULT_RIDE_LAB_TUNING.preloadChargeSeconds);
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

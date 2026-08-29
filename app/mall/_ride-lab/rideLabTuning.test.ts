import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_RIDE_LAB_TUNING, parseRideLabTuning, requiresRideLabPhysicsRebuild, RIDE_LAB_SCHEMA_VERSION, sanitizeRideLabTuning, serializeRideLabTuning } from "./rideLabTuning.ts";

test("configuration round-trips through a versioned public format", () => {
  const changed = { ...DEFAULT_RIDE_LAB_TUNING, engineTorque: 222 };
  assert.deepEqual(parseRideLabTuning(serializeRideLabTuning(changed)), changed);
});

test("balanced engine torque is fifteen percent above the 150 Nm baseline", () => {
  assert.equal(DEFAULT_RIDE_LAB_TUNING.engineTorque, 172.5);
});

test("balanced passive coasting drag is ten percent below the 0.08 baseline", () => {
  assert.equal(DEFAULT_RIDE_LAB_TUNING.linearDamping, 0.072);
});

test("balanced assisted turn radius is twenty percent wider than the 24 metre baseline", () => {
  assert.equal(DEFAULT_RIDE_LAB_TUNING.turnAssistRadiusMeters, 28.8);
});

test("balanced lean recovery decays released input more quickly", () => {
  assert.equal(DEFAULT_RIDE_LAB_TUNING.steerReturn, 0.625);
});

test("camera feedback uses a stronger throttle punch and an eased steering orbit", () => {
  assert.equal(DEFAULT_RIDE_LAB_TUNING.cameraThrottlePunchDistance, 0.65);
  assert.equal(DEFAULT_RIDE_LAB_TUNING.cameraSteerOrbitRadians, 8 * Math.PI / 180);
  assert.equal(DEFAULT_RIDE_LAB_TUNING.cameraSteerOrbitResponse, 2.5);
});

test("configuration rejects stale and unknown schema versions plus malformed JSON", () => {
  assert.equal(RIDE_LAB_SCHEMA_VERSION, 12);
  assert.equal(parseRideLabTuning('{"version":1,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":2,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":3,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":4,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":5,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":6,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":7,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":8,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":9,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":10,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":11,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning('{"version":13,"tuning":{}}'), null);
  assert.equal(parseRideLabTuning("{"), null);
});

test("unsafe imported values are bounded and ordered", () => {
  const safe = sanitizeRideLabTuning({
    engineTorque: 99999,
    rideAssist: -4,
    riderWeightShiftStartSpeedMps: 10,
    riderWeightShiftFullSpeedMps: 1,
    suspensionMin: 0.6,
    suspensionMax: 0.2,
    ollieMinImpulse: 1500,
    ollieMaxImpulse: 300,
    topSpeedMps: 5,
    cameraCruiseSpeedMps: 30,
  });
  assert.equal(safe.engineTorque, 400);
  assert.equal(safe.rideAssist, 0);
  assert.ok(safe.riderWeightShiftFullSpeedMps > safe.riderWeightShiftStartSpeedMps);
  assert.ok(safe.suspensionMax > safe.suspensionMin);
  assert.ok(safe.ollieMaxImpulse >= safe.ollieMinImpulse);
  assert.equal(safe.cameraCruiseSpeedMps, 4);
});

test("partial current configs receive every aerial and turning default", () => {
  const tuning = parseRideLabTuning(JSON.stringify({ version: 12, tuning: { rideAssist: 0.9 } }));
  assert.ok(tuning);
  assert.equal(tuning.hoverForce, DEFAULT_RIDE_LAB_TUNING.hoverForce);
  assert.equal(tuning.grindFallSpeed, DEFAULT_RIDE_LAB_TUNING.grindFallSpeed);
  assert.equal(tuning.preloadChargeSeconds, DEFAULT_RIDE_LAB_TUNING.preloadChargeSeconds);
  assert.equal(tuning.turnAssistRadiusMeters, DEFAULT_RIDE_LAB_TUNING.turnAssistRadiusMeters);
  assert.equal(tuning.highSpeedTorqueMultiplier, DEFAULT_RIDE_LAB_TUNING.highSpeedTorqueMultiplier);
  assert.equal(tuning.cameraNearDistance, DEFAULT_RIDE_LAB_TUNING.cameraNearDistance);
  assert.equal(tuning.speedLineOnsetOpacity, DEFAULT_RIDE_LAB_TUNING.speedLineOnsetOpacity);
  assert.equal(tuning.cameraThrottlePunchDistance, DEFAULT_RIDE_LAB_TUNING.cameraThrottlePunchDistance);
  assert.equal(tuning.speedLineBurstOpacity, DEFAULT_RIDE_LAB_TUNING.speedLineBurstOpacity);
  assert.equal(tuning.cameraSteerOrbitRadians, DEFAULT_RIDE_LAB_TUNING.cameraSteerOrbitRadians);
});

test("presentation tuning preserves the physics world while physical tuning rebuilds it", () => {
  assert.equal(requiresRideLabPhysicsRebuild(
    { ...DEFAULT_RIDE_LAB_TUNING },
    { ...DEFAULT_RIDE_LAB_TUNING, cameraDistance: DEFAULT_RIDE_LAB_TUNING.cameraDistance + 1 },
  ), false);
  assert.equal(requiresRideLabPhysicsRebuild(
    { ...DEFAULT_RIDE_LAB_TUNING },
    { ...DEFAULT_RIDE_LAB_TUNING, preloadCompression: DEFAULT_RIDE_LAB_TUNING.preloadCompression + 0.01 },
  ), false);
  assert.equal(requiresRideLabPhysicsRebuild(
    { ...DEFAULT_RIDE_LAB_TUNING },
    { ...DEFAULT_RIDE_LAB_TUNING, engineTorque: DEFAULT_RIDE_LAB_TUNING.engineTorque + 10 },
  ), true);
});

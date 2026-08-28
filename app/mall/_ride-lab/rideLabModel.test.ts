import assert from "node:assert/strict";
import test from "node:test";
import { advanceRideIntent, longitudinalSpeed, resolveTouchSteer, retainTransitionPulse, speedLineStrength } from "./rideLabModel.ts";
import { DEFAULT_RIDE_LAB_TUNING } from "./rideLabTuning.ts";

test("throttle acknowledges immediately but takes time to reach full drive", () => {
  const next = advanceRideIntent(
    { throttle: 0, brake: 0, steer: 0 },
    { throttle: 1, brake: 0, steer: 0, reset: false },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.ok(next.throttle > 0);
  assert.ok(next.throttle < 0.1);
});

test("released steering physically recovers over multiple fixed steps", () => {
  const next = advanceRideIntent(
    { throttle: 0, brake: 0, steer: 1 },
    { throttle: 0, brake: 0, steer: 0, reset: false },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.ok(next.steer > 0.8);
  assert.ok(next.steer < 1);
});

test("acceleration leads speed-line feedback once speed clears its threshold", () => {
  const steady = speedLineStrength(8, 0, DEFAULT_RIDE_LAB_TUNING);
  const accelerating = speedLineStrength(8, 4, DEFAULT_RIDE_LAB_TUNING);
  assert.ok(accelerating > steady);
  assert.equal(speedLineStrength(2, 20, DEFAULT_RIDE_LAB_TUNING), 0);
});

test("a state transition survives later ordinary input in the same render frame", () => {
  const retained = retainTransitionPulse(null, "takeoff");
  assert.equal(retainTransitionPulse(retained, "throttle"), "takeoff");
  assert.equal(retainTransitionPulse(null, "throttle"), null);
});

test("touch steering preserves the direction whose pointer remains held", () => {
  assert.equal(resolveTouchSteer(true, false), -1);
  assert.equal(resolveTouchSteer(true, true), 0);
  assert.equal(resolveTouchSteer(false, true), 1);
});

test("longitudinal speed remains exact while the moped is pitched on a ramp", () => {
  const halfAngle = Math.PI / 8;
  const rotation = { x: Math.sin(halfAngle), y: 0, z: 0, w: Math.cos(halfAngle) };
  const velocity = { x: 0, y: -Math.SQRT1_2 * 10, z: Math.SQRT1_2 * 10 };
  assert.ok(Math.abs(longitudinalSpeed(velocity, rotation) - 10) < 1e-12);
});

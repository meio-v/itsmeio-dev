import assert from "node:assert/strict";
import test from "node:test";
import { acquireAndConstruct } from "./rideLabLifecycle.ts";
import { advanceAerialMechanic, advanceRideIntent, createAerialMechanicState, longitudinalSpeed, resolveHeldAerialFeedback, resolveSuspensionLoadPresentation, resolveTouchSteer, retainTransitionPulse, signedLeanRadians, speedLineStrength } from "./rideLabModel.ts";
import { DEFAULT_RIDE_LAB_TUNING } from "./rideLabTuning.ts";

test("throttle acknowledges immediately but takes time to reach full drive", () => {
  const next = advanceRideIntent(
    { throttle: 0, brake: 0, steer: 0 },
    { throttle: 1, brake: 0, steer: 0, reset: false, aerialAction: false },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.ok(next.throttle > 0);
  assert.ok(next.throttle < 0.1);
});

test("released steering physically recovers over multiple fixed steps", () => {
  const next = advanceRideIntent(
    { throttle: 0, brake: 0, steer: 1 },
    { throttle: 0, brake: 0, steer: 0, reset: false, aerialAction: false },
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

test("lean measurement stays upright regardless of heading", () => {
  assert.ok(Math.abs(signedLeanRadians({ x: 0, y: 0, z: 0, w: 1 })) < 1e-12);
  assert.ok(Math.abs(signedLeanRadians({ x: 0, y: 1, z: 0, w: 0 })) < 1e-12);
  const halfLean = 0.1;
  assert.ok(Math.abs(Math.abs(signedLeanRadians({ x: Math.sin(halfLean), y: Math.cos(halfLean), z: 0, w: 0 })) - 0.2) < 1e-12);
});

test("suspension load communicates longitudinal pitch without adding sideways roll", () => {
  assert.deepEqual(resolveSuspensionLoadPresentation(28), { pitchRadians: 0.045, rollRadians: 0 });
  assert.deepEqual(resolveSuspensionLoadPresentation(-28), { pitchRadians: -0.045, rollRadians: 0 });
});

test("blocked airborne input does not claim hover feedback", () => {
  assert.equal(resolveHeldAerialFeedback({ grounded: false, grinding: false, aerialPhase: "airborne" }), "idle");
  assert.equal(resolveHeldAerialFeedback({ grounded: false, grinding: false, aerialPhase: "hover" }), "hover");
});

test("failed runtime construction releases its acquired physics lease", async () => {
  let disposeCalls = 0;
  const failure = new Error("renderer construction failed");
  await assert.rejects(
    acquireAndConstruct(
      async () => ({ dispose: () => { disposeCalls += 1; } }),
      () => { throw failure; },
    ),
    failure,
  );
  assert.equal(disposeCalls, 1);
});

test("held ground action stores preload until release produces a bounded ollie", () => {
  let state = createAerialMechanicState();
  let step = advanceAerialMechanic(state, { actionHeld: true, grounded: true, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 0.35);
  state = step.state;
  assert.equal(step.eventPulse, "preload");
  assert.ok(Math.abs(state.preload - 0.5) < 1e-12);
  step = advanceAerialMechanic(state, { actionHeld: true, grounded: true, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 0.35);
  state = step.state;
  assert.equal(state.preload, 1);
  step = advanceAerialMechanic(state, { actionHeld: false, grounded: true, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 1 / 60);
  assert.equal(step.eventPulse, "ollie");
  assert.equal(step.ollieImpulse, DEFAULT_RIDE_LAB_TUNING.ollieMaxImpulse);
  assert.equal(step.state.preload, 0);
});

test("airborne hold spends hover energy and grounded time recharges it", () => {
  let state = createAerialMechanicState();
  let step = advanceAerialMechanic(state, { actionHeld: true, grounded: false, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 1);
  assert.equal(step.eventPulse, "hover");
  assert.equal(step.upwardForce, DEFAULT_RIDE_LAB_TUNING.hoverForce);
  assert.ok(Math.abs(step.state.hoverEnergy - 2 / 3) < 1e-12);
  state = step.state;
  step = advanceAerialMechanic(state, { actionHeld: false, grounded: true, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 1.5);
  assert.equal(step.state.hoverEnergy, 1);
  assert.equal(step.state.airtimeSeconds, 0);
});

test("a depleted aerial resource refuses force until grounded recharge", () => {
  let step = advanceAerialMechanic(
    createAerialMechanicState(),
    { actionHeld: true, grounded: false, wallEligible: false },
    DEFAULT_RIDE_LAB_TUNING,
    DEFAULT_RIDE_LAB_TUNING.hoverDurationSeconds,
  );
  assert.equal(step.state.hoverEnergy, 0);
  step = advanceAerialMechanic(step.state, { actionHeld: true, grounded: false, wallEligible: false }, DEFAULT_RIDE_LAB_TUNING, 1 / 60);
  assert.equal(step.eventPulse, "depleted");
  assert.equal(step.upwardForce, 0);
});

test("a ground-originating hold must be released before airborne resource use", () => {
  let state = advanceAerialMechanic(
    createAerialMechanicState(),
    { actionHeld: true, grounded: true, wallEligible: false },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  ).state;
  let step = advanceAerialMechanic(
    state,
    { actionHeld: true, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.eventPulse, "idle");
  assert.equal(step.upwardForce, 0);
  assert.equal(step.grinding, false);
  state = advanceAerialMechanic(
    step.state,
    { actionHeld: false, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  ).state;
  step = advanceAerialMechanic(
    state,
    { actionHeld: true, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.eventPulse, "grind");
  assert.equal(step.grinding, true);
});

test("preload and resource envelopes are equivalent across fixed-step partitions", () => {
  const oneStep = advanceAerialMechanic(
    createAerialMechanicState(),
    { actionHeld: true, grounded: true, wallEligible: false },
    DEFAULT_RIDE_LAB_TUNING,
    0.35,
  ).state;
  let partitioned = createAerialMechanicState();
  for (let index = 0; index < 21; index += 1) {
    partitioned = advanceAerialMechanic(
      partitioned,
      { actionHeld: true, grounded: true, wallEligible: false },
      DEFAULT_RIDE_LAB_TUNING,
      1 / 60,
    ).state;
  }
  assert.ok(Math.abs(partitioned.preload - oneStep.preload) < 1e-12);
  assert.equal(partitioned.hoverEnergy, oneStep.hoverEnergy);
});

test("an airborne action inside a wall capture zone enters grind without erasing its resource contract", () => {
  const step = advanceAerialMechanic(
    createAerialMechanicState(),
    { actionHeld: true, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    0.5,
  );
  assert.equal(step.eventPulse, "grind");
  assert.equal(step.state.phase, "grind");
  assert.equal(step.grinding, true);
  assert.ok(step.state.hoverEnergy < 1 && step.state.hoverEnergy > 0);
});

test("grind exits on wall loss, depletion, and ground contact", () => {
  let step = advanceAerialMechanic(
    createAerialMechanicState(),
    { actionHeld: true, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.grinding, true);
  step = advanceAerialMechanic(
    step.state,
    { actionHeld: true, grounded: false, wallEligible: false },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.grinding, false);
  step = advanceAerialMechanic(
    { ...step.state, hoverEnergy: 0 },
    { actionHeld: true, grounded: false, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.eventPulse, "depleted");
  assert.equal(step.grinding, false);
  step = advanceAerialMechanic(
    step.state,
    { actionHeld: false, grounded: true, wallEligible: true },
    DEFAULT_RIDE_LAB_TUNING,
    1 / 60,
  );
  assert.equal(step.state.phase, "grounded");
  assert.equal(step.grinding, false);
});

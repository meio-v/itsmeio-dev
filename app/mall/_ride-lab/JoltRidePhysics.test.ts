import assert from "node:assert/strict";
import test from "node:test";

import { JoltRidePhysics, loadJolt } from "./JoltRidePhysics.ts";
import { DEFAULT_RIDE_LAB_TUNING } from "./rideLabTuning.ts";

const idle = { throttle: 0, brake: 0, steer: 0, reset: false, aerialAction: false };

test("native Jolt motorcycle accelerates, coasts, and brakes deterministically", async () => {
  const run = async () => {
    const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
    assert.equal(physics.engineName, "Jolt MotorcycleController");
    let snapshot = physics.snapshot();
    for (let step = 0; step < 120; step += 1) snapshot = physics.step({ ...idle, throttle: 1 });
    const accelerated = snapshot.speedMps;
    snapshot = physics.step(idle);
    const coasted = snapshot.speedMps;
    for (let step = 0; step < 75; step += 1) snapshot = physics.step({ ...idle, brake: 1 });
    const braked = snapshot.speedMps;
    physics.dispose();
    return { accelerated, coasted, braked };
  };
  const first = await run();
  const second = await run();
  assert.ok(first.accelerated > 4);
  assert.ok(first.coasted > first.accelerated * 0.96);
  assert.ok(first.braked < first.accelerated * 0.5);
  assert.deepEqual(first, second);
});

test("balanced acceleration reaches 30 km/h in a controllable window", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  const targetSpeedMps = 30 / 3.6;
  let elapsedSeconds = 0;
  let snapshot = physics.snapshot();
  while (snapshot.speedMps < targetSpeedMps && elapsedSeconds < 6) {
    snapshot = physics.step({ ...idle, throttle: 1 });
    elapsedSeconds += DEFAULT_RIDE_LAB_TUNING.fixedStep;
  }
  physics.dispose();
  assert.ok(snapshot.speedMps >= targetSpeedMps);
  assert.ok(elapsedSeconds >= 3, `expected 0–30 km/h to take at least 3s, observed ${elapsedSeconds.toFixed(2)}s`);
  assert.ok(elapsedSeconds <= 3.3, `expected 0–30 km/h within 3.3s, observed ${elapsedSeconds.toFixed(2)}s`);
});

test("create and dispose returns Jolt-owned memory to its baseline", async () => {
  const Jolt = await loadJolt();
  const before = Jolt.JoltInterface.prototype.sGetFreeMemory();
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  for (let step = 0; step < 240; step += 1) physics.step({ ...idle, throttle: 1, steer: step < 80 ? -0.35 : 0 });
  physics.dispose();
  physics.dispose();
  const after = Jolt.JoltInterface.prototype.sGetFreeMemory();
  assert.equal(after, before, `expected no leaked bytes, observed ${before - after}`);
});

test("Jolt interface ownership is serialized across concurrent runtime creation", async () => {
  const first = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let secondResolved = false;
  const secondPending = JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING }).then((physics) => {
    secondResolved = true;
    return physics;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(secondResolved, false);
  first.dispose();
  const second = await secondPending;
  assert.equal(secondResolved, true);
  second.dispose();
});

test("reset clears drivetrain, wheel, and warm-start state to a repeatable baseline", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  for (let step = 0; step < 100; step += 1) physics.step({ ...idle, throttle: 1, steer: -0.3 });
  for (let step = 0; step < 30; step += 1) physics.step({ ...idle, brake: 1 });
  physics.step({ ...idle, reset: true });
  const afterFirstReset = physics.step(idle);
  for (let step = 0; step < 30; step += 1) physics.step({ ...idle, throttle: 1 });
  physics.step({ ...idle, reset: true });
  const afterSecondReset = physics.step(idle);
  physics.dispose();
  assert.deepEqual(afterSecondReset, afterFirstReset);
});

test("near-stationary upright assist prevents the parked moped from tipping over", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let snapshot = physics.snapshot();
  for (let step = 0; step < 1_800; step += 1) snapshot = physics.step(idle);
  physics.dispose();
  assert.equal(snapshot.grounded, true);
  assert.ok(Math.abs(snapshot.leanRadians) < 0.05);
});

test("mirrored rider weight shift leans into turns with symmetric bounded roll", async () => {
  const run = async (steer: number) => {
    const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
    let peakLean = 0;
    let snapshot = physics.snapshot();
    for (let step = 0; step < 120; step += 1) {
      snapshot = physics.step({ ...idle, throttle: 1, steer });
      if (Math.abs(snapshot.leanRadians) > Math.abs(peakLean)) peakLean = snapshot.leanRadians;
    }
    physics.dispose();
    return { peakLean, lateralPosition: snapshot.position.x };
  };
  const left = await run(-0.35);
  const right = await run(0.35);
  assert.ok(left.peakLean < 0);
  assert.ok(right.peakLean > 0);
  assert.ok(left.lateralPosition > 0);
  assert.ok(right.lateralPosition < 0);
  assert.ok(Math.abs(left.peakLean) < 0.72);
  assert.ok(Math.abs(right.peakLean) < 0.72);
  assert.ok(Math.abs(Math.abs(left.peakLean) - Math.abs(right.peakLean)) < 0.01);
  assert.ok(Math.abs(Math.abs(left.lateralPosition) - Math.abs(right.lateralPosition)) < 0.01);
});

test("released steering automatically returns the moving chassis to forward orientation", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let snapshot = physics.snapshot();
  for (let step = 0; step < 120; step += 1) {
    snapshot = physics.step({ ...idle, throttle: 1, steer: 1 });
  }
  const turningLean = snapshot.leanRadians;
  let previousLean = turningLean;
  let previousHeading = Math.atan2(
    2 * (snapshot.rotation.w * snapshot.rotation.y + snapshot.rotation.x * snapshot.rotation.z),
    1 - 2 * (snapshot.rotation.y * snapshot.rotation.y + snapshot.rotation.x * snapshot.rotation.x),
  );
  let halfSecondLean = turningLean;
  let maximumLeanStep = 0;
  let maximumLeanStepIndex = 0;
  let previousLeanStep = 0;
  let maximumLeanStepChange = 0;
  let maximumLeanStepChangeIndex = 0;
  let minimumLean = turningLean;
  let maximumOppositeYawStep = 0;
  const recoverySamples: number[] = [];
  for (let step = 0; step < 180; step += 1) {
    snapshot = physics.step({ ...idle, throttle: 1 });
    if (step === 29) halfSecondLean = snapshot.leanRadians;
    if ((step + 1) % 30 === 0) recoverySamples.push(snapshot.leanRadians);
    const leanStep = Math.abs(snapshot.leanRadians - previousLean);
    const signedLeanStep = snapshot.leanRadians - previousLean;
    const leanStepChange = Math.abs(signedLeanStep - previousLeanStep);
    if (leanStepChange > maximumLeanStepChange) {
      maximumLeanStepChange = leanStepChange;
      maximumLeanStepChangeIndex = step;
    }
    previousLeanStep = signedLeanStep;
    if (leanStep > maximumLeanStep) {
      maximumLeanStep = leanStep;
      maximumLeanStepIndex = step;
    }
    minimumLean = Math.min(minimumLean, snapshot.leanRadians);
    const heading = Math.atan2(
      2 * (snapshot.rotation.w * snapshot.rotation.y + snapshot.rotation.x * snapshot.rotation.z),
      1 - 2 * (snapshot.rotation.y * snapshot.rotation.y + snapshot.rotation.x * snapshot.rotation.x),
    );
    const headingStep = Math.atan2(Math.sin(heading - previousHeading), Math.cos(heading - previousHeading));
    maximumOppositeYawStep = Math.max(maximumOppositeYawStep, headingStep);
    previousLean = snapshot.leanRadians;
    previousHeading = heading;
  }
  physics.dispose();

  assert.ok(turningLean > 0.08, "setup should produce a visible right bank before release");
  assert.ok(
    halfSecondLean < turningLean * 0.995,
    `upright recovery should begin immediately: ${(turningLean * 180 / Math.PI).toFixed(1)}°; samples ${recoverySamples.map((lean) => (lean * 180 / Math.PI).toFixed(1)).join(", ")}°`,
  );
  assert.ok(
    halfSecondLean > turningLean * 0.45,
    `upright recovery should remain gradual after half a second: observed ${(halfSecondLean * 180 / Math.PI).toFixed(1)}°`,
  );
  assert.ok(
    maximumLeanStep < 0.31 * Math.PI / 180,
    `upright recovery should not snap between fixed steps: observed ${(maximumLeanStep * 180 / Math.PI).toFixed(2)}° at step ${maximumLeanStepIndex}`,
  );
  assert.ok(
    maximumLeanStepChange < 0.03 * Math.PI / 180,
    `upright recovery should ease roll velocity: observed ${(maximumLeanStepChange * 180 / Math.PI).toFixed(3)}°/tick change at step ${maximumLeanStepChangeIndex}`,
  );
  assert.ok(
    minimumLean >= -0.01 * Math.PI / 180,
    `upright recovery should limit opposite-side motion to a 0.01° micro-overshoot: observed ${(minimumLean * 180 / Math.PI).toFixed(3)}°`,
  );
  assert.ok(maximumOppositeYawStep < 0.1 * Math.PI / 180, "neutral recovery should not counter-steer left");
  assert.equal(snapshot.intent.steer, 0, "released steering intent should reach neutral");
  assert.ok(
    Math.abs(snapshot.leanRadians) < 3 * Math.PI / 180,
    `expected the moving chassis to recover within 3 degrees of upright, observed ${(snapshot.leanRadians * 180 / Math.PI).toFixed(1)}`,
  );
});

test("released steering never crosses upright during grounded recovery", async () => {
  for (const steer of [-1, 1]) {
    const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
    let snapshot = physics.snapshot();
    let minimumOriginSideLean = Number.POSITIVE_INFINITY;
    for (let step = 0; step < 120; step += 1) {
      snapshot = physics.step({ ...idle, throttle: 1, steer });
    }
    for (let step = 0; step < 180; step += 1) {
      snapshot = physics.step({ ...idle, throttle: 1 });
      if (!snapshot.grounded) break;
      const originSideLean = snapshot.leanRadians * steer;
      if (originSideLean < minimumOriginSideLean) {
        minimumOriginSideLean = originSideLean;
      }
    }
    physics.dispose();
    assert.ok(
      minimumOriginSideLean >= -0.01 * Math.PI / 180,
      `grounded recovery from ${steer > 0 ? "right" : "left"} crossed upright by ${(Math.abs(minimumOriginSideLean) * 180 / Math.PI).toFixed(3)}°`,
    );
  }
});

test("sustained throttle and steering stay bounded by the configured lean and yaw ceilings", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let peakLean = 0;
  let peakYawRate = 0;
  let peakFrontSuspensionLoad = 0;
  let minimumSustainedSpeed = Number.POSITIVE_INFINITY;
  let previousHeading = 0;
  let snapshot = physics.snapshot();
  for (let step = 0; step < 600; step += 1) {
    snapshot = physics.step({ ...idle, throttle: 1, steer: 1 });
    const { x, y, z, w } = snapshot.rotation;
    const heading = Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + x * x));
    if (step >= 60) {
      peakLean = Math.max(peakLean, Math.abs(snapshot.leanRadians));
      peakFrontSuspensionLoad = Math.max(peakFrontSuspensionLoad, snapshot.frontSuspensionLoad);
      const headingDelta = Math.atan2(Math.sin(heading - previousHeading), Math.cos(heading - previousHeading));
      peakYawRate = Math.max(peakYawRate, Math.abs(headingDelta) / DEFAULT_RIDE_LAB_TUNING.fixedStep);
    }
    if (step >= 180) minimumSustainedSpeed = Math.min(minimumSustainedSpeed, snapshot.horizontalSpeedMps);
    previousHeading = heading;
  }
  physics.dispose();
  assert.ok(snapshot.position.x < -1, "expected sustained right input to produce a rightward path");
  assert.ok(
    peakLean <= DEFAULT_RIDE_LAB_TUNING.maxLeanRadians + 0.5 * Math.PI / 180,
    `expected sustained lean within 0.5° solver tolerance of the configured ceiling, observed ${(peakLean * 180 / Math.PI).toFixed(1)}°`,
  );
  assert.ok(
    peakYawRate <= DEFAULT_RIDE_LAB_TUNING.turnAssistMaxYawRate + 0.5 * Math.PI / 180,
    `expected yaw rate within 0.5°/s solver tolerance of the configured ceiling, observed ${(peakYawRate * 180 / Math.PI).toFixed(1)}°/s`,
  );
  assert.ok(minimumSustainedSpeed > 5, `expected sustained speed above 18 km/h, observed ${(minimumSustainedSpeed * 3.6).toFixed(1)}`);
  assert.ok(peakFrontSuspensionLoad < 500, `expected no hard wall load, observed ${peakFrontSuspensionLoad.toFixed(1)}`);
});

test("the yaw-rate ceiling remains hard when curvature assist is low", async () => {
  const tuning = {
    ...DEFAULT_RIDE_LAB_TUNING,
    turnAssist: 0.1,
    turnAssistMaxYawRate: 0.15,
  };
  const physics = await JoltRidePhysics.create(tuning);
  let previousHeading = 0;
  let peakYawRate = 0;
  for (let step = 0; step < 300; step += 1) {
    const snapshot = physics.step({ ...idle, throttle: 1, steer: 1 });
    const { x, y, z, w } = snapshot.rotation;
    const heading = Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + x * x));
    if (step >= 60) {
      const headingDelta = Math.atan2(Math.sin(heading - previousHeading), Math.cos(heading - previousHeading));
      peakYawRate = Math.max(peakYawRate, Math.abs(headingDelta) / tuning.fixedStep);
    }
    previousHeading = heading;
  }
  physics.dispose();
  assert.ok(
    peakYawRate <= tuning.turnAssistMaxYawRate + 0.5 * Math.PI / 180,
    `expected low-assist yaw below the hard ceiling, observed ${(peakYawRate * 180 / Math.PI).toFixed(1)}°/s`,
  );
});

test("the authored test ramp produces a grounded-airborne-grounded journey", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  physics.setScenario("ramp");
  let sawTakeoff = false;
  let sawLandingAfterTakeoff = false;
  for (let step = 0; step < 220; step += 1) {
    const snapshot = physics.step({ ...idle, throttle: 1 });
    sawTakeoff ||= snapshot.movementTransition === "takeoff";
    sawLandingAfterTakeoff ||= sawTakeoff && snapshot.movementTransition === "landing";
  }
  physics.dispose();
  assert.equal(sawTakeoff, true);
  assert.equal(sawLandingAfterTakeoff, true);
});

test("a held physical preload stays grounded until release produces upward ollie velocity", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let snapshot = physics.snapshot();
  for (let step = 0; step < 90; step += 1) snapshot = physics.step(idle);
  assert.equal(snapshot.grounded, true);
  const groundedHeight = snapshot.position.y;
  for (let step = 0; step < 42; step += 1) snapshot = physics.step({ ...idle, aerialAction: true });
  assert.ok(snapshot.preload > 0.98);
  assert.equal(snapshot.grounded, true);
  assert.ok(snapshot.position.y <= groundedHeight + 0.02);
  snapshot = physics.step(idle);
  physics.dispose();
  assert.equal(snapshot.eventPulse, "ollie");
  assert.equal(snapshot.preload, 0);
  assert.ok(snapshot.verticalSpeedMps > 4);
});

test("the complete ollie and hover profile repeats exactly", async () => {
  const run = async () => {
    const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
    let snapshot = physics.snapshot();
    for (let step = 0; step < 90; step += 1) snapshot = physics.step(idle);
    for (let step = 0; step < 42; step += 1) snapshot = physics.step({ ...idle, aerialAction: true });
    snapshot = physics.step(idle);
    for (let step = 0; step < 180; step += 1) snapshot = physics.step({ ...idle, aerialAction: true });
    physics.dispose();
    return {
      position: snapshot.position,
      verticalSpeedMps: snapshot.verticalSpeedMps,
      hoverEnergy: snapshot.hoverEnergy,
      aerialPhase: snapshot.aerialPhase,
    };
  };
  assert.deepEqual(await run(), await run());
});

test("lifecycle cancellation clears preload without producing an ollie", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let snapshot = physics.snapshot();
  for (let step = 0; step < 90; step += 1) snapshot = physics.step(idle);
  for (let step = 0; step < 30; step += 1) snapshot = physics.step({ ...idle, aerialAction: true });
  assert.ok(snapshot.preload > 0);
  physics.cancelAerialAction();
  snapshot = physics.step(idle);
  physics.dispose();
  assert.equal(snapshot.preload, 0);
  assert.notEqual(snapshot.eventPulse, "ollie");
  assert.equal(snapshot.acceptedInput.aerialAction, false);
});

test("wall setup enters a resource-bound grind while preserving tangential momentum", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  physics.setScenario("wall-grind");
  const before = physics.snapshot();
  const grinding = physics.step({ ...idle, aerialAction: true });
  physics.dispose();
  assert.equal(grinding.eventPulse, "grind");
  assert.equal(grinding.grinding, true);
  assert.ok(grinding.hoverEnergy < before.hoverEnergy);
  assert.ok(grinding.horizontalSpeedMps > before.horizontalSpeedMps * 0.95);
  assert.ok(grinding.verticalSpeedMps >= -DEFAULT_RIDE_LAB_TUNING.grindFallSpeed - 0.1);
});

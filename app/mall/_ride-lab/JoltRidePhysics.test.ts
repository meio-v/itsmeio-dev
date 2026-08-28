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

test("the authored test ramp produces a grounded-airborne-grounded journey", async () => {
  const physics = await JoltRidePhysics.create({ ...DEFAULT_RIDE_LAB_TUNING });
  let sawTakeoff = false;
  let sawLandingAfterTakeoff = false;
  for (let step = 0; step < 220; step += 1) {
    const snapshot = physics.step({ ...idle, throttle: 1, steer: step < 80 ? -0.35 : 0 });
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

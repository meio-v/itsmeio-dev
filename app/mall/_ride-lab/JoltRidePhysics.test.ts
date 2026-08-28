import assert from "node:assert/strict";
import test from "node:test";

import { JoltRidePhysics, loadJolt } from "./JoltRidePhysics.ts";
import { DEFAULT_RIDE_LAB_TUNING } from "./rideLabTuning.ts";

const idle = { throttle: 0, brake: 0, steer: 0, reset: false };

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
    sawTakeoff ||= snapshot.eventPulse === "takeoff";
    sawLandingAfterTakeoff ||= sawTakeoff && snapshot.eventPulse === "landing";
  }
  physics.dispose();
  assert.equal(sawTakeoff, true);
  assert.equal(sawLandingAfterTakeoff, true);
});

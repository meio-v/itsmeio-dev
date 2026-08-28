import assert from "node:assert/strict";
import test from "node:test";

import RAPIER from "@dimforge/rapier3d-compat";

import { RidePhysics, dampingAlpha } from "./ridePhysics.ts";
import { BENCHMARK, RIDE_TUNING } from "./rideTuning.ts";
import { EMPTY_RIDE_INPUT, type RideInput } from "./rideTypes.ts";

await RAPIER.init();

function step(
  physics: RidePhysics,
  frames: number,
  input: Partial<RideInput>,
) {
  let snapshot = physics.snapshot();
  for (let frame = 0; frame < frames; frame += 1) {
    snapshot = physics.step({ ...EMPTY_RIDE_INPUT, ...input });
  }
  return snapshot;
}

test("the fixed-step benchmark is deterministic for identical input", () => {
  const first = new RidePhysics(BENCHMARK.start);
  const second = new RidePhysics(BENCHMARK.start);

  try {
    step(first, 90, { throttle: 1 });
    step(second, 90, { throttle: 1 });
    const firstTurn = step(first, 45, { throttle: 1, steer: 1 });
    const secondTurn = step(second, 45, { throttle: 1, steer: 1 });

    assert.deepEqual(firstTurn, secondTurn);
  } finally {
    first.dispose();
    second.dispose();
  }
});

test("the start straight has a measurable acceleration envelope", () => {
  const physics = new RidePhysics(BENCHMARK.start);
  try {
    const atTwoSeconds = step(physics, 120, { throttle: 1 });
    const distance = atTwoSeconds.position.x - BENCHMARK.start.x;

    assert.ok(
      atTwoSeconds.speedMps >= 6.7 && atTwoSeconds.speedMps <= 7.0,
      `expected 6.7–7.0 m/s, received ${atTwoSeconds.speedMps}`,
    );
    assert.ok(
      distance >= 6.9 && distance <= 7.4,
      `expected 6.9–7.4 m, received ${distance}`,
    );
    assert.ok(Math.abs(atTwoSeconds.position.z - BENCHMARK.start.z) < 0.01);
  } finally {
    physics.dispose();
  }
});

test("braking from the two-second benchmark stops before reversing", () => {
  const physics = new RidePhysics(BENCHMARK.start);
  try {
    const brakingStart = step(physics, 120, { throttle: 1 });
    let stopped = physics.snapshot();
    let stoppingFrames = 0;
    while (Math.abs(stopped.speedMps) >= 0.35 && stoppingFrames < 120) {
      stopped = physics.step({ ...EMPTY_RIDE_INPUT, brakeReverse: 1 });
      stoppingFrames += 1;
    }
    const stoppingDistance = Math.hypot(
      stopped.position.x - brakingStart.position.x,
      stopped.position.z - brakingStart.position.z,
    );

    assert.ok(stoppingFrames >= 35 && stoppingFrames <= 50);
    assert.ok(
      stoppingDistance <= 2.5,
      `expected ≤2.5 m stopping distance, received ${stoppingDistance}`,
    );
  } finally {
    physics.dispose();
  }
});

test("left and right steering remain symmetric through the judging turn", () => {
  const left = new RidePhysics(BENCHMARK.start);
  const right = new RidePhysics(BENCHMARK.start);
  try {
    step(left, 90, { throttle: 1 });
    step(right, 90, { throttle: 1 });
    const leftTurn = step(left, 45, { throttle: 1, steer: -1 });
    const rightTurn = step(right, 45, { throttle: 1, steer: 1 });
    const leftOffset = BENCHMARK.start.z - leftTurn.position.z;
    const rightOffset = rightTurn.position.z - BENCHMARK.start.z;

    assert.ok(leftOffset >= 2.5 && leftOffset <= 2.8);
    assert.ok(rightOffset >= 2.5 && rightOffset <= 2.8);
    assert.ok(Math.abs(leftOffset - rightOffset) < 0.001);
    assert.ok(Math.abs(leftTurn.rotation.y + rightTurn.rotation.y) < 0.001);
  } finally {
    left.dispose();
    right.dispose();
  }
});

test("camera damping is stable across equivalent time partitions", () => {
  const sixtyHertz = 1 - dampingAlpha(
    RIDE_TUNING.cameraPositionSharpness,
    1 / 60,
  );
  const thirtyHertz = 1 - dampingAlpha(
    RIDE_TUNING.cameraPositionSharpness,
    1 / 30,
  );

  assert.ok(Math.abs(sixtyHertz ** 60 - thirtyHertz ** 30) < 1e-12);
});

test("ride physics teardown is idempotent and rejects later stepping", () => {
  const physics = new RidePhysics(BENCHMARK.start);
  physics.dispose();
  assert.doesNotThrow(() => physics.dispose());
  assert.throws(
    () => physics.step(EMPTY_RIDE_INPUT),
    /Cannot step disposed ride physics/,
  );
});

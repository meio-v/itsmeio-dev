import assert from "node:assert/strict";
import test from "node:test";

import type { RideLabSnapshot } from "./rideLabTypes.ts";
import { advanceRiderBodySteer, createFallbackVehicleVisual, RIDE_LAB_VEHICLE_ALIGNMENT, resolveRideLabVehiclePose, resolveScooterMaterialRole, shouldOutlineScooterMesh } from "./rideLabVehicleVisual.ts";

test("curated scooter alignment matches the Jolt wheelbase and bounded visual steering", () => {
  assert.ok(Math.abs(RIDE_LAB_VEHICLE_ALIGNMENT.scooterScale * 2.6811 - 1.56) < 1e-12);
  assert.ok(RIDE_LAB_VEHICLE_ALIGNMENT.maxVisualSteerRadians < 0.25);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.riderScale, 0.48);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset.y, 0.225);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset.y, 0.225);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset.x, 0.315);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset.x, -0.315);
  assert.deepEqual(RIDE_LAB_VEHICLE_ALIGNMENT.seatAnchor, { x: 0, y: 0.43, z: -0.24 });
});

test("procedural fallback preserves the physics-forward vehicle orientation", () => {
  const fallback = createFallbackVehicleVisual();
  assert.equal(fallback.root.rotation.y, -Math.PI / 2);
  fallback.update({
    horizontalSpeedMps: 10,
    preload: 0,
    intent: { throttle: 1, brake: 0, steer: 1 },
  } as RideLabSnapshot, 0.1);
  assert.notEqual(fallback.frontWheel.rotation.y, 0);
  assert.equal(fallback.frontWheel.rotation.x, 0);
  assert.equal(fallback.frontWheel.children[0]?.rotation.x, Math.PI / 2);
  assert.notEqual(fallback.frontWheel.children[0]?.rotation.y, 0);
  assert.equal(fallback.rearWheel.children[0]?.rotation.x, Math.PI / 2);
  assert.notEqual(fallback.rearWheel.children[0]?.rotation.y, 0);
  fallback.dispose();
});

test("rider weight shift and elbows respond symmetrically to mirrored steering", () => {
  const left = resolveRideLabVehiclePose(-1, 0);
  const neutral = resolveRideLabVehiclePose(0, 0);
  const right = resolveRideLabVehiclePose(1, 0);

  assert.equal(left.frontSteerRadians, -right.frontSteerRadians);
  assert.equal(left.riderLeanRadians, -right.riderLeanRadians);
  assert.equal(Math.abs(right.riderLeanRadians), 0.14);
  assert.equal(neutral.elbowFlareRadians, 0);
  assert.equal(left.elbowFlareRadians, 0.5);
  assert.equal(right.elbowFlareRadians, 0.5);
  assert.ok(right.leftElbowFlareRadians > right.rightElbowFlareRadians);
  assert.ok(left.rightElbowFlareRadians > left.leftElbowFlareRadians);
  assert.equal(left.shoulderYawRadians, -right.shoulderYawRadians);
  assert.equal(left.headCounterLeanRadians, -right.headCounterLeanRadians);
  const halfTurn = resolveRideLabVehiclePose(0.5, 0);
  assert.ok(Math.abs(halfTurn.riderLeanRadians) < Math.abs(right.riderLeanRadians) * 0.5);
  assert.equal(halfTurn.shoulderYawRadians, right.shoulderYawRadians * 0.5);
  assert.ok(right.leftElbowRadians > neutral.leftElbowRadians);
  assert.ok(right.rightElbowRadians < neutral.rightElbowRadians);
  assert.equal(left.leftElbowRadians, right.rightElbowRadians);
  assert.equal(left.rightElbowRadians, right.leftElbowRadians);
});

test("rider body steer builds and recovers more slowly than immediate arm steering", () => {
  const firstFrame = advanceRiderBodySteer(0, 1, 1 / 60);
  const halfSecond = Array.from({ length: 29 }).reduce(
    (current: number) => advanceRiderBodySteer(current, 1, 1 / 60),
    firstFrame,
  );
  const recovering = advanceRiderBodySteer(halfSecond, 0, 0.25);

  assert.ok(firstFrame > 0 && firstFrame < 0.04);
  assert.ok(halfSecond > 0.5 && halfSecond < 0.7);
  assert.ok(recovering > 0 && recovering < halfSecond);
  const immediateArms = resolveRideLabVehiclePose(1, 0, 0, firstFrame);
  assert.equal(immediateArms.elbowFlareRadians, 0.5);
  assert.ok(Math.abs(immediateArms.riderLeanRadians) < 0.001);
});

test("scooter palette normalizes exported and runtime mesh names", () => {
  assert.equal(resolveScooterMaterialRole("lowpolybase.004 master scooterred"), "cream");
  assert.equal(resolveScooterMaterialRole("lowpolybase004"), "cream");
  assert.equal(resolveScooterMaterialRole("lowpolybase.005"), "seat");
  assert.equal(resolveScooterMaterialRole("lowpolybase005"), "seat");
  assert.equal(resolveScooterMaterialRole("derrierelowpoly.002"), "chrome");
  assert.equal(resolveScooterMaterialRole("derrierelowpoly002"), "chrome");
  assert.equal(resolveScooterMaterialRole("Plane.002"), "red");
  assert.equal(resolveScooterMaterialRole("Plane002"), "red");
  assert.equal(resolveScooterMaterialRole("guidonlowpoly.004 guide"), "cyan");
  assert.equal(resolveScooterMaterialRole("devantlowpoly.002"), "cream");
  assert.equal(resolveScooterMaterialRole("wheellowpoly.005 wheell back"), "tire");
  assert.equal(resolveScooterMaterialRole("echaplowpoly002"), "chrome");
  assert.equal(resolveScooterMaterialRole("moteurlowpoly.002 lowpolybase.004"), "mechanical");
  assert.equal(resolveScooterMaterialRole("ventilolowpoly002"), "mechanical");
  assert.equal(resolveScooterMaterialRole("petitelumiereorange.002"), "orange");
  assert.equal(resolveScooterMaterialRole("petitelumiererouge.002"), "red");
  assert.equal(shouldOutlineScooterMesh("lowpolybase005"), true);
  assert.equal(shouldOutlineScooterMesh("wheellowpoly.005"), true);
  assert.equal(shouldOutlineScooterMesh("moteurlowpoly002"), true);
  assert.equal(shouldOutlineScooterMesh("echaplowpoly002"), true);
  assert.equal(shouldOutlineScooterMesh("trucderrirerelowpoly002"), true);
  assert.equal(shouldOutlineScooterMesh("petitelumiererouge002"), false);
});

test("throttle tucks the head as bounded physical-state feedback", () => {
  const idle = resolveRideLabVehiclePose(0, 0, 0);
  const accelerating = resolveRideLabVehiclePose(0, 0, 1);

  assert.equal(idle.headTuckRadians, 0);
  assert.equal(accelerating.headTuckRadians, 0.26);
  assert.equal(resolveRideLabVehiclePose(0, 0, 5).headTuckRadians, accelerating.headTuckRadians);
});

test("preload visibly compresses both elbows without changing steering", () => {
  const free = resolveRideLabVehiclePose(0.6, 0);
  const loaded = resolveRideLabVehiclePose(0.6, 1);

  assert.equal(loaded.frontSteerRadians, free.frontSteerRadians);
  assert.equal(loaded.riderLeanRadians, free.riderLeanRadians);
  assert.ok(loaded.leftElbowRadians > free.leftElbowRadians);
  assert.ok(loaded.rightElbowRadians > free.rightElbowRadians);
});

test("out-of-range presentation inputs are clamped", () => {
  assert.deepEqual(resolveRideLabVehiclePose(5, 2), resolveRideLabVehiclePose(1, 1));
  assert.deepEqual(resolveRideLabVehiclePose(-5, -2), resolveRideLabVehiclePose(-1, 0));
});

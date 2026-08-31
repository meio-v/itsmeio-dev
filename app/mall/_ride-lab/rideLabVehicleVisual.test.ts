import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import type { RideLabSnapshot } from "./rideLabTypes.ts";
import { advanceRiderBodySteer, createFallbackVehicleVisual, RIDE_LAB_VEHICLE_ALIGNMENT, resolveRideLabVehiclePose, resolveRiderMaterialRole, resolveScooterIsolatedPartRole, resolveScooterMaterialRole, resolveSharedSteerCarrierPosition, SCOOTER_BOOSTER_BUDGET, SCOOTER_ISOLATED_MESHES, SCOOTER_ROUNDED_SEAT_BUDGET, SCOOTER_SURFACE_DETAIL_BUDGET, shouldOutlineScooterMesh } from "./rideLabVehicleVisual.ts";

test("curated scooter alignment matches the Jolt wheelbase and bounded visual steering", () => {
  assert.ok(Math.abs(RIDE_LAB_VEHICLE_ALIGNMENT.scooterScale * 2.6811 - 1.56) < 1e-12);
  assert.ok(RIDE_LAB_VEHICLE_ALIGNMENT.maxVisualSteerRadians < 0.25);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.riderScale, 0.52);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset.y, 0.225);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset.y, 0.225);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset.x, 0.315);
  assert.equal(RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset.x, -0.315);
  assert.deepEqual(RIDE_LAB_VEHICLE_ALIGNMENT.seatAnchor, { x: 0, y: 0.34, z: -0.31 });
  assert.deepEqual(RIDE_LAB_VEHICLE_ALIGNMENT.pelvisAnchor, { x: 0, y: 0.43, z: -0.31 });
  assert.deepEqual(RIDE_LAB_VEHICLE_ALIGNMENT.leftFootAnchor, { x: 0.22, y: 0, z: 0.02 });
  assert.deepEqual(RIDE_LAB_VEHICLE_ALIGNMENT.rightFootAnchor, { x: -0.22, y: 0, z: 0.02 });
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

test("front wheel carrier orbits the fork pivot as one rigid steering assembly", () => {
  const neutral = new THREE.Vector3(0, -0.33, 0.78);
  const pivot = new THREE.Vector3(0, 0.053, 0.663);
  const neutralRadius = neutral.distanceTo(pivot);

  for (const radians of [-0.22, 0, 0.22]) {
    const actual = resolveSharedSteerCarrierPosition(
      new THREE.Vector3(),
      neutral,
      pivot,
      radians,
    );
    const expected = neutral.clone().sub(pivot)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), radians)
      .add(pivot);

    assert.ok(actual.distanceTo(expected) < 1e-12);
    assert.ok(Math.abs(actual.distanceTo(pivot) - neutralRadius) < 1e-12);
    assert.equal(actual.y, neutral.y);
  }
});

test("Blender-authored steering package keeps exact runtime material roles", () => {
  const productionRoles = [
    ["SM_Scooter_SteeringNeck_LowerAdapter", "cream"],
    ["SM_Scooter_SteeringNeck_RootGasket", "ink"],
    ["SM_Scooter_SteeringNeck_FixedBearingHousing", "cream"],
    ["SM_Scooter_SteeringNeck_RotatingStem", "ink"],
    ["SM_Scooter_SteeringNeck_RotatingCollar", "ink"],
    ["SM_Scooter_SteeringNeck_UpperMount", "cream"],
    ["SM_Scooter_BrakeLever_R", "ink"],
    ["SM_Scooter_Handlebar_AccentRing_L", "cyan"],
    ["SM_Scooter_Handlebar_AccentRing_R", "cyan"],
    ["SM_Scooter_Handlebar_Bar_L", "mechanical"],
    ["SM_Scooter_Handlebar_Bar_R", "mechanical"],
    ["SM_Scooter_Handlebar_ControlPodSleeve_L", "ink"],
    ["SM_Scooter_Handlebar_ControlPodSleeve_R", "ink"],
    ["SM_Scooter_Handlebar_Grip_L", "ink"],
    ["SM_Scooter_Handlebar_Grip_R", "ink"],
    ["SM_Scooter_Handlebar_Sleeve_L", "ink"],
    ["SM_Scooter_Handlebar_Sleeve_R", "ink"],
    ["SM_Scooter_Headlamp_Bezel", "ink"],
    ["SM_Scooter_Headlamp_Cross", "chrome"],
    ["SM_Scooter_Headlamp_Lens", "headlight"],
    ["SM_Scooter_Headlamp_Reflector", "chrome"],
    ["SM_Scooter_SteeringNacelle_Pod_L", "cream"],
    ["SM_Scooter_SteeringNacelle_Pod_R", "cream"],
    ["SM_Scooter_SteeringNacelle_RearFastener_L_Hi", "chrome"],
    ["SM_Scooter_SteeringNacelle_RearFastener_L_Lo", "chrome"],
    ["SM_Scooter_SteeringNacelle_RearFastener_R_Hi", "chrome"],
    ["SM_Scooter_SteeringNacelle_RearFastener_R_Lo", "chrome"],
    ["SM_Scooter_SteeringNacelle_RearServiceCavity", "mechanical"],
    ["SM_Scooter_SteeringNacelle_RearServiceCover", "cream"],
    ["SM_Scooter_SteeringNacelle_RearServiceFrame", "ink"],
    ["SM_Scooter_SteeringNacelle_RearServiceRib", "ink"],
    ["SM_Scooter_SteeringNacelle_Shell", "cream"],
    ["SM_Scooter_SteeringNacelle_Throat", "cream"],
  ] as const;

  for (const [name, role] of productionRoles) {
    assert.equal(resolveScooterMaterialRole(name), role, name);
  }
});

test("curated wheel islands isolate tire, rim, axle, and hub by exact mesh name", () => {
  const tire = { vertexCount: 45, localYCenter: 0, localYSpan: 0.275, maximumLocalXZRadius: 0.4352 };
  const rim = { vertexCount: 6, localYCenter: 0.0015, localYSpan: 0.067, maximumLocalXZRadius: 0.3001 };
  const axle = { vertexCount: 57, localYCenter: 0.0874, localYSpan: 0.0364, maximumLocalXZRadius: 0.1157 };
  const hub = { vertexCount: 112, localYCenter: 0, localYSpan: 0.1888, maximumLocalXZRadius: 0.1157 };
  const unknownFastener = { vertexCount: 8, localYCenter: 0.08, localYSpan: 0.02, maximumLocalXZRadius: 0.30 };

  assert.deepEqual(SCOOTER_ISOLATED_MESHES.wheels, ["wheellowpoly.004", "wheellowpoly.005"]);
  for (const wheel of SCOOTER_ISOLATED_MESHES.wheels) {
    assert.equal(resolveScooterIsolatedPartRole(wheel, tire), "tire");
    assert.equal(resolveScooterIsolatedPartRole(wheel, rim), "rim");
    assert.equal(resolveScooterIsolatedPartRole(wheel, axle), "axle");
    assert.equal(resolveScooterIsolatedPartRole(wheel, { ...axle, localYCenter: -axle.localYCenter }), "axle");
    assert.equal(resolveScooterIsolatedPartRole(wheel, hub), "hub");
    assert.equal(resolveScooterIsolatedPartRole(wheel, unknownFastener), null);
  }

  assert.equal(resolveScooterIsolatedPartRole("wheelfront.001", rim), null);
  assert.equal(resolveScooterIsolatedPartRole("Cylinder.003", axle), null);
  assert.equal(resolveScooterIsolatedPartRole("freinlowpoly.004", axle), null);
  assert.equal(resolveScooterIsolatedPartRole("moteurlowpoly.002", rim), null);
});

test("curated headlight lens and housing stay separate from the cream cowling", () => {
  const headlight = { vertexCount: 120, localYCenter: 0.3523, localYSpan: 0.2291, maximumLocalXZRadius: 0.1306 };

  assert.equal(SCOOTER_ISOLATED_MESHES.headlight, "devantlowpoly.002");
  assert.equal(resolveScooterIsolatedPartRole("devantlowpoly.002", headlight, -0.9), "headlight-lens");
  assert.equal(resolveScooterIsolatedPartRole("devantlowpoly002", headlight, -0.35), "headlight-housing");
  assert.equal(resolveScooterIsolatedPartRole("devantlowpoly.002", { ...headlight, vertexCount: 167 }, -0.9), null);
  assert.equal(resolveScooterMaterialRole("devantlowpoly.002"), "cream");
  assert.equal(resolveScooterMaterialRole("petitelumiereorange.002"), "orange");
  assert.equal(resolveScooterMaterialRole("petitelumiererouge.002"), "red");
});

test("project-authored scooter surface detail stays inside its render envelope", () => {
  assert.deepEqual(SCOOTER_SURFACE_DETAIL_BUDGET, {
    drawCalls: 0,
    maximumTriangles: 1_000,
    textures: 0,
  });
});

test("sci-fi punk booster stays inside its merged runtime envelope", () => {
  assert.deepEqual(SCOOTER_BOOSTER_BUDGET, {
    drawCalls: 3,
    maximumTriangles: 4_000,
    textures: 1,
  });
});

test("rounded two-piece seat stays inside its merged runtime envelope", () => {
  assert.deepEqual(SCOOTER_ROUNDED_SEAT_BUDGET, {
    drawCalls: 2,
    maximumTriangles: 1_500,
    textures: 0,
  });
});

test("streetwear rider material roles stay semantic and modular", () => {
  assert.equal(resolveRiderMaterialRole("streetwear-body"), "skin");
  assert.equal(resolveRiderMaterialRole("streetwear-hair"), "hair");
  assert.equal(resolveRiderMaterialRole("streetwear-eye-left"), "eye");
  assert.equal(resolveRiderMaterialRole("streetwear-oversized-hoodie"), "hoodie");
  assert.equal(resolveRiderMaterialRole("streetwear-long-undershirt"), "undershirt");
  assert.equal(resolveRiderMaterialRole("streetwear-cargo-shorts"), "shorts");
  assert.equal(resolveRiderMaterialRole("streetwear-left-calf"), "calf");
  assert.equal(resolveRiderMaterialRole("streetwear-giant-shoe-left"), "shoe");
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

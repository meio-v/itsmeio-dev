import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

import { createMallColliders } from "./mallPhysics.ts";
import { RIDE_TUNING } from "./rideTuning.ts";
import type { RideInput } from "./rideTypes.ts";

export type RideAnchor = {
  x: number;
  y: number;
  z: number;
  yaw: number;
};

export type RidePhysicsSnapshot = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  speedMps: number;
  steer: number;
};

export function dampingAlpha(sharpness: number, delta: number) {
  return 1 - Math.exp(-sharpness * delta);
}

function damp(current: number, target: number, sharpness: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, dampingAlpha(sharpness, delta));
}

/**
 * Renderer-independent ride dynamics. Keeping the fixed-step world here lets
 * the browser runtime and deterministic Node benchmarks exercise identical
 * forces, suspension, collision geometry, and reset behavior.
 */
export class RidePhysics {
  readonly world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  readonly chassis: RAPIER.RigidBody;
  readonly chassisCollider: RAPIER.Collider;
  readonly vehicle: RAPIER.DynamicRayCastVehicleController;
  private steer = 0;
  private disposed = false;

  constructor(start: RideAnchor) {
    this.world.timestep = RIDE_TUNING.fixedStep;
    createMallColliders(this.world, RAPIER);

    this.chassis = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(start.x, start.y, start.z)
        .setRotation({
          x: 0,
          y: Math.sin(start.yaw / 2),
          z: 0,
          w: Math.cos(start.yaw / 2),
        })
        .setLinearDamping(0.18)
        .setAngularDamping(3.5)
        .setCanSleep(false),
    );
    this.chassis.setEnabledRotations(false, true, false, true);
    this.chassis.setAdditionalMass(82, true);
    this.chassis.enableCcd(true);
    this.chassisCollider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.76, 0.18, 0.28)
        .setTranslation(0, 0.02, 0)
        .setFriction(0.9)
        .setRestitution(0.03),
      this.chassis,
    );

    this.vehicle = this.world.createVehicleController(this.chassis);
    this.vehicle.indexUpAxis = 1;
    this.vehicle.setIndexForwardAxis = 0;
    this.addWheel({ x: 0.69, y: -0.05, z: 0.14 });
    this.addWheel({ x: 0.69, y: -0.05, z: -0.14 });
    this.addWheel({ x: -0.66, y: -0.05, z: 0.14 });
    this.addWheel({ x: -0.66, y: -0.05, z: -0.14 });
  }

  step(input: RideInput): RidePhysicsSnapshot {
    if (this.disposed) throw new Error("Cannot step disposed ride physics.");

    const speed = this.vehicle.currentVehicleSpeed();
    const speedRatio = THREE.MathUtils.clamp(
      Math.abs(speed) / RIDE_TUNING.topSpeedMps,
      0,
      1,
    );
    const response =
      input.steer === 0
        ? RIDE_TUNING.steerReturn
        : RIDE_TUNING.steerResponse;
    this.steer = damp(
      this.steer,
      input.steer,
      response,
      RIDE_TUNING.fixedStep,
    );
    const steeringLimit = THREE.MathUtils.lerp(
      RIDE_TUNING.lowSpeedSteer,
      RIDE_TUNING.highSpeedSteer,
      speedRatio,
    );

    let engineForce: number = 0;
    let brakeForce: number = RIDE_TUNING.coastBrake;
    if (input.throttle > 0 && speed < RIDE_TUNING.topSpeedMps) {
      engineForce =
        input.throttle *
        RIDE_TUNING.engineForce *
        (1 - speedRatio * 0.58);
      brakeForce = 0;
    } else if (input.brakeReverse > 0) {
      if (speed > 0.35) {
        brakeForce = input.brakeReverse * RIDE_TUNING.brakeForce;
      } else if (speed > -RIDE_TUNING.reverseSpeedMps) {
        engineForce = -input.brakeReverse * RIDE_TUNING.reverseForce;
        brakeForce = 0;
      }
    }

    for (const wheel of [0, 1]) {
      this.vehicle.setWheelSteering(
        wheel,
        -this.steer * steeringLimit,
      );
      this.vehicle.setWheelEngineForce(wheel, engineForce * 0.09);
      this.vehicle.setWheelBrake(wheel, brakeForce * 0.3);
    }
    for (const wheel of [2, 3]) {
      this.vehicle.setWheelEngineForce(wheel, engineForce * 0.5);
      this.vehicle.setWheelBrake(wheel, brakeForce * 0.5);
    }

    this.vehicle.updateVehicle(
      RIDE_TUNING.fixedStep,
      undefined,
      undefined,
      (collider) => collider.handle !== this.chassisCollider.handle,
    );
    this.world.step();
    return this.snapshot();
  }

  snapshot(): RidePhysicsSnapshot {
    const position = this.chassis.translation();
    const rotation = this.chassis.rotation();
    return {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      },
      speedMps: this.vehicle.currentVehicleSpeed(),
      steer: this.steer,
    };
  }

  reset(anchor: RideAnchor) {
    if (this.disposed) return;
    this.chassis.setTranslation(anchor, true);
    this.chassis.setRotation(
      {
        x: 0,
        y: Math.sin(anchor.yaw / 2),
        z: 0,
        w: Math.cos(anchor.yaw / 2),
      },
      true,
    );
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.steer = 0;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.vehicle.free();
    this.world.free();
  }

  private addWheel(connection: { x: number; y: number; z: number }) {
    const index = this.vehicle.numWheels();
    this.vehicle.addWheel(
      connection,
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      RIDE_TUNING.suspensionRestLength,
      RIDE_TUNING.wheelRadius,
    );
    this.vehicle.setWheelMaxSuspensionTravel(
      index,
      RIDE_TUNING.suspensionTravel,
    );
    this.vehicle.setWheelSuspensionStiffness(
      index,
      RIDE_TUNING.suspensionStiffness,
    );
    this.vehicle.setWheelSuspensionCompression(
      index,
      RIDE_TUNING.suspensionCompression,
    );
    this.vehicle.setWheelSuspensionRelaxation(
      index,
      RIDE_TUNING.suspensionRelaxation,
    );
    this.vehicle.setWheelMaxSuspensionForce(
      index,
      RIDE_TUNING.suspensionForce,
    );
    this.vehicle.setWheelFrictionSlip(index, RIDE_TUNING.frictionSlip);
    this.vehicle.setWheelSideFrictionStiffness(
      index,
      RIDE_TUNING.sideFriction,
    );
  }
}

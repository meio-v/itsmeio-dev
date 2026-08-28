import initJolt from "jolt-physics/wasm-compat";

import { advanceRideIntent, longitudinalSpeed } from "./rideLabModel.ts";
import type { RideLabInput, RideLabSnapshot, ResolvedRideIntent } from "./rideLabTypes.ts";
import type { RideLabTuning } from "./rideLabTuning.ts";

type JoltModule = Awaited<ReturnType<typeof initJolt>>;

const NON_MOVING = 0;
const MOVING = 1;
const ZERO_INTENT: ResolvedRideIntent = { throttle: 0, brake: 0, steer: 0 };

let joltModulePromise: Promise<JoltModule> | null = null;
let interfaceLease: Promise<void> = Promise.resolve();

async function acquireInterfaceLease() {
  const previousLease = interfaceLease;
  let releaseLease = () => {};
  interfaceLease = new Promise<void>((resolve) => { releaseLease = resolve; });
  await previousLease;
  return releaseLease;
}

export function loadJolt() {
  joltModulePromise ??= initJolt();
  return joltModulePromise;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export class JoltRidePhysics {
  readonly engineName = "Jolt MotorcycleController";
  private readonly Jolt: JoltModule;
  private readonly jolt: InstanceType<JoltModule["JoltInterface"]>;
  private readonly physicsSystem: InstanceType<JoltModule["PhysicsSystem"]>;
  private readonly bodyInterface: InstanceType<JoltModule["BodyInterface"]>;
  private readonly motorcycleBody: InstanceType<JoltModule["Body"]>;
  private readonly constraint: InstanceType<JoltModule["VehicleConstraint"]>;
  private readonly controller: InstanceType<JoltModule["MotorcycleController"]>;
  private readonly stepListener: InstanceType<JoltModule["VehicleConstraintStepListener"]>;
  private readonly initialConstraintState: InstanceType<JoltModule["StateRecorderImpl"]>;
  private readonly positionOut: InstanceType<JoltModule["RVec3"]>;
  private readonly rotationOut: InstanceType<JoltModule["Quat"]>;
  private readonly linearVelocityOut: InstanceType<JoltModule["Vec3"]>;
  private readonly angularVelocityOut: InstanceType<JoltModule["Vec3"]>;
  private readonly releaseInterfaceLease: () => void;
  private readonly staticBodyIds: Array<InstanceType<JoltModule["BodyID"]>> = [];
  private tuning: RideLabTuning;
  private intent = ZERO_INTENT;
  private previousSpeed = 0;
  private wasGrounded = false;
  private lastInput: RideLabInput = { throttle: 0, brake: 0, steer: 0, reset: false };
  private disposed = false;

  private constructor(Jolt: JoltModule, tuning: RideLabTuning, releaseInterfaceLease: () => void) {
    this.Jolt = Jolt;
    this.tuning = tuning;
    this.releaseInterfaceLease = releaseInterfaceLease;

    const objectFilter = new Jolt.ObjectLayerPairFilterTable(2);
    objectFilter.EnableCollision(NON_MOVING, MOVING);
    objectFilter.EnableCollision(MOVING, MOVING);
    const nonMovingBroadPhase = new Jolt.BroadPhaseLayer(0);
    const movingBroadPhase = new Jolt.BroadPhaseLayer(1);
    const broadPhase = new Jolt.BroadPhaseLayerInterfaceTable(2, 2);
    broadPhase.MapObjectToBroadPhaseLayer(NON_MOVING, nonMovingBroadPhase);
    broadPhase.MapObjectToBroadPhaseLayer(MOVING, movingBroadPhase);
    Jolt.destroy(nonMovingBroadPhase);
    Jolt.destroy(movingBroadPhase);
    const broadPhaseFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(broadPhase, 2, objectFilter, 2);
    const settings = new Jolt.JoltSettings();
    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = broadPhase;
    settings.mObjectVsBroadPhaseLayerFilter = broadPhaseFilter;
    settings.mMaxBodies = 256;
    settings.mMaxBodyPairs = 1024;
    settings.mMaxContactConstraints = 1024;
    this.jolt = new Jolt.JoltInterface(settings);
    Jolt.destroy(settings);

    this.physicsSystem = this.jolt.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();
    const gravity = new Jolt.Vec3(0, -9.81, 0);
    this.physicsSystem.SetGravity(gravity);
    Jolt.destroy(gravity);

    this.createArena();
    this.motorcycleBody = this.createMotorcycleBody();
    this.positionOut = new Jolt.RVec3();
    this.rotationOut = new Jolt.Quat();
    this.linearVelocityOut = new Jolt.Vec3();
    this.angularVelocityOut = new Jolt.Vec3();

    const vehicle = new Jolt.VehicleConstraintSettings();
    vehicle.mMaxPitchRollAngle = tuning.maxLeanRadians;
    vehicle.mWheels.clear();
    vehicle.mWheels.push_back(this.createWheel(true));
    vehicle.mWheels.push_back(this.createWheel(false));

    const controllerSettings = new Jolt.MotorcycleControllerSettings();
    controllerSettings.mMaxLeanAngle = tuning.maxLeanRadians;
    controllerSettings.mLeanSpringConstant = tuning.leanSpring * (0.25 + tuning.rideAssist * 0.75);
    controllerSettings.mLeanSpringDamping = tuning.leanDamping * (0.25 + tuning.rideAssist * 0.75);
    controllerSettings.mLeanSmoothingFactor = 0.75 + tuning.rideAssist * 0.2;
    controllerSettings.mEngine.mMaxTorque = tuning.engineTorque;
    controllerSettings.mEngine.mInertia = tuning.engineInertia;
    controllerSettings.mEngine.mMinRPM = 900;
    controllerSettings.mEngine.mMaxRPM = 9000;
    controllerSettings.mTransmission.mShiftDownRPM = 1800;
    controllerSettings.mTransmission.mShiftUpRPM = 7200;
    controllerSettings.mTransmission.mClutchStrength = 2.2;
    controllerSettings.mDifferentials.clear();
    const differential = new Jolt.VehicleDifferentialSettings();
    differential.mLeftWheel = -1;
    differential.mRightWheel = 1;
    differential.mDifferentialRatio = 1.93 * 40 / 16;
    controllerSettings.mDifferentials.push_back(differential);
    Jolt.destroy(differential);
    vehicle.mController = controllerSettings;

    this.constraint = new Jolt.VehicleConstraint(this.motorcycleBody, vehicle);
    const tester = new Jolt.VehicleCollisionTesterCastCylinder(MOVING, 1);
    this.constraint.SetVehicleCollisionTester(tester);
    this.physicsSystem.AddConstraint(this.constraint);
    this.controller = Jolt.castObject(this.constraint.GetController(), Jolt.MotorcycleController);
    this.controller.EnableLeanController(true);
    this.initialConstraintState = new Jolt.StateRecorderImpl();
    this.constraint.SaveState(this.initialConstraintState);
    this.stepListener = new Jolt.VehicleConstraintStepListener(this.constraint);
    this.physicsSystem.AddStepListener(this.stepListener);
    Jolt.destroy(vehicle);
  }

  static async create(tuning: RideLabTuning) {
    const Jolt = await loadJolt();
    const releaseInterfaceLease = await acquireInterfaceLease();
    try {
      return new JoltRidePhysics(Jolt, tuning, releaseInterfaceLease);
    } catch (error) {
      releaseInterfaceLease();
      throw error;
    }
  }

  step(input: RideLabInput): RideLabSnapshot {
    if (this.disposed) throw new Error("Cannot step disposed Jolt ride physics.");
    this.lastInput = { ...input };
    if (input.reset) this.reset();
    this.intent = advanceRideIntent(this.intent, input, this.tuning, this.tuning.fixedStep);
    const topSpeedFactor = clamp(1 - Math.max(0, this.previousSpeed - this.tuning.topSpeedMps) / 2, 0, 1);
    this.controller.SetDriverInput(
      this.intent.throttle * topSpeedFactor,
      this.intent.steer,
      this.intent.brake,
      this.intent.brake > 0.84 ? (this.intent.brake - 0.84) / 0.16 : 0,
    );
    if (this.intent.throttle || this.intent.brake || this.intent.steer) {
      this.bodyInterface.ActivateBody(this.motorcycleBody.GetID());
    }
    this.jolt.Step(this.tuning.fixedStep, 1);
    return this.snapshot();
  }

  snapshot(): RideLabSnapshot {
    const bodyId = this.motorcycleBody.GetID();
    this.bodyInterface.GetPositionAndRotation(bodyId, this.positionOut, this.rotationOut);
    this.bodyInterface.GetLinearAndAngularVelocity(bodyId, this.linearVelocityOut, this.angularVelocityOut);
    const position = this.positionOut;
    const rotation = this.rotationOut;
    const velocity = this.linearVelocityOut;
    const rotationX = rotation.GetX();
    const rotationY = rotation.GetY();
    const rotationZ = rotation.GetZ();
    const rotationW = rotation.GetW();
    const speedMps = longitudinalSpeed(
      { x: velocity.GetX(), y: velocity.GetY(), z: velocity.GetZ() },
      { x: rotationX, y: rotationY, z: rotationZ, w: rotationW },
    );
    const accelerationMps2 = (speedMps - this.previousSpeed) / this.tuning.fixedStep;
    this.previousSpeed = speedMps;
    const frontWheel = this.constraint.GetWheel(0);
    const rearWheelBase = this.constraint.GetWheel(1);
    const frontLoad = frontWheel.GetSuspensionLambda();
    const rearLoad = rearWheelBase.GetSuspensionLambda();
    const rearWheel = this.Jolt.castObject(rearWheelBase, this.Jolt.WheelWV);
    const x = rotationX;
    const y = rotationY;
    const z = rotationZ;
    const w = rotationW;
    const leanRadians = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
    const grounded = frontWheel.HasContact() || rearWheelBase.HasContact();
    const eventPulse = this.lastInput.reset ? "reset"
      : this.wasGrounded && !grounded ? "takeoff"
        : !this.wasGrounded && grounded ? "landing"
          : this.lastInput.brake > 0 ? "brake"
            : this.lastInput.throttle > 0 ? "throttle"
              : Math.abs(this.lastInput.steer) > 0 ? "steer"
                : "idle";
    this.wasGrounded = grounded;
    return {
      position: { x: position.GetX(), y: position.GetY(), z: position.GetZ() },
      rotation: { x, y, z, w },
      speedMps,
      accelerationMps2,
      verticalSpeedMps: velocity.GetY(),
      leanRadians,
      grounded,
      wheelContacts: Number(frontWheel.HasContact()) + Number(rearWheelBase.HasContact()),
      frontSuspensionLoad: frontLoad,
      rearSuspensionLoad: rearLoad,
      rearSlip: Math.abs(rearWheel.mLongitudinalSlip),
      acceptedInput: { ...this.lastInput },
      eventPulse,
      intent: { ...this.intent },
    };
  }

  reset() {
    if (this.disposed) return;
    const position = new this.Jolt.RVec3(0, 1.1, 0);
    const rotation = new this.Jolt.Quat(0, 0, 0, 1);
    const zero = new this.Jolt.Vec3(0, 0, 0);
    this.bodyInterface.SetPositionRotationAndVelocity(this.motorcycleBody.GetID(), position, rotation, zero, zero);
    this.initialConstraintState.Rewind();
    this.constraint.RestoreState(this.initialConstraintState);
    this.Jolt.destroy(position);
    this.Jolt.destroy(rotation);
    this.Jolt.destroy(zero);
    this.intent = ZERO_INTENT;
    this.previousSpeed = 0;
    this.wasGrounded = false;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.physicsSystem.RemoveStepListener(this.stepListener);
    this.physicsSystem.RemoveConstraint(this.constraint);
    this.Jolt.destroy(this.stepListener);
    const motorcycleId = this.motorcycleBody.GetID();
    this.bodyInterface.RemoveBody(motorcycleId);
    this.bodyInterface.DestroyBody(motorcycleId);
    for (const bodyId of this.staticBodyIds) {
      this.bodyInterface.RemoveBody(bodyId);
      this.bodyInterface.DestroyBody(bodyId);
    }
    this.Jolt.destroy(this.angularVelocityOut);
    this.Jolt.destroy(this.linearVelocityOut);
    this.Jolt.destroy(this.rotationOut);
    this.Jolt.destroy(this.positionOut);
    this.Jolt.destroy(this.initialConstraintState);
    this.Jolt.destroy(this.jolt);
    this.releaseInterfaceLease();
  }

  private createArena() {
    this.createStaticBox(0, -0.5, 0, 24, 0.5, 24, 0);
    this.createStaticBox(0, 2.4, 24, 24, 3, 0.35, 0);
    this.createStaticBox(0, 2.4, -24, 24, 3, 0.35, 0);
    this.createStaticBox(24, 2.4, 0, 0.35, 3, 24, 0);
    this.createStaticBox(-24, 2.4, 0, 0.35, 3, 24, 0);
    this.createStaticBox(7, 0.35, 9, 3.5, 0.22, 5, -0.2);
    this.createStaticBox(-9, 0.7, -6, 4, 0.22, 6, 0.3);
  }

  private createStaticBox(x: number, y: number, z: number, hx: number, hy: number, hz: number, pitch: number) {
    const halfExtents = new this.Jolt.Vec3(hx, hy, hz);
    const shape = new this.Jolt.BoxShape(halfExtents, 0.05);
    const position = new this.Jolt.RVec3(x, y, z);
    const axis = new this.Jolt.Vec3(1, 0, 0);
    const rotation = this.Jolt.Quat.prototype.sRotation(axis, pitch);
    const settings = new this.Jolt.BodyCreationSettings(shape, position, rotation, this.Jolt.EMotionType_Static, NON_MOVING);
    settings.mFriction = 1.05;
    const body = this.bodyInterface.CreateBody(settings);
    const id = body.GetID();
    this.bodyInterface.AddBody(id, this.Jolt.EActivation_DontActivate);
    this.staticBodyIds.push(id);
    this.Jolt.destroy(settings);
    this.Jolt.destroy(position);
    this.Jolt.destroy(rotation);
    this.Jolt.destroy(axis);
    this.Jolt.destroy(halfExtents);
  }

  private createMotorcycleBody() {
    const halfExtents = new this.Jolt.Vec3(0.22, 0.3, 0.43);
    const box = new this.Jolt.BoxShapeSettings(halfExtents);
    const offset = new this.Jolt.Vec3(0, -this.tuning.centerOfMassDrop, 0);
    const offsetShape = new this.Jolt.OffsetCenterOfMassShapeSettings(offset, box);
    const result = offsetShape.Create();
    const shape = result.Get();
    shape.AddRef();
    result.Clear();
    const position = new this.Jolt.RVec3(0, 1.1, 0);
    const rotation = new this.Jolt.Quat(0, 0, 0, 1);
    const settings = new this.Jolt.BodyCreationSettings(shape, position, rotation, this.Jolt.EMotionType_Dynamic, MOVING);
    settings.mOverrideMassProperties = this.Jolt.EOverrideMassProperties_CalculateInertia;
    settings.mMassPropertiesOverride.mMass = this.tuning.massKg;
    settings.mLinearDamping = this.tuning.linearDamping;
    settings.mAngularDamping = 0.06;
    settings.mAllowSleeping = false;
    settings.mMotionQuality = this.Jolt.EMotionQuality_LinearCast;
    const body = this.bodyInterface.CreateBody(settings);
    this.bodyInterface.AddBody(body.GetID(), this.Jolt.EActivation_Activate);
    this.Jolt.destroy(settings);
    shape.Release();
    this.Jolt.destroy(offsetShape);
    this.Jolt.destroy(offset);
    this.Jolt.destroy(halfExtents);
    this.Jolt.destroy(position);
    this.Jolt.destroy(rotation);
    return body;
  }

  private createWheel(front: boolean) {
    const wheel = new this.Jolt.WheelSettingsWV();
    const position = new this.Jolt.Vec3(0, -0.27, front ? 0.78 : -0.78);
    wheel.mPosition = position;
    this.Jolt.destroy(position);
    wheel.mMaxSteerAngle = front ? this.tuning.maxSteerRadians : 0;
    wheel.mRadius = this.tuning.wheelRadius;
    wheel.mWidth = 0.08;
    wheel.mSuspensionMinLength = this.tuning.suspensionMin;
    wheel.mSuspensionMaxLength = this.tuning.suspensionMax;
    wheel.mSuspensionSpring.mFrequency = front ? this.tuning.frontSuspensionFrequency : this.tuning.rearSuspensionFrequency;
    wheel.mMaxBrakeTorque = front ? this.tuning.frontBrakeTorque : this.tuning.rearBrakeTorque;
    wheel.mMaxHandBrakeTorque = front ? 0 : this.tuning.rearBrakeTorque * 1.6;
    if (front) {
      const direction = new this.Jolt.Vec3(0, -1, 0);
      const axis = new this.Jolt.Vec3(0, 1, 0);
      wheel.mSuspensionDirection = direction;
      wheel.mSteeringAxis = axis;
      this.Jolt.destroy(direction);
      this.Jolt.destroy(axis);
    }
    return wheel;
  }
}

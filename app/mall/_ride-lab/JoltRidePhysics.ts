import initJolt from "jolt-physics/wasm-compat";

import { RIDE_LAB_ARENA_HALF_SIZE } from "./rideLabArena.ts";
import { advanceAerialMechanic, advanceRideIntent, createAerialMechanicState, highSpeedDriveScale, longitudinalSpeed, resolveSteeringBlend, signedLeanRadians, type AerialMechanicEvent, type AerialMechanicState } from "./rideLabModel.ts";
import type { RideLabInput, RideLabSnapshot, ResolvedRideIntent } from "./rideLabTypes.ts";
import type { RideLabTuning } from "./rideLabTuning.ts";

type JoltModule = Awaited<ReturnType<typeof initJolt>>;

const NON_MOVING = 0;
const MOVING = 1;
const ZERO_INTENT: ResolvedRideIntent = { throttle: 0, brake: 0, steer: 0 };

function uprightQuaternionFromForward(forwardX: number, forwardY: number, forwardZ: number) {
  const forwardLength = Math.hypot(forwardX, forwardY, forwardZ) || 1;
  const fx = forwardX / forwardLength;
  const fy = forwardY / forwardLength;
  const fz = forwardZ / forwardLength;
  const projectedUpLength = Math.hypot(-fx * fy, 1 - fy * fy, -fz * fy) || 1;
  const ux = -fx * fy / projectedUpLength;
  const uy = (1 - fy * fy) / projectedUpLength;
  const uz = -fz * fy / projectedUpLength;
  const rx = uy * fz - uz * fy;
  const ry = uz * fx - ux * fz;
  const rz = ux * fy - uy * fx;
  const trace = rx + uy + fz;
  if (trace > 0) {
    const scale = Math.sqrt(trace + 1) * 2;
    return { x: (uz - fy) / scale, y: (fx - rz) / scale, z: (ry - ux) / scale, w: scale / 4 };
  }
  if (rx > uy && rx > fz) {
    const scale = Math.sqrt(1 + rx - uy - fz) * 2;
    return { x: scale / 4, y: (ux + ry) / scale, z: (fx + rz) / scale, w: (uz - fy) / scale };
  }
  if (uy > fz) {
    const scale = Math.sqrt(1 + uy - rx - fz) * 2;
    return { x: (ux + ry) / scale, y: scale / 4, z: (fy + uz) / scale, w: (fx - rz) / scale };
  }
  const scale = Math.sqrt(1 + fz - rx - uy) * 2;
  return { x: (fx + rz) / scale, y: (fy + uz) / scale, z: scale / 4, w: (ry - ux) / scale };
}
const ARENA_HALF_SIZE = RIDE_LAB_ARENA_HALF_SIZE;
const MIN_GRIND_TANGENTIAL_SPEED = 2;

type GrindWall = { axis: "x" | "z"; sign: -1 | 1 };

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
  private aerialState: AerialMechanicState = createAerialMechanicState();
  private aerialEvent: AerialMechanicEvent = "idle";
  private grinding = false;
  private activeGrindWall: GrindWall | null = null;
  private grindTangentialVelocity = 0;
  private lastGrindTangentialVelocity = 0;
  private grindReleaseSpeedMps = 0;
  private lastInput: RideLabInput = { throttle: 0, brake: 0, steer: 0, reset: false, aerialAction: false };
  private steeringRecoverySign = 0;
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
    if (Math.abs(input.steer) >= 0.01) this.steeringRecoverySign = Math.sign(input.steer);
    else if (Math.abs(this.intent.steer) >= 0.01) this.steeringRecoverySign = Math.sign(this.intent.steer);
    this.lastInput = { ...input };
    if (input.reset) this.reset();
    this.intent = advanceRideIntent(this.intent, input, this.tuning, this.tuning.fixedStep);
    const releasedGrindWall = this.activeGrindWall && this.aerialState.actionWasHeld && !this.wasGrounded && !input.aerialAction
      ? this.activeGrindWall
      : null;
    const releasedGrindTangentialVelocity = this.lastGrindTangentialVelocity;
    const grindWall = this.findGrindWall(input.aerialAction);
    const aerialStep = advanceAerialMechanic(
      this.aerialState,
      { actionHeld: !input.reset && input.aerialAction, grounded: this.wasGrounded, wallEligible: grindWall !== null },
      this.tuning,
      this.tuning.fixedStep,
    );
    this.aerialState = aerialStep.state;
    this.aerialEvent = aerialStep.eventPulse;
    this.grinding = aerialStep.grinding;
    if (aerialStep.grinding && grindWall && this.grindTangentialVelocity === 0) {
      this.grindTangentialVelocity = grindWall.axis === "x" ? this.linearVelocityOut.GetZ() : this.linearVelocityOut.GetX();
    }
    this.activeGrindWall = aerialStep.grinding ? grindWall : null;
    if (!input.aerialAction || this.wasGrounded) this.grindTangentialVelocity = 0;
    if (!input.aerialAction || this.wasGrounded) this.lastGrindTangentialVelocity = 0;
    if (this.wasGrounded && input.aerialAction) this.applyPreloadForce();
    if (aerialStep.ollieImpulse > 0) this.applyVerticalImpulse(aerialStep.ollieImpulse);
    if (aerialStep.upwardForce > 0) this.applyVerticalForce(aerialStep.upwardForce);
    this.applyLowSpeedUprightAssist();
    const steering = resolveSteeringBlend(this.intent.steer, this.tuning.riderWeightShiftRatio);
    this.applyRiderWeightShift(steering.weightShift);
    this.applyReleasedSteeringUprightAssist();
    const topSpeedFactor = clamp(1 - Math.max(0, this.previousSpeed - this.tuning.topSpeedMps) / 2, 0, 1);
    const highSpeedDrive = highSpeedDriveScale(
      Math.abs(this.previousSpeed),
      this.tuning.highSpeedTorqueStartMps,
      this.tuning.highSpeedTorqueEndMps,
      this.tuning.highSpeedTorqueMultiplier,
    );
    this.controller.SetDriverInput(
      this.intent.throttle * topSpeedFactor * highSpeedDrive,
      steering.handlebar,
      this.intent.brake,
      this.intent.brake > 0.84 ? (this.intent.brake - 0.84) / 0.16 : 0,
    );
    if (this.intent.throttle || this.intent.brake || this.intent.steer) {
      this.bodyInterface.ActivateBody(this.motorcycleBody.GetID());
    }
    this.bodyInterface.GetPositionAndRotation(this.motorcycleBody.GetID(), this.positionOut, this.rotationOut);
    const headingBeforeStep = this.currentHeadingRadians();
    this.jolt.Step(this.tuning.fixedStep, 1);
    const groundedAfterStep = this.hasGroundContact();
    this.applyTurnCurvatureAssist(this.intent.steer, headingBeforeStep, groundedAfterStep);
    this.applySteeringRecoveryOvershootGuard(groundedAfterStep);
    if (aerialStep.grinding && grindWall) {
      this.bodyInterface.GetLinearAndAngularVelocity(this.motorcycleBody.GetID(), this.linearVelocityOut, this.angularVelocityOut);
      this.applyWallGrind(grindWall);
    } else if (releasedGrindWall) {
      this.bodyInterface.GetLinearAndAngularVelocity(this.motorcycleBody.GetID(), this.linearVelocityOut, this.angularVelocityOut);
      this.grindReleaseSpeedMps = this.preserveReleasedGrindMomentum(releasedGrindWall, releasedGrindTangentialVelocity);
    }
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
    const leanRadians = signedLeanRadians({ x, y, z, w });
    const grounded = this.isGroundContact(frontWheel) || this.isGroundContact(rearWheelBase);
    const movementTransition = this.wasGrounded && !grounded ? "takeoff"
      : !this.wasGrounded && grounded ? "landing"
        : "idle";
    const eventPulse = this.lastInput.reset ? "reset"
      : this.aerialEvent !== "idle" ? this.aerialEvent
        : movementTransition !== "idle" ? movementTransition
          : this.lastInput.brake > 0 ? "brake"
            : this.lastInput.throttle > 0 ? "throttle"
              : Math.abs(this.lastInput.steer) > 0 ? "steer"
                : "idle";
    this.wasGrounded = grounded;
    return {
      position: { x: position.GetX(), y: position.GetY(), z: position.GetZ() },
      rotation: { x, y, z, w },
      speedMps,
      horizontalSpeedMps: Math.hypot(velocity.GetX(), velocity.GetZ()),
      accelerationMps2,
      verticalSpeedMps: velocity.GetY(),
      leanRadians,
      grounded,
      wheelContacts: Number(frontWheel.HasContact()) + Number(rearWheelBase.HasContact()),
      frontSuspensionLoad: frontLoad,
      rearSuspensionLoad: rearLoad,
      rearSlip: Math.abs(rearWheel.mLongitudinalSlip),
      preload: this.aerialState.preload,
      hoverEnergy: this.aerialState.hoverEnergy,
      airtimeSeconds: this.aerialState.airtimeSeconds,
      aerialPhase: this.aerialState.phase,
      grinding: this.grinding,
      grindReleaseSpeedMps: this.grindReleaseSpeedMps,
      acceptedInput: { ...this.lastInput },
      eventPulse,
      movementTransition,
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
    this.aerialState = createAerialMechanicState();
    this.aerialEvent = "idle";
    this.grinding = false;
    this.activeGrindWall = null;
    this.grindTangentialVelocity = 0;
    this.lastGrindTangentialVelocity = 0;
    this.grindReleaseSpeedMps = 0;
    this.steeringRecoverySign = 0;
    this.previousSpeed = 0;
    this.wasGrounded = false;
  }

  cancelAerialAction() {
    if (this.disposed) return;
    this.aerialState = {
      ...this.aerialState,
      preload: 0,
      phase: this.wasGrounded ? "grounded" : "airborne",
      actionWasHeld: false,
      airborneBlockedUntilRelease: false,
    };
    this.aerialEvent = "idle";
    this.grinding = false;
    this.activeGrindWall = null;
    this.grindTangentialVelocity = 0;
    this.lastGrindTangentialVelocity = 0;
    this.lastInput = { ...this.lastInput, aerialAction: false };
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
    this.createStaticBox(0, -0.5, 0, ARENA_HALF_SIZE, 0.5, ARENA_HALF_SIZE, 0);
    this.createStaticBox(0, 5.5, ARENA_HALF_SIZE, ARENA_HALF_SIZE, 6, 0.35, 0);
    this.createStaticBox(0, 5.5, -ARENA_HALF_SIZE, ARENA_HALF_SIZE, 6, 0.35, 0);
    this.createStaticBox(ARENA_HALF_SIZE, 5.5, 0, 0.35, 6, ARENA_HALF_SIZE, 0);
    this.createStaticBox(-ARENA_HALF_SIZE, 5.5, 0, 0.35, 6, ARENA_HALF_SIZE, 0);
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

  setScenario(scenario: "start" | "ramp" | "wall-grind") {
    if (scenario === "start") {
      this.reset();
      return;
    }
    this.reset();
    const rampApproach = scenario === "ramp";
    const position = new this.Jolt.RVec3(rampApproach ? 7 : ARENA_HALF_SIZE - 0.8, rampApproach ? 1.1 : 3, rampApproach ? 1.5 : 0);
    const rotation = new this.Jolt.Quat(0, 0, 0, 1);
    const velocity = new this.Jolt.Vec3(0, 0, 8);
    const zero = new this.Jolt.Vec3(0, 0, 0);
    this.bodyInterface.SetPositionRotationAndVelocity(this.motorcycleBody.GetID(), position, rotation, velocity, zero);
    this.Jolt.destroy(position);
    this.Jolt.destroy(rotation);
    this.Jolt.destroy(velocity);
    this.Jolt.destroy(zero);
    this.intent = ZERO_INTENT;
    this.aerialState = createAerialMechanicState();
    this.aerialState = { ...this.aerialState, phase: rampApproach ? "grounded" : "airborne" };
    this.aerialEvent = "idle";
    this.grinding = false;
    this.activeGrindWall = null;
    this.grindTangentialVelocity = 0;
    this.lastGrindTangentialVelocity = 0;
    this.grindReleaseSpeedMps = 0;
    this.wasGrounded = rampApproach;
    this.previousSpeed = 8;
    this.snapshot();
  }

  private applyPreloadForce() {
    const force = new this.Jolt.Vec3(0, -this.tuning.massKg * 9.81 * (0.5 + this.aerialState.preload), 0);
    this.bodyInterface.AddForce(this.motorcycleBody.GetID(), force, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(force);
  }

  private applyVerticalImpulse(amount: number) {
    const impulse = new this.Jolt.Vec3(0, amount, 0);
    this.bodyInterface.AddImpulse(this.motorcycleBody.GetID(), impulse);
    this.Jolt.destroy(impulse);
  }

  private applyVerticalForce(amount: number) {
    const force = new this.Jolt.Vec3(0, amount, 0);
    this.bodyInterface.AddForce(this.motorcycleBody.GetID(), force, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(force);
  }

  private applyLowSpeedUprightAssist() {
    if (!this.wasGrounded) return;
    const horizontalSpeed = Math.hypot(this.linearVelocityOut.GetX(), this.linearVelocityOut.GetZ());
    const assistSpeedLimit = 1.5;
    if (horizontalSpeed >= assistSpeedLimit) return;
    const { rotationX, rotationY, rotationZ, rotationW, forwardX, forwardY, forwardZ } = this.currentForwardAxis();
    const lean = signedLeanRadians({ x: rotationX, y: rotationY, z: rotationZ, w: rotationW });
    const angularAlongForward = this.angularVelocityOut.GetX() * forwardX
      + this.angularVelocityOut.GetY() * forwardY
      + this.angularVelocityOut.GetZ() * forwardZ;
    const speedBlend = 1 - horizontalSpeed / assistSpeedLimit;
    const torqueAmount = (-lean * this.tuning.leanSpring * 6 - angularAlongForward * this.tuning.leanDamping * 6)
      * this.tuning.rideAssist * speedBlend;
    const torque = new this.Jolt.Vec3(forwardX * torqueAmount, forwardY * torqueAmount, forwardZ * torqueAmount);
    this.bodyInterface.AddTorque(this.motorcycleBody.GetID(), torque, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(torque);
  }

  private applyRiderWeightShift(weightShift: number) {
    if (!this.wasGrounded || weightShift === 0) return;
    const horizontalSpeed = Math.hypot(this.linearVelocityOut.GetX(), this.linearVelocityOut.GetZ());
    const speedBlend = clamp(
      (horizontalSpeed - this.tuning.riderWeightShiftStartSpeedMps)
        / (this.tuning.riderWeightShiftFullSpeedMps - this.tuning.riderWeightShiftStartSpeedMps),
      0,
      1,
    );
    if (speedBlend === 0) return;
    const { forwardX, forwardY, forwardZ } = this.currentForwardAxis();
    const torqueAmount = this.tuning.massKg * 9.81 * this.tuning.riderWeightShiftMeters * weightShift * speedBlend;
    const torque = new this.Jolt.Vec3(forwardX * torqueAmount, forwardY * torqueAmount, forwardZ * torqueAmount);
    this.bodyInterface.AddTorque(this.motorcycleBody.GetID(), torque, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(torque);
  }

  private applyReleasedSteeringUprightAssist() {
    if (!this.wasGrounded || Math.abs(this.lastInput.steer) >= 0.01) return;
    const bodyId = this.motorcycleBody.GetID();
    this.bodyInterface.GetPositionAndRotation(bodyId, this.positionOut, this.rotationOut);
    this.bodyInterface.GetLinearAndAngularVelocity(bodyId, this.linearVelocityOut, this.angularVelocityOut);
    const { rotationX, rotationY, rotationZ, rotationW, forwardX, forwardY, forwardZ } = this.currentForwardAxis();
    const lean = signedLeanRadians({ x: rotationX, y: rotationY, z: rotationZ, w: rotationW });
    const angularAlongForward = this.angularVelocityOut.GetX() * forwardX
      + this.angularVelocityOut.GetY() * forwardY
      + this.angularVelocityOut.GetZ() * forwardZ;
    const targetLean = this.intent.steer * this.tuning.maxLeanRadians;
    const torqueAmount = ((targetLean - lean) * this.tuning.leanSpring * 8 - angularAlongForward * this.tuning.leanDamping * 28)
      * this.tuning.rideAssist;
    const torque = new this.Jolt.Vec3(forwardX * torqueAmount, forwardY * torqueAmount, forwardZ * torqueAmount);
    this.bodyInterface.AddTorque(bodyId, torque, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(torque);
  }

  private currentForwardAxis() {
    const rotationX = this.rotationOut.GetX();
    const rotationY = this.rotationOut.GetY();
    const rotationZ = this.rotationOut.GetZ();
    const rotationW = this.rotationOut.GetW();
    return {
      rotationX,
      rotationY,
      rotationZ,
      rotationW,
      forwardX: 2 * (rotationX * rotationZ + rotationW * rotationY),
      forwardY: 2 * (rotationY * rotationZ - rotationW * rotationX),
      forwardZ: 1 - 2 * (rotationX * rotationX + rotationY * rotationY),
    };
  }

  private applySteeringRecoveryOvershootGuard(grounded: boolean) {
    if (Math.abs(this.lastInput.steer) >= 0.01 || this.steeringRecoverySign === 0) return;
    if (!grounded) {
      this.steeringRecoverySign = 0;
      return;
    }
    const bodyId = this.motorcycleBody.GetID();
    this.bodyInterface.GetPositionAndRotation(bodyId, this.positionOut, this.rotationOut);
    this.bodyInterface.GetLinearAndAngularVelocity(bodyId, this.linearVelocityOut, this.angularVelocityOut);
    const { rotationX, rotationY, rotationZ, rotationW, forwardX, forwardY, forwardZ } = this.currentForwardAxis();
    const lean = signedLeanRadians({ x: rotationX, y: rotationY, z: rotationZ, w: rotationW });
    const angularAlongForward = this.angularVelocityOut.GetX() * forwardX
      + this.angularVelocityOut.GetY() * forwardY
      + this.angularVelocityOut.GetZ() * forwardZ;
    if (lean * this.steeringRecoverySign >= 0) {
      const settled = Math.abs(this.intent.steer) < 0.01
        && Math.abs(lean) < 0.5 * Math.PI / 180
        && Math.abs(angularAlongForward) < 0.01;
      if (settled) this.steeringRecoverySign = 0;
      return;
    }

    const angularVelocity = new this.Jolt.Vec3(
      this.angularVelocityOut.GetX() - forwardX * angularAlongForward,
      this.angularVelocityOut.GetY() - forwardY * angularAlongForward,
      this.angularVelocityOut.GetZ() - forwardZ * angularAlongForward,
    );
    const upright = uprightQuaternionFromForward(forwardX, forwardY, forwardZ);
    const rotation = new this.Jolt.Quat(upright.x, upright.y, upright.z, upright.w);
    this.bodyInterface.SetPositionRotationAndVelocity(
      bodyId,
      this.positionOut,
      rotation,
      this.linearVelocityOut,
      angularVelocity,
    );
    this.steeringRecoverySign = 0;
    this.Jolt.destroy(rotation);
    this.Jolt.destroy(angularVelocity);
  }

  private applyTurnCurvatureAssist(steer: number, headingBeforeStep: number, grounded: boolean) {
    if (!grounded || this.tuning.turnAssist === 0) return;
    const bodyId = this.motorcycleBody.GetID();
    this.bodyInterface.GetPositionAndRotation(bodyId, this.positionOut, this.rotationOut);
    this.bodyInterface.GetLinearAndAngularVelocity(bodyId, this.linearVelocityOut, this.angularVelocityOut);
    const velocityX = this.linearVelocityOut.GetX();
    const velocityZ = this.linearVelocityOut.GetZ();
    const horizontalSpeed = Math.hypot(velocityX, velocityZ);
    if (horizontalSpeed < 2) return;

    if (Math.abs(steer) < 0.01) {
      const yawDamping = Math.exp(-this.tuning.turnAssist * 3 * this.tuning.fixedStep);
      const angularVelocity = new this.Jolt.Vec3(
        this.angularVelocityOut.GetX(),
        this.angularVelocityOut.GetY() * yawDamping,
        this.angularVelocityOut.GetZ(),
      );
      this.bodyInterface.SetPositionRotationAndVelocity(
        bodyId,
        this.positionOut,
        this.rotationOut,
        this.linearVelocityOut,
        angularVelocity,
      );
      this.Jolt.destroy(angularVelocity);
      return;
    }

    const targetYawRate = -steer * Math.min(
      horizontalSpeed / this.tuning.turnAssistRadiusMeters,
      this.tuning.turnAssistMaxYawRate,
    );
    const naturalHeadingDelta = Math.atan2(
      Math.sin(this.currentHeadingRadians() - headingBeforeStep),
      Math.cos(this.currentHeadingRadians() - headingBeforeStep),
    );
    const minimumCurvatureDelta = targetYawRate * this.tuning.fixedStep;
    const sameDirection = Math.sign(naturalHeadingDelta) === Math.sign(minimumCurvatureDelta);
    const desiredHeadingDelta = sameDirection && Math.abs(naturalHeadingDelta) > Math.abs(minimumCurvatureDelta)
      ? Math.sign(naturalHeadingDelta) * Math.min(
        Math.abs(naturalHeadingDelta),
        this.tuning.turnAssistMaxYawRate * this.tuning.fixedStep,
      )
      : minimumCurvatureDelta;
    const blendedHeadingDelta = naturalHeadingDelta
      + (desiredHeadingDelta - naturalHeadingDelta) * this.tuning.turnAssist;
    const finalHeadingDelta = clamp(
      blendedHeadingDelta,
      -this.tuning.turnAssistMaxYawRate * this.tuning.fixedStep,
      this.tuning.turnAssistMaxYawRate * this.tuning.fixedStep,
    );
    const headingCorrection = finalHeadingDelta - naturalHeadingDelta;
    const cos = Math.cos(headingCorrection);
    const sin = Math.sin(headingCorrection);
    const velocity = new this.Jolt.Vec3(
      velocityX * cos + velocityZ * sin,
      this.linearVelocityOut.GetY(),
      -velocityX * sin + velocityZ * cos,
    );
    const currentYawRate = this.angularVelocityOut.GetY();
    const assistedYawRate = currentYawRate + (targetYawRate - currentYawRate) * this.tuning.turnAssist;
    const angularVelocity = new this.Jolt.Vec3(
      this.angularVelocityOut.GetX(),
      clamp(assistedYawRate, -this.tuning.turnAssistMaxYawRate, this.tuning.turnAssistMaxYawRate),
      this.angularVelocityOut.GetZ(),
    );
    const up = new this.Jolt.Vec3(0, 1, 0);
    const yaw = this.Jolt.Quat.prototype.sRotation(up, headingCorrection);
    const rotation = yaw.MulQuat(this.rotationOut);
    this.bodyInterface.SetPositionRotationAndVelocity(bodyId, this.positionOut, rotation, velocity, angularVelocity);
    this.Jolt.destroy(rotation);
    this.Jolt.destroy(yaw);
    this.Jolt.destroy(up);
    this.Jolt.destroy(velocity);
    this.Jolt.destroy(angularVelocity);
  }

  private currentHeadingRadians() {
    const x = this.rotationOut.GetX();
    const y = this.rotationOut.GetY();
    const z = this.rotationOut.GetZ();
    const w = this.rotationOut.GetW();
    return Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + x * x));
  }

  private findGrindWall(actionHeld: boolean): GrindWall | null {
    if (actionHeld && this.activeGrindWall && this.isWithinGrindReleaseZone(this.activeGrindWall)) return this.activeGrindWall;
    return this.findEligibleGrindWall();
  }

  private findEligibleGrindWall(): GrindWall | null {
    if (this.wasGrounded || this.positionOut.GetY() < 0.8 || this.positionOut.GetY() > 11.5) return null;
    const xDistance = Math.abs(ARENA_HALF_SIZE - Math.abs(this.positionOut.GetX()));
    const zDistance = Math.abs(ARENA_HALF_SIZE - Math.abs(this.positionOut.GetZ()));
    const xEligible = xDistance <= this.tuning.grindCaptureDistance && Math.abs(this.positionOut.GetZ()) < ARENA_HALF_SIZE - 0.5 && Math.abs(this.linearVelocityOut.GetZ()) >= MIN_GRIND_TANGENTIAL_SPEED;
    const zEligible = zDistance <= this.tuning.grindCaptureDistance && Math.abs(this.positionOut.GetX()) < ARENA_HALF_SIZE - 0.5 && Math.abs(this.linearVelocityOut.GetX()) >= MIN_GRIND_TANGENTIAL_SPEED;
    if (!xEligible && !zEligible) return null;
    if (xEligible && (!zEligible || xDistance <= zDistance)) return { axis: "x", sign: this.positionOut.GetX() < 0 ? -1 : 1 };
    return { axis: "z", sign: this.positionOut.GetZ() < 0 ? -1 : 1 };
  }

  private isWithinGrindReleaseZone(wall: GrindWall) {
    if (this.wasGrounded || this.positionOut.GetY() < 0.5 || this.positionOut.GetY() > 11.5) return false;
    const normalPosition = wall.axis === "x" ? this.positionOut.GetX() : this.positionOut.GetZ();
    const tangentPosition = wall.axis === "x" ? this.positionOut.GetZ() : this.positionOut.GetX();
    const tangentSpeed = wall.axis === "x" ? this.linearVelocityOut.GetZ() : this.linearVelocityOut.GetX();
    return Math.abs(ARENA_HALF_SIZE - Math.abs(normalPosition)) <= this.tuning.grindCaptureDistance * 1.75
      && Math.abs(tangentPosition) < ARENA_HALF_SIZE - 0.5
      && Math.abs(tangentSpeed) >= MIN_GRIND_TANGENTIAL_SPEED * 0.5;
  }

  private isGroundContact(wheel: InstanceType<JoltModule["Wheel"]>) {
    return wheel.HasContact() && wheel.GetContactNormal().GetY() > 0.5;
  }

  private hasGroundContact() {
    return this.isGroundContact(this.constraint.GetWheel(0))
      || this.isGroundContact(this.constraint.GetWheel(1));
  }

  private applyWallGrind(wall: GrindWall) {
    let x = this.linearVelocityOut.GetX();
    const gravityCompensation = 9.81 * this.tuning.fixedStep;
    const y = Math.max(this.linearVelocityOut.GetY(), -this.tuning.grindFallSpeed + gravityCompensation);
    let z = this.linearVelocityOut.GetZ();
    const minimumTangentialSpeed = Math.abs(this.grindTangentialVelocity) * 0.91;
    if (wall.axis === "x" && Math.abs(z) < minimumTangentialSpeed) z = Math.sign(this.grindTangentialVelocity) * minimumTangentialSpeed;
    if (wall.axis === "z" && Math.abs(x) < minimumTangentialSpeed) x = Math.sign(this.grindTangentialVelocity) * minimumTangentialSpeed;
    this.lastGrindTangentialVelocity = wall.axis === "x" ? z : x;
    const normalPosition = wall.axis === "x" ? this.positionOut.GetX() : this.positionOut.GetZ();
    const normalOffset = normalPosition - wall.sign * ARENA_HALF_SIZE;
    if (wall.axis === "x" && x * normalOffset > 0) x = 0;
    if (wall.axis === "z" && z * normalOffset > 0) z = 0;
    const velocity = new this.Jolt.Vec3(x, y, z);
    this.bodyInterface.SetLinearVelocity(this.motorcycleBody.GetID(), velocity);
    const latchForce = this.tuning.massKg * 8;
    const towardWall = normalOffset === 0 ? 0 : -Math.sign(normalOffset);
    const force = new this.Jolt.Vec3(
      wall.axis === "x" ? towardWall * latchForce : 0,
      0,
      wall.axis === "z" ? towardWall * latchForce : 0,
    );
    this.bodyInterface.AddForce(this.motorcycleBody.GetID(), force, this.Jolt.EActivation_Activate);
    this.Jolt.destroy(velocity);
    this.Jolt.destroy(force);
  }

  private preserveReleasedGrindMomentum(wall: GrindWall, entryTangentialVelocity: number) {
    let x = this.linearVelocityOut.GetX();
    const y = this.linearVelocityOut.GetY();
    let z = this.linearVelocityOut.GetZ();
    const minimumSpeed = Math.abs(entryTangentialVelocity) * 0.95;
    if (wall.axis === "x" && Math.abs(z) < minimumSpeed) z = Math.sign(entryTangentialVelocity) * minimumSpeed;
    if (wall.axis === "z" && Math.abs(x) < minimumSpeed) x = Math.sign(entryTangentialVelocity) * minimumSpeed;
    const velocity = new this.Jolt.Vec3(x, y, z);
    this.bodyInterface.SetLinearVelocity(this.motorcycleBody.GetID(), velocity);
    this.Jolt.destroy(velocity);
    return Math.hypot(x, z);
  }
}

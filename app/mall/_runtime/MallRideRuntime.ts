import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";
import type {
  RideControlMode,
  SceneCommand,
  SceneEvent,
} from "../_lib/scene-contract";
import { InputController } from "./inputController";
import { createMallColliders } from "./mallPhysics";
import { BENCHMARK, RIDE_TUNING } from "./rideTuning";
import { createVehicleVisual, type VehicleVisual } from "./vehicleVisual";
import type { RideInput } from "./rideTypes";
import { createMallArtScene, type MallArtScene } from "./art";

type MallRideRuntimeOptions = {
  canvas: HTMLCanvasElement;
  controlSurface: HTMLElement;
  onEvent: (event: SceneEvent) => void;
};

export type RideDebugSnapshot = {
  mode: RideControlMode;
  speedKph: number;
  position: { x: number; z: number };
  groundedWheels: number;
  drawCalls: number;
  triangles: number;
};

const quaternionIdentity = { x: 0, y: 0, z: 0, w: 1 };

function damp(current: number, target: number, sharpness: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-sharpness * delta));
}

export class MallRideRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(51, 1, 0.08, 90);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly outline: OutlineEffect;
  private readonly world: RAPIER.World;
  private readonly chassis: RAPIER.RigidBody;
  private readonly chassisCollider: RAPIER.Collider;
  private readonly vehicle: RAPIER.DynamicRayCastVehicleController;
  private readonly visual: VehicleVisual;
  private readonly mallArt: MallArtScene;
  private readonly input: InputController;
  private readonly resizeObserver: ResizeObserver;
  private readonly cameraBall = new RAPIER.Ball(0.28);
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraAim = new THREE.Vector3();
  private readonly previousPosition = new THREE.Vector3();
  private readonly currentPosition = new THREE.Vector3();
  private readonly previousRotation = new THREE.Quaternion();
  private readonly currentRotation = new THREE.Quaternion();
  private readonly startTime = performance.now();
  private mode: RideControlMode = "attract";
  private reducedMotion = false;
  private animationFrame = 0;
  private lastFrameTime = performance.now();
  private accumulator = 0;
  private steer = 0;
  private lean = 0;
  private lastSafeAnchor = 0;
  private poiLatched = false;
  private disposed = false;

  private constructor(
    private readonly options: MallRideRuntimeOptions,
    context: WebGL2RenderingContext,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      context,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.outline = new OutlineEffect(this.renderer, {
      defaultThickness: 0.0045,
      defaultColor: [0.055, 0.035, 0.095],
      defaultAlpha: 0.82,
      defaultKeepAlive: false,
    });

    this.scene.background = new THREE.Color(0x171126);
    this.scene.fog = new THREE.Fog(0x171126, 26, 58);

    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = RIDE_TUNING.fixedStep;
    createMallColliders(this.world, RAPIER);

    this.chassis = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(BENCHMARK.start.x, BENCHMARK.start.y, BENCHMARK.start.z)
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
    // Four narrow contact rays give the invisible chassis enough lateral
    // leverage to turn reliably while the rendered vehicle remains a moped.
    this.addWheel({ x: 0.69, y: -0.05, z: 0.14 });
    this.addWheel({ x: 0.69, y: -0.05, z: -0.14 });
    this.addWheel({ x: -0.66, y: -0.05, z: 0.14 });
    this.addWheel({ x: -0.66, y: -0.05, z: -0.14 });

    this.visual = createVehicleVisual();
    this.mallArt = createMallArtScene();
    this.scene.add(this.mallArt.root);
    this.scene.add(this.visual.root);

    this.input = new InputController(options.controlSurface);
    this.input.setEnabled(false);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(options.canvas);
    options.canvas.addEventListener("webglcontextlost", this.onContextLost);
    options.controlSurface.addEventListener("blur", this.onControlSurfaceBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    const start = this.chassis.translation();
    this.previousPosition.set(start.x, start.y, start.z);
    this.currentPosition.copy(this.previousPosition);
    this.cameraPosition.set(start.x - 5, start.y + 2.7, start.z);
    this.cameraAim.set(start.x + 1.5, start.y + 0.8, start.z);
    this.resize();
  }

  static async create(options: MallRideRuntimeOptions) {
    performance.mark("mall:runtime-import-start");
    await RAPIER.init();
    const context = options.canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!context) throw new Error("This browser does not provide WebGL 2.");
    return new MallRideRuntime(options, context);
  }

  start() {
    if (this.disposed) return;
    performance.mark("mall:critical-assets-ready");
    this.lastFrameTime = performance.now();
    this.renderer.setAnimationLoop(this.frame);
    performance.mark("mall:first-interactive-frame");
    this.options.onEvent({ type: "runtime-ready" });
  }

  dispatch(command: SceneCommand) {
    if (this.disposed) return;
    switch (command.type) {
      case "set-control-mode":
        this.setMode(command.mode);
        break;
      case "set-motion-mode":
        this.reducedMotion = command.mode === "reduced";
        break;
      case "focus-poi":
        this.resetToAnchor(BENCHMARK.safeAnchors.length - 1);
        break;
      case "set-muted":
        break;
    }
  }

  setVirtualInput(input: Partial<RideInput>) {
    this.input.setVirtual(input);
  }

  getDebugSnapshot(): RideDebugSnapshot {
    let groundedWheels = 0;
    for (let wheel = 0; wheel < this.vehicle.numWheels(); wheel += 1) {
      groundedWheels += Number(this.vehicle.wheelIsInContact(wheel));
    }
    return {
      mode: this.mode,
      speedKph: Math.abs(this.vehicle.currentVehicleSpeed()) * 3.6,
      position: { x: this.currentPosition.x, z: this.currentPosition.z },
      groundedWheels,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.input.dispose();
    this.options.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.options.controlSurface.removeEventListener("blur", this.onControlSurfaceBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.vehicle.free();
    this.world.free();
    this.mallArt.dispose();
    this.visual.dispose();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    this.renderer.dispose();
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
    this.vehicle.setWheelMaxSuspensionTravel(index, RIDE_TUNING.suspensionTravel);
    this.vehicle.setWheelSuspensionStiffness(index, RIDE_TUNING.suspensionStiffness);
    this.vehicle.setWheelSuspensionCompression(index, RIDE_TUNING.suspensionCompression);
    this.vehicle.setWheelSuspensionRelaxation(index, RIDE_TUNING.suspensionRelaxation);
    this.vehicle.setWheelMaxSuspensionForce(index, RIDE_TUNING.suspensionForce);
    this.vehicle.setWheelFrictionSlip(index, RIDE_TUNING.frictionSlip);
    this.vehicle.setWheelSideFrictionStiffness(index, RIDE_TUNING.sideFriction);
  }

  private readonly frame = (time: number) => {
    if (this.disposed) return;
    const frameDelta = Math.min((time - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = time;

    if (this.mode === "driving" && !document.hidden) {
      this.accumulator += frameDelta;
      let steps = 0;
      while (this.accumulator >= RIDE_TUNING.fixedStep && steps < RIDE_TUNING.maxCatchUpSteps) {
        this.fixedUpdate(this.input.read());
        this.accumulator -= RIDE_TUNING.fixedStep;
        steps += 1;
      }
      if (steps === RIDE_TUNING.maxCatchUpSteps) this.accumulator = 0;
    } else if (this.mode === "attract" && !this.reducedMotion) {
      this.updateAttractCamera(time);
    }

    const alpha = this.accumulator / RIDE_TUNING.fixedStep;
    this.updateVisuals(frameDelta, alpha);
    this.outline.render(this.scene, this.camera);
  };

  private fixedUpdate(input: RideInput) {
    this.previousPosition.copy(this.currentPosition);
    this.previousRotation.copy(this.currentRotation);

    const speed = this.vehicle.currentVehicleSpeed();
    const speedRatio = THREE.MathUtils.clamp(Math.abs(speed) / RIDE_TUNING.topSpeedMps, 0, 1);
    const steerTarget = input.steer;
    const response = steerTarget === 0 ? RIDE_TUNING.steerReturn : RIDE_TUNING.steerResponse;
    this.steer = damp(this.steer, steerTarget, response, RIDE_TUNING.fixedStep);
    const steeringLimit = THREE.MathUtils.lerp(
      RIDE_TUNING.lowSpeedSteer,
      RIDE_TUNING.highSpeedSteer,
      speedRatio,
    );

    let engineForce: number = 0;
    let brakeForce: number = RIDE_TUNING.coastBrake;
    if (input.throttle > 0 && speed < RIDE_TUNING.topSpeedMps) {
      engineForce = input.throttle * RIDE_TUNING.engineForce * (1 - speedRatio * 0.58);
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
      this.vehicle.setWheelSteering(wheel, -this.steer * steeringLimit);
      this.vehicle.setWheelEngineForce(wheel, engineForce * 0.09);
      this.vehicle.setWheelBrake(wheel, brakeForce * 0.3);
    }
    for (const wheel of [2, 3]) {
      this.vehicle.setWheelEngineForce(wheel, engineForce * 0.5);
      this.vehicle.setWheelBrake(wheel, brakeForce * 0.5);
    }
    this.vehicle.updateVehicle(RIDE_TUNING.fixedStep, undefined, undefined, (collider) => {
      return collider.handle !== this.chassisCollider.handle;
    });
    this.world.step();

    const position = this.chassis.translation();
    const rotation = this.chassis.rotation();
    this.currentPosition.set(position.x, position.y, position.z);
    this.currentRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);

    if (input.reset || this.currentPosition.y < -2) this.resetToAnchor(this.lastSafeAnchor);
    this.updateSafeAnchor();
    this.checkArcadeTrigger();
  }

  private updateVisuals(delta: number, alpha: number) {
    if (this.mode === "attract" && !this.reducedMotion) return;
    this.visual.root.position.lerpVectors(this.previousPosition, this.currentPosition, alpha);
    this.visual.root.quaternion.slerpQuaternions(this.previousRotation, this.currentRotation, alpha);
    const speedRatio = THREE.MathUtils.clamp(
      Math.abs(this.vehicle.currentVehicleSpeed()) / RIDE_TUNING.topSpeedMps,
      0,
      1,
    );
    const leanTarget = this.steer * RIDE_TUNING.leanRadians * (0.25 + speedRatio * 0.75);
    this.lean = damp(this.lean, leanTarget, RIDE_TUNING.leanResponse, delta);
    this.visual.lean.rotation.x = this.lean;
    this.visual.frontWheel.rotation.y = -this.steer * RIDE_TUNING.lowSpeedSteer;

    const wheelSpin = this.vehicle.wheelRotation(0) ?? 0;
    this.visual.frontWheel.children[0]?.rotateY(wheelSpin * 0.02);
    this.visual.rearWheel.children[0]?.rotateY(wheelSpin * 0.02);
    this.updateChaseCamera(delta);
  }

  private updateChaseCamera(delta: number) {
    const position = this.visual.root.position;
    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(this.visual.root.quaternion).normalize();
    const pivot = new THREE.Vector3(position.x, position.y + 0.92, position.z);
    const desired = pivot
      .clone()
      .addScaledVector(forward, -RIDE_TUNING.cameraDistance)
      .add(new THREE.Vector3(0, RIDE_TUNING.cameraHeight, 0));
    const travel = desired.clone().sub(pivot);
    const distance = travel.length();
    const direction = travel.normalize();
    const hit = this.world.castShape(
      pivot,
      quaternionIdentity,
      direction,
      this.cameraBall,
      0.04,
      distance,
      true,
      undefined,
      undefined,
      this.chassisCollider,
      this.chassis,
    );
    if (hit) desired.copy(pivot).addScaledVector(direction, Math.max(0.45, hit.time_of_impact - 0.18));

    const aim = pivot
      .clone()
      .addScaledVector(forward, RIDE_TUNING.cameraLookAhead)
      .add(new THREE.Vector3(0, 0.18, this.steer * 0.55));
    this.cameraPosition.lerp(desired, 1 - Math.exp(-RIDE_TUNING.cameraPositionSharpness * delta));
    this.cameraAim.lerp(aim, 1 - Math.exp(-RIDE_TUNING.cameraAimSharpness * delta));
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraAim);
    this.camera.fov = damp(this.camera.fov, 51 + Math.abs(this.vehicle.currentVehicleSpeed()) * 0.65, 3, delta);
    this.camera.updateProjectionMatrix();
  }

  private updateAttractCamera(time: number) {
    const elapsed = (time - this.startTime) / 1000;
    const target = new THREE.Vector3(-9.5, 0.55, 4.6);
    this.camera.position.set(
      target.x - 5.2 + Math.sin(elapsed * 0.18) * 0.7,
      3.25 + Math.sin(elapsed * 0.32) * 0.12,
      target.z + 3.1,
    );
    this.camera.lookAt(target.x + 2, target.y + 0.7, target.z);
  }

  private setMode(mode: RideControlMode) {
    const changed = this.mode !== mode;
    this.mode = mode;
    this.input.setEnabled(mode === "driving");
    if (mode === "driving") this.options.controlSurface.focus({ preventScroll: true });
    if (mode !== "driving") this.accumulator = 0;
    if (changed) {
      this.options.onEvent({ type: "control-mode-changed", mode });
    }
  }

  private resetToAnchor(index: number) {
    const anchor = BENCHMARK.safeAnchors[index] ?? BENCHMARK.safeAnchors[0];
    this.lastSafeAnchor = index;
    this.chassis.setTranslation({ x: anchor.x, y: anchor.y, z: anchor.z }, true);
    this.chassis.setRotation(
      { x: 0, y: Math.sin(anchor.yaw / 2), z: 0, w: Math.cos(anchor.yaw / 2) },
      true,
    );
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.currentPosition.set(anchor.x, anchor.y, anchor.z);
    this.previousPosition.copy(this.currentPosition);
    this.currentRotation.set(0, Math.sin(anchor.yaw / 2), 0, Math.cos(anchor.yaw / 2));
    this.previousRotation.copy(this.currentRotation);
    this.visual.root.position.copy(this.currentPosition);
    this.visual.root.quaternion.copy(this.currentRotation);
    this.accumulator = 0;
    this.steer = 0;
    this.lean = 0;
    this.poiLatched = false;
  }

  private updateSafeAnchor() {
    let nearest = this.lastSafeAnchor;
    let nearestDistance = 3.4;
    BENCHMARK.safeAnchors.forEach((anchor, index) => {
      const distance = Math.hypot(this.currentPosition.x - anchor.x, this.currentPosition.z - anchor.z);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    this.lastSafeAnchor = nearest;
  }

  private checkArcadeTrigger() {
    const distance = Math.hypot(
      this.currentPosition.x - BENCHMARK.arcadeTrigger.x,
      this.currentPosition.z - BENCHMARK.arcadeTrigger.z,
    );
    if (distance <= BENCHMARK.arcadeTrigger.radius && !this.poiLatched) {
      this.poiLatched = true;
      this.setMode("paused");
      this.options.onEvent({ type: "entered-poi", id: "currently-playing" });
    } else if (distance > BENCHMARK.arcadeTrigger.radius * 1.5) {
      this.poiLatched = false;
    }
  }

  private readonly resize = () => {
    const rect = this.options.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.renderer.setSize(rect.width, rect.height, false);
    this.outline.setSize(rect.width, rect.height);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  };

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.setMode("paused");
    this.options.onEvent({ type: "runtime-unavailable", reason: "The 3D view lost its graphics context." });
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden && this.mode === "driving") this.setMode("paused");
  };

  private readonly onControlSurfaceBlur = (event: FocusEvent) => {
    if (
      event.relatedTarget instanceof Node &&
      this.options.controlSurface.contains(event.relatedTarget)
    ) {
      return;
    }
    if (this.mode === "driving") this.setMode("paused");
  };
}

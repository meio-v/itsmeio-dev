import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";
import type {
  RideControlMode,
  SceneCommand,
  SceneEvent,
} from "../_lib/scene-contract";
import { InputController } from "./inputController";
import { BENCHMARK, RIDE_TUNING } from "./rideTuning";
import { RidePhysics } from "./ridePhysics";
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
  camera: { x: number; y: number; z: number };
  groundedWheels: number;
  drawCalls: number;
  triangles: number;
  startupMs: number;
  firstFrameMs: number;
  averageRenderMs: number;
  peakRenderMs: number;
  reducedMotion: boolean;
  contextStatus: "active" | "lost" | "disposed";
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
  private readonly physics: RidePhysics;
  private readonly visual: VehicleVisual;
  private readonly mallArt: MallArtScene;
  private readonly input: InputController;
  private readonly resizeObserver: ResizeObserver;
  private readonly cameraBall = new RAPIER.Ball(0.28);
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraAim = new THREE.Vector3();
  private readonly cameraForward = new THREE.Vector3();
  private readonly cameraPivot = new THREE.Vector3();
  private readonly cameraDesired = new THREE.Vector3();
  private readonly cameraTravel = new THREE.Vector3();
  private readonly cameraAimTarget = new THREE.Vector3();
  private readonly previousPosition = new THREE.Vector3();
  private readonly currentPosition = new THREE.Vector3();
  private readonly previousRotation = new THREE.Quaternion();
  private readonly currentRotation = new THREE.Quaternion();
  private readonly startTime = performance.now();
  private mode: RideControlMode = "attract";
  private reducedMotion = false;
  private lastFrameTime = performance.now();
  private accumulator = 0;
  private steer = 0;
  private lean = 0;
  private lastSafeAnchor = 0;
  private poiLatched = false;
  private disposed = false;
  private contextLost = false;
  private renderSamples = 0;
  private renderTimeTotal = 0;
  private peakRenderMs = 0;
  private startupMs = 0;
  private firstFrameMs = 0;
  private firstFrameRendered = false;
  private disposedSnapshot: RideDebugSnapshot | null = null;

  private constructor(
    private readonly options: MallRideRuntimeOptions,
    context: WebGL2RenderingContext,
    private readonly createStartedAt: number,
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

    this.physics = new RidePhysics(BENCHMARK.start);

    this.visual = createVehicleVisual();
    this.mallArt = createMallArtScene();
    this.scene.add(this.mallArt.root);
    this.scene.add(this.visual.root);

    this.input = new InputController(options.controlSurface);
    this.input.setEnabled(false);
    options.controlSurface.dataset.controlMode = this.mode;
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(options.canvas);
    options.canvas.addEventListener("webglcontextlost", this.onContextLost);
    options.canvas.addEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    options.controlSurface.addEventListener("blur", this.onControlSurfaceBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    const start = this.physics.chassis.translation();
    this.previousPosition.set(start.x, start.y, start.z);
    this.currentPosition.copy(this.previousPosition);
    this.cameraPosition.set(start.x - 5, start.y + 2.7, start.z);
    this.cameraAim.set(start.x + 1.5, start.y + 0.8, start.z);
    this.resize();
  }

  static async create(options: MallRideRuntimeOptions) {
    const createStartedAt = performance.now();
    performance.mark("mall:runtime-import-start");
    await RAPIER.init();
    const context = options.canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!context) throw new Error("This browser does not provide WebGL 2.");
    return new MallRideRuntime(options, context, createStartedAt);
  }

  start() {
    if (this.disposed) return;
    performance.mark("mall:critical-assets-ready");
    this.startupMs = performance.now() - this.createStartedAt;
    this.lastFrameTime = performance.now();
    this.renderer.setAnimationLoop(this.frame);
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
        if (this.reducedMotion && this.mode === "attract") {
          this.updateReducedMotionCamera();
        }
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
    if (this.disposedSnapshot) return this.disposedSnapshot;
    let groundedWheels = 0;
    for (let wheel = 0; wheel < this.physics.vehicle.numWheels(); wheel += 1) {
      groundedWheels += Number(
        this.physics.vehicle.wheelIsInContact(wheel),
      );
    }
    return {
      mode: this.mode,
      speedKph:
        Math.abs(this.physics.vehicle.currentVehicleSpeed()) * 3.6,
      position: { x: this.currentPosition.x, z: this.currentPosition.z },
      camera: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      groundedWheels,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      startupMs: this.startupMs,
      firstFrameMs: this.firstFrameMs,
      averageRenderMs:
        this.renderSamples === 0 ? 0 : this.renderTimeTotal / this.renderSamples,
      peakRenderMs: this.peakRenderMs,
      reducedMotion: this.reducedMotion,
      contextStatus: this.disposed
        ? "disposed"
        : this.contextLost
          ? "lost"
          : "active",
    };
  }

  resetPerformanceMetrics() {
    this.renderSamples = 0;
    this.renderTimeTotal = 0;
    this.peakRenderMs = 0;
  }

  dispose() {
    if (this.disposed) return;
    this.disposedSnapshot = {
      ...this.getDebugSnapshot(),
      contextStatus: "disposed",
    };
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.input.dispose();
    this.options.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.options.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.options.controlSurface.removeEventListener("blur", this.onControlSurfaceBlur);
    delete this.options.controlSurface.dataset.controlMode;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.physics.dispose();
    this.mallArt.dispose();
    this.visual.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private readonly frame = (time: number) => {
    if (this.disposed || this.contextLost) return;
    const renderStartedAt = performance.now();
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
    const renderTime = performance.now() - renderStartedAt;
    this.renderSamples += 1;
    this.renderTimeTotal += renderTime;
    this.peakRenderMs = Math.max(this.peakRenderMs, renderTime);
    if (!this.firstFrameRendered) {
      this.firstFrameRendered = true;
      this.firstFrameMs = performance.now() - this.createStartedAt;
      performance.mark("mall:first-interactive-frame");
    }
  };

  private fixedUpdate(input: RideInput) {
    this.previousPosition.copy(this.currentPosition);
    this.previousRotation.copy(this.currentRotation);

    const snapshot = this.physics.step(input);
    this.steer = snapshot.steer;
    this.currentPosition.set(
      snapshot.position.x,
      snapshot.position.y,
      snapshot.position.z,
    );
    this.currentRotation.set(
      snapshot.rotation.x,
      snapshot.rotation.y,
      snapshot.rotation.z,
      snapshot.rotation.w,
    );

    if (input.reset || this.currentPosition.y < -2) this.resetToAnchor(this.lastSafeAnchor);
    this.updateSafeAnchor();
    this.checkArcadeTrigger();
  }

  private updateVisuals(delta: number, alpha: number) {
    if (this.mode === "attract") return;
    this.visual.root.position.lerpVectors(this.previousPosition, this.currentPosition, alpha);
    this.visual.root.quaternion.slerpQuaternions(this.previousRotation, this.currentRotation, alpha);
    const speedRatio = THREE.MathUtils.clamp(
      Math.abs(this.physics.vehicle.currentVehicleSpeed()) /
        RIDE_TUNING.topSpeedMps,
      0,
      1,
    );
    const leanTarget = this.steer * RIDE_TUNING.leanRadians * (0.25 + speedRatio * 0.75);
    this.lean = damp(this.lean, leanTarget, RIDE_TUNING.leanResponse, delta);
    this.visual.lean.rotation.x = this.lean;
    this.visual.frontWheel.rotation.y = -this.steer * RIDE_TUNING.lowSpeedSteer;

    const wheelSpin = this.physics.vehicle.wheelRotation(0) ?? 0;
    this.visual.frontWheel.children[0]?.rotateY(wheelSpin * 0.02);
    this.visual.rearWheel.children[0]?.rotateY(wheelSpin * 0.02);
    this.updateChaseCamera(delta);
  }

  private updateChaseCamera(delta: number) {
    const position = this.visual.root.position;
    const forward = this.cameraForward
      .set(1, 0, 0)
      .applyQuaternion(this.visual.root.quaternion)
      .normalize();
    const pivot = this.cameraPivot.set(
      position.x,
      position.y + 0.92,
      position.z,
    );
    const desired = this.cameraDesired
      .copy(pivot)
      .addScaledVector(forward, -RIDE_TUNING.cameraDistance);
    desired.y += RIDE_TUNING.cameraHeight;
    const direction = this.cameraTravel.copy(desired).sub(pivot);
    const distance = direction.length();
    direction.normalize();
    const hit = this.physics.world.castShape(
      pivot,
      quaternionIdentity,
      direction,
      this.cameraBall,
      0.04,
      distance,
      true,
      undefined,
      undefined,
      this.physics.chassisCollider,
      this.physics.chassis,
    );
    if (hit) desired.copy(pivot).addScaledVector(direction, Math.max(0.45, hit.time_of_impact - 0.18));

    const aim = this.cameraAimTarget
      .copy(pivot)
      .addScaledVector(forward, RIDE_TUNING.cameraLookAhead);
    aim.y += 0.18;
    aim.z += this.steer * 0.55;
    this.cameraPosition.lerp(desired, 1 - Math.exp(-RIDE_TUNING.cameraPositionSharpness * delta));
    this.cameraAim.lerp(aim, 1 - Math.exp(-RIDE_TUNING.cameraAimSharpness * delta));
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraAim);
    this.camera.fov = damp(
      this.camera.fov,
      51 + Math.abs(this.physics.vehicle.currentVehicleSpeed()) * 0.65,
      3,
      delta,
    );
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

  private updateReducedMotionCamera() {
    const target = new THREE.Vector3(-9.5, 0.55, 4.6);
    this.camera.position.set(target.x - 5.2, 3.25, target.z + 3.1);
    this.camera.lookAt(target.x + 2, target.y + 0.7, target.z);
  }

  private setMode(mode: RideControlMode) {
    const changed = this.mode !== mode;
    this.mode = mode;
    this.options.controlSurface.dataset.controlMode = mode;
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
    this.physics.reset(anchor);
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
    if (this.disposed || this.contextLost) return;
    this.contextLost = true;
    this.setMode("paused");
    this.options.onEvent({
      type: "runtime-interrupted",
      reason: "The 3D view is restoring its graphics context.",
    });
  };

  private readonly onContextRestored = () => {
    if (this.disposed || !this.contextLost) return;
    this.contextLost = false;
    this.renderer.resetState();
    this.resize();
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    performance.mark("mall:webgl-context-restored");
    this.options.onEvent({ type: "runtime-ready" });
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

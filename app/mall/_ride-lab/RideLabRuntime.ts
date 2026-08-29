import * as THREE from "three";

import { InputController } from "../_runtime/inputController";
import { createVehicleVisual, type VehicleVisual } from "../_runtime/vehicleVisual";
import { JoltRidePhysics } from "./JoltRidePhysics";
import { RideLabActionController } from "./RideLabActionController";
import { normalizedSpeed, retainTransitionPulse, speedLineStrength } from "./rideLabModel";
import type { RideLabDebugSnapshot, RideLabInput, RideLabLifecycle, RideLabSnapshot } from "./rideLabTypes";
import { requiresRideLabPhysicsRebuild, type RideLabTuning } from "./rideLabTuning";

type RideLabRuntimeOptions = {
  canvas: HTMLCanvasElement;
  surface: HTMLElement;
  tuning: RideLabTuning;
  onLifecycle(lifecycle: RideLabLifecycle): void;
  onSnapshot(snapshot: RideLabDebugSnapshot): void;
};

type RideLabDebugWindow = Window & {
  __rideLabRuntime?: RideLabRuntime;
  __rideLabCounters?: { liveRuntimes: number; animationLoops: number };
};

const counters = { liveRuntimes: 0, animationLoops: 0 };

function damp(current: number, target: number, sharpness: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-sharpness * delta));
}

export class RideLabRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(52, 1, 0.08, 120);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly input: InputController;
  private readonly actionInput: RideLabActionController;
  private readonly vehicle: VehicleVisual;
  private readonly vehiclePose = new THREE.Group();
  private readonly resizeObserver: ResizeObserver;
  private readonly motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly cameraTarget = new THREE.Vector3();
  private readonly cameraDesired = new THREE.Vector3();
  private readonly cameraForward = new THREE.Vector3();
  private readonly preloadOffset = new THREE.Vector3();
  private readonly inverseVehicleRootRotation = new THREE.Quaternion();
  private physics: JoltRidePhysics | null;
  private tuning: RideLabTuning;
  private snapshot: RideLabSnapshot;
  private lifecycle: RideLabLifecycle = "loading";
  private reducedMotion = false;
  private disposed = false;
  private contextLost = false;
  private accumulator = 0;
  private lastFrame = performance.now();
  private lastSnapshotPublished = 0;
  private startTime = performance.now();
  private startupMs = 0;
  private firstFrameMs = 0;
  private renderSamples = 0;
  private frameNumber = 0;
  private renderTotalMs = 0;
  private peakRenderMs = 0;
  private reconfigureGeneration = 0;
  private reconfigureQueue: Promise<void> = Promise.resolve();
  private resetPending = false;
  private presentationInput: RideLabInput = { throttle: 0, brake: 0, steer: 0, reset: false, aerialAction: false };

  private constructor(options: RideLabRuntimeOptions, physics: JoltRidePhysics, context: WebGL2RenderingContext) {
    this.options = options;
    this.physics = physics;
    this.tuning = options.tuning;
    this.snapshot = physics.snapshot();
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, context, antialias: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.scene.background = new THREE.Color(0x11101d);
    this.scene.fog = new THREE.Fog(0x11101d, 34, 82);
    this.createArenaVisuals();
    this.vehicle = createVehicleVisual();
    this.vehicle.root.rotation.y = Math.PI / 2;
    this.vehiclePose.add(this.vehicle.root);
    this.scene.add(this.vehiclePose);
    this.input = new InputController(options.surface);
    this.actionInput = new RideLabActionController(options.surface);
    this.input.setEnabled(true);
    this.actionInput.setEnabled(true);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(options.canvas);
    options.canvas.addEventListener("webglcontextlost", this.onContextLost);
    options.canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.motionQuery.addEventListener("change", this.onMotionChange);
    this.reducedMotion = this.motionQuery.matches;
    counters.liveRuntimes += 1;
    (window as RideLabDebugWindow).__rideLabCounters = counters;
    (window as RideLabDebugWindow).__rideLabRuntime = this;
    this.resize();
  }

  private readonly options: RideLabRuntimeOptions;

  static async create(options: RideLabRuntimeOptions) {
    const started = performance.now();
    const context = options.canvas.getContext("webgl2", { antialias: true, powerPreference: "high-performance" });
    if (!context) throw new Error("rideLab requires WebGL 2.");
    const physics = await JoltRidePhysics.create(options.tuning);
    const runtime = new RideLabRuntime(options, physics, context);
    runtime.startTime = started;
    runtime.startupMs = performance.now() - started;
    return runtime;
  }

  start() {
    if (this.disposed || this.lifecycle === "active") return;
    this.setLifecycle("active");
    this.lastFrame = performance.now();
    counters.animationLoops += 1;
    this.renderer.setAnimationLoop(this.frame);
  }

  pause() {
    if (this.disposed || this.lifecycle !== "active") return;
    this.setLifecycle("paused");
    this.input.setEnabled(false);
    this.cancelAerialInput(true);
  }

  resume() {
    if (this.disposed || this.contextLost) return;
    this.input.setEnabled(true);
    this.actionInput.setEnabled(true);
    this.lastFrame = performance.now();
    this.setLifecycle("active");
  }

  setVirtualInput(input: Partial<RideLabInput>) {
    const mapped: Parameters<InputController["setVirtual"]>[0] = {};
    if ("throttle" in input) mapped.throttle = input.throttle;
    if ("brake" in input) mapped.brakeReverse = input.brake;
    if ("steer" in input) mapped.steer = input.steer;
    if ("reset" in input) mapped.reset = input.reset;
    this.input.setVirtual(mapped);
    if ("aerialAction" in input) this.actionInput.setVirtual(Boolean(input.aerialAction));
  }

  setScenario(scenario: "start" | "wall-grind") {
    this.physics?.setScenario(scenario);
    if (this.physics) this.snapshot = this.physics.snapshot();
    this.accumulator = 0;
    this.publishSnapshot(performance.now(), true);
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    this.publishSnapshot(performance.now(), true);
  }

  async reconfigure(tuning: RideLabTuning) {
    if (this.disposed) return;
    if (!requiresRideLabPhysicsRebuild(this.tuning, tuning)) {
      this.tuning = tuning;
      this.publishSnapshot(performance.now(), true);
      return;
    }
    const generation = ++this.reconfigureGeneration;
    this.setLifecycle("loading");
    this.input.setEnabled(false);
    this.actionInput.setEnabled(false);
    const operation = this.reconfigureQueue.catch(() => undefined).then(async () => {
      if (this.disposed || generation !== this.reconfigureGeneration) return;
      this.physics?.dispose();
      this.physics = null;
      let replacement: JoltRidePhysics;
      try {
        replacement = await JoltRidePhysics.create(tuning);
      } catch (error) {
        if (!this.disposed && generation === this.reconfigureGeneration) this.setLifecycle("paused");
        throw error;
      }
      if (this.disposed || generation !== this.reconfigureGeneration) {
        replacement.dispose();
        return;
      }
      this.physics = replacement;
      this.tuning = tuning;
      this.snapshot = replacement.snapshot();
      this.accumulator = 0;
      this.resetPending = false;
      this.resume();
    });
    this.reconfigureQueue = operation.catch(() => undefined);
    await operation;
  }

  getDebugSnapshot(): RideLabDebugSnapshot {
    return {
      ...this.snapshot,
      lifecycle: this.lifecycle,
      engine: "Jolt MotorcycleController",
      startupMs: this.startupMs,
      firstFrameMs: this.firstFrameMs,
      averageRenderMs: this.renderSamples ? this.renderTotalMs / this.renderSamples : 0,
      peakRenderMs: this.peakRenderMs,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      reducedMotion: this.reducedMotion,
      liveRuntimes: counters.liveRuntimes,
      animationLoops: counters.animationLoops,
      cameraPosition: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.reconfigureGeneration += 1;
    this.setLifecycle("disposed");
    this.renderer.setAnimationLoop(null);
    counters.animationLoops = Math.max(0, counters.animationLoops - 1);
    counters.liveRuntimes = Math.max(0, counters.liveRuntimes - 1);
    this.resizeObserver.disconnect();
    this.input.dispose();
    this.actionInput.dispose();
    this.motionQuery.removeEventListener("change", this.onMotionChange);
    this.options.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.options.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.physics?.dispose();
    this.physics = null;
    this.vehicle.dispose();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    this.scene.clear();
    this.renderer.dispose();
    const debugWindow = window as RideLabDebugWindow;
    if (debugWindow.__rideLabRuntime === this) delete debugWindow.__rideLabRuntime;
  }

  private readonly frame = (time: number) => {
    if (this.disposed || this.contextLost) return;
    const renderStarted = performance.now();
    const delta = Math.min((time - this.lastFrame) / 1000, 0.1);
    this.lastFrame = time;
    if (this.lifecycle === "active" && !document.hidden) {
      const sampled = this.input.read();
      if (sampled.reset) this.actionInput.releaseHeldAction();
      this.presentationInput = {
        throttle: sampled.throttle,
        brake: sampled.brakeReverse,
        steer: sampled.steer,
        reset: sampled.reset,
        aerialAction: sampled.reset ? false : this.actionInput.read(),
      };
      this.resetPending ||= sampled.reset;
      this.accumulator += delta;
      let steps = 0;
      let retainedPulse: RideLabSnapshot["eventPulse"] | null = null;
      let retainedMovementTransition: RideLabSnapshot["movementTransition"] = "idle";
      while (this.physics && this.accumulator >= this.tuning.fixedStep && steps < this.tuning.maxCatchUpSteps) {
        this.snapshot = this.physics.step({ ...this.presentationInput, reset: this.resetPending });
        retainedPulse = retainTransitionPulse(retainedPulse, this.snapshot.eventPulse);
        if (retainedMovementTransition === "idle" && this.snapshot.movementTransition !== "idle") retainedMovementTransition = this.snapshot.movementTransition;
        this.resetPending = false;
        this.accumulator -= this.tuning.fixedStep;
        steps += 1;
      }
      if (retainedPulse) this.snapshot = { ...this.snapshot, eventPulse: retainedPulse };
      if (retainedMovementTransition !== "idle") this.snapshot = { ...this.snapshot, movementTransition: retainedMovementTransition };
      if (steps === this.tuning.maxCatchUpSteps) this.accumulator = 0;
    }
    this.updateVisuals(delta);
    this.renderer.render(this.scene, this.camera);
    this.frameNumber += 1;
    this.options.surface.dataset.frame = String(this.frameNumber);
    const renderMs = performance.now() - renderStarted;
    this.renderSamples += 1;
    this.renderTotalMs += renderMs;
    this.peakRenderMs = Math.max(this.peakRenderMs, renderMs);
    if (!this.firstFrameMs) this.firstFrameMs = performance.now() - this.startTime;
    this.publishSnapshot(time);
  };

  private updateVisuals(delta: number) {
    const { position, rotation } = this.snapshot;
    this.vehiclePose.position.set(position.x, position.y, position.z);
    this.vehiclePose.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    const loadDelta = clampLoad(this.snapshot.rearSuspensionLoad - this.snapshot.frontSuspensionLoad);
    this.vehicle.root.position.y = -Math.min(0.12, (this.snapshot.frontSuspensionLoad + this.snapshot.rearSuspensionLoad) / 500);
    this.vehicle.root.rotation.x = loadDelta * 0.045;
    this.inverseVehicleRootRotation.copy(this.vehicle.root.quaternion).invert();
    this.preloadOffset
      .set(0, -this.snapshot.preload * this.tuning.preloadCompression, 0)
      .applyQuaternion(this.inverseVehicleRootRotation);
    this.vehicle.body.position.copy(this.preloadOffset);
    const speedRatio = normalizedSpeed(this.snapshot.speedMps, this.tuning.topSpeedMps);
    const forward = this.cameraForward.set(0, 0, 1).applyQuaternion(this.vehiclePose.quaternion).normalize();
    this.cameraTarget.set(position.x, position.y + 0.72, position.z).addScaledVector(forward, 1.6 + speedRatio * 1.5);
    this.cameraDesired.set(position.x, position.y + this.tuning.cameraHeight, position.z).addScaledVector(forward, -this.tuning.cameraDistance - speedRatio * 1.1);
    const sharpness = this.reducedMotion ? 20 : this.tuning.cameraLag;
    this.camera.position.lerp(this.cameraDesired, 1 - Math.exp(-sharpness * delta));
    this.camera.lookAt(this.cameraTarget);
    this.camera.fov = this.reducedMotion ? 52 : damp(this.camera.fov, 52 + speedRatio * this.tuning.speedFovGain, 4, delta);
    this.camera.updateProjectionMatrix();
    const lines = this.reducedMotion ? 0 : speedLineStrength(this.snapshot.speedMps, this.snapshot.accelerationMps2, this.tuning);
    this.options.surface.style.setProperty("--ride-line-strength", lines.toFixed(3));
    const transition = this.snapshot.movementTransition !== "idle" || this.snapshot.eventPulse === "reset" || this.snapshot.eventPulse === "ollie";
    const feedback = this.presentationInput.reset ? "reset"
      : this.presentationInput.aerialAction ? this.snapshot.grinding ? "grind" : this.snapshot.grounded ? "preload" : this.snapshot.aerialPhase === "depleted" ? "depleted" : "hover"
      : this.presentationInput.brake > 0 ? "brake"
        : this.presentationInput.throttle > 0 ? "throttle"
          : Math.abs(this.presentationInput.steer) > 0 ? "steer"
            : this.snapshot.eventPulse;
    this.options.surface.dataset.feedback = feedback;
    this.options.surface.dataset.transition = this.snapshot.movementTransition !== "idle"
      ? this.snapshot.movementTransition
      : transition ? this.snapshot.eventPulse : "idle";
    this.options.surface.dataset.grounded = String(this.snapshot.grounded);
    this.options.surface.dataset.acceptedThrottle = String(this.presentationInput.throttle);
    this.options.surface.dataset.acceptedBrake = String(this.presentationInput.brake);
    this.options.surface.dataset.acceptedSteer = String(this.presentationInput.steer);
    this.options.surface.dataset.acceptedAction = String(this.presentationInput.aerialAction);
    this.options.surface.dataset.preload = this.snapshot.preload.toFixed(3);
    this.options.surface.dataset.visualCompression = (this.snapshot.preload * this.tuning.preloadCompression).toFixed(3);
    this.options.surface.dataset.hoverEnergy = this.snapshot.hoverEnergy.toFixed(3);
    this.options.surface.dataset.aerialPhase = this.snapshot.aerialPhase;
    this.options.surface.dataset.grinding = String(this.snapshot.grinding);
  }

  private publishSnapshot(time: number, force = false) {
    if (!force && time - this.lastSnapshotPublished < 100) return;
    this.lastSnapshotPublished = time;
    this.options.onSnapshot(this.getDebugSnapshot());
  }

  private setLifecycle(lifecycle: RideLabLifecycle) {
    this.lifecycle = lifecycle;
    this.options.surface.dataset.lifecycle = lifecycle;
    this.options.onLifecycle(lifecycle);
  }

  private readonly resize = () => {
    const width = Math.max(1, this.options.canvas.clientWidth);
    const height = Math.max(1, this.options.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.input.setEnabled(false);
    this.cancelAerialInput(true);
    this.setLifecycle("context-lost");
  };

  private readonly onContextRestored = () => {
    this.contextLost = false;
    this.renderer.resetState();
    this.resume();
  };

  private readonly onMotionChange = (event: MediaQueryListEvent) => this.setReducedMotion(event.matches);

  private readonly onVisibilityChange = () => {
    if (document.hidden) this.cancelAerialInput(false);
  };

  private cancelAerialInput(disableController: boolean) {
    if (disableController) this.actionInput.setEnabled(false);
    else this.actionInput.releaseHeldAction();
    this.physics?.cancelAerialAction();
    if (this.physics) this.snapshot = this.physics.snapshot();
    this.presentationInput = { ...this.presentationInput, aerialAction: false };
    this.options.surface.dataset.acceptedAction = "false";
  }

  private createArenaVisuals() {
    const hemi = new THREE.HemisphereLight(0xe7ddff, 0x342047, 2.2);
    const key = new THREE.DirectionalLight(0xffd4ac, 3.1);
    key.position.set(-12, 18, -8);
    key.castShadow = true;
    this.scene.add(hemi, key);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(48, 1, 48), new THREE.MeshToonMaterial({ color: 0x24213b }));
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const grid = new THREE.GridHelper(48, 48, 0xff4f9a, 0x4f4970);
    grid.position.y = 0.01;
    this.scene.add(grid);
    const wallMaterial = new THREE.MeshToonMaterial({ color: 0x3b315b });
    for (const [x, y, z, sx, sy, sz] of [[0, 5.5, 24, 48, 12, 0.7], [0, 5.5, -24, 48, 12, 0.7], [24, 5.5, 0, 0.7, 12, 48], [-24, 5.5, 0, 0.7, 12, 48]] as const) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMaterial.clone());
      wall.position.set(x, y, z);
      this.scene.add(wall);
    }
    const rampMaterial = new THREE.MeshToonMaterial({ color: 0x38cfd1 });
    for (const [x, y, z, rotation, width, length] of [[7, 0.35, 9, -0.2, 7, 10], [-9, 0.7, -6, 0.3, 8, 12]] as const) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(width, 0.44, length), rampMaterial.clone());
      ramp.position.set(x, y, z);
      ramp.rotation.x = rotation;
      ramp.receiveShadow = true;
      this.scene.add(ramp);
    }
  }
}

function clampLoad(value: number) {
  return Math.max(-1, Math.min(1, value / 28));
}

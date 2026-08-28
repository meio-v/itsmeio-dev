export type RideLabInput = {
  throttle: number;
  brake: number;
  steer: number;
  reset: boolean;
  aerialAction: boolean;
};

export type ResolvedRideIntent = {
  throttle: number;
  brake: number;
  steer: number;
};

export type RideLabSnapshot = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  speedMps: number;
  horizontalSpeedMps: number;
  accelerationMps2: number;
  verticalSpeedMps: number;
  leanRadians: number;
  grounded: boolean;
  wheelContacts: number;
  frontSuspensionLoad: number;
  rearSuspensionLoad: number;
  rearSlip: number;
  preload: number;
  hoverEnergy: number;
  airtimeSeconds: number;
  aerialPhase: "grounded" | "preload" | "airborne" | "hover" | "grind" | "depleted";
  grinding: boolean;
  grindReleaseSpeedMps: number;
  acceptedInput: RideLabInput;
  eventPulse: "idle" | "throttle" | "brake" | "steer" | "reset" | "takeoff" | "landing" | "preload" | "ollie" | "hover" | "grind" | "depleted";
  movementTransition: "idle" | "takeoff" | "landing";
  intent: ResolvedRideIntent;
};

export type RideLabLifecycle = "loading" | "active" | "paused" | "context-lost" | "disposed";

export type RideLabDebugSnapshot = RideLabSnapshot & {
  lifecycle: RideLabLifecycle;
  engine: "Jolt MotorcycleController";
  startupMs: number;
  firstFrameMs: number;
  averageRenderMs: number;
  peakRenderMs: number;
  drawCalls: number;
  triangles: number;
  reducedMotion: boolean;
  liveRuntimes: number;
  animationLoops: number;
  cameraPosition: { x: number; y: number; z: number };
};

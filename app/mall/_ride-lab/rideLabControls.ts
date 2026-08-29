import type { RideLabTuning } from "./rideLabTuning.ts";

export type RideLabTuningGroup = "Drivetrain" | "Braking" | "Steering & assist" | "Chassis & suspension" | "Aerial & grind" | "Camera & feedback" | "Jolt advanced";

export type RideLabControl = {
  key: keyof RideLabTuning;
  label: string;
  group: RideLabTuningGroup;
  step: number;
  description: string;
};

const control = (key: keyof RideLabTuning, label: string, group: RideLabTuningGroup, step: number, description: string): RideLabControl => ({ key, label, group, step, description });

export const RIDE_LAB_CONTROLS: readonly RideLabControl[] = [
  control("engineTorque", "Engine torque", "Drivetrain", 5, "Peak force delivered by Jolt's motorcycle engine."),
  control("engineInertia", "Engine inertia", "Drivetrain", 0.05, "How slowly engine speed reacts to throttle changes."),
  control("throttleRise", "Throttle spool", "Drivetrain", 0.1, "Rate at which held gas resolves into drive input."),
  control("throttleFall", "Throttle release", "Drivetrain", 0.1, "Rate at which drive input decays after release."),
  control("topSpeedMps", "Assisted top speed", "Drivetrain", 0.5, "Speed where drive input starts tapering, in metres per second."),
  control("linearDamping", "Coast drag", "Drivetrain", 0.01, "Jolt linear damping; lower values preserve momentum longer."),
  control("brakeRise", "Brake pressure rise", "Braking", 0.1, "Rate at which the binary brake input becomes full pressure."),
  control("brakeFall", "Brake release", "Braking", 0.1, "Rate at which pressure and grip recover after release."),
  control("frontBrakeTorque", "Front brake torque", "Braking", 10, "Maximum front-wheel braking torque."),
  control("rearBrakeTorque", "Rear brake torque", "Braking", 10, "Maximum rear-wheel braking torque before handbrake bias."),
  control("maxSteerRadians", "Maximum steer", "Steering & assist", 0.01, "Maximum physical front-wheel steering angle."),
  control("riderWeightShiftRatio", "Rider weight shift", "Steering & assist", 0.05, "Share of turn intent applied as rider lean; the remainder reaches the handlebars."),
  control("riderWeightShiftMeters", "Rider shift reach", "Steering & assist", 0.01, "Maximum lateral rider center-of-mass shift used to calculate roll torque, in metres."),
  control("riderWeightShiftStartSpeedMps", "Rider shift start speed", "Steering & assist", 0.1, "Ground speed where rider-shift torque begins to engage, in metres per second."),
  control("riderWeightShiftFullSpeedMps", "Rider shift full speed", "Steering & assist", 0.1, "Ground speed where rider-shift torque reaches full effect, in metres per second."),
  control("steerRise", "Weight-shift response", "Steering & assist", 0.1, "Rate at which direction intent reaches the controller."),
  control("steerReturn", "Assisted recovery", "Steering & assist", 0.1, "Rate at which released steering requests neutral."),
  control("maxLeanRadians", "Maximum lean", "Steering & assist", 0.01, "Maximum roll angle allowed by the motorcycle constraint."),
  control("rideAssist", "Ride assist", "Steering & assist", 0.01, "Scales Jolt's lean stabilization while preserving physical momentum."),
  control("massKg", "Moped and rider mass", "Chassis & suspension", 5, "Combined simulated mass in kilograms."),
  control("centerOfMassDrop", "Centre-of-mass drop", "Chassis & suspension", 0.01, "Lowers mass inside the visible chassis to improve stability."),
  control("wheelRadius", "Wheel radius", "Chassis & suspension", 0.01, "Physical radius used for both wheel collision casts."),
  control("suspensionMin", "Minimum suspension", "Chassis & suspension", 0.01, "Shortest allowed suspension length."),
  control("suspensionMax", "Maximum suspension", "Chassis & suspension", 0.01, "Longest allowed suspension length."),
  control("frontSuspensionFrequency", "Front suspension", "Chassis & suspension", 0.05, "Front spring frequency; higher values feel firmer."),
  control("rearSuspensionFrequency", "Rear suspension", "Chassis & suspension", 0.05, "Rear spring frequency; higher values feel firmer."),
  control("preloadChargeSeconds", "Preload time", "Aerial & grind", 0.05, "Seconds of grounded Space hold needed to fully load the ollie."),
  control("preloadCompression", "Visible compression", "Aerial & grind", 0.01, "Maximum visible chassis compression while preload is held."),
  control("ollieMinImpulse", "Minimum ollie impulse", "Aerial & grind", 25, "Upward impulse produced by a short valid preload release."),
  control("ollieMaxImpulse", "Maximum ollie impulse", "Aerial & grind", 25, "Upward impulse produced by a fully charged preload release."),
  control("hoverForce", "Hover force", "Aerial & grind", 50, "Upward Jolt force applied while Space is held in open air."),
  control("hoverDurationSeconds", "Hover duration", "Aerial & grind", 0.1, "Seconds a full resource meter can sustain hover or grind."),
  control("hoverRechargeSeconds", "Ground recharge", "Aerial & grind", 0.1, "Grounded seconds needed to recharge an empty hover meter."),
  control("grindCaptureDistance", "Grind capture distance", "Aerial & grind", 0.05, "Maximum distance from an arena wall where airborne Space can latch a grind."),
  control("grindFallSpeed", "Grind fall speed", "Aerial & grind", 0.1, "Maximum downward speed while a valid wall grind is held."),
  control("cameraDistance", "Follow distance", "Camera & feedback", 0.1, "Base chase-camera distance."),
  control("cameraHeight", "Camera height", "Camera & feedback", 0.1, "Base chase-camera height."),
  control("cameraLag", "Camera lag", "Camera & feedback", 0.1, "Follow response; lower values communicate more acceleration lag."),
  control("speedFovGain", "Speed FOV gain", "Camera & feedback", 0.5, "Extra field of view blended in at top speed."),
  control("speedLineThreshold", "Speed-line threshold", "Camera & feedback", 0.5, "Minimum speed before sustained streaks appear."),
  control("speedLineIntensity", "Speed-line intensity", "Camera & feedback", 0.05, "Maximum speed-line opacity and travel."),
  control("feedbackIntensity", "Global feedback", "Camera & feedback", 0.05, "Presentation-only multiplier; it never changes physics."),
  control("fixedStep", "Fixed step", "Jolt advanced", 0.001, "Simulation interval in seconds. Defaults to 60 Hz."),
  control("maxCatchUpSteps", "Catch-up steps", "Jolt advanced", 1, "Maximum fixed updates allowed in one rendered frame."),
  control("leanSpring", "Lean PID spring", "Jolt advanced", 10, "Jolt motorcycle lean-controller spring constant."),
  control("leanDamping", "Lean PID damping", "Jolt advanced", 1, "Jolt motorcycle lean-controller damping."),
];

export const RIDE_LAB_SCHEMA_VERSION = 12;

const PRESENTATION_KEYS = new Set<keyof RideLabTuning>([
  "cameraDistance",
  "cameraNearDistance",
  "cameraNearFov",
  "cameraCruiseSpeedMps",
  "cameraThrottlePunchDistance",
  "cameraThrottlePunchFov",
  "cameraThrottlePunchDecay",
  "cameraSteerOrbitRadians",
  "cameraSteerOrbitResponse",
  "cameraHeight",
  "cameraLag",
  "speedFovGain",
  "speedLineThreshold",
  "speedLineOnsetOpacity",
  "speedLineBurstOpacity",
  "speedLineBurstDecay",
  "speedLineIntensity",
  "feedbackIntensity",
  "preloadCompression",
]);

export type RideLabTuning = {
  fixedStep: number;
  maxCatchUpSteps: number;
  engineTorque: number;
  engineInertia: number;
  highSpeedTorqueStartMps: number;
  highSpeedTorqueEndMps: number;
  highSpeedTorqueMultiplier: number;
  throttleRise: number;
  throttleFall: number;
  topSpeedMps: number;
  linearDamping: number;
  brakeRise: number;
  brakeFall: number;
  frontBrakeTorque: number;
  rearBrakeTorque: number;
  maxSteerRadians: number;
  riderWeightShiftRatio: number;
  riderWeightShiftMeters: number;
  riderWeightShiftStartSpeedMps: number;
  riderWeightShiftFullSpeedMps: number;
  turnAssist: number;
  turnAssistRadiusMeters: number;
  turnAssistMaxYawRate: number;
  steerRise: number;
  steerReturn: number;
  maxLeanRadians: number;
  leanSpring: number;
  leanDamping: number;
  rideAssist: number;
  massKg: number;
  centerOfMassDrop: number;
  wheelRadius: number;
  suspensionMin: number;
  suspensionMax: number;
  frontSuspensionFrequency: number;
  rearSuspensionFrequency: number;
  preloadChargeSeconds: number;
  preloadCompression: number;
  ollieMinImpulse: number;
  ollieMaxImpulse: number;
  hoverForce: number;
  hoverDurationSeconds: number;
  hoverRechargeSeconds: number;
  grindCaptureDistance: number;
  grindFallSpeed: number;
  cameraDistance: number;
  cameraNearDistance: number;
  cameraNearFov: number;
  cameraCruiseSpeedMps: number;
  cameraThrottlePunchDistance: number;
  cameraThrottlePunchFov: number;
  cameraThrottlePunchDecay: number;
  cameraSteerOrbitRadians: number;
  cameraSteerOrbitResponse: number;
  cameraHeight: number;
  cameraLag: number;
  speedFovGain: number;
  speedLineThreshold: number;
  speedLineOnsetOpacity: number;
  speedLineBurstOpacity: number;
  speedLineBurstDecay: number;
  speedLineIntensity: number;
  feedbackIntensity: number;
};

export const DEFAULT_RIDE_LAB_TUNING: Readonly<RideLabTuning> = Object.freeze({
  fixedStep: 1 / 60,
  maxCatchUpSteps: 4,
  engineTorque: 172.5,
  engineInertia: 0.9,
  highSpeedTorqueStartMps: 40 / 3.6,
  highSpeedTorqueEndMps: 80 / 3.6,
  highSpeedTorqueMultiplier: 0.45,
  throttleRise: 2.4,
  throttleFall: 3.2,
  topSpeedMps: 32,
  linearDamping: 0.072,
  brakeRise: 5.5,
  brakeFall: 8,
  frontBrakeTorque: 500,
  rearBrakeTorque: 250,
  maxSteerRadians: Math.PI / 6,
  riderWeightShiftRatio: 0.8,
  riderWeightShiftMeters: 0.18,
  riderWeightShiftStartSpeedMps: 1,
  riderWeightShiftFullSpeedMps: 5,
  turnAssist: 0.75,
  turnAssistRadiusMeters: 28.8,
  turnAssistMaxYawRate: 0.65,
  steerRise: 4,
  steerReturn: 0.625,
  maxLeanRadians: 0.3,
  leanSpring: 500,
  leanDamping: 30,
  rideAssist: 0.82,
  massKg: 180,
  centerOfMassDrop: 0.3,
  wheelRadius: 0.31,
  suspensionMin: 0.18,
  suspensionMax: 0.42,
  frontSuspensionFrequency: 2,
  rearSuspensionFrequency: 2.35,
  preloadChargeSeconds: 0.7,
  preloadCompression: 0.18,
  ollieMinImpulse: 450,
  ollieMaxImpulse: 1100,
  hoverForce: 2200,
  hoverDurationSeconds: 3,
  hoverRechargeSeconds: 1.5,
  grindCaptureDistance: 1,
  grindFallSpeed: 1.5,
  cameraDistance: 5.6,
  cameraNearDistance: 4.4,
  cameraNearFov: 48,
  cameraCruiseSpeedMps: 30 / 3.6,
  cameraThrottlePunchDistance: 0.65,
  cameraThrottlePunchFov: 2,
  cameraThrottlePunchDecay: 8,
  cameraSteerOrbitRadians: 8 * Math.PI / 180,
  cameraSteerOrbitResponse: 2.5,
  cameraHeight: 2.15,
  cameraLag: 5.5,
  speedFovGain: 13,
  speedLineThreshold: 40 / 3.6,
  speedLineOnsetOpacity: 0.04,
  speedLineBurstOpacity: 0.15,
  speedLineBurstDecay: 10,
  speedLineIntensity: 0.8,
  feedbackIntensity: 1,
});

export type RideLabPresetName = "balanced" | "grippy" | "loose";

export const RIDE_LAB_PRESETS: Readonly<Record<RideLabPresetName, Readonly<RideLabTuning>>> = {
  balanced: DEFAULT_RIDE_LAB_TUNING,
  grippy: Object.freeze({
    ...DEFAULT_RIDE_LAB_TUNING,
    rideAssist: 0.94,
    maxLeanRadians: 0.26,
    steerReturn: 0.8,
    rearBrakeTorque: 210,
  }),
  loose: Object.freeze({
    ...DEFAULT_RIDE_LAB_TUNING,
    rideAssist: 0.55,
    maxLeanRadians: 0.4,
    steerReturn: 0.45,
    rearBrakeTorque: 330,
  }),
};

const limits: Record<keyof RideLabTuning, readonly [number, number]> = {
  fixedStep: [1 / 120, 1 / 30], maxCatchUpSteps: [1, 8], engineTorque: [40, 400], engineInertia: [0.05, 2],
  highSpeedTorqueStartMps: [5, 30], highSpeedTorqueEndMps: [10, 40], highSpeedTorqueMultiplier: [0.1, 1],
  throttleRise: [0.25, 12], throttleFall: [0.25, 12], topSpeedMps: [5, 40], linearDamping: [0, 2],
  brakeRise: [0.25, 16], brakeFall: [0.25, 20], frontBrakeTorque: [50, 1500], rearBrakeTorque: [20, 1200],
  maxSteerRadians: [0.08, 0.9], riderWeightShiftRatio: [0, 1], riderWeightShiftMeters: [0.02, 0.5],
  riderWeightShiftStartSpeedMps: [0, 10], riderWeightShiftFullSpeedMps: [0.5, 20],
  turnAssist: [0, 1], turnAssistRadiusMeters: [8, 80], turnAssistMaxYawRate: [0.1, 1.2],
  steerRise: [0.25, 16], steerReturn: [0.25, 20], maxLeanRadians: [0.25, 1.45],
  leanSpring: [20, 1500], leanDamping: [1, 150], rideAssist: [0, 1], massKg: [70, 420], centerOfMassDrop: [0.05, 0.8],
  wheelRadius: [0.15, 0.7], suspensionMin: [0.02, 0.6], suspensionMax: [0.08, 1],
  frontSuspensionFrequency: [0.25, 8], rearSuspensionFrequency: [0.25, 8], cameraDistance: [2.5, 12], cameraNearDistance: [2.5, 12],
  cameraNearFov: [35, 70], cameraCruiseSpeedMps: [1, 30], cameraThrottlePunchDistance: [0, 2],
  cameraThrottlePunchFov: [0, 8], cameraThrottlePunchDecay: [1, 20], cameraHeight: [0.5, 6],
  cameraSteerOrbitRadians: [0, 0.35], cameraSteerOrbitResponse: [0.25, 12],
  preloadChargeSeconds: [0.2, 2.5], preloadCompression: [0.04, 0.3], ollieMinImpulse: [150, 1600], ollieMaxImpulse: [300, 2400],
  hoverForce: [500, 5000], hoverDurationSeconds: [0.5, 8], hoverRechargeSeconds: [0.5, 8], grindCaptureDistance: [0.2, 2.5], grindFallSpeed: [0.2, 5],
  cameraLag: [0.5, 20], speedFovGain: [0, 30], speedLineThreshold: [0, 30], speedLineOnsetOpacity: [0, 0.5],
  speedLineBurstOpacity: [0, 1], speedLineBurstDecay: [1, 20], speedLineIntensity: [0, 2], feedbackIntensity: [0, 2],
};

export function sanitizeRideLabTuning(value: unknown): RideLabTuning {
  const source = value && typeof value === "object" ? value as Partial<RideLabTuning> : {};
  const result = { ...DEFAULT_RIDE_LAB_TUNING };
  for (const key of Object.keys(result) as (keyof RideLabTuning)[]) {
    const candidate = source[key];
    if (typeof candidate !== "number" || !Number.isFinite(candidate)) continue;
    const [min, max] = limits[key];
    result[key] = Math.min(max, Math.max(min, candidate));
  }
  result.maxCatchUpSteps = Math.round(result.maxCatchUpSteps);
  result.highSpeedTorqueEndMps = Math.max(result.highSpeedTorqueEndMps, result.highSpeedTorqueStartMps + 1);
  result.cameraNearDistance = Math.min(result.cameraNearDistance, result.cameraDistance);
  result.cameraCruiseSpeedMps = Math.min(result.cameraCruiseSpeedMps, result.topSpeedMps - 1);
  result.riderWeightShiftFullSpeedMps = Math.max(result.riderWeightShiftFullSpeedMps, result.riderWeightShiftStartSpeedMps + 0.5);
  result.suspensionMax = Math.max(result.suspensionMax, result.suspensionMin + 0.04);
  result.ollieMaxImpulse = Math.max(result.ollieMaxImpulse, result.ollieMinImpulse);
  return result;
}

export function serializeRideLabTuning(tuning: RideLabTuning) {
  return JSON.stringify({ version: RIDE_LAB_SCHEMA_VERSION, tuning: sanitizeRideLabTuning(tuning) });
}

export function parseRideLabTuning(serialized: string): RideLabTuning | null {
  try {
    const parsed = JSON.parse(serialized) as { version?: unknown; tuning?: unknown };
    if (parsed.version !== RIDE_LAB_SCHEMA_VERSION) return null;
    return sanitizeRideLabTuning(parsed.tuning);
  } catch {
    return null;
  }
}

export function getRideLabTuningLimits() {
  return limits;
}

export function requiresRideLabPhysicsRebuild(current: RideLabTuning, next: RideLabTuning) {
  return (Object.keys(current) as (keyof RideLabTuning)[]).some((key) => !PRESENTATION_KEYS.has(key) && current[key] !== next[key]);
}

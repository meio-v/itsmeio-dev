import type { RideLabInput, ResolvedRideIntent } from "./rideLabTypes.ts";
import type { RideLabTuning } from "./rideLabTuning.ts";
import type { RideLabSnapshot } from "./rideLabTypes.ts";

function moveTowards(current: number, target: number, rate: number, delta: number) {
  const distance = target - current;
  return current + Math.sign(distance) * Math.min(Math.abs(distance), rate * delta);
}

export function advanceRideIntent(
  current: ResolvedRideIntent,
  input: RideLabInput,
  tuning: RideLabTuning,
  delta: number,
): ResolvedRideIntent {
  return {
    throttle: moveTowards(current.throttle, input.throttle, input.throttle > current.throttle ? tuning.throttleRise : tuning.throttleFall, delta),
    brake: moveTowards(current.brake, input.brake, input.brake > current.brake ? tuning.brakeRise : tuning.brakeFall, delta),
    steer: moveTowards(current.steer, input.steer, input.steer === 0 ? tuning.steerReturn : tuning.steerRise, delta),
  };
}

export function normalizedSpeed(speedMps: number, topSpeedMps: number) {
  return Math.min(1, Math.max(0, Math.abs(speedMps) / topSpeedMps));
}

export function resolveTouchSteer(leftPressed: boolean, rightPressed: boolean) {
  return Number(rightPressed) - Number(leftPressed);
}

export function longitudinalSpeed(
  velocity: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number; w: number },
) {
  const forwardX = 2 * (rotation.x * rotation.z + rotation.w * rotation.y);
  const forwardY = 2 * (rotation.y * rotation.z - rotation.w * rotation.x);
  const forwardZ = 1 - 2 * (rotation.x * rotation.x + rotation.y * rotation.y);
  return velocity.x * forwardX + velocity.y * forwardY + velocity.z * forwardZ;
}

export function speedLineStrength(speedMps: number, accelerationMps2: number, tuning: RideLabTuning) {
  if (speedMps < tuning.speedLineThreshold) return 0;
  const speed = (speedMps - tuning.speedLineThreshold) / Math.max(1, tuning.topSpeedMps - tuning.speedLineThreshold);
  const accelerationLead = Math.max(0, accelerationMps2) / 8;
  return Math.min(1, Math.max(0, speed + accelerationLead * 0.25)) * tuning.speedLineIntensity * tuning.feedbackIntensity;
}

export function retainTransitionPulse(
  retained: RideLabSnapshot["eventPulse"] | null,
  next: RideLabSnapshot["eventPulse"],
) {
  if (retained === "reset" || retained === "takeoff" || retained === "landing") return retained;
  return next === "reset" || next === "takeoff" || next === "landing" ? next : null;
}

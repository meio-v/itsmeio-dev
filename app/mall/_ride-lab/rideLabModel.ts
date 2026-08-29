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

export function resolveSuspensionLoadPresentation(loadDifference: number) {
  const normalizedLoad = Math.max(-1, Math.min(1, loadDifference / 28));
  return {
    pitchRadians: normalizedLoad * 0.045,
    rollRadians: 0,
  };
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

export function signedLeanRadians(rotation: { x: number; y: number; z: number; w: number }) {
  const upX = 2 * (rotation.x * rotation.y - rotation.w * rotation.z);
  const upY = 1 - 2 * (rotation.x * rotation.x + rotation.z * rotation.z);
  const upZ = 2 * (rotation.y * rotation.z + rotation.w * rotation.x);
  const forwardX = 2 * (rotation.x * rotation.z + rotation.w * rotation.y);
  const forwardZ = 1 - 2 * (rotation.x * rotation.x + rotation.y * rotation.y);
  const correctionAlongForward = -upZ * forwardX + upX * forwardZ;
  const upAlongWorldUp = upY;
  return Math.atan2(-correctionAlongForward, upAlongWorldUp);
}

export type AerialMechanicPhase = "grounded" | "preload" | "airborne" | "hover" | "grind" | "depleted";

export type AerialMechanicState = {
  preload: number;
  hoverEnergy: number;
  airtimeSeconds: number;
  phase: AerialMechanicPhase;
  actionWasHeld: boolean;
  airborneBlockedUntilRelease: boolean;
};

export type AerialMechanicEvent = "idle" | "preload" | "ollie" | "hover" | "grind" | "depleted";

export function createAerialMechanicState(): AerialMechanicState {
  return { preload: 0, hoverEnergy: 1, airtimeSeconds: 0, phase: "grounded", actionWasHeld: false, airborneBlockedUntilRelease: false };
}

export function advanceAerialMechanic(
  current: AerialMechanicState,
  input: { actionHeld: boolean; grounded: boolean; wallEligible: boolean },
  tuning: RideLabTuning,
  delta: number,
) {
  if (input.grounded) {
    const hoverEnergy = Math.min(1, current.hoverEnergy + delta / tuning.hoverRechargeSeconds);
    if (input.actionHeld) {
      return {
        state: {
          preload: Math.min(1, current.preload + delta / tuning.preloadChargeSeconds),
          hoverEnergy,
          airtimeSeconds: 0,
          phase: "preload" as const,
          actionWasHeld: true,
          airborneBlockedUntilRelease: true,
        },
        eventPulse: "preload" as const,
        ollieImpulse: 0,
        upwardForce: 0,
        grinding: false,
      };
    }
    const releasedPreload = current.actionWasHeld ? current.preload : 0;
    return {
      state: { preload: 0, hoverEnergy, airtimeSeconds: 0, phase: "grounded" as const, actionWasHeld: false, airborneBlockedUntilRelease: false },
      eventPulse: releasedPreload > 0 ? "ollie" as const : "idle" as const,
      ollieImpulse: releasedPreload > 0
        ? tuning.ollieMinImpulse + (tuning.ollieMaxImpulse - tuning.ollieMinImpulse) * releasedPreload
        : 0,
      upwardForce: 0,
      grinding: false,
    };
  }

  const airborneBlockedUntilRelease = input.actionHeld ? current.airborneBlockedUntilRelease : false;
  const canSpend = input.actionHeld && !airborneBlockedUntilRelease && current.hoverEnergy > 0;
  const hoverEnergy = canSpend
    ? Math.max(0, current.hoverEnergy - delta / tuning.hoverDurationSeconds)
    : current.hoverEnergy;
  const grinding = canSpend && input.wallEligible;
  const eventPulse: AerialMechanicEvent = !input.actionHeld || airborneBlockedUntilRelease ? "idle"
    : !canSpend ? "depleted"
      : grinding ? "grind"
        : "hover";
  const phase: AerialMechanicPhase = eventPulse === "idle" ? "airborne" : eventPulse;
  return {
    state: {
      preload: 0,
      hoverEnergy,
      airtimeSeconds: current.airtimeSeconds + delta,
      phase,
      actionWasHeld: input.actionHeld,
      airborneBlockedUntilRelease,
    },
    eventPulse,
    ollieImpulse: 0,
    upwardForce: canSpend && !grinding ? tuning.hoverForce : 0,
    grinding,
  };
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
  if (retained === "reset" || retained === "ollie" || retained === "takeoff" || retained === "landing") return retained;
  return next === "reset" || next === "ollie" || next === "takeoff" || next === "landing" ? next : null;
}

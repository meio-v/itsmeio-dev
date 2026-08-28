export function isRideLabEnabled(
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.RIDE_LAB_ENABLED,
) {
  return nodeEnv !== "production" && flag === "true";
}

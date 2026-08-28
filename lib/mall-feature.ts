type MallFeatureEnvironment = {
  MALL_ENABLED?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

export function isMallEnabled(environment: MallFeatureEnvironment = process.env) {
  if (environment.MALL_ENABLED !== undefined) {
    return environment.MALL_ENABLED.trim().toLowerCase() === "true";
  }

  if (environment.VERCEL_ENV !== undefined) {
    return environment.VERCEL_ENV !== "production";
  }

  return environment.NODE_ENV !== "production";
}

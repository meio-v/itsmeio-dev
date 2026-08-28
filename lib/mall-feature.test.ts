import assert from "node:assert/strict";
import test from "node:test";

import { isMallEnabled } from "./mall-feature.ts";

test("enables the mall during local development", () => {
  assert.equal(isMallEnabled({ NODE_ENV: "development" }), true);
});

test("enables the mall on Vercel preview deployments", () => {
  assert.equal(
    isMallEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    true,
  );
});

test("disables the mall on production by default", () => {
  assert.equal(
    isMallEnabled({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    false,
  );
});

test("an explicit environment value overrides the deployment default", () => {
  assert.equal(
    isMallEnabled({ MALL_ENABLED: "true", VERCEL_ENV: "production" }),
    true,
  );
  assert.equal(
    isMallEnabled({ MALL_ENABLED: "false", VERCEL_ENV: "preview" }),
    false,
  );
});

test("a local production server stays closed unless explicitly enabled", () => {
  assert.equal(isMallEnabled({ NODE_ENV: "production" }), false);
});

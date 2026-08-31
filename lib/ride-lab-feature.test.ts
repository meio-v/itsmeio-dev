import assert from "node:assert/strict";
import test from "node:test";

import { isRideLabEnabled } from "./ride-lab-feature.ts";

test("rideLab requires its own explicit non-production gate", () => {
  assert.equal(isRideLabEnabled("development", "true"), true);
  assert.equal(isRideLabEnabled("development", undefined), false);
  assert.equal(isRideLabEnabled("production", "true"), false);
});

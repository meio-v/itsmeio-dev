import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const measurements = JSON.parse(await readFile("docs/testing/ride-lab-measurements.json", "utf8"));

function assertNonNegativeMetric(name) {
  const value = measurements[name];
  assert.ok(typeof value === "number" && Number.isFinite(value) && value >= 0, `${name} must be a finite nonnegative number`);
  return value;
}

assert.equal(measurements.engine, "Jolt MotorcycleController");
assert.ok(assertNonNegativeMetric("startupMs") <= 4000, `startup ${measurements.startupMs}ms exceeds 4000ms`);
assert.ok(assertNonNegativeMetric("firstFrameMs") <= 5000, `first frame ${measurements.firstFrameMs}ms exceeds 5000ms`);
assert.ok(assertNonNegativeMetric("averageRenderMs") <= 16.7, `average render ${measurements.averageRenderMs}ms exceeds 16.7ms`);
assert.ok(assertNonNegativeMetric("peakRenderMs") <= 70, `peak render ${measurements.peakRenderMs}ms exceeds 70ms`);
assert.ok(assertNonNegativeMetric("drawCalls") <= 80, `draw calls ${measurements.drawCalls} exceeds 80`);
assert.ok(assertNonNegativeMetric("triangles") <= 100_000, `triangles ${measurements.triangles} exceeds 100000`);
assert.ok(assertNonNegativeMetric("transferBytes") <= 8_000_000, `transfer ${measurements.transferBytes} bytes exceeds 8000000`);
assert.equal(measurements.vehicleAsset, "streetwear");
assert.ok(assertNonNegativeMetric("seatErrorMeters") < 0.01, `seat error ${measurements.seatErrorMeters}m exceeds 0.01m`);
assert.ok(assertNonNegativeMetric("leftHandErrorMeters") < 0.08, `left grip error ${measurements.leftHandErrorMeters}m exceeds 0.08m`);
assert.ok(assertNonNegativeMetric("rightHandErrorMeters") < 0.08, `right grip error ${measurements.rightHandErrorMeters}m exceeds 0.08m`);
assert.equal(measurements.liveRuntimes, 1);
assert.equal(measurements.animationLoops, 1);
console.log("rideLab evidence verification passed");

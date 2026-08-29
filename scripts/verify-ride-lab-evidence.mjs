import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const measurements = JSON.parse(await readFile("docs/testing/ride-lab-measurements.json", "utf8"));
assert.equal(measurements.engine, "Jolt MotorcycleController");
assert.ok(measurements.startupMs <= 4000, `startup ${measurements.startupMs}ms exceeds 4000ms`);
assert.ok(measurements.firstFrameMs <= 5000, `first frame ${measurements.firstFrameMs}ms exceeds 5000ms`);
assert.ok(measurements.averageRenderMs <= 16.7, `average render ${measurements.averageRenderMs}ms exceeds 16.7ms`);
assert.ok(measurements.peakRenderMs <= 70, `peak render ${measurements.peakRenderMs}ms exceeds 70ms`);
assert.ok(measurements.drawCalls <= 80, `draw calls ${measurements.drawCalls} exceeds 80`);
assert.ok(measurements.triangles <= 100_000, `triangles ${measurements.triangles} exceeds 100000`);
assert.ok(measurements.transferBytes <= 8_000_000, `transfer ${measurements.transferBytes} bytes exceeds 8000000`);
assert.equal(measurements.liveRuntimes, 1);
assert.equal(measurements.animationLoops, 1);
console.log("rideLab evidence verification passed");

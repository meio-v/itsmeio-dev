import assert from "node:assert/strict";

import { chromium } from "playwright";

import { startMallServer } from "./mall-server.mjs";

const budgets = {
  transferBytes: 5_500_000,
  firstFrameMs: 5_000,
  drawCalls: 150,
  triangles: 300_000,
  averageRenderMs: 16.7,
  peakRenderMs: 50,
};

const server = await startMallServer({ port: 4311, mallEnabled: true });
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto(`${server.origin}/mall?rideDebug`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(
    () =>
      window.__mallRideRuntime?.getDebugSnapshot().firstFrameMs > 0,
    undefined,
    { timeout: 20_000 },
  );
  await page.evaluate(() => window.__mallRideRuntime.resetPerformanceMetrics());
  await page.waitForTimeout(3_000);
  const evidence = await page.evaluate(() => ({
    runtime: window.__mallRideRuntime.getDebugSnapshot(),
    transferBytes: performance
      .getEntriesByType("resource")
      .reduce((total, entry) => total + (entry.transferSize || 0), 0),
  }));

  assert.ok(evidence.transferBytes <= budgets.transferBytes, JSON.stringify(evidence));
  assert.ok(evidence.runtime.firstFrameMs <= budgets.firstFrameMs, JSON.stringify(evidence));
  assert.ok(evidence.runtime.drawCalls <= budgets.drawCalls, JSON.stringify(evidence));
  assert.ok(evidence.runtime.triangles <= budgets.triangles, JSON.stringify(evidence));
  assert.ok(evidence.runtime.averageRenderMs <= budgets.averageRenderMs, JSON.stringify(evidence));
  assert.ok(evidence.runtime.peakRenderMs <= budgets.peakRenderMs, JSON.stringify(evidence));

  console.log(JSON.stringify({ budgets, evidence }));
  console.log("mall performance verification passed");
} finally {
  await browser.close();
  await server.stop();
}

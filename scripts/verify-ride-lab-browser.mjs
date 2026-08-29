import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";

const port = await allocatePort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "development", RIDE_LAB_ENABLED: "true", MALL_ENABLED: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
let serverExited = false;
server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });
const serverExit = once(server, "exit");
serverExit.then(() => { serverExited = true; });

async function allocatePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  assert.ok(address && typeof address !== "string");
  const availablePort = address.port;
  probe.close();
  await once(probe, "close");
  return availablePort;
}

async function stopServer() {
  if (serverExited) return;
  server.kill("SIGTERM");
  const forceKill = setTimeout(() => { server.kill("SIGKILL"); }, 5_000);
  await serverExit;
  clearTimeout(forceKill);
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (serverExited) throw new Error(`rideLab dev server exited before readiness:\n${serverOutput.slice(-2000)}`);
    try {
      const response = await fetch(`${baseUrl}/mall/ride-lab`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`rideLab dev server did not become ready:\n${serverOutput.slice(-2000)}`);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  await context.addInitScript(() => {
    localStorage.setItem("itsmeio.rideLab.config.v1", JSON.stringify({ version: 1, tuning: { rideAssist: 0.94 } }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(60_000);
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseUrl}/mall/ride-lab`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.waitForSelector('[data-testid="ride-lab-surface"][data-lifecycle="active"]', { timeout: 20_000 });
  await page.waitForFunction(() => window.__rideLabRuntime?.tuning?.rideAssist === 0.94 && window.__rideLabRuntime?.getDebugSnapshot().lifecycle === "active");
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator("[data-nextjs-dialog]").count(), 0);
  assert.equal(errors.length, 0, errors.join("\n"));

  const surface = page.locator('[data-testid="ride-lab-surface"]');
  const accelerateButton = page.getByRole("button", { name: "Accelerate" });
  await accelerateButton.hover();
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-throttle") === "1");
  assert.equal(await surface.getAttribute("data-feedback"), "throttle");
  assert.equal(await surface.locator("output").first().evaluate((element) => getComputedStyle(element).color), "rgb(255, 240, 138)");
  await page.mouse.up();
  await surface.focus();
  await page.evaluate(() => {
    window.__rideLabRuntime.setVirtualInput({ throttle: 1 });
    window.__rideLabRuntime.setVirtualInput({ steer: 1 });
  });
  await page.waitForFunction(() => {
    const rideSurface = document.querySelector('[data-testid="ride-lab-surface"]');
    return rideSurface?.getAttribute("data-accepted-throttle") === "1" && rideSurface?.getAttribute("data-accepted-steer") === "1";
  });
  await page.evaluate(() => {
    window.__rideLabRuntime.setVirtualInput({ throttle: 0 });
    window.__rideLabRuntime.setVirtualInput({ steer: 0 });
  });
  await page.waitForFunction(() => {
    const rideSurface = document.querySelector('[data-testid="ride-lab-surface"]');
    return rideSurface?.getAttribute("data-accepted-throttle") === "0" && rideSurface?.getAttribute("data-accepted-steer") === "0";
  });
  await surface.focus();
  await page.evaluate(() => { window.__rideLabRuntime.tuning.fixedStep = 1 / 30; });
  await page.keyboard.down("w");
  const frameBeforeInput = Number(await surface.getAttribute("data-frame"));
  await page.waitForFunction((frame) => Number(document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-frame")) > frame, frameBeforeInput);
  const firstFrameFeedback = await surface.evaluate((rideSurface) => ({
    accepted: rideSurface.getAttribute("data-accepted-throttle"),
    feedback: rideSurface.getAttribute("data-feedback"),
  }));
  assert.deepEqual(firstFrameFeedback, { accepted: "1", feedback: "throttle" });
  await page.waitForTimeout(900);
  const accelerated = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(accelerated.speedMps > 0.5);
  await page.keyboard.up("w");
  await page.waitForTimeout(50);
  const coasted = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(coasted.speedMps > accelerated.speedMps * 0.8);
  await page.locator("label", { hasText: "Follow distance" }).locator('input[type="range"]').fill("6.4");
  await page.waitForTimeout(250);
  const afterPresentationTuning = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(afterPresentationTuning.speedMps > coasted.speedMps * 0.7);

  const latestTuning = await page.evaluate(async () => {
    const runtime = window.__rideLabRuntime;
    const initial = { ...runtime.tuning };
    const stale = runtime.reconfigure({ ...initial, massKg: initial.massKg + 1 });
    const latest = runtime.reconfigure({ ...initial, cameraDistance: initial.cameraDistance + 0.1 });
    await Promise.all([stale, latest]);
    return {
      massKg: runtime.tuning.massKg,
      cameraDistance: runtime.tuning.cameraDistance,
      expectedMassKg: initial.massKg,
      expectedCameraDistance: initial.cameraDistance + 0.1,
      lifecycle: runtime.getDebugSnapshot().lifecycle,
    };
  });
  assert.equal(latestTuning.massKg, latestTuning.expectedMassKg);
  assert.equal(latestTuning.cameraDistance, latestTuning.expectedCameraDistance);
  assert.equal(latestTuning.lifecycle, "active");

  await surface.focus();
  await page.keyboard.down("s");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-brake") === "1");
  assert.equal(await surface.getAttribute("data-feedback"), "brake");
  await page.waitForTimeout(550);
  const braking = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(braking.frontSuspensionLoad > braking.rearSuspensionLoad);
  await page.keyboard.up("s");

  await page.keyboard.down("d");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-steer") === "1");
  await page.waitForTimeout(220);
  const steering = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().intent.steer);
  await page.keyboard.up("d");
  await page.waitForTimeout(70);
  const recovering = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().intent.steer);
  assert.ok(steering > recovering && recovering > 0);

  const resetButton = page.getByRole("button", { name: "Reset moped" });
  await resetButton.click();
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grounded === true);
  await resetButton.focus();
  await page.keyboard.press("Space");
  assert.equal(await surface.getAttribute("data-accepted-action"), "false");
  await surface.focus();
  await page.waitForTimeout(50);
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "true");
  await page.keyboard.press("r");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "false");
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grounded === true);
  await surface.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().preload > 0.1);
  await page.locator("label", { hasText: "Follow distance" }).locator('input[type="range"]').focus();
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "false");
  await page.keyboard.up("Space");
  await page.waitForTimeout(50);
  const focusCancelled = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(focusCancelled.preload, 0);
  assert.notEqual(focusCancelled.eventPulse, "ollie");
  await surface.focus();
  await page.keyboard.down("Space");
  const actionFrame = Number(await surface.getAttribute("data-frame"));
  await page.waitForFunction((frame) => Number(document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-frame")) > frame, actionFrame);
  assert.equal(await surface.getAttribute("data-accepted-action"), "true");
  assert.equal(await surface.getAttribute("data-feedback"), "preload");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().preload >= 0.98);
  const preloaded = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(preloaded.grounded, true);
  assert.ok(Number(await surface.getAttribute("data-visual-compression")) > 0.15);
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().verticalSpeedMps > 4);
  const ollie = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(ollie.position.y >= preloaded.position.y);
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grounded === false);
  const energyBeforeHover = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().hoverEnergy);
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-feedback") === "hover");
  await page.waitForTimeout(500);
  const hovering = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(hovering.aerialPhase, "hover");
  assert.ok(hovering.hoverEnergy < energyBeforeHover);
  assert.ok(Number(await page.getByRole("meter", { name: "Hover energy" }).getAttribute("value")) < 1);
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().hoverEnergy === 0, undefined, { timeout: 5_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-feedback") === "depleted");
  const depleted = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(depleted.position.y > 12);
  assert.ok(depleted.cameraPosition.y > 8);
  assert.ok(Math.abs(depleted.cameraPosition.y - depleted.position.y) < 12);
  await page.keyboard.up("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "false");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grounded === true, undefined, { timeout: 8_000 });
  const energyAtLanding = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().hoverEnergy);
  await page.waitForFunction((energy) => window.__rideLabRuntime.getDebugSnapshot().hoverEnergy > energy + 0.1, energyAtLanding);

  await page.getByRole("button", { name: "Wall grind setup" }).click();
  await page.waitForFunction(() => {
    const snapshot = window.__rideLabRuntime.getDebugSnapshot();
    return snapshot.position.x > 22 && snapshot.grounded === false;
  });
  const beforeGrind = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  const grindFallSpeed = await page.evaluate(() => window.__rideLabRuntime.tuning.grindFallSpeed);
  await surface.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grinding === true);
  await page.waitForTimeout(80);
  const grinding = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(grinding.aerialPhase, "grind");
  assert.ok(grinding.hoverEnergy < beforeGrind.hoverEnergy);
  assert.ok(grinding.horizontalSpeedMps > beforeGrind.horizontalSpeedMps * 0.9);
  assert.ok(grinding.verticalSpeedMps >= -grindFallSpeed - 0.1);
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grinding === false);
  const releasedGrind = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(releasedGrind.grindReleaseSpeedMps > grinding.horizontalSpeedMps * 0.9);

  const controls = page.locator('input[type="range"]');
  assert.equal(await controls.count(), 42);
  assert.equal(await page.locator("details").last().getAttribute("open"), null);
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    assert.ok(await control.getAttribute("min"));
    assert.ok(await control.getAttribute("max"));
    assert.ok(await control.getAttribute("aria-describedby"));
  }
  await page.getByRole("button", { name: "grippy" }).click();
  await page.waitForFunction(() => window.__rideLabRuntime?.getDebugSnapshot().lifecycle === "active");
  const storageKeys = await page.evaluate(() => Object.keys(localStorage));
  assert.deepEqual(storageKeys, ["itsmeio.rideLab.config.v1"]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector('input[type="checkbox"]')?.checked === true);
  await page.waitForFunction(() => window.__rideLabRuntime?.getDebugSnapshot().reducedMotion === true);
  assert.equal(await surface.evaluate((element) => getComputedStyle(element).getPropertyValue("--ride-line-strength").trim()), "0.000");

  await page.evaluate(() => window.__rideLabRuntime.setScenario("start"));
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().grounded === true);
  await surface.focus();
  await page.waitForTimeout(50);
  await page.keyboard.down("Space");
  await page.waitForFunction(() => window.__rideLabRuntime.getDebugSnapshot().preload > 0.1);
  await page.evaluate(() => window.__rideLabRuntime.pause());
  await page.keyboard.up("Space");
  const paused = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(paused.preload, 0);
  assert.equal(paused.acceptedInput.aerialAction, false);
  await page.evaluate(() => window.__rideLabRuntime.resume());
  await page.waitForSelector('[data-lifecycle="active"]');
  await page.waitForTimeout(100);
  assert.notEqual((await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot())).eventPulse, "ollie");

  await surface.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "true");

  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    window.__rideLabLoseExtension = canvas.getContext("webgl2").getExtension("WEBGL_lose_context");
    window.__rideLabLoseExtension.loseContext();
  });
  await page.waitForSelector('[data-lifecycle="context-lost"]');
  assert.equal(await surface.getAttribute("data-accepted-action"), "false");
  await page.keyboard.up("Space");
  await page.evaluate(() => {
    window.__rideLabLoseExtension.restoreContext();
  });
  await page.waitForSelector('[data-lifecycle="active"]');
  await surface.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "true");
  await page.keyboard.up("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "false");

  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector('[data-lifecycle="active"]');
    const counts = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
    assert.equal(counts.liveRuntimes, 1);
    assert.equal(counts.animationLoops, 1);
  }

  const mallHtml = await (await fetch(`${baseUrl}/mall`)).text();
  assert.equal(mallHtml.includes("/mall/ride-lab"), false);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-lifecycle="active"]');
  assert.equal(await page.getByRole("button", { name: "Accelerate" }).isVisible(), true);
  const mobileAction = page.getByRole("button", { name: "Preload or hover" });
  assert.equal(await mobileAction.isVisible(), true);
  await mobileAction.hover();
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-action") === "true");
  await page.mouse.up();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-lifecycle="active"]');
  await page.waitForTimeout(1200);
  const debug = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  const transferBytes = await page.evaluate(() => performance.getEntriesByType("resource").reduce((total, resource) => total + (resource.transferSize || resource.encodedBodySize || 0), 0));
  const measurements = {
    measuredAt: new Date().toISOString(),
    engine: debug.engine,
    startupMs: debug.startupMs,
    firstFrameMs: debug.firstFrameMs,
    averageRenderMs: debug.averageRenderMs,
    peakRenderMs: debug.peakRenderMs,
    drawCalls: debug.drawCalls,
    triangles: debug.triangles,
    transferBytes,
    liveRuntimes: debug.liveRuntimes,
    animationLoops: debug.animationLoops,
  };
  await writeFile("docs/testing/ride-lab-measurements.json", `${JSON.stringify(measurements, null, 2)}\n`);
  console.log("rideLab browser verification passed");
} finally {
  await browser?.close();
  await stopServer();
}

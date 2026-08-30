import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";

import { RIDE_LAB_CONTROLS } from "../app/mall/_ride-lab/rideLabControls.ts";
import { DEFAULT_RIDE_LAB_TUNING } from "../app/mall/_ride-lab/rideLabTuning.ts";
import { RIDE_LAB_VEHICLE_ALIGNMENT } from "../app/mall/_ride-lab/rideLabVehicleVisual.ts";

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

function requiredNonNegativeMetric(value, label) {
  assert.notEqual(value, null, `${label} telemetry is missing`);
  const metric = Number(value);
  assert.ok(Number.isFinite(metric) && metric >= 0, `${label} telemetry must be a finite nonnegative number, received ${value}`);
  return metric;
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  await context.addInitScript(() => {
    localStorage.setItem("itsmeio.rideLab.config.v1", JSON.stringify({ version: 1, tuning: { rideAssist: 0.94 } }));
    localStorage.setItem("itsmeio.rideLab.config.v2", JSON.stringify({ version: 2, tuning: { steerReturn: 5.5 } }));
    localStorage.setItem("itsmeio.rideLab.config.v3", JSON.stringify({ version: 3, tuning: { steerReturn: 1.5 } }));
    localStorage.setItem("itsmeio.rideLab.config.v4", JSON.stringify({ version: 4, tuning: { engineTorque: 150, linearDamping: 0.08 } }));
    localStorage.setItem("itsmeio.rideLab.config.v5", JSON.stringify({ version: 5, tuning: { engineTorque: 172.5 } }));
    localStorage.setItem("itsmeio.rideLab.config.v6", JSON.stringify({ version: 6, tuning: { turnAssistRadiusMeters: 24 } }));
    localStorage.setItem("itsmeio.rideLab.config.v7", JSON.stringify({ version: 7, tuning: { speedLineThreshold: 100 / 3.6 } }));
    localStorage.setItem("itsmeio.rideLab.config.v8", JSON.stringify({ version: 8, tuning: { cameraCruiseSpeedMps: 60 / 3.6 } }));
    localStorage.setItem("itsmeio.rideLab.config.v9", JSON.stringify({ version: 9, tuning: { cameraThrottlePunchDistance: 0.4 } }));
    localStorage.setItem("itsmeio.rideLab.config.v10", JSON.stringify({ version: 10, tuning: { cameraSteerPunchDistance: 0.3 } }));
    localStorage.setItem("itsmeio.rideLab.config.v11", JSON.stringify({ version: 11, tuning: { steerReturn: 0.6 } }));
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
  await page.waitForFunction((defaultRideAssist) => (
    window.__rideLabRuntime?.tuning?.rideAssist === defaultRideAssist
      && window.__rideLabRuntime?.getDebugSnapshot().lifecycle === "active"
      && localStorage.getItem("itsmeio.rideLab.config.v1") === null
      && localStorage.getItem("itsmeio.rideLab.config.v2") === null
      && localStorage.getItem("itsmeio.rideLab.config.v3") === null
      && localStorage.getItem("itsmeio.rideLab.config.v4") === null
      && localStorage.getItem("itsmeio.rideLab.config.v5") === null
      && localStorage.getItem("itsmeio.rideLab.config.v6") === null
      && localStorage.getItem("itsmeio.rideLab.config.v7") === null
      && localStorage.getItem("itsmeio.rideLab.config.v8") === null
      && localStorage.getItem("itsmeio.rideLab.config.v9") === null
      && localStorage.getItem("itsmeio.rideLab.config.v10") === null
      && localStorage.getItem("itsmeio.rideLab.config.v11") === null
      && localStorage.getItem("itsmeio.rideLab.config.v12") !== null
  ), DEFAULT_RIDE_LAB_TUNING.rideAssist);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator("[data-nextjs-dialog]").count(), 0);
  assert.equal(errors.length, 0, errors.join("\n"));

  const surface = page.locator('[data-testid="ride-lab-surface"]');
  const initialVehicleTelemetry = await surface.evaluate((rideSurface) => ({
    asset: rideSurface.getAttribute("data-vehicle-asset"),
    wheelSpin: rideSurface.getAttribute("data-wheel-spin"),
    seatError: rideSurface.getAttribute("data-seat-error"),
    leftHandError: rideSurface.getAttribute("data-left-hand-error"),
    rightHandError: rideSurface.getAttribute("data-right-hand-error"),
    leftHandPosition: rideSurface.getAttribute("data-left-hand-position"),
    rightHandPosition: rideSurface.getAttribute("data-right-hand-position"),
    leftElbow: rideSurface.getAttribute("data-left-elbow"),
    rightElbow: rideSurface.getAttribute("data-right-elbow"),
    celShading: rideSurface.getAttribute("data-cel-shading"),
  }));
  const initialVehicle = {
    ...initialVehicleTelemetry,
    wheelSpin: requiredNonNegativeMetric(initialVehicleTelemetry.wheelSpin, "wheel spin"),
    seatError: requiredNonNegativeMetric(initialVehicleTelemetry.seatError, "seat error"),
    leftHandError: requiredNonNegativeMetric(initialVehicleTelemetry.leftHandError, "left hand error"),
    rightHandError: requiredNonNegativeMetric(initialVehicleTelemetry.rightHandError, "right hand error"),
    leftElbow: requiredNonNegativeMetric(initialVehicleTelemetry.leftElbow, "left elbow"),
    rightElbow: requiredNonNegativeMetric(initialVehicleTelemetry.rightElbow, "right elbow"),
  };
  assert.equal(initialVehicle.asset, "curated");
  assert.equal(initialVehicle.celShading, "three-band-outlined");
  assert.ok(initialVehicle.seatError < 0.01, `rider seat contact drifted by ${initialVehicle.seatError} m`);
  assert.ok(initialVehicle.leftHandError < 0.08, `left hand at ${initialVehicle.leftHandPosition} missed the grip by ${initialVehicle.leftHandError} m`);
  assert.ok(initialVehicle.rightHandError < 0.08, `right hand at ${initialVehicle.rightHandPosition} missed the grip by ${initialVehicle.rightHandError} m`);
  assert.ok(Math.abs(initialVehicle.leftElbow - initialVehicle.rightElbow) < 0.001);
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
  await page.waitForFunction((maxVisualSteerRadians) => {
    const rideSurface = document.querySelector('[data-testid="ride-lab-surface"]');
    return rideSurface?.getAttribute("data-accepted-throttle") === "1"
      && rideSurface?.getAttribute("data-accepted-steer") === "1"
      && Math.abs(Number(rideSurface?.getAttribute("data-front-wheel-steer")) + maxVisualSteerRadians) < 0.001
      && Number(rideSurface?.getAttribute("data-head-tuck")) > 0.1;
  }, RIDE_LAB_VEHICLE_ALIGNMENT.maxVisualSteerRadians);
  const articulatedTurn = await surface.evaluate((rideSurface) => ({
    frontWheelSteer: Number(rideSurface.getAttribute("data-front-wheel-steer")),
    leftElbow: Number(rideSurface.getAttribute("data-left-elbow")),
    rightElbow: Number(rideSurface.getAttribute("data-right-elbow")),
    elbowFlare: Number(rideSurface.getAttribute("data-elbow-flare")),
    leftElbowFlare: Number(rideSurface.getAttribute("data-left-elbow-flare")),
    rightElbowFlare: Number(rideSurface.getAttribute("data-right-elbow-flare")),
    shoulderYaw: Number(rideSurface.getAttribute("data-shoulder-yaw")),
    headCounterLean: Number(rideSurface.getAttribute("data-head-counter-lean")),
    headTuck: Number(rideSurface.getAttribute("data-head-tuck")),
    handlebarSteer: Number(rideSurface.getAttribute("data-handlebar-steer")),
    leftHandError: Number(rideSurface.getAttribute("data-left-hand-error")),
    rightHandError: Number(rideSurface.getAttribute("data-right-hand-error")),
  }));
  assert.ok(articulatedTurn.frontWheelSteer < -0.2);
  assert.equal(articulatedTurn.handlebarSteer, articulatedTurn.frontWheelSteer);
  assert.ok(articulatedTurn.elbowFlare > 0.45);
  assert.ok(articulatedTurn.leftElbowFlare > articulatedTurn.rightElbowFlare);
  assert.ok(articulatedTurn.shoulderYaw < 0 && articulatedTurn.shoulderYaw > -0.1);
  assert.ok(articulatedTurn.headCounterLean > 0 && articulatedTurn.headCounterLean < 0.07);
  assert.ok(articulatedTurn.headTuck > 0.1);
  assert.ok(articulatedTurn.leftElbow > articulatedTurn.rightElbow);
  assert.ok(articulatedTurn.leftHandError < 0.08, `turning left hand missed its moving grip by ${articulatedTurn.leftHandError} m`);
  assert.ok(articulatedTurn.rightHandError < 0.08, `turning right hand missed its moving grip by ${articulatedTurn.rightHandError} m`);
  await page.waitForFunction(() => (
    Number(document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-shoulder-yaw")) < -0.1
  ));
  await page.evaluate(() => { window.__rideLabRuntime.setVirtualInput({ steer: -1 }); });
  await page.waitForFunction((maxVisualSteerRadians) => {
    const rideSurface = document.querySelector('[data-testid="ride-lab-surface"]');
    return rideSurface?.getAttribute("data-accepted-steer") === "-1"
      && Math.abs(Number(rideSurface?.getAttribute("data-front-wheel-steer")) - maxVisualSteerRadians) < 0.001;
  }, RIDE_LAB_VEHICLE_ALIGNMENT.maxVisualSteerRadians);
  const mirroredTurn = await surface.evaluate((rideSurface) => ({
    frontWheelSteer: Number(rideSurface.getAttribute("data-front-wheel-steer")),
    leftElbow: Number(rideSurface.getAttribute("data-left-elbow")),
    rightElbow: Number(rideSurface.getAttribute("data-right-elbow")),
  }));
  assert.ok(mirroredTurn.frontWheelSteer > 0.2);
  assert.ok(mirroredTurn.leftElbow < mirroredTurn.rightElbow);
  assert.ok(Math.abs(mirroredTurn.frontWheelSteer + articulatedTurn.frontWheelSteer) < 0.01);
  await page.evaluate(() => {
    window.__rideLabRuntime.setVirtualInput({ throttle: 0 });
    window.__rideLabRuntime.setVirtualInput({ steer: 0 });
  });
  await page.waitForFunction(() => {
    const rideSurface = document.querySelector('[data-testid="ride-lab-surface"]');
    return rideSurface?.getAttribute("data-accepted-throttle") === "0" && rideSurface?.getAttribute("data-accepted-steer") === "0";
  });
  await page.waitForFunction(() => {
    const flare = Number(document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-right-elbow-flare"));
    return flare > 0.02 && flare < 0.37;
  });
  const recoveringPose = await surface.evaluate((rideSurface) => ({
    outsideFlare: Number(rideSurface.getAttribute("data-right-elbow-flare")),
    shoulderYaw: Number(rideSurface.getAttribute("data-shoulder-yaw")),
  }));
  assert.ok(recoveringPose.outsideFlare > 0.02 && recoveringPose.outsideFlare < 0.37);
  assert.ok(recoveringPose.shoulderYaw > 0 && recoveringPose.shoulderYaw < 0.12);
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
  const acceleratedWheelSpin = Number(await surface.getAttribute("data-wheel-spin"));
  assert.ok(Math.abs(acceleratedWheelSpin - initialVehicle.wheelSpin) > 0.1, "wheel spin must follow vehicle travel");
  await page.keyboard.up("w");
  await page.evaluate((fixedStep) => { window.__rideLabRuntime.tuning.fixedStep = fixedStep; }, DEFAULT_RIDE_LAB_TUNING.fixedStep);
  await page.waitForTimeout(50);
  const coasted = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(coasted.speedMps > accelerated.speedMps * 0.8);
  await page.evaluate(() => {
    globalThis.__rideLabPhysicsBeforePresentationTuning = window.__rideLabRuntime.physics;
    globalThis.__rideLabTuningBeforePresentationTuning = { ...window.__rideLabRuntime.tuning };
  });
  await page.locator('input[aria-describedby="cameraDistance-description"]').fill("6.4");
  await page.waitForFunction(() => window.__rideLabRuntime.tuning.cameraDistance === 6.4);
  const presentationTuningResult = await page.evaluate(() => {
    const preserved = window.__rideLabRuntime.physics === globalThis.__rideLabPhysicsBeforePresentationTuning;
    const changedKeys = Object.keys(window.__rideLabRuntime.tuning).filter(
      (key) => window.__rideLabRuntime.tuning[key] !== globalThis.__rideLabTuningBeforePresentationTuning[key],
    );
    const fixedStepBefore = globalThis.__rideLabTuningBeforePresentationTuning.fixedStep;
    delete globalThis.__rideLabPhysicsBeforePresentationTuning;
    delete globalThis.__rideLabTuningBeforePresentationTuning;
    return {
      preserved,
      changedKeys,
      fixedStepBefore,
      fixedStepAfter: window.__rideLabRuntime.tuning.fixedStep,
    };
  });
  assert.deepEqual(presentationTuningResult, {
    preserved: true,
    changedKeys: ["cameraDistance"],
    fixedStepBefore: DEFAULT_RIDE_LAB_TUNING.fixedStep,
    fixedStepAfter: DEFAULT_RIDE_LAB_TUNING.fixedStep,
  });

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
  const speedBeforeBraking = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().speedMps);
  await page.keyboard.down("s");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-brake") === "1");
  assert.equal(await surface.getAttribute("data-feedback"), "brake");
  await page.waitForTimeout(550);
  const braking = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(braking.speedMps < speedBeforeBraking);
  await page.keyboard.up("s");

  await page.keyboard.down("d");
  await page.waitForFunction(() => document.querySelector('[data-testid="ride-lab-surface"]')?.getAttribute("data-accepted-steer") === "1");
  await page.waitForTimeout(220);
  const steering = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot().intent.steer);
  await page.keyboard.up("d");
  await page.waitForFunction((steeringAtRelease) => {
    const recoveringSteer = window.__rideLabRuntime.getDebugSnapshot().intent.steer;
    return recoveringSteer > 0 && recoveringSteer < steeringAtRelease;
  }, steering);
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
  await page.locator('input[aria-describedby="cameraDistance-description"]').focus();
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
  await page.waitForFunction(() => {
    const snapshot = window.__rideLabRuntime.getDebugSnapshot();
    return snapshot.hoverEnergy <= 0.001 && snapshot.aerialPhase === "depleted";
  }, undefined, { timeout: 10_000 });
  assert.equal(await surface.getAttribute("data-feedback"), "depleted");
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
  await page.evaluate(() => window.__rideLabRuntime.setVirtualInput({ aerialAction: true }));
  await page.waitForFunction(() => {
    const snapshot = window.__rideLabRuntime.getDebugSnapshot();
    return snapshot.grinding === true && snapshot.aerialPhase === "grind";
  });
  const grinding = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.equal(grinding.aerialPhase, "grind");
  assert.ok(grinding.hoverEnergy < beforeGrind.hoverEnergy);
  assert.ok(
    grinding.horizontalSpeedMps > beforeGrind.horizontalSpeedMps * 0.9,
    `grind capture retained ${grinding.horizontalSpeedMps} m/s from ${beforeGrind.horizontalSpeedMps} m/s`,
  );
  assert.ok(grinding.verticalSpeedMps >= -grindFallSpeed - 0.1);
  await page.evaluate(() => window.__rideLabRuntime.setVirtualInput({ aerialAction: false }));
  await page.waitForFunction(() => {
    const snapshot = window.__rideLabRuntime.getDebugSnapshot();
    return snapshot.grinding === false && snapshot.grindReleaseSpeedMps > 0;
  });
  const releasedGrind = await page.evaluate(() => window.__rideLabRuntime.getDebugSnapshot());
  assert.ok(
    releasedGrind.grindReleaseSpeedMps > grinding.horizontalSpeedMps * 0.88,
    `expected render-timed grind release to retain 88% momentum: ${releasedGrind.grindReleaseSpeedMps.toFixed(3)} from ${grinding.horizontalSpeedMps.toFixed(3)} m/s`,
  );

  const controls = page.locator('input[type="range"]');
  assert.equal(await controls.count(), RIDE_LAB_CONTROLS.length);
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
  assert.deepEqual(storageKeys, ["itsmeio.rideLab.config.v12"]);

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
    assert.equal(await surface.getAttribute("data-vehicle-asset"), "curated");
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
  const vehicleEvidenceTelemetry = await surface.evaluate((rideSurface) => ({
    asset: rideSurface.getAttribute("data-vehicle-asset"),
    seatErrorMeters: rideSurface.getAttribute("data-seat-error"),
    leftHandErrorMeters: rideSurface.getAttribute("data-left-hand-error"),
    rightHandErrorMeters: rideSurface.getAttribute("data-right-hand-error"),
  }));
  const vehicleEvidence = {
    asset: vehicleEvidenceTelemetry.asset,
    seatErrorMeters: requiredNonNegativeMetric(vehicleEvidenceTelemetry.seatErrorMeters, "seat error"),
    leftHandErrorMeters: requiredNonNegativeMetric(vehicleEvidenceTelemetry.leftHandErrorMeters, "left hand error"),
    rightHandErrorMeters: requiredNonNegativeMetric(vehicleEvidenceTelemetry.rightHandErrorMeters, "right hand error"),
  };
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
    vehicleAsset: vehicleEvidence.asset,
    seatErrorMeters: vehicleEvidence.seatErrorMeters,
    leftHandErrorMeters: vehicleEvidence.leftHandErrorMeters,
    rightHandErrorMeters: vehicleEvidence.rightHandErrorMeters,
    liveRuntimes: debug.liveRuntimes,
    animationLoops: debug.animationLoops,
  };
  await writeFile("docs/testing/ride-lab-measurements.json", `${JSON.stringify(measurements, null, 2)}\n`);
  console.log("rideLab browser verification passed");
} finally {
  await browser?.close();
  await stopServer();
}

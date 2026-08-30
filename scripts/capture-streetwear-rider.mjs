import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.RIDE_LAB_BASE_URL ?? "http://127.0.0.1:3002";
const label = process.argv[2] ?? "proof-of-life";
const outputRoot = path.resolve(process.argv[3] ?? "docs/testing/streetwear-rider-captures");
const outputDirectory = path.join(outputRoot, label);

assert.match(label, /^[a-z0-9-]+$/, "capture label must be lowercase kebab-case");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
const page = await context.newPage();
page.setDefaultTimeout(30_000);

const inspectionViews = [
  { name: "rear", offset: { x: 0, y: 2.0, z: -5.0 } },
  { name: "front", offset: { x: 0, y: 1.7, z: 5.0 } },
  { name: "left-profile", offset: { x: -5.0, y: 1.55, z: 0 } },
  { name: "right-profile", offset: { x: 5.0, y: 1.55, z: 0 } },
  { name: "elevated-three-quarter", offset: { x: -4.0, y: 3.0, z: -4.0 } },
];

async function resetPose() {
  await page.goto(`${baseUrl}/mall/ride-lab`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="ride-lab-surface"][data-lifecycle="active"]');
  await page.evaluate(() => window.__rideLabRuntime.setScenario("start"));
  await page.waitForTimeout(300);
}

async function telemetry() {
  return page.locator('[data-testid="ride-lab-surface"]').evaluate((surface) => ({
    vehicleAsset: surface.getAttribute("data-vehicle-asset"),
    seatErrorMeters: Number(surface.getAttribute("data-seat-error")),
    leftHandErrorMeters: Number(surface.getAttribute("data-left-hand-error")),
    rightHandErrorMeters: Number(surface.getAttribute("data-right-hand-error")),
    leftFootErrorMeters: Number(surface.getAttribute("data-left-foot-error")),
    rightFootErrorMeters: Number(surface.getAttribute("data-right-foot-error")),
    leftElbowRadians: Number(surface.getAttribute("data-left-elbow")),
    rightElbowRadians: Number(surface.getAttribute("data-right-elbow")),
    headTuckRadians: Number(surface.getAttribute("data-head-tuck")),
    speedMps: window.__rideLabRuntime.getDebugSnapshot().speedMps,
  }));
}

async function capture(name, input, settleMilliseconds) {
  await resetPose();
  await page.evaluate((nextInput) => window.__rideLabRuntime.setVirtualInput(nextInput), input);
  await page.waitForTimeout(settleMilliseconds);
  const imagePath = path.join(outputDirectory, `${name}.png`);
  await page.locator('[data-testid="ride-lab-surface"]').screenshot({ path: imagePath });
  const sample = await telemetry();
  await page.evaluate(() => window.__rideLabRuntime.setVirtualInput({ throttle: 0, steer: 0, brake: 0, preload: 0 }));
  return { name, imagePath, telemetry: sample };
}

async function captureInspectionPose(pose, input, settleMilliseconds) {
  await resetPose();
  await page.evaluate((nextInput) => window.__rideLabRuntime.setVirtualInput(nextInput), input);
  await page.waitForTimeout(settleMilliseconds);
  const sample = await telemetry();
  await page.evaluate(() => window.__rideLabRuntime.renderer.setAnimationLoop(null));
  const captures = [];
  for (const view of inspectionViews) {
    await page.evaluate(({ offset }) => {
      const runtime = window.__rideLabRuntime;
      const quaternion = runtime.vehiclePose.quaternion;
      const rotate = ({ x, y, z }) => ({
        x: x + 2 * (quaternion.w * (quaternion.y * z - quaternion.z * y) + quaternion.x * (quaternion.y * y + quaternion.z * z) - x * (quaternion.y ** 2 + quaternion.z ** 2)),
        y: y + 2 * (quaternion.w * (quaternion.z * x - quaternion.x * z) + quaternion.y * (quaternion.z * z + quaternion.x * x) - y * (quaternion.z ** 2 + quaternion.x ** 2)),
        z: z + 2 * (quaternion.w * (quaternion.x * y - quaternion.y * x) + quaternion.z * (quaternion.x * x + quaternion.y * y) - z * (quaternion.x ** 2 + quaternion.y ** 2)),
      });
      const rotatedOffset = rotate(offset);
      const rotatedTarget = rotate({ x: 0, y: 1.0, z: 0 });
      runtime.camera.position.set(
        runtime.vehiclePose.position.x + rotatedOffset.x,
        runtime.vehiclePose.position.y + rotatedOffset.y,
        runtime.vehiclePose.position.z + rotatedOffset.z,
      );
      runtime.camera.fov = 38;
      runtime.camera.lookAt(
        runtime.vehiclePose.position.x + rotatedTarget.x,
        runtime.vehiclePose.position.y + rotatedTarget.y,
        runtime.vehiclePose.position.z + rotatedTarget.z,
      );
      runtime.camera.updateProjectionMatrix();
      runtime.renderer.render(runtime.scene, runtime.camera);
    }, view);
    const name = `${pose}-${view.name}`;
    const imagePath = path.join(outputDirectory, `${name}.png`);
    await page.locator("canvas").screenshot({ path: imagePath });
    captures.push({ name, pose, view: view.name, imagePath, telemetry: sample });
  }
  return captures;
}

try {
  const captures = [];
  captures.push(await capture("idle", { throttle: 0, steer: 0 }, 250));
  captures.push(await capture("turn-right", { throttle: 0.35, steer: 1 }, 500));
  captures.push(await capture("turn-left", { throttle: 0.35, steer: -1 }, 500));
  captures.push(await capture("acceleration", { throttle: 1, steer: 0 }, 650));

  const inspectionCaptures = [
    ...await captureInspectionPose("idle", { throttle: 0, steer: 0 }, 250),
    ...await captureInspectionPose("turn-right", { throttle: 0.35, steer: 1 }, 500),
    ...await captureInspectionPose("acceleration", { throttle: 1, steer: 0 }, 650),
  ];

  const report = {
    label,
    sourceUrl: `${baseUrl}/mall/ride-lab`,
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    captures: captures.map(({ name, telemetry: sample }) => ({ name, telemetry: sample })),
    inspectionCaptures: inspectionCaptures.map(({ name, pose, view, telemetry: sample }) => ({ name, pose, view, telemetry: sample })),
  };
  await writeFile(path.join(outputDirectory, "telemetry.json"), `${JSON.stringify(report, null, 2)}\n`);

  const contactSheet = await context.newPage();
  await contactSheet.setViewportSize({ width: 1200, height: 980 });
  const cards = await Promise.all(captures.map(async ({ name, imagePath, telemetry: sample }) => {
    const image = await import("node:fs/promises").then(({ readFile }) => readFile(imagePath, "base64"));
    return `<figure><img src="data:image/png;base64,${image}" alt="${name}"><figcaption><strong>${name}</strong><pre>${JSON.stringify(sample, null, 2)}</pre></figcaption></figure>`;
  }));
  await contactSheet.setContent(`<!doctype html><style>
    *{box-sizing:border-box}body{margin:0;background:#130d22;color:#f7efe3;font:14px ui-monospace,monospace}
    header{padding:18px 24px;border-bottom:1px solid #ee4f87}h1{margin:0;font-size:21px}
    main{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px}figure{margin:0;border:1px solid #625879;background:#201733}
    img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;object-position:50% 35%}figcaption{display:grid;grid-template-columns:120px 1fr;gap:8px;padding:10px}
    pre{margin:0;font-size:10px;white-space:pre-wrap;color:#a5dedd}
  </style><header><h1>streetwear rider · ${label}</h1></header><main>${cards.join("")}</main>`);
  await contactSheet.screenshot({ path: path.join(outputDirectory, "contact-sheet.png"), fullPage: true });
  await contactSheet.close();

  const positioningSheet = await context.newPage();
  await positioningSheet.setViewportSize({ width: 2000, height: 1280 });
  const positioningCards = await Promise.all(inspectionCaptures.map(async ({ name, imagePath }) => {
    const image = await import("node:fs/promises").then(({ readFile }) => readFile(imagePath, "base64"));
    return `<figure><img src="data:image/png;base64,${image}" alt="${name}"><figcaption>${name}</figcaption></figure>`;
  }));
  await positioningSheet.setContent(`<!doctype html><style>
    *{box-sizing:border-box}body{margin:0;background:#130d22;color:#f7efe3;font:14px ui-monospace,monospace}
    header{padding:18px 24px;border-bottom:1px solid #ee4f87}h1{margin:0;font-size:21px}
    main{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:10px}figure{margin:0;border:1px solid #625879;background:#201733}
    img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}figcaption{padding:8px;font-weight:700}
  </style><header><h1>streetwear rider positioning · ${label}</h1></header><main>${positioningCards.join("")}</main>`);
  await positioningSheet.screenshot({ path: path.join(outputDirectory, "positioning-sheet.png"), fullPage: true });
  await positioningSheet.close();
  console.log(`streetwear rider capture passed: ${outputDirectory}`);
} finally {
  await browser.close();
}

import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, devices } from "playwright";

import { startMallServer } from "./mall-server.mjs";

async function waitForRuntime(page) {
  await page.waitForFunction(
    () =>
      Boolean(
        window.__mallRideRuntime &&
          window.__mallRideRuntime.getDebugSnapshot().contextStatus === "active",
      ),
    undefined,
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: "Add token" }).waitFor({
    state: "visible",
  });
  await page.waitForFunction(
    () =>
      !document.querySelector('button[aria-describedby="ride-controls-help"]')
        ?.disabled,
  );
}

function attachErrorCapture(page, errors) {
  const isMallRoute = () => new URL(page.url()).pathname === "/mall";
  page.on("pageerror", (error) => {
    if (isMallRoute()) errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && isMallRoute()) {
      errors.push(`console: ${message.text()}`);
    }
  });
}

const server = await startMallServer({ port: 4310, mallEnabled: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const screenshotDirectory = process.env.MALL_SCREENSHOT_DIR;
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });

try {
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await desktop.newPage();
  attachErrorCapture(page, errors);
  await page.goto(`${server.origin}/mall?rideDebug`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: /Come explore with me/i }).waitFor();
  await page.getByRole("heading", { name: "Currently Playing" }).waitFor();
  await waitForRuntime(page);
  if (screenshotDirectory) {
    await page.screenshot({
      path: path.join(screenshotDirectory, "mall-desktop.png"),
      fullPage: true,
    });
  }

  await page.getByRole("button", { name: "Add token" }).click();
  await page.waitForFunction(
    () => window.__mallRideRuntime.getDebugSnapshot().mode === "driving",
  );
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowUp");
  await page.waitForFunction(
    () => window.__mallRideRuntime.getDebugSnapshot().speedKph > 1,
  );
  if (screenshotDirectory) {
    await page.screenshot({
      path: path.join(screenshotDirectory, "mall-desktop-driving.png"),
      fullPage: true,
    });
    await page.locator('[class*="rideFrame"]').screenshot({
      path: path.join(screenshotDirectory, "mall-desktop-ride.png"),
    });
  }

  await page.getByRole("link", { name: /Open display/i }).click();
  const dialog = page.getByRole("dialog", { name: "Currently playing" });
  await dialog.waitFor();
  assert.equal(
    await page.evaluate(
      () => window.__mallRideRuntime.getDebugSnapshot().mode,
    ),
    "paused",
  );
  await dialog.getByRole("button", { name: "Close" }).click();
  assert.equal(
    await page.evaluate(
      () => window.__mallRideRuntime.getDebugSnapshot().mode,
    ),
    "driving",
  );

  const canRestoreContext = await page.evaluate(() => {
    const context = document.querySelector("canvas")?.getContext("webgl2");
    const extension = context?.getExtension("WEBGL_lose_context");
    window.__mallContextExtension = extension;
    extension?.loseContext();
    return Boolean(extension);
  });
  assert.equal(canRestoreContext, true);
  await page.waitForFunction(
    () =>
      window.__mallRideRuntime.getDebugSnapshot().contextStatus === "lost",
  );
  await page.getByText(/restoring its graphics context/i).waitFor();
  await page.evaluate(() => window.__mallContextExtension.restoreContext());
  await page.waitForFunction(
    () =>
      window.__mallRideRuntime.getDebugSnapshot().contextStatus === "active",
  );
  await page.waitForFunction(
    () => window.__mallRideRuntime.getDebugSnapshot().mode === "driving",
  );

  assert.equal(
    await page.evaluate(() => {
      window.__mallRideRuntime.dispose();
      window.__mallRideRuntime.dispose();
      return window.__mallRideRuntime.getDebugSnapshot().contextStatus;
    }),
    "disposed",
  );
  for (let reload = 0; reload < 3; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await waitForRuntime(page);
    assert.equal(await page.locator("canvas.mall-ride-canvas").count(), 1);
  }
  await desktop.close();

  const reduced = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reduced.newPage();
  attachErrorCapture(reducedPage, errors);
  await reducedPage.goto(`${server.origin}/mall?rideDebug`, {
    waitUntil: "networkidle",
  });
  await waitForRuntime(reducedPage);
  await reducedPage.waitForFunction(
    () => window.__mallRideRuntime.getDebugSnapshot().reducedMotion,
  );
  const firstCamera = await reducedPage.evaluate(
    () => window.__mallRideRuntime.getDebugSnapshot().camera,
  );
  await reducedPage.waitForTimeout(600);
  const secondCamera = await reducedPage.evaluate(
    () => window.__mallRideRuntime.getDebugSnapshot().camera,
  );
  assert.deepEqual(firstCamera, secondCamera);
  await reduced.close();

  const fallback = await browser.newContext({
    viewport: { width: 1024, height: 768 },
  });
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      if (type === "webgl2") return null;
      return getContext.call(this, type, ...options);
    };
  });
  const fallbackPage = await fallback.newPage();
  attachErrorCapture(fallbackPage, errors);
  await fallbackPage.goto(`${server.origin}/mall`, { waitUntil: "networkidle" });
  await fallbackPage.getByText(/cannot run the ride/i).waitFor();
  await fallbackPage.getByRole("heading", { name: "Currently Playing" }).waitFor();
  assert.equal(await fallbackPage.getByRole("button", { name: "Add token" }).isDisabled(), true);
  await fallback.close();

  const failedRuntime = await browser.newContext({
    viewport: { width: 1024, height: 768 },
  });
  await failedRuntime.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      if (type === "webgl2" && this.classList.contains("mall-ride-canvas")) {
        return null;
      }
      return getContext.call(this, type, ...options);
    };
  });
  const failedRuntimePage = await failedRuntime.newPage();
  attachErrorCapture(failedRuntimePage, errors);
  await failedRuntimePage.goto(`${server.origin}/mall`, {
    waitUntil: "networkidle",
  });
  await failedRuntimePage
    .getByText("The ride is unavailable. The rest of the mall is still open.")
    .waitFor();
  await failedRuntimePage.getByRole("heading", { name: "Currently Playing" }).waitFor();
  assert.equal(
    await failedRuntimePage.getByRole("button", { name: "Add token" }).isDisabled(),
    true,
  );
  await failedRuntime.close();

  const mobile = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 375, height: 812 },
  });
  const mobilePage = await mobile.newPage();
  attachErrorCapture(mobilePage, errors);
  await mobilePage.goto(`${server.origin}/mall?rideDebug`, {
    waitUntil: "networkidle",
  });
  await waitForRuntime(mobilePage);
  await mobilePage.getByRole("button", { name: "Add token" }).click();
  await mobilePage.waitForFunction(
    () => window.__mallRideRuntime.getDebugSnapshot().mode === "driving",
  );
  const mobileLayout = await mobilePage.evaluate(() => {
    const buttons = [...document.querySelectorAll(".mall-touch-controls button")];
    const rideSurface = document
      .querySelector(".mall-ride-surface")
      ?.getBoundingClientRect();
    const diagnostics = document
      .querySelector(".mall-ride-debug")
      ?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      display: getComputedStyle(document.querySelector(".mall-touch-controls")).display,
      touchTargets: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const containedByRide = rideSurface
          ? rect.left >= rideSurface.left &&
            rect.right <= rideSurface.right &&
            rect.top >= rideSurface.top &&
            rect.bottom <= rideSurface.bottom
          : false;
        const overlapsDiagnostics = diagnostics
          ? !(
              rect.right <= diagnostics.left ||
              rect.left >= diagnostics.right ||
              rect.bottom <= diagnostics.top ||
              rect.top >= diagnostics.bottom
            )
          : false;
        return {
          width: rect.width,
          height: rect.height,
          containedByRide,
          overlapsDiagnostics,
        };
      }),
    };
  });
  assert.ok(mobileLayout.overflow <= 1, JSON.stringify(mobileLayout));
  assert.equal(mobileLayout.display, "flex");
  assert.ok(
    mobileLayout.touchTargets.every(
      ({ width, height }) => width >= 44 && height >= 44,
    ),
    JSON.stringify(mobileLayout),
  );
  assert.ok(
    mobileLayout.touchTargets.every(({ containedByRide }) => containedByRide),
    JSON.stringify(mobileLayout),
  );
  assert.ok(
    mobileLayout.touchTargets.every(
      ({ overlapsDiagnostics }) => !overlapsDiagnostics,
    ),
    JSON.stringify(mobileLayout),
  );
  if (screenshotDirectory) {
    await mobilePage.locator('[class*="rideFrame"]').screenshot({
      path: path.join(screenshotDirectory, "mall-mobile-ride.png"),
    });
    await mobilePage.screenshot({
      path: path.join(screenshotDirectory, "mall-mobile.png"),
      fullPage: true,
    });
  }
  await mobile.close();

  assert.deepEqual(errors, []);
  console.log("mall browser journey verification passed");
} finally {
  await browser.close();
  await server.stop();
}

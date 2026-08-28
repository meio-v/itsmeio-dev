import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";

import { startMallServer } from "./mall-server.mjs";

const projectRoot = new URL("../", import.meta.url);

function run(command, args, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...environment },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const mode = process.argv[2];

if (mode === "typecheck") {
  await run(npm, ["run", "typecheck"]);
  console.log("mall typecheck verification passed");
} else if (mode === "lint") {
  await run(npx, [
    "eslint",
    "app/mall",
    "lib/mall-feature.ts",
    "lib/mall-feature.test.ts",
    "scripts",
  ]);
  console.log("mall lint verification passed");
} else if (mode === "build") {
  await run(npm, ["run", "build"], {
    MALL_ENABLED: "false",
    VERCEL_ENV: "production",
  });
  await access(new URL("../.next/BUILD_ID", import.meta.url));

  const server = await startMallServer({ port: 4309, mallEnabled: false });
  try {
    const [home, mall] = await Promise.all([
      fetch(`${server.origin}/`, { redirect: "manual" }),
      fetch(`${server.origin}/mall`, { redirect: "manual" }),
    ]);
    assert.equal(home.status, 200);
    assert.equal(mall.status, 404);
  } finally {
    await server.stop();
  }
  console.log("mall production build verification passed");
} else {
  throw new Error("Expected one of: typecheck, lint, build");
}

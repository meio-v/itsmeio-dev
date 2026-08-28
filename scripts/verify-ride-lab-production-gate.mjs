import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";

const port = await allocatePort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "production", RIDE_LAB_ENABLED: "true", MALL_ENABLED: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
let serverExited = false;
server.stdout.on("data", (chunk) => { output += String(chunk); });
server.stderr.on("data", (chunk) => { output += String(chunk); });
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

try {
  const deadline = Date.now() + 20_000;
  let home;
  while (Date.now() < deadline) {
    if (serverExited) throw new Error(`rideLab production server exited before readiness:\n${output.slice(-2000)}`);
    try {
      home = await fetch(baseUrl);
      if (home.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(home?.status, 200, output.slice(-2000));
  assert.equal((await fetch(`${baseUrl}/mall/ride-lab`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/mall`)).status, 404);
  console.log("rideLab production gate verification passed");
} finally {
  await stopServer();
}

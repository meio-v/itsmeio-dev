import { spawn } from "node:child_process";

const projectRoot = new URL("../", import.meta.url);

function waitForExit(child, timeoutMs) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });
}

export async function startMallServer({
  port,
  mallEnabled,
  vercelEnvironment = "production",
}) {
  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        MALL_ENABLED: mallEnabled ? "true" : "false",
        VERCEL_ENV: vercelEnvironment,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  const capture = (chunk) => {
    output = `${output}${chunk}`.slice(-20_000);
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);

  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Mall server exited before becoming ready.\n${output}`);
    }
    try {
      const response = await fetch(origin, { redirect: "manual" });
      if (response.status > 0) {
        return {
          origin,
          async stop() {
            if (child.exitCode !== null) return;
            child.kill("SIGTERM");
            if (!(await waitForExit(child, 5_000))) {
              child.kill("SIGKILL");
              await waitForExit(child, 2_000);
            }
          },
        };
      }
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  child.kill("SIGTERM");
  throw new Error(`Timed out waiting for mall server.\n${output}`);
}

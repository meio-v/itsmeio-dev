import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expectedRuntimeHashes = {
  "app/mall/_runtime/MallRideCanvas.tsx": "1195bbc8e89f93da8a8c7a1d956ef4cb8cb485bb067515f68d782ebcd41e2de5",
  "app/mall/_runtime/MallRideRuntime.ts": "a66cab2c4205fad6334780531d34a1df192f48c917785eea58b4a1aa6333bbac",
  "app/mall/_runtime/inputController.ts": "ae55dd9bb46760aaf06391330e372439bed1c77f607c1670a143b866b304c452",
  "app/mall/_runtime/mallPhysics.ts": "b2c9a349b02f661916cc81c94168a89d79a77e95d7da536e466a2a3659cdf835",
  "app/mall/_runtime/rideTuning.ts": "fb8984d22524e81af50d9f6a6f094db674dd8206d6a6ebe16f6effa00f98982e",
  "app/mall/_runtime/rideTypes.ts": "15027221f7a0d45882a788b72c668d6f31237056610c408cf5c0a57e6f7f3fa2",
  "app/mall/_lib/experience-state.ts": "e8bd2416a3a78b102d4f34a501d78dfc865e5db47912afc89b02c57fdfdca6ab",
  "app/mall/_lib/scene-contract.ts": "98c6aa6ba2eddb654d5fbd65920ecded7d04f7604041b351fd9bf0cb498bea41",
  "app/mall/_components/MallSceneSlot.tsx": "0d6987264e936e2dfd1db6e61e51da0658a28053cd6857984e30a252f5b8a707"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

for (const [path, expectedHash] of Object.entries(expectedRuntimeHashes)) {
  const source = await read(path);
  const actualHash = createHash("sha256").update(source).digest("hex");
  assert(actualHash === expectedHash, `${path} changed despite the frozen runtime contract`);
}

const experience = await read("app/mall/_components/MallExperience.tsx");
const css = await read("app/mall/mall.module.css");
const page = await read("app/mall/page.tsx");
const packageJson = JSON.parse(await read("package.json"));

for (const font of ["@fontsource/anton", "@fontsource/bricolage-grotesque", "@fontsource/dotgothic16", "@fontsource/redaction-20"]) {
  assert(packageJson.dependencies?.[font], `${font} is not self-hosted through the project dependencies`);
}

for (const importPath of ["@fontsource/anton", "@fontsource/bricolage-grotesque", "@fontsource/dotgothic16", "@fontsource/redaction-20"]) {
  assert(page.includes(importPath), `${importPath} is not loaded by the mall route`);
}

for (const slot of ["marquee", "controlPanel", "screenGlass", "body"]) {
  assert(experience.includes(`${slot}:`), `texture toggle ${slot} is missing`);
  assert(experience.includes(`data-texture-${slot.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`), `texture data attribute ${slot} is missing`);
}

assert(!experience.includes("sidePanels:"), "side-panel textures should be omitted");
for (const asset of ["cabinet-body.png", "control-panel.png", "screen-glass.png", "marquee.png"]) {
  assert(css.includes(`/mall/textures/${asset}`), `cabinet texture asset is not wired: ${asset}`);
}

for (const label of ["MDL. MP-01 / 100V 60Hz", "DO NOT SIT ON CABINET / 遊技中の飲食はご遠慮ください", "1 PLAY = FREE", "INSP. 08/26"]) {
  assert(experience.includes(label), `cabinet hardware label is missing: ${label}`);
}

assert(experience.includes("aria-hidden=\"true\""), "decorative cabinet layers are not hidden from assistive technology");
assert(experience.includes("coinReturnButton") && experience.includes("coinAperture"), "coin door hardware is incomplete");
assert(experience.includes("Add token"), "Add token copy changed");
assert(experience.includes("Pause") && experience.includes("Resume"), "Pause or Resume copy changed");
assert(css.includes("pointer-events: none"), "decorative texture layers can intercept interaction");
assert(css.includes("mix-blend-mode: screen") && css.includes("mix-blend-mode: multiply") && css.includes("mix-blend-mode: overlay"), "requested cabinet blend modes are incomplete");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "reduced-motion styling is missing");
assert(css.includes("@media (max-width: 760px)"), "existing responsive stacking breakpoint is missing");

console.log("mall restyle verification passed");

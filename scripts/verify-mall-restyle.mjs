import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expectedRuntimeHashes = {
  "app/mall/_runtime/MallRideCanvas.tsx": "abb8a623cfa214c3058c3df1b89179158971e9289b1d8c7b3390e3d978e9d3f3",
  "app/mall/_runtime/MallRideRuntime.ts": "e332b662580d289c8f24f88d547ddacf4d8a05833ec035b414825c21ff35c63c",
  "app/mall/_runtime/inputController.ts": "ae55dd9bb46760aaf06391330e372439bed1c77f607c1670a143b866b304c452",
  "app/mall/_runtime/mallPhysics.ts": "b2c9a349b02f661916cc81c94168a89d79a77e95d7da536e466a2a3659cdf835",
  "app/mall/_runtime/rideTuning.ts": "fe554d62ca6f22ed08e9663a53a784a4e1c61fa7494b2ec068082060e01cbb60",
  "app/mall/_runtime/rideTypes.ts": "15027221f7a0d45882a788b72c668d6f31237056610c408cf5c0a57e6f7f3fa2",
  "app/mall/_lib/experience-state.ts": "f030dd53153acbc6d29bd2d186d3f72f48346085b4505170d068429cb17204b2",
  "app/mall/_lib/scene-contract.ts": "92dde0510a218e4c3c88c7d1108e5cb23f05a81c79e183740bc43f76350a02db",
  "app/mall/_components/MallSceneSlot.tsx": "28785291f046557f8a86906a1ac54ba259d0b61339b96cfa761e278c4c4be55f"
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

for (const font of ["@fontsource/anton", "@fontsource/bricolage-grotesque", "@fontsource/dotgothic16", "@fontsource/goldman", "@fontsource/redaction-20", "@fontsource/wdxl-lubrifont-jp-n"]) {
  assert(packageJson.dependencies?.[font], `${font} is not self-hosted through the project dependencies`);
}

for (const importPath of ["@fontsource/anton", "@fontsource/bricolage-grotesque", "@fontsource/dotgothic16", "@fontsource/goldman", "@fontsource/redaction-20", "@fontsource/wdxl-lubrifont-jp-n"]) {
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

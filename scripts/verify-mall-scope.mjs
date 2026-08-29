import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const base = process.argv[2];
assert.match(base ?? "", /^[0-9a-f]{40}$/);

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const allowed = [
  /^\.gitignore$/,
  /^app\/_components\/(?:CurrentlyPlaying|HomeClient)\.tsx$/,
  /^app\/mall\//,
  /^app\/page\.tsx$/,
  /^content\/currently-playing\.ts$/,
  /^lib\/currently-playing(?:\.test)?\.ts$/,
  /^lib\/mall-feature(?:\.test)?\.ts$/,
  /^package(?:-lock)?\.json$/,
  /^proxy\.ts$/,
  /^scripts\/[^/]+\.mjs$/,
  /^tsconfig\.json$/,
  /^docs\/(?:art|assets|design|specs|testing)\//,
  /^public\/mall\//,
];
const changed = [
  ...git("diff", "--name-only", base, "--").trim().split("\n"),
  ...git("ls-files", "--others", "--exclude-standard").trim().split("\n"),
].filter(Boolean);
assert.ok(changed.length > 0);
for (const file of changed) {
  assert.ok(allowed.some((pattern) => pattern.test(file)), `out-of-scope file: ${file}`);
}

const basePackage = JSON.parse(git("show", `${base}:package.json`));
const currentPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
assert.deepEqual(currentPackage.dependencies, {
  ...basePackage.dependencies,
  "@dimforge/rapier3d-compat": "^0.20.0",
  "@fontsource/anton": "^5.3.0",
  "@fontsource/bricolage-grotesque": "^5.3.0",
  "@fontsource/dotgothic16": "^5.3.0",
  "@fontsource/redaction-20": "^5.3.0",
  three: "^0.185.1",
});
assert.deepEqual(currentPackage.devDependencies, {
  ...basePackage.devDependencies,
  "@types/three": "^0.183.1",
  playwright: "^1.62.1",
});

const experiencePath = "app/mall/_components/MallExperience.tsx";
const after = await readFile(new URL(`../${experiencePath}`, import.meta.url), "utf8");
const authoredCopy = [
  "Take the long way in",
  "Hey! How are you? I hope you&apos;re having a great day.",
  "After Hours Mall",
  "Add token",
  "No disc inserted",
];
const currentlyPlaying = await readFile(
  new URL("../app/mall/_components/CurrentlyPlayingContent.tsx", import.meta.url),
  "utf8",
);
for (const text of authoredCopy) {
  assert.ok(
    after.includes(text) || currentlyPlaying.includes(text),
    `authored copy changed: ${text}`,
  );
}
for (const destination of [
  'href="/"',
  'href="https://www.linkedin.com/in/meio/"',
  'href="https://github.com/meio-v"',
  "href={CURRENTLY_PLAYING_HASH}",
]) {
  assert.ok(after.includes(destination), `destination changed: ${destination}`);
}

const route = await readFile(new URL("../app/mall/page.tsx", import.meta.url), "utf8");
assert.match(route, /if \(!isMallEnabled\(\)\) notFound\(\)/);
const provenance = await readFile(
  new URL("../docs/assets/mall-asset-provenance.md", import.meta.url),
  "utf8",
);
assert.match(provenance, /curated 1\.4 MB GLB set/);
assert.match(provenance, /All third-party sources below are CC0/);
assert.match(provenance, /SIL Open Font License 1\.1/);

console.log("mall scope verification passed");

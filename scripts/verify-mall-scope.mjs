import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const base = process.argv[2];
assert.match(base ?? "", /^[0-9a-f]{40}$/);

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const allowed = [
  /^app\/mall\//,
  /^lib\/mall-feature(?:\.test)?\.ts$/,
  /^package(?:-lock)?\.json$/,
  /^scripts\/[^/]+\.mjs$/,
  /^docs\/(?:art|assets|testing)\//,
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
assert.deepEqual(currentPackage.dependencies, basePackage.dependencies);
assert.equal(currentPackage.devDependencies.playwright, "^1.62.1");

const experiencePath = "app/mall/_components/MallExperience.tsx";
const before = git("show", `${base}:${experiencePath}`);
const after = await readFile(new URL(`../${experiencePath}`, import.meta.url), "utf8");
const authoredCopy = [
  "Take the long way in.",
  "Hey! How are you? I hope you&apos;re having a great day.",
  "Mall wing / after hours",
  "The website still works.",
  "The mall is optional. The links, words, and game log stay ordinary",
  "No ride required",
];
for (const text of authoredCopy) {
  assert.ok(before.includes(text));
  assert.ok(after.includes(text), `authored copy changed: ${text}`);
}
const hrefs = (source) =>
  [...source.matchAll(/href=(?:"[^"]*"|{[^}]*})/g)]
    .map(([value]) => value)
    .sort();
assert.deepEqual(hrefs(after), hrefs(before));

const route = await readFile(new URL("../app/mall/page.tsx", import.meta.url), "utf8");
assert.match(route, /if \(!isMallEnabled\(\)\) notFound\(\)/);
assert.equal(changed.some((file) => file.startsWith("public/")), false);

const provenance = await readFile(
  new URL("../docs/assets/mall-asset-provenance.md", import.meta.url),
  "utf8",
);
assert.match(provenance, /authored procedural Three\.js\s+geometry only/);
assert.match(provenance, /SIL Open Font License 1\.1/);

console.log("mall scope verification passed");

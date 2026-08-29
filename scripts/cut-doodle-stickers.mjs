import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const source = process.argv[2];
const outputDirectory = process.argv[3];

assert.ok(source, "usage: node scripts/cut-doodle-stickers.mjs <sheet.png> <output-directory>");
assert.ok(outputDirectory, "an output directory is required");

const cuts = {
  "mall-directory": {
    left: 8, top: 10, width: 486, height: 498,
    mask: "M20 70 160 25 250 15 310 30 414 35 425 60 414 118 449 165 440 238 470 315 445 385 395 450 315 460 250 480 175 465 100 480 48 440 28 375 43 330 12 290 31 230 10 170Z",
  },
  "free-play-token": {
    left: 490, top: 24, width: 318, height: 340,
    mask: '<ellipse cx="160" cy="165" rx="151" ry="151" />',
  },
  "memory-card": {
    left: 835, top: 8, width: 326, height: 462,
    mask: "M55 15 280 30 310 365 240 440 65 410 15 315 25 65Z",
  },
  "food-court-receipt": {
    left: 1134, top: 2, width: 384, height: 552,
    mask: "M40 10 360 50 335 525 25 515Z",
  },
  "moped-helmet": {
    left: 2, top: 480, width: 470, height: 544,
    mask: "M100 50 250 20 390 75 430 200 420 350 370 420 320 520 270 535 210 500 160 530 105 475 78 400 28 360 18 200Z",
  },
  "peace-star": {
    left: 424, top: 378, width: 350, height: 426,
    mask: '<path d="M166 27 206 132 263 103 277 133 259 185 226 247 196 273 166 312 133 276 96 248 74 198 96 152Z" /><path d="M256 105 278 91 279 65 297 49 309 80 324 54 340 80 333 121 310 154 274 171 255 155Z" /><path d="M100 151 72 164 27 172 31 212 8 248 20 291 58 309 88 277 113 242Z" /><path d="M80 238 132 240 153 281 116 325 62 310Z" /><path d="M142 272 116 310 76 352 67 391 106 417 145 382 166 312Z" /><path d="M186 270 214 343 256 392 300 362 290 321 226 247Z" /><path d="M32 132 42 112 55 130 71 123 66 142 78 154 57 158 48 178 40 159 17 161 31 145Z" />',
  },
  "music-minidisc": {
    left: 756, top: 468, width: 436, height: 430,
    mask: "M35 20 390 40 430 345 360 420 25 385 5 330 20 80Z",
  },
  "out-of-order": {
    left: 454, top: 772, width: 444, height: 252,
    mask: "M25 45 75 20 110 40 322 65 338 82 350 89 412 101 398 198 360 222 304 207 72 194 20 166 7 86Z",
  },
  "moped-photo-strip": {
    left: 1218, top: 518, width: 270, height: 506,
    mask: "M70 20 245 45 220 490 20 470Z",
  },
};

await mkdir(outputDirectory, { recursive: true });

for (const [name, crop] of Object.entries(cuts)) {
  const object = await sharp(source)
    .extract(crop)
    .ensureAlpha()
    .png()
    .toBuffer();
  const maskElement = crop.mask.startsWith("<")
    ? crop.mask
    : `<path d="${crop.mask}" />`;
  const mask = Buffer.from(
    `<svg width="${crop.width}" height="${crop.height}" xmlns="http://www.w3.org/2000/svg"><g fill="white">${maskElement}</g></svg>`,
  );

  const masked = await sharp(object)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp(masked)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(outputDirectory, `${name}.png`));
}

console.log(`cut ${Object.keys(cuts).length} stickers into ${outputDirectory}`);

import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const inventoryDirectory = path.resolve(process.argv[2]);
const outputPath = path.resolve(process.argv[3] ?? path.join(inventoryDirectory, "contact-sheet.png"));
const inventory = JSON.parse(await readFile(path.join(inventoryDirectory, "inventory.json"), "utf8"));

const cards = await Promise.all(inventory.objects.flatMap((object) => object.renders.map(async (render) => {
  const image = await readFile(path.join(inventoryDirectory, render.file), "base64");
  return `<figure><img src="data:image/png;base64,${image}" alt="${object.name} ${render.view}"><figcaption><strong>${object.index}. ${object.name} · ${render.view}</strong><span>${object.vertices.toLocaleString()}v · ${object.triangles.toLocaleString()}t</span></figcaption></figure>`;
})));

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  await page.setContent(`<!doctype html><style>
    *{box-sizing:border-box}body{margin:0;background:#130d22;color:#f7efe3;font:13px ui-monospace,monospace}
    header{padding:18px 24px;border-bottom:1px solid #ee4f87}h1{margin:0;font-size:21px}
    main{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px}figure{margin:0;border:1px solid #625879;background:#201733}
    img{display:block;width:100%;aspect-ratio:3/4;object-fit:contain;background:#2b2140}figcaption{display:grid;gap:3px;padding:7px}
    strong{font-size:11px;overflow-wrap:anywhere}span{color:#a5dedd;font-size:10px}
  </style><header><h1>reviewed clothing donor inventory</h1></header><main>${cards.join("")}</main>`);
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`streetwear donor contact sheet passed: ${outputPath}`);
} finally {
  await browser.close();
}

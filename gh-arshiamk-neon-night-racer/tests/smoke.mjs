// Headless smoke test: serves the repo, loads the game in the system
// Chrome via playwright-core, starts a run, simulates 30 s of driving,
// and asserts the sim advances with zero console/page errors.
//
//   Setup once:  npm install
//   Run:         npm test

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = normalize(join(ROOT, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(ROOT + sep) && file !== join(ROOT, "index.html")) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file)] ?? "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const url = m.location()?.url ?? "";
  if (url.endsWith("music.mp3")) return; // optional-asset probe, 404 is fine
  errors.push(`console: ${m.text()} (${url})`);
});

await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.game, null, { timeout: 15000 });
await page.waitForTimeout(2000); // let optional GLB assets settle

const result = await page.evaluate(() => {
  const g = window.game;
  g._start();
  window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
  for (let i = 0; i < 1800; i++) g.step(1 / 60); // 30 s at full throttle
  window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" }));
  g.world.render();
  return {
    state: g.state,
    dist: g.score.dist,
    kmh: g.vehicle.kmh,
    models: [...g.assets.models.keys()],
  };
});

await browser.close();
server.close();

const failures = [];
if (result.state !== "running" && result.state !== "gameover") {
  failures.push(`unexpected state: ${result.state}`);
}
if (result.dist < 500) failures.push(`distance too low: ${result.dist}m`);
failures.push(...errors);

console.log(
  `state=${result.state} dist=${Math.round(result.dist)}m ` +
    `speed=${Math.round(result.kmh)}km/h models=[${result.models.join(", ")}]`,
);
if (failures.length) {
  console.error("SMOKE FAIL:\n" + failures.join("\n"));
  process.exit(1);
}
console.log("SMOKE PASS");

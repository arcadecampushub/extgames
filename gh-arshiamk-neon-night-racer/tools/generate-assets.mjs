#!/usr/bin/env node
// Meshy text-to-3D asset generator for Neon Night Racer.
//
//   node tools/generate-assets.mjs            # generate everything missing
//   node tools/generate-assets.mjs hero-car   # generate specific asset(s)
//
// Reads MESHY_API_KEY from the environment or the gitignored .env file.
// Progress is tracked in assets/models/manifest.json so re-runs resume:
// finished assets are skipped, in-flight Meshy tasks are re-polled rather
// than re-created (each preview+refine costs credits).

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = resolve(ROOT, "assets", "models");
const MANIFEST_PATH = resolve(MODELS_DIR, "manifest.json");
const API = "https://api.meshy.ai/openapi/v2/text-to-3d";
const POLL_MS = 8000;
const TASK_TIMEOUT_MS = 25 * 60 * 1000;
const CONCURRENCY = 3;

const KEY =
  process.env.MESHY_API_KEY ??
  (() => {
    const env = readFileSync(resolve(ROOT, ".env"), "utf8");
    const m = env.match(/^MESHY_API_KEY=(.+)$/m);
    if (!m) throw new Error("MESHY_API_KEY not found in env or .env");
    return m[1].trim();
  })();

const STYLE =
  "retro-futuristic synthwave night city game asset, low poly, game-ready, clean silhouette, PBR textures";

const ASSETS = {
  "hero-car": {
    prompt: `sleek cyberpunk sports car, aggressive low wedge silhouette, dark gunmetal body with glowing neon pink accent lines and trim, thin horizontal light bar taillight, futuristic supercar, ${STYLE}`,
    polycount: 16000,
  },
  "traffic-sedan": {
    prompt: `futuristic compact sedan car, rounded body, dark blue paint with subtle cyan trim lights, ordinary commuter vehicle, ${STYLE}`,
    polycount: 8000,
  },
  "traffic-suv": {
    prompt: `futuristic boxy SUV car, tall body, dark green paint with subtle amber trim lights, ordinary commuter vehicle, ${STYLE}`,
    polycount: 8000,
  },
  "traffic-taxi": {
    prompt: `futuristic yellow taxi cab car, roof sign, checkered stripe, worn paint, cyberpunk city taxi, ${STYLE}`,
    polycount: 8000,
  },
  "traffic-van": {
    prompt: `futuristic delivery van, boxy cargo body, dark purple paint with holographic decal panels, cyberpunk courier vehicle, ${STYLE}`,
    polycount: 8000,
  },
  "building-tower": {
    prompt: `tall futuristic skyscraper tower, glass and steel, glowing neon cyan and magenta window strips and rooftop antenna spire, cyberpunk architecture, ${STYLE}`,
    polycount: 10000,
  },
  "building-block": {
    prompt: `wide mid-rise futuristic apartment block, layered balconies, neon signage panels on facade, glowing windows, cyberpunk architecture, ${STYLE}`,
    polycount: 10000,
  },
  "building-pagoda": {
    prompt: `futuristic neon pagoda tower, stacked tiered roofs with glowing pink eave lights, cyberpunk asian architecture, holographic sign, ${STYLE}`,
    polycount: 10000,
  },
  "prop-gantry": {
    prompt: `overhead highway sign gantry, wide steel truss bridge structure spanning a road, glowing neon billboard panels, cyberpunk signage, ${STYLE}`,
    polycount: 6000,
  },
};

// --- helpers ---------------------------------------------------------------

const log = (name, msg) => console.log(`[${name}] ${msg}`);

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(m) {
  mkdirSync(MODELS_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + "\n");
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meshy ${method} ${path} -> HTTP ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

async function createTask(body) {
  const out = await api("POST", "", body);
  const id = out.result ?? out.id;
  if (!id) throw new Error(`No task id in response: ${JSON.stringify(out)}`);
  return id;
}

async function waitTask(name, id, label) {
  const t0 = Date.now();
  let lastProgress = -1;
  for (;;) {
    if (Date.now() - t0 > TASK_TIMEOUT_MS) {
      throw new Error(`${label} task ${id} timed out`);
    }
    const task = await api("GET", `/${id}`);
    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(
        `${label} task ${id} ${task.status}: ${task.task_error?.message ?? "?"}`,
      );
    }
    if (task.progress !== lastProgress) {
      lastProgress = task.progress;
      log(name, `${label} ${task.status} ${task.progress ?? 0}%`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

// --- pipeline --------------------------------------------------------------

const manifest = loadManifest();

async function generate(name) {
  const spec = ASSETS[name];
  const entry = (manifest[name] ??= { prompt: spec.prompt });
  const dest = resolve(MODELS_DIR, `${name}.glb`);

  if (entry.file && existsSync(dest)) {
    log(name, "already generated — skipping");
    return;
  }

  if (!entry.previewId) {
    entry.previewId = await createTask({
      mode: "preview",
      prompt: spec.prompt,
      art_style: "realistic",
      topology: "triangle",
      target_polycount: spec.polycount,
      should_remesh: true,
    });
    saveManifest(manifest);
    log(name, `preview task ${entry.previewId}`);
  }
  await waitTask(name, entry.previewId, "preview");

  if (!entry.refineId) {
    entry.refineId = await createTask({
      mode: "refine",
      preview_task_id: entry.previewId,
      enable_pbr: true,
    });
    saveManifest(manifest);
    log(name, `refine task ${entry.refineId}`);
  }
  const refined = await waitTask(name, entry.refineId, "refine");

  const url = refined.model_urls?.glb;
  if (!url) throw new Error(`no GLB url: ${JSON.stringify(refined.model_urls)}`);
  const bytes = await download(url, dest);
  entry.file = `${name}.glb`;
  entry.bytes = bytes;
  saveManifest(manifest);
  log(name, `done — ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(ASSETS);
for (const n of names) {
  if (!ASSETS[n]) {
    console.error(`Unknown asset "${n}". Known: ${Object.keys(ASSETS).join(", ")}`);
    process.exit(1);
  }
}

let failed = 0;
const queue = [...names];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (;;) {
      const name = queue.shift();
      if (!name) return;
      try {
        await generate(name);
      } catch (err) {
        failed++;
        console.error(`[${name}] FAILED: ${err.message}`);
      }
    }
  }),
);

console.log(failed ? `\n${failed} asset(s) failed` : "\nAll assets ready");
process.exit(failed ? 1 : 0);

# Neon Night Racer 3D — Implementation Plan

- **Date:** 2026-08-09
- **Spec:** [`../specs/2026-08-09-neon-night-racer-3d-design.md`](../specs/2026-08-09-neon-night-racer-3d-design.md)
- **Prerequisite status:** Meshy API key received and verified (2,080 credits available). Key lives in gitignored `.env`, never committed.

Each phase ends with a working, verifiable state. Phases 3 and 4 (assets, audio) can run in parallel with late gameplay polish because the game is playable on placeholders throughout.

## Phase 1 — 3D scaffold (playable placeholder build)

Replace the 2D canvas engine with a Three.js scene you can drive in.

1. Rewrite `index.html`: import map pinning Three.js (and its `examples/jsm` addons path) to a specific version on a CDN; keep the DOM HUD skeleton.
2. `js/world.js`: renderer, chase camera, fog, night sky (stars + horizon sun-grid), ambient/directional light, `EffectComposer` with one `UnrealBloomPass`, pixel-ratio clamp.
3. `js/track.js`: endless highway from a pool of recycled road chunks along a curving/undulating spline; emissive cyan rumble strips; lane markings via texture or geometry.
4. `js/vehicle.js`: placeholder hero car (primitive box build with emissive taillights), arcade physics ported from the old `car.js` feel (accel/brake/coast/off-road slowdown), lateral steering with banking.
5. `js/input.js`: keyboard state (arrows/WASD + Enter), normalized interface.
6. `js/main.js`: game loop with fixed-timestep update, state machine (title → running), wiring.
7. Delete `js/road.js`, `js/car.js`, `js/game.js`, `js/utils.js` (2D engine); fold tuning values into a new `js/config.js`.

**Verify:** serve locally, drive the road at 60 fps, no console errors. Curves/hills visible, bloom glowing, camera follows with speed FOV.

## Phase 2 — Gameplay systems

1. `js/traffic.js`: lane-based spawning ahead of player, slower cruise speeds, recycling, AABB-ish collision + near-miss detection.
2. `js/score.js`: distance scoring × combo; near-miss combo (cap ×10, 5 s decay); collision → speed cut to 40 %, combo reset; checkpoint timer (60 s start, +20 s per 1,000 m, ramping down); difficulty ramp (traffic density up with distance); localStorage high score.
3. `js/hud.js`: speed, score, combo, timer; start screen; game-over screen with best score and restart.
4. Camera shake on collision; near-miss visual flash.

**Verify:** full game loop — start, drive, weave, crash, time out, restart. Difficulty visibly ramps. High score persists across reloads.

## Phase 3 — Meshy asset pipeline

1. `tools/generate-assets.mjs` (Node, dev-only): reads `MESHY_API_KEY` from `.env`, drives Meshy text-to-3D (preview → refine), polls to completion, downloads GLBs to `assets/models/`. Idempotent via a manifest (`assets/models/manifest.json`) so re-runs skip finished assets.
2. Generate: hero car (cyberpunk sports car, neon-pink accents), 3–4 traffic vehicles, 4–6 neon buildings, streetlight, barrier, highway sign. Low-poly game-ready prompts.
3. `js/assets.js`: GLBLoader with progress UI, manifest-driven, primitive fallback per slot when a model is missing/unloadable.
4. Integrate: hero car swap (plate decal applied in-engine), traffic variety, instanced buildings/props along track chunks.
5. Enforce ≤ ~15 MB total: decimate/re-request oversized models.

**Verify:** page loads with real models; payload within budget; fallbacks still work with `assets/` deleted.

## Phase 4 — Audio

1. Looping synthwave track via the session's AI audio service (CC0 fallback if looping is poor) → `assets/audio/`.
2. `js/audio.js`: music (starts on first interaction), procedural engine hum following speed, near-miss whoosh, collision impact; mute toggle in HUD.

**Verify:** audio starts only after interaction; loop seam acceptable; mute works.

## Phase 5 — Polish, mobile, testing, docs

1. Touch controls (steer/accel/brake overlay, shown only on touch devices).
2. Performance pass: instancing check, allocation-free frame loop, draw-distance/fog tuning; verify 60 fps.
3. Playwright smoke test (dev-only, not committed to site payload): load page, start run, simulate input, assert distance increases and zero console errors.
4. Update `README.md` (new architecture, controls, credits for Meshy-generated assets), retake `docs/screenshot.png`.
5. Final commit(s); leave push/deploy decision to the owner.

**Verify:** smoke test green; mobile layout sane in devtools emulation; README accurate.

## Checkpoints

- After each phase: commit, then a quick review pause for the owner (screenshot or run instructions provided).
- Tuning values are expected to change during Phase 2/5 play-testing; the spec's numbers are starting points.

## Risks

- **Meshy output quality/scale variance** — mitigated by placeholder-first design, per-asset retries, and in-engine normalization (scale/orient on import).
- **CDN import map availability** — pin exact versions; if the chosen CDN misbehaves, vendor the Three.js build into `vendor/` (still no build step).
- **Perf on low-end machines** — pixel-ratio clamp, bloom resolution scale, and a reduced-effects fallback if needed.

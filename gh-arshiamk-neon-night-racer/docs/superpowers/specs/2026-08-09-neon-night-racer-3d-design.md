# Neon Night Racer 3D — Design Spec

- **Date:** 2026-08-09
- **Status:** Approved design, pending implementation plan
- **Author:** Arshia Mirshekar with Claude Code

## Summary

Rebuild Neon Night Racer from a 2D-canvas pseudo-3D demo into a real-time 3D arcade racer built on Three.js, with AI-generated 3D assets from Meshy, while remaining a static site that loads instantly from GitHub Pages.

## Decisions Made

| Question | Decision |
| --- | --- |
| Engine direction | Real 3D in the browser (Three.js/WebGL). Not a Godot/Unity port; the retro 2D engine is retired. |
| Core game mode | Endless arcade: traffic weaving, near-miss combos, checkpoint timer, high-score chase. No AI opponent races, no designed tracks (future phases). |
| Asset pipeline | Meshy text-to-3D REST API. Requires a Meshy API key supplied by the owner at asset-generation time. |

## Pillars

1. **Looks premium in a single screenshot** — neon city, bloom, real car models, wet asphalt.
2. **Feels fast** — strong sense of speed, responsive arcade handling.
3. **Zero friction to play** — no install, loads in seconds, keyboard or touch.

## Architecture

**Stack:** Three.js, pinned to a specific version via an ES-module import map in `index.html`. No bundler and no build step; the repo remains a static site and the existing GitHub Pages deployment is unchanged. Local development uses any static server (e.g. `python -m http.server`) because ES modules do not load over `file://`.

**Modules** (each owns one concern; communicates through constructor injection and small public methods):

| Module | Responsibility |
| --- | --- |
| `js/main.js` | Entry point, game loop, game-state machine (title → running → game over). |
| `js/world.js` | Scene graph, camera, lighting, fog, sky, post-processing (single bloom pass). |
| `js/track.js` | Endless highway: pool of road chunks recycled along a curving/undulating spline; owns roadside placement (buildings, streetlights, barriers). |
| `js/vehicle.js` | Player car: arcade physics, lateral movement, banking/tilt, headlights, exhaust particles. |
| `js/traffic.js` | Traffic spawning, movement, recycling, and collision/near-miss queries. |
| `js/score.js` | Score, combo multiplier, checkpoint timer, difficulty ramp, localStorage high score. |
| `js/hud.js` | DOM overlay: speed, score, combo, timer, start and game-over screens. |
| `js/audio.js` | Music playback, procedural engine hum (Web Audio), near-miss and impact SFX. |
| `js/input.js` | Keyboard (arrows/WASD) and on-screen touch controls, exposed as a normalized input state. |
| `js/assets.js` | GLB loading with progress, and placeholder primitive fallbacks when a model is missing. |

The existing 2D engine files (`road.js`, `car.js`, `constants.js` in their current form, and canvas-2D rendering in `game.js`) are removed, not left dead. `README.md` is updated to describe the new architecture.

## World & Rendering

- Endless highway assembled from a small pool of road chunks repositioned ahead of the player along a spline with gentle curves and elevation changes. The player perceives an infinite road; memory use is constant.
- Synthwave city skyline on both sides: instanced building meshes with emissive windows, plus streetlights and barriers placed per chunk.
- Road material reads as wet asphalt: dark, low-roughness, environment reflections.
- Sky: night gradient with stars and a synthwave sun/grid on the horizon.
- Distance fog hides chunk recycling and adds depth.
- One `UnrealBloomPass` provides all neon glow (windows, taillights, rumble strips, sun).
- Camera: chase cam behind the hero car with speed-based FOV widening and subtle shake on collision.

## Asset Pipeline (Meshy)

- **Prerequisite:** a Meshy API key from the owner (meshy.ai; free tier exists). Not needed until the asset-generation phase. Supplied at runtime of the generation script — never committed to the repo.
- Assets generated via Meshy's text-to-3D REST API (preview → refine flow), requested as low-poly, game-ready, textured meshes, downloaded as GLB and committed under `assets/models/`.
- **Asset list:** 1 hero car (cyberpunk sports car, neon-pink accents), 3–4 traffic vehicles (visually distinct silhouettes), 4–6 building variants, small props (streetlight, barrier, highway sign).
- The ARSHIAMK license plate is applied in-engine as a texture decal on the hero car, not baked by Meshy.
- **Budget:** total committed model payload ≤ ~15 MB. Individual models are decimated/re-exported if oversized.
- **Placeholder-first:** the game is built and fully playable with primitive-geometry stand-ins (`assets.js` fallbacks) before any Meshy asset exists. Generated models slot in without code changes beyond the asset manifest.

## Gameplay

All numbers below are initial tuning values, expected to change during play-testing.

- **Driving:** accelerate/brake/steer with arcade feel — quick steering response, slight drift at high speed, car banks into lateral movement. Off-road (beyond the shoulder) heavily slows the car, as in the current game.
- **Traffic:** spawns ahead of the player in lanes, moving slower than the player's top speed; density and speed variance scale with distance traveled. Recycled when passed or too far ahead.
- **Near-miss:** passing a traffic car within a lateral threshold (~half a car width) at positive closing speed increments the combo multiplier (×1 → ×2 → … capped at ×10). The combo decays to ×1 if no near-miss occurs for 5 seconds, and resets instantly on collision.
- **Collision:** glancing or rear-end contact costs speed (cut to ~40%), resets combo, and triggers screen shake and impact SFX. No instant death.
- **Timer:** the run starts with 60 seconds; a checkpoint every 1,000 m adds 20 seconds (values ramp down slightly as difficulty rises). The run ends when the timer reaches zero.
- **Scoring:** distance × combo multiplier, plus flat near-miss bonuses. High score persists in `localStorage`.
- **Difficulty ramp:** with distance, traffic density rises and time bonuses shrink.

## Audio

- **Music:** one looping synthwave track. Meshy does not produce audio; the track is generated with the AI audio service connected to the working session, falling back to a CC0 track only if the generated result loops badly. Stored in `assets/audio/`.
- **Engine:** procedural Web Audio hum whose pitch and intensity follow speed.
- **SFX:** whoosh on near-miss, impact on collision — procedural or tiny samples.
- Audio starts only after first user interaction (browser autoplay policy); a mute toggle lives in the HUD.

## HUD & Screens

- DOM overlay keeps the existing cyan/pink synthwave identity: speed (km/h), score, combo multiplier, and remaining time while driving.
- **Start screen:** title, controls, "Press ENTER / tap to start."
- **Game-over screen:** final score, best score, "play again."
- On touch devices, on-screen steer/accelerate/brake controls appear; they are hidden when a keyboard is used.

## Performance & Testing

- **Target:** 60 fps on a mid-range laptop. Techniques: instanced roadside geometry, recycled chunks and traffic (no per-frame allocation), capped draw distance with fog, a single post-processing pass, pixel-ratio clamp on high-DPI screens.
- **Automated:** a Playwright smoke test loads the page, starts a run, simulates a few seconds of input, and asserts no console errors and that distance increases. Playwright is a development-only tool run from the working machine; it adds no dependency, build step, or `node_modules` to the shipped site.
- **Manual:** play-testing for handling feel, difficulty curve, and readability of traffic at speed.

## Deployment

Unchanged: static files on the `main` branch served by GitHub Pages. New requirements are only that models/audio are committed under `assets/` and that Three.js resolves via the import map (CDN with pinned version).

## Out of Scope (future phases)

- AI opponent races, laps, positions
- Multiplayer
- Car customization / garage
- Multiple designed tracks or biomes

## Prerequisites

- Meshy API key from the owner (needed only when asset generation starts; placeholders unblock all other work).

## Implementation Notes (added 2026-08-09, post-build)

Deviations from the design above, made during implementation:

- **Music is procedural, not generated.** The connected AI audio service turned out to be speech-only (its music model is restricted to an internal pipeline), so the soundtrack is a procedural Web Audio synthwave loop — seamless by construction. `assets/audio/music.mp3` overrides it when present.
- **Skyline is procedural filler + three Meshy landmarks.** Instanced canvas-textured buildings proved high-quality and perf-optimal for the dense skyline, so the "4–6 building variants" became three Meshy landmark buildings (tower, block, pagoda) placed as set-pieces among the procedural filler, plus the sign gantry. The barrier and streetlight props stayed procedural.
- **Near-miss threshold widened** from the spec's implied half-car-width to |Δlat| < 3.2 m (~1.3 m edge clearance) — the literal reading left a 20 cm trigger band that was untriggerable in play.
- **Asset budget landed at 3.5 MB** (spec allowed ~15 MB) after Draco + 1K WebP compression of 82 MB raw Meshy output.

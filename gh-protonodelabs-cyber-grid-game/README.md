# Cyber Grid Game

A neon cyberpunk falling-block puzzle game playable in the browser. Built with vanilla JavaScript, HTML5 Canvas, and Vite — no frameworks, no dependencies beyond the build tool.

**[Play it live →](https://proto-nodelabs.com/cyber-grid-game/)**

![Cyber Grid Game](assets/background_img.png)

---

## Features

- Falling-block puzzle gameplay with full piece rotation and collision detection
- Dynamic difficulty — speed increases as you clear lines
- Original chiptune soundtrack with in-game mute/volume controls (persisted via localStorage)
- Responsive SFX: rotate, lock, line clear, hard drop, soft drop
- Visual effects: screen shake, chromatic aberration, particle system, flash effects
- Cyberpunk aesthetic with dark neon color palette
- ProtoNodeLabs brand integration

---

## Controls

| Key | Action |
|---|---|
| `←` / `→` | Move piece left / right |
| `↑` | Rotate piece |
| `↓` | Soft drop |
| `Space` | Hard drop |
| `M` | Toggle music |
| `S` | Toggle SFX |

---

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy the contents of `dist/` to any static host.

---

## Stack

- Vanilla JavaScript (ES modules)
- HTML5 Canvas
- [Vite](https://vitejs.dev/) for dev server and build

---

## Audio Credits

All audio assets are Pixabay License (free for commercial use). See [CREDITS.md](CREDITS.md) for full attribution.

---

## Legal

Not affiliated with or endorsed by Tetris Holding / The Tetris Company.

---

Built by [ProtoNodeLabs](https://proto-nodelabs.com).

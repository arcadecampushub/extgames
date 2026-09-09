# 🚀 Nova Rift

An 8-bit pixel arcade space shooter that runs from a single HTML file — no build step, no frameworks, no dependencies. Clear the waves, grab power-ups, and survive a boss fight every five levels as the difficulty climbs.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-0-3ce6ff)
![License](https://img.shields.io/badge/license-MIT-9b5cff)

> **Play it live:** https://evelinvee.github.io/nova-rift/ — or download `index.html` and open it in any browser. No build, no install.

---

## ✨ Features

- **Single self-contained file** — zero dependencies, no bundler, no build step
- **Pixel-art visuals** — hand-built sprites, CRT scanlines, parallax starfield, particles & screen shake
- **Level progression** with on-screen banners and rising difficulty
- **Boss fights** every 5 levels, with a health bar and aimed fire
- **Power-ups** dropped by enemies: rapid fire, triple shot, stacking shield
- **Procedural sound** via the Web Audio API (mutable) — no audio files
- **Persistent high score** saved in `localStorage`
- Plays with **keyboard *and* touch** — fully mobile-friendly

**Controls**

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | `←` `→` arrows | drag finger |
| Shoot | `Space` | tap screen |
| Pause | `P` / `Esc` | ⏸ button |
| Mute | `M` | ♪ button |

## ▶️ Play it

- **Live:** https://evelinvee.github.io/nova-rift/
- **Locally:** download `index.html` and open it in any modern browser.

```bash
git clone https://github.com/evelinvee/nova-rift.git
cd nova-rift
# open index.html in your browser
```

## 🗂️ Structure

```
index.html   # the entire game — render loop, physics, audio, input
README.md
LICENSE
```

## 🛠️ Tech

Pure **HTML5 Canvas + vanilla JavaScript**. No libraries, no bundler — the whole game (rendering, physics, collisions, particles, audio, input) lives in one file.

## 📄 License

MIT © [evelinvee](https://github.com/evelinvee)

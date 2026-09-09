# Changelog

All notable changes to go are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project document suite: `CHANGELOG.md`, `ROADMAP.md`, `CONTRIBUTING.md`.
- AgentGate PR guardrails (`.agentgate.yml`).

## [1.0.1] — 2026-06-17

### Fixed
- The **Hard (MCTS) opponent** was playing near-randomly — ignoring free captures
  and failing to defend its own stones — because it was starved for simulations
  (~1 visit per candidate move). It now runs far more simulations (≈7× faster core
  flood fill, in-place rollouts), plays tactically-biased rollouts that respond to
  ataris, searches only heuristic-pruned moves, and blends MCTS win-rate with a
  heuristic prior so it reliably takes captures and defends stones in atari.

## [1.0.0] — 2026-06-17

### Added
- First complete release of **Go (圍棋)**, a browser-based version of the board game.
- Full rules engine: captures, liberties, suicide and ko prevention, pass, and resign.
- Territory scoring with dead-stone marking and komi (area scoring).
- Two-player local play, and a computer opponent — **Easy** (heuristic) or **Hard** (MCTS) — as either color.
- Modern, responsive board for desktop and mobile.
- Installable PWA with offline play via a service worker.
- Built-in Rules guide for newcomers.

[Unreleased]: https://github.com/brett-buskirk/go/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/brett-buskirk/go/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/brett-buskirk/go/releases/tag/v1.0.0

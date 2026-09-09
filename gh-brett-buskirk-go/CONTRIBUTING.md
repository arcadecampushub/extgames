# Contributing

- **No direct commits to `main`** — branch → PR (`gh pr create`) → green checks → merge.
- **AgentGate runs on every PR** — `secrets` + `dangerous_patterns` block; `scope` is advisory.
- **Commits are signed & Verified**; never commit secrets (`.env`, keys are gitignored).
- Branch naming: `feat/…`, `fix/…`, `docs/…`, `chore/…`.

There is no build step — the game is plain static HTML/CSS/JavaScript. To run it
locally, serve the folder over HTTP so the service worker and offline support work:
`python3 -m http.server`, then visit http://localhost:8000.

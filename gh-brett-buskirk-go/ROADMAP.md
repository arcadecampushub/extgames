# Roadmap

Go (圍棋) is a complete, released game (latest: **v1.0.1**). The rules engine,
scoring, computer opponents, responsive board, and offline PWA all ship and work.
This roadmap tracks genuine nice-to-haves, not a rewrite — the game is done and
in maintenance.

## Maintenance

- Keep it working: the app is plain static files with a pinned jQuery and a
  service worker; the main ongoing task is verifying it still loads, installs, and
  plays offline across current browsers.
- Fix bugs as they surface in the rules engine, scoring, or the AI opponents.

## Nice-to-haves

- [ ] **Selectable board size** — offer 9×9 and 19×19 in addition to the current 13×13.
- [ ] **Move history / undo** — a simple back button and optional SGF export for review.
- [ ] **Stronger Hard opponent** — deeper MCTS or a small policy heuristic to improve
      positional play (it is tactically sound but casual-strength positionally).

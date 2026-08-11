# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free Connections-style word puzzle game built for a wedding reception, meant to be hosted on GitHub Pages. No build step, no package manager, no framework — just `index.html`, `script.js`, and `styles.css`.

## Running locally

There's no build/test/lint tooling. Serve the folder with any static file server (needed because puzzles are loaded via `fetch`, which won't work from a `file://` URL), e.g.:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html?puzzle=sample`.

## Architecture

- **`index.html`** — single page shell with three toggled sections: the puzzle picker (`#puzzle-list`), the game board (`#game`), and the end screen (`#end-screen`). `script.js` shows/hides these via the `hidden` class rather than routing between pages.
- **`script.js`** — all app logic, no modules/bundler. Puzzle selection is driven entirely by the `?puzzle=<id>` query string:
  - No `puzzle` param → renders the puzzle picker from the hardcoded `PUZZLES` array (id + title only).
  - `puzzle=<id>` present → fetches `puzzles/<id>.json`, validates it (`validatePuzzle`), and starts the game (`resetGame`).
  - Game state (`words`, `selected`, `solvedGroupNames`, `mistakesRemaining`) is module-level and mutated directly; `render()` is called after every state change and does a full re-render of the grid/solved groups/status row (no diffing, no framework).
  - Win condition: all 4 groups solved. Loss condition: `mistakesRemaining` hits 0 — both go through `endGame()`.
- **`puzzles/*.json`** — puzzle data, one file per puzzle. Shape:
  ```json
  {
    "title": "...",
    "subtitle": "...",
    "maxMistakes": 4,
    "winMessage": "...",
    "groups": [ { "name": "...", "words": ["...", "...", "...", "..."] }, ... ]
  }
  ```
  Exactly 4 groups, each with exactly 4 unique words (case-insensitive uniqueness across the whole puzzle) — enforced client-side by `validatePuzzle`.
- **`styles.css`** — plain CSS with custom properties for theming (`--good-1..4` are the four solved-group reveal colors, matching NYT Connections' difficulty-tier coloring convention).

## Adding a new puzzle

1. Copy `puzzles/sample.json` to `puzzles/<id>.json` and edit `title`/`subtitle`/`groups`.
2. Register it in the `PUZZLES` array at the top of `script.js` (`{ id: "<id>", title: "..." }`) so it shows up on the picker screen.
3. The full URL (`index.html?puzzle=<id>`) is what gets turned into a QR code for guests — see `README.md` for the deployment/QR workflow.

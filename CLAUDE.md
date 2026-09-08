# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free Connections-style word puzzle game built for a wedding reception, meant to be hosted on GitHub Pages. No build step, no package manager, no framework — just `index.html`, `script.js`, and `styles.css`.

## Running locally

There's no build/test/lint tooling. Serve the folder with any static file server (needed because puzzles are loaded via `fetch`, which won't work from a `file://` URL), e.g.:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html?puzzle=mj-places` (or any other id in `puzzles/`).

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
    "backgroundImage": "images/....jpg",
    "maxMistakes": 4,
    "winMessage": "...",
    "groups": [ { "name": "...", "words": ["...", "...", "...", "..."], "details": "..." }, ... ]
  }
  ```
  Exactly 4 groups, each with exactly 4 unique words (case-insensitive uniqueness across the whole puzzle) — enforced client-side by `validatePuzzle`. `backgroundImage` (puzzle-level) and `details` (per-group) are both optional strings.
  - `backgroundImage` is shown as a fixed, low-opacity full-page background (`#page-bg`, styled via `--bg-image-opacity` in `styles.css`) while that puzzle is loaded. The picker screen gets its own background too, from the `PICKER_BACKGROUND_IMAGE` constant in `script.js` (not per-puzzle data). See `images/README.md` for the file convention.
  - `details`, when present on a group, pops up in a dismissible modal right when that group is solved (`showDetailsPopup`), and can be reopened afterward by clicking the solved group's card, both during play and on the end screen.
- **`images/*`** — one background image per puzzle (via `backgroundImage`), plus one for the picker screen (`PICKER_BACKGROUND_IMAGE`). See `images/README.md`.
- **`styles.css`** — plain CSS with custom properties for theming (`--good-1..4` are the four solved-group reveal colors, matching NYT Connections' difficulty-tier coloring convention).

## Adding a new puzzle

1. Copy an existing file in `puzzles/` to `puzzles/<id>.json` and edit `title`/`subtitle`/`groups` (and optionally `backgroundImage`/`details`).
2. Register it in the `PUZZLES` array at the top of `script.js` (`{ id: "<id>", title: "..." }`) so it shows up on the picker screen.
3. The full URL (`index.html?puzzle=<id>`) is what gets turned into a QR code for guests — see `README.md` for the deployment/QR workflow.

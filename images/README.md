# Background images

One background image per puzzle, plus one for the picker screen. Each is
shown as a fixed, low-opacity full-page background (`#page-bg`, faded via
`--bg-image-opacity` in `styles.css`) — a normal, fully-opaque photo works
fine, it doesn't need to be pre-faded.

- `main-page-background.jpg` — picker screen (hardcoded as
  `PICKER_BACKGROUND_IMAGE` in `script.js`)
- `MJ-in-the-city.jpeg` — Places (`puzzles/mj-places.json`)
- `MJ-in-the-pines.jpeg` — Family Names (`puzzles/mj-family-names.json`)
- `MJ-on-the-dock.jpg` — MJ Trivia (`puzzles/mj-trivia.json`)

Each puzzle's own image is set via its `backgroundImage` field (a path
relative to the repo root). To swap a puzzle's photo, replace the file or
point `backgroundImage` at a new one.

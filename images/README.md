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

**Keep these files small** — this is played almost entirely on phones, and a
multi-megabyte photo straight off a camera noticeably delays the page. At
`--bg-image-opacity` these are barely visible, so there's no reason to keep
full resolution. Before adding a new one, downscale it (longest edge around
1200px is plenty) and re-compress, e.g.:

```
python3 -c "
from PIL import Image, ImageOps
im = Image.open('your-photo.jpg')
im = ImageOps.exif_transpose(im).convert('RGB')
w, h = im.size
scale = min(1.0, 1200 / max(w, h))
im = im.resize((round(w*scale), round(h*scale)), Image.LANCZOS)
im.save('your-photo.jpg', 'JPEG', quality=72, optimize=True, progressive=True)
"
```

The current four files are already sized this way (each well under 200KB).

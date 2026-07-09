# Wedding Connections

A small static Connections-style game for GitHub Pages.

## How to use

1. Create a new GitHub repository.
2. Upload these files to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Set the source to your default branch and root folder.
5. Visit the published Pages URL.

## Puzzle URLs

- `index.html?puzzle=sample`
- `index.html?puzzle=places`

Turn each full URL into a QR code for the reception.

## Add a new puzzle

1. Copy `puzzles/sample.json` to a new file, for example `puzzles/family.json`.
2. Edit the title, subtitle, and groups.
3. Add the puzzle to the `PUZZLES` list at the top of `script.js`:

```js
{ id: "family", title: "Family Puzzle" }
```

Each puzzle must have exactly four groups, and each group must have exactly four unique words.

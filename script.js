const PUZZLES = [
  { id: "mj-places", title: "Places" },
  { id: "mj-family-names", title: "Family Names" },
  { id: "mj-trivia", title: "MJ Trivia" },
  { id: "mj-friend-impressions", title: "Friend Impressions" }
];

const MAX_MISTAKES = 4;
let puzzle = null;
let words = [];
let selected = new Set();
let solvedGroupNames = new Set();
let mistakesRemaining = MAX_MISTAKES;

const qs = new URLSearchParams(window.location.search);
const puzzleId = qs.get("puzzle");

const el = {
  title: document.getElementById("puzzle-title"),
  subtitle: document.getElementById("puzzle-subtitle"),
  list: document.getElementById("puzzle-list"),
  links: document.getElementById("puzzle-links"),
  game: document.getElementById("game"),
  grid: document.getElementById("grid"),
  solved: document.getElementById("solved-groups"),
  mistakes: document.getElementById("mistakes"),
  message: document.getElementById("message"),
  shuffle: document.getElementById("shuffle-btn"),
  clear: document.getElementById("clear-btn"),
  submit: document.getElementById("submit-btn"),
  end: document.getElementById("end-screen"),
  endTitle: document.getElementById("end-title"),
  endMessage: document.getElementById("end-message"),
  endGroups: document.getElementById("end-groups"),
  playAgain: document.getElementById("play-again-btn"),
  modal: document.getElementById("details-modal"),
  detailsText: document.getElementById("details-text"),
  detailsClose: document.getElementById("details-close-btn"),
  pageBg: document.getElementById("page-bg")
};

let detailsCloseCallback = null;

const REVEAL_DELAY_MS = 900;
const PICKER_BACKGROUND_IMAGE = "images/main-page-background.jpg";

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(word) {
  return word.trim().toLowerCase();
}

function showPuzzleList() {
  el.title.textContent = "Wedding Connections";
  el.subtitle.textContent = "Madeline (M) and Jared (J) love the game Connections and want to share their own version of the game. Enjoy!";
  el.list.classList.remove("hidden");
  el.pageBg.classList.add("picker");
  el.pageBg.style.backgroundImage = `url("${PICKER_BACKGROUND_IMAGE}")`;
  el.links.innerHTML = "";
  PUZZLES.forEach((p, idx) => {
    const a = document.createElement("a");
    a.href = `index.html?puzzle=${encodeURIComponent(p.id)}`;
    a.textContent = p.title;
    // Cycle through the same easy-to-hard colors used for solved groups,
    // repeating them if there are more than four puzzles.
    a.classList.add(`level-${idx % 4}`);
    el.links.appendChild(a);
  });
}

async function loadPuzzle(id) {
  const response = await fetch(`puzzles/${id}.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Puzzle not found: ${id}`);
  puzzle = await response.json();
  validatePuzzle(puzzle);
  resetGame();
}

function validatePuzzle(data) {
  if (!data.groups || data.groups.length !== 4) throw new Error("Puzzle must have exactly four groups.");
  const all = [];
  data.groups.forEach(group => {
    if (!group.name || !group.words || group.words.length !== 4) {
      throw new Error("Each group needs a name and exactly four words.");
    }
    if (group.details !== undefined && typeof group.details !== "string") {
      throw new Error("A group's details, if present, must be a text string.");
    }
    all.push(...group.words.map(normalize));
  });
  if (new Set(all).size !== 16) throw new Error("Puzzle words must be unique.");
  if (data.backgroundImage !== undefined && typeof data.backgroundImage !== "string") {
    throw new Error("A puzzle's backgroundImage, if present, must be a text string.");
  }
}

function resetGame() {
  selected.clear();
  solvedGroupNames.clear();
  mistakesRemaining = puzzle.maxMistakes || MAX_MISTAKES;
  words = shuffleArray(puzzle.groups.flatMap(group => group.words));
  el.title.textContent = puzzle.title || "Wedding Connections";
  el.subtitle.textContent = puzzle.subtitle || "Find four groups of four related words.";
  el.pageBg.classList.remove("picker");
  el.pageBg.style.backgroundImage = puzzle.backgroundImage ? `url("${puzzle.backgroundImage}")` : "none";
  el.game.classList.remove("hidden");
  el.end.classList.add("hidden");
  render();
}

function render() {
  renderSolvedGroups();
  renderGrid();
  renderStatus();
}

function buildGroupCard(group, idx) {
  const card = document.createElement("div");
  card.className = `solved-card level-${idx}`;
  card.textContent = group.name;
  const small = document.createElement("small");
  small.textContent = group.words.join(", ");
  card.appendChild(small);

  if (group.details) {
    card.classList.add("has-details");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const hint = document.createElement("span");
    hint.className = "details-hint";
    hint.textContent = "Tap to learn more";
    card.appendChild(hint);

    const open = () => showDetailsPopup(group.details);
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }

  return card;
}

function showDetailsPopup(text, onClose) {
  detailsCloseCallback = onClose || null;
  el.detailsText.textContent = text;
  el.modal.classList.remove("hidden");
  el.detailsClose.focus();
}

function closeDetailsPopup() {
  el.modal.classList.add("hidden");
  const callback = detailsCloseCallback;
  detailsCloseCallback = null;
  if (callback) callback();
}

function solvedGroupsInOrder() {
  // solvedGroupNames is a Set, which iterates in insertion order, so this
  // reflects the order the player actually solved each group in.
  return [...solvedGroupNames].map(name => {
    const idx = puzzle.groups.findIndex(group => group.name === name);
    return { group: puzzle.groups[idx], idx };
  });
}

function renderSolvedGroups() {
  el.solved.innerHTML = "";
  solvedGroupsInOrder().forEach(({ group, idx }) => {
    el.solved.appendChild(buildGroupCard(group, idx));
  });
}

function renderGrid() {
  const solvedWords = new Set(
    puzzle.groups
      .filter(group => solvedGroupNames.has(group.name))
      .flatMap(group => group.words.map(normalize))
  );
  el.grid.innerHTML = "";
  words.filter(word => !solvedWords.has(normalize(word))).forEach(word => {
    const button = document.createElement("button");
    button.className = "tile" + (selected.has(word) ? " selected" : "");
    button.textContent = word;
    button.type = "button";
    button.addEventListener("click", () => toggleWord(word));
    el.grid.appendChild(button);
  });
}

function renderStatus() {
  el.mistakes.textContent = `Mistakes remaining: ${"● ".repeat(mistakesRemaining).trim()}`;
  el.submit.disabled = selected.size !== 4;
}

function toggleWord(word) {
  el.message.textContent = "";
  if (selected.has(word)) {
    selected.delete(word);
  } else if (selected.size < 4) {
    selected.add(word);
  }
  render();
}

function clearSelection() {
  selected.clear();
  el.message.textContent = "";
  render();
}

function submitSelection() {
  if (selected.size !== 4) return;
  const choice = [...selected].map(normalize).sort().join("|");
  const match = puzzle.groups.find(group => {
    const candidate = group.words.map(normalize).sort().join("|");
    return candidate === choice && !solvedGroupNames.has(group.name);
  });

  if (match) {
    solvedGroupNames.add(match.name);
    selected.clear();
    el.message.textContent = "";
    render();
    const justWon = solvedGroupNames.size === 4;
    if (match.details) {
      // Show the group's background text right away; if this was the
      // last group, wait for the player to dismiss it before moving on.
      showDetailsPopup(match.details, justWon ? () => endGame(true) : null);
    } else if (justWon) {
      // Give the player a moment to see the last category revealed
      // on the board before moving on to the end screen.
      setTimeout(() => endGame(true), REVEAL_DELAY_MS);
    }
  } else {
    mistakesRemaining -= 1;
    const oneAway = isOneAway(selected);
    el.message.textContent = mistakesRemaining > 0
      ? (oneAway ? "One away…" : "Not quite. Try another group.")
      : "No mistakes left.";
    // Leave the guess selected so the player can see which four words they
    // just tried while figuring out the next guess.
    render();
    if (mistakesRemaining <= 0) endGame(false);
  }
}

function isOneAway(selectedWords) {
  const chosen = new Set([...selectedWords].map(normalize));
  return puzzle.groups.some(group => {
    if (solvedGroupNames.has(group.name)) return false;
    const overlap = group.words.filter(word => chosen.has(normalize(word))).length;
    return overlap === 3;
  });
}

function endGame(won) {
  if (!won) {
    // Player didn't finish: append the groups they never solved, in their
    // original order, after the ones they did — solvedGroupNames already
    // holds those in the order they were solved.
    puzzle.groups.forEach(group => solvedGroupNames.add(group.name));
  }
  el.game.classList.add("hidden");
  el.end.classList.remove("hidden");
  el.endTitle.textContent = won ? "You solved it!" : "Puzzle complete";
  el.endMessage.textContent = won
    ? (puzzle.winMessage || "Nicely done. Thanks for playing!")
    : "Here are the answers. Refresh or play again to try from the start.";
  el.endGroups.innerHTML = "";
  solvedGroupsInOrder().forEach(({ group, idx }) => {
    el.endGroups.appendChild(buildGroupCard(group, idx));
  });
}

el.shuffle.addEventListener("click", () => {
  words = shuffleArray(words);
  el.message.textContent = "";
  render();
});
el.clear.addEventListener("click", clearSelection);
el.submit.addEventListener("click", submitSelection);
el.playAgain.addEventListener("click", resetGame);

el.detailsClose.addEventListener("click", closeDetailsPopup);
el.modal.addEventListener("click", event => {
  if (event.target === el.modal || event.target.classList.contains("modal-backdrop")) {
    closeDetailsPopup();
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !el.modal.classList.contains("hidden")) {
    closeDetailsPopup();
  }
});

if (!puzzleId) {
  showPuzzleList();
} else {
  loadPuzzle(puzzleId).catch(error => {
    console.error(error);
    el.title.textContent = "Puzzle unavailable";
    el.subtitle.textContent = "Check the puzzle name in the URL, or return to the puzzle list.";
    showPuzzleList();
  });
}

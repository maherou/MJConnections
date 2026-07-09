const PUZZLES = [
  { id: "sample", title: "Sample Reception Puzzle" },
  { id: "places", title: "Places and Pastimes" }
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
  playAgain: document.getElementById("play-again-btn")
};

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
  el.subtitle.textContent = "Choose a puzzle, or make a QR code for each link below.";
  el.list.classList.remove("hidden");
  el.links.innerHTML = "";
  PUZZLES.forEach(p => {
    const a = document.createElement("a");
    a.href = `index.html?puzzle=${encodeURIComponent(p.id)}`;
    a.textContent = p.title;
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
    all.push(...group.words.map(normalize));
  });
  if (new Set(all).size !== 16) throw new Error("Puzzle words must be unique.");
}

function resetGame() {
  selected.clear();
  solvedGroupNames.clear();
  mistakesRemaining = puzzle.maxMistakes || MAX_MISTAKES;
  words = shuffleArray(puzzle.groups.flatMap(group => group.words));
  el.title.textContent = puzzle.title || "Wedding Connections";
  el.subtitle.textContent = puzzle.subtitle || "Find four groups of four related words.";
  el.game.classList.remove("hidden");
  el.end.classList.add("hidden");
  render();
}

function render() {
  renderSolvedGroups();
  renderGrid();
  renderStatus();
}

function renderSolvedGroups() {
  el.solved.innerHTML = "";
  puzzle.groups.forEach((group, idx) => {
    if (!solvedGroupNames.has(group.name)) return;
    const card = document.createElement("div");
    card.className = `solved-card level-${idx}`;
    card.textContent = group.name;
    const small = document.createElement("small");
    small.textContent = group.words.join(", ");
    card.appendChild(small);
    el.solved.appendChild(card);
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
    if (solvedGroupNames.size === 4) endGame(true);
  } else {
    mistakesRemaining -= 1;
    el.message.textContent = mistakesRemaining > 0 ? "Not quite. Try another group." : "No mistakes left.";
    selected.clear();
    render();
    if (mistakesRemaining <= 0) endGame(false);
  }
}

function endGame(won) {
  el.game.classList.add("hidden");
  el.end.classList.remove("hidden");
  el.endTitle.textContent = won ? "You solved it!" : "Puzzle complete";
  el.endMessage.textContent = won
    ? (puzzle.winMessage || "Nicely done. Thanks for playing!")
    : "Here are the answers. Refresh or play again to try from the start.";
  if (!won) {
    puzzle.groups.forEach(group => solvedGroupNames.add(group.name));
    renderSolvedGroups();
    el.end.prepend(el.solved);
  }
}

el.shuffle.addEventListener("click", () => {
  words = shuffleArray(words);
  el.message.textContent = "";
  render();
});
el.clear.addEventListener("click", clearSelection);
el.submit.addEventListener("click", submitSelection);
el.playAgain.addEventListener("click", resetGame);

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

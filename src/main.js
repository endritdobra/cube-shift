import { IDENTITY, cssMatrix, orientationsMatch, randomTarget, rotate } from "./gameLogic.js";

const $ = selector => document.querySelector(selector);
const game = {
  player: [...IDENTITY], target: randomTarget(), score: 0, best: 0,
  round: 1, moves: 0, seconds: 90, status: "ready", lastFrame: 0
};
const gameElement = $(".game");
const playerCube = $("[data-player-cube]");
const targetCube = $("[data-target-cube]");
const overlay = $("[data-overlay]");
const flash = $("[data-match-flash]");
let roundTimeout;

try { game.best = Number(localStorage.getItem("cube-shift-best")) || 0; } catch { /* Storage is optional. */ }

function setCube(element, orientation) {
  element.style.transform = "rotateX(-25deg) rotateY(-35deg) " + cssMatrix(orientation);
}

function updateTime() {
  $("[data-time]").textContent = String(Math.floor(game.seconds / 60)).padStart(2, "0") + ":" + String(Math.floor(game.seconds % 60)).padStart(2, "0");
  $("[data-time]").classList.toggle("is-urgent", game.seconds < 15);
}

function updateUI() {
  setCube(playerCube, game.player);
  setCube(targetCube, game.target);
  updateTime();
  gameElement.dataset.status = game.status;
  $("[data-score]").textContent = String(game.score).padStart(4, "0");
  $("[data-best]").textContent = String(game.best).padStart(4, "0");
  $("[data-round]").textContent = String(game.round).padStart(2, "0");
  $("[data-moves]").textContent = game.moves + (game.moves === 1 ? " MOVE" : " MOVES");
  $("[data-stage-status]").textContent = { ready: "AWAITING PLAYER", playing: "MATCH THE TARGET", solved: "MATCHED!", paused: "PAUSED", ended: "TIME IS UP" }[game.status];
  $("[data-pause]").disabled = !["playing", "paused"].includes(game.status);
  $("[data-pause]").textContent = game.status === "paused" ? "RESUME" : "PAUSE";
  overlay.hidden = ["playing", "solved"].includes(game.status);
  if (game.status === "ready") {
    $("[data-overlay-eyebrow]").textContent = "READY WHEN YOU ARE";
    $("[data-overlay-title]").innerHTML = "Think outside<br><em>the square.</em>";
    $("[data-overlay-copy]").textContent = "Match the target cube as many times as you can in 90 seconds.";
    $("[data-start-label]").textContent = "START GAME";
  } else if (game.status === "paused") {
    $("[data-overlay-eyebrow]").textContent = "TAKE A BREATHER";
    $("[data-overlay-title]").innerHTML = "On <em>pause.</em>";
    $("[data-overlay-copy]").textContent = "Your cube will be right here when you get back.";
    $("[data-start-label]").textContent = "RESUME GAME";
  } else if (game.status === "ended") {
    $("[data-overlay-eyebrow]").textContent = "TIME IS UP";
    $("[data-overlay-title]").innerHTML = "Nice <em>moves.</em>";
    $("[data-overlay-copy]").textContent = "You matched " + (game.round - 1) + " " + (game.round === 2 ? "cube" : "cubes") + " and scored " + game.score + " points.";
    $("[data-start-label]").textContent = "PLAY AGAIN";
  }
}

function newGame() {
  clearTimeout(roundTimeout);
  game.player = [...IDENTITY];
  game.target = randomTarget();
  game.score = 0;
  game.round = 1;
  game.moves = 0;
  game.seconds = 90;
  game.status = "playing";
  game.lastFrame = performance.now();
  flash.classList.remove("is-visible");
  updateUI();
}

function startOrResume() {
  if (game.status === "ready" || game.status === "ended") newGame();
  else if (game.status === "paused") {
    game.status = "playing";
    game.lastFrame = performance.now();
    updateUI();
  }
}

function pause() {
  if (game.status === "playing") game.status = "paused";
  else if (game.status === "paused") {
    game.status = "playing";
    game.lastFrame = performance.now();
  }
  updateUI();
}

function turn(axis, step) {
  if (game.status !== "playing") return;
  game.player = rotate(game.player, axis, step);
  game.moves += 1;
  if (orientationsMatch(game.player, game.target)) {
    const points = Math.max(50, 150 - Math.max(0, game.moves - 2) * 10);
    game.score += points;
    game.best = Math.max(game.best, game.score);
    try { localStorage.setItem("cube-shift-best", String(game.best)); } catch { /* Storage is optional. */ }
    game.seconds = Math.min(99, game.seconds + 10);
    $("[data-points]").textContent = points;
    flash.classList.remove("is-visible");
    void flash.offsetWidth;
    flash.classList.add("is-visible");
    game.status = "solved";
    roundTimeout = setTimeout(() => {
      game.round += 1;
      game.moves = 0;
      game.player = [...IDENTITY];
      game.target = randomTarget();
      game.status = "playing";
      game.lastFrame = performance.now();
      flash.classList.remove("is-visible");
      updateUI();
    }, 900);
  }
  updateUI();
}

function frame(now) {
  if (game.status === "playing") {
    game.seconds = Math.max(0, game.seconds - Math.min((now - game.lastFrame) / 1000, .1));
    if (game.seconds === 0) {
      game.status = "ended";
      updateUI();
    } else updateTime();
  }
  game.lastFrame = now;
  requestAnimationFrame(frame);
}

const keys = {
  ArrowUp: ["x", -1], ArrowDown: ["x", 1],
  ArrowLeft: ["y", -1], ArrowRight: ["y", 1],
  q: ["z", -1], e: ["z", 1]
};
window.addEventListener("keydown", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === " " || key === "Enter") {
    if (event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (event.repeat) return;
    if (game.status === "playing") pause();
    else startOrResume();
  } else if (keys[key]) {
    event.preventDefault();
    if (game.status === "ready") startOrResume();
    turn(...keys[key]);
  }
});

$("[data-start]").addEventListener("click", startOrResume);
$("[data-pause]").addEventListener("click", pause);
$("[data-restart]").addEventListener("click", newGame);
document.querySelectorAll("[data-axis]").forEach(button => button.addEventListener("click", () => {
  if (game.status === "ready") startOrResume();
  turn(button.dataset.axis, Number(button.dataset.step));
}));

updateUI();
requestAnimationFrame(frame);

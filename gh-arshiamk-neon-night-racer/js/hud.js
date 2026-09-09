// DOM overlay: live stats, start/game-over screens, and event toasts.
export class Hud {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.speed = $("speed-display");
    this.score = $("score-display");
    this.time = $("time-display");
    this.combo = $("combo-display");
    this.comboStat = $("combo-stat");
    this.timeStat = $("time-stat");
    this.startScreen = $("start-screen");
    this.gameOver = $("game-over");
    this.finalScore = $("final-score");
    this.bestScore = $("best-score");
    this.toastEl = $("toast");
  }

  hideOverlays() {
    this.startScreen.classList.add("hidden");
    this.gameOver.classList.add("hidden");
  }

  showGameOver(score, best) {
    this.finalScore.textContent = score.toLocaleString();
    this.bestScore.textContent = best.toLocaleString();
    this.gameOver.classList.remove("hidden");
  }

  update(kmh, score) {
    this.speed.textContent = Math.round(kmh);
    this.score.textContent = Math.round(score.score).toLocaleString();
    this.time.textContent = Math.ceil(score.time);
    this.combo.textContent = score.combo;
    this.comboStat.classList.toggle("hot", score.combo > 1);
    this.timeStat.classList.toggle("low", score.time < 10);
  }

  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove("hidden", "pop");
    void this.toastEl.offsetWidth; // restart the CSS animation
    this.toastEl.classList.add("pop");
  }
}

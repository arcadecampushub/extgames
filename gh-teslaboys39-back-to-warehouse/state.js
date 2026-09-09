// state.js
const GameState = {
    score: 0,
    highScore: localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0,
    gameOver: false,
    gameStarted: false,
    isPaused: false,
    difficulty: "medium",
    bossActive: false,
    dayNightCycle: "day",
    lastShotTime: 0,
    bossSpawnedAt: null,
    shakeTimer: 0,

    reset: function() {
        this.score = 0;
        this.highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;
        this.gameOver = false;
        this.gameStarted = true;
        this.isPaused = false;
        this.bossActive = false;
        this.dayNightCycle = "day";
        this.lastShotTime = 0;
        this.bossSpawnedAt = null;
        this.shakeTimer = 0;
    },

    updateHighScore: function() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("highScore", this.highScore);
        }
    }
};
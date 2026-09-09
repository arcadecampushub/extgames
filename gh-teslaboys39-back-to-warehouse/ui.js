// ui.js
const UI = {
    splashScreen: document.getElementById("splashScreen"),
    mainMenu: document.getElementById("mainMenu"),
    gameOverMenu: document.getElementById("gameOverMenu"),
    pauseMenu: document.getElementById("pauseMenu"),
    finalScoreDisplay: document.getElementById("finalScore"),
    highScoreDisplay: document.getElementById("highScore"),

    init: function(startCallback, restartCallback, mainMenuCallback, resumeCallback, pauseToMainMenuCallback) {
        document.getElementById("startButton").addEventListener("click", () => {
            startCallback();
            this.mainMenu.style.display = "none";
        });
        document.getElementById("restartButton").addEventListener("click", () => {
            restartCallback();
            this.gameOverMenu.style.display = "none";
        });
        document.getElementById("mainMenuButton").addEventListener("click", () => {
            mainMenuCallback();
            this.gameOverMenu.style.display = "none";
            this.mainMenu.style.display = "block";
        });
        document.getElementById("resumeButton").addEventListener("click", () => {
            resumeCallback();
            this.pauseMenu.style.display = "none";
        });
        document.getElementById("pauseToMainMenuButton").addEventListener("click", () => {
            pauseToMainMenuCallback();
            this.pauseMenu.style.display = "none";
            this.mainMenu.style.display = "block";
        });

        setTimeout(() => {
            this.splashScreen.classList.add("fade-out");
            setTimeout(() => {
                this.splashScreen.style.display = "none";
                this.mainMenu.style.display = "block";
            }, 1000);
        }, 1000);
    },

    drawHUD: function(weapon, ammo, maxAmmo, score) {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(`Weapon: ${weapon}`, canvas.width - 150, 20);
        ctx.fillText(`Ammo: ${ammo}/${maxAmmo}`, canvas.width - 150, 40);
        ctx.fillText(`Score: ${score}`, 10, 30);
    },

    showGameOver: function(score, highScore) {
        this.finalScoreDisplay.textContent = score;
        this.highScoreDisplay.textContent = highScore;
        this.gameOverMenu.style.display = "block";
    },

    togglePause: function(isPaused) {
        this.pauseMenu.style.display = isPaused ? "block" : "none";
    }
};
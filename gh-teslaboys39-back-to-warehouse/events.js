// events.js
const Events = {
    init: function() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space" && !Player.human.isJumping && GameState.gameStarted && !GameState.gameOver && !Player.human.isCrouching && !GameState.isPaused) {
                Player.human.dy = Config.jumpPower;
                Player.human.isJumping = true;
            }
            if (e.code === "KeyF" && Player.human.ammo > 0 && GameState.gameStarted && !GameState.gameOver && !GameState.isPaused) {
                let now = Date.now();
                let fireRate = Player.human.weapon === "minigun" ? 50 : 200;
                if (now - GameState.lastShotTime > fireRate) {
                    Weapons.shootBullet(Player.human);
                    Player.human.ammo--;
                    if (Player.human.ammo <= 0 && Player.human.weapon !== "pistol") {
                        Player.human.weapon = "pistol";
                        Player.human.maxAmmo = 15;
                        Player.human.ammo = 10;
                    }
                    Player.human.recoil = Player.human.weapon === "rpg" ? 10 : 5;
                    GameState.lastShotTime = now;
                }
            }
            if (e.code === "KeyS" && !Player.human.isJumping && GameState.gameStarted && !GameState.gameOver && !GameState.isPaused) {
                Player.human.isCrouching = true;
                Player.human.height = 40;
                Player.human.y = 320;
            }
            if (e.code === "KeyP" && GameState.gameStarted && !GameState.gameOver) {
                GameState.isPaused = !GameState.isPaused;
                UI.togglePause(GameState.isPaused);
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.code === "KeyS" && GameState.gameStarted && !GameState.gameOver) {
                Player.human.isCrouching = false;
                Player.human.height = 60;
                Player.human.y = 300;
            }
        });
    }
};
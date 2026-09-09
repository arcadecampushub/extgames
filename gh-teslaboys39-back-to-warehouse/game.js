// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
window.canvas = canvas;
window.ctx = ctx;

function update() {
    if (!GameState.gameStarted || GameState.isPaused) return;

    if (GameState.gameOver) {
        UI.showGameOver(GameState.score, GameState.highScore);
        return;
    }

    Player.update();
    Background.updateBackground(GameState.bossActive);
    Background.spawnBirds();
    Background.spawnSmoke();
    Particles.update();

    Weapons.bullets.forEach((bullet, bIndex) => {
        bullet.x += bullet.speed;
        if (bullet.x > canvas.width) Weapons.bullets.splice(bIndex, 1);

        Zombies.zombies.forEach((zombie, zIndex) => {
            if (
                bullet.x < zombie.x + zombie.width &&
                bullet.x + bullet.width > zombie.x &&
                bullet.y < zombie.y + zombie.height &&
                bullet.y + bullet.height > zombie.y
            ) {
                if (zombie.type === "runner" && !bullet.fromCrouch) return;
                Weapons.bullets.splice(bIndex, 1);
                zombie.health -= bullet.damage;
                Particles.spawnExplosion(zombie.x + zombie.width / 2, zombie.y + zombie.height / 2);
                if (zombie.health <= 0) {
                    Zombies.zombies.splice(zIndex, 1);
                    GameState.score += zombie.type === "boss" ? 500 : zombie.type === "tank" ? 50 : 10;
                    if (zombie.type === "boss") GameState.bossActive = false;
                }
            }
        });
    });

    Zombies.zombies.forEach((zombie, index) => {
        if (!GameState.bossActive || zombie.type === "boss") zombie.x -= zombie.speed;
        if (zombie.type === "boss") Zombies.spawnBossAttack(zombie);
        if (
            Player.human.x < zombie.x + zombie.width &&
            Player.human.x + Player.human.width > zombie.x &&
            Player.human.y < zombie.y + zombie.height &&
            Player.human.y + Player.human.height > zombie.y
        ) {
            GameState.gameOver = true;
            GameState.updateHighScore();
        }
        if (zombie.x < -zombie.width && zombie.type !== "boss") {
            Zombies.zombies.splice(index, 1);
            GameState.score += zombie.type === "tank" ? 50 : 10;
        }
    });

    Zombies.bossAttacks.forEach((attack, index) => {
        attack.x += attack.speed;
        if (
            Player.human.x < attack.x + attack.width &&
            Player.human.x + Player.human.width > attack.x &&
            Player.human.y < attack.y + attack.height &&
            Player.human.y + Player.human.height > attack.y
        ) {
            GameState.gameOver = true;
            GameState.updateHighScore();
        }
        if (attack.x < -attack.width) Zombies.bossAttacks.splice(index, 1);
    });

    Weapons.ammoPickups.forEach((ammo, index) => {
        if (!GameState.bossActive) ammo.x -= ammo.speed;
        if (
            Player.human.x < ammo.x + ammo.width &&
            Player.human.x + Player.human.width > ammo.x &&
            Player.human.y < ammo.y + ammo.height &&
            Player.human.y + Player.human.height > ammo.y
        ) {
            Player.human.ammo = Math.min(Player.human.maxAmmo, Player.human.ammo + 5);
            Weapons.ammoPickups.splice(index, 1);
        }
        if (ammo.x < -ammo.width) Weapons.ammoPickups.splice(index, 1);
    });

    Weapons.weaponPickups.forEach((weapon, index) => {
        if (!GameState.bossActive) weapon.x -= weapon.speed;
        if (
            Player.human.x < weapon.x + weapon.width &&
            Player.human.x + Player.human.width > weapon.x &&
            Player.human.y < weapon.y + weapon.height &&
            Player.human.y + Player.human.height > weapon.y
        ) {
            Player.human.weapon = weapon.type;
            Player.human.maxAmmo = weapon.type === "minigun" ? 75 : weapon.type === "rpg" ? 3 : 15;
            Player.human.ammo = Player.human.maxAmmo;
            Weapons.weaponPickups.splice(index, 1);
        }
        if (weapon.x < -weapon.width) Weapons.weaponPickups.splice(index, 1);
    });

    if (!GameState.bossActive) {
        let zombieSpawnRate = GameState.difficulty === "easy" ? Config.zombieSpawnRate.easy : GameState.difficulty === "medium" ? Config.zombieSpawnRate.medium : Config.zombieSpawnRate.hardcore;
        let ammoSpawnRate = GameState.difficulty === "easy" ? Config.ammoSpawnRate.easy : GameState.difficulty === "medium" ? Config.ammoSpawnRate.medium : Config.ammoSpawnRate.hardcore;
        let weaponSpawnRate = GameState.difficulty === "easy" ? Config.weaponSpawnRate.easy : GameState.difficulty === "medium" ? Config.weaponSpawnRate.medium : Config.weaponSpawnRate.hardcore;
        if (Math.random() < zombieSpawnRate) {
            let result = Zombies.spawnZombie(GameState.score, GameState.bossActive, GameState.bossSpawnedAt, GameState.difficulty);
            GameState.bossActive = result.bossActive;
            GameState.bossSpawnedAt = result.bossSpawnedAt;
            GameState.shakeTimer = result.shakeTimer;
        }
        if (Math.random() < ammoSpawnRate) Weapons.spawnAmmoPickup();
        if (Math.random() < weaponSpawnRate) Weapons.spawnWeaponPickup();
    }

    let cycle = Math.floor(GameState.score / 700) % 2;
    GameState.dayNightCycle = cycle === 0 ? "day" : "night";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Background.drawBackground(GameState.dayNightCycle, GameState.shakeTimer);
    Background.drawBirds();
    Particles.drawDust();
    Particles.drawExplosion();
    Weapons.drawAmmoPickups();
    Weapons.drawWeaponPickups();
    Player.draw();
    Zombies.zombies.forEach(zombie => Zombies.drawZombie(zombie));
    Zombies.drawBossAttacks();
    Weapons.drawBullets();
    if (GameState.gameStarted && !GameState.gameOver) UI.drawHUD(Player.human.weapon, Player.human.ammo, Player.human.maxAmmo, GameState.score);
}

Events.init();

UI.init(
    () => {
        GameState.difficulty = document.getElementById("difficultySelect").value;
        GameState.reset();
        Player.human = { ...Player.human, x: 50, y: 300, ammo: 10, maxAmmo: 15, weapon: "pistol" };
    },
    () => {
        GameState.reset();
        Player.human = { ...Player.human, x: 50, y: 300, ammo: 10, maxAmmo: 15, weapon: "pistol" };
    },
    () => {
        GameState.reset();
        Player.human = { ...Player.human, x: 50, y: 300, ammo: 10, maxAmmo: 15, weapon: "pistol" };
        GameState.gameStarted = false;
    },
    () => { GameState.isPaused = false; },
    () => {
        GameState.reset();
        Player.human = { ...Player.human, x: 50, y: 300, ammo: 10, maxAmmo: 15, weapon: "pistol" };
        GameState.gameStarted = false;
    }
);

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
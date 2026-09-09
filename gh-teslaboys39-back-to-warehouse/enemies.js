// enemies.js
const Zombies = {
    zombies: [],
    bossAttacks: [],

    spawnZombie: function(score, bossActive, bossSpawnedAt, difficulty) {
        if (score >= 700 && score % 700 === 0 && !bossActive && bossSpawnedAt !== score) {
            let boss = {
                x: canvas.width - 150,
                y: 230,
                width: 150,
                height: 170,
                speed: 0,
                health: 50,
                maxHealth: 50,
                type: "boss",
                lastAttack: 0,
                attackPattern: 0
            };
            this.zombies.push(boss);
            return { bossActive: true, bossSpawnedAt: score, shakeTimer: 20 };
        } else if (!bossActive) {
            let typeChance = Math.random();
            if (typeChance < 0.05) {
                let zombie = {
                    x: canvas.width,
                    y: 330,
                    width: 40,
                    height: 30,
                    speed: 5 + Math.random() * 2,
                    health: 1,
                    maxHealth: 1,
                    type: "runner"
                };
                this.zombies.push(zombie);
            } else if (typeChance < 0.10) {
                let zombie = {
                    x: canvas.width,
                    y: 280,
                    width: 60,
                    height: 100,
                    speed: 2 + Math.random(),
                    health: 10,
                    maxHealth: 10,
                    type: "tank"
                };
                this.zombies.push(zombie);
            } else {
                let zombie = {
                    x: canvas.width,
                    y: 320,
                    width: 40,
                    height: 60,
                    speed: 3 + Math.random() * 2,
                    health: 2,
                    maxHealth: 2,
                    type: "normal"
                };
                this.zombies.push(zombie);
            }
        }
        return { bossActive, bossSpawnedAt, shakeTimer: 0 };
    },

    spawnBossAttack: function(boss) {
        let now = Date.now();
        if (now - boss.lastAttack < 1500) return;
        boss.lastAttack = now;

        if (boss.attackPattern === 3) {
            for (let i = 0; i < 3; i++) {
                let attack = { x: boss.x, y: boss.y + 80, width: 20, height: 20, speed: -8 };
                setTimeout(() => this.bossAttacks.push(attack), i * 200);
            }
        } else {
            let attack;
            if (boss.attackPattern === 0) {
                attack = { x: boss.x, y: boss.y + 20, width: 20, height: 20, speed: -5 };
            } else if (boss.attackPattern === 1) {
                attack = { x: boss.x, y: boss.y + 80, width: 20, height: 20, speed: -5 };
            } else {
                attack = { x: boss.x, y: 340, width: 20, height: 20, speed: -5 };
            }
            this.bossAttacks.push(attack);
        }

        boss.attackPattern = (boss.attackPattern + 1) % 4;
    },

    spawnExplosion: function(x, y) {
        for (let i = 0; i < 5; i++) {
            let explosion = {
                x: x,
                y: y,
                size: Math.random() * 5 + 2,
                dx: (Math.random() - 0.5) * 5,
                dy: (Math.random() - 0.5) * 5,
                life: 20
            };
            explosionParticles.push(explosion); // Pastikan explosionParticles diakses dari game.js
        }
    },

    drawZombie: function(zombie) {
        ctx.fillStyle = zombie.type === "tank" ? "darkgreen" : zombie.type === "boss" ? "purple" : zombie.type === "runner" ? "brown" : "green";
        ctx.strokeStyle = zombie.type === "tank" ? "darkgreen" : zombie.type === "boss" ? "purple" : zombie.type === "runner" ? "brown" : "green";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 20 : zombie.type === "runner" ? 5 : 10), zombie.type === "boss" ? 25 : zombie.type === "tank" ? 15 : zombie.type === "runner" ? 8 : 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = zombie.type === "boss" ? "yellow" : "red";
        ctx.beginPath();
        ctx.arc(zombie.x + zombie.width / 2 + (zombie.type === "boss" ? 10 : zombie.type === "tank" ? 5 : zombie.type === "runner" ? 3 : 3), zombie.y + (zombie.type === "boss" ? 25 : zombie.type === "runner" ? 7 : 12), zombie.type === "boss" ? 5 : zombie.type === "tank" ? 3 : zombie.type === "runner" ? 2 : 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = zombie.type === "tank" ? "darkgreen" : zombie.type === "boss" ? "purple" : zombie.type === "runner" ? "brown" : "green";
        ctx.beginPath();
        ctx.moveTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 45 : zombie.type === "tank" ? 25 : zombie.type === "runner" ? 13 : 20));
        ctx.lineTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 110 : zombie.type === "tank" ? 60 : zombie.type === "runner" ? 20 : 40));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 70 : zombie.type === "tank" ? 40 : zombie.type === "runner" ? 15 : 25));
        ctx.lineTo(zombie.x + (zombie.type === "boss" ? 30 : zombie.type === "tank" ? 10 : zombie.type === "runner" ? 8 : 10), zombie.y + (zombie.type === "boss" ? 40 : zombie.type === "tank" ? 20 : zombie.type === "runner" ? 10 : 15));
        ctx.moveTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 70 : zombie.type === "tank" ? 40 : zombie.type === "runner" ? 15 : 25));
        ctx.lineTo(zombie.x + zombie.width - (zombie.type === "boss" ? 30 : zombie.type === "tank" ? 10 : zombie.type === "runner" ? 8 : 10), zombie.y + (zombie.type === "boss" ? 40 : zombie.type === "tank" ? 20 : zombie.type === "runner" ? 10 : 15));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 110 : zombie.type === "tank" ? 60 : zombie.type === "runner" ? 20 : 40));
        ctx.lineTo(zombie.x + (zombie.type === "boss" ? 40 : zombie.type === "tank" ? 15 : zombie.type === "runner" ? 10 : 15), zombie.y + zombie.height);
        ctx.moveTo(zombie.x + zombie.width / 2, zombie.y + (zombie.type === "boss" ? 110 : zombie.type === "tank" ? 60 : zombie.type === "runner" ? 20 : 40));
        ctx.lineTo(zombie.x + zombie.width - (zombie.type === "boss" ? 40 : zombie.type === "tank" ? 15 : zombie.type === "runner" ? 10 : 15), zombie.y + zombie.height);
        ctx.stroke();

        ctx.fillStyle = "red";
        ctx.fillRect(zombie.x, zombie.y - 15, zombie.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(zombie.x, zombie.y - 15, zombie.width * (zombie.health / zombie.maxHealth), 5);
    },

    drawBossAttacks: function() {
        this.bossAttacks.forEach(attack => {
            ctx.fillStyle = "brown";
            ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
        });
    }
};
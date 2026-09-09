// weapons.js
const Weapons = {
    bullets: [],
    ammoPickups: [],
    weaponPickups: [],

    shootBullet: function(human) {
        let damage = human.weapon === "rpg" ? 15 : 1;
        let bullet = {
            x: human.x + human.width,
            y: human.isCrouching ? human.y + 30 : human.y + 20,
            width: human.weapon === "rpg" ? 15 : 10,
            height: human.weapon === "rpg" ? 10 : 5,
            speed: 10,
            damage: damage,
            fromCrouch: human.isCrouching
        };
        this.bullets.push(bullet);
    },

    spawnAmmoPickup: function() {
        let ammo = {
            x: canvas.width,
            y: 320,
            width: 20,
            height: 20,
            speed: Background.bgSpeed
        };
        this.ammoPickups.push(ammo);
    },

    spawnWeaponPickup: function() {
        let type = Math.random() < 0.5 ? "minigun" : "rpg";
        let weapon = {
            x: canvas.width,
            y: 320,
            width: 25,
            height: 25,
            speed: Background.bgSpeed,
            type: type
        };
        this.weaponPickups.push(weapon);
    },

    drawBullets: function() {
        this.bullets.forEach(bullet => {
            ctx.fillStyle = human.weapon === "rpg" ? "red" : "yellow";
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    },

    drawAmmoPickups: function() {
        ctx.fillStyle = "orange";
        this.ammoPickups.forEach(ammo => {
            ctx.fillRect(ammo.x, ammo.y, ammo.width, ammo.height);
        });
    },

    drawWeaponPickups: function() {
        this.weaponPickups.forEach(weapon => {
            ctx.fillStyle = weapon.type === "minigun" ? "gray" : "darkolivegreen";
            ctx.fillRect(weapon.x, weapon.y, weapon.width, weapon.height);
        });
    }
};
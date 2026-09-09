// player.js
const Player = {
    human: {
        x: 50,
        y: 300,
        width: 40,
        height: 60,
        dy: 0,
        gravity: 0.5,
        jumpPower: -15,
        isJumping: false,
        isCrouching: false,
        runFrame: 0,
        frameSpeed: 0.2,
        ammo: 10,
        maxAmmo: 15,
        recoil: 0,
        weapon: "pistol"
    },

    update: function() {
        this.human.dy += this.human.gravity;
        this.human.y += this.human.dy;

        if (this.human.y > 300) {
            this.human.y = 300;
            this.human.dy = 0;
            this.human.isJumping = false;
        }

        if (!this.human.isJumping && !this.human.isCrouching) {
            this.human.runFrame += this.human.frameSpeed;
            if (this.human.runFrame > 2) this.human.runFrame = 0;
            if (Math.random() < 0.2) Dust.spawnDust(this.human.x, this.human.y);
        }

        if (this.human.recoil > 0) this.human.recoil--;
    },

    draw: function() {
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(this.human.x + 20, this.human.isCrouching ? this.human.y + 20 : this.human.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.human.x + 17, this.human.isCrouching ? this.human.y + 18 : this.human.y + 8, 2, 0, Math.PI * 2);
        ctx.arc(this.human.x + 23, this.human.isCrouching ? this.human.y + 18 : this.human.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(this.human.x + 20, this.human.isCrouching ? this.human.y + 30 : this.human.y + 20);
        ctx.lineTo(this.human.x + 20, this.human.isCrouching ? this.human.y + 50 : this.human.y + 40);
        ctx.stroke();

        let armOffset = this.human.isJumping || this.human.isCrouching ? 0 : Math.sin(this.human.runFrame * Math.PI) * 5;
        let recoilOffset = this.human.recoil > 0 ? -this.human.recoil : 0;
        ctx.beginPath();
        ctx.moveTo(this.human.x + 20, this.human.isCrouching ? this.human.y + 35 : this.human.y + 25);
        ctx.lineTo(this.human.x + 10 - armOffset, this.human.isCrouching ? this.human.y + 45 : this.human.y + 35);
        ctx.moveTo(this.human.x + 20, this.human.isCrouching ? this.human.y + 35 : this.human.y + 25);
        ctx.lineTo(this.human.x + 30 + armOffset + recoilOffset, this.human.isCrouching ? this.human.y + 45 - recoilOffset : this.human.y + 35 - recoilOffset);
        ctx.stroke();

        ctx.fillStyle = this.human.weapon === "minigun" ? "gray" : this.human.weapon === "rpg" ? "darkolivegreen" : "black";
        if (this.human.weapon === "minigun") {
            ctx.fillRect(this.human.x + 30 + armOffset + recoilOffset, this.human.isCrouching ? this.human.y + 40 - recoilOffset : this.human.y + 30 - recoilOffset, 15, 8);
        } else if (this.human.weapon === "rpg") {
            ctx.fillRect(this.human.x + 30 + armOffset + recoilOffset, this.human.isCrouching ? this.human.y + 40 - recoilOffset : this.human.y + 30 - recoilOffset, 20, 10);
        } else {
            ctx.fillRect(this.human.x + 30 + armOffset + recoilOffset, this.human.isCrouching ? this.human.y + 43 - recoilOffset : this.human.y + 33 - recoilOffset, 8, 4);
        }

        if (!this.human.isJumping && !this.human.isCrouching) {
            let legOffset = Math.sin(this.human.runFrame * Math.PI) * 10;
            ctx.beginPath();
            ctx.moveTo(this.human.x + 20, this.human.y + 40);
            ctx.lineTo(this.human.x + 20 + legOffset, this.human.y + 60);
            ctx.moveTo(this.human.x + 20, this.human.y + 40);
            ctx.lineTo(this.human.x + 20 - legOffset, this.human.y + 60);
            ctx.stroke();
        } else if (this.human.isJumping) {
            ctx.beginPath();
            ctx.moveTo(this.human.x + 20, this.human.y + 40);
            ctx.lineTo(this.human.x + 15, this.human.y + 60);
            ctx.moveTo(this.human.x + 20, this.human.y + 40);
            ctx.lineTo(this.human.x + 25, this.human.y + 60);
            ctx.stroke();
        } else if (this.human.isCrouching) {
            ctx.beginPath();
            ctx.moveTo(this.human.x + 20, this.human.y + 50);
            ctx.lineTo(this.human.x + 15, this.human.y + 60);
            ctx.moveTo(this.human.x + 20, this.human.y + 50);
            ctx.lineTo(this.human.x + 25, this.human.y + 60);
            ctx.stroke();
        }
    }
};
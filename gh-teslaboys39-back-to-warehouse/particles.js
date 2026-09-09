// particles.js
const Particles = {
    dustParticles: [],
    explosionParticles: [],

    spawnDust: function(x, y) {
        let dust = {
            x: x + 20,
            y: y + 60,
            size: Math.random() * 5 + 2,
            dx: -Background.bgSpeed * 0.5,
            life: 20
        };
        this.dustParticles.push(dust);
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
            this.explosionParticles.push(explosion);
        }
    },

    update: function() {
        this.dustParticles.forEach((dust, index) => {
            dust.x += dust.dx;
            dust.life--;
            if (dust.life <= 0) this.dustParticles.splice(index, 1);
        });
        this.explosionParticles.forEach((exp, index) => {
            exp.x += exp.dx;
            exp.y += exp.dy;
            exp.life--;
            if (exp.life <= 0) this.explosionParticles.splice(index, 1);
        });
    },

    drawDust: function() {
        ctx.fillStyle = "rgba(139, 69, 19, 0.5)";
        this.dustParticles.forEach(dust => {
            ctx.beginPath();
            ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawExplosion: function() {
        ctx.fillStyle = "orange";
        this.explosionParticles.forEach(exp => {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
};
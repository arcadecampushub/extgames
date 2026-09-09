// background.js
const Background = {
    bgX: 0,
    mountainX: 0,
    cloudX: 0,
    cityX: 0,
    bgSpeed: 2,
    mountainSpeed: 0.5,
    cloudSpeed: 0.2,
    citySpeed: 1,
    birds: [],
    smokeParticles: [],

    updateBackground: function(bossActive) {
        if (!bossActive) {
            this.bgX -= this.bgSpeed;
            if (this.bgX <= -canvas.width) this.bgX = 0;
            this.mountainX -= this.mountainSpeed;
            if (this.mountainX <= -canvas.width) this.mountainX = 0;
            this.cloudX -= this.cloudSpeed;
            if (this.cloudX <= -canvas.width) this.cloudX = 0;
            this.cityX -= this.citySpeed;
            if (this.cityX <= -canvas.width) this.cityX = 0;
        }
    },

    spawnBirds: function() {
        if (Math.random() < 0.01) {
            let bird = {
                x: canvas.width,
                y: 50 + Math.random() * 50,
                width: 10,
                height: 5,
                speed: -3
            };
            this.birds.push(bird);
        }
    },

    spawnSmoke: function() {
        if (Math.random() < 0.05) {
            let smoke = {
                x: Math.random() * canvas.width,
                y: 360,
                width: Math.random() * 40 + 20,
                height: Math.random() * 40 + 20,
                dy: -0.3,
                opacity: 0.5,
                life: 150
            };
            this.smokeParticles.push(smoke);
        }
    },

    drawBackground: function(dayNightCycle, shakeTimer) {
        let shakeX = shakeTimer > 0 ? (Math.random() - 0.5) * 10 : 0;
        let shakeY = shakeTimer > 0 ? (Math.random() - 0.5) * 10 : 0;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        ctx.fillStyle = dayNightCycle === "day" ? "#87CEEB" : "#1C2526";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (dayNightCycle === "day") {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.cloudX + 100, 100, 30, 0, Math.PI * 2);
            ctx.arc(this.cloudX + 140, 90, 40, 0, Math.PI * 2);
            ctx.arc(this.cloudX + 180, 110, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.cloudX + canvas.width + 100, 100, 30, 0, Math.PI * 2);
            ctx.arc(this.cloudX + canvas.width + 140, 90, 40, 0, Math.PI * 2);
            ctx.arc(this.cloudX + canvas.width + 180, 110, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#808080";
        ctx.beginPath();
        ctx.moveTo(this.mountainX + 200, 360);
        ctx.lineTo(this.mountainX + 400, 200);
        ctx.lineTo(this.mountainX + 600, 360);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.mountainX + canvas.width + 200, 360);
        ctx.lineTo(this.mountainX + canvas.width + 400, 200);
        ctx.lineTo(this.mountainX + canvas.width + 600, 360);
        ctx.fill();

        ctx.fillStyle = "#4B4B4B";
        ctx.fillRect(this.cityX, 300, 70, 60);
        ctx.fillRect(this.cityX + 80, 280, 60, 80);
        ctx.fillRect(this.cityX + 150, 290, 50, 70);
        ctx.fillRect(this.cityX + 210, 310, 60, 50);
        ctx.fillRect(this.cityX + 280, 270, 80, 90);
        ctx.fillRect(this.cityX + 370, 300, 70, 60);
        ctx.fillRect(this.cityX + 450, 290, 60, 70);
        ctx.fillRect(this.cityX + canvas.width, 300, 70, 60);
        ctx.fillRect(this.cityX + canvas.width + 80, 280, 60, 80);
        ctx.fillRect(this.cityX + canvas.width + 150, 290, 50, 70);
        ctx.fillRect(this.cityX + canvas.width + 210, 310, 60, 50);
        ctx.fillRect(this.cityX + canvas.width + 280, 270, 80, 90);
        ctx.fillRect(this.cityX + canvas.width + 370, 300, 70, 60);
        ctx.fillRect(this.cityX + canvas.width + 450, 290, 60, 70);

        ctx.fillStyle = "#8B4513";
        ctx.fillRect(this.bgX, 360, canvas.width, 40);
        ctx.fillRect(this.bgX + canvas.width, 360, canvas.width, 40);

        this.smokeParticles.forEach(smoke => {
            ctx.fillStyle = `rgba(100, 100, 100, ${smoke.opacity})`;
            ctx.fillRect(smoke.x, smoke.y, smoke.width, smoke.height);
        });

        ctx.restore();
    },

    drawBirds: function() {
        ctx.fillStyle = "black";
        this.birds.forEach(bird => {
            ctx.beginPath();
            ctx.moveTo(bird.x, bird.y);
            ctx.lineTo(bird.x + 5, bird.y - 5);
            ctx.lineTo(bird.x + 10, bird.y);
            ctx.lineTo(bird.x + 5, bird.y + 5);
            ctx.closePath();
            ctx.fill();
        });
    }
};
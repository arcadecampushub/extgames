(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const ballsEl = document.getElementById('balls');
  const bestEl = document.getElementById('best');
  const messageEl = document.getElementById('message');
  const startEl = document.getElementById('start');
  const restartEl = document.getElementById('restart');

  const W = canvas.width, H = canvas.height;
  const BEST_KEY = 'pinball-best';
  const GRAV = 0.22, BALL_R = 9;

  let ball, flippers, bumpers, score, balls, best, running, left, right;

  function bestKey() { try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { return 0; } }

  function newGame() {
    score = 0; balls = 3; best = bestKey();
    scoreEl.textContent = '0'; ballsEl.textContent = '3'; bestEl.textContent = String(best);
    bumpers = [
      { x: W / 2, y: 180, r: 28, flash: 0 },
      { x: W / 2 - 90, y: 270, r: 22, flash: 0 },
      { x: W / 2 + 90, y: 270, r: 22, flash: 0 },
    ];
    flippers = [
      { px: 110, py: 540, len: 80, base: 0.5, ang: 0.5, side: 1 },
      { px: 310, py: 540, len: 80, base: Math.PI - 0.5, ang: Math.PI - 0.5, side: -1 },
    ];
    running = false; ball = null; left = false; right = false;
    messageEl.textContent = 'Click Launch to send the ball.';
    draw();
  }

  function launch() {
    if (ball) return;
    if (balls <= 0) newGame();
    ball = { x: 200, y: H - 40, vx: (Math.random() * 2 - 1) * 2, vy: -9 };
    running = true; messageEl.textContent = 'Keep it alive!';
  }

  function flipperTip(f) {
    return { x: f.px + Math.cos(f.ang) * f.len * f.side, y: f.py + Math.sin(f.ang) * f.len };
  }

  function collideFlipper(f) {
    const tip = flipperTip(f);
    const ax = f.px, ay = f.py, bx = tip.x, by = tip.y;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = ((ball.x - ax) * dx + (ball.y - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + dx * t, cy = ay + dy * t;
    const ddx = ball.x - cx, ddy = ball.y - cy;
    const d = Math.hypot(ddx, ddy);
    const R = BALL_R + 6;
    if (d < R) {
      const nx = ddx / (d || 1), ny = ddy / (d || 1);
      ball.x = cx + nx * R; ball.y = cy + ny * R;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
      const boost = f.ang !== f.base ? 4 : 1;
      ball.vx *= boost; ball.vy *= boost;
    }
  }

  function update() {
    if (!ball) return;
    ball.vy += GRAV;
    ball.x += ball.vx; ball.y += ball.vy;

    // side walls
    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx *= -0.8; }
    if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx *= -0.8; }
    // top
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy *= -0.8; }
    // angled top funnels toward center
    const slope = (W / 2 - 60 - 30) / (H - 220);
    if (ball.y > 220 && ball.y < H - 80) {
      const leftWallX = 30 + (ball.y - 220) * slope;
      const rightWallX = W - 30 - (ball.y - 220) * slope;
      if (ball.x < leftWallX + BALL_R) { ball.x = leftWallX + BALL_R; ball.vx += 0.6; }
      if (ball.x > rightWallX - BALL_R) { ball.x = rightWallX - BALL_R; ball.vx -= 0.6; }
    }

    // bumpers
    for (const b of bumpers) {
      const d = Math.hypot(ball.x - b.x, ball.y - b.y);
      if (d < b.r + BALL_R) {
        const nx = (ball.x - b.x) / (d || 1), ny = (ball.y - b.y) / (d || 1);
        ball.x = b.x + nx * (b.r + BALL_R); ball.y = b.y + ny * (b.r + BALL_R);
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
        ball.vx *= 1.05; ball.vy *= 1.05;
        score += 50; scoreEl.textContent = String(score); b.flash = 1;
      }
      if (b.flash > 0) b.flash -= 0.08;
    }

    collideFlipper(flippers[0]);
    collideFlipper(flippers[1]);

    // drain
    if (ball.y > H - 10) { balls--; ballsEl.textContent = String(Math.max(0, balls)); ball = null; running = false; if (balls <= 0) endGame(); else messageEl.textContent = 'Click Launch for next ball.'; }
  }

  function endGame() {
    if (score > best) { best = score; bestEl.textContent = String(best); try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    messageEl.textContent = 'Game over!';
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1a1038'); g.addColorStop(1, '#0c0820');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // funnels
    ctx.strokeStyle = 'rgba(120,140,255,0.4)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(30, 220); ctx.lineTo(W / 2 - 60, H - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 30, 220); ctx.lineTo(W / 2 + 60, H - 80); ctx.stroke();

    for (const b of bumpers) {
      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = b.flash > 0 ? '#ffe66d' : '#ff5e7e';
      ctx.fillStyle = b.flash > 0 ? '#ffe66d' : '#ff5e7e';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    for (const f of flippers) {
      const tip = flipperTip(f);
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = '#80ed99'; ctx.strokeStyle = '#80ed99'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(f.px, f.py); ctx.lineTo(tip.x, tip.y); ctx.stroke(); ctx.restore();
    }

    if (ball) {
      ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#4cc9f0'; ctx.fillStyle = '#f0f4ff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  function loop() {
    if (running && ball) update();
    draw();
    requestAnimationFrame(loop);
  }

  function setFlipper(on) {
    flippers[0].ang = on ? -0.35 : 0.5;
    flippers[1].ang = on ? Math.PI + 0.35 : Math.PI - 0.5;
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    else if (e.key === 'ArrowRight') right = true;
    else return;
    setFlipper(left || right);
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    else if (e.key === 'ArrowRight') right = false;
    else return;
    setFlipper(left || right);
  });

  startEl.addEventListener('click', launch);
  restartEl.addEventListener('click', newGame);
  newGame();
  requestAnimationFrame(loop);
})();

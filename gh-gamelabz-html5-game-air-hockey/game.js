(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const youEl = document.getElementById('you');
  const aiEl = document.getElementById('ai');
  const targetEl = document.getElementById('target');
  const messageEl = document.getElementById('message');
  const restartEl = document.getElementById('restart');

  const W = canvas.width, H = canvas.height;
  const PR = 28, PU = 13, TARGET = 7;

  let you, ai, puck, youScore, aiScore, over;

  function resetPuck(dir) {
    puck = { x: W / 2, y: H / 2, vx: (Math.random() * 2 - 1) * 3, vy: dir * 3.2, r: PU };
  }

  function newGame() {
    you = { x: W / 2, y: H - 70, r: PR };
    ai = { x: W / 2, y: 70, r: PR };
    youScore = 0; aiScore = 0; over = false; targetEl.textContent = String(TARGET);
    youEl.textContent = '0'; aiEl.textContent = '0';
    messageEl.textContent = 'Move your mouse to control the bottom paddle.';
    resetPuck(Math.random() < 0.5 ? 1 : -1);
    draw();
  }

  function collide(p, pad) {
    const dx = p.x - pad.x, dy = p.y - pad.y;
    const d = Math.hypot(dx, dy);
    if (d < p.r + pad.r && d > 0) {
      const nx = dx / d, ny = dy / d;
      const overlap = p.r + pad.r - d;
      p.x += nx * overlap; p.y += ny * overlap;
      const dot = p.vx * nx + p.vy * ny;
      p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny;
      p.vx = Math.max(-12, Math.min(12, p.vx * 1.06));
      p.vy = Math.max(-12, Math.min(12, p.vy * 1.06));
    }
  }

  function update() {
    if (over) return;
    puck.x += puck.vx; puck.y += puck.vy;
    if (puck.x < puck.r) { puck.x = puck.r; puck.vx *= -1; }
    if (puck.x > W - puck.r) { puck.x = W - puck.r; puck.vx *= -1; }
    if (puck.y < puck.r) { puck.y = puck.r; puck.vy *= -1; }
    if (puck.y > H - puck.r) { puck.y = H - puck.r; puck.vy *= -1; }

    collide(puck, you);
    collide(puck, ai);

    // AI movement
    const targetX = puck.x;
    const dir = Math.sign(targetX - ai.x) || 1;
    ai.x += dir * Math.min(5.2, Math.abs(targetX - ai.x));
    ai.x = Math.max(PR, Math.min(W - PR, ai.x));
    ai.y += (Math.max(60, Math.min(puck.y - 40, H / 2 - PR - 10)) - ai.y) * 0.08;

    // goals
    if (puck.y < 0) { youScore++; youEl.textContent = String(youScore); checkWin(1); }
    else if (puck.y > H) { aiScore++; aiEl.textContent = String(aiScore); checkWin(-1); }
  }

  function checkWin(dir) {
    if (youScore >= TARGET) { over = true; messageEl.textContent = 'You win! 🎉 Press Restart.'; }
    else if (aiScore >= TARGET) { over = true; messageEl.textContent = 'AI wins! Press Restart.'; }
    else resetPuck(dir);
  }

  function draw() {
    ctx.fillStyle = '#0a0c1d'; ctx.fillRect(0, 0, W, H);
    // table markings
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.strokeRect(PR, PR, W - 2 * PR, H - 2 * PR);
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2); ctx.stroke();
    // goals
    ctx.fillStyle = 'rgba(128,237,153,0.25)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = 'rgba(255,94,126,0.25)'; ctx.fillRect(0, H - 6, W, 6);

    // puck
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#ffe66d';
    ctx.fillStyle = '#ffe66d'; ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // paddles
    for (const [p, col] of [[you, '#80ed99'], [ai, '#ff5e7e']]) {
      ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = col;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    you.x = Math.max(PR, Math.min(W - PR, x));
    you.y = Math.max(H / 2 + PR, Math.min(H - PR, y));
  });
  restartEl.addEventListener('click', newGame);

  function loop() { update(); draw(); requestAnimationFrame(loop); }
  newGame(); requestAnimationFrame(loop);
})();

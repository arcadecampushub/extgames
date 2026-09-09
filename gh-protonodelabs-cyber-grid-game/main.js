const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvases = [
  document.getElementById("next1"),
  document.getElementById("next2"),
  document.getElementById("next3"),
];
const nextCtxs = nextCanvases.map((c) => c.getContext("2d"));

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const playBtn = document.getElementById("playBtn");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const musicToggle = document.getElementById("musicToggle");
const musicVolume = document.getElementById("musicVolume");
const sfxToggle = document.getElementById("sfxToggle");
const sfxVolume = document.getElementById("sfxVolume");

const COLS = 10;
const ROWS = 20;
const BLOCK = 15;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

const SHAPES = {
  T: [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  O: [
    [2, 2],
    [2, 2],
  ],
  L: [
    [0, 3, 0],
    [0, 3, 0],
    [0, 3, 3],
  ],
  J: [
    [0, 4, 0],
    [0, 4, 0],
    [4, 4, 0],
  ],
  I: [
    [0, 5, 0, 0],
    [0, 5, 0, 0],
    [0, 5, 0, 0],
    [0, 5, 0, 0],
  ],
  S: [
    [0, 6, 6],
    [6, 6, 0],
    [0, 0, 0],
  ],
  Z: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
};

const COLORS = {
  0: "transparent",
  1: "#6c63ff",
  2: "#00f5ff",
  3: "#ff8f00",
  4: "#00b4ff",
  5: "#00ff85",
  6: "#ff2bd6",
  7: "#ffe66d",
  ghost: "rgba(255, 255, 255, 0.2)",
};

const state = {
  arena: createMatrix(COLS, ROWS),
  score: 0,
  lines: 0,
  level: 1,
  dropInterval: 800,
  lastTime: 0,
  dropCounter: 0,
  elapsed: 0,
  mode: "idle",
  gameOver: false,
  bag: [],
  next: [],
  effects: {
    shakeTime: 0,
    shakeMag: 0,
    flashTime: 0,
    flashColor: "255,255,255",
  },
  particles: [],
  player: {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null,
  },
};

const audioState = {
  musicMuted: localStorage.getItem("ct_music_muted") === "true",
  musicVolume: Math.min(1, Math.max(0, Number(localStorage.getItem("ct_music_volume") || 0.25))),
  sfxMuted: localStorage.getItem("ct_sfx_muted") === "true",
  sfxVolume: Math.min(1, Math.max(0, Number(localStorage.getItem("ct_sfx_volume") || 0.3))),
};

const musicTracks = ["./assets/audio/bgm.mp3"];

const music = new Audio(musicTracks[0]);
music.loop = false;
music.volume = audioState.musicVolume;
music.muted = audioState.musicMuted;
let musicIndex = 0;

const sfxSources = {
  rotate: "./assets/audio/sfx/rotate.mp3",
  softdrop: "./assets/audio/sfx/softdrop.mp3",
  harddrop: "./assets/audio/sfx/harddrop.mp3",
  lock: "./assets/audio/sfx/lock.mp3",
  lineclear: "./assets/audio/sfx/lineclear.mp3",
};

const sfx = Object.fromEntries(
  Object.entries(sfxSources).map(([key, src]) => [key, new Audio(src)]),
);

let lastRotateSfx = 0;
let lastSoftdropSfx = 0;

function applyAudioSettings() {
  music.muted = audioState.musicMuted;
  music.volume = audioState.musicVolume;
  musicToggle.classList.toggle("is-on", !audioState.musicMuted);
  musicVolume.value = Math.round(audioState.musicVolume * 100);
  sfxToggle.classList.toggle("is-on", !audioState.sfxMuted);
  sfxVolume.value = Math.round(audioState.sfxVolume * 100);
}

function playSfx(name, volume = 1) {
  if (audioState.sfxMuted || audioState.sfxVolume <= 0) return;
  const base = sfx[name];
  if (!base) return;
  const sound = base.cloneNode();
  sound.volume = Math.min(1, audioState.sfxVolume * volume);
  sound.play().catch(() => {});
}

function updateBgmRate() {
  const rate = Math.min(1.3, 1 + (state.level - 1) * 0.03);
  music.playbackRate = rate;
}

function playMusicAt(index) {
  musicIndex = index;
  music.src = musicTracks[musicIndex];
  updateBgmRate();
  if (!audioState.musicMuted) {
    music.play().catch(() => {});
  }
}

function nextTrack() {
  const nextIndex = (musicIndex + 1) % musicTracks.length;
  playMusicAt(nextIndex);
}

music.addEventListener("ended", () => {
  nextTrack();
});

function timeSince(last, threshold) {
  return performance.now() - last > threshold;
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function shuffleBag() {
  const pieces = "TJLOISZ".split("");
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

const TRUE_RANDOM = true;

function fillNextQueue() {
  while (state.next.length < 3) {
    if (TRUE_RANDOM) {
      const pieces = "TJLOISZ";
      state.next.push(pieces[Math.floor(Math.random() * pieces.length)]);
      continue;
    }
    if (state.bag.length === 0) {
      state.bag = shuffleBag();
    }
    state.next.push(state.bag.pop());
  }
}

function playerReset() {
  fillNextQueue();
  const nextType = state.next.shift();
  state.player.type = nextType;
  state.player.matrix = SHAPES[nextType].map((row) => row.slice());
  state.player.pos.y = 0;
  state.player.pos.x =
    ((COLS / 2) | 0) - ((state.player.matrix[0].length / 2) | 0);
  if (collide(state.arena, state.player)) {
    addShake(280, 14);
    state.gameOver = true;
  }
  fillNextQueue();
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = state.player.pos.x;
  let offset = 1;
  rotate(state.player.matrix, dir);
  while (collide(state.arena, state.player)) {
    state.player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > state.player.matrix[0].length) {
      rotate(state.player.matrix, -dir);
      state.player.pos.x = pos;
      return;
    }
  }
}

function playerMove(dir) {
  state.player.pos.x += dir;
  if (collide(state.arena, state.player)) {
    state.player.pos.x -= dir;
  }
}

function playerDrop() {
  state.player.pos.y++;
  if (collide(state.arena, state.player)) {
    state.player.pos.y--;
    merge(state.arena, state.player);
    playSfx("lock", 0.35);
    const sweep = arenaSweep();
    if (sweep.lines > 0) {
      playSfx("lineclear", 0.45 + sweep.lines * 0.05);
      spawnLineParticles(sweep.rows);
      pulseFlash(260, sweep.lines);
      addShake(160, 6 + sweep.lines * 2);
    }
    playerReset();
  }
  state.dropCounter = 0;
}

function hardDrop() {
  playSfx("harddrop", 0.6);
  while (!collide(state.arena, state.player)) {
    state.player.pos.y++;
  }
  state.player.pos.y--;
  merge(state.arena, state.player);
  playSfx("lock", 0.35);
  const sweep = arenaSweep();
  if (sweep.lines > 0) {
    playSfx("lineclear", 0.45 + sweep.lines * 0.05);
    spawnLineParticles(sweep.rows);
    pulseFlash(320, sweep.lines);
  }
  addShake(140, 10);
  playerReset();
  state.dropCounter = 0;
}


function arenaSweep() {
  let rowCount = 1;
  let lines = 0;
  const rows = [];
  outer: for (let y = state.arena.length - 1; y > 0; --y) {
    for (let x = 0; x < state.arena[y].length; ++x) {
      if (state.arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = state.arena.splice(y, 1)[0].fill(0);
    state.arena.unshift(row);
    ++y;
    rows.push(y);
    lines++;
    state.score += rowCount * 100;
    rowCount *= 2;
  }
  if (lines > 0) {
    state.lines += lines;
  }
  return { lines, rows };
}

function updateHud() {
  scoreEl.textContent = state.score;
  linesEl.textContent = state.lines;
  levelEl.textContent = state.level;
}

function drawBlock(ctxTarget, x, y, color) {
  const size = BLOCK - 2;
  const px = x * BLOCK + 1;
  const py = y * BLOCK + 1;
  ctxTarget.save();
  ctxTarget.shadowBlur = 6;
  ctxTarget.shadowColor = color;

  const grad = ctxTarget.createLinearGradient(px, py, px + size, py + size);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.18, color);
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctxTarget.fillStyle = grad;
  ctxTarget.fillRect(px, py, size, size);

  ctxTarget.globalAlpha = 0.28;
  ctxTarget.fillStyle = color;
  ctxTarget.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctxTarget.globalAlpha = 1;

  ctxTarget.fillStyle = "rgba(255,255,255,0.35)";
  ctxTarget.fillRect(px + 2, py + 2, size - 4, size * 0.3);
  ctxTarget.fillStyle = "rgba(0,0,0,0.3)";
  ctxTarget.fillRect(px + 2, py + size * 0.62, size - 4, size * 0.32);
  ctxTarget.strokeStyle = "rgba(255,255,255,0.5)";
  ctxTarget.lineWidth = 1;
  ctxTarget.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  ctxTarget.restore();
}

function drawMatrix(matrix, offset, ctxTarget, ghost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(
          ctxTarget,
          x + offset.x,
          y + offset.y,
          ghost ? COLORS.ghost : COLORS[value],
        );
      }
    });
  });
}

function drawGrid(ctxTarget, width, height, cell) {
  ctxTarget.strokeStyle = "rgba(0, 245, 255, 0.12)";
  ctxTarget.lineWidth = 1;
  for (let x = 0; x <= width; x += cell) {
    ctxTarget.beginPath();
    ctxTarget.moveTo(x, 0);
    ctxTarget.lineTo(x, height);
    ctxTarget.stroke();
  }
  for (let y = 0; y <= height; y += cell) {
    ctxTarget.beginPath();
    ctxTarget.moveTo(0, y);
    ctxTarget.lineTo(width, y);
    ctxTarget.stroke();
  }
}

function calcGhostPosition() {
  const ghost = {
    matrix: state.player.matrix,
    pos: { x: state.player.pos.x, y: state.player.pos.y },
  };
  while (!collide(state.arena, ghost)) {
    ghost.pos.y++;
  }
  ghost.pos.y--;
  return ghost;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shake = state.effects.shakeTime > 0 ? state.effects.shakeMag : 0;
  const dx = shake ? (Math.random() - 0.5) * shake : 0;
  const dy = shake ? (Math.random() - 0.5) * shake : 0;
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height, BLOCK);
  drawMatrix(state.arena, { x: 0, y: 0 }, ctx);
  if (state.player.matrix) {
    const ghost = calcGhostPosition();
    drawMatrix(ghost.matrix, ghost.pos, ctx, true);
    drawMatrix(state.player.matrix, state.player.pos, ctx);
  }
  drawParticles(ctx);
  drawFlash(ctx);
  drawChromaticAberration(ctx);
  ctx.restore();

  nextCtxs.forEach((miniCtx, idx) => {
    drawMini(miniCtx, state.next[idx]);
  });
}

function drawMini(ctxTarget, type) {
  ctxTarget.clearRect(0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height);
  ctxTarget.fillStyle = "#0c1222";
  ctxTarget.fillRect(0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height);
  drawGrid(ctxTarget, ctxTarget.canvas.width, ctxTarget.canvas.height, BLOCK);
  if (!type) return;
  const matrix = SHAPES[type];
  const offsetX =
    ((ctxTarget.canvas.width / BLOCK - matrix[0].length) / 2) | 0;
  const offsetY =
    ((ctxTarget.canvas.height / BLOCK - matrix.length) / 2) | 0;
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(ctxTarget, x + offsetX, y + offsetY, COLORS[value]);
      }
    });
  });
}

function update(time = 0) {
  if (state.mode === "running" && !state.gameOver) {
    const delta = time - state.lastTime;
    state.lastTime = time;
    state.dropCounter += delta;
    state.elapsed += delta;
    if (state.dropCounter > state.dropInterval) {
      playerDrop();
    }
    updateDifficulty();
    updateEffects(delta);
    updateParticles(delta);
  }
  draw();
  updateHud();
  requestAnimationFrame(update);
}

function resetGame() {
  state.arena = createMatrix(COLS, ROWS);
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.dropInterval = 800;
  state.dropCounter = 0;
  state.elapsed = 0;
  state.gameOver = false;
  state.bag = [];
  state.next = [];
  state.effects = { shakeTime: 0, shakeMag: 0, flashTime: 0 };
  state.particles = [];
  playerReset();
}

function updateDifficulty() {
  const lineLevel = Math.floor(state.lines / 8) + 1;
  const timeLevel = Math.floor(state.elapsed / 30000) + 1;
  const nextLevel = Math.max(lineLevel, timeLevel);
  if (nextLevel !== state.level) {
    state.level = nextLevel;
    state.dropInterval = Math.max(90, 800 - (state.level - 1) * 55);
    updateBgmRate();
  }
}

function togglePause() {
  if (state.mode === "running") {
    state.mode = "paused";
    music.pause();
  } else if (state.mode === "paused") {
    state.mode = "running";
    if (!audioState.musicMuted) {
      music.play().catch(() => {});
    }
  }
  updateButtons();
}

function updateButtons() {
  if (state.mode === "idle") {
    playBtn.classList.remove("is-hidden");
    startBtn.classList.add("is-hidden");
    pauseBtn.classList.add("is-hidden");
    return;
  }
  playBtn.classList.add("is-hidden");
  startBtn.classList.remove("is-hidden");
  pauseBtn.classList.remove("is-hidden");
  pauseBtn.textContent = state.mode === "paused" ? "Resume" : "Pause";
}

document.addEventListener("keydown", (event) => {
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "ArrowUp",
      "Space",
    ].includes(event.code)
  ) {
    event.preventDefault();
  }
  if (state.mode !== "running") return;
  if (state.gameOver && event.code !== "Enter") return;
  switch (event.code) {
    case "ArrowLeft":
      playerMove(-1);
      break;
    case "ArrowRight":
      playerMove(1);
      break;
    case "ArrowDown":
      if (timeSince(lastSoftdropSfx, 140)) {
        playSfx("softdrop", 0.2);
        lastSoftdropSfx = performance.now();
      }
      playerDrop();
      break;
    case "ArrowUp":
      playerRotate(1);
      if (timeSince(lastRotateSfx, 90)) {
        playSfx("rotate", 0.25);
        lastRotateSfx = performance.now();
      }
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    case "KeyZ":
      playerRotate(-1);
      if (timeSince(lastRotateSfx, 90)) {
        playSfx("rotate", 0.25);
        lastRotateSfx = performance.now();
      }
      break;
    case "KeyX":
      playerRotate(1);
      if (timeSince(lastRotateSfx, 90)) {
        playSfx("rotate", 0.25);
        lastRotateSfx = performance.now();
      }
      break;
    case "KeyP":
      togglePause();
      break;
    case "Enter":
      if (state.gameOver) resetGame();
      break;
    default:
      break;
  }
});

playBtn.addEventListener("click", () => {
  resetGame();
  state.mode = "running";
  updateButtons();
  updateBgmRate();
  playMusicAt(0);
});

startBtn.addEventListener("click", () => {
  resetGame();
  state.mode = "running";
  updateButtons();
  updateBgmRate();
  playMusicAt(0);
});

pauseBtn.addEventListener("click", () => {
  togglePause();
});

musicToggle.addEventListener("click", () => {
  audioState.musicMuted = !audioState.musicMuted;
  localStorage.setItem("ct_music_muted", String(audioState.musicMuted));
  applyAudioSettings();
  if (audioState.musicMuted) {
    music.pause();
  } else if (state.mode === "running") {
    music.play().catch(() => {});
  }
});

musicVolume.addEventListener("input", (event) => {
  const value = Number(event.target.value) / 100;
  audioState.musicVolume = Math.min(1, Math.max(0, value));
  localStorage.setItem("ct_music_volume", String(audioState.musicVolume));
  if (audioState.musicMuted && audioState.musicVolume > 0) {
    audioState.musicMuted = false;
    localStorage.setItem("ct_music_muted", "false");
    if (state.mode === "running") {
      music.play().catch(() => {});
    }
  }
  applyAudioSettings();
});

sfxToggle.addEventListener("click", () => {
  audioState.sfxMuted = !audioState.sfxMuted;
  localStorage.setItem("ct_sfx_muted", String(audioState.sfxMuted));
  applyAudioSettings();
});

sfxVolume.addEventListener("input", (event) => {
  const value = Number(event.target.value) / 100;
  audioState.sfxVolume = Math.min(1, Math.max(0, value));
  localStorage.setItem("ct_sfx_volume", String(audioState.sfxVolume));
  if (audioState.sfxMuted && audioState.sfxVolume > 0) {
    audioState.sfxMuted = false;
    localStorage.setItem("ct_sfx_muted", "false");
  }
  applyAudioSettings();
});

applyAudioSettings();
updateButtons();
update();

function addShake(duration, magnitude) {
  state.effects.shakeTime = Math.max(state.effects.shakeTime, duration);
  state.effects.shakeMag = Math.max(state.effects.shakeMag, magnitude);
}

function pulseFlash(duration, lines = 1) {
  const palette = [
    "0,245,255",
    "255,43,214",
    "0,255,133",
    "255,209,102",
  ];
  state.effects.flashColor = palette[Math.min(lines - 1, palette.length - 1)];
  state.effects.flashTime = Math.max(state.effects.flashTime, duration);
}

function updateEffects(delta) {
  if (state.effects.shakeTime > 0) {
    state.effects.shakeTime -= delta;
    if (state.effects.shakeTime <= 0) {
      state.effects.shakeMag = 0;
    }
  }
  if (state.effects.flashTime > 0) {
    state.effects.flashTime -= delta;
  }
}

function spawnLineParticles(rows) {
  rows.forEach((row) => {
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * canvas.width;
      const y = row * BLOCK;
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -Math.random() * 2.2 - 0.6,
        life: 600 + Math.random() * 400,
        color: ["#3cf2ff", "#ff6ad5", "#ffb938", "#75ff6a"][
          Math.floor(Math.random() * 4)
        ],
        size: 2 + Math.random() * 3,
      });
    }
  });
}

function updateParticles(delta) {
  state.particles.forEach((p) => {
    p.life -= delta;
    p.x += p.vx * (delta / 16);
    p.y += p.vy * (delta / 16);
    p.vy += 0.02 * (delta / 16);
  });
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawParticles(ctxTarget) {
  ctxTarget.save();
  ctxTarget.globalCompositeOperation = "lighter";
  state.particles.forEach((p) => {
    ctxTarget.save();
    ctxTarget.globalAlpha = Math.max(0, p.life / 1000);
    ctxTarget.fillStyle = p.color;
    ctxTarget.shadowBlur = 10;
    ctxTarget.shadowColor = p.color;
    ctxTarget.beginPath();
    ctxTarget.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctxTarget.fill();
    ctxTarget.restore();
  });
  ctxTarget.restore();
}

function drawFlash(ctxTarget) {
  if (state.effects.flashTime <= 0) return;
  const alpha = Math.min(0.35, state.effects.flashTime / 800);
  const grad = ctxTarget.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, `rgba(${state.effects.flashColor},${alpha})`);
  grad.addColorStop(0.3, `rgba(255,255,255,${alpha * 0.5})`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  ctxTarget.fillStyle = grad;
  ctxTarget.fillRect(0, 0, canvas.width, canvas.height);
}

function drawChromaticAberration(ctxTarget) {
  if (state.effects.flashTime <= 0) return;
  const strength = Math.min(6, 1 + (state.effects.flashTime / 120));
  ctxTarget.save();
  ctxTarget.globalCompositeOperation = "screen";
  ctxTarget.globalAlpha = Math.min(0.5, state.effects.flashTime / 500);
  ctxTarget.fillStyle = "rgba(0,245,255,0.25)";
  ctxTarget.fillRect(-strength, 0, canvas.width, canvas.height);
  ctxTarget.fillStyle = "rgba(255,43,214,0.25)";
  ctxTarget.fillRect(strength, 0, canvas.width, canvas.height);
  ctxTarget.restore();
}

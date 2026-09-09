import { GAME } from "./config.js";
import { clamp, lerp } from "./math.js";

// Run scoring: distance x combo, near-miss bonuses, checkpoint timer,
// difficulty ramp, and the persistent best score.
export class Score {
  constructor() {
    this.best = Number(localStorage.getItem("nnr-best")) || 0;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.time = GAME.startTime;
    this.dist = 0;
    this.nextCheckpoint = GAME.checkpointEvery;
    this.over = false;
  }

  get difficulty() {
    return clamp(this.dist / GAME.difficultyRampDist, 0, 1);
  }

  // events: { nearMiss: count, collision: bool } — collision already
  // invulnerability-gated by the caller. Returns HUD flags or null.
  update(dt, distDelta, events) {
    if (this.over) return null;

    this.dist += distDelta;
    this.score += distDelta * GAME.pointsPerMeter * this.combo;

    let flags = null;
    if (events.nearMiss > 0) {
      this.combo = Math.min(this.combo + events.nearMiss, GAME.comboMax);
      this.comboTimer = GAME.comboWindow;
      this.score += GAME.nearMissPoints * events.nearMiss * this.combo;
      flags = { nearMiss: true };
    } else {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    if (events.collision) {
      this.combo = 1;
      this.comboTimer = 0;
    }

    if (this.dist >= this.nextCheckpoint) {
      const bonus = Math.round(
        lerp(GAME.checkpointBonus, GAME.checkpointBonusMin, this.difficulty),
      );
      this.time += bonus;
      this.nextCheckpoint += GAME.checkpointEvery;
      flags = { ...(flags ?? {}), checkpoint: bonus };
    }

    this.time -= dt;
    if (this.time <= 0) {
      this.time = 0;
      this.over = true;
      if (this.score > this.best) {
        this.best = Math.round(this.score);
        localStorage.setItem("nnr-best", String(this.best));
      }
    }
    return flags;
  }
}

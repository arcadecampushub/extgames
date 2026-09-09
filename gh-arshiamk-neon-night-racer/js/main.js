import { World } from "./world.js";
import { Track } from "./track.js";
import { Vehicle } from "./vehicle.js";
import { Traffic } from "./traffic.js";
import { Assets } from "./assets.js";
import { Score } from "./score.js";
import { Hud } from "./hud.js";
import { Input } from "./input.js";
import { GameAudio } from "./audio.js";
import { GAME, CAR } from "./config.js";
import { clamp } from "./math.js";

// Synthetic inputs for non-interactive states.
const ATTRACT_INPUT = { throttle: true, brake: false, steer: 0 };
const BRAKE_INPUT = { throttle: false, brake: true, steer: 0 };
const EVENTS = { nearMiss: 0, collision: false };

class Game {
  constructor() {
    const canvas = document.getElementById("gameCanvas");
    this.world = new World(canvas);
    this.track = new Track(this.world.scene);
    this.vehicle = new Vehicle(this.world.scene);
    this.traffic = new Traffic(this.world.scene, this.track);
    this.score = new Score();
    this.hud = new Hud();
    this.input = new Input();
    this.state = "title"; // title | running | gameover
    this.invuln = 0;

    // Audio starts on the first user gesture (browser autoplay policy).
    this.audio = new GameAudio();
    const unlock = () => this.audio.unlock();
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("pointerdown", unlock, { once: true });

    // Generated models stream in behind the placeholders.
    this.assets = new Assets();
    this.assets.load().then(() => {
      this.vehicle.applyModel(this.assets);
      this.traffic.applyModels(this.assets);
      this.track.setAssets(this.assets);
    });

    this.last = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _start() {
    this.state = "running";
    this.hud.hideOverlays();
    this.vehicle.reset();
    this.score.reset();
    this.traffic.reset();
    this.invuln = 0;
  }

  // One simulation step. Kept separate from the rAF loop so the automated
  // smoke test can drive the game deterministically.
  step(dt) {
    if (this.state === "title") {
      ATTRACT_INPUT.throttle = this.vehicle.speed < 16;
      this.vehicle.update(ATTRACT_INPUT, dt, this.track);
      if (this.input.consumeStart()) this._start();
    } else if (this.state === "running") {
      const prevS = this.vehicle.s;
      this.vehicle.update(this.input, dt, this.track);

      EVENTS.nearMiss = 0;
      EVENTS.collision = false;
      this.traffic.update(dt, this.vehicle, this.score.difficulty, EVENTS);

      this.invuln = Math.max(0, this.invuln - dt);
      let collided = false;
      if (EVENTS.collision && this.invuln === 0) {
        collided = true;
        this.invuln = GAME.invulnTime;
        this.vehicle.speed *= GAME.collisionSpeedCut;
        this.world.addShake(0.7);
        this.audio.impact();
      }
      if (EVENTS.nearMiss > 0) this.audio.whoosh();

      const flags = this.score.update(dt, this.vehicle.s - prevS, {
        nearMiss: EVENTS.nearMiss,
        collision: collided,
      });
      if (flags && flags.checkpoint) {
        this.hud.toast(`CHECKPOINT +${flags.checkpoint}s`);
        this.audio.chime();
      } else if (flags && flags.nearMiss) {
        this.hud.toast(`NEAR MISS ×${this.score.combo}`);
      }

      this.hud.update(this.vehicle.kmh, this.score);

      if (this.score.over) {
        this.state = "gameover";
        this.hud.showGameOver(Math.round(this.score.score), this.score.best);
      }
    } else {
      // Game over: the car brakes to a stop while traffic flows on.
      this.vehicle.update(BRAKE_INPUT, dt, this.track);
      EVENTS.nearMiss = 0;
      EVENTS.collision = false;
      this.traffic.update(dt, this.vehicle, this.score.difficulty, EVENTS);
      if (this.input.consumeStart()) this._start();
    }

    if (this.input.consumeMute()) this.audio.toggleMute();
    this.audio.updateEngine(this.vehicle.speed / CAR.maxSpeed);

    this.track.update(this.vehicle.s);
    this.world.updateCamera(this.track, this.vehicle, dt);
  }

  _loop(now) {
    const dt = clamp((now - this.last) / 1000, 0, 0.05);
    this.last = now;
    this.step(dt);
    this.world.render();
    requestAnimationFrame((t) => this._loop(t));
  }
}

// Exposed for debugging and the automated smoke test.
window.game = new Game();

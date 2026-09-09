// All game audio. Music prefers assets/audio/music.mp3 when present and
// otherwise falls back to a procedural Web Audio synthwave loop (seamless
// by construction). Engine hum and SFX are always procedural. Everything
// waits for the first user gesture per browser autoplay policy.

const BPM = 112;
const STEP = 60 / BPM / 4; // one 16th note
// Four-bar A-minor progression as semitone offsets from A2 (110 Hz):
// Am, F, C, G — the synthwave workhorse.
const CHORDS = [
  [0, 3, 7],
  [-4, 0, 3],
  [3, 7, 10],
  [-2, 2, 5],
];
const ROOT = 110;
const note = (semi) => ROOT * Math.pow(2, semi / 12);

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("nnr-muted") === "1";
  }

  // Call from a user-gesture handler. Safe to call repeatedly.
  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._build();
      this._startMusic();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("nnr-muted", this.muted ? "1" : "0");
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  _build() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    // Shared noise buffer for hats, whooshes, impacts
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Arp echo line
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = STEP * 6;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    this.delay.connect(fb);
    fb.connect(this.delay);
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    this.delay.connect(wet);
    wet.connect(this.musicBus);

    // Engine hum: saw + sub sine through a lowpass, always running
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineLp = ctx.createBiquadFilter();
    this.engineLp.type = "lowpass";
    this.engineLp.frequency.value = 200;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 50;
    this.engineSub = ctx.createOscillator();
    this.engineSub.type = "sine";
    this.engineSub.frequency.value = 25;
    this.engineOsc.connect(this.engineLp);
    this.engineSub.connect(this.engineLp);
    this.engineLp.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
    this.engineSub.start();
  }

  // --- Music -----------------------------------------------------------

  async _startMusic() {
    try {
      const res = await fetch("assets/audio/music.mp3");
      if (res.ok) {
        const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(this.musicBus);
        src.start();
        return;
      }
    } catch {
      // fall through to the procedural loop
    }
    this.step16 = 0;
    this.nextStep = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this._tick(), 90);
  }

  _tick() {
    const ahead = this.ctx.currentTime + 0.25;
    while (this.nextStep < ahead) {
      this._scheduleStep(this.step16, this.nextStep);
      this.step16 = (this.step16 + 1) % 64;
      this.nextStep += STEP;
    }
  }

  _scheduleStep(i, t) {
    const chord = CHORDS[(i / 16) | 0];

    if (i % 16 === 0) this._pad(chord, t, STEP * 16);
    if (i % 4 === 0) this._kick(t);
    if (i % 4 === 2) this._hat(t);
    if (i % 2 === 0) this._bass(chord[0] - 12, t);
    this._arp(chord[(i % 6) % 3] + 12 + (i % 6 > 2 ? 12 : 0), t);
  }

  _env(gainNode, t, peak, attack, decay) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  _pad(chord, t, dur) {
    for (const semi of chord) {
      for (const det of [-7, 7]) {
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = note(semi + 12);
        osc.detune.value = det;
        const lp = this.ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(500, t);
        lp.frequency.linearRampToValueAtTime(1100, t + dur * 0.6);
        lp.frequency.linearRampToValueAtTime(500, t + dur);
        const g = this.ctx.createGain();
        this._env(g, t, 0.035, 0.4, dur - 0.4);
        osc.connect(lp);
        lp.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + dur + 0.1);
      }
    }
  }

  _kick(t) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = this.ctx.createGain();
    this._env(g, t, 0.5, 0.005, 0.16);
    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  _hat(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    this._env(g, t, 0.08, 0.003, 0.05);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicBus);
    src.start(t);
    src.stop(t + 0.08);
  }

  _bass(semi, t) {
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = note(semi);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const g = this.ctx.createGain();
    this._env(g, t, 0.16, 0.01, STEP * 1.7);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.musicBus);
    osc.start(t);
    osc.stop(t + STEP * 2);
  }

  _arp(semi, t) {
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = note(semi + 12);
    const g = this.ctx.createGain();
    this._env(g, t, 0.06, 0.005, 0.11);
    osc.connect(g);
    g.connect(this.musicBus);
    g.connect(this.delay);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // --- Engine + SFX ----------------------------------------------------

  // ratio: 0..1 of max speed, called every frame
  updateEngine(ratio) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const wobble = Math.sin(t * 31) * 2;
    this.engineOsc.frequency.setTargetAtTime(48 + ratio * 96 + wobble, t, 0.05);
    this.engineSub.frequency.setTargetAtTime(24 + ratio * 48, t, 0.05);
    this.engineLp.frequency.setTargetAtTime(160 + ratio * 780, t, 0.08);
    this.engineGain.gain.setTargetAtTime(ratio > 0.01 ? 0.05 + ratio * 0.05 : 0, t, 0.1);
  }

  whoosh() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(2800, t + 0.2);
    const g = this.ctx.createGain();
    this._env(g, t, 0.35, 0.02, 0.22);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.3);
  }

  impact() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g = this.ctx.createGain();
    this._env(g, t, 0.55, 0.005, 0.28);
    src.connect(lp);
    lp.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.35);

    const thump = this.ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(75, t);
    thump.frequency.exponentialRampToValueAtTime(32, t + 0.22);
    const tg = this.ctx.createGain();
    this._env(tg, t, 0.5, 0.005, 0.25);
    thump.connect(tg);
    tg.connect(this.sfxBus);
    thump.start(t);
    thump.stop(t + 0.3);
  }

  chime() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [880, 1174.7].forEach((f, k) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      this._env(g, t + k * 0.09, 0.18, 0.01, 0.25);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t + k * 0.09);
      osc.stop(t + k * 0.09 + 0.3);
    });
  }
}

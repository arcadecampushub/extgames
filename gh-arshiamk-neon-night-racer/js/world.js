import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CAMERA, RENDER, COLORS, CAR } from "./config.js";

const _look = new THREE.Vector3();
const _fwd = new THREE.Vector3();

// Owns the scene, chase camera, lighting, sky, and the bloom pipeline.
export class World {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.fog, RENDER.fogNear, RENDER.fogFar);

    this.camera = new THREE.PerspectiveCamera(CAMERA.fovBase, 1, 0.1, 2500);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDER.exposure;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      RENDER.bloomStrength,
      RENDER.bloomRadius,
      RENDER.bloomThreshold,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this._buildLights();
    this._buildSky();
    this.shake = 0;

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
  }

  _buildLights() {
    this.scene.add(new THREE.HemisphereLight(0x33335f, 0x080810, 1.1));
    const moon = new THREE.DirectionalLight(0x8899ff, 0.7);
    moon.position.set(-60, 120, -40);
    this.scene.add(moon);
  }

  _buildSky() {
    // Stars: a dome of points that follows the camera position.
    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      const r = 1500;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.9 + 40;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xcfd8ff,
        size: 1.6,
        sizeAttenuation: false,
        fog: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    // Synthwave sun: horizon-locked billboard ahead of the camera.
    this.sun = new THREE.Mesh(
      new THREE.CircleGeometry(170, 48),
      new THREE.MeshBasicMaterial({
        map: this._sunTexture(),
        transparent: true,
        fog: false,
        depthWrite: false,
      }),
    );
    this.scene.add(this.sun);
  }

  _sunTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#ffd166");
    grad.addColorStop(0.45, "#ff5e8a");
    grad.addColorStop(1, "#c73cff");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(128, 128, 126, 0, Math.PI * 2);
    g.fill();
    // Classic horizontal slits, widening toward the bottom
    g.globalCompositeOperation = "destination-out";
    let y = 140;
    let h = 4;
    while (y < 256) {
      g.fillRect(0, y, 256, h);
      y += h + 14;
      h += 3;
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  addShake(amount) {
    this.shake = Math.min(this.shake + amount, 1);
  }

  updateCamera(track, vehicle, dt) {
    const s = vehicle.s;
    track.posAt(s - CAMERA.back, vehicle.lat * 0.5, this.camera.position);
    this.camera.position.y += CAMERA.height;
    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 1.6;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.9;
      this.shake *= Math.exp(-5 * dt);
    }
    track.posAt(s + CAMERA.lookAhead, vehicle.lat * 0.8, _look);
    _look.y += 1.6;
    this.camera.lookAt(_look);

    // Speed widens the FOV for a sense of velocity.
    const t = vehicle.speed / CAR.maxSpeed;
    const fov = CAMERA.fovBase + (CAMERA.fovMax - CAMERA.fovBase) * t * t;
    if (Math.abs(fov - this.camera.fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // Sky follows the camera.
    this.stars.position.copy(this.camera.position);
    _fwd.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    _fwd.y = 0;
    _fwd.normalize();
    this.sun.position
      .copy(this.camera.position)
      .addScaledVector(_fwd, 1500);
    this.sun.position.y = this.camera.position.y + 60;
    this.sun.lookAt(this.camera.position);
  }

  render() {
    this.composer.render();
  }
}

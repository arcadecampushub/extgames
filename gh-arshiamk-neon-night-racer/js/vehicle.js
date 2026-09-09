import * as THREE from "three";
import { CAR, COLORS } from "./config.js";
import { clamp, damp } from "./math.js";

// Player car: arcade physics in road space (s = distance, lat = lateral),
// rendered as a placeholder primitive build until the Meshy hero model
// arrives. The mesh hierarchy is swapped by assets.js in Phase 3; physics
// and placement are model-agnostic.
export class Vehicle {
  constructor(scene) {
    this.s = 0;
    this.lat = 0;
    this.speed = 0; // m/s
    this.steer = 0; // smoothed -1..1

    this.group = new THREE.Group();
    this.group.rotation.order = "YXZ";
    this._buildPlaceholder();
    scene.add(this.group);
  }

  get kmh() {
    return this.speed * 3.6;
  }

  _buildPlaceholder() {
    const g = this.group;

    const body = new THREE.MeshStandardMaterial({
      color: COLORS.carBody,
      metalness: 0.6,
      roughness: 0.35,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x0a0a14,
      metalness: 0.9,
      roughness: 0.12,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.9,
    });

    // Body parts are placeholders swapped out when the hero model loads;
    // the neon overlays (lights, plate, exhausts) below are permanent.
    this.bodyParts = [];

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.3), body);
    chassis.position.y = 0.55;
    g.add(chassis);
    this.bodyParts.push(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 2.0), glass);
    cabin.position.set(0, 1.05, -0.15);
    g.add(cabin);
    this.bodyParts.push(cabin);

    const splitter = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.18, 0.7),
      dark,
    );
    splitter.position.set(0, 0.3, 2.0);
    g.add(splitter);
    this.bodyParts.push(splitter);

    const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.28, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [x, z] of [
      [-0.85, 1.45],
      [0.85, 1.45],
      [-0.85, -1.45],
      [0.85, -1.45],
    ]) {
      const wheel = new THREE.Mesh(wheelGeo, dark);
      wheel.position.set(x, 0.33, z);
      g.add(wheel);
      this.bodyParts.push(wheel);
    }

    // Neon taillight bar (rear = -z; the camera mostly sees this)
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.14, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: COLORS.tail,
        emissiveIntensity: 3.5,
      }),
    );
    tail.position.set(0, 0.78, -2.14);
    g.add(tail);

    const headMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: COLORS.headlight,
      emissiveIntensity: 2.5,
    });
    for (const x of [-0.55, 0.55]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.06), headMat);
      lamp.position.set(x, 0.62, 2.16);
      g.add(lamp);
    }

    // ARSHIAMK plate, applied in-engine per the spec
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.16),
      new THREE.MeshStandardMaterial({
        map: this._plateTexture(),
        roughness: 0.5,
      }),
    );
    plate.position.set(0, 0.5, -2.16);
    plate.rotation.y = Math.PI;
    g.add(plate);

    // Exhaust flicker
    this.exhausts = [];
    const exMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00e5ff,
      emissiveIntensity: 3,
    });
    for (const x of [-0.55, 0.55]) {
      const ex = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.06), exMat);
      ex.position.set(x, 0.3, -2.16);
      g.add(ex);
      this.exhausts.push(ex);
    }

    // Pink underglow pool on the asphalt
    const glow = new THREE.PointLight(0xff2d78, 60, 15, 2);
    glow.position.set(0, 0.4, -0.5);
    g.add(glow);

    // Cool "hero light" from above-behind so the body reads at night
    const hero = new THREE.PointLight(0xaabbff, 55, 16, 2);
    hero.position.set(0, 4.2, -3.5);
    g.add(hero);

    // Headlight beam
    const beam = new THREE.SpotLight(0xcfefff, 500, 150, 0.45, 0.7, 2);
    beam.position.set(0, 1.2, 1.5);
    beam.target.position.set(0, 0, 60);
    g.add(beam, beam.target);
  }

  _plateTexture() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 32;
    const g = c.getContext("2d");
    g.fillStyle = "#e8e8f0";
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = "#101018";
    g.font = "bold 20px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("ARSHIAMK", 64, 17);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Swap the placeholder body for the generated hero model, keeping the
  // neon overlays in place.
  applyModel(assets) {
    const model = assets.vehicle("hero-car", 4.4);
    if (!model) return;
    for (const part of this.bodyParts) this.group.remove(part);
    this.bodyParts = [];
    this.group.add(model);
  }

  reset() {
    this.speed = 0;
    this.lat = 0;
    this.steer = 0;
  }

  update(input, dt, track) {
    // Longitudinal: throttle tapers with speed, brake and drag oppose it.
    const vRatio = this.speed / CAR.maxSpeed;
    let a = 0;
    if (input.throttle) a += CAR.accel * (1 - vRatio);
    if (input.brake) a -= CAR.brake;
    if (!input.throttle && !input.brake) a -= CAR.coast * (0.3 + vRatio);
    const offroad = Math.abs(this.lat) > CAR.offroadStart;
    if (offroad && this.speed > CAR.offroadMax) a -= CAR.offroadDrag;
    this.speed = clamp(this.speed + a * dt, 0, CAR.maxSpeed);

    // Lateral: smoothed steering, effectiveness grows with speed.
    this.steer = damp(this.steer, input.steer, CAR.steerEase, dt);
    const latVel =
      this.steer *
      CAR.steerSpeed *
      (0.25 + 0.75 * vRatio) *
      Math.min(1, this.speed / 6);
    this.lat = clamp(this.lat + latVel * dt, -CAR.latMax, CAR.latMax);

    this.s += this.speed * dt;

    // Place on the road frame with steering yaw and bank.
    track.posAt(this.s, this.lat, this.group.position);
    this.group.rotation.y = track.yawAt(this.s) + this.steer * 0.14;
    this.group.rotation.x = track.pitchAt(this.s);
    this.group.rotation.z = -this.steer * 0.16;

    // Exhaust flicker scales with speed
    const ex = this.speed > 1 && Math.random() < 0.3 + vRatio * 0.6;
    for (const e of this.exhausts) e.visible = ex;
  }
}

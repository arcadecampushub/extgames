import * as THREE from "three";
import { TRACK, TRAFFIC, GAME } from "./config.js";
import { lerp } from "./math.js";

const BODY_COLORS = [0x2277ff, 0xff8800, 0x22cc88, 0x9944ff, 0xffdd33];

// Traffic cars in road space: hold a lane at a cruise speed below the
// player's top speed, matching a slower car ahead instead of rear-ending
// it. Reports collision and near-miss events against the player.
export class Traffic {
  constructor(scene, track) {
    this.track = track;
    this.cars = [];
    for (let i = 0; i < TRAFFIC.count; i++) {
      const group = this._buildCar(BODY_COLORS[i % BODY_COLORS.length]);
      group.visible = false;
      scene.add(group);
      this.cars.push({
        active: false,
        s: 0,
        lat: 0,
        speed: 0,
        prevDs: 0,
        passed: false,
        group,
        bodyParts: group.userData.bodyParts,
      });
    }
  }

  _buildCar(color) {
    const g = new THREE.Group();
    g.rotation.order = "YXZ";
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.6, 4.4),
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.4,
        roughness: 0.5,
        // Subtle self-glow so cars read at distance in the night scene
        emissive: color,
        emissiveIntensity: 0.35,
      }),
    );
    body.position.y = 0.6;
    g.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 1.9),
      new THREE.MeshStandardMaterial({
        color: 0x0c0c14,
        metalness: 0.8,
        roughness: 0.2,
      }),
    );
    cabin.position.set(0, 1.15, 0.1);
    g.add(cabin);
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.22, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xff2222,
        emissiveIntensity: 3.2,
      }),
    );
    tail.position.set(0, 0.8, -2.2);
    g.add(tail);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xfff7cc,
        emissiveIntensity: 1.8,
      }),
    );
    head.position.set(0, 0.65, 2.2);
    g.add(head);
    g.userData.bodyParts = [body, cabin]; // swapped out when models load
    return g;
  }

  // Swap placeholder bodies for generated traffic models, keeping the
  // emissive light bars that make cars readable at night.
  applyModels(assets) {
    const names = ["traffic-sedan", "traffic-suv", "traffic-taxi", "traffic-van"];
    this.cars.forEach((c, i) => {
      const model = assets.vehicle(names[i % names.length], 4.4);
      if (!model) return;
      for (const part of c.bodyParts) c.group.remove(part);
      c.bodyParts = [];
      c.group.add(model);
    });
  }

  _laneLat(lane) {
    return (lane - (TRACK.laneCount - 1) / 2) * TRACK.laneWidth;
  }

  reset() {
    for (const c of this.cars) {
      c.active = false;
      c.group.visible = false;
    }
  }

  update(dt, player, difficulty, events) {
    const target = Math.round(
      lerp(TRAFFIC.targetMin, TRAFFIC.targetMax, difficulty),
    );
    let active = 0;

    for (const c of this.cars) {
      if (!c.active) continue;

      // Match a slower same-lane car ahead instead of driving through it.
      let ahead = null;
      for (const o of this.cars) {
        if (
          o !== c &&
          o.active &&
          Math.abs(o.lat - c.lat) < 1 &&
          o.s > c.s &&
          (!ahead || o.s < ahead.s)
        ) {
          ahead = o;
        }
      }
      if (ahead && ahead.s - c.s < TRAFFIC.followDist) {
        c.speed = Math.min(c.speed, ahead.speed);
      }

      c.s += c.speed * dt;
      const ds = c.s - player.s;

      if (ds < -TRAFFIC.despawnBehind || ds > TRAFFIC.despawnAhead) {
        c.active = false;
        c.group.visible = false;
        continue;
      }
      active++;

      const dlat = c.lat - player.lat;
      if (
        Math.abs(ds) < TRAFFIC.halfL + 2.15 &&
        Math.abs(dlat) < TRAFFIC.halfW + 0.95
      ) {
        events.collision = true;
      } else if (
        !c.passed &&
        c.prevDs > 0 &&
        ds <= 0 &&
        Math.abs(dlat) < GAME.nearMissLat
      ) {
        events.nearMiss++;
      }
      if (c.prevDs > 0 && ds <= 0) c.passed = true;
      c.prevDs = ds;

      this.track.posAt(c.s, c.lat, c.group.position);
      c.group.rotation.y = this.track.yawAt(c.s);
      c.group.rotation.x = this.track.pitchAt(c.s);
    }

    if (active < target) {
      for (const c of this.cars) {
        if (c.active) continue;
        if (this._spawn(c, player, difficulty)) active++;
        if (active >= target) break;
      }
    }
  }

  // Returns false when the chosen slot is too close to existing traffic;
  // the next frame simply retries.
  _spawn(c, player, difficulty) {
    const lane = (Math.random() * TRACK.laneCount) | 0;
    const lat = this._laneLat(lane);
    const s = player.s + lerp(TRAFFIC.spawnNear, TRAFFIC.spawnFar, Math.random());
    for (const o of this.cars) {
      if (o.active && Math.abs(o.lat - lat) < 1 && Math.abs(o.s - s) < 45) {
        return false;
      }
    }
    c.active = true;
    c.s = s;
    c.lat = lat;
    c.prevDs = s - player.s;
    c.passed = false;
    c.speed =
      lerp(TRAFFIC.speedMin, TRAFFIC.speedMax, Math.random()) +
      difficulty * TRAFFIC.diffSpeedBonus;
    c.group.visible = true;
    return true;
  }
}

import * as THREE from "three";
import { TRACK, SCENERY, COLORS } from "./config.js";
import { hash01 } from "./math.js";

const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();

// Endless highway: an analytic centerline (sum of sines for curve and
// elevation) sampled into a small pool of road-ribbon chunks that are
// recycled ahead of the player. Scenery is instanced and repositioned per
// chunk, with deterministic per-slot randomness so the world is stable.
export class Track {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this._buildMaterials();
    this._buildChunks();
    this._buildScenery();
    this.update(0);
  }

  // --- Centerline ---------------------------------------------------------

  curveX(s) {
    let x = 0;
    for (const [a, f, p] of TRACK.curveParts) x += a * Math.sin(f * s + p);
    return x;
  }

  curveDX(s) {
    let d = 0;
    for (const [a, f, p] of TRACK.curveParts) d += a * f * Math.cos(f * s + p);
    return d;
  }

  elevY(s) {
    let y = 0;
    for (const [a, f, p] of TRACK.hillParts) y += a * Math.sin(f * s + p);
    return y;
  }

  elevDY(s) {
    let d = 0;
    for (const [a, f, p] of TRACK.hillParts) d += a * f * Math.cos(f * s + p);
    return d;
  }

  // World position for road-space coords: s = distance along the road,
  // lat = signed lateral offset (positive = right of travel direction).
  posAt(s, lat, out = new THREE.Vector3()) {
    const dx = this.curveDX(s);
    const inv = 1 / Math.hypot(1, dx);
    out.set(this.curveX(s) + lat * inv, this.elevY(s), s - lat * dx * inv);
    return out;
  }

  yawAt(s) {
    return Math.atan(this.curveDX(s));
  }

  pitchAt(s) {
    return -Math.atan(this.elevDY(s));
  }

  // --- Materials and textures --------------------------------------------

  _buildMaterials() {
    this.matRoad = new THREE.MeshStandardMaterial({
      map: this._roadTexture(),
      roughness: 0.45,
      metalness: 0.15,
    });
    const rumbleTex = this._rumbleTexture();
    this.matRumble = new THREE.MeshStandardMaterial({
      map: rumbleTex,
      emissive: 0xffffff,
      emissiveMap: rumbleTex,
      emissiveIntensity: 1.0,
      roughness: 0.6,
    });
    this.matGround = new THREE.MeshStandardMaterial({
      color: COLORS.ground,
      roughness: 1,
    });
  }

  _roadTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#16161e";
    g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 900; i++) {
      g.fillStyle =
        Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.06)";
      g.fillRect(Math.random() * 256, Math.random() * 512, 2, 2);
    }
    // Solid edge lines and dashed lane boundaries. u spans the full paved
    // width (2 * roadHalf); pixel positions derive from lane geometry.
    const toPx = (lat) => ((lat + TRACK.roadHalf) / (2 * TRACK.roadHalf)) * 256;
    const laneEdge = (TRACK.laneCount * TRACK.laneWidth) / 2;
    g.fillStyle = "#e8e8f4";
    g.fillRect(toPx(-laneEdge) - 2, 0, 4, 512);
    g.fillRect(toPx(laneEdge) - 2, 0, 4, 512);
    for (let i = 1; i < TRACK.laneCount; i++) {
      const x = toPx(-laneEdge + i * TRACK.laneWidth) - 2;
      // 3 m dash, 9 m gap on a 24 m tile (512 px)
      g.fillRect(x, 0, 4, 64);
      g.fillRect(x, 256, 4, 64);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  _rumbleTexture() {
    // One tile = 6 m of road: half neon cyan, half dark.
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#032028";
    g.fillRect(0, 0, 8, 64);
    g.fillStyle = "#00e5ff";
    g.fillRect(0, 0, 8, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _windowTexture() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#07070d";
    g.fillRect(0, 0, 64, 128);
    const palette = ["#00e5ff", "#ff2d78", "#ffd166", "#9bf6ff"];
    for (let y = 6; y < 122; y += 10) {
      for (let x = 4; x < 60; x += 8) {
        if (Math.random() < 0.34) {
          g.fillStyle = palette[(Math.random() * palette.length) | 0];
          g.globalAlpha = 0.55 + Math.random() * 0.45;
          g.fillRect(x, y, 4, 5);
        }
      }
    }
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // --- Road chunks --------------------------------------------------------

  _makeStrip(material) {
    const rows = TRACK.chunkLen / TRACK.step;
    const verts = (rows + 1) * 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(verts * 3), 3),
    );
    geo.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(verts * 2), 2),
    );
    const idx = [];
    for (let r = 0; r < rows; r++) {
      const a = r * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    material.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false; // bounds change on every recycle
    this.scene.add(mesh);
    return mesh;
  }

  _fillStrip(mesh, s0, latA, latB, vScale) {
    const rows = TRACK.chunkLen / TRACK.step;
    const pos = mesh.geometry.attributes.position;
    const uv = mesh.geometry.attributes.uv;
    for (let r = 0; r <= rows; r++) {
      const s = s0 + r * TRACK.step;
      this.posAt(s, latA, _p);
      pos.setXYZ(r * 2, _p.x, _p.y, _p.z);
      this.posAt(s, latB, _p);
      pos.setXYZ(r * 2 + 1, _p.x, _p.y, _p.z);
      const v = s / vScale;
      uv.setXY(r * 2, 0, v);
      uv.setXY(r * 2 + 1, 1, v);
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  _buildChunks() {
    for (let i = 0; i < TRACK.numChunks; i++) {
      this.chunks.push({
        idx: null,
        road: this._makeStrip(this.matRoad),
        rumbleL: this._makeStrip(this.matRumble),
        rumbleR: this._makeStrip(this.matRumble),
        groundL: this._makeStrip(this.matGround),
        groundR: this._makeStrip(this.matGround),
      });
    }
  }

  _rebuildChunk(chunk, chunkIdx, poolSlot) {
    chunk.idx = chunkIdx;
    const s0 = chunkIdx * TRACK.chunkLen;
    const T = TRACK;
    this._fillStrip(chunk.road, s0, -T.roadHalf, T.roadHalf, T.textureRepeat);
    this._fillStrip(chunk.rumbleL, s0, -T.rumbleOuter, -T.roadHalf, 6);
    this._fillStrip(chunk.rumbleR, s0, T.roadHalf, T.rumbleOuter, 6);
    this._fillStrip(
      chunk.groundL,
      s0,
      -T.rumbleOuter - T.grassWidth,
      -T.rumbleOuter,
      50,
    );
    this._fillStrip(
      chunk.groundR,
      s0,
      T.rumbleOuter,
      T.rumbleOuter + T.grassWidth,
      50,
    );
    this._placeScenery(chunkIdx, poolSlot);
  }

  // --- Scenery ------------------------------------------------------------

  _buildScenery() {
    this.bPerChunk = 2 * (TRACK.chunkLen / SCENERY.buildingSpacing);
    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    bGeo.translate(0, 0.5, 0); // origin at base so scale.y = height
    const winTex = this._windowTexture();
    const bMat = new THREE.MeshStandardMaterial({
      map: winTex,
      emissive: 0xffffff,
      emissiveMap: winTex,
      emissiveIntensity: 1.15,
      roughness: 0.9,
    });
    this.buildings = new THREE.InstancedMesh(
      bGeo,
      bMat,
      this.bPerChunk * TRACK.numChunks,
    );
    this.buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.buildings.frustumCulled = false;
    this.scene.add(this.buildings);

    this.lPerChunk = TRACK.chunkLen / SCENERY.lightSpacing;
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.11, 6, 6);
    poleGeo.translate(0, 3, 0);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x30303a,
      roughness: 0.7,
      metalness: 0.6,
    });
    this.poles = new THREE.InstancedMesh(
      poleGeo,
      poleMat,
      this.lPerChunk * TRACK.numChunks,
    );
    this.poles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.poles.frustumCulled = false;
    this.scene.add(this.poles);

    const headGeo = new THREE.BoxGeometry(1.4, 0.12, 0.35);
    headGeo.translate(0, 6, 0);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xbfefff });
    this.heads = new THREE.InstancedMesh(
      headGeo,
      headMat,
      this.lPerChunk * TRACK.numChunks,
    );
    this.heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heads.frustumCulled = false;
    this.scene.add(this.heads);
  }

  _placeScenery(chunkIdx, poolSlot) {
    const s0 = chunkIdx * TRACK.chunkLen;

    // Buildings: deterministic size/position per global slot id.
    const spacing = SCENERY.buildingSpacing;
    const perSide = TRACK.chunkLen / spacing;
    let inst = poolSlot * this.bPerChunk;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < perSide; i++) {
        const s = s0 + (i + 0.5) * spacing;
        const slotId = Math.floor(s / spacing) * 2 + (side + 1) / 2;
        const r1 = hash01(slotId * 4 + 1);
        const r2 = hash01(slotId * 4 + 2);
        const r3 = hash01(slotId * 4 + 3);
        const r4 = hash01(slotId * 4 + 4);
        if (r1 < SCENERY.buildingGapChance) {
          _p.set(0, -500, 0);
          _s.set(0.001, 0.001, 0.001);
          _q.identity();
        } else {
          const w = 9 + r2 * 10;
          const d = 9 + r3 * 8;
          const h = 12 + r4 * r4 * 55;
          const lat =
            side *
            (SCENERY.buildingMinLat +
              r2 * (SCENERY.buildingMaxLat - SCENERY.buildingMinLat) +
              w / 2);
          this.posAt(s, lat, _p);
          _p.y -= 3; // embed the base so hills never expose it
          _q.setFromAxisAngle(UP, this.yawAt(s) + (r3 - 0.5) * 0.3);
          _s.set(w, h, d);
        }
        _m.compose(_p, _q, _s);
        this.buildings.setMatrixAt(inst, _m);
        inst++;
      }
    }
    this.buildings.instanceMatrix.needsUpdate = true;

    // Streetlights: alternating sides.
    let li = poolSlot * this.lPerChunk;
    _s.set(1, 1, 1);
    for (let i = 0; i < this.lPerChunk; i++) {
      const s = s0 + (i + 0.5) * SCENERY.lightSpacing;
      const slot = Math.floor(s / SCENERY.lightSpacing);
      const side = slot % 2 === 0 ? -1 : 1;
      this.posAt(s, side * SCENERY.lightLat, _p);
      _q.setFromAxisAngle(UP, this.yawAt(s));
      _m.compose(_p, _q, _s);
      this.poles.setMatrixAt(li, _m);
      this.heads.setMatrixAt(li, _m);
      li++;
    }
    this.poles.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
  }

  // --- Generated landmarks ------------------------------------------------

  // Pools of generated set-pieces (skyline landmarks and sign gantries)
  // recycled along the road among the instanced procedural filler.
  setAssets(assets) {
    const names = ["building-tower", "building-block", "building-pagoda"];
    this.landmarks = [];
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    for (let i = 0; i < 4; i++) {
      const obj = assets.building(names[i % names.length], 52 + (i % 3) * 9);
      if (!obj) continue;
      obj.visible = false;
      obj.userData.id = null;
      // Widest horizontal extent, so placement can keep it off the road.
      box.setFromObject(obj);
      box.getSize(size);
      obj.userData.halfW = Math.max(size.x, size.z) / 2;
      this.scene.add(obj);
      this.landmarks.push(obj);
    }
    this.gantries = [];
    for (let i = 0; i < 2; i++) {
      const obj = assets.span("prop-gantry", 26);
      if (!obj) continue;
      obj.visible = false;
      obj.userData.id = null;
      this.scene.add(obj);
      this.gantries.push(obj);
    }
  }

  _updateLandmarks(playerS) {
    const n = this.landmarks ? this.landmarks.length : 0;
    if (n) {
      const SP = 450;
      const first = Math.floor(playerS / SP);
      for (let k = 0; k < n; k++) {
        const id = first + k;
        const obj = this.landmarks[((id % n) + n) % n];
        if (obj.userData.id === id) continue;
        obj.userData.id = id;
        const r = hash01(id * 13 + 5);
        if (r < 0.3) {
          obj.visible = false; // deterministic gaps
          continue;
        }
        obj.visible = true;
        const side = r > 0.65 ? 1 : -1;
        const s = id * SP + SP / 2;
        const lat =
          side * (20 + obj.userData.halfW + hash01(id * 13 + 6) * 14);
        this.posAt(s, lat, obj.position);
        obj.position.y -= 1.5;
        obj.rotation.y = this.yawAt(s) + (hash01(id * 13 + 7) - 0.5) * 0.5;
      }
    }
    const gn = this.gantries ? this.gantries.length : 0;
    if (gn) {
      const SP = 700;
      const first = Math.floor(playerS / SP);
      for (let k = 0; k < gn; k++) {
        const id = first + k;
        const obj = this.gantries[((id % gn) + gn) % gn];
        if (obj.userData.id === id) continue;
        obj.userData.id = id;
        const s = id * SP + 350;
        this.posAt(s, 0, obj.position);
        obj.rotation.y = this.yawAt(s);
        obj.visible = true;
      }
    }
  }

  // --- Per-frame ----------------------------------------------------------

  // Keep the chunk pool covering [player - 1 chunk, player + N-1 chunks].
  // Pool slot for chunk index i is i mod N, so each slot never reshuffles.
  update(playerS) {
    const N = TRACK.numChunks;
    const firstIdx = Math.floor(playerS / TRACK.chunkLen) - 1;
    for (let k = 0; k < N; k++) {
      const want = firstIdx + k;
      const poolSlot = ((want % N) + N) % N;
      const chunk = this.chunks[poolSlot];
      if (chunk.idx !== want) this._rebuildChunk(chunk, want, poolSlot);
    }
    this._updateLandmarks(playerS);
  }
}

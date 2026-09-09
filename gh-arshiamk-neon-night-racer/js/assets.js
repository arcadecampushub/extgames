import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

// Loads the generated GLB models listed in assets/models/manifest.json.
// Every consumer keeps working with its primitive placeholder when a model
// is missing or fails to load, so the game never blocks on assets.
export class Assets {
  constructor() {
    this.models = new Map();
    const draco = new DRACOLoader().setDecoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/",
    );
    this.loader = new GLTFLoader().setDRACOLoader(draco);
  }

  async load() {
    let manifest;
    try {
      const res = await fetch("assets/models/manifest.json");
      if (!res.ok) return; // nothing generated yet — placeholders only
      manifest = await res.json();
    } catch {
      return;
    }
    const entries = Object.entries(manifest).filter(([, e]) => e.file);
    await Promise.all(
      entries.map(async ([name, e]) => {
        try {
          const gltf = await this.loader.loadAsync(`assets/models/${e.file}`);
          // Night scene is dim: let baked emissive surfaces actually glow
          // (they feed the bloom pass) and cap glossiness.
          gltf.scene.traverse((o) => {
            if (o.isMesh && o.material) {
              if (o.material.emissiveMap) {
                o.material.emissiveIntensity = Math.max(
                  o.material.emissiveIntensity ?? 1,
                  1.6,
                );
              }
              if (o.material.roughness !== undefined) {
                o.material.roughness = Math.min(o.material.roughness, 0.85);
              }
            }
          });
          this.models.set(name, gltf.scene);
        } catch (err) {
          console.warn(`asset "${name}" failed to load, using placeholder`, err);
        }
      }),
    );
  }

  has(name) {
    return this.models.has(name);
  }

  // Clone normalized so the longest horizontal axis runs along +z with the
  // given length, grounded at y = 0 and centered. Used for vehicles.
  vehicle(name, length, yawOffset = 0) {
    const obj = this._clone(name);
    if (!obj) return null;
    _box.setFromObject(obj);
    _box.getSize(_size);
    if (_size.x > _size.z) obj.rotation.y = Math.PI / 2; // side-facing export
    if (yawOffset) obj.rotation.y += yawOffset;
    return this._fit(obj, length, "z");
  }

  // Clone normalized to a target height, grounded and centered.
  building(name, height) {
    const obj = this._clone(name);
    if (!obj) return null;
    return this._fit(obj, height, "y");
  }

  // Clone normalized so its longest horizontal axis spans `width` along x
  // (for structures that stretch across the road, like the sign gantry).
  span(name, width) {
    const obj = this._clone(name);
    if (!obj) return null;
    _box.setFromObject(obj);
    _box.getSize(_size);
    if (_size.z > _size.x) obj.rotation.y = Math.PI / 2;
    return this._fit(obj, width, "x");
  }

  _clone(name) {
    const src = this.models.get(name);
    return src ? src.clone(true) : null;
  }

  _fit(obj, target, axis) {
    const group = new THREE.Group();
    group.add(obj);
    _box.setFromObject(obj);
    _box.getSize(_size);
    const scale = target / Math.max(_size[axis], 0.001);
    obj.scale.setScalar(scale);
    _box.setFromObject(obj);
    _box.getCenter(_center);
    obj.position.x -= _center.x;
    obj.position.z -= _center.z;
    obj.position.y -= _box.min.y;
    return group;
  }
}

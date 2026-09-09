export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export const lerp = (a, b, t) => a + (b - a) * t;

// Frame-rate independent smoothing toward a target.
export const damp = (cur, target, rate, dt) =>
  lerp(cur, target, 1 - Math.exp(-rate * dt));

// Deterministic pseudo-random in [0,1) from an integer id, so recycled
// scenery reappears identically at the same track position.
export function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

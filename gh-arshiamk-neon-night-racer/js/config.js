// All gameplay and rendering tuning in one place. Values are the starting
// points from the design spec and are expected to shift during play-testing.

export const TRACK = {
  chunkLen: 120, // meters of road per recycled chunk
  numChunks: 8, // pool size; total coverage = chunkLen * numChunks
  step: 3, // meters between road cross-sections
  laneCount: 3,
  laneWidth: 3.7,
  shoulder: 1.5, // paved width beyond the outer lane lines
  rumbleWidth: 1.1,
  grassWidth: 40, // dark ground ribbon beyond the rumble strip
  textureRepeat: 24, // meters of road per asphalt texture tile
  // Centerline shape: [amplitude, frequency, phase] sine components of
  // lateral offset x(s) and elevation y(s). Gentle highway curves/hills.
  curveParts: [
    [45, 0.0025, 0],
    [25, 0.00113, 1.7],
    [12, 0.006, 3.1],
  ],
  hillParts: [
    [10, 0.003, 0],
    [4, 0.0011, 0.9],
  ],
};
TRACK.roadHalf = (TRACK.laneCount * TRACK.laneWidth) / 2 + TRACK.shoulder;
TRACK.rumbleOuter = TRACK.roadHalf + TRACK.rumbleWidth;

export const SCENERY = {
  buildingSpacing: 24, // one building slot every N meters per side
  buildingGapChance: 0.18,
  buildingMinLat: 16,
  buildingMaxLat: 34,
  lightSpacing: 30, // streetlight slot spacing (alternating sides)
  lightLat: TRACK.rumbleOuter + 1.2,
};

export const CAR = {
  maxSpeed: 72, // m/s (~260 km/h)
  accel: 26, // full-throttle accel at standstill, tapering to 0 at maxSpeed
  brake: 45,
  coast: 6, // drag while coasting, scaled by speed ratio
  offroadDrag: 32,
  offroadMax: 22, // speed cap enforced while off the asphalt
  offroadStart: TRACK.rumbleOuter, // |lat| beyond this counts as off-road
  latMax: 15, // hard clamp on lateral position
  steerSpeed: 15, // max lateral m/s at full speed
  steerEase: 9, // steering input smoothing rate
};

export const CAMERA = {
  back: 11.5, // meters behind the car
  height: 4.6,
  lookAhead: 20,
  fovBase: 66,
  fovMax: 80,
};

export const RENDER = {
  fogNear: 90,
  fogFar: 820,
  maxPixelRatio: 2,
  bloomStrength: 0.9,
  bloomRadius: 0.55,
  bloomThreshold: 0.62,
  exposure: 1.15,
};

export const TRAFFIC = {
  count: 14, // pool size
  targetMin: 4, // active cars at difficulty 0
  targetMax: 10, // active cars at difficulty 1
  spawnNear: 380, // spawn window ahead of the player (meters)
  spawnFar: 520,
  despawnBehind: 40,
  despawnAhead: 620,
  speedMin: 17, // m/s cruise band
  speedMax: 28,
  diffSpeedBonus: 8, // extra cruise speed at full difficulty
  followDist: 15, // match speed of a same-lane car closer than this
  halfW: 0.95,
  halfL: 2.3,
};

export const GAME = {
  startTime: 60, // seconds
  checkpointEvery: 1000, // meters
  checkpointBonus: 20, // seconds granted at difficulty 0...
  checkpointBonusMin: 9, // ...ramping down to this at difficulty 1
  nearMissLat: 3.2, // max |dlat| that still counts as a near-miss (~1.3 m clearance)
  nearMissPoints: 100,
  comboMax: 10,
  comboWindow: 5, // seconds without a near-miss before the combo decays
  pointsPerMeter: 1,
  collisionSpeedCut: 0.4, // speed multiplier applied on impact
  invulnTime: 1.2, // seconds of post-collision grace
  difficultyRampDist: 8000, // meters to reach full difficulty
};

export const COLORS = {
  sky: 0x07071a,
  fog: 0x0a0a22,
  ground: 0x0a0a16,
  carBody: 0xff0055,
  tail: 0xff2255,
  headlight: 0xbfefff,
};

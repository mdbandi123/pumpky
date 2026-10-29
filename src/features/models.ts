/* eslint-disable @typescript-eslint/no-require-imports -- Metro needs static require calls for GLB assets. */
import basketDimensions from './basket-dimensions.json';

export const creatureModels = {
  pumpkin: require('../../assets/models/pumpkin.glb'),
  ghost: require('../../assets/models/ghost.glb'),
  monster: require('../../assets/models/monster.glb'),
};

// Metres, +Y up and +Z forward. Height excludes the real basket handle.
// Width/depth are photo-based estimates; the full printed badge remains 80 mm wide.
export const basketFrontOffset = basketDimensions.bodyDepth * basketDimensions.coverageScale / 2;
export const markerWidth = 0.08;

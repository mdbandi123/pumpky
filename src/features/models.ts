/* eslint-disable @typescript-eslint/no-require-imports -- Metro needs static require calls for GLB assets. */
export const creatureModels = {
  pumpkin: require('../../assets/models/pumpkin.glb'),
  ghost: require('../../assets/models/ghost.glb'),
  monster: require('../../assets/models/monster.glb'),
};

// Models use metres, +Y up and +Z forward, with the cup centred at its origin.
export const cupFrontOffset = 0.05;
export const markerWidth = 0.08;

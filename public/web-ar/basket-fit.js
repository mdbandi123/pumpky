// Shared by the screen, native renderer, browser renderer, and transform tests.
export const defaultCalibration = {
  width: 1, height: 1, depth: 1,
  offsetX: 0, offsetY: 0, offsetZ: 0,
  pitch: 0, yaw: 0, roll: 0,
};
export const calibrationLimits = {
  width: [0.5, 2, 0.05], height: [0.5, 2, 0.05], depth: [0.5, 2, 0.05],
  offsetX: [-0.1, 0.1, 0.005], offsetY: [-0.1, 0.1, 0.005], offsetZ: [-0.1, 0.1, 0.005],
  pitch: [-180, 180, 5], yaw: [-180, 180, 5], roll: [-180, 180, 5],
};

/** @param {unknown} value */
export function normalizeCalibration(value) {
  const result = { ...defaultCalibration };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const key of Object.keys(result)) {
    const number = value[key];
    const [min, max] = calibrationLimits[key];
    if (typeof number === 'number' && Number.isFinite(number)) result[key] = Math.min(max, Math.max(min, number));
  }
  return result;
}

/**
 * Position is in the marker frame, before model rotation. Depth correction keeps
 * the front surface near the badge when the basket is made deeper.
 * @param {number} scale
 * @param {unknown} calibration
 * @param {number} frontOffset
 * @param {number} [unitsPerMetre]
 */
export function basketTransform(scale, calibration, frontOffset, unitsPerMetre = 1) {
  const fit = normalizeCalibration(calibration);
  const size = Number.isFinite(scale) ? Math.min(2, Math.max(0.5, scale)) : 1;
  return {
    scale: [size * fit.width * unitsPerMetre, size * fit.height * unitsPerMetre, size * fit.depth * unitsPerMetre],
    position: [fit.offsetX * unitsPerMetre, fit.offsetY * unitsPerMetre,
      (fit.offsetZ - frontOffset * size * fit.depth) * unitsPerMetre],
    rotation: [fit.pitch, fit.yaw, fit.roll],
  };
}

import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { defaultCalibration, normalizeCalibration } from '../../public/web-ar/basket-fit';

export type BasketCalibration = typeof defaultCalibration;
const storageKey = 'pumpky-basket-fit-v1';
const initialFit = { scale: 1, calibration: { ...defaultCalibration } };
let snapshot = initialFit;
let initialized = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (!initialized) {
    initialized = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) snapshot = {
          calibration: normalizeCalibration(saved.calibration),
          scale: typeof saved.scale === 'number' && Number.isFinite(saved.scale)
            ? Math.min(2, Math.max(0.5, saved.scale)) : 1,
        };
      } catch { /* Keep controls usable when storage is unavailable or invalid. */ }
    }
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function update(next: typeof initialFit) {
  snapshot = next;
  if (Platform.OS === 'web') {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { /* Private/blocked storage still permits in-memory calibration. */ }
  }
  listeners.forEach((listener) => listener());
}

export function useBasketFit() {
  const fit = useSyncExternalStore(subscribe, getSnapshot, () => initialFit);
  return {
    ...fit,
    setScale: (scale: number) => update({ ...snapshot, scale: Math.min(2, Math.max(0.5, scale)) }),
    setCalibration: (calibration: BasketCalibration) => update({ ...snapshot, calibration: normalizeCalibration(calibration) }),
    resetFit: () => update({ scale: 1, calibration: { ...defaultCalibration } }),
  };
}

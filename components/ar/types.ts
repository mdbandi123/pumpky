import type { Ref } from 'react';

import type { BasketStyleId } from '../../src/features/styles';
import type { BasketCalibration } from '../../src/features/use-basket-fit';
import type { TrackingState } from '../tracking-status';

export type ARHandle = {
  capture: () => Promise<string>;
  reset: () => void;
};
export type ARViewProps = {
  ref?: Ref<ARHandle>;
  design: BasketStyleId;
  scale: number;
  calibration?: BasketCalibration;
  active: boolean;
  /** Explicit web-camera opt-in, separate from temporary focus/preview pauses. */
  cameraEnabled?: boolean;
  onStatus: (state: TrackingState) => void;
  onTargetChange?: (target: 'basket' | 'statue' | null) => void;
};

import type { Ref } from 'react';

import type { BasketStyleId } from '../../src/features/styles';
import type { TrackingState } from '../tracking-status';

export type ARHandle = {
  capture: () => Promise<string>;
  reset: () => void;
};
export type ARViewProps = {
  ref?: Ref<ARHandle>;
  design: BasketStyleId;
  scale: number;
  active: boolean;
  onStatus: (state: TrackingState) => void;
};

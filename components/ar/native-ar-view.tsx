import {
  ViroAmbientLight, ViroARImageMarker, ViroARScene, ViroARSceneNavigator,
  ViroARTrackingTargets, Viro3DObject, ViroDirectionalLight, ViroNode, ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import { createContext, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BasketStyleId } from '../../src/features/styles';
import type { BasketCalibration } from '../../src/features/use-basket-fit';
import { basketTransform } from '../../public/web-ar/basket-fit';
import { creatureModels, basketFrontOffset, markerWidth } from '../../src/features/models';
import type { ARViewProps } from './types';

ViroARTrackingTargets.createTargets({
  pumpky: { source: require('../../assets/markers/pumpky-badge.png'), orientation: 'Up', physicalWidth: markerWidth },
});
type SceneSettings = Pick<ARViewProps, 'design' | 'scale' | 'calibration' | 'onStatus'>;
const SceneContext = createContext<SceneSettings | null>(null);

function BasketScene() {
  const settings = useContext(SceneContext);
  if (!settings) throw new Error('BasketScene needs SceneContext.');
  const { design, scale, calibration, onStatus } = settings;
  const [visible, setVisible] = useState(false);
  const markerVisible = useRef(false);
  const report = (tracked: boolean) => {
    markerVisible.current = tracked;
    setVisible(tracked);
    onStatus(tracked ? 'tracking' : 'lost');
  };
  return <ViroARScene onTrackingUpdated={(state) => {
    if (state !== ViroTrackingStateConstants.TRACKING_NORMAL) {
      markerVisible.current = false;
      setVisible(false);
      onStatus('searching');
    }
    else if (markerVisible.current) { setVisible(true); onStatus('tracking'); }
    else onStatus('searching');
  }}>
    <ViroAmbientLight color="#e5e5ff" intensity={350} />
    <ViroDirectionalLight color="#fff0dc" intensity={650} direction={[-0.5, -1, -0.8]} />
    <ViroARImageMarker target="pumpky" onAnchorFound={() => report(true)}
      onAnchorRemoved={() => report(false)}
      onAnchorUpdated={(anchor) => {
        report(!anchor.trackingMethod || anchor.trackingMethod === 'tracking' || anchor.trackingMethod === 'FULL_TRACKING');
      }}>
      <ViroNode visible={visible} rotation={[-90, 0, 0]}>
        <BasketShell design={design} scale={scale} calibration={calibration} />
      </ViroNode>
    </ViroARImageMarker>
  </ViroARScene>;
}

function BasketShell({ design, scale, calibration }: { design: BasketStyleId; scale: number; calibration?: BasketCalibration }) {
  const transform = basketTransform(scale, calibration, basketFrontOffset);
  return <ViroNode position={transform.position as [number, number, number]}
    rotation={transform.rotation as [number, number, number]} scale={transform.scale as [number, number, number]}>
    <Viro3DObject key={design} source={creatureModels[design]} type="GLB" />
  </ViroNode>;
}

export function NativeARView({ ref, design, scale, calibration, active, onStatus }: ARViewProps) {
  const navigator = useRef<ViroARSceneNavigator>(null);
  useEffect(() => { onStatus(active ? 'searching' : 'starting'); }, [active, onStatus]);
  useImperativeHandle(ref, () => ({
    async capture() {
      if (!navigator.current || !active) throw new Error('The AR camera is not ready.');
      const result = await navigator.current.arSceneNavigator.takeScreenshot(`pumpky-${Date.now()}`, false);
      if (!result.success || !result.url) throw new Error('The photo could not be captured. Please try again.');
      return result.url.startsWith('file://') ? result.url : `file://${result.url}`;
    },
    reset() {
      navigator.current?.arSceneNavigator.resetARSession(true, true);
      onStatus('searching');
    },
  }), [active, onStatus]);
  return <View style={styles.container}>
    {active && <SceneContext.Provider value={{ design, scale, calibration, onStatus }}><ViroARSceneNavigator ref={navigator} style={styles.container} autofocus hdrEnabled
      provider="none" numberOfTrackedImages={1} initialScene={{ scene: BasketScene }}
      /></SceneContext.Provider>}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1 } });

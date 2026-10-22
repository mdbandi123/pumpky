import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CreatureArt } from '../creature-art';
import { palette } from '../theme';
import type { ARViewProps } from './types';

export function DesignPreview({ design, scale, onStatus }: ARViewProps) {
  useEffect(() => { onStatus('unavailable'); }, [onStatus]);
  return <View style={styles.container}>
    <View style={styles.glow} />
    <View style={styles.orbit} />
    <View style={styles.orbitSmall} />
    <Text style={[styles.star, styles.starOne]}>✧</Text>
    <Text style={[styles.star, styles.starTwo]}>+</Text>
    <Text style={[styles.star, styles.starThree]}>✧</Text>
    <View style={styles.stage}>
      <CreatureArt design={design} style={[styles.art, { transform: [{ scale: Math.min(1.15, Math.max(0.65, scale)) }] }]} />
    </View>
    <View style={styles.note}>
      <Text style={styles.previewLabel}>DESIGN PREVIEW</Text>
      <Text style={styles.previewDetail}>Your basket’s next alter ego.</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#282130' },
  glow: { position: 'absolute', width: 310, height: 310, borderRadius: 160, backgroundColor: '#362a3f' },
  orbit: { position: 'absolute', width: 270, height: 270, borderRadius: 140, borderWidth: 1, borderColor: '#63516b55' },
  orbitSmall: { position: 'absolute', width: 210, height: 210, borderRadius: 110, borderWidth: 1, borderColor: '#63516b44' },
  stage: { width: '100%', height: '85%', maxHeight: 360, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  art: { width: '100%', height: '100%' },
  star: { position: 'absolute', color: '#ceb6d1', fontSize: 25 },
  starOne: { top: '22%', left: '15%' },
  starTwo: { bottom: '32%', right: '13%', fontSize: 18 },
  starThree: { top: '32%', right: '18%', fontSize: 14 },
  note: { position: 'absolute', bottom: 52, alignItems: 'center', gap: 5 },
  previewLabel: { color: palette.accent, fontSize: 8, letterSpacing: 2.3, fontWeight: '700' },
  previewDetail: { color: '#d6c5dd', fontSize: 11 },
});

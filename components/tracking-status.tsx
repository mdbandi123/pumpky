import { StyleSheet, Text, View } from 'react-native';

import { palette } from './theme';

export type TrackingState = 'starting' | 'permission' | 'searching' | 'tracking' | 'lost' | 'unavailable';
const labels: Record<TrackingState, string> = {
  starting: 'Starting camera…', searching: 'Point at your Pumpky badge',
  permission: 'Allow camera access to start',
  tracking: 'Badge found · hold steady', lost: 'Badge lost · bring it back into view',
  unavailable: 'AR needs an iPhone development build',
};

export function TrackingStatus({ state }: { state: TrackingState }) {
  return (
    <View style={styles.pill} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: state === 'tracking' ? palette.accent : palette.warning }]} />
      <Text style={styles.text}>{labels[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20,
    backgroundColor: '#10110fe6', paddingVertical: 10, paddingHorizontal: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { color: palette.text, fontSize: 12, flexShrink: 1 },
});

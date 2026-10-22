import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BasketStyle } from '../src/features/styles';
import { CreatureArt } from './creature-art';
import { palette } from './theme';

export function StyleCard({ design, selected, onPress }: {
  design: BasketStyle; selected: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={`${design.name}, ${design.subtitle}`}
    accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
    <View style={[styles.preview, { backgroundColor: design.color + '16' }, selected && styles.selected]}>
      <CreatureArt design={design.id} style={styles.art} />
      {selected && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
    </View>
    <Text style={[styles.name, selected && styles.selectedName]}>{design.name}</Text>
    <Text style={styles.subtitle}>{design.subtitle}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { width: 104, gap: 4 },
  preview: { height: 88, borderRadius: 18, borderWidth: 1, borderColor: palette.line,
    alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: palette.accent, borderWidth: 2 },
  art: { width: 95, height: 90 },
  check: { position: 'absolute', bottom: 6, right: 6, width: 17, height: 17,
    borderRadius: 9, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  name: { color: palette.text, fontWeight: '600', fontSize: 13, textAlign: 'center', marginTop: 3 },
  selectedName: { color: palette.accent },
  subtitle: { color: palette.muted, fontSize: 10, textAlign: 'center' },
});

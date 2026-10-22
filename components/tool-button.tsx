import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from './theme';

export function ToolButton({ symbol, label, disabled, onPress }: {
  symbol: string; label: string; disabled?: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={styles.symbol} accessible={false}>{symbol}</Text>
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minWidth: 64, minHeight: 64, gap: 4, alignItems: 'center', justifyContent: 'center' },
  symbol: { color: palette.text, fontSize: 27, lineHeight: 30 },
  label: { color: palette.muted, fontSize: 11 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.3 },
});

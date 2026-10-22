import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { palette } from './theme';

export function ShutterButton({ disabled, loading, onPress }: {
  disabled: boolean; loading: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Capture basket photo"
    accessibilityHint={disabled ? 'Find the tracking badge with your camera first' : 'Take a photo of your basket design'}
    accessibilityState={{ disabled: disabled || loading, busy: loading }}
    disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.ring, disabled && styles.disabled, pressed && styles.pressed]}>
    <View style={styles.inner}>{loading && <ActivityIndicator color={palette.ink} />}</View>
  </Pressable>;
}

const styles = StyleSheet.create({
  ring: { width: 76, height: 76, padding: 5, borderWidth: 2, borderColor: palette.accent,
    borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  inner: { width: '100%', height: '100%', borderRadius: 34, backgroundColor: palette.accent,
    alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.94 }] },
});

import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { palette } from './theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'compact';
  loading?: boolean;
};

export function Button({ label, variant = 'primary', size = 'default', loading = false, disabled, style, hitSlop, ...props }: ButtonProps) {
  const inactive = disabled || loading;
  const color = variant === 'primary' ? palette.ink : palette.text;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      hitSlop={hitSlop ?? (size === 'compact' ? 4 : undefined)}
      style={(state) => [styles.base, styles[variant], size === 'compact' && styles.compact, state.pressed && styles.pressed,
        inactive && styles.disabled, typeof style === 'function' ? style(state) : style]}>
      {loading && <ActivityIndicator color={color} size="small" />}
      <Text style={[styles.label, size === 'compact' && styles.compactLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1 },
  primary: { backgroundColor: palette.accent, borderColor: palette.accent },
  secondary: { backgroundColor: palette.panel, borderColor: palette.line },
  label: { fontSize: 15, fontWeight: '700' },
  compact: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  compactLabel: { fontSize: 12 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});

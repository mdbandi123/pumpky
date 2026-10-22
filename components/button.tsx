import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { palette } from './theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...props }: ButtonProps) {
  const inactive = disabled || loading;
  const color = variant === 'primary' ? palette.ink : palette.text;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={(state) => [styles.base, styles[variant], state.pressed && styles.pressed,
        inactive && styles.disabled, typeof style === 'function' ? style(state) : style]}>
      {loading && <ActivityIndicator color={color} size="small" />}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1 },
  primary: { backgroundColor: palette.accent, borderColor: palette.accent },
  secondary: { backgroundColor: palette.panel, borderColor: palette.line },
  label: { fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});

import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { calibrationLimits, normalizeCalibration } from '../public/web-ar/basket-fit';
import type { BasketCalibration } from '../src/features/use-basket-fit';
import { Button } from './button';
import { palette } from './theme';

const groups = {
  Shape: [['width', 'Width'], ['height', 'Height'], ['depth', 'Depth']],
  Position: [['offsetX', 'Left / right'], ['offsetY', 'Up / down'], ['offsetZ', 'Back / forward']],
  Angle: [['yaw', 'Turn'], ['pitch', 'Tilt'], ['roll', 'Lean']],
} as const;

export function BasketFitControls({ scale, calibration, onScaleChange, onChange, onReset, onClose, disabled }: {
  scale: number; calibration: BasketCalibration;
  onScaleChange: (scale: number) => void; onChange: (fit: BasketCalibration) => void;
  onReset: () => void; onClose: () => void; disabled: boolean;
}) {
  const [group, setGroup] = useState<keyof typeof groups>('Shape');
  return <View style={styles.panel} testID="basket-fit-controls">
    <View style={styles.header}><Text style={styles.title}>Match your basket</Text>
      <Button label="Done" size="compact" variant="secondary" onPress={onClose} /></View>
    <View style={styles.tabs}>
      {(Object.keys(groups) as (keyof typeof groups)[]).map((tab) => <Button key={tab} label={tab} size="compact"
        variant={tab === group ? 'primary' : 'secondary'} onPress={() => setGroup(tab)} />)}
    </View>
    <Text style={styles.hint}>{group === 'Shape' ? 'Adjust the outline first. Width and depth do not need to match.'
      : group === 'Position' ? 'Shift relative to the badge. Forward moves the shell toward the camera.'
        : 'Turn rotates left/right. Tilt corrects a sloping badge. Lean straightens the rim.'}</Text>
    {group === 'Shape' && <Adjustment label="Overall size" value={`${Math.round(scale * 100)}%`}
      decreaseDisabled={disabled || scale <= 0.5} increaseDisabled={disabled || scale >= 2}
      onDecrease={() => onScaleChange(Math.max(0.5, Math.round((scale - 0.05) * 100) / 100))}
      onIncrease={() => onScaleChange(Math.min(2, Math.round((scale + 0.05) * 100) / 100))} />}
    {groups[group].map(([key, label]) => {
      const [min, max, step] = calibrationLimits[key];
      const value = calibration[key];
      const display = group === 'Shape' ? `${Math.round(value * 100)}%`
        : group === 'Position' ? `${Math.round(value * 1000)} mm` : `${value}°`;
      const change = (direction: number) => onChange(normalizeCalibration({ ...calibration,
        [key]: Math.round((value + direction * step) * 10000) / 10000 }));
      return <Adjustment key={key} label={label} value={display}
        decreaseDisabled={disabled || value <= min} increaseDisabled={disabled || value >= max}
        onDecrease={() => change(-1)} onIncrease={() => change(1)} />;
    })}
    <View style={styles.footer}><Text style={styles.saved}>{Platform.OS === 'web'
      ? 'One fit for all creatures · saved in this browser' : 'One fit for all creatures · this session'}</Text>
      <Button label="Reset fit" size="compact" variant="secondary" disabled={disabled} onPress={onReset} /></View>
  </View>;
}

function Adjustment({ label, value, onDecrease, onIncrease, decreaseDisabled, increaseDisabled }: {
  label: string; value: string; onDecrease: () => void; onIncrease: () => void;
  decreaseDisabled: boolean; increaseDisabled: boolean;
}) {
  return <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Button label="−" size="compact" variant="secondary" accessibilityLabel={`Decrease ${label}`}
      disabled={decreaseDisabled} onPress={onDecrease} />
    <Text style={styles.value} accessibilityLiveRegion="polite">{value}</Text>
    <Button label="+" size="compact" variant="secondary" accessibilityLabel={`Increase ${label}`}
      disabled={increaseDisabled} onPress={onIncrease} />
  </View>;
}

const styles = StyleSheet.create({
  panel: { marginHorizontal: 18, padding: 14, gap: 6, borderRadius: 20, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.line },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: palette.text, fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8 },
  hint: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { flex: 1, color: palette.text, fontSize: 12 },
  value: { color: palette.text, minWidth: 52, textAlign: 'center', fontSize: 12, fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  saved: { color: palette.muted, fontSize: 10, lineHeight: 14, flex: 1 },
});

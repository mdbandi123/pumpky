import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './button';
import { palette } from './theme';

export function StatueAudio({ active, visible }: { active: boolean; visible: boolean }) {
  const player = useRef<HTMLAudioElement>(null);
  const activeRef = useRef(active);
  const [enabled, setEnabled] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = active && enabled;
    const audio = player.current;
    if (!audio) return;
    if (!active || !enabled) { audio.pause(); return; }
    void audio.play().then(() => {
      // A permission/play promise can resolve after the badge disappeared.
      if (!activeRef.current) audio.pause();
    }).catch(() => setBlocked(true));
    return () => audio.pause();
  }, [active, enabled]);

  function toggle() {
    const audio = player.current;
    if (!audio) return;
    if (enabled && !blocked) { setEnabled(false); audio.pause(); return; }
    setEnabled(true);
    setBlocked(false);
    activeRef.current = active;
    // Play directly in the tap handler to satisfy iPhone Safari's activation rule.
    if (active) void audio.play().then(() => {
      if (!activeRef.current) audio.pause();
    }).catch(() => setBlocked(true));
  }

  return <View style={[styles.panel, !visible && { display: 'none' }]} testID="statue-audio">
    <audio ref={player} src="/audio/rene-baterbonia-mama.mp3" loop preload="auto"
      onError={() => setMessage('The soundtrack could not load. Check your connection and reload.')} />
    <Text style={styles.title}>Rene · base surprise</Text>
    <Text style={styles.note}>Soundtrack included · no upload needed</Text>
    <View style={styles.actions}>
      <Button label={blocked || !enabled ? 'Play sound' : 'Mute sound'} size="compact" variant="secondary"
        disabled={!active} onPress={toggle} />
    </View>
    <Text style={styles.note}>{message || (blocked ? 'Tap Play sound to allow audio in this browser.' : 'Only plays while the base badge is visible.')}</Text>
  </View>;
}

const styles = StyleSheet.create({
  panel: { marginHorizontal: 18, padding: 14, borderRadius: 18, backgroundColor: palette.panel, gap: 8 },
  title: { color: palette.accent, fontSize: 13, fontWeight: '600' },
  note: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 8 },
});

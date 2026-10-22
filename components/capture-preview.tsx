import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { palette } from './theme';

export function CapturePreview({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function share() {
    if (!uri || sharing) return;
    setSharing(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        const download = document.createElement('a');
        download.href = uri;
        download.download = `pumpky-${Date.now()}.png`;
        document.body.appendChild(download);
        download.click();
        download.remove();
        return;
      }
      if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
      await Sharing.shareAsync(uri);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open your photo.'); }
    finally { setSharing(false); }
  }
  return <Modal visible={!!uri} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Caught a little magic.</Text>
      {uri && <Image source={{ uri }} style={styles.photo} contentFit="contain" accessibilityLabel="Your captured basket design" />}
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <View style={styles.actions}>
        <Button label="Back to basket" variant="secondary" disabled={sharing} onPress={onClose} />
        <Button label={Platform.OS === 'web' ? 'Download photo' : 'Save / share'} loading={sharing} onPress={() => { void share(); }} />
      </View>
      <Text style={styles.note}>{Platform.OS === 'web' ? 'Download your photo to keep it on this computer.' : 'Choose Save Image in the share sheet to keep your photo.'}</Text>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, padding: 20, gap: 16 },
  heading: { color: palette.text, fontSize: 24, fontWeight: '700', marginTop: 16 },
  photo: { flex: 1, borderRadius: 24 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  error: { color: palette.warning },
  note: { color: palette.muted, fontSize: 12, textAlign: 'center' },
});

import { Image } from 'expo-image';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { palette } from './theme';

export function SetupGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close basket guide" onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>YOUR FIRST LITTLE HAUNTING</Text>
          <Text style={styles.title}>Three steps to spooky.</Text>
          <View style={styles.badgeRow}>
            <Image source={require('../assets/markers/pumpky-badge.png')} style={styles.badge}
              contentFit="contain" accessibilityLabel="The Pumpky tracking badge" />
            <View style={styles.badgeCopy}>
              <Text style={styles.stepTitle}>Meet your magic badge.</Text>
              <Text style={styles.copy}>Print the full badge at 80 × 100 mm. Keep it flat, on a piece of matte card.</Text>
            </View>
          </View>
          {Platform.OS === 'web' && <a href="/badge/print.html" target="_blank" rel="noopener noreferrer"
            style={{ color: palette.accent, fontSize: 14, padding: '12px 0' }}>Open printable badge ↗</a>}
          {Platform.OS === 'web' && <><a href="/badge/statue-print.html" target="_blank" rel="noopener noreferrer"
            style={{ color: palette.accent, fontSize: 14, padding: '12px 0' }}>Print the mystery base badge ↗</a>
            <Text style={styles.copy}>Lay the question-mark badge flat on the base and look down from a slight angle. The surprise stands on the badge and includes its soundtrack—no upload needed. Audio pauses when the badge disappears; Safari may need one tap on Play sound.</Text></>}
          <Step number="01" title="Dress the basket" detail="Fix the badge to the front centre of your basket. Keep it still against the basket, with no curves or dangling edges." />
          <Step number="02" title="Find the magic" detail={Platform.OS === 'web'
            ? 'Tap Start camera and allow access. On iPhone, open Pumpky directly in Safari. Point the rear camera at the whole badge in good light.'
            : 'Point your camera at the whole badge in good light. Move closer until Pumpky finds it.'} />
          <Step number="03" title="Pick. Pose. Capture." detail="Choose a creature, adjust Fit if needed, and tap the shutter. Save your photo from the preview." />
          <Button label="Let’s make some magic" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <View style={styles.step}><Text style={styles.number}>{number}</Text>
    <View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.copy}>{detail}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#07040cb3', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { backgroundColor: palette.panel, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '90%', width: '100%', maxWidth: 520, borderWidth: 1, borderColor: palette.line },
  content: { padding: 24, gap: 22 },
  handle: { width: 36, height: 4, borderRadius: 4, backgroundColor: palette.line, alignSelf: 'center' },
  eyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: palette.text, fontSize: 29, fontWeight: '700', letterSpacing: -1, marginTop: -12 },
  badgeRow: { flexDirection: 'row', gap: 18, alignItems: 'center', padding: 14,
    backgroundColor: palette.background, borderRadius: 20 },
  badge: { width: 65, height: 82, borderRadius: 4 },
  badgeCopy: { flex: 1, gap: 6 },
  step: { flexDirection: 'row', gap: 18 },
  number: { color: palette.accent, fontSize: 12, fontWeight: '700', paddingTop: 3 },
  stepCopy: { flex: 1, gap: 5 },
  stepTitle: { color: palette.text, fontSize: 16, fontWeight: '600' },
  copy: { color: palette.muted, fontSize: 13, lineHeight: 20 },
});

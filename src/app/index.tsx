import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ARView } from '../../components/ar/ar-view';
import type { ARHandle } from '../../components/ar/types';
import { Button } from '../../components/button';
import { BasketFitControls } from '../../components/basket-fit-controls';
import { CapturePreview } from '../../components/capture-preview';
import { SetupGuide } from '../../components/setup-guide';
import { ShutterButton } from '../../components/shutter-button';
import { StyleCarousel } from '../../components/style-carousel';
import { StatueAudio } from '../../components/statue-audio';
import { palette } from '../../components/theme';
import { ToolButton } from '../../components/tool-button';
import { TrackingStatus, type TrackingState } from '../../components/tracking-status';
import { basketStyles, type BasketStyleId } from '../features/styles';
import { useBasketFit } from '../features/use-basket-fit';

export default function HomeScreen() {
  const ar = useRef<ARHandle>(null);
  const capturing = useRef(false);
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [design, setDesign] = useState<BasketStyleId>('pumpkin');
  const [tracking, setTracking] = useState<TrackingState>('starting');
  const { scale, setScale, calibration, setCalibration, resetFit } = useBasketFit();
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [target, setTarget] = useState<'basket' | 'statue' | null>(null);
  const selected = basketStyles.find((item) => item.id === design)!;
  const selectedNumber = basketStyles.findIndex((item) => item.id === design) + 1;
  const cameraHeight = fitOpen ? Math.max(160, Math.min(260, height * 0.24))
    : Math.max(280, Math.min(520, height - insets.top - insets.bottom - 460));
  const ready = tracking === 'tracking' && foreground && focused && !guideOpen && !photo;
  const canReset = !busy && tracking !== 'unavailable' && tracking !== 'permission';

  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  async function capture() {
    if (capturing.current || !ar.current || !ready) return;
    capturing.current = true;
    setBusy(true);
    setError(null);
    try { setPhoto(await ar.current.capture()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not capture your basket.'); }
    finally { capturing.current = false; setBusy(false); }
  }

  function reset() {
    setError(null);
    ar.current?.reset();
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brand}><Text style={styles.brandMark}>✳</Text><Text style={styles.wordmark}>pumpky</Text></View>
        <View style={styles.edition}><Text style={styles.editionText}>THE HALLOWEEN EDIT</Text><Text style={styles.editionYear}>VOL. 01 / 2026</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!fitOpen && <View style={styles.intro}>
          <Text style={styles.title}>A new face for your basket.</Text>
          <Text style={styles.subtitle}>A little spooky. A lot of you.</Text>
        </View>}

        {Platform.OS === 'web' && <View style={styles.cameraControls}>
          <Text style={styles.cameraLabel}>{cameraEnabled ? 'CAMERA' : 'DESIGN PREVIEW'}</Text>
          <Button label={cameraEnabled ? 'Stop camera' : 'Start camera'} size="compact" variant="secondary"
            disabled={busy} onPress={() => {
              setCameraEnabled(!cameraEnabled);
              setTarget(null);
              setTracking(cameraEnabled ? 'unavailable' : 'starting');
              setError(null);
            }} />
        </View>}

        <View testID="camera-viewfinder" style={[styles.camera, { height: cameraHeight * Math.min(fontScale, 1.3) }]}>
          <ARView key={cameraEnabled ? 'camera' : 'preview'} ref={ar} design={design} scale={scale}
            calibration={calibration}
            cameraEnabled={cameraEnabled} active={focused && foreground && !photo && !guideOpen} onStatus={setTracking}
            onTargetChange={setTarget} />
          <View style={styles.cameraHeader} pointerEvents="box-none">
            <View style={styles.designTag}><Text style={styles.tagNumber}>{target === 'statue' ? '02' : `0${selectedNumber}`}</Text><Text style={styles.tagName}>{target === 'statue' ? 'RENE' : selected.name.toUpperCase()}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Adjust basket fit"
              accessibilityState={{ expanded: fitOpen }} onPress={() => setFitOpen((open) => !open)}
              style={({ pressed }) => [styles.fitButton, pressed && { opacity: 0.65 }]}>
              <Text style={styles.fitText}>⌗  Fit {Math.round(scale * 100)}%</Text>
            </Pressable>
          </View>

          {tracking !== 'unavailable' && <View style={styles.scanFrame} pointerEvents="none">
            <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
          </View>}
          <View style={styles.cameraFooter} pointerEvents="none">
            {tracking === 'unavailable'
              ? <Text style={styles.previewHint}>Choose a creature to preview</Text>
              : <TrackingStatus state={tracking} />}
          </View>
          {error && <View style={styles.errorBanner}><Text style={styles.error} accessibilityRole="alert">{error}</Text></View>}
        </View>

        <StatueAudio visible={target === 'statue'} active={target === 'statue' && ready && cameraEnabled} />

        {fitOpen && <BasketFitControls scale={scale} calibration={calibration} onScaleChange={setScale}
          onChange={setCalibration} onReset={resetFit} onClose={() => setFitOpen(false)} disabled={busy} />}

        {!fitOpen && <><View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your spirit</Text>
          <Text style={styles.count}>0{selectedNumber} <Text style={styles.countMuted}>/ 03</Text></Text>
        </View>
        <StyleCarousel designs={basketStyles} selectedId={design} onSelect={setDesign} /></>}
      </ScrollView>

      <View style={styles.dock}>
        <View style={styles.dockActions}>
          <ToolButton symbol="↺" label="Reset" disabled={!canReset} onPress={reset} />
          <ShutterButton disabled={!ready} loading={busy} onPress={() => { void capture(); }} />
          <ToolButton symbol="?" label="Quick guide" onPress={() => setGuideOpen(true)} />
        </View>
        <Text style={styles.captureHint}>{busy ? 'Bottling the magic…' : ready ? 'All dressed up. Capture the magic.' : 'Find your badge to capture the magic.'}</Text>
      </View>
    </View>
    <SetupGuide visible={guideOpen} onClose={() => setGuideOpen(false)} />
    <CapturePreview key={photo ?? 'empty'} uri={photo} onClose={() => setPhoto(null)} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { paddingHorizontal: 24, minHeight: 66, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { color: palette.accent, fontSize: 32 },
  wordmark: { color: palette.text, fontWeight: '800', fontSize: 30, letterSpacing: -1.7 },
  edition: { alignItems: 'flex-end', gap: 4 },
  editionText: { color: palette.accent, fontSize: 8, letterSpacing: 1.3, fontWeight: '600' },
  editionYear: { color: palette.muted, fontSize: 8, letterSpacing: 1.8 },
  scroll: { flex: 1 },
  content: { paddingBottom: 12, gap: 14 },
  intro: { paddingHorizontal: 24, gap: 5, paddingTop: 4 },
  title: { color: palette.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.7 },
  subtitle: { color: palette.muted, fontSize: 12 },
  cameraControls: { marginHorizontal: 18, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: -8 },
  cameraLabel: { color: palette.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.5 },
  camera: { marginHorizontal: 18, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.panel },
  cameraHeader: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  designTag: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 12, minHeight: 36, borderRadius: 12, backgroundColor: '#17121ed9' },
  tagNumber: { color: palette.accent, fontSize: 10, fontWeight: '600' },
  tagName: { color: palette.text, fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  fitButton: { backgroundColor: '#17121ed9', minHeight: 44, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  fitText: { color: palette.text, fontSize: 11 },
  scanFrame: { position: 'absolute', left: '15%', right: '15%', top: '23%', bottom: '23%' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#fff4e877' },
  topLeft: { top: 0, left: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderRightWidth: 1.5, borderTopWidth: 1.5, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderBottomRightRadius: 8 },
  cameraFooter: { position: 'absolute', bottom: 14, left: 12, right: 12, alignItems: 'center' },
  previewHint: { color: '#c9b8d1', fontSize: 10 },
  errorBanner: { position: 'absolute', bottom: 54, left: 14, right: 14, padding: 12, borderRadius: 12, backgroundColor: palette.background },
  error: { color: palette.warning, fontSize: 12 },
  section: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { color: palette.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  count: { color: palette.accent, fontSize: 10, letterSpacing: 1.5 },
  countMuted: { color: palette.muted },
  dock: { paddingHorizontal: 30, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderColor: '#322a38', backgroundColor: palette.background, gap: 9 },
  dockActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  captureHint: { color: palette.muted, fontSize: 10, textAlign: 'center' },
});

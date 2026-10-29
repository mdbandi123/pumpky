import { Asset } from 'expo-asset';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../button';
import { palette } from '../theme';
import type { TrackingState } from '../tracking-status';
import { creatureModels, cupFrontOffset, markerWidth } from '../../src/features/models';
import { DesignPreview } from './design-preview';
import type { ARViewProps } from './types';

const channel = 'pumpky-web-ar';
const statuses = new Set<TrackingState>(['starting', 'permission', 'searching', 'tracking', 'lost', 'unavailable']);

export function ARView({ ref, design, scale, active, onStatus }: ARViewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const capture = useRef<{
    id: string; resolve: (uri: string) => void; reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const send = useCallback((data: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ channel, ...data }, window.location.origin);
  }, []);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.channel !== channel) return;
      const data = event.data;
      if (data.type === 'ready') setLoaded(true);
      if (data.type === 'status' && statuses.has(data.state)) {
        onStatus(data.state);
        setMessage(typeof data.message === 'string' ? data.message : null);
      }
      if (data.type === 'error') {
        setFailed(true);
        setMessage(typeof data.message === 'string' ? data.message : 'The camera could not start. Open this page in Safari and check camera permission.');
        onStatus('unavailable');
      }
      const pending = capture.current;
      if (data.type === 'capture' && pending && pending.id === data.id) {
        capture.current = null;
        clearTimeout(pending.timer);
        if (typeof data.uri === 'string' && data.uri.startsWith('data:image/png;base64,')) pending.resolve(data.uri);
        else pending.reject(new Error(data.error || 'The photo could not be captured.'));
      }
    }
    window.addEventListener('message', receive);
    return () => {
      window.removeEventListener('message', receive);
      if (capture.current) {
        clearTimeout(capture.current.timer);
        capture.current.reject(new Error('The camera was closed.'));
        capture.current = null;
      }
    };
  }, [onStatus]);

  useEffect(() => {
    if (!enabled || loaded) return;
    const timer = setTimeout(() => {
      setFailed(true);
      setMessage('The camera view could not load. Check your connection and try again.');
      onStatus('unavailable');
    }, 30000);
    return () => clearTimeout(timer);
  }, [enabled, loaded, onStatus]);

  useEffect(() => {
    if (!enabled || !loaded) return;
    const modelUrls = Object.fromEntries(Object.entries(creatureModels).map(([id, module]) => [
      id, new URL(Asset.fromModule(module).uri, window.location.href).href,
    ]));
    send({ type: 'settings', design, scale, modelUrls, cupFrontOffset, markerWidth });
    if (active && !failed) {
      const marker = Asset.fromModule(require('../../assets/markers/pumpky-badge.png'));
      send({ type: 'start', markerUrl: new URL(marker.uri, window.location.href).href });
    } else send({ type: 'stop' });
  }, [enabled, loaded, active, failed, design, scale, send]);

  useImperativeHandle(ref, () => ({
    capture() {
      return new Promise<string>((resolve, reject) => {
        if (!active || !loaded || failed || capture.current) {
          reject(new Error('The camera is not ready.')); return;
        }
        const id = `capture-${Date.now()}`;
        const timer = setTimeout(() => {
          capture.current = null;
          reject(new Error('Photo capture timed out. Please try again.'));
        }, 15000);
        capture.current = { id, resolve, reject, timer };
        send({ type: 'capture', id });
      });
    },
    reset() { send({ type: 'reset' }); },
  }), [active, loaded, failed, send]);

  function retry() {
    setEnabled(false); setLoaded(false); setFailed(false); setMessage(null); onStatus('unavailable');
  }

  return <View style={styles.container}>
    {!enabled && <>
      <DesignPreview design={design} scale={scale} active={active} onStatus={onStatus} />
      <View style={styles.start}><Button label="Start camera" onPress={() => {
        setEnabled(true); setMessage('Loading the browser tracker…'); onStatus('starting');
      }} /></View>
    </>}
    {enabled && <iframe ref={frame} src="/web-ar/index.html" title="Pumpky camera and badge tracking"
      allow="camera" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />}
    {enabled && message && <View style={styles.message}>
      <Text style={styles.messageText} accessibilityRole={failed ? 'alert' : undefined}>{message}</Text>
      {failed && <Button label="Back to preview" variant="secondary" onPress={retry} />}
    </View>}
    {enabled && !failed && loaded && <View style={styles.stop}>
      <Button label="Stop camera" variant="secondary" onPress={retry} />
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.panel },
  start: { position: 'absolute', bottom: 65, alignSelf: 'center' },
  message: { position: 'absolute', top: '29%', left: 20, right: 20, padding: 16,
    borderRadius: 16, backgroundColor: '#151219ee', gap: 12 },
  messageText: { color: palette.text, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  stop: { position: 'absolute', top: 65, left: 14 },
});

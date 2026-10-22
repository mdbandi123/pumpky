import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '../button';
import { palette } from '../theme';
import type { ARViewProps } from './types';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function ARView(props: ARViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { onStatus } = props;
  useEffect(() => {
    if (isExpoGo) onStatus('unavailable');
    else if (!permission?.granted) onStatus('permission');
  }, [permission?.granted, onStatus]);

  if (isExpoGo) return <Message title="Your basket needs a development build."
    detail="Pumpky uses native ARKit tracking. Install the iPhone development build to start the camera." />;

  if (!permission?.granted) return (
    <Message title="Let’s find your basket." detail="Allow camera access to bring your Halloween badge to life.">
      <Button label={permission?.canAskAgain === false ? 'Open Settings' : 'Allow camera'}
        onPress={() => { void (permission?.canAskAgain === false ? Linking.openSettings() : requestPermission()); }} />
    </Message>
  );

  // Keep the native renderer out of Expo Go's runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NativeARView } = require('./native-ar-view') as typeof import('./native-ar-view');
  return <NativeARView {...props} />;
}

function Message({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) {
  return <View style={styles.message}><Text style={styles.title}>{title}</Text>
    <Text style={styles.detail}>{detail}</Text>{children}</View>;
}
const styles = StyleSheet.create({
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 20 },
  title: { color: palette.text, fontSize: 25, fontWeight: '700', textAlign: 'center' },
  detail: { color: palette.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
});

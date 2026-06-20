import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Keyboard as KeyboardIcon } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useHkTasks } from '@/providers/HkTasksProvider';

function extractRoom(raw: string): string {
  const m = raw.match(/\d{1,4}/);
  return (m?.[0] ?? raw).replace(/^0+/, '');
}

export default function HkScanScreen() {
  const router = useRouter();
  const { tasks } = useHkTasks();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  const onScanned = useCallback((value: string) => {
    if (locked.current) return;
    locked.current = true;
    const num = extractRoom(value);
    const match = tasks.find((t) => (t.room_number ?? '').replace(/^0+/, '') === num);
    if (match) {
      router.replace({ pathname: '/hk-room', params: { id: match.id } } as never);
    } else {
      setError(`Chambre ${num} introuvable dans vos attributions.`);
      setTimeout(() => { locked.current = false; setError(null); }, 1800);
    }
  }, [tasks, router]);

  const webUnsupported = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {!webUnsupported && permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onScanned(data)}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>
            {webUnsupported ? 'Scan caméra indisponible sur le web' : 'Autorisez la caméra pour scanner'}
          </Text>
          {!webUnsupported && !permission?.granted ? (
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnTxt}>Autoriser la caméra</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scanner une chambre</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.center} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>Visez le QR code derrière la porte</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.manualBtn} onPress={() => router.back()}>
          <KeyboardIcon size={18} color="#FFFFFF" />
          <Text style={styles.manualTxt}>Saisir le numéro manuellement</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: FT.headerBg, padding: 30, gap: 16 },
  fallbackTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  permBtn: { backgroundColor: FT.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  permBtnTxt: { color: '#FFFFFF', fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  center: { alignItems: 'center', gap: 16 },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.05)' },
  hint: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  error: { color: '#FF8A80', fontSize: 14, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  manualBtn: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginBottom: 24 },
  manualTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

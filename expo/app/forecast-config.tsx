import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Save, RotateCcw, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FT } from '@/constants/flowtym';
import { useTheme } from '@/providers/ThemeProvider';
import { useForecast } from '@/providers/ForecastProvider';
import { RoomTypeCoefficient, RoomType } from '@/constants/types';

const ROOM_TYPES: RoomType[] = ['Simple', 'Double', 'Suite', 'Deluxe', 'Familiale'];

export default function ForecastConfigScreen() {
  const router = useRouter();
  const { t } = useTheme();
  const { config, coefficients, updateConfig, updateCoefficients } = useForecast();

  const [maxRooms, setMaxRooms] = useState(String(config.defaultMaxRoomsPerHousekeeper));
  const [maxDeparts, setMaxDeparts] = useState(
    config.maxDepartsPerHousekeeper !== null ? String(config.maxDepartsPerHousekeeper) : ''
  );
  const [departCoeff, setDepartCoeff] = useState(String(config.departCoefficient));
  const [stayoverCoeff, setStayoverCoeff] = useState(String(config.stayoverCoefficient));
  const [useCoefficients, setUseCoefficients] = useState(config.useRoomTypeCoefficients);
  const [localCoeffs, setLocalCoeffs] = useState<RoomTypeCoefficient[]>(coefficients);

  const handleSave = useCallback(() => {
    const parsedMaxRooms = parseInt(maxRooms, 10);
    const parsedMaxDeparts = maxDeparts ? parseInt(maxDeparts, 10) : null;
    const parsedDepartCoeff = parseFloat(departCoeff);
    const parsedStayoverCoeff = parseFloat(stayoverCoeff);

    if (isNaN(parsedMaxRooms) || parsedMaxRooms < 1) {
      Alert.alert(t.common.error, t.forecast.maxRoomsPerHousekeeper + ' >= 1');
      return;
    }

    updateConfig({
      defaultMaxRoomsPerHousekeeper: parsedMaxRooms,
      maxDepartsPerHousekeeper: parsedMaxDeparts,
      departCoefficient: isNaN(parsedDepartCoeff) ? 1.0 : parsedDepartCoeff,
      stayoverCoefficient: isNaN(parsedStayoverCoeff) ? 0.7 : parsedStayoverCoeff,
      useRoomTypeCoefficients: useCoefficients,
    });

    if (useCoefficients) {
      updateCoefficients(localCoeffs);
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t.common.success, t.forecast.saved);
    router.back();
  }, [maxRooms, maxDeparts, departCoeff, stayoverCoeff, useCoefficients, localCoeffs, updateConfig, updateCoefficients, t, router]);

  const handleReset = useCallback(() => {
    setMaxRooms('12');
    setMaxDeparts('');
    setDepartCoeff('1');
    setStayoverCoeff('0.7');
    setUseCoefficients(false);
    setLocalCoeffs([
      { roomType: 'Simple', coefficient: 0.8 },
      { roomType: 'Double', coefficient: 1.0 },
      { roomType: 'Suite', coefficient: 1.5 },
      { roomType: 'Deluxe', coefficient: 1.3 },
      { roomType: 'Familiale', coefficient: 1.4 },
    ]);
  }, []);

  const updateLocalCoeff = useCallback((roomType: RoomType, value: string) => {
    setLocalCoeffs((prev) =>
      prev.map((c) => (c.roomType === roomType ? { ...c, coefficient: parseFloat(value) || 0 } : c))
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t.forecast.configTitle,
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn}>
              <Save size={18} color="#FFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Info size={16} color={FT.brand} />
          <Text style={styles.infoText}>{t.forecast.configDesc}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.forecast.configTitle}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.forecast.maxRoomsPerHousekeeper}</Text>
            <TextInput
              style={styles.input}
              value={maxRooms}
              onChangeText={setMaxRooms}
              keyboardType="numeric"
              placeholder="12"
              placeholderTextColor={FT.textMuted}
              testID="max-rooms-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.forecast.maxDepartsPerHousekeeper}</Text>
            <TextInput
              style={styles.input}
              value={maxDeparts}
              onChangeText={setMaxDeparts}
              keyboardType="numeric"
              placeholder="8"
              placeholderTextColor={FT.textMuted}
              testID="max-departs-input"
            />
            <Text style={styles.fieldHint}>
              {t.common.none} = {t.forecast.maxRoomsPerHousekeeper}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coefficients</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.forecast.departCoefficient}</Text>
            <TextInput
              style={styles.input}
              value={departCoeff}
              onChangeText={setDepartCoeff}
              keyboardType="decimal-pad"
              placeholder="1.0"
              placeholderTextColor={FT.textMuted}
              testID="depart-coeff-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.forecast.stayoverCoefficient}</Text>
            <TextInput
              style={styles.input}
              value={stayoverCoeff}
              onChangeText={setStayoverCoeff}
              keyboardType="decimal-pad"
              placeholder="0.7"
              placeholderTextColor={FT.textMuted}
              testID="stayover-coeff-input"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.fieldLabel}>{t.forecast.useRoomTypeCoefficients}</Text>
              <Text style={styles.fieldHint}>Suite = 1.5, Simple = 0.8, ...</Text>
            </View>
            <Switch
              value={useCoefficients}
              onValueChange={setUseCoefficients}
              trackColor={{ false: FT.border, true: FT.brand + '60' }}
              thumbColor={useCoefficients ? FT.brand : FT.textMuted}
              testID="use-coefficients-switch"
            />
          </View>

          {useCoefficients && (
            <View style={styles.coeffGrid}>
              <View style={styles.coeffHeader}>
                <Text style={styles.coeffHeaderLabel}>{t.rooms.type}</Text>
                <Text style={styles.coeffHeaderLabel}>Coeff.</Text>
              </View>
              {ROOM_TYPES.map((type) => {
                const coeff = localCoeffs.find((c) => c.roomType === type);
                return (
                  <View key={type} style={styles.coeffRow}>
                    <Text style={styles.coeffType}>{type}</Text>
                    <TextInput
                      style={styles.coeffInput}
                      value={String(coeff?.coefficient ?? 1.0)}
                      onChangeText={(v) => updateLocalCoeff(type, v)}
                      keyboardType="decimal-pad"
                      placeholderTextColor={FT.textMuted}
                      testID={`coeff-${type}-input`}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Save size={16} color="#FFF" />
            <Text style={styles.saveBtnText}>{t.common.save}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
            <RotateCcw size={14} color={FT.textSec} />
            <Text style={styles.resetBtnText}>{t.common.reset}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FT.bg,
  },
  headerSaveBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: FT.brandSoft,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FT.brand + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: FT.brand,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  section: {
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: FT.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: FT.text,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: FT.text,
  },
  fieldHint: {
    fontSize: 11,
    color: FT.textMuted,
    fontWeight: '400' as const,
  },
  input: {
    backgroundColor: FT.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: FT.text,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: FT.border,
  },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  switchLabel: {
    flex: 1,
    gap: 2,
  },
  coeffGrid: {
    gap: 6,
    backgroundColor: FT.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: FT.border,
  },
  coeffHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
  },
  coeffHeaderLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: FT.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  coeffRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: FT.borderLight,
  },
  coeffType: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: FT.text,
  },
  coeffInput: {
    width: 70,
    backgroundColor: FT.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600' as const,
    color: FT.text,
    textAlign: 'center' as const,
    borderWidth: 1,
    borderColor: FT.border,
  },
  actions: {
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: FT.brand,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  resetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: FT.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FT.border,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: FT.textSec,
  },
});

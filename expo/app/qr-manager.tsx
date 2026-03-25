import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  QrCode,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Timer,
  Download,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { FT } from '@/constants/flowtym';

type QRType = 'housekeeping' | 'room_review' | 'breakfast_review';

const QR_TYPE_CONFIG: Record<QRType, { label: string; color: string; icon: string; description: string }> = {
  housekeeping: { label: 'Ménage', color: '#14B8A6', icon: '🧹', description: 'Démarre le chrono de nettoyage au scan' },
  room_review: { label: 'Avis chambre', color: '#6B5CE7', icon: '⭐', description: 'Questionnaire satisfaction chambre' },
  breakfast_review: { label: 'Avis PDJ', color: '#F59E0B', icon: '☕', description: 'Questionnaire satisfaction petit-déjeuner' },
};

export default function QRManagerScreen() {
  const { rooms } = useHotel();
  const [selectedType, setSelectedType] = useState<QRType>('housekeeping');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());

  const floors = useMemo(() => {
    const floorMap = new Map<number, typeof rooms>();
    for (const room of rooms) {
      const arr = floorMap.get(room.floor) || [];
      arr.push(room);
      floorMap.set(room.floor, arr);
    }
    return Array.from(floorMap.entries()).sort((a, b) => a[0] - b[0]);
  }, [rooms]);

  const selectedRoomData = useMemo(
    () => rooms.find((r) => r.id === selectedRoom),
    [rooms, selectedRoom]
  );

  const generateQRUrl = useCallback((type: QRType, roomId: string, roomNumber: string) => {
    const baseUrl = 'https://app.flowtym.com';
    switch (type) {
      case 'housekeeping':
        return `${baseUrl}/scan/cleaning?hotel_id=hotel-1&room_id=${roomId}&room=${roomNumber}`;
      case 'room_review':
        return `${baseUrl}/feedback?hotel_id=hotel-1&room_id=${roomId}&room=${roomNumber}&type=room`;
      case 'breakfast_review':
        return `${baseUrl}/feedback?hotel_id=hotel-1&type=breakfast`;
      default:
        return baseUrl;
    }
  }, []);

  const toggleFloor = useCallback((floor: number) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floor)) next.delete(floor); else next.add(floor);
      return next;
    });
  }, []);

  const handlePrint = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Impression QR Code',
      selectedType === 'breakfast_review'
        ? 'Le QR Code petit-déjeuner est prêt pour impression.\n\nFormat recommandé : A6 / A7\nPour affichage sur les tables du restaurant.'
        : `QR Code ${selectedRoomData ? `chambre ${selectedRoomData.roomNumber}` : ''} prêt pour impression.\n\nFormat recommandé : A6 / A7\nPour affichage sur la porte de chambre.`
    );
  }, [selectedType, selectedRoomData]);

  const handlePrintAll = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Impression en masse',
      `${rooms.length} QR Codes ${QR_TYPE_CONFIG[selectedType].label} seront générés en PDF.\n\nFormat : A6 / A7 par page\nPrêt pour découpage et affichage.`
    );
  }, [rooms.length, selectedType]);

  const renderQRPreview = () => {
    if (selectedType === 'breakfast_review') {
      const url = generateQRUrl('breakfast_review', '', '');
      return (
        <View style={styles.qrPreview}>
          <View style={styles.qrCard}>
            <View style={styles.qrPrintHeader}>
              <Text style={styles.qrPrintBrand}>FLOWTYM</Text>
              <Text style={styles.qrPrintHotel}>Votre avis compte pour nous ⭐</Text>
            </View>
            <View style={styles.qrCodeContainer}>
              <QRCodeGenerator value={url} size={180} color="#1E293B" />
            </View>
            <Text style={styles.qrPrintInstruction}>
              Scannez ce QR Code{'\n'}et partagez votre expérience.
            </Text>
            <Text style={styles.qrPrintTime}>Cela prend moins de 30 secondes.</Text>
            <Text style={styles.qrPrintThanks}>Merci 🙏</Text>
          </View>

          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.7}>
              <Printer size={16} color="#FFF" />
              <Text style={styles.printBtnText}>Imprimer ce QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!selectedRoomData) {
      return (
        <View style={styles.qrEmptyState}>
          <QrCode size={48} color={FT.textMuted} />
          <Text style={styles.qrEmptyText}>Sélectionnez une chambre</Text>
          <Text style={styles.qrEmptySubtext}>
            {selectedType === 'housekeeping'
              ? 'Le QR Code démarrera le chrono de nettoyage au scan.'
              : 'Le QR Code ouvrira le questionnaire de satisfaction.'}
          </Text>
        </View>
      );
    }

    const url = generateQRUrl(selectedType, selectedRoomData.id, selectedRoomData.roomNumber);
    const typeConfig = QR_TYPE_CONFIG[selectedType];

    return (
      <View style={styles.qrPreview}>
        <View style={styles.qrCard}>
          <View style={styles.qrPrintHeader}>
            <Text style={styles.qrPrintBrand}>FLOWTYM</Text>
            {selectedType === 'housekeeping' ? (
              <Text style={styles.qrPrintHotel}>Chambre {selectedRoomData.roomNumber} — Ménage</Text>
            ) : (
              <Text style={styles.qrPrintHotel}>Votre avis compte pour nous ⭐</Text>
            )}
          </View>
          <View style={styles.qrCodeContainer}>
            <QRCodeGenerator value={url} size={180} color="#1E293B" />
          </View>
          {selectedType === 'housekeeping' ? (
            <>
              <Text style={styles.qrPrintInstruction}>
                Scannez pour démarrer{'\n'}le nettoyage de la chambre.
              </Text>
              <View style={styles.qrFeatureRow}>
                <View style={styles.qrFeature}>
                  <Timer size={14} color={typeConfig.color} />
                  <Text style={styles.qrFeatureText}>Chrono auto</Text>
                </View>
                <View style={styles.qrFeature}>
                  <Sparkles size={14} color={typeConfig.color} />
                  <Text style={styles.qrFeatureText}>Re-scan = fin</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.qrPrintInstruction}>
                Scannez ce QR Code{'\n'}et partagez votre expérience.
              </Text>
              <Text style={styles.qrPrintTime}>Cela prend moins de 30 secondes.</Text>
              <Text style={styles.qrPrintThanks}>Merci 🙏</Text>
            </>
          )}
          <View style={[styles.qrRoomBadge, { backgroundColor: typeConfig.color + '12' }]}>
            <Text style={[styles.qrRoomBadgeText, { color: typeConfig.color }]}>
              Chambre {selectedRoomData.roomNumber}
            </Text>
          </View>
        </View>

        <View style={styles.qrActions}>
          <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.7}>
            <Printer size={16} color="#FFF" />
            <Text style={styles.printBtnText}>Imprimer ce QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'QR Codes', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF' }} />

      <View style={styles.typeSelector}>
        {(Object.keys(QR_TYPE_CONFIG) as QRType[]).map((type) => {
          const config = QR_TYPE_CONFIG[type];
          const isActive = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, isActive && { backgroundColor: config.color + '15', borderColor: config.color }]}
              onPress={() => { setSelectedType(type); setSelectedRoom(null); }}
              activeOpacity={0.7}
            >
              <Text style={styles.typeChipIcon}>{config.icon}</Text>
              <Text style={[styles.typeChipLabel, isActive && { color: config.color }]}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.typeDescription}>
          <Text style={styles.typeDescText}>{QR_TYPE_CONFIG[selectedType].description}</Text>
        </View>

        {selectedType !== 'breakfast_review' && (
          <View style={styles.roomSelector}>
            <Text style={styles.sectionTitle}>Sélectionner une chambre</Text>
            {floors.map(([floor, floorRooms]) => {
              const isExpanded = expandedFloors.has(floor);
              return (
                <View key={floor}>
                  <TouchableOpacity style={styles.floorHeader} onPress={() => toggleFloor(floor)} activeOpacity={0.7}>
                    <Text style={styles.floorLabel}>Étage {floor}</Text>
                    <View style={styles.floorMeta}>
                      <Text style={styles.floorCount}>{floorRooms.length} ch.</Text>
                      {isExpanded ? <ChevronUp size={16} color={FT.textMuted} /> : <ChevronDown size={16} color={FT.textMuted} />}
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.roomGrid}>
                      {floorRooms.map((room) => {
                        const isSelected = selectedRoom === room.id;
                        const typeColor = QR_TYPE_CONFIG[selectedType].color;
                        return (
                          <TouchableOpacity
                            key={room.id}
                            style={[styles.roomChip, isSelected && { backgroundColor: typeColor + '15', borderColor: typeColor }]}
                            onPress={() => {
                              setSelectedRoom(room.id);
                              if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.roomChipNumber, isSelected && { color: typeColor }]}>
                              {room.roomNumber}
                            </Text>
                            <Text style={styles.roomChipType}>{room.roomType}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {renderQRPreview()}

        <View style={styles.bulkSection}>
          <Text style={styles.sectionTitle}>Actions en masse</Text>
          <TouchableOpacity style={styles.bulkBtn} onPress={handlePrintAll} activeOpacity={0.7}>
            <Download size={18} color={FT.brand} />
            <View style={styles.bulkBtnInfo}>
              <Text style={styles.bulkBtnTitle}>Télécharger tous les QR Codes en PDF</Text>
              <Text style={styles.bulkBtnSubtitle}>
                {rooms.length} QR Codes • Format A6/A7 • Prêt à imprimer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  typeSelector: { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: FT.border, backgroundColor: FT.surface },
  typeChipIcon: { fontSize: 16 },
  typeChipLabel: { fontSize: 12, fontWeight: '700' as const, color: FT.textSec },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  typeDescription: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  typeDescText: { fontSize: 13, color: FT.textSec, fontStyle: 'italic' as const },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: FT.text, marginBottom: 10 },
  roomSelector: { padding: 16 },
  floorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  floorLabel: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  floorMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  floorCount: { fontSize: 12, color: FT.textMuted, fontWeight: '500' as const },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10 },
  roomChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: FT.border, backgroundColor: FT.surface, minWidth: 72, alignItems: 'center' },
  roomChipNumber: { fontSize: 15, fontWeight: '800' as const, color: FT.text },
  roomChipType: { fontSize: 10, color: FT.textMuted, marginTop: 2 },
  qrEmptyState: { alignItems: 'center', paddingVertical: 48, gap: 12, marginHorizontal: 16 },
  qrEmptyText: { fontSize: 16, fontWeight: '700' as const, color: FT.textSec },
  qrEmptySubtext: { fontSize: 13, color: FT.textMuted, textAlign: 'center' as const, lineHeight: 20 },
  qrPreview: { paddingHorizontal: 16, paddingTop: 8 },
  qrCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  qrPrintHeader: { alignItems: 'center', gap: 4 },
  qrPrintBrand: { fontSize: 16, fontWeight: '900' as const, color: '#6B5CE7', letterSpacing: 1 },
  qrPrintHotel: { fontSize: 13, fontWeight: '600' as const, color: '#64748B' },
  qrCodeContainer: { padding: 12, backgroundColor: '#FFF', borderRadius: 12 },
  qrPrintInstruction: { fontSize: 14, fontWeight: '600' as const, color: '#1E293B', textAlign: 'center' as const, lineHeight: 22 },
  qrPrintTime: { fontSize: 12, color: '#94A3B8' },
  qrPrintThanks: { fontSize: 14, color: '#64748B' },
  qrFeatureRow: { flexDirection: 'row', gap: 20 },
  qrFeature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrFeatureText: { fontSize: 12, fontWeight: '600' as const, color: '#64748B' },
  qrRoomBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 4 },
  qrRoomBadgeText: { fontSize: 13, fontWeight: '700' as const },
  qrActions: { marginTop: 16, gap: 10 },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12 },
  printBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  bulkSection: { padding: 16, marginTop: 8 },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: FT.surface, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: FT.border },
  bulkBtnInfo: { flex: 1 },
  bulkBtnTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  bulkBtnSubtitle: { fontSize: 12, color: FT.textSec, marginTop: 2 },
});

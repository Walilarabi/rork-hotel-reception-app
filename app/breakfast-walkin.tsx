import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Coffee,
  Minus,
  Plus,
  ChevronDown,
  CheckCircle,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';

export default function BreakfastWalkinScreen() {
  const router = useRouter();
  const { rooms, addBreakfast } = useHotel();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [personCount, setPersonCount] = useState(1);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [searchRoom] = useState('');

  const occupiedRooms = useMemo(() => {
    let result = rooms.filter((r) => r.status === 'occupe' || r.status === 'recouche');
    if (searchRoom) {
      const s = searchRoom.toLowerCase();
      result = result.filter((r) =>
        r.roomNumber.toLowerCase().includes(s) ||
        r.currentReservation?.guestName?.toLowerCase().includes(s)
      );
    }
    return result.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  }, [rooms, searchRoom]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleSubmit = useCallback(() => {
    if (!selectedRoomId || !selectedRoom) {
      Alert.alert('Erreur', 'Veuillez sélectionner une chambre.');
      return;
    }

    Alert.alert(
      'Confirmer le PDJ hors-forfait',
      `Enregistrer ${personCount} personne(s) pour la chambre ${selectedRoom.roomNumber} ?\n\nUne alerte sera envoyée à la réception pour facturation.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            addBreakfast({
              roomId: selectedRoomId,
              roomNumber: selectedRoom.roomNumber,
              orderDate: new Date().toISOString().split('T')[0],
              included: false,
              personCount,
              adults: personCount,
              children: 0,
              formule: 'Walk-in',
              boissons: [],
              options: [],
              status: 'servi',
              servedAt: new Date().toISOString(),
              billingNotificationSent: false,
              notes: 'PDJ hors-forfait enregistré manuellement',
              guestName: selectedRoom.currentReservation?.guestName ?? 'Client',
            });
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'PDJ enregistré',
              `Chambre ${selectedRoom.roomNumber} — ${personCount} pers.\nAlerte de facturation envoyée à la réception.`,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  }, [selectedRoomId, selectedRoom, personCount, addBreakfast, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'PDJ Hors-forfait' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconRow}>
          <View style={styles.iconLarge}>
            <Coffee size={28} color={Colors.warning} />
          </View>
          <Text style={styles.formTitle}>Petit-déjeuner hors-forfait</Text>
          <Text style={styles.formSub}>Enregistrez un PDJ pour une chambre non prévue. Une alerte sera envoyée à la réception pour facturation.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Chambre</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowRoomPicker(!showRoomPicker)}
          >
            {selectedRoom ? (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedRoomNumber}>{selectedRoom.roomNumber}</Text>
                <Text style={styles.selectedGuest}>
                  {selectedRoom.currentReservation?.guestName ?? 'Occupé'}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Sélectionner une chambre</Text>
            )}
            <ChevronDown size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {showRoomPicker && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerSearch}>
                <Search size={14} color={Colors.textMuted} />
                <Text style={styles.pickerSearchText}>
                  {occupiedRooms.length} chambre(s) occupée(s)
                </Text>
              </View>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {occupiedRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[styles.pickerItem, selectedRoomId === room.id && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedRoomId(room.id);
                      setShowRoomPicker(false);
                    }}
                  >
                    <Text style={styles.pickerRoomNumber}>{room.roomNumber}</Text>
                    <Text style={styles.pickerGuest} numberOfLines={1}>
                      {room.currentReservation?.guestName ?? '—'}
                    </Text>
                    {selectedRoomId === room.id && <CheckCircle size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nombre de personnes</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterBtn, personCount <= 1 && styles.counterBtnDisabled]}
              onPress={() => {
                if (personCount > 1) setPersonCount(personCount - 1);
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              disabled={personCount <= 1}
            >
              <Minus size={18} color={personCount <= 1 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
            <View style={styles.counterValue}>
              <Text style={styles.counterValueText}>{personCount}</Text>
              <Text style={styles.counterValueLabel}>personne(s)</Text>
            </View>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => {
                setPersonCount(personCount + 1);
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Plus size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {selectedRoom && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chambre</Text>
              <Text style={styles.summaryValue}>{selectedRoom.roomNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Client</Text>
              <Text style={styles.summaryValue}>{selectedRoom.currentReservation?.guestName ?? '—'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Personnes</Text>
              <Text style={styles.summaryValue}>{personCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>💰 Payant</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Coffee size={18} color={Colors.white} />
          <Text style={styles.submitBtnText}>Enregistrer le PDJ</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20 },
  iconRow: { alignItems: 'center', marginBottom: 24, gap: 8 },
  iconLarge: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.warning + '15', justifyContent: 'center', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  formSub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  selectorPlaceholder: { fontSize: 14, color: Colors.textMuted },
  selectedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedRoomNumber: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  selectedGuest: { fontSize: 13, color: Colors.textSecondary },
  pickerContainer: { backgroundColor: Colors.surface, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.border, maxHeight: 250, overflow: 'hidden' },
  pickerSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerSearchText: { fontSize: 12, color: Colors.textMuted },
  pickerList: { maxHeight: 200 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 10 },
  pickerItemActive: { backgroundColor: Colors.primarySoft },
  pickerRoomNumber: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, minWidth: 40 },
  pickerGuest: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  counterBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  counterBtnDisabled: { opacity: 0.4 },
  counterValue: { alignItems: 'center', minWidth: 60 },
  counterValueText: { fontSize: 32, fontWeight: '800' as const, color: Colors.text },
  counterValueLabel: { fontSize: 11, color: Colors.textMuted },
  summaryCard: { backgroundColor: Colors.warning + '08', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.warning + '25', marginBottom: 20, gap: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '700' as const, color: Colors.warning, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  paidBadge: { backgroundColor: Colors.vipGold + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paidBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.vipGold },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.warning, paddingVertical: 16, borderRadius: 14 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
});

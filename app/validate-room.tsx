import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import { INSPECTION_CHECKLIST } from '@/constants/types';

export default function ValidateRoomScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId: string }>();
  const router = useRouter();
  const { inspections, validateInspection, rooms } = useHotel();

  const inspection = useMemo(() => inspections.find((i) => i.id === inspectionId), [inspections, inspectionId]);
  const room = useMemo(() => rooms.find((r) => r.id === inspection?.roomId), [rooms, inspection]);

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    INSPECTION_CHECKLIST.forEach((item) => {
      initial[item.key] = inspection?.checklistResults[item.key] ?? false;
    });
    return initial;
  });
  const [comments, setComments] = useState(inspection?.comments ?? '');
  const [noteText, setNoteText] = useState('');

  const allChecked = useMemo(() => INSPECTION_CHECKLIST.every((item) => checklist[item.key]), [checklist]);

  const toggleCheckItem = useCallback((key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleValidate = useCallback(() => {
    if (!inspection) return;
    Alert.alert('Valider la chambre', `Confirmer la validation de la chambre ${inspection.roomNumber} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: () => {
          validateInspection({ inspectionId: inspection.id, status: 'valide', checklist, comments });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  }, [inspection, checklist, comments, validateInspection, router]);

  const handleRefuse = useCallback(() => {
    if (!inspection) return;
    const uncheckedItems = INSPECTION_CHECKLIST.filter((item) => !checklist[item.key]).map((item) => item.label);
    const refuseReason = uncheckedItems.length > 0 ? `Points non validés: ${uncheckedItems.join(', ')}` : comments || 'Refusée par la gouvernante';

    Alert.alert('Refuser la chambre', `Confirmer le refus de la chambre ${inspection.roomNumber} ?\n\nMotif: ${refuseReason}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: () => {
          validateInspection({ inspectionId: inspection.id, status: 'refuse', checklist, comments: refuseReason });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  }, [inspection, checklist, comments, validateInspection, router]);

  const handleSendNote = useCallback(() => {
    if (!noteText.trim()) return;
    setComments((prev) => prev ? `${prev}\n${noteText.trim()}` : noteText.trim());
    setNoteText('');
  }, [noteText]);

  if (!inspection) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Inspection introuvable' }} />
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Inspection introuvable</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <View style={styles.heroSection}>
        <Text style={styles.heroRoomNumber}>{inspection.roomNumber}</Text>
        <Text style={styles.heroRoomType}>{inspection.roomType}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {inspection.guestName ? (
          <View style={styles.guestCard}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestAvatarText}>{inspection.guestName[0]}</Text>
            </View>
            <Text style={styles.guestNameText}>{inspection.guestName}</Text>
          </View>
        ) : null}

        {room?.currentReservation && (
          <View style={styles.datesSection}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>
                {new Date(room.currentReservation.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>
                {new Date(room.currentReservation.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>Checklist de validation</Text>
          {INSPECTION_CHECKLIST.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.checklistItem}
              onPress={() => toggleCheckItem(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkBox, checklist[item.key] && styles.checkBoxChecked]}>
                {checklist[item.key] && <CheckCircle size={16} color={Colors.white} />}
              </View>
              <Text style={[styles.checklistLabel, checklist[item.key] && styles.checklistLabelChecked]}>
                {item.label}
              </Text>
              <View style={[styles.checkIndicator, checklist[item.key] ? styles.checkIndicatorGreen : styles.checkIndicatorGray]}>
                <CheckCircle size={14} color={checklist[item.key] ? Colors.success : Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
          <Text style={styles.checklistSummary}>
            {allChecked ? 'Tous les points de contrôle ont été vérifiés' : `${INSPECTION_CHECKLIST.filter((i) => checklist[i.key]).length}/${INSPECTION_CHECKLIST.length} points vérifiés`}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
            <CheckCircle size={18} color={Colors.white} />
            <Text style={styles.validateBtnText}>Valider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refuseBtn} onPress={handleRefuse}>
            <XCircle size={18} color={Colors.white} />
            <Text style={styles.refuseBtnText}>Refuser</Text>
          </TouchableOpacity>
        </View>

        {comments ? (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsText}>{comments}</Text>
          </View>
        ) : null}

        <View style={styles.noteSection}>
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note..."
              placeholderTextColor={Colors.textMuted}
              value={noteText}
              onChangeText={setNoteText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendNote}>
              <Text style={styles.sendBtnText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnText: { color: Colors.white, fontWeight: '600' as const },
  heroSection: { backgroundColor: Colors.primary, paddingVertical: 20, alignItems: 'center', gap: 4 },
  heroRoomNumber: { fontSize: 36, fontWeight: '800' as const, color: Colors.white },
  heroRoomType: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  guestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  guestAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  guestAvatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
  guestNameText: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  datesSection: { backgroundColor: Colors.surface, padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  dateValue: { fontSize: 13, color: Colors.textSecondary },
  checklistSection: { backgroundColor: Colors.surface, padding: 16, marginTop: 8, gap: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  checkBoxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checklistLabel: { flex: 1, fontSize: 14, color: Colors.text },
  checklistLabelChecked: { color: Colors.textSecondary },
  checkIndicator: { padding: 2 },
  checkIndicatorGreen: {},
  checkIndicatorGray: {},
  checklistSummary: { fontSize: 12, color: Colors.textMuted, marginTop: 10, textAlign: 'center' as const },
  actionButtons: { flexDirection: 'row', padding: 16, gap: 12 },
  validateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, paddingVertical: 14, borderRadius: 10, gap: 8 },
  validateBtnText: { fontSize: 15, fontWeight: '700' as const, color: Colors.white },
  refuseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.danger, paddingVertical: 14, borderRadius: 10, gap: 8 },
  refuseBtnText: { fontSize: 15, fontWeight: '700' as const, color: Colors.white },
  commentsSection: { backgroundColor: Colors.surface, padding: 16, marginTop: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  commentsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  noteSection: { backgroundColor: Colors.surface, padding: 16, marginTop: 8 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteInput: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  sendBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
});

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Star,
  Zap,
  User,
  Calendar,
  Users,
  Heart,
  Clock,
  ChevronDown,
  DoorOpen,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import {
  RoomStatus,
  ROOM_STATUS_CONFIG,
  CLEANING_STATUS_CONFIG,
  ClientBadge,
} from '@/constants/types';

const STATUS_OPTIONS: RoomStatus[] = ['libre', 'occupe', 'depart', 'recouche', 'hors_service'];

export default function RoomDetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { rooms, updateRoom } = useHotel();

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructions, setInstructions] = useState(room?.vipInstructions ?? '');

  const handleStatusChange = useCallback((newStatus: RoomStatus) => {
    if (!room) return;
    updateRoom({ roomId: room.id, updates: { status: newStatus } });
    setShowStatusPicker(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [room, updateRoom]);

  const handleBadgeToggle = useCallback((badge: ClientBadge) => {
    if (!room) return;
    const newBadge = room.clientBadge === badge ? 'normal' : badge;
    updateRoom({ roomId: room.id, updates: { clientBadge: newBadge } });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [room, updateRoom]);

  const handleSaveInstructions = useCallback(() => {
    if (!room) return;
    updateRoom({ roomId: room.id, updates: { vipInstructions: instructions } });
    setEditingInstructions(false);
  }, [room, instructions, updateRoom]);

  const handleDeparture = useCallback(() => {
    if (!room) return;
    Alert.alert('Confirmer le départ', `Libérer la chambre ${room.roomNumber} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => {
          updateRoom({ roomId: room.id, updates: { status: 'depart' } });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [room, updateRoom]);

  if (!room) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chambre introuvable' }} />
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Chambre introuvable</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = ROOM_STATUS_CONFIG[room.status];
  const cleaningConfig = CLEANING_STATUS_CONFIG[room.cleaningStatus];
  const reservation = room.currentReservation;

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
        <Text style={styles.heroNumber}>{room.roomNumber}</Text>
        <Text style={styles.heroType}>{room.roomType} • Étage {room.floor}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={styles.statusSelector}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
          >
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={styles.statusSelectorText}>{statusConfig.label}</Text>
            <ChevronDown size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            <TouchableOpacity
              style={[styles.badgeBtn, room.clientBadge === 'vip' && styles.vipBadgeActive]}
              onPress={() => handleBadgeToggle('vip')}
            >
              <Star size={14} color={room.clientBadge === 'vip' ? Colors.vipGold : Colors.textMuted} fill={room.clientBadge === 'vip' ? Colors.vipGold : 'transparent'} />
              <Text style={[styles.badgeBtnText, room.clientBadge === 'vip' && { color: Colors.vipGold }]}>VIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badgeBtn, room.clientBadge === 'prioritaire' && styles.priorityBadgeActive]}
              onPress={() => handleBadgeToggle('prioritaire')}
            >
              <Zap size={14} color={room.clientBadge === 'prioritaire' ? Colors.priorityRed : Colors.textMuted} fill={room.clientBadge === 'prioritaire' ? Colors.priorityRed : 'transparent'} />
              <Text style={[styles.badgeBtnText, room.clientBadge === 'prioritaire' && { color: Colors.priorityRed }]}>Prioritaire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStatusPicker && (
          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((s) => {
              const cfg = ROOM_STATUS_CONFIG[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, room.status === s && styles.statusOptionActive]}
                  onPress={() => handleStatusChange(s)}
                >
                  <View style={[styles.statusDotSmall, { backgroundColor: cfg.color }]} />
                  <Text style={styles.statusOptionText}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {reservation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Client (PMS)</Text>
            </View>
            <View style={styles.clientCard}>
              <Text style={styles.guestName}>{reservation.guestName}</Text>
              <View style={styles.clientRow}>
                <Calendar size={13} color={Colors.textMuted} />
                <Text style={styles.clientInfo}>
                  {new Date(reservation.checkInDate).toLocaleDateString('fr-FR')} → {new Date(reservation.checkOutDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.clientRow}>
                <Users size={13} color={Colors.textMuted} />
                <Text style={styles.clientInfo}>
                  {reservation.adults} adulte(s){reservation.children > 0 ? `, ${reservation.children} enfant(s)` : ''}
                </Text>
              </View>
              {reservation.preferences ? (
                <View style={styles.clientRow}>
                  <Heart size={13} color={Colors.textMuted} />
                  <Text style={styles.clientInfo}>{reservation.preferences}</Text>
                </View>
              ) : null}
              <View style={styles.reservationStatusRow}>
                <Shield size={12} color={Colors.textMuted} />
                <Text style={styles.reservationStatus}>Réservation: {reservation.status.replace('_', ' ')}</Text>
                <Text style={styles.pmsId}>#{reservation.pmsReservationId}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions spéciales</Text>
          {editingInstructions ? (
            <View>
              <TextInput
                style={styles.instructionsInput}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Ex: Allergie aux plumes..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
              <View style={styles.instructionActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingInstructions(false); setInstructions(room.vipInstructions); }}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveInstructions}>
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.instructionsDisplay} onPress={() => setEditingInstructions(true)}>
              <Text style={room.vipInstructions ? styles.instructionsText : styles.instructionsPlaceholder}>
                {room.vipInstructions || 'Appuyez pour ajouter des instructions...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {room.cleaningStatus !== 'none' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>État du nettoyage</Text>
            <View style={[styles.cleaningCard, { borderLeftColor: cleaningConfig.color }]}>
              <Text style={styles.cleaningEmoji}>{cleaningConfig.icon}</Text>
              <View style={styles.cleaningInfo}>
                <Text style={[styles.cleaningLabel, { color: cleaningConfig.color }]}>{cleaningConfig.label}</Text>
                {room.cleaningAssignee && <Text style={styles.cleaningAssignee}>Par {room.cleaningAssignee}</Text>}
              </View>
            </View>
          </View>
        )}

        {room.history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Historique</Text>
            </View>
            {room.history.slice().reverse().map((entry) => (
              <View key={entry.id} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyAction}>{entry.action}</Text>
                  <Text style={styles.historyDetail}>{entry.details}</Text>
                  <Text style={styles.historyMeta}>
                    {entry.performedBy} • {new Date(entry.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Chambre</Text>
          <View style={styles.qrContainer}>
            <QRCodeGenerator
              value={`flowtym://room/${room.id}`}
              size={160}
              color={Colors.primary}
              backgroundColor="#FFFFFF"
            />
            <Text style={styles.qrLabel}>Chambre {room.roomNumber}</Text>
            <Text style={styles.qrHint}>Scannez pour accéder directement</Text>
          </View>
        </View>

        {room.status === 'occupe' && (
          <TouchableOpacity style={styles.departureButton} onPress={handleDeparture}>
            <DoorOpen size={18} color={Colors.white} />
            <Text style={styles.departureButtonText}>Déclarer le départ</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnText: { color: Colors.white, fontWeight: '600' as const },
  heroSection: { backgroundColor: Colors.primary, paddingVertical: 24, alignItems: 'center', gap: 4 },
  heroNumber: { fontSize: 40, fontWeight: '800' as const, color: Colors.white, letterSpacing: 1 },
  heroType: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  statusRow: { backgroundColor: Colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  statusSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: 12, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: Colors.border },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusSelectorText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  badgeRow: { flexDirection: 'row', gap: 10 },
  badgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  vipBadgeActive: { backgroundColor: Colors.vipGold + '12', borderColor: Colors.vipGold + '40' },
  priorityBadgeActive: { backgroundColor: Colors.priorityRed + '12', borderColor: Colors.priorityRed + '40' },
  badgeBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted },
  statusOptions: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  statusOptionActive: { backgroundColor: Colors.primarySoft },
  statusDotSmall: { width: 8, height: 8, borderRadius: 4 },
  statusOptionText: { fontSize: 14, color: Colors.text },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  clientCard: { backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.border },
  guestName: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  clientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  clientInfo: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  reservationStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  reservationStatus: { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' as const },
  pmsId: { fontSize: 10, color: Colors.textMuted, marginLeft: 'auto' },
  instructionsDisplay: { backgroundColor: Colors.surfaceLight, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  instructionsText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  instructionsPlaceholder: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' as const },
  instructionsInput: { backgroundColor: Colors.surfaceLight, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, color: Colors.text, fontSize: 13, minHeight: 80, textAlignVertical: 'top' as const },
  instructionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' as const },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' as const },
  cleaningCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: 14, borderRadius: 10, borderLeftWidth: 4, gap: 12 },
  cleaningEmoji: { fontSize: 22 },
  cleaningInfo: { flex: 1 },
  cleaningLabel: { fontSize: 14, fontWeight: '600' as const },
  cleaningAssignee: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  historyItem: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
  historyContent: { flex: 1 },
  historyAction: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  historyDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  historyMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  departureButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, paddingVertical: 14, backgroundColor: Colors.danger, borderRadius: 12 },
  departureButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
  qrContainer: { alignItems: 'center', paddingVertical: 16, gap: 10 },
  qrLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  qrHint: { fontSize: 12, color: Colors.textMuted },
});

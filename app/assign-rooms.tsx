import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { UserPlus, Check, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import { StaffMember } from '@/constants/types';

export default function AssignRoomsScreen() {
  const { roomIds } = useLocalSearchParams<{ roomIds: string }>();
  const router = useRouter();
  const { rooms, staff, bulkAssign } = useHotel();

  const selectedIds = useMemo(() => (roomIds ?? '').split(',').filter(Boolean), [roomIds]);
  const selectedRooms = useMemo(() => rooms.filter((r) => selectedIds.includes(r.id)), [rooms, selectedIds]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const handleAssign = useCallback(() => {
    if (!selectedStaffId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une femme de chambre.');
      return;
    }
    const staffMember = staff.find((s) => s.id === selectedStaffId);
    if (!staffMember) return;
    Alert.alert('Confirmer l\'assignation', `Assigner ${selectedIds.length} chambre(s) à ${staffMember.firstName} ${staffMember.lastName} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          bulkAssign({ roomIds: selectedIds, staffId: selectedStaffId });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  }, [selectedStaffId, selectedIds, staff, bulkAssign, router]);

  const renderStaffItem = useCallback(({ item }: { item: StaffMember }) => {
    const isSelected = selectedStaffId === item.id;
    const loadPercent = item.maxLoad > 0 ? (item.currentLoad / item.maxLoad) * 100 : 0;
    const loadColor = loadPercent > 80 ? Colors.danger : loadPercent > 50 ? Colors.warning : Colors.success;

    return (
      <TouchableOpacity
        style={[styles.staffCard, isSelected && styles.staffCardSelected]}
        onPress={() => setSelectedStaffId(item.id)}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={[styles.staffName, isSelected && styles.staffNameSelected]}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.loadRow}>
            <View style={styles.loadBarBg}>
              <View style={[styles.loadBarFill, { width: `${loadPercent}%`, backgroundColor: loadColor }]} />
            </View>
            <Text style={styles.loadText}>{item.currentLoad}/{item.maxLoad}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkCircle}>
            <Check size={14} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedStaffId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Assigner les chambres',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          presentation: 'modal',
        }}
      />
      <View style={styles.summaryBar}>
        <Users size={16} color={Colors.primary} />
        <Text style={styles.summaryText}>
          {selectedIds.length} chambre(s) : {selectedRooms.map((r) => r.roomNumber).join(', ')}
        </Text>
      </View>
      <Text style={styles.sectionTitle}>Femmes de chambre disponibles</Text>
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune femme de chambre disponible</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.assignBtn, !selectedStaffId && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={!selectedStaffId}
        >
          <UserPlus size={18} color={Colors.white} />
          <Text style={styles.assignBtnText}>Confirmer l&apos;assignation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.primarySoft, borderBottomWidth: 1, borderBottomColor: Colors.primary + '25' },
  summaryText: { fontSize: 13, color: Colors.primary, fontWeight: '500' as const, flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.border, gap: 12 },
  staffCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  avatarSelected: { backgroundColor: Colors.primary + '25' },
  avatarText: { fontSize: 15, fontWeight: '700' as const, color: Colors.textSecondary },
  avatarTextSelected: { color: Colors.primary },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 6 },
  staffNameSelected: { color: Colors.primary },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadBarBg: { flex: 1, height: 4, backgroundColor: Colors.surfaceLight, borderRadius: 2, overflow: 'hidden' },
  loadBarFill: { height: 4, borderRadius: 2 },
  loadText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const, minWidth: 30, textAlign: 'right' as const },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12 },
  assignBtnDisabled: { opacity: 0.4 },
  assignBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
});

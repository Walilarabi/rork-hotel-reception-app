import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RoomStatus, ClientBadge, ROOM_STATUS_CONFIG } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface FilterBarProps {
  statusFilter: RoomStatus | 'all';
  floorFilter: number | 'all';
  badgeFilter: ClientBadge | 'all';
  floors: number[];
  onStatusChange: (status: RoomStatus | 'all') => void;
  onFloorChange: (floor: number | 'all') => void;
  onBadgeChange: (badge: ClientBadge | 'all') => void;
}

const STATUS_OPTIONS: { value: RoomStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Tous', color: Colors.primary },
  { value: 'libre', label: 'Libre', color: ROOM_STATUS_CONFIG.libre.color },
  { value: 'occupe', label: 'Occupé', color: ROOM_STATUS_CONFIG.occupe.color },
  { value: 'depart', label: 'Départ', color: ROOM_STATUS_CONFIG.depart.color },
  { value: 'recouche', label: 'Recouche', color: ROOM_STATUS_CONFIG.recouche.color },
  { value: 'hors_service', label: 'H.S.', color: ROOM_STATUS_CONFIG.hors_service.color },
];

const BADGE_OPTIONS: { value: ClientBadge | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'vip', label: '⭐ VIP' },
  { value: 'prioritaire', label: '⚡ Prioritaire' },
];

function FilterBarComponent({
  statusFilter,
  floorFilter,
  badgeFilter,
  floors,
  onStatusChange,
  onFloorChange,
  onBadgeChange,
}: FilterBarProps) {
  const handlePress = useCallback((cb: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.filterGroup}>
          <Filter size={13} color={Colors.textMuted} />
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, isActive && { backgroundColor: opt.color + '18', borderColor: opt.color }]}
                onPress={() => handlePress(() => onStatusChange(opt.value))}
              >
                {opt.value !== 'all' && <View style={[styles.chipDot, { backgroundColor: opt.color }]} />}
                <Text style={[styles.chipText, isActive && { color: opt.color, fontWeight: '600' as const }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.chip, floorFilter === 'all' && styles.chipActive]}
          onPress={() => handlePress(() => onFloorChange('all'))}
        >
          <Text style={[styles.chipText, floorFilter === 'all' && styles.chipTextActive]}>Tous étages</Text>
        </TouchableOpacity>
        {floors.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, floorFilter === f && styles.chipActive]}
            onPress={() => handlePress(() => onFloorChange(f))}
          >
            <Text style={[styles.chipText, floorFilter === f && styles.chipTextActive]}>Ét. {f}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.divider} />
        {BADGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, badgeFilter === opt.value && styles.chipActive]}
            onPress={() => handlePress(() => onBadgeChange(opt.value))}
          >
            <Text style={[styles.chipText, badgeFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export const FilterBar = React.memo(FilterBarComponent);

const styles = StyleSheet.create({
  container: { paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  scrollContent: { paddingHorizontal: 14, gap: 6, flexDirection: 'row', alignItems: 'center' },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: 'transparent', gap: 5 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  divider: { width: 1, height: 20, backgroundColor: Colors.border, marginHorizontal: 2 },
});

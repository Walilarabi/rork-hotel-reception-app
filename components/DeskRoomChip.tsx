import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FT } from '@/constants/flowtym';
import { RoomStatus, CleaningStatus, ClientBadge } from '@/constants/types';

interface DeskRoomChipProps {
  roomNumber: string;
  status: RoomStatus;
  cleaningStatus: CleaningStatus;
  clientBadge: ClientBadge;
  assigneeInitials?: string;
  onPress?: () => void;
  selected?: boolean;
}

const STATUS_COLORS: Record<RoomStatus, string> = {
  libre: FT.roomGreen,
  occupe: FT.roomBlue,
  depart: FT.roomOrange,
  recouche: FT.roomTeal,
  hors_service: FT.roomGray,
};

const CLEANING_COLORS: Record<CleaningStatus, string | null> = {
  none: null,
  en_cours: FT.roomYellow,
  nettoyee: FT.roomGreen,
  validee: '#16A34A',
  refusee: FT.roomRed,
};

export default React.memo(function DeskRoomChip({
  roomNumber,
  status,
  cleaningStatus,
  clientBadge,
  assigneeInitials,
  onPress,
  selected,
}: DeskRoomChipProps) {
  const bgColor = STATUS_COLORS[status];
  const cleanColor = CLEANING_COLORS[cleaningStatus];

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: bgColor },
        selected && styles.chipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.number}>{roomNumber}</Text>
      {clientBadge === 'vip' && <Text style={styles.badge}>⭐</Text>}
      {clientBadge === 'prioritaire' && <Text style={styles.badge}>⚡</Text>}
      {cleanColor && (
        <View style={[styles.cleanDot, { backgroundColor: cleanColor }]}>
          {cleaningStatus === 'validee' && <Text style={styles.cleanIcon}>✓</Text>}
        </View>
      )}
      {assigneeInitials && (
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>{assigneeInitials}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: FT.chipRadius,
    gap: 4,
    minWidth: 56,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  number: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  badge: {
    fontSize: 9,
  },
  cleanDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cleanIcon: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  avatarMiniText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});

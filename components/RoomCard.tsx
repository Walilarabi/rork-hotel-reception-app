import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Room, ROOM_STATUS_CONFIG } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
}

function RoomCardComponent({ room, isSelected, onPress, onToggleSelect }: RoomCardProps) {
  const statusConfig = ROOM_STATUS_CONFIG[room.status];

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`room-card-${room.roomNumber}`}
    >
      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <Text style={styles.roomNumber}>{room.roomNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>
        <Text style={styles.roomType}>{room.roomType}</Text>
        {room.currentReservation && (
          <Text style={styles.guestName} numberOfLines={1}>{room.currentReservation.guestName}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const RoomCard = React.memo(RoomCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  cardContent: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  roomType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  guestName: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';

interface StatusCount {
  label: string;
  count: number;
  color: string;
}

interface DeskFloorSectionProps {
  floorNumber: number;
  statusCounts?: StatusCount[];
  children: React.ReactNode;
  onSelectAll?: () => void;
  allSelected?: boolean;
}

export default React.memo(function DeskFloorSection({
  floorNumber,
  statusCounts,
  children,
  onSelectAll,
  allSelected,
}: DeskFloorSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Étage {floorNumber}</Text>
          <ChevronDown size={14} color={FT.textMuted} />
        </View>
        {statusCounts && (
          <View style={styles.statusRow}>
            {statusCounts.map((s, i) => (
              <View key={i} style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                <Text style={styles.statusCount}>{s.count}</Text>
              </View>
            ))}
          </View>
        )}
        {onSelectAll && (
          <TouchableOpacity
            style={[styles.selectAll, allSelected && styles.selectAllActive]}
            onPress={onSelectAll}
            activeOpacity={0.7}
          >
            {allSelected && <Text style={styles.selectCheck}>✓</Text>}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    borderWidth: 1,
    borderColor: FT.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: FT.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: FT.textSec,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: FT.textMuted,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
  },
  selectAll: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: FT.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FT.surface,
  },
  selectAllActive: {
    backgroundColor: FT.brand,
    borderColor: FT.brand,
  },
  selectCheck: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
});

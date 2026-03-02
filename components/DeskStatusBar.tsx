import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FT } from '@/constants/flowtym';

interface StatusItem {
  label: string;
  count: number;
  color: string;
  sublabel?: string;
}

interface DeskStatusBarProps {
  items: StatusItem[];
  activeLabel?: string;
  onPress?: (label: string) => void;
}

export default React.memo(function DeskStatusBar({ items, activeLabel, onPress }: DeskStatusBarProps) {
  return (
    <View style={styles.container}>
      {items.map((item, i) => {
        const isActive = activeLabel === item.label;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => onPress?.(item.label)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.count, { color: item.color }]}>{item.count}</Text>
            {item.sublabel && <Text style={styles.sublabel}>{item.sublabel}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: FT.surfaceAlt,
    borderWidth: 1,
    borderColor: FT.border,
  },
  itemActive: {
    borderColor: FT.brand,
    backgroundColor: FT.brandSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: FT.textSec,
  },
  count: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  sublabel: {
    fontSize: 9,
    color: FT.textMuted,
  },
});

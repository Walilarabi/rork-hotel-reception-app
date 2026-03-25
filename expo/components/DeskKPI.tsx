import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { FT } from '@/constants/flowtym';

interface DeskKPIProps {
  value: number | string;
  label: string;
  color?: string;
  toggle?: boolean;
  onToggle?: (val: boolean) => void;
}

export default React.memo(function DeskKPI({ value, label, color = FT.brand, toggle, onToggle }: DeskKPIProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {toggle !== undefined && onToggle && (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: FT.border, true: color + '50' }}
          thumbColor={toggle ? color : '#f4f3f4'}
          style={styles.switch}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: FT.borderLight,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: '800' as const,
    minWidth: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: FT.textSec,
    flex: 1,
  },
  switch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
});

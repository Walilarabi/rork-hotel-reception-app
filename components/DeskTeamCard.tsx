import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Phone } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';

interface DeskTeamCardProps {
  name: string;
  details: string;
  metrics?: string;
  loadPercent: number;
  loadCurrent: number;
  loadMax: number;
  roomChips?: React.ReactNode;
  phone?: string;
}

export default React.memo(function DeskTeamCard({
  name,
  details,
  metrics,
  loadPercent,
  loadCurrent,
  loadMax,
  roomChips,
  phone,
}: DeskTeamCardProps) {
  const loadColor = loadPercent > 80 ? FT.danger : loadPercent > 50 ? FT.warning : FT.success;
  const initials = name.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.details}>{details}</Text>
          {metrics && <Text style={styles.metrics}>{metrics}</Text>}
        </View>
        <View style={styles.rightSection}>
          {phone ? (
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  Alert.alert(name, phone);
                } else {
                  Linking.openURL(`tel:${phone}`);
                }
              }}
              activeOpacity={0.7}
            >
              <Phone size={14} color={FT.brand} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.loadContainer}>
            <View style={styles.loadBarBg}>
              <View style={[styles.loadBarFill, { width: `${Math.min(100, loadPercent)}%`, backgroundColor: loadColor }]} />
            </View>
            <Text style={[styles.loadText, { color: loadColor }]}>{loadCurrent}/{loadMax}</Text>
          </View>
        </View>
      </View>
      {roomChips && <View style={styles.chipsRow}>{roomChips}</View>}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    borderWidth: 1,
    borderColor: FT.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: FT.brand,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: FT.text,
  },
  details: {
    fontSize: 11,
    color: FT.textMuted,
  },
  metrics: {
    fontSize: 10,
    color: FT.textSec,
    fontWeight: '500' as const,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadContainer: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 60,
  },
  loadBarBg: {
    width: 50,
    height: 4,
    backgroundColor: FT.bg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: 4,
    borderRadius: 2,
  },
  loadText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 4,
  },
});

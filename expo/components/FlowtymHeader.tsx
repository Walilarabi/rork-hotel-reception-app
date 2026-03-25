import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FT } from '@/constants/flowtym';

interface FlowtymHeaderProps {
  hotelName?: string;
  rightItems?: React.ReactNode;
  navItems?: { label: string; icon?: string; onPress?: () => void; badge?: number }[];
}

export default React.memo(function FlowtymHeader({ hotelName, rightItems, navItems }: FlowtymHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Text style={styles.brandBold}>FLOW</Text>
          <Text style={styles.brandLight}>TYM</Text>
          {hotelName ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.hotelName} numberOfLines={1}>{hotelName}</Text>
            </>
          ) : null}
        </View>
        {rightItems ? <View style={styles.rightItems}>{rightItems}</View> : null}
      </View>
      {navItems && navItems.length > 0 && (
        <View style={styles.navRow}>
          {navItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.navItem} onPress={item.onPress} activeOpacity={0.7}>
              {item.icon ? <Text style={styles.navIcon}>{item.icon}</Text> : null}
              <Text style={styles.navLabel}>{item.label}</Text>
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBold: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandLight: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: FT.brandLight,
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  hotelName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 140,
  },
  rightItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 12,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  navBadge: {
    backgroundColor: FT.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  navBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Database, RefreshCw } from 'lucide-react-native';
import { PMSSyncState } from '@/constants/types';
import { Colors } from '@/constants/colors';

interface PMSStatusIndicatorProps {
  syncState: PMSSyncState;
  isSyncing: boolean;
  onSync: () => void;
}

function PMSStatusIndicatorComponent({ syncState, isSyncing, onSync }: PMSStatusIndicatorProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isSyncing, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    if (isSyncing) return Colors.warning;
    switch (syncState.status) {
      case 'success': return Colors.success;
      case 'error': return Colors.danger;
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  const getLastSyncLabel = () => {
    if (isSyncing) return 'Sync...';
    if (syncState.lastSyncTime) {
      const d = new Date(syncState.lastSyncTime);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return 'PMS';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSync}
      disabled={isSyncing}
      testID="pms-sync-button"
    >
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Database size={12} color="rgba(255,255,255,0.8)" />
      <Text style={styles.label} numberOfLines={1}>
        {getLastSyncLabel()}
      </Text>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <RefreshCw size={10} color={isSyncing ? Colors.warning : 'rgba(255,255,255,0.5)'} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export const PMSStatusIndicator = React.memo(PMSStatusIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500' as const,
    maxWidth: 50,
    color: 'rgba(255,255,255,0.8)',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function OrderDetailScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Détail commande', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
      <View style={styles.content}>
        <Text style={styles.icon}>☕</Text>
        <Text style={styles.title}>Détail de la commande</Text>
        <Text style={styles.subtitle}>Fonctionnalité à venir</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
});

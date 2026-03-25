import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, Hash, Layers, BedDouble } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import { RoomType } from '@/constants/types';

const ROOM_TYPES: RoomType[] = ['Simple', 'Double', 'Suite', 'Deluxe', 'Familiale'];

export default function AddRoomScreen() {
  const router = useRouter();
  const { rooms, addRoom } = useHotel();

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Simple');

  const handleSubmit = useCallback(() => {
    if (!roomNumber.trim()) {
      Alert.alert('Erreur', 'Le numéro de chambre est obligatoire.');
      return;
    }
    if (!floor.trim() || isNaN(parseInt(floor, 10))) {
      Alert.alert('Erreur', "L'étage doit être un nombre valide.");
      return;
    }
    const exists = rooms.some((r) => r.roomNumber === roomNumber.trim());
    if (exists) {
      Alert.alert('Erreur', `La chambre ${roomNumber} existe déjà.`);
      return;
    }
    addRoom({ roomNumber: roomNumber.trim(), floor: parseInt(floor, 10), roomType, status: 'libre' });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Succès', `Chambre ${roomNumber} ajoutée avec succès.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [roomNumber, floor, roomType, rooms, addRoom, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nouvelle chambre',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <BedDouble size={32} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Ajouter une chambre</Text>
            <Text style={styles.headerSubtitle}>Renseignez les informations de la nouvelle chambre</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Numéro de chambre *</Text>
            <View style={styles.inputRow}>
              <Hash size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="Ex: 405"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                testID="room-number-input"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Étage *</Text>
            <View style={styles.inputRow}>
              <Layers size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={floor}
                onChangeText={setFloor}
                placeholder="Ex: 4"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                testID="floor-input"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type de chambre</Text>
            <View style={styles.typeGrid}>
              {ROOM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, roomType === type && styles.typeChipActive]}
                  onPress={() => setRoomType(type)}
                >
                  <Text style={[styles.typeChipText, roomType === type && styles.typeChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} testID="submit-room-btn">
            <Plus size={18} color={Colors.white} />
            <Text style={styles.submitBtnText}>Ajouter la chambre</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  iconHeader: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' as const },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 14 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  typeChipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12, marginTop: 12 },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
});

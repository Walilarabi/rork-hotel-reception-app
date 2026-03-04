import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Star, Send, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const REVIEW_COLORS = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  accent: '#6B5CE7',
  accentSoft: 'rgba(107,92,231,0.08)',
  starActive: '#F59E0B',
  starInactive: '#E2E8F0',
  success: '#10B981',
};

export default function ClientReviewScreen() {
  const params = useLocalSearchParams<{ type?: string; roomId?: string; hotelName?: string }>();
  const reviewType = params.type === 'breakfast' ? 'breakfast' : 'room';
  const hotelName = params.hotelName ?? 'FLOWTYM Hotel';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [roomNumber, setRoomNumber] = useState(params.roomId ?? '');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez sélectionner une note.');
      return;
    }
    console.log('[ClientReview] Submitting review:', { type: reviewType, rating, comment, roomNumber });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  }, [rating, comment, roomNumber, reviewType]);

  if (submitted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Merci pour votre avis !</Text>
          <Text style={styles.successSubtitle}>
            Votre retour nous aide à améliorer nos services.
          </Text>
          <View style={styles.successStars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={28}
                color={s <= rating ? REVIEW_COLORS.starActive : REVIEW_COLORS.starInactive}
                fill={s <= rating ? REVIEW_COLORS.starActive : 'transparent'}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandBold}>FLOW</Text>
            <Text style={styles.brandLight}>TYM</Text>
          </View>
          <Text style={styles.hotelName}>{hotelName}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MessageSquare size={24} color={REVIEW_COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>
            {reviewType === 'breakfast' ? 'Évaluez votre petit-déjeuner' : 'Évaluez votre séjour'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {reviewType === 'breakfast'
              ? 'Votre avis nous permet d\'améliorer notre service de petit-déjeuner.'
              : 'Partagez votre expérience pour nous aider à améliorer votre confort.'}
          </Text>

          <Text style={styles.sectionLabel}>Votre note</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setRating(s);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Star
                  size={36}
                  color={s <= rating ? REVIEW_COLORS.starActive : REVIEW_COLORS.starInactive}
                  fill={s <= rating ? REVIEW_COLORS.starActive : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 ? 'Décevant' : rating === 2 ? 'Moyen' : rating === 3 ? 'Bien' : rating === 4 ? 'Très bien' : 'Excellent'}
            </Text>
          )}

          {reviewType === 'room' && (
            <>
              <Text style={styles.sectionLabel}>Numéro de chambre (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 302"
                placeholderTextColor={REVIEW_COLORS.textMuted}
                value={roomNumber}
                onChangeText={setRoomNumber}
                keyboardType="number-pad"
              />
            </>
          )}

          <Text style={styles.sectionLabel}>Commentaire (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Partagez votre expérience..."
            placeholderTextColor={REVIEW_COLORS.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0}
            activeOpacity={0.7}
          >
            <Send size={16} color="#FFF" />
            <Text style={styles.submitBtnText}>Envoyer mon avis</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Propulsé par FLOWTYM</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: REVIEW_COLORS.bg },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandBold: { fontSize: 24, fontWeight: '900' as const, color: REVIEW_COLORS.accent, letterSpacing: -0.5 },
  brandLight: { fontSize: 24, fontWeight: '900' as const, color: REVIEW_COLORS.accent + '60', letterSpacing: -0.5 },
  hotelName: { fontSize: 14, color: REVIEW_COLORS.textSec, marginTop: 6, fontWeight: '500' as const },
  card: { marginHorizontal: 20, backgroundColor: REVIEW_COLORS.surface, borderRadius: 20, padding: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: REVIEW_COLORS.accentSoft, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' as const },
  cardTitle: { fontSize: 20, fontWeight: '700' as const, color: REVIEW_COLORS.text, textAlign: 'center' as const },
  cardSubtitle: { fontSize: 13, color: REVIEW_COLORS.textSec, textAlign: 'center' as const, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600' as const, color: REVIEW_COLORS.textSec, marginTop: 4 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 14, fontWeight: '600' as const, color: REVIEW_COLORS.starActive, textAlign: 'center' as const },
  input: { backgroundColor: REVIEW_COLORS.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: REVIEW_COLORS.text, borderWidth: 1, borderColor: REVIEW_COLORS.border },
  textArea: { minHeight: 100, paddingTop: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: REVIEW_COLORS.accent, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  footerText: { fontSize: 11, color: REVIEW_COLORS.textMuted, textAlign: 'center' as const, marginTop: 24 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: REVIEW_COLORS.accentSoft, justifyContent: 'center', alignItems: 'center' },
  successEmoji: { fontSize: 40 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: REVIEW_COLORS.text },
  successSubtitle: { fontSize: 14, color: REVIEW_COLORS.textSec, textAlign: 'center' as const },
  successStars: { flexDirection: 'row', gap: 4, marginTop: 8 },
});

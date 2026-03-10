import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Star, ChevronRight, ChevronLeft, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  ROOM_REVIEW_CATEGORIES,
  BREAKFAST_REVIEW_CATEGORIES,
  RoomReviewRatings,
  BreakfastReviewRatings,
  ReviewRecommendation,
} from '@/constants/types';
import { useSatisfaction } from '@/providers/SatisfactionProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  accent: '#6B5CE7',
  accentSoft: 'rgba(107,92,231,0.08)',
  accentDark: '#5145B5',
  starActive: '#F59E0B',
  starInactive: '#E2E8F0',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.08)',
  progressBg: '#E2E8F0',
};

const RATING_LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

type QuestionStep = {
  type: 'rating';
  key: string;
  label: string;
  icon: string;
} | {
  type: 'problem';
} | {
  type: 'comment';
} | {
  type: 'recommendation';
};

export default function ClientReviewScreen() {
  const params = useLocalSearchParams<{ type?: string; roomId?: string; roomNumber?: string; hotelName?: string; hotelId?: string }>();
  const reviewType = params.type === 'breakfast' ? 'breakfast' : 'room';
  const hotelName = params.hotelName ?? 'FLOWTYM Hotel';
  const hotelId = params.hotelId ?? 'hotel-1';
  const roomId = params.roomId ?? null;
  const prefilledRoom = params.roomNumber ?? '';

  const { addReview } = useSatisfaction();

  const categories = reviewType === 'room' ? ROOM_REVIEW_CATEGORIES : BREAKFAST_REVIEW_CATEGORIES;

  const steps: QuestionStep[] = useMemo(() => {
    const ratingSteps: QuestionStep[] = categories.map((cat) => ({
      type: 'rating' as const,
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
    }));
    if (reviewType === 'room') {
      return [...ratingSteps, { type: 'problem' }, { type: 'comment' }, { type: 'recommendation' }];
    }
    return [...ratingSteps, { type: 'comment' }, { type: 'recommendation' }];
  }, [categories, reviewType]);

  const totalSteps = steps.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasProblem, setHasProblem] = useState<boolean | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

  const animateTransition = useCallback((direction: 'next' | 'prev', callback: () => void) => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [slideAnim, fadeAnim]);

  const canGoNext = useCallback(() => {
    const step = steps[currentStep];
    if (step.type === 'rating') return (ratings[step.key] ?? 0) > 0;
    if (step.type === 'problem') return hasProblem !== null;
    if (step.type === 'recommendation') return recommendation !== null;
    return true;
  }, [currentStep, steps, ratings, hasProblem, recommendation]);

  const goNext = useCallback(() => {
    if (!canGoNext()) return;
    if (currentStep < totalSteps - 1) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition('next', () => setCurrentStep((s) => s + 1));
    }
  }, [currentStep, totalSteps, canGoNext, animateTransition]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      animateTransition('prev', () => setCurrentStep((s) => s - 1));
    }
  }, [currentStep, animateTransition]);

  const handleSetRating = useCallback((key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmit = useCallback(async () => {
    let reviewRatings: RoomReviewRatings | BreakfastReviewRatings;

    if (reviewType === 'room') {
      reviewRatings = {
        cleanliness: ratings.cleanliness ?? 0,
        bedComfort: ratings.bedComfort ?? 0,
        equipment: ratings.equipment ?? 0,
        bathroom: ratings.bathroom ?? 0,
        quietness: ratings.quietness ?? 0,
        temperature: ratings.temperature ?? 0,
        overall: ratings.overall ?? 0,
      };
    } else {
      reviewRatings = {
        overallQuality: ratings.overallQuality ?? 0,
        variety: ratings.variety ?? 0,
        freshness: ratings.freshness ?? 0,
        presentation: ratings.presentation ?? 0,
        cleanliness: ratings.cleanliness ?? 0,
        availability: ratings.availability ?? 0,
        serviceQuality: ratings.serviceQuality ?? 0,
        valueForMoney: ratings.valueForMoney ?? 0,
        overallSatisfaction: ratings.overallSatisfaction ?? 0,
      };
    }

    try {
      await addReview({
        hotelId,
        type: reviewType,
        roomId,
        roomNumber: prefilledRoom || null,
        ratings: reviewRatings,
        hasProblem: hasProblem ?? false,
        problemDescription,
        comment,
        recommendation: recommendation ?? 'maybe',
      });
      console.log('[ClientReview] Review submitted successfully');
    } catch (e) {
      console.log('[ClientReview] Error submitting review:', e);
    }

    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  }, [reviewType, ratings, hasProblem, problemDescription, comment, recommendation, addReview, hotelId, roomId, prefilledRoom]);

  if (submitted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successEmoji}>🙏</Text>
          </View>
          <Text style={styles.successTitle}>Merci pour votre avis !</Text>
          <Text style={styles.successSubtitle}>
            Votre retour nous aide à améliorer{'\n'}votre expérience.
          </Text>
          <View style={styles.successStars}>
            {[1, 2, 3, 4, 5].map((s) => {
              const avg = Object.values(ratings).length > 0
                ? Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length
                : 0;
              return (
                <Star
                  key={s}
                  size={24}
                  color={s <= Math.round(avg) ? C.starActive : C.starInactive}
                  fill={s <= Math.round(avg) ? C.starActive : 'transparent'}
                />
              );
            })}
          </View>
          <Text style={styles.successFooter}>Propulsé par FLOWTYM</Text>
        </View>
      </View>
    );
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const renderStarRating = (key: string) => {
    const value = ratings[key] ?? 0;
    return (
      <View style={styles.starsContainer}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleSetRating(key, s)}
              activeOpacity={0.7}
              style={styles.starBtn}
            >
              <Star
                size={44}
                color={s <= value ? C.starActive : C.starInactive}
                fill={s <= value ? C.starActive : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {value > 0 && (
          <Text style={styles.ratingLabel}>{RATING_LABELS[value]}</Text>
        )}
      </View>
    );
  };

  const renderCurrentStep = () => {
    if (step.type === 'rating') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionIcon}>{step.icon}</Text>
          <Text style={styles.questionLabel}>{step.label}</Text>
          {renderStarRating(step.key)}
        </View>
      );
    }

    if (step.type === 'problem') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionIcon}>🔧</Text>
          <Text style={styles.questionLabel}>Avez-vous rencontré un problème ?</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionBtn, hasProblem === true && styles.optionBtnActive]}
              onPress={() => { setHasProblem(true); if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionBtnText, hasProblem === true && styles.optionBtnTextActive]}>Oui</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, hasProblem === false && styles.optionBtnActiveGreen]}
              onPress={() => { setHasProblem(false); setProblemDescription(''); if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionBtnText, hasProblem === false && styles.optionBtnTextActiveGreen]}>Non</Text>
            </TouchableOpacity>
          </View>
          {hasProblem && (
            <TextInput
              style={styles.textArea}
              placeholder="Pouvez-vous nous préciser le problème ?"
              placeholderTextColor={C.textMuted}
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        </View>
      );
    }

    if (step.type === 'comment') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionIcon}>💬</Text>
          <Text style={styles.questionLabel}>Un commentaire ou une suggestion ?</Text>
          <Text style={styles.questionHint}>Optionnel</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Partagez votre expérience..."
            placeholderTextColor={C.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      );
    }

    if (step.type === 'recommendation') {
      const options: { value: ReviewRecommendation; label: string; icon: string; color: string }[] = [
        { value: 'yes', label: 'Oui certainement', icon: '👍', color: '#22C55E' },
        { value: 'maybe', label: 'Peut-être', icon: '🤔', color: '#F59E0B' },
        { value: 'no', label: 'Non', icon: '👎', color: '#EF4444' },
      ];

      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionIcon}>❤️</Text>
          <Text style={styles.questionLabel}>
            {reviewType === 'breakfast' ? 'Recommanderiez-vous notre petit déjeuner ?' : 'Recommanderiez-vous cet hôtel ?'}
          </Text>
          <View style={styles.recommendOptions}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.recommendBtn,
                  recommendation === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '10' },
                ]}
                onPress={() => { setRecommendation(opt.value); if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.7}
              >
                <Text style={styles.recommendIcon}>{opt.icon}</Text>
                <Text style={[styles.recommendLabel, recommendation === opt.value && { color: opt.color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandBold}>FLOW</Text>
          <Text style={styles.brandLight}>TYM</Text>
        </View>
        <Text style={styles.hotelLabel}>{hotelName}</Text>
        {prefilledRoom ? (
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>Chambre {prefilledRoom}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{currentStep + 1} / {totalSteps}</Text>

      <Animated.View
        style={[
          styles.contentArea,
          { transform: [{ translateX: slideAnim }], opacity: fadeAnim },
        ]}
      >
        {renderCurrentStep()}
      </Animated.View>

      <View style={styles.navBar}>
        {currentStep > 0 ? (
          <TouchableOpacity style={styles.navBtnBack} onPress={goPrev} activeOpacity={0.7}>
            <ChevronLeft size={20} color={C.textSec} />
            <Text style={styles.navBtnBackText}>Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtnBack} />
        )}

        {isLastStep ? (
          <TouchableOpacity
            style={[styles.navBtnSubmit, !canGoNext() && styles.navBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canGoNext()}
            activeOpacity={0.7}
          >
            <Send size={16} color="#FFF" />
            <Text style={styles.navBtnSubmitText}>Envoyer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtnNext, !canGoNext() && styles.navBtnDisabled]}
            onPress={goNext}
            disabled={!canGoNext()}
            activeOpacity={0.7}
          >
            <Text style={styles.navBtnNextText}>Suivant</Text>
            <ChevronRight size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: { alignItems: 'center', paddingTop: 56, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandBold: { fontSize: 20, fontWeight: '900' as const, color: C.accent, letterSpacing: -0.5 },
  brandLight: { fontSize: 20, fontWeight: '900' as const, color: C.accent + '50', letterSpacing: -0.5 },
  hotelLabel: { fontSize: 12, color: C.textSec, marginTop: 4, fontWeight: '500' as const },
  roomBadge: { marginTop: 6, backgroundColor: C.accentSoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  roomBadgeText: { fontSize: 11, fontWeight: '600' as const, color: C.accent },
  progressContainer: { height: 4, backgroundColor: C.progressBg, marginHorizontal: 24, borderRadius: 2, overflow: 'hidden', marginTop: 12 },
  progressBar: { height: 4, backgroundColor: C.accent, borderRadius: 2 },
  progressText: { fontSize: 11, color: C.textMuted, textAlign: 'center' as const, marginTop: 6, fontWeight: '600' as const },
  contentArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  questionContainer: { alignItems: 'center', gap: 16 },
  questionIcon: { fontSize: 48 },
  questionLabel: { fontSize: 20, fontWeight: '700' as const, color: C.text, textAlign: 'center' as const, lineHeight: 28 },
  questionHint: { fontSize: 13, color: C.textMuted },
  starsContainer: { alignItems: 'center', gap: 12, marginTop: 8 },
  starsRow: { flexDirection: 'row', gap: 10 },
  starBtn: { padding: 6 },
  ratingLabel: { fontSize: 16, fontWeight: '700' as const, color: C.starActive },
  optionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  optionBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface },
  optionBtnActive: { borderColor: '#EF4444', backgroundColor: '#EF444410' },
  optionBtnActiveGreen: { borderColor: '#22C55E', backgroundColor: '#22C55E10' },
  optionBtnText: { fontSize: 16, fontWeight: '700' as const, color: C.textSec },
  optionBtnTextActive: { color: '#EF4444' },
  optionBtnTextActiveGreen: { color: '#22C55E' },
  textArea: { width: '100%', minHeight: 120, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginTop: 8 },
  recommendOptions: { width: '100%', gap: 10, marginTop: 8 },
  recommendBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface },
  recommendIcon: { fontSize: 24 },
  recommendLabel: { fontSize: 16, fontWeight: '600' as const, color: C.text },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 36, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  navBtnBack: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 80 },
  navBtnBackText: { fontSize: 14, fontWeight: '600' as const, color: C.textSec },
  navBtnNext: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  navBtnNextText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  navBtnSubmit: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.success, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  navBtnSubmitText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  navBtnDisabled: { opacity: 0.4 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  successIconCircle: { width: 88, height: 88, borderRadius: 28, backgroundColor: C.successSoft, justifyContent: 'center', alignItems: 'center' },
  successEmoji: { fontSize: 44 },
  successTitle: { fontSize: 24, fontWeight: '800' as const, color: C.text },
  successSubtitle: { fontSize: 15, color: C.textSec, textAlign: 'center' as const, lineHeight: 22 },
  successStars: { flexDirection: 'row', gap: 6, marginTop: 8 },
  successFooter: { fontSize: 11, color: C.textMuted, marginTop: 32 },
});

import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  ClientReview,
  QualityAlert,
  RecurringIssue,
  RoomReviewRatings,
  BreakfastReviewRatings,
  ROOM_REVIEW_CATEGORIES,
} from '@/constants/types';
import { INITIAL_REVIEWS, INITIAL_QUALITY_ALERTS, INITIAL_RECURRING_ISSUES } from '@/mocks/satisfaction';

const REVIEWS_KEY = 'hotel_reviews_v1';
const ALERTS_KEY = 'hotel_quality_alerts_v1';
const ISSUES_KEY = 'hotel_recurring_issues_v1';

export const [SatisfactionProvider, useSatisfaction] = createContextHook(() => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [recurringIssues, setRecurringIssues] = useState<RecurringIssue[]>([]);

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(REVIEWS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ClientReview[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[SatisfactionProvider] Error reading reviews:', e);
        await AsyncStorage.removeItem(REVIEWS_KEY);
      }
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['qualityAlerts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ALERTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as QualityAlert[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[SatisfactionProvider] Error reading alerts:', e);
        await AsyncStorage.removeItem(ALERTS_KEY);
      }
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(INITIAL_QUALITY_ALERTS));
      return INITIAL_QUALITY_ALERTS;
    },
  });

  const issuesQuery = useQuery({
    queryKey: ['recurringIssues'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ISSUES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RecurringIssue[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[SatisfactionProvider] Error reading issues:', e);
        await AsyncStorage.removeItem(ISSUES_KEY);
      }
      await AsyncStorage.setItem(ISSUES_KEY, JSON.stringify(INITIAL_RECURRING_ISSUES));
      return INITIAL_RECURRING_ISSUES;
    },
  });

  useEffect(() => { if (reviewsQuery.data) setReviews(reviewsQuery.data); }, [reviewsQuery.data]);
  useEffect(() => { if (alertsQuery.data) setAlerts(alertsQuery.data); }, [alertsQuery.data]);
  useEffect(() => { if (issuesQuery.data) setRecurringIssues(issuesQuery.data); }, [issuesQuery.data]);

  const persistReviews = useCallback(async (updated: ClientReview[]) => {
    setReviews(updated);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  }, []);

  const persistAlerts = useCallback(async (updated: QualityAlert[]) => {
    setAlerts(updated);
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  }, []);

  const persistIssues = useCallback(async (updated: RecurringIssue[]) => {
    setRecurringIssues(updated);
    await AsyncStorage.setItem(ISSUES_KEY, JSON.stringify(updated));
  }, []);

  const checkAndCreateAlerts = useCallback(async (review: ClientReview) => {
    const newAlerts: QualityAlert[] = [];
    const ratings = review.ratings;

    if (review.type === 'room') {
      const roomRatings = ratings as RoomReviewRatings;
      const categoryMap: Record<string, string> = {
        cleanliness: 'Propreté',
        bedComfort: 'Literie',
        equipment: 'Équipements',
        bathroom: 'Salle de bain',
        quietness: 'Insonorisation',
        temperature: 'Température',
        overall: 'Satisfaction globale',
      };
      for (const [key, label] of Object.entries(categoryMap)) {
        const score = roomRatings[key as keyof RoomReviewRatings];
        if (score <= 3) {
          newAlerts.push({
            id: `alert-${Date.now()}-${key}`,
            hotelId: review.hotelId,
            roomId: review.roomId,
            roomNumber: review.roomNumber,
            reviewId: review.id,
            category: label,
            score,
            clientComment: review.problemDescription || review.comment,
            status: 'active',
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            resolvedBy: null,
          });
        }
      }
    } else {
      const bfRatings = ratings as BreakfastReviewRatings;
      const categoryMap: Record<string, string> = {
        overallQuality: 'Qualité globale',
        variety: 'Variété',
        freshness: 'Fraîcheur',
        presentation: 'Présentation',
        cleanliness: 'Propreté salle',
        availability: 'Disponibilité',
        serviceQuality: 'Service',
        valueForMoney: 'Rapport qualité/prix',
        overallSatisfaction: 'Satisfaction',
      };
      for (const [key, label] of Object.entries(categoryMap)) {
        const score = bfRatings[key as keyof BreakfastReviewRatings];
        if (score <= 3) {
          newAlerts.push({
            id: `alert-${Date.now()}-${key}`,
            hotelId: review.hotelId,
            roomId: null,
            roomNumber: null,
            reviewId: review.id,
            category: `PDJ - ${label}`,
            score,
            clientComment: review.comment,
            status: 'active',
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            resolvedBy: null,
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      await persistAlerts([...alerts, ...newAlerts]);
    }

    if (review.type === 'room' && review.roomId) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRoomReviews = [...reviews, review].filter(
        (r) => r.type === 'room' && r.roomId === review.roomId && new Date(r.createdAt) >= sevenDaysAgo
      );

      const lowCleanlinessCount = recentRoomReviews.filter((r) => {
        const rr = r.ratings as RoomReviewRatings;
        return rr.cleanliness <= 3;
      }).length;

      if (lowCleanlinessCount >= 3) {
        const existingIssue = recurringIssues.find(
          (ri) => ri.roomId === review.roomId && ri.category === 'Propreté' && ri.status === 'active'
        );
        if (!existingIssue) {
          const avgScore = recentRoomReviews.reduce((sum, r) => sum + (r.ratings as RoomReviewRatings).cleanliness, 0) / recentRoomReviews.length;
          const newIssue: RecurringIssue = {
            id: `ri-${Date.now()}`,
            hotelId: review.hotelId,
            roomId: review.roomId,
            roomNumber: review.roomNumber ?? '',
            category: 'Propreté',
            occurrences: lowCleanlinessCount,
            periodDays: 7,
            averageScore: Math.round(avgScore * 10) / 10,
            status: 'active',
            detectedAt: new Date().toISOString(),
            resolvedAt: null,
          };
          await persistIssues([...recurringIssues, newIssue]);
        }
      }
    }
  }, [alerts, reviews, recurringIssues, persistAlerts, persistIssues]);

  const addReviewMutation = useMutation({
    mutationFn: async (review: Omit<ClientReview, 'id' | 'createdAt'>) => {
      const newReview: ClientReview = {
        ...review,
        id: `rev-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...reviews, newReview];
      await persistReviews(updated);
      await checkAndCreateAlerts(newReview);
      console.log('[SatisfactionProvider] Review added:', newReview.id);
      return newReview;
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (params: { alertId: string; resolvedBy: string }) => {
      const updated = alerts.map((a) =>
        a.id === params.alertId
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolvedBy: params.resolvedBy }
          : a
      );
      await persistAlerts(updated);
    },
  });

  const resolveIssueMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const updated = recurringIssues.map((ri) =>
        ri.id === issueId ? { ...ri, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : ri
      );
      await persistIssues(updated);
    },
  });

  const roomReviews = useMemo(() => reviews.filter((r) => r.type === 'room'), [reviews]);
  const breakfastReviews = useMemo(() => reviews.filter((r) => r.type === 'breakfast'), [reviews]);
  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const activeIssues = useMemo(() => recurringIssues.filter((ri) => ri.status === 'active'), [recurringIssues]);

  const globalScore = useMemo(() => {
    if (reviews.length === 0) return 0;
    let totalSum = 0;
    let totalCount = 0;
    for (const review of reviews) {
      const vals = Object.values(review.ratings) as number[];
      totalSum += vals.reduce((s, v) => s + v, 0);
      totalCount += vals.length;
    }
    return totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 0;
  }, [reviews]);

  const categoryAverages = useMemo(() => {
    const roomAvg: Record<string, number> = {};
    if (roomReviews.length > 0) {
      for (const cat of ROOM_REVIEW_CATEGORIES) {
        const sum = roomReviews.reduce((s, r) => s + ((r.ratings as RoomReviewRatings)[cat.key] ?? 0), 0);
        roomAvg[cat.key] = Math.round((sum / roomReviews.length) * 10) / 10;
      }
    }
    return roomAvg;
  }, [roomReviews]);

  const roomScores = useMemo(() => {
    const scores: Record<string, { roomNumber: string; avgScore: number; reviewCount: number }> = {};
    for (const review of roomReviews) {
      if (!review.roomNumber) continue;
      const key = review.roomNumber;
      if (!scores[key]) scores[key] = { roomNumber: key, avgScore: 0, reviewCount: 0 };
      const vals = Object.values(review.ratings) as number[];
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      scores[key].avgScore = (scores[key].avgScore * scores[key].reviewCount + avg) / (scores[key].reviewCount + 1);
      scores[key].reviewCount++;
    }
    for (const key of Object.keys(scores)) {
      scores[key].avgScore = Math.round(scores[key].avgScore * 10) / 10;
    }
    return Object.values(scores).sort((a, b) => b.avgScore - a.avgScore);
  }, [roomReviews]);

  return useMemo(() => ({
    reviews,
    alerts,
    recurringIssues,
    roomReviews,
    breakfastReviews,
    activeAlerts,
    activeIssues,
    globalScore,
    categoryAverages,
    roomScores,
    isLoading: reviewsQuery.isLoading,
    addReview: addReviewMutation.mutateAsync,
    isAddingReview: addReviewMutation.isPending,
    resolveAlert: resolveAlertMutation.mutate,
    resolveIssue: resolveIssueMutation.mutate,
  }), [
    reviews, alerts, recurringIssues, roomReviews, breakfastReviews,
    activeAlerts, activeIssues, globalScore, categoryAverages, roomScores,
    reviewsQuery.isLoading, addReviewMutation.mutateAsync, addReviewMutation.isPending,
    resolveAlertMutation.mutate, resolveIssueMutation.mutate,
  ]);
});

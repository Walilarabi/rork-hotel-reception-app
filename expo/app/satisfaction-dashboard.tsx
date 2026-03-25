import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Star,
  AlertTriangle,
  Check,
  Download,
  BedDouble,
  Coffee,
  Shield,
  BarChart3,
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSatisfaction } from '@/providers/SatisfactionProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  ROOM_REVIEW_CATEGORIES,
  BREAKFAST_REVIEW_CATEGORIES,
  BreakfastReviewRatings,
  RECOMMENDATION_CONFIG,
  ClientReview,
} from '@/constants/types';
import { FT } from '@/constants/flowtym';

type TabId = 'overview' | 'rooms' | 'breakfast' | 'alerts';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Vue globale', icon: <BarChart3 size={14} color={FT.brand} /> },
  { id: 'rooms', label: 'Chambres', icon: <BedDouble size={14} color={FT.teal} /> },
  { id: 'breakfast', label: 'PDJ', icon: <Coffee size={14} color={FT.orange} /> },
  { id: 'alerts', label: 'Alertes', icon: <AlertTriangle size={14} color={FT.danger} /> },
];

function ScoreCircle({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const color = score >= 4 ? FT.success : score >= 3 ? FT.warning : FT.danger;
  return (
    <View style={[styles.scoreCircle, { width: size, height: size, borderColor: color + '30' }]}>
      <Text style={[styles.scoreValue, { color, fontSize: size * 0.32 }]}>{score.toFixed(1)}</Text>
      <Text style={styles.scoreMax}>/5</Text>
      {label && <Text style={styles.scoreLabel}>{label}</Text>}
    </View>
  );
}

function CategoryBar({ label, icon, score }: { label: string; icon: string; score: number }) {
  const color = score >= 4 ? FT.success : score >= 3 ? FT.warning : FT.danger;
  const pct = (score / 5) * 100;
  return (
    <View style={styles.catBarRow}>
      <Text style={styles.catBarIcon}>{icon}</Text>
      <View style={styles.catBarInfo}>
        <View style={styles.catBarTop}>
          <Text style={styles.catBarLabel}>{label}</Text>
          <Text style={[styles.catBarScore, { color }]}>{score.toFixed(1)}</Text>
        </View>
        <View style={styles.catBarTrack}>
          <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

export default function SatisfactionDashboardScreen() {
  const { currentUser } = useAuth();
  const {
    reviews,
    roomReviews,
    breakfastReviews,
    activeAlerts,
    activeIssues,
    globalScore,
    categoryAverages,
    roomScores,
    resolveAlert,
    resolveIssue,
  } = useSatisfaction();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const breakfastAverages = useMemo(() => {
    const avg: Record<string, number> = {};
    if (breakfastReviews.length > 0) {
      for (const cat of BREAKFAST_REVIEW_CATEGORIES) {
        const sum = breakfastReviews.reduce(
          (s, r) => s + ((r.ratings as BreakfastReviewRatings)[cat.key] ?? 0), 0
        );
        avg[cat.key] = Math.round((sum / breakfastReviews.length) * 10) / 10;
      }
    }
    return avg;
  }, [breakfastReviews]);

  const recommendStats = useMemo(() => {
    const stats = { yes: 0, maybe: 0, no: 0 };
    for (const r of reviews) {
      stats[r.recommendation]++;
    }
    return stats;
  }, [reviews]);

  const recentReviews = useMemo(
    () => [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [reviews]
  );

  const handleResolveAlert = useCallback((alertId: string) => {
    const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin';
    resolveAlert({ alertId, resolvedBy: userName });
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [resolveAlert, currentUser]);

  const handleResolveIssue = useCallback((issueId: string) => {
    resolveIssue(issueId);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [resolveIssue]);

  const handleExport = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Export des données',
      `${reviews.length} avis seront exportés.\n\nFormats disponibles :\n• CSV\n• Excel\n\nDonnées incluses :\n• Date\n• Chambre\n• Notes par catégorie\n• Commentaires clients`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Export CSV', onPress: () => Alert.alert('Export', 'Fichier CSV généré avec succès.') },
        { text: 'Export Excel', onPress: () => Alert.alert('Export', 'Fichier Excel généré avec succès.') },
      ]
    );
  }, [reviews.length]);

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }, []);

  const getAvgScore = useCallback((review: ClientReview) => {
    const vals = Object.values(review.ratings) as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, []);

  const renderOverview = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
      <View style={styles.scoreHeader}>
        <ScoreCircle score={globalScore} size={100} />
        <View style={styles.scoreHeaderInfo}>
          <Text style={styles.scoreHeaderTitle}>Satisfaction globale</Text>
          <Text style={styles.scoreHeaderCount}>{reviews.length} avis collectés</Text>
          <View style={styles.recommendRow}>
            {(['yes', 'maybe', 'no'] as const).map((key) => (
              <View key={key} style={[styles.recommendChip, { backgroundColor: RECOMMENDATION_CONFIG[key].color + '12' }]}>
                <Text style={styles.recommendChipIcon}>{RECOMMENDATION_CONFIG[key].icon}</Text>
                <Text style={[styles.recommendChipCount, { color: RECOMMENDATION_CONFIG[key].color }]}>
                  {recommendStats[key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {activeAlerts.length > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={16} color={FT.danger} />
          <Text style={styles.alertBannerText}>{activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} qualité en cours</Text>
          <TouchableOpacity onPress={() => setActiveTab('alerts')}>
            <Text style={styles.alertBannerLink}>Voir</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeIssues.length > 0 && (
        <View style={styles.issueBanner}>
          <Shield size={16} color={FT.warning} />
          <Text style={styles.issueBannerText}>{activeIssues.length} problème{activeIssues.length > 1 ? 's' : ''} récurrent{activeIssues.length > 1 ? 's' : ''}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score par catégorie — Chambres</Text>
        <View style={styles.card}>
          {ROOM_REVIEW_CATEGORIES.map((cat) => (
            <CategoryBar
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              score={categoryAverages[cat.key] ?? 0}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classement par chambre</Text>
        <View style={styles.card}>
          {roomScores.slice(0, 8).map((rs, idx) => {
            const isLow = rs.avgScore < 3;
            return (
              <View key={rs.roomNumber} style={styles.roomScoreRow}>
                <Text style={styles.roomScoreRank}>#{idx + 1}</Text>
                <View style={styles.roomScoreInfo}>
                  <Text style={styles.roomScoreNumber}>Chambre {rs.roomNumber}</Text>
                  <Text style={styles.roomScoreCount}>{rs.reviewCount} avis</Text>
                </View>
                <View style={styles.roomScoreRight}>
                  <Text style={[styles.roomScoreValue, isLow && styles.roomScoreLow]}>
                    {rs.avgScore.toFixed(1)}
                  </Text>
                  {isLow && <AlertTriangle size={12} color={FT.danger} />}
                </View>
              </View>
            );
          })}
          {roomScores.length === 0 && (
            <Text style={styles.emptyText}>Aucun avis chambre</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Derniers avis</Text>
        {recentReviews.map((review) => {
          const avg = getAvgScore(review);
          return (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewTypeBadge}>
                  <Text style={styles.reviewTypeBadgeText}>
                    {review.type === 'room' ? `🛏️ ${review.roomNumber ?? ''}` : '☕ PDJ'}
                  </Text>
                </View>
                <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
              </View>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    color={s <= Math.round(avg) ? '#F59E0B' : '#E2E8F0'}
                    fill={s <= Math.round(avg) ? '#F59E0B' : 'transparent'}
                  />
                ))}
                <Text style={styles.reviewAvg}>{avg.toFixed(1)}</Text>
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment} numberOfLines={2}>
                  {review.comment}
                </Text>
              ) : null}
              {review.hasProblem && (
                <View style={styles.reviewProblem}>
                  <AlertTriangle size={12} color={FT.danger} />
                  <Text style={styles.reviewProblemText} numberOfLines={1}>
                    {review.problemDescription || 'Problème signalé'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
        <Download size={16} color={FT.brand} />
        <Text style={styles.exportBtnText}>Exporter les données</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRoomsTab = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabHeaderTitle}>Satisfaction Chambres</Text>
        <Text style={styles.tabHeaderCount}>{roomReviews.length} avis</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          {ROOM_REVIEW_CATEGORIES.map((cat) => (
            <CategoryBar
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              score={categoryAverages[cat.key] ?? 0}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail par chambre</Text>
        {roomScores.map((rs) => {
          const isLow = rs.avgScore < 3;
          const color = rs.avgScore >= 4 ? FT.success : rs.avgScore >= 3 ? FT.warning : FT.danger;
          return (
            <View key={rs.roomNumber} style={[styles.roomDetailCard, isLow && { borderColor: FT.danger + '30' }]}>
              <View style={styles.roomDetailLeft}>
                <View style={[styles.roomDetailBadge, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.roomDetailNumber, { color }]}>{rs.roomNumber}</Text>
                </View>
                <View>
                  <Text style={styles.roomDetailTitle}>Chambre {rs.roomNumber}</Text>
                  <Text style={styles.roomDetailSub}>{rs.reviewCount} avis</Text>
                </View>
              </View>
              <View style={styles.roomDetailRight}>
                <Text style={[styles.roomDetailScore, { color }]}>{rs.avgScore.toFixed(1)}</Text>
                {isLow && <AlertTriangle size={14} color={FT.danger} />}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderBreakfastTab = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabHeaderTitle}>Satisfaction Petit-déjeuner</Text>
        <Text style={styles.tabHeaderCount}>{breakfastReviews.length} avis</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          {BREAKFAST_REVIEW_CATEGORIES.map((cat) => (
            <CategoryBar
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              score={breakfastAverages[cat.key] ?? 0}
            />
          ))}
        </View>
      </View>

      {breakfastReviews.length === 0 && (
        <View style={styles.emptyState}>
          <Coffee size={40} color={FT.textMuted} />
          <Text style={styles.emptyStateText}>Aucun avis petit-déjeuner</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderAlertsTab = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
      {activeAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alertes qualité en cours</Text>
          {activeAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <View style={styles.alertScoreBadge}>
                  <Text style={styles.alertScoreText}>{alert.score}/5</Text>
                </View>
                <View style={styles.alertCardInfo}>
                  <Text style={styles.alertCardTitle}>
                    {alert.roomNumber ? `Chambre ${alert.roomNumber}` : 'Petit-déjeuner'} — {alert.category}
                  </Text>
                  <Text style={styles.alertCardDate}>{formatDate(alert.createdAt)}</Text>
                </View>
              </View>
              {alert.clientComment ? (
                <View style={styles.alertCommentBox}>
                  <MessageSquare size={12} color={FT.textMuted} />
                  <Text style={styles.alertCommentText} numberOfLines={2}>{alert.clientComment}</Text>
                </View>
              ) : null}
              <View style={styles.alertCardFooter}>
                <Text style={styles.alertRecommended}>
                  Action recommandée : Vérification {alert.category.toLowerCase()} immédiate
                </Text>
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => handleResolveAlert(alert.id)}
                  activeOpacity={0.7}
                >
                  <Check size={14} color="#FFF" />
                  <Text style={styles.resolveBtnText}>Résolu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeIssues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Problèmes récurrents</Text>
          {activeIssues.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.issueCardHeader}>
                <View style={styles.issueIconCircle}>
                  <AlertTriangle size={16} color={FT.danger} />
                </View>
                <View style={styles.issueCardInfo}>
                  <Text style={styles.issueCardTitle}>Chambre {issue.roomNumber}</Text>
                  <Text style={styles.issueCardSub}>
                    {issue.occurrences} avis négatifs sur {issue.category} en {issue.periodDays}j
                  </Text>
                </View>
                <Text style={[styles.issueScore, { color: FT.danger }]}>{issue.averageScore}/5</Text>
              </View>
              <Text style={styles.issueRecommended}>
                Action recommandée : Inspection de la chambre par le responsable housekeeping
              </Text>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => handleResolveIssue(issue.id)}
                activeOpacity={0.7}
              >
                <Check size={14} color="#FFF" />
                <Text style={styles.resolveBtnText}>Marquer comme résolu</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {activeAlerts.length === 0 && activeIssues.length === 0 && (
        <View style={styles.emptyState}>
          <Check size={48} color={FT.success} />
          <Text style={styles.emptyStateText}>Aucune alerte active</Text>
          <Text style={styles.emptyStateSub}>Toutes les alertes ont été résolues.</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Satisfaction Clients', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF' }} />

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasAlerts = tab.id === 'alerts' && activeAlerts.length > 0;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <Text style={[styles.tabItemLabel, isActive && styles.tabItemLabelActive]}>{tab.label}</Text>
                {hasAlerts && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{activeAlerts.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'rooms' && renderRoomsTab()}
      {activeTab === 'breakfast' && renderBreakfastTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  tabBar: { backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: FT.surfaceAlt },
  tabItemActive: { backgroundColor: FT.brandSoft },
  tabItemLabel: { fontSize: 12, fontWeight: '600' as const, color: FT.textSec },
  tabItemLabelActive: { color: FT.brand },
  tabBadge: { backgroundColor: FT.danger, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, marginLeft: 2 },
  tabBadgeText: { fontSize: 10, fontWeight: '700' as const, color: '#FFF' },
  tabScroll: { flex: 1 },
  tabScrollContent: { padding: 16, paddingBottom: 40 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tabHeaderTitle: { fontSize: 18, fontWeight: '800' as const, color: FT.text },
  tabHeaderCount: { fontSize: 12, color: FT.textMuted, fontWeight: '600' as const },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: FT.surface, padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: FT.border },
  scoreCircle: { borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontWeight: '900' as const },
  scoreMax: { fontSize: 12, color: FT.textMuted, fontWeight: '600' as const, marginTop: -2 },
  scoreLabel: { fontSize: 10, color: FT.textSec, marginTop: 2 },
  scoreHeaderInfo: { flex: 1, gap: 4 },
  scoreHeaderTitle: { fontSize: 17, fontWeight: '700' as const, color: FT.text },
  scoreHeaderCount: { fontSize: 13, color: FT.textSec },
  recommendRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  recommendChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recommendChipIcon: { fontSize: 14 },
  recommendChipCount: { fontSize: 13, fontWeight: '700' as const },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FT.dangerSoft, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: FT.danger + '20' },
  alertBannerText: { flex: 1, fontSize: 13, fontWeight: '600' as const, color: FT.danger },
  alertBannerLink: { fontSize: 13, fontWeight: '700' as const, color: FT.danger, textDecorationLine: 'underline' as const },
  issueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FT.warningSoft, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: FT.warning + '20' },
  issueBannerText: { flex: 1, fontSize: 13, fontWeight: '600' as const, color: '#92400E' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: FT.text, marginBottom: 10 },
  card: { backgroundColor: FT.surface, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: FT.border },
  catBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catBarIcon: { fontSize: 18, width: 28, textAlign: 'center' as const },
  catBarInfo: { flex: 1 },
  catBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catBarLabel: { fontSize: 13, color: FT.text, fontWeight: '500' as const },
  catBarScore: { fontSize: 13, fontWeight: '700' as const },
  catBarTrack: { height: 6, backgroundColor: FT.border, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: 6, borderRadius: 3 },
  roomScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  roomScoreRank: { fontSize: 12, fontWeight: '700' as const, color: FT.textMuted, width: 28 },
  roomScoreInfo: { flex: 1 },
  roomScoreNumber: { fontSize: 14, fontWeight: '600' as const, color: FT.text },
  roomScoreCount: { fontSize: 11, color: FT.textMuted },
  roomScoreRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomScoreValue: { fontSize: 16, fontWeight: '800' as const, color: FT.success },
  roomScoreLow: { color: FT.danger },
  reviewCard: { backgroundColor: FT.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: FT.border, gap: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewTypeBadge: { backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  reviewTypeBadgeText: { fontSize: 12, fontWeight: '600' as const, color: FT.textSec },
  reviewDate: { fontSize: 11, color: FT.textMuted },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewAvg: { fontSize: 12, fontWeight: '700' as const, color: FT.text, marginLeft: 6 },
  reviewComment: { fontSize: 13, color: FT.textSec, lineHeight: 18, fontStyle: 'italic' as const },
  reviewProblem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FT.dangerSoft, padding: 8, borderRadius: 8 },
  reviewProblemText: { flex: 1, fontSize: 12, color: FT.danger },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brandSoft, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  exportBtnText: { fontSize: 14, fontWeight: '600' as const, color: FT.brand },
  roomDetailCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: FT.surface, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: FT.border },
  roomDetailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomDetailBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roomDetailNumber: { fontSize: 16, fontWeight: '800' as const },
  roomDetailTitle: { fontSize: 14, fontWeight: '600' as const, color: FT.text },
  roomDetailSub: { fontSize: 11, color: FT.textMuted },
  roomDetailRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomDetailScore: { fontSize: 18, fontWeight: '800' as const },
  alertCard: { backgroundColor: FT.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: FT.danger + '20', gap: 10 },
  alertCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertScoreBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: FT.dangerSoft, justifyContent: 'center', alignItems: 'center' },
  alertScoreText: { fontSize: 13, fontWeight: '800' as const, color: FT.danger },
  alertCardInfo: { flex: 1 },
  alertCardTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  alertCardDate: { fontSize: 11, color: FT.textMuted },
  alertCommentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: FT.surfaceAlt, padding: 10, borderRadius: 8 },
  alertCommentText: { flex: 1, fontSize: 12, color: FT.textSec, fontStyle: 'italic' as const },
  alertCardFooter: { gap: 8 },
  alertRecommended: { fontSize: 12, color: FT.textSec, fontWeight: '500' as const },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: FT.success, paddingVertical: 10, borderRadius: 10 },
  resolveBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#FFF' },
  issueCard: { backgroundColor: FT.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: FT.warning + '25', gap: 10 },
  issueCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  issueIconCircle: { width: 40, height: 40, borderRadius: 10, backgroundColor: FT.dangerSoft, justifyContent: 'center', alignItems: 'center' },
  issueCardInfo: { flex: 1 },
  issueCardTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  issueCardSub: { fontSize: 12, color: FT.textSec },
  issueScore: { fontSize: 16, fontWeight: '800' as const },
  issueRecommended: { fontSize: 12, color: FT.textSec, fontWeight: '500' as const },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyStateText: { fontSize: 16, fontWeight: '700' as const, color: FT.textSec },
  emptyStateSub: { fontSize: 13, color: FT.textMuted },
  emptyText: { fontSize: 13, color: FT.textMuted, textAlign: 'center' as const, paddingVertical: 16 },
});

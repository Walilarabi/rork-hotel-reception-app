import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  Shield,
  ArrowRight,
  Zap,
  Calendar,
  MessageCircle,
} from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import { SA_THEME as SA } from '@/constants/flowtym';
import { HOTEL_STATUS_CONFIG, SUBSCRIPTION_PLAN_CONFIG } from '@/constants/types';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { hotels, users, logs, stats, isLoading, supportSession } = useSuperAdmin();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Dashboard' }} />
        <ActivityIndicator size="large" color={SA.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const recentLogs = logs.slice(0, 5);
  const expiringHotels = hotels.filter((h) => {
    const end = new Date(h.subscriptionEnd);
    const now = new Date();
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30 && h.status === 'active';
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: SA.bg },
          headerTintColor: SA.text,
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Text style={styles.brandBold}>FLOW</Text>
              <Text style={styles.brandLight}>TYM</Text>
              <View style={styles.headerDivider} />
              <View style={styles.headerShieldWrap}>
                <Shield size={14} color={SA.accent} />
              </View>
              <Text style={styles.headerTitleText}>SUPER ADMIN</Text>
            </View>
          ),
          headerRight: () => <UserMenuButton tintColor={SA.textSec} />,
        }}
      />

      {supportSession && (
        <View style={styles.supportBanner}>
          <Zap size={14} color={SA.warning} />
          <Text style={styles.supportBannerText}>
            Mode support actif : {supportSession.hotelName}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Bonjour, Alexandre</Text>
        <Text style={styles.subGreeting}>Voici l{"'"}état de votre plateforme</Text>

        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, styles.statCardAccent]} onPress={() => router.push('/(superadmin)/hotels')}>
            <View style={[styles.statIconWrap, { backgroundColor: SA.accent + '18' }]}>
              <Building2 size={20} color={SA.accent} />
            </View>
            <Text style={styles.statValue}>{stats.totalHotels}</Text>
            <Text style={styles.statLabel}>Hôtels</Text>
            <View style={styles.statBreakdown}>
              <View style={[styles.statDot, { backgroundColor: SA.success }]} />
              <Text style={styles.statBreakdownText}>{stats.activeHotels} actifs</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(superadmin)/users')}>
            <View style={[styles.statIconWrap, { backgroundColor: SA.info + '18' }]}>
              <Users size={20} color={SA.info} />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
            <View style={styles.statBreakdown}>
              <View style={[styles.statDot, { backgroundColor: SA.info }]} />
              <Text style={styles.statBreakdownText}>{users.filter((u) => u.active).length} actifs</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: SA.success + '18' }]}>
              <TrendingUp size={20} color={SA.success} />
            </View>
            <Text style={styles.statValue}>{stats.trialHotels}</Text>
            <Text style={styles.statLabel}>En essai</Text>
            <View style={styles.statBreakdown}>
              <View style={[styles.statDot, { backgroundColor: SA.warning }]} />
              <Text style={styles.statBreakdownText}>conversion</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: SA.warning + '18' }]}>
              <Calendar size={20} color={SA.warning} />
            </View>
            <Text style={styles.statValue}>{stats.renewingSoon}</Text>
            <Text style={styles.statLabel}>Renouvellement</Text>
            <View style={styles.statBreakdown}>
              <View style={[styles.statDot, { backgroundColor: SA.danger }]} />
              <Text style={styles.statBreakdownText}>7 prochains j.</Text>
            </View>
          </View>
        </View>

        {expiringHotels.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={16} color={SA.warning} />
              <Text style={styles.alertTitle}>Abonnements à renouveler</Text>
            </View>
            {expiringHotels.map((h) => (
              <View key={h.id} style={styles.alertItem}>
                <View style={styles.alertItemLeft}>
                  <Text style={styles.alertItemName}>{h.name}</Text>
                  <Text style={styles.alertItemDetail}>
                    Expire le {new Date(h.subscriptionEnd).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: SUBSCRIPTION_PLAN_CONFIG[h.subscriptionPlan].color + '20' }]}>
                  <Text style={[styles.planBadgeText, { color: SUBSCRIPTION_PLAN_CONFIG[h.subscriptionPlan].color }]}>
                    {SUBSCRIPTION_PLAN_CONFIG[h.subscriptionPlan].label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.widgetCard}>
          <Text style={styles.widgetTitle}>Répartition des plans</Text>
          <View style={styles.planRow}>
            {(['basic', 'premium', 'enterprise'] as const).map((plan) => {
              const count = hotels.filter((h) => h.subscriptionPlan === plan).length;
              const config = SUBSCRIPTION_PLAN_CONFIG[plan];
              return (
                <View key={plan} style={styles.planCard}>
                  <View style={[styles.planDot, { backgroundColor: config.color }]} />
                  <Text style={styles.planCount}>{count}</Text>
                  <Text style={styles.planLabel}>{config.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.widgetCard}>
          <Text style={styles.widgetTitle}>Statuts hôtels</Text>
          <View style={styles.planRow}>
            {(['active', 'trial', 'suspended'] as const).map((status) => {
              const count = hotels.filter((h) => h.status === status).length;
              const config = HOTEL_STATUS_CONFIG[status];
              return (
                <View key={status} style={styles.planCard}>
                  <View style={[styles.planDot, { backgroundColor: config.color }]} />
                  <Text style={styles.planCount}>{count}</Text>
                  <Text style={styles.planLabel}>{config.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Activité récente</Text>
            <TouchableOpacity onPress={() => router.push('/(superadmin)/logs')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Tout voir</Text>
              <ArrowRight size={12} color={SA.accent} />
            </TouchableOpacity>
          </View>
          {recentLogs.length === 0 && (
            <Text style={styles.emptyLogText}>Aucune activité récente</Text>
          )}
          {recentLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logDot} />
              <View style={styles.logContent}>
                <Text style={styles.logAction}>{log.details}</Text>
                <Text style={styles.logDate}>
                  {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {log.hotelName ? ` • ${log.hotelName}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.widgetCard}
          onPress={() => router.push('/chatbot-admin' as never)}
        >
          <View style={styles.widgetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.statIconWrap, { backgroundColor: SA.accent + '18', width: 34, height: 34, borderRadius: 9 }]}>
                <MessageCircle size={16} color={SA.accent} />
              </View>
              <View>
                <Text style={styles.widgetTitle}>Assistant / FAQ</Text>
                <Text style={[styles.statBreakdownText, { marginTop: 2 }]}>Gérer les questions et réponses du chatbot</Text>
              </View>
            </View>
            <ArrowRight size={16} color={SA.accent} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  loadingContainer: { flex: 1, backgroundColor: SA.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: SA.textSec, fontSize: 14 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandBold: { fontSize: 16, fontWeight: '800' as const, color: '#FFF', letterSpacing: -0.5 },
  brandLight: { fontSize: 16, fontWeight: '800' as const, color: SA.accent, letterSpacing: -0.5 },
  headerDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  headerShieldWrap: { width: 24, height: 24, borderRadius: 6, backgroundColor: SA.accent + '18', justifyContent: 'center', alignItems: 'center' },
  headerTitleText: { fontSize: 12, fontWeight: '800' as const, color: SA.textSec, letterSpacing: 1 },
  supportBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SA.warning + '15', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SA.warning + '20' },
  supportBannerText: { color: SA.warning, fontSize: 12, fontWeight: '600' as const },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  greeting: { fontSize: 24, fontWeight: '800' as const, color: SA.text },
  subGreeting: { fontSize: 14, color: SA.textSec, marginTop: -8 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%' as unknown as number,
    backgroundColor: SA.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: SA.border,
    flexGrow: 1,
    gap: 4,
  },
  statCardAccent: { borderColor: SA.accent + '35' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '800' as const, color: SA.text },
  statLabel: { fontSize: 12, color: SA.textSec },
  statBreakdown: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statBreakdownText: { fontSize: 11, color: SA.textMuted },

  alertCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.warning + '25', gap: 10 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: '700' as const, color: SA.warning },
  alertItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: SA.border },
  alertItemLeft: { flex: 1 },
  alertItemName: { fontSize: 13, fontWeight: '600' as const, color: SA.text },
  alertItemDetail: { fontSize: 11, color: SA.textSec, marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 11, fontWeight: '600' as const },

  widgetCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, gap: 12 },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  widgetTitle: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 12, color: SA.accent, fontWeight: '600' as const },

  planRow: { flexDirection: 'row', gap: 10 },
  planCard: { flex: 1, backgroundColor: SA.surfaceLight, borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: SA.border, gap: 4 },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planCount: { fontSize: 22, fontWeight: '800' as const, color: SA.text },
  planLabel: { fontSize: 11, color: SA.textSec },

  emptyLogText: { fontSize: 13, color: SA.textMuted, textAlign: 'center', paddingVertical: 12 },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SA.border },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SA.accent, marginTop: 4 },
  logContent: { flex: 1 },
  logAction: { fontSize: 13, color: SA.text, fontWeight: '500' as const },
  logDate: { fontSize: 11, color: SA.textMuted, marginTop: 2 },
});

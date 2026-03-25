import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  CreditCard,
  Layers,
  Gift,
  BarChart3,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  TrendingUp,
  Building2,
  Percent,
  DollarSign,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import UserMenuButton from '@/components/UserMenuButton';
import { useSubscriptions } from '@/providers/SubscriptionProvider';
import { SA_THEME as SA } from '@/constants/flowtym';
import {
  SubscriptionPlanDetail,
  Feature,
  Addon,
  Promotion,
  FEATURE_CATEGORIES,
  BILLING_TYPE_CONFIG,
} from '@/constants/types';

type ActiveTab = 'dashboard' | 'plans' | 'features' | 'addons' | 'promotions' | 'config';

const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={14} color={SA.text} /> },
  { key: 'plans', label: 'Forfaits', icon: <CreditCard size={14} color={SA.text} /> },
  { key: 'features', label: 'Options', icon: <Layers size={14} color={SA.text} /> },
  { key: 'addons', label: 'Add-ons', icon: <Package size={14} color={SA.text} /> },
  { key: 'promotions', label: 'Promos', icon: <Gift size={14} color={SA.text} /> },
  { key: 'config', label: 'Config', icon: <Settings size={14} color={SA.text} /> },
];

export default function SubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const sub = useSubscriptions();

  if (sub.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Abonnements' }} />
        <ActivityIndicator size="large" color={SA.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: SA.bg },
          headerTintColor: SA.text,
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <CreditCard size={16} color={SA.accent} />
              <Text style={styles.headerTitleText}>Abonnements</Text>
            </View>
          ),
          headerRight: () => <UserMenuButton tintColor={SA.textSec} />,
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && <DashboardSection />}
        {activeTab === 'plans' && <PlansSection />}
        {activeTab === 'features' && <FeaturesSection />}
        {activeTab === 'addons' && <AddonsSection />}
        {activeTab === 'promotions' && <PromotionsSection />}
        {activeTab === 'config' && <ConfigSection />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function DashboardSection() {
  const { stats, hotelSubs } = useSubscriptions();

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Vue d{"'"}ensemble</Text>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderColor: SA.accent + '30' }]}>
          <View style={[styles.kpiIcon, { backgroundColor: SA.accent + '18' }]}>
            <Building2 size={18} color={SA.accent} />
          </View>
          <Text style={styles.kpiValue}>{stats.activeSubs}</Text>
          <Text style={styles.kpiLabel}>Abonnements actifs</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#22C55E18' }]}>
            <DollarSign size={18} color="#22C55E" />
          </View>
          <Text style={styles.kpiValue}>{stats.monthlyRevenue}€</Text>
          <Text style={styles.kpiLabel}>CA mensuel</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#3B82F618' }]}>
            <TrendingUp size={18} color="#3B82F6" />
          </View>
          <Text style={styles.kpiValue}>{stats.conversionRate}%</Text>
          <Text style={styles.kpiLabel}>Taux conversion</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#F59E0B18' }]}>
            <Calendar size={18} color="#F59E0B" />
          </View>
          <Text style={styles.kpiValue}>{stats.expiringCount}</Text>
          <Text style={styles.kpiLabel}>Expirent sous 30j</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Répartition par forfait</Text>
        <View style={styles.planDistRow}>
          {stats.planDistribution.map((pd) => (
            <View key={pd.planId} style={styles.planDistItem}>
              <View style={[styles.planDistDot, { backgroundColor: pd.color }]} />
              <Text style={styles.planDistCount}>{pd.count}</Text>
              <Text style={styles.planDistName}>{pd.planName}</Text>
            </View>
          ))}
        </View>
        <View style={styles.progressBarBg}>
          {stats.planDistribution.map((pd) => {
            const pct = stats.totalSubs > 0 ? (pd.count / stats.totalSubs) * 100 : 0;
            if (pct === 0) return null;
            return (
              <View key={pd.planId} style={[styles.progressBarSegment, { width: `${pct}%` as unknown as number, backgroundColor: pd.color }]} />
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenus</Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueValue}>{stats.monthlyRevenue}€</Text>
            <Text style={styles.revenueLabel}>Mensuel</Text>
          </View>
          <View style={[styles.revenueDivider]} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueValue}>{stats.yearlyRevenue}€</Text>
            <Text style={styles.revenueLabel}>Annuel prévisionnel</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Promotions actives</Text>
        <View style={styles.promoBadgeRow}>
          <View style={[styles.promoBadge, { backgroundColor: '#22C55E18' }]}>
            <Text style={[styles.promoBadgeText, { color: '#22C55E' }]}>{stats.activePromos} actives</Text>
          </View>
          <View style={[styles.promoBadge, { backgroundColor: SA.accent + '18' }]}>
            <Text style={[styles.promoBadgeText, { color: SA.accent }]}>{stats.trialSubs} essais</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Abonnements récents</Text>
        {hotelSubs.slice(0, 5).map((s) => (
          <View key={s.id} style={styles.subRow}>
            <View style={styles.subRowLeft}>
              <Text style={styles.subHotelName}>{s.hotelName}</Text>
              <Text style={styles.subPlanName}>{s.planName}{s.promoCode ? ` • ${s.promoCode}` : ''}</Text>
            </View>
            <View style={[styles.subStatusBadge, { backgroundColor: s.status === 'active' ? '#22C55E18' : s.status === 'trial' ? '#3B82F618' : '#EF444418' }]}>
              <Text style={[styles.subStatusText, { color: s.status === 'active' ? '#22C55E' : s.status === 'trial' ? '#3B82F6' : '#EF4444' }]}>
                {s.status === 'active' ? 'Actif' : s.status === 'trial' ? 'Essai' : s.status === 'expired' ? 'Expiré' : 'Annulé'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PlansSection() {
  const { plans, features, addPlan, updatePlan, deletePlan } = useSubscriptions();
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanDetail | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriceM, setFormPriceM] = useState('');
  const [formPriceY, setFormPriceY] = useState('');
  const [formMaxRooms, setFormMaxRooms] = useState('');
  const [formMaxUsers, setFormMaxUsers] = useState('');
  const [formMaxHotels, setFormMaxHotels] = useState('1');
  const [formExtraHotelPrice, setFormExtraHotelPrice] = useState('0');
  const [formSortOrder, setFormSortOrder] = useState('1');
  const [formFeatureIds, setFormFeatureIds] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormDesc('');
    setFormPriceM('');
    setFormPriceY('');
    setFormMaxRooms('0');
    setFormMaxUsers('0');
    setFormMaxHotels('1');
    setFormExtraHotelPrice('0');
    setFormSortOrder(String(plans.length + 1));
    setFormFeatureIds([]);
  }, [plans.length]);

  const openAdd = useCallback(() => {
    resetForm();
    setEditPlan(null);
    setShowModal(true);
  }, [resetForm]);

  const openEdit = useCallback((plan: SubscriptionPlanDetail) => {
    setEditPlan(plan);
    setFormName(plan.name);
    setFormDesc(plan.description);
    setFormPriceM(String(plan.priceMonthly));
    setFormPriceY(String(plan.priceYearly));
    setFormMaxRooms(String(plan.maxRooms));
    setFormMaxUsers(String(plan.maxUsers));
    setFormMaxHotels(String(plan.maxHotels));
    setFormExtraHotelPrice(String(plan.extraHotelPrice));
    setFormSortOrder(String(plan.sortOrder));
    setFormFeatureIds([...plan.featureIds]);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formName.trim()) { Alert.alert('Erreur', 'Le nom est requis.'); return; }
    const data = {
      name: formName.trim(),
      description: formDesc.trim(),
      priceMonthly: parseFloat(formPriceM) || 0,
      priceYearly: parseFloat(formPriceY) || 0,
      currency: 'EUR',
      maxRooms: parseInt(formMaxRooms, 10) || 0,
      maxUsers: parseInt(formMaxUsers, 10) || 0,
      maxHotels: parseInt(formMaxHotels, 10) || 1,
      extraHotelPrice: parseFloat(formExtraHotelPrice) || 0,
      sortOrder: parseInt(formSortOrder, 10) || 1,
      isActive: true,
      featureIds: formFeatureIds,
    };
    if (editPlan) {
      updatePlan({ planId: editPlan.id, updates: data });
    } else {
      addPlan(data);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  }, [formName, formDesc, formPriceM, formPriceY, formMaxRooms, formMaxUsers, formMaxHotels, formExtraHotelPrice, formSortOrder, formFeatureIds, editPlan, addPlan, updatePlan]);

  const handleDelete = useCallback((plan: SubscriptionPlanDetail) => {
    Alert.alert('Désactiver le forfait', `Désactiver "${plan.name}" ? Les abonnements existants ne seront pas affectés.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Désactiver', style: 'destructive', onPress: () => deletePlan(plan.id) },
    ]);
  }, [deletePlan]);

  const toggleFeature = useCallback((fId: string) => {
    setFormFeatureIds((prev) => prev.includes(fId) ? prev.filter((x) => x !== fId) : [...prev, fId]);
  }, []);

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.sortOrder - b.sortOrder), [plans]);

  const planColors = ['#78909C', '#3B82F6', '#F59E0B', '#7C4DFF', '#22C55E', '#EF4444'];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Forfaits</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={14} color="#FFF" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {sortedPlans.map((plan, idx) => {
        const color = planColors[idx % planColors.length];
        const isExpanded = expandedPlan === plan.id;
        const planFeatures = features.filter((f) => plan.featureIds.includes(f.id));

        return (
          <View key={plan.id} style={[styles.planCard, !plan.isActive && styles.planCardInactive]}>
            <TouchableOpacity style={styles.planCardHeader} onPress={() => setExpandedPlan(isExpanded ? null : plan.id)}>
              <View style={styles.planCardLeft}>
                <View style={[styles.planColorStrip, { backgroundColor: color }]} />
                <View>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {!plan.isActive && (
                      <View style={[styles.inactiveBadge]}>
                        <Text style={styles.inactiveBadgeText}>Inactif</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planDesc} numberOfLines={1}>{plan.description}</Text>
                </View>
              </View>
              <View style={styles.planCardRight}>
                <Text style={styles.planPrice}>{plan.priceMonthly}€<Text style={styles.planPriceSuffix}>/mois</Text></Text>
                {isExpanded ? <ChevronUp size={16} color={SA.textMuted} /> : <ChevronDown size={16} color={SA.textMuted} />}
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.planExpanded}>
                <View style={styles.planMetaGrid}>
                  <View style={styles.planMeta}>
                    <Text style={styles.planMetaLabel}>Annuel</Text>
                    <Text style={styles.planMetaValue}>{plan.priceYearly > 0 ? `${plan.priceYearly}€` : '—'}</Text>
                  </View>
                  <View style={styles.planMeta}>
                    <Text style={styles.planMetaLabel}>Chambres</Text>
                    <Text style={styles.planMetaValue}>{plan.maxRooms === 0 ? 'Illimité' : plan.maxRooms}</Text>
                  </View>
                  <View style={styles.planMeta}>
                    <Text style={styles.planMetaLabel}>Utilisateurs</Text>
                    <Text style={styles.planMetaValue}>{plan.maxUsers === 0 ? 'Illimité' : plan.maxUsers}</Text>
                  </View>
                  <View style={styles.planMeta}>
                    <Text style={styles.planMetaLabel}>Hôtels</Text>
                    <Text style={styles.planMetaValue}>{plan.maxHotels}{plan.extraHotelPrice > 0 ? ` (+${plan.extraHotelPrice}€/hôtel)` : ''}</Text>
                  </View>
                </View>

                <Text style={styles.featureListTitle}>{planFeatures.length} fonctionnalités incluses</Text>
                <View style={styles.featureTags}>
                  {planFeatures.map((f) => (
                    <View key={f.id} style={styles.featureTag}>
                      <Check size={10} color="#22C55E" />
                      <Text style={styles.featureTagText}>{f.name}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.planActions}>
                  <TouchableOpacity style={styles.editAction} onPress={() => openEdit(plan)}>
                    <Edit3 size={14} color={SA.accent} />
                    <Text style={[styles.actionText, { color: SA.accent }]}>Modifier</Text>
                  </TouchableOpacity>
                  {plan.isActive && (
                    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(plan)}>
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={[styles.actionText, { color: '#EF4444' }]}>Désactiver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editPlan ? 'Modifier le forfait' : 'Nouveau forfait'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color={SA.textSec} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nom du forfait</Text>
              <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="Ex: Essentiel" placeholderTextColor={SA.textMuted} />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={formDesc} onChangeText={setFormDesc} placeholder="Accroche commerciale..." placeholderTextColor={SA.textMuted} multiline />

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Prix mensuel (€)</Text>
                  <TextInput style={styles.input} value={formPriceM} onChangeText={setFormPriceM} keyboardType="numeric" placeholder="49" placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Prix annuel (€)</Text>
                  <TextInput style={styles.input} value={formPriceY} onChangeText={setFormPriceY} keyboardType="numeric" placeholder="490" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Max chambres (0=illimité)</Text>
                  <TextInput style={styles.input} value={formMaxRooms} onChangeText={setFormMaxRooms} keyboardType="numeric" placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Max utilisateurs (0=illimité)</Text>
                  <TextInput style={styles.input} value={formMaxUsers} onChangeText={setFormMaxUsers} keyboardType="numeric" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Hôtels inclus</Text>
                  <TextInput style={styles.input} value={formMaxHotels} onChangeText={setFormMaxHotels} keyboardType="numeric" placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Prix hôtel supp. (€)</Text>
                  <TextInput style={styles.input} value={formExtraHotelPrice} onChangeText={setFormExtraHotelPrice} keyboardType="numeric" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Ordre d{"'"}affichage</Text>
              <TextInput style={styles.input} value={formSortOrder} onChangeText={setFormSortOrder} keyboardType="numeric" placeholderTextColor={SA.textMuted} />

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Fonctionnalités incluses</Text>
              {FEATURE_CATEGORIES.map((cat) => {
                const catFeatures = features.filter((f) => f.category === cat);
                if (catFeatures.length === 0) return null;
                return (
                  <View key={cat} style={styles.featureCatBlock}>
                    <Text style={styles.featureCatTitle}>{cat}</Text>
                    {catFeatures.map((f) => (
                      <TouchableOpacity key={f.id} style={styles.featureCheckRow} onPress={() => toggleFeature(f.id)}>
                        <View style={[styles.checkbox, formFeatureIds.includes(f.id) && styles.checkboxChecked]}>
                          {formFeatureIds.includes(f.id) && <Check size={12} color="#FFF" />}
                        </View>
                        <Text style={styles.featureCheckLabel}>{f.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Check size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>{editPlan ? 'Enregistrer' : 'Créer le forfait'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FeaturesSection() {
  const { features, addFeature, updateFeature, deleteFeature } = useSubscriptions();
  const [showModal, setShowModal] = useState(false);
  const [editFeature, setEditFeature] = useState<Feature | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>(FEATURE_CATEGORIES[0]);
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [showCatDrop, setShowCatDrop] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, Feature[]> = {};
    features.forEach((f) => {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    });
    return map;
  }, [features]);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormCategory(FEATURE_CATEGORIES[0]);
    setFormDesc('');
    setFormIcon('');
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setEditFeature(null);
    setShowModal(true);
  }, [resetForm]);

  const openEdit = useCallback((f: Feature) => {
    setEditFeature(f);
    setFormName(f.name);
    setFormCategory(f.category);
    setFormDesc(f.description);
    setFormIcon(f.icon);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formName.trim()) { Alert.alert('Erreur', 'Le nom est requis.'); return; }
    const data = { name: formName.trim(), category: formCategory, description: formDesc.trim(), icon: formIcon.trim() };
    if (editFeature) {
      updateFeature({ featureId: editFeature.id, updates: data });
    } else {
      addFeature(data);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  }, [formName, formCategory, formDesc, formIcon, editFeature, addFeature, updateFeature]);

  const handleDelete = useCallback((f: Feature) => {
    Alert.alert('Supprimer', `Supprimer la fonctionnalité "${f.name}" ? Elle sera retirée de tous les forfaits.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteFeature(f.id) },
    ]);
  }, [deleteFeature]);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={14} color="#FFF" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {Object.entries(grouped).map(([cat, items]) => (
        <View key={cat} style={styles.card}>
          <Text style={styles.cardTitle}>{cat}</Text>
          {items.map((f) => (
            <View key={f.id} style={styles.featureRow}>
              <View style={styles.featureRowLeft}>
                <View style={[styles.featureDot, { backgroundColor: SA.accent }]} />
                <View>
                  <Text style={styles.featureRowName}>{f.name}</Text>
                  <Text style={styles.featureRowDesc} numberOfLines={1}>{f.description}</Text>
                </View>
              </View>
              <View style={styles.featureRowActions}>
                <TouchableOpacity onPress={() => openEdit(f)} style={styles.miniAction}>
                  <Edit3 size={13} color={SA.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(f)} style={styles.miniAction}>
                  <Trash2 size={13} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editFeature ? 'Modifier' : 'Nouvelle fonctionnalité'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={20} color={SA.textSec} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="Nom de la fonctionnalité" placeholderTextColor={SA.textMuted} />

              <Text style={styles.fieldLabel}>Catégorie</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCatDrop(!showCatDrop)}>
                <Text style={styles.selectText}>{formCategory}</Text>
                <ChevronDown size={14} color={SA.textSec} />
              </TouchableOpacity>
              {showCatDrop && (
                <View style={styles.dropdownInline}>
                  {FEATURE_CATEGORIES.map((c) => (
                    <TouchableOpacity key={c} style={styles.dropdownInlineItem} onPress={() => { setFormCategory(c); setShowCatDrop(false); }}>
                      <Text style={styles.dropdownInlineText}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={formDesc} onChangeText={setFormDesc} placeholder="Description..." placeholderTextColor={SA.textMuted} multiline />

              <Text style={styles.fieldLabel}>Icône (nom)</Text>
              <TextInput style={styles.input} value={formIcon} onChangeText={setFormIcon} placeholder="Ex: building" placeholderTextColor={SA.textMuted} />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Check size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>{editFeature ? 'Enregistrer' : 'Créer'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddonsSection() {
  const { addons, addAddon, updateAddon, deleteAddon } = useSubscriptions();
  const [showModal, setShowModal] = useState(false);
  const [editAddon, setEditAddon] = useState<Addon | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formBillingType, setFormBillingType] = useState<'one_time' | 'monthly' | 'yearly'>('one_time');

  const resetForm = useCallback(() => { setFormName(''); setFormDesc(''); setFormPrice(''); setFormBillingType('one_time'); }, []);

  const openAdd = useCallback(() => { resetForm(); setEditAddon(null); setShowModal(true); }, [resetForm]);

  const openEdit = useCallback((a: Addon) => {
    setEditAddon(a);
    setFormName(a.name);
    setFormDesc(a.description);
    setFormPrice(String(a.price));
    setFormBillingType(a.billingType);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formName.trim()) { Alert.alert('Erreur', 'Le nom est requis.'); return; }
    const data = { name: formName.trim(), description: formDesc.trim(), price: parseFloat(formPrice) || 0, billingType: formBillingType, isActive: true };
    if (editAddon) {
      updateAddon({ addonId: editAddon.id, updates: data });
    } else {
      addAddon(data);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  }, [formName, formDesc, formPrice, formBillingType, editAddon, addAddon, updateAddon]);

  const handleDelete = useCallback((a: Addon) => {
    Alert.alert('Désactiver', `Désactiver "${a.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Désactiver', style: 'destructive', onPress: () => deleteAddon(a.id) },
    ]);
  }, [deleteAddon]);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Options complémentaires</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={14} color="#FFF" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {addons.map((addon) => (
        <View key={addon.id} style={[styles.addonCard, !addon.isActive && styles.planCardInactive]}>
          <View style={styles.addonTop}>
            <View style={styles.addonLeft}>
              <Text style={styles.addonName}>{addon.name}</Text>
              <Text style={styles.addonDesc} numberOfLines={2}>{addon.description}</Text>
            </View>
            <View style={styles.addonRight}>
              <Text style={styles.addonPrice}>{addon.price}€</Text>
              <View style={[styles.billingBadge, { backgroundColor: addon.billingType === 'one_time' ? '#3B82F618' : addon.billingType === 'monthly' ? '#22C55E18' : '#F59E0B18' }]}>
                <Text style={[styles.billingBadgeText, { color: addon.billingType === 'one_time' ? '#3B82F6' : addon.billingType === 'monthly' ? '#22C55E' : '#F59E0B' }]}>
                  {BILLING_TYPE_CONFIG[addon.billingType].label}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.addonActions}>
            <TouchableOpacity style={styles.editAction} onPress={() => openEdit(addon)}>
              <Edit3 size={13} color={SA.accent} />
              <Text style={[styles.actionText, { color: SA.accent }]}>Modifier</Text>
            </TouchableOpacity>
            {addon.isActive ? (
              <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(addon)}>
                <Trash2 size={13} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Désactiver</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>Inactif</Text></View>
            )}
          </View>
        </View>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editAddon ? 'Modifier' : 'Nouvelle option'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={20} color={SA.textSec} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="Nom de l'option" placeholderTextColor={SA.textMuted} />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={formDesc} onChangeText={setFormDesc} placeholder="Description..." placeholderTextColor={SA.textMuted} multiline />

              <Text style={styles.fieldLabel}>Prix (€)</Text>
              <TextInput style={styles.input} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={SA.textMuted} />

              <Text style={styles.fieldLabel}>Type de facturation</Text>
              <View style={styles.billingTypeRow}>
                {(['one_time', 'monthly', 'yearly'] as const).map((bt) => (
                  <TouchableOpacity key={bt} style={[styles.billingTypeBtn, formBillingType === bt && styles.billingTypeBtnActive]} onPress={() => setFormBillingType(bt)}>
                    <Text style={[styles.billingTypeBtnText, formBillingType === bt && styles.billingTypeBtnTextActive]}>{BILLING_TYPE_CONFIG[bt].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Check size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>{editAddon ? 'Enregistrer' : 'Créer'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PromotionsSection() {
  const { promotions, plans, addPromotion, updatePromotion, deletePromotion } = useSubscriptions();
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formMaxPerCustomer, setFormMaxPerCustomer] = useState('1');
  const [formFirstPurchase, setFormFirstPurchase] = useState(false);
  const [formPlanIds, setFormPlanIds] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setFormCode(''); setFormDesc(''); setFormType('percentage'); setFormValue('');
    setFormDuration(''); setFormStartDate(''); setFormEndDate('');
    setFormMaxUses(''); setFormMaxPerCustomer('1'); setFormFirstPurchase(false);
    setFormPlanIds(plans.map((p) => p.id));
  }, [plans]);

  const openAdd = useCallback(() => { resetForm(); setEditPromo(null); setShowModal(true); }, [resetForm]);

  const openEdit = useCallback((p: Promotion) => {
    setEditPromo(p);
    setFormCode(p.code); setFormDesc(p.description); setFormType(p.discountType);
    setFormValue(String(p.discountValue)); setFormDuration(p.durationMonths != null ? String(p.durationMonths) : '');
    setFormStartDate(p.startDate ?? ''); setFormEndDate(p.endDate ?? '');
    setFormMaxUses(p.maxUses != null ? String(p.maxUses) : '');
    setFormMaxPerCustomer(String(p.maxUsesPerCustomer)); setFormFirstPurchase(p.firstPurchaseOnly);
    setFormPlanIds([...p.applicablePlanIds]);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formCode.trim()) { Alert.alert('Erreur', 'Le code promo est requis.'); return; }
    const data: Omit<Promotion, 'id' | 'currentUses'> = {
      code: formCode.trim().toUpperCase(),
      description: formDesc.trim(),
      discountType: formType,
      discountValue: parseFloat(formValue) || 0,
      durationMonths: formDuration ? parseInt(formDuration, 10) : null,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
      maxUsesPerCustomer: parseInt(formMaxPerCustomer, 10) || 1,
      firstPurchaseOnly: formFirstPurchase,
      isActive: true,
      applicablePlanIds: formPlanIds,
    };
    if (editPromo) {
      updatePromotion({ promoId: editPromo.id, updates: data });
    } else {
      addPromotion(data);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  }, [formCode, formDesc, formType, formValue, formDuration, formStartDate, formEndDate, formMaxUses, formMaxPerCustomer, formFirstPurchase, formPlanIds, editPromo, addPromotion, updatePromotion]);

  const handleDelete = useCallback((p: Promotion) => {
    Alert.alert('Désactiver', `Désactiver la promo "${p.code}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Désactiver', style: 'destructive', onPress: () => deletePromotion(p.id) },
    ]);
  }, [deletePromotion]);

  const togglePlanId = useCallback((pId: string) => {
    setFormPlanIds((prev) => prev.includes(pId) ? prev.filter((x) => x !== pId) : [...prev, pId]);
  }, []);

  const getPromoStatus = (p: Promotion): { label: string; color: string } => {
    if (!p.isActive) return { label: 'Inactif', color: '#78909C' };
    const now = new Date().toISOString().split('T')[0];
    if (p.startDate && now < p.startDate) return { label: 'Planifié', color: '#3B82F6' };
    if (p.endDate && now > p.endDate) return { label: 'Expiré', color: '#EF4444' };
    return { label: 'Actif', color: '#22C55E' };
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Promotions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={14} color="#FFF" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {promotions.map((promo) => {
        const status = getPromoStatus(promo);
        return (
          <View key={promo.id} style={[styles.promoCard, !promo.isActive && styles.planCardInactive]}>
            <View style={styles.promoTop}>
              <View style={styles.promoLeft}>
                <View style={styles.promoCodeRow}>
                  <Tag size={14} color={SA.accent} />
                  <Text style={styles.promoCode}>{promo.code}</Text>
                </View>
                <Text style={styles.promoDesc}>{promo.description}</Text>
              </View>
              <View style={[styles.promoStatusBadge, { backgroundColor: status.color + '18' }]}>
                <View style={[styles.promoStatusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.promoStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            <View style={styles.promoDetails}>
              <View style={styles.promoDetailItem}>
                <Text style={styles.promoDetailLabel}>Réduction</Text>
                <Text style={styles.promoDetailValue}>
                  {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `${promo.discountValue}€`}
                </Text>
              </View>
              <View style={styles.promoDetailItem}>
                <Text style={styles.promoDetailLabel}>Durée</Text>
                <Text style={styles.promoDetailValue}>{promo.durationMonths ? `${promo.durationMonths} mois` : 'Permanent'}</Text>
              </View>
              <View style={styles.promoDetailItem}>
                <Text style={styles.promoDetailLabel}>Utilisations</Text>
                <Text style={styles.promoDetailValue}>{promo.currentUses}/{promo.maxUses ?? '∞'}</Text>
              </View>
            </View>

            {(promo.startDate || promo.endDate) && (
              <Text style={styles.promoPeriod}>
                {promo.startDate ? `Du ${promo.startDate}` : ''}{promo.endDate ? ` au ${promo.endDate}` : ''}
              </Text>
            )}

            <View style={styles.addonActions}>
              <TouchableOpacity style={styles.editAction} onPress={() => openEdit(promo)}>
                <Edit3 size={13} color={SA.accent} />
                <Text style={[styles.actionText, { color: SA.accent }]}>Modifier</Text>
              </TouchableOpacity>
              {promo.isActive && (
                <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(promo)}>
                  <Trash2 size={13} color="#EF4444" />
                  <Text style={[styles.actionText, { color: '#EF4444' }]}>Désactiver</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editPromo ? 'Modifier' : 'Nouvelle promotion'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={20} color={SA.textSec} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Code promo</Text>
              <TextInput style={styles.input} value={formCode} onChangeText={(t) => setFormCode(t.toUpperCase())} placeholder="BIENVENUE2026" placeholderTextColor={SA.textMuted} autoCapitalize="characters" />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={formDesc} onChangeText={setFormDesc} placeholder="Description interne..." placeholderTextColor={SA.textMuted} multiline />

              <Text style={styles.fieldLabel}>Type de réduction</Text>
              <View style={styles.billingTypeRow}>
                <TouchableOpacity style={[styles.billingTypeBtn, formType === 'percentage' && styles.billingTypeBtnActive]} onPress={() => setFormType('percentage')}>
                  <Percent size={12} color={formType === 'percentage' ? '#FFF' : SA.textSec} />
                  <Text style={[styles.billingTypeBtnText, formType === 'percentage' && styles.billingTypeBtnTextActive]}>Pourcentage</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.billingTypeBtn, formType === 'fixed' && styles.billingTypeBtnActive]} onPress={() => setFormType('fixed')}>
                  <DollarSign size={12} color={formType === 'fixed' ? '#FFF' : SA.textSec} />
                  <Text style={[styles.billingTypeBtnText, formType === 'fixed' && styles.billingTypeBtnTextActive]}>Montant fixe</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Valeur</Text>
                  <TextInput style={styles.input} value={formValue} onChangeText={setFormValue} keyboardType="numeric" placeholder={formType === 'percentage' ? '20' : '50'} placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Durée (mois, vide=permanent)</Text>
                  <TextInput style={styles.input} value={formDuration} onChangeText={setFormDuration} keyboardType="numeric" placeholder="3" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Date début (AAAA-MM-JJ)</Text>
                  <TextInput style={styles.input} value={formStartDate} onChangeText={setFormStartDate} placeholder="2026-03-01" placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Date fin (AAAA-MM-JJ)</Text>
                  <TextInput style={styles.input} value={formEndDate} onChangeText={setFormEndDate} placeholder="2026-06-30" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Utilisations max (vide=illimité)</Text>
                  <TextInput style={styles.input} value={formMaxUses} onChangeText={setFormMaxUses} keyboardType="numeric" placeholder="100" placeholderTextColor={SA.textMuted} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Max par client</Text>
                  <TextInput style={styles.input} value={formMaxPerCustomer} onChangeText={setFormMaxPerCustomer} keyboardType="numeric" placeholder="1" placeholderTextColor={SA.textMuted} />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Premier achat uniquement</Text>
                <Switch value={formFirstPurchase} onValueChange={setFormFirstPurchase} trackColor={{ true: SA.accent, false: SA.border }} thumbColor="#FFF" />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Forfaits concernés</Text>
              {plans.filter((p) => p.isActive).map((p) => (
                <TouchableOpacity key={p.id} style={styles.featureCheckRow} onPress={() => togglePlanId(p.id)}>
                  <View style={[styles.checkbox, formPlanIds.includes(p.id) && styles.checkboxChecked]}>
                    {formPlanIds.includes(p.id) && <Check size={12} color="#FFF" />}
                  </View>
                  <Text style={styles.featureCheckLabel}>{p.name} ({p.priceMonthly}€/mois)</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Check size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>{editPromo ? 'Enregistrer' : 'Créer'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ConfigSection() {
  const { globalConfig, updateConfig } = useSubscriptions();
  const [currency, setCurrency] = useState(globalConfig.defaultCurrency);
  const [billingCycle, setBillingCycle] = useState(globalConfig.defaultBillingCycle);
  const [trialDays, setTrialDays] = useState(String(globalConfig.trialDays));
  const [termsUrl, setTermsUrl] = useState(globalConfig.termsUrl);
  const [billingEmail, setBillingEmail] = useState(globalConfig.billingEmail);
  const [reminderDays, setReminderDays] = useState(String(globalConfig.reminderDaysBefore));

  const handleSave = useCallback(() => {
    updateConfig({
      defaultCurrency: currency,
      defaultBillingCycle: billingCycle,
      trialDays: parseInt(trialDays, 10) || 0,
      termsUrl: termsUrl.trim(),
      billingEmail: billingEmail.trim(),
      reminderDaysBefore: parseInt(reminderDays, 10) || 30,
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Succès', 'Configuration enregistrée.');
  }, [currency, billingCycle, trialDays, termsUrl, billingEmail, reminderDays, updateConfig]);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Configuration globale</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Devise par défaut</Text>
        <View style={styles.billingTypeRow}>
          {['EUR', 'USD', 'GBP', 'CHF'].map((c) => (
            <TouchableOpacity key={c} style={[styles.billingTypeBtn, currency === c && styles.billingTypeBtnActive]} onPress={() => setCurrency(c)}>
              <Text style={[styles.billingTypeBtnText, currency === c && styles.billingTypeBtnTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Cycle de facturation par défaut</Text>
        <View style={styles.billingTypeRow}>
          <TouchableOpacity style={[styles.billingTypeBtn, billingCycle === 'monthly' && styles.billingTypeBtnActive]} onPress={() => setBillingCycle('monthly')}>
            <Text style={[styles.billingTypeBtnText, billingCycle === 'monthly' && styles.billingTypeBtnTextActive]}>Mensuel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.billingTypeBtn, billingCycle === 'yearly' && styles.billingTypeBtnActive]} onPress={() => setBillingCycle('yearly')}>
            <Text style={[styles.billingTypeBtnText, billingCycle === 'yearly' && styles.billingTypeBtnTextActive]}>Annuel</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Durée d{"'"}essai gratuit (jours)</Text>
        <TextInput style={styles.input} value={trialDays} onChangeText={setTrialDays} keyboardType="numeric" placeholderTextColor={SA.textMuted} />

        <Text style={styles.fieldLabel}>URL Conditions générales</Text>
        <TextInput style={styles.input} value={termsUrl} onChangeText={setTermsUrl} placeholder="https://..." placeholderTextColor={SA.textMuted} />

        <Text style={styles.fieldLabel}>Email de facturation</Text>
        <TextInput style={styles.input} value={billingEmail} onChangeText={setBillingEmail} placeholder="facturation@..." placeholderTextColor={SA.textMuted} keyboardType="email-address" />

        <Text style={styles.fieldLabel}>Rappel avant expiration (jours)</Text>
        <TextInput style={styles.input} value={reminderDays} onChangeText={setReminderDays} keyboardType="numeric" placeholderTextColor={SA.textMuted} />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Check size={16} color="#FFF" />
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  loadingContainer: { flex: 1, backgroundColor: SA.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: SA.textSec, fontSize: 14 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitleText: { fontSize: 16, fontWeight: '700' as const, color: SA.text },

  tabBar: { backgroundColor: SA.surface, borderBottomWidth: 1, borderBottomColor: SA.border, maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, gap: 4, alignItems: 'center' },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: SA.accent },
  tabLabel: { fontSize: 12, color: SA.textMuted, fontWeight: '600' as const },
  tabLabelActive: { color: SA.accent },

  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionContainer: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800' as const, color: SA.text },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SA.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#FFF' },

  card: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700' as const, color: SA.text },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '47%' as unknown as number, backgroundColor: SA.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: SA.border, flexGrow: 1, gap: 4 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 24, fontWeight: '800' as const, color: SA.text },
  kpiLabel: { fontSize: 11, color: SA.textSec },

  planDistRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  planDistItem: { alignItems: 'center', gap: 2, minWidth: 60 },
  planDistDot: { width: 10, height: 10, borderRadius: 5 },
  planDistCount: { fontSize: 18, fontWeight: '800' as const, color: SA.text },
  planDistName: { fontSize: 10, color: SA.textSec },

  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: SA.surfaceLight, flexDirection: 'row', overflow: 'hidden' },
  progressBarSegment: { height: 8 },

  revenueRow: { flexDirection: 'row', alignItems: 'center' },
  revenueItem: { flex: 1, alignItems: 'center', gap: 2 },
  revenueValue: { fontSize: 22, fontWeight: '800' as const, color: SA.text },
  revenueLabel: { fontSize: 11, color: SA.textSec },
  revenueDivider: { width: 1, height: 36, backgroundColor: SA.border },

  promoBadgeRow: { flexDirection: 'row', gap: 8 },
  promoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  promoBadgeText: { fontSize: 12, fontWeight: '600' as const },

  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SA.border },
  subRowLeft: { flex: 1 },
  subHotelName: { fontSize: 13, fontWeight: '600' as const, color: SA.text },
  subPlanName: { fontSize: 11, color: SA.textSec, marginTop: 1 },
  subStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subStatusText: { fontSize: 11, fontWeight: '600' as const },

  planCard: { backgroundColor: SA.surface, borderRadius: 14, borderWidth: 1, borderColor: SA.border, overflow: 'hidden' },
  planCardInactive: { opacity: 0.55 },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  planColorStrip: { width: 4, height: 40, borderRadius: 2 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  planDesc: { fontSize: 11, color: SA.textSec, marginTop: 2, maxWidth: 160 },
  planCardRight: { alignItems: 'flex-end', gap: 4 },
  planPrice: { fontSize: 16, fontWeight: '800' as const, color: SA.text },
  planPriceSuffix: { fontSize: 11, fontWeight: '400' as const, color: SA.textSec },

  planExpanded: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: SA.border, gap: 12 },
  planMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  planMeta: { backgroundColor: SA.surfaceLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minWidth: '45%' as unknown as number, flexGrow: 1 },
  planMetaLabel: { fontSize: 10, color: SA.textMuted },
  planMetaValue: { fontSize: 13, fontWeight: '700' as const, color: SA.text, marginTop: 2 },

  featureListTitle: { fontSize: 12, fontWeight: '600' as const, color: SA.textSec },
  featureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22C55E10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featureTagText: { fontSize: 11, color: SA.text },

  planActions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  editAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600' as const },

  inactiveBadge: { backgroundColor: '#78909C20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inactiveBadgeText: { fontSize: 11, fontWeight: '600' as const, color: '#78909C' },

  featureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SA.border },
  featureRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  featureDot: { width: 8, height: 8, borderRadius: 4 },
  featureRowName: { fontSize: 13, fontWeight: '600' as const, color: SA.text },
  featureRowDesc: { fontSize: 11, color: SA.textSec, marginTop: 1 },
  featureRowActions: { flexDirection: 'row', gap: 12 },
  miniAction: { padding: 6 },

  addonCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, gap: 10 },
  addonTop: { flexDirection: 'row', justifyContent: 'space-between' },
  addonLeft: { flex: 1, marginRight: 12 },
  addonName: { fontSize: 14, fontWeight: '700' as const, color: SA.text },
  addonDesc: { fontSize: 11, color: SA.textSec, marginTop: 2 },
  addonRight: { alignItems: 'flex-end', gap: 4 },
  addonPrice: { fontSize: 18, fontWeight: '800' as const, color: SA.text },
  billingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  billingBadgeText: { fontSize: 10, fontWeight: '600' as const },
  addonActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: SA.border, paddingTop: 10 },

  promoCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, gap: 10 },
  promoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  promoLeft: { flex: 1, marginRight: 12 },
  promoCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promoCode: { fontSize: 16, fontWeight: '800' as const, color: SA.accent, letterSpacing: 1 },
  promoDesc: { fontSize: 12, color: SA.textSec, marginTop: 4 },
  promoStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  promoStatusDot: { width: 6, height: 6, borderRadius: 3 },
  promoStatusText: { fontSize: 11, fontWeight: '600' as const },
  promoDetails: { flexDirection: 'row', gap: 8 },
  promoDetailItem: { flex: 1, backgroundColor: SA.surfaceLight, borderRadius: 8, padding: 10, alignItems: 'center' },
  promoDetailLabel: { fontSize: 10, color: SA.textMuted },
  promoDetailValue: { fontSize: 14, fontWeight: '700' as const, color: SA.text, marginTop: 2 },
  promoPeriod: { fontSize: 11, color: SA.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: SA.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: SA.border },
  modalTitle: { fontSize: 17, fontWeight: '700' as const, color: SA.text },
  modalScroll: { padding: 20 },

  fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: SA.textSec, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: SA.surfaceLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: SA.text, borderWidth: 1, borderColor: SA.border },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },

  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SA.surfaceLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: SA.border },
  selectText: { fontSize: 14, color: SA.text },
  dropdownInline: { backgroundColor: SA.surfaceLight, borderRadius: 10, borderWidth: 1, borderColor: SA.border, marginTop: 4 },
  dropdownInlineItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SA.border },
  dropdownInlineText: { fontSize: 13, color: SA.text },

  featureCatBlock: { marginTop: 8, gap: 2 },
  featureCatTitle: { fontSize: 12, fontWeight: '700' as const, color: SA.accent, marginBottom: 4 },
  featureCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: SA.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: SA.accent, borderColor: SA.accent },
  featureCheckLabel: { fontSize: 13, color: SA.text },

  billingTypeRow: { flexDirection: 'row', gap: 8 },
  billingTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: SA.surfaceLight, borderWidth: 1, borderColor: SA.border },
  billingTypeBtnActive: { backgroundColor: SA.accent, borderColor: SA.accent },
  billingTypeBtnText: { fontSize: 12, fontWeight: '600' as const, color: SA.textSec },
  billingTypeBtnTextActive: { color: '#FFF' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 8 },
  switchLabel: { fontSize: 13, color: SA.text },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SA.accent, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  saveBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
});

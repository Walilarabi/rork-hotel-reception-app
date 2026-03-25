import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  SubscriptionPlanDetail,
  Feature,
  Addon,
  Promotion,
  HotelSubscription,
  SubscriptionGlobalConfig,
} from '@/constants/types';
import {
  INITIAL_PLANS,
  INITIAL_FEATURES,
  INITIAL_ADDONS,
  INITIAL_PROMOTIONS,
  INITIAL_HOTEL_SUBSCRIPTIONS,
  INITIAL_GLOBAL_CONFIG,
} from '@/mocks/subscriptions';

const PLANS_KEY = 'sub_plans';
const FEATURES_KEY = 'sub_features';
const ADDONS_KEY = 'sub_addons';
const PROMOS_KEY = 'sub_promotions';
const HOTEL_SUBS_KEY = 'sub_hotel_subscriptions';
const CONFIG_KEY = 'sub_global_config';

function makeLoader<T>(key: string, initial: T) {
  return async (): Promise<T> => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(initial) ? (Array.isArray(parsed) && parsed.length > 0) : parsed) return parsed;
      }
    } catch (e) {
      console.log(`[Subscription] Error reading ${key}:`, e);
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.setItem(key, JSON.stringify(initial));
    return initial;
  };
}

export const [SubscriptionProvider, useSubscriptions] = createContextHook(() => {
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [hotelSubs, setHotelSubs] = useState<HotelSubscription[]>([]);
  const [globalConfig, setGlobalConfig] = useState<SubscriptionGlobalConfig>(INITIAL_GLOBAL_CONFIG);

  const plansQ = useQuery({ queryKey: ['sub_plans'], queryFn: makeLoader(PLANS_KEY, INITIAL_PLANS) });
  const featuresQ = useQuery({ queryKey: ['sub_features'], queryFn: makeLoader(FEATURES_KEY, INITIAL_FEATURES) });
  const addonsQ = useQuery({ queryKey: ['sub_addons'], queryFn: makeLoader(ADDONS_KEY, INITIAL_ADDONS) });
  const promosQ = useQuery({ queryKey: ['sub_promotions'], queryFn: makeLoader(PROMOS_KEY, INITIAL_PROMOTIONS) });
  const hotelSubsQ = useQuery({ queryKey: ['sub_hotel_subs'], queryFn: makeLoader(HOTEL_SUBS_KEY, INITIAL_HOTEL_SUBSCRIPTIONS) });
  const configQ = useQuery({ queryKey: ['sub_config'], queryFn: makeLoader(CONFIG_KEY, INITIAL_GLOBAL_CONFIG) });

  useEffect(() => { if (plansQ.data) setPlans(plansQ.data); }, [plansQ.data]);
  useEffect(() => { if (featuresQ.data) setFeatures(featuresQ.data); }, [featuresQ.data]);
  useEffect(() => { if (addonsQ.data) setAddons(addonsQ.data); }, [addonsQ.data]);
  useEffect(() => { if (promosQ.data) setPromotions(promosQ.data); }, [promosQ.data]);
  useEffect(() => { if (hotelSubsQ.data) setHotelSubs(hotelSubsQ.data); }, [hotelSubsQ.data]);
  useEffect(() => { if (configQ.data) setGlobalConfig(configQ.data); }, [configQ.data]);

  const persist = useCallback(async <T,>(key: string, data: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addPlanMutation = useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlanDetail, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newPlan: SubscriptionPlanDetail = {
        ...plan,
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...plans, newPlan];
      setPlans(updated);
      await persist(PLANS_KEY, updated);
      return newPlan;
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (params: { planId: string; updates: Partial<SubscriptionPlanDetail> }) => {
      const updated = plans.map((p) =>
        p.id === params.planId ? { ...p, ...params.updates, updatedAt: new Date().toISOString() } : p
      );
      setPlans(updated);
      await persist(PLANS_KEY, updated);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const updated = plans.map((p) => p.id === planId ? { ...p, isActive: false } : p);
      setPlans(updated);
      await persist(PLANS_KEY, updated);
    },
  });

  const addFeatureMutation = useMutation({
    mutationFn: async (feature: Omit<Feature, 'id'>) => {
      const newFeature: Feature = { ...feature, id: `f-${Date.now()}` };
      const updated = [...features, newFeature];
      setFeatures(updated);
      await persist(FEATURES_KEY, updated);
      return newFeature;
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async (params: { featureId: string; updates: Partial<Feature> }) => {
      const updated = features.map((f) => f.id === params.featureId ? { ...f, ...params.updates } : f);
      setFeatures(updated);
      await persist(FEATURES_KEY, updated);
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const updated = features.filter((f) => f.id !== featureId);
      setFeatures(updated);
      await persist(FEATURES_KEY, updated);
      const updatedPlans = plans.map((p) => ({
        ...p,
        featureIds: p.featureIds.filter((fid) => fid !== featureId),
      }));
      setPlans(updatedPlans);
      await persist(PLANS_KEY, updatedPlans);
    },
  });

  const addAddonMutation = useMutation({
    mutationFn: async (addon: Omit<Addon, 'id'>) => {
      const newAddon: Addon = { ...addon, id: `addon-${Date.now()}` };
      const updated = [...addons, newAddon];
      setAddons(updated);
      await persist(ADDONS_KEY, updated);
      return newAddon;
    },
  });

  const updateAddonMutation = useMutation({
    mutationFn: async (params: { addonId: string; updates: Partial<Addon> }) => {
      const updated = addons.map((a) => a.id === params.addonId ? { ...a, ...params.updates } : a);
      setAddons(updated);
      await persist(ADDONS_KEY, updated);
    },
  });

  const deleteAddonMutation = useMutation({
    mutationFn: async (addonId: string) => {
      const updated = addons.map((a) => a.id === addonId ? { ...a, isActive: false } : a);
      setAddons(updated);
      await persist(ADDONS_KEY, updated);
    },
  });

  const addPromotionMutation = useMutation({
    mutationFn: async (promo: Omit<Promotion, 'id' | 'currentUses'>) => {
      const newPromo: Promotion = { ...promo, id: `promo-${Date.now()}`, currentUses: 0 };
      const updated = [...promotions, newPromo];
      setPromotions(updated);
      await persist(PROMOS_KEY, updated);
      return newPromo;
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async (params: { promoId: string; updates: Partial<Promotion> }) => {
      const updated = promotions.map((p) => p.id === params.promoId ? { ...p, ...params.updates } : p);
      setPromotions(updated);
      await persist(PROMOS_KEY, updated);
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (promoId: string) => {
      const updated = promotions.map((p) => p.id === promoId ? { ...p, isActive: false } : p);
      setPromotions(updated);
      await persist(PROMOS_KEY, updated);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<SubscriptionGlobalConfig>) => {
      const updated = { ...globalConfig, ...updates };
      setGlobalConfig(updated);
      await persist(CONFIG_KEY, updated);
    },
  });

  const isLoading = plansQ.isLoading || featuresQ.isLoading || addonsQ.isLoading || promosQ.isLoading || hotelSubsQ.isLoading;

  const stats = useMemo(() => {
    const activeSubs = hotelSubs.filter((s) => s.status === 'active').length;
    const trialSubs = hotelSubs.filter((s) => s.status === 'trial').length;
    const expiredSubs = hotelSubs.filter((s) => s.status === 'expired').length;

    const monthlyRevenue = hotelSubs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.priceAtSubscription, 0);

    const planDistribution = plans.map((p) => ({
      planId: p.id,
      planName: p.name,
      count: hotelSubs.filter((s) => s.planId === p.id && (s.status === 'active' || s.status === 'trial')).length,
      color: p.sortOrder === 1 ? '#78909C' : p.sortOrder === 2 ? '#3B82F6' : p.sortOrder === 3 ? '#F59E0B' : '#7C4DFF',
    }));

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringCount = hotelSubs.filter((s) => {
      if (!s.endDate || s.status !== 'active') return false;
      const end = new Date(s.endDate);
      return end > now && end <= thirtyDaysLater;
    }).length;

    const activePromos = promotions.filter((p) => p.isActive).length;

    return {
      activeSubs,
      trialSubs,
      expiredSubs,
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
      planDistribution,
      expiringCount,
      activePromos,
      totalSubs: hotelSubs.length,
      conversionRate: activeSubs > 0 && trialSubs > 0 ? Math.round((activeSubs / (activeSubs + trialSubs)) * 100) : activeSubs > 0 ? 100 : 0,
    };
  }, [hotelSubs, plans, promotions]);

  return {
    plans,
    features,
    addons,
    promotions,
    hotelSubs,
    globalConfig,
    isLoading,
    stats,
    addPlan: addPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    deletePlan: deletePlanMutation.mutate,
    addFeature: addFeatureMutation.mutate,
    updateFeature: updateFeatureMutation.mutate,
    deleteFeature: deleteFeatureMutation.mutate,
    addAddon: addAddonMutation.mutate,
    updateAddon: updateAddonMutation.mutate,
    deleteAddon: deleteAddonMutation.mutate,
    addPromotion: addPromotionMutation.mutate,
    updatePromotion: updatePromotionMutation.mutate,
    deletePromotion: deletePromotionMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
  };
});

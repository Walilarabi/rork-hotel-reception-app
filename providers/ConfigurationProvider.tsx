import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  ConfigProductCategory,
  ConfigProduct,
  ConfigChecklistItem,
  ConfigProblemTemplate,
  ConfigRoomType,
  HousekeeperDetail,
} from '@/constants/configTypes';
import {
  INITIAL_PRODUCT_CATEGORIES,
  INITIAL_CONFIG_PRODUCTS,
  INITIAL_CHECKLIST_ITEMS,
  INITIAL_PROBLEM_TEMPLATES,
  INITIAL_CONFIG_ROOM_TYPES,
  INITIAL_HOUSEKEEPER_DETAILS,
} from '@/mocks/configuration';

const PRODUCT_CATEGORIES_KEY = 'config_product_categories';
const PRODUCTS_KEY = 'config_products';
const CHECKLIST_KEY = 'config_checklist_items';
const PROBLEM_TEMPLATES_KEY = 'config_problem_templates';
const ROOM_TYPES_KEY = 'config_room_types';
const HOUSEKEEPER_DETAILS_KEY = 'config_housekeeper_details';

function makeQuery<T>(key: string, initial: T) {
  return {
    queryKey: [key],
    queryFn: async (): Promise<T> => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as T;
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
        }
      } catch (e) {
        console.log(`[ConfigProvider] Error reading ${key}:`, e);
        await AsyncStorage.removeItem(key);
      }
      await AsyncStorage.setItem(key, JSON.stringify(initial));
      return initial;
    },
  };
}

export const [ConfigurationProvider, useConfiguration] = createContextHook(() => {
  const [productCategories, setProductCategories] = useState<ConfigProductCategory[]>([]);
  const [products, setProducts] = useState<ConfigProduct[]>([]);
  const [checklistItems, setChecklistItems] = useState<ConfigChecklistItem[]>([]);
  const [problemTemplates, setProblemTemplates] = useState<ConfigProblemTemplate[]>([]);
  const [roomTypes, setRoomTypes] = useState<ConfigRoomType[]>([]);
  const [housekeeperDetails, setHousekeeperDetails] = useState<HousekeeperDetail[]>([]);

  const catQ = useQuery(makeQuery<ConfigProductCategory[]>(PRODUCT_CATEGORIES_KEY, INITIAL_PRODUCT_CATEGORIES));
  const prodQ = useQuery(makeQuery<ConfigProduct[]>(PRODUCTS_KEY, INITIAL_CONFIG_PRODUCTS));
  const checkQ = useQuery(makeQuery<ConfigChecklistItem[]>(CHECKLIST_KEY, INITIAL_CHECKLIST_ITEMS));
  const probQ = useQuery(makeQuery<ConfigProblemTemplate[]>(PROBLEM_TEMPLATES_KEY, INITIAL_PROBLEM_TEMPLATES));
  const rtQ = useQuery(makeQuery<ConfigRoomType[]>(ROOM_TYPES_KEY, INITIAL_CONFIG_ROOM_TYPES));
  const hkQ = useQuery(makeQuery<HousekeeperDetail[]>(HOUSEKEEPER_DETAILS_KEY, INITIAL_HOUSEKEEPER_DETAILS));

  useEffect(() => { if (catQ.data) setProductCategories(catQ.data); }, [catQ.data]);
  useEffect(() => { if (prodQ.data) setProducts(prodQ.data); }, [prodQ.data]);
  useEffect(() => { if (checkQ.data) setChecklistItems(checkQ.data); }, [checkQ.data]);
  useEffect(() => { if (probQ.data) setProblemTemplates(probQ.data); }, [probQ.data]);
  useEffect(() => { if (rtQ.data) setRoomTypes(rtQ.data); }, [rtQ.data]);
  useEffect(() => { if (hkQ.data) setHousekeeperDetails(hkQ.data); }, [hkQ.data]);

  const persist = useCallback(async <T,>(key: string, data: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addProductCategoryMutation = useMutation({
    mutationFn: async (cat: Omit<ConfigProductCategory, 'id'>) => {
      const newCat: ConfigProductCategory = { ...cat, id: `cat-${Date.now()}` };
      const updated = [...productCategories, newCat];
      setProductCategories(updated);
      await persist(PRODUCT_CATEGORIES_KEY, updated);
      return newCat;
    },
  });

  const updateProductCategoryMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ConfigProductCategory> }) => {
      const updated = productCategories.map((c) => c.id === params.id ? { ...c, ...params.updates } : c);
      setProductCategories(updated);
      await persist(PRODUCT_CATEGORIES_KEY, updated);
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (prod: Omit<ConfigProduct, 'id'>) => {
      const newProd: ConfigProduct = { ...prod, id: `cprod-${Date.now()}` };
      const updated = [...products, newProd];
      setProducts(updated);
      await persist(PRODUCTS_KEY, updated);
      return newProd;
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ConfigProduct> }) => {
      const updated = products.map((p) => p.id === params.id ? { ...p, ...params.updates } : p);
      setProducts(updated);
      await persist(PRODUCTS_KEY, updated);
    },
  });

  const addChecklistItemMutation = useMutation({
    mutationFn: async (item: Omit<ConfigChecklistItem, 'id'>) => {
      const newItem: ConfigChecklistItem = { ...item, id: `cl-${Date.now()}` };
      const updated = [...checklistItems, newItem];
      setChecklistItems(updated);
      await persist(CHECKLIST_KEY, updated);
      return newItem;
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ConfigChecklistItem> }) => {
      const updated = checklistItems.map((i) => i.id === params.id ? { ...i, ...params.updates } : i);
      setChecklistItems(updated);
      await persist(CHECKLIST_KEY, updated);
    },
  });

  const addProblemTemplateMutation = useMutation({
    mutationFn: async (tpl: Omit<ConfigProblemTemplate, 'id'>) => {
      const newTpl: ConfigProblemTemplate = { ...tpl, id: `pt-${Date.now()}` };
      const updated = [...problemTemplates, newTpl];
      setProblemTemplates(updated);
      await persist(PROBLEM_TEMPLATES_KEY, updated);
      return newTpl;
    },
  });

  const updateProblemTemplateMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ConfigProblemTemplate> }) => {
      const updated = problemTemplates.map((t) => t.id === params.id ? { ...t, ...params.updates } : t);
      setProblemTemplates(updated);
      await persist(PROBLEM_TEMPLATES_KEY, updated);
    },
  });

  const addRoomTypeMutation = useMutation({
    mutationFn: async (rt: Omit<ConfigRoomType, 'id'>) => {
      const newRt: ConfigRoomType = { ...rt, id: `rt-${Date.now()}` };
      const updated = [...roomTypes, newRt];
      setRoomTypes(updated);
      await persist(ROOM_TYPES_KEY, updated);
      return newRt;
    },
  });

  const updateRoomTypeMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ConfigRoomType> }) => {
      const updated = roomTypes.map((r) => r.id === params.id ? { ...r, ...params.updates } : r);
      setRoomTypes(updated);
      await persist(ROOM_TYPES_KEY, updated);
    },
  });

  const addHousekeeperMutation = useMutation({
    mutationFn: async (hk: Omit<HousekeeperDetail, 'id'>) => {
      const newHk: HousekeeperDetail = { ...hk, id: `hk-${Date.now()}` };
      const updated = [...housekeeperDetails, newHk];
      setHousekeeperDetails(updated);
      await persist(HOUSEKEEPER_DETAILS_KEY, updated);
      return newHk;
    },
  });

  const updateHousekeeperMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<HousekeeperDetail> }) => {
      const updated = housekeeperDetails.map((h) => h.id === params.id ? { ...h, ...params.updates } : h);
      setHousekeeperDetails(updated);
      await persist(HOUSEKEEPER_DETAILS_KEY, updated);
    },
  });

  const isLoading = catQ.isLoading || prodQ.isLoading || checkQ.isLoading || probQ.isLoading || rtQ.isLoading || hkQ.isLoading;

  return useMemo(() => ({
    productCategories,
    products,
    checklistItems,
    problemTemplates,
    roomTypes,
    housekeeperDetails,
    isLoading,
    addProductCategory: addProductCategoryMutation.mutate,
    updateProductCategory: updateProductCategoryMutation.mutate,
    addProduct: addProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    addChecklistItem: addChecklistItemMutation.mutate,
    updateChecklistItem: updateChecklistItemMutation.mutate,
    addProblemTemplate: addProblemTemplateMutation.mutate,
    updateProblemTemplate: updateProblemTemplateMutation.mutate,
    addRoomType: addRoomTypeMutation.mutate,
    updateRoomType: updateRoomTypeMutation.mutate,
    addHousekeeper: addHousekeeperMutation.mutate,
    updateHousekeeper: updateHousekeeperMutation.mutate,
  }), [
    productCategories, products, checklistItems, problemTemplates, roomTypes, housekeeperDetails, isLoading,
    addProductCategoryMutation.mutate, updateProductCategoryMutation.mutate,
    addProductMutation.mutate, updateProductMutation.mutate,
    addChecklistItemMutation.mutate, updateChecklistItemMutation.mutate,
    addProblemTemplateMutation.mutate, updateProblemTemplateMutation.mutate,
    addRoomTypeMutation.mutate, updateRoomTypeMutation.mutate,
    addHousekeeperMutation.mutate, updateHousekeeperMutation.mutate,
  ]);
});

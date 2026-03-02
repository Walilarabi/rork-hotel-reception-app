import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, Plus, TrendingDown, TrendingUp, Package, BarChart3, Calendar, Edit3, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import {
  ConsumableProduct,
  ConsumableCategory,
  CONSUMABLE_CATEGORY_CONFIG,
  ConsumptionLog,
} from '@/constants/types';

type TabKey = 'stocks' | 'consumptions' | 'analytics' | 'daily';
type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export default function EconomatScreen() {
  const {
    consumableProducts,
    consumptionLogs,
    lowStockConsumables,
    todayConsumptionTotal,
    addStockEntry,
    updateConsumableProduct,
  } = useHotel();
  const { t, isDarkMode, modeColors } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('stocks');
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ConsumableCategory | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [showAddStock, setShowAddStock] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct | null>(null);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockPrice, setAddStockPrice] = useState('');
  const [editPriceValue, setEditPriceValue] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const bg = isDarkMode ? modeColors.background : '#F0F4F7';
  const cardBg = isDarkMode ? modeColors.surface : Colors.surface;
  const textColor = isDarkMode ? modeColors.text : Colors.text;
  const textSec = isDarkMode ? modeColors.textSecondary : Colors.textSecondary;
  const textMut = isDarkMode ? modeColors.textMuted : Colors.textMuted;
  const borderColor = isDarkMode ? modeColors.border : Colors.borderLight;

  const filterByPeriod = useCallback((date: string) => {
    if (periodFilter === 'all') return true;
    const d = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (periodFilter) {
      case 'today':
        return d >= today;
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return d >= monthAgo;
      }
      case 'year': {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return d >= yearAgo;
      }
      default:
        return true;
    }
  }, [periodFilter]);

  const filteredProducts = useMemo(() => {
    let result = consumableProducts;
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      const aLow = a.currentStock <= a.lowStockThreshold ? 0 : 1;
      const bLow = b.currentStock <= b.lowStockThreshold ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.name.localeCompare(b.name);
    });
  }, [consumableProducts, categoryFilter, searchText]);

  const filteredLogs = useMemo(() => {
    let result = [...consumptionLogs].sort((a, b) =>
      new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
    result = result.filter((l) => filterByPeriod(l.reportedAt));
    if (categoryFilter !== 'all') {
      result = result.filter((l) => l.category === categoryFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((l) =>
        l.productName.toLowerCase().includes(q) ||
        l.roomNumber.includes(q)
      );
    }
    return result;
  }, [consumptionLogs, categoryFilter, searchText, filterByPeriod]);

  const dailySummary = useMemo(() => {
    const map = new Map<string, { date: string; total: number; count: number; items: number }>();
    const logsToUse = consumptionLogs.filter((l) => filterByPeriod(l.reportedAt));
    for (const log of logsToUse) {
      const day = log.reportedAt.split('T')[0];
      const existing = map.get(day) ?? { date: day, total: 0, count: 0, items: 0 };
      existing.total += log.totalPrice;
      existing.count += 1;
      existing.items += log.quantity;
      map.set(day, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [consumptionLogs, filterByPeriod]);

  const selectedDayLogs = useMemo(() => {
    if (!selectedDay) return [];
    return consumptionLogs
      .filter((l) => l.reportedAt.startsWith(selectedDay))
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [consumptionLogs, selectedDay]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; cost: number }> = {};
    const logsToUse = consumptionLogs.filter((l) => filterByPeriod(l.reportedAt));
    for (const log of logsToUse) {
      if (!stats[log.category]) stats[log.category] = { count: 0, cost: 0 };
      stats[log.category].count += log.quantity;
      stats[log.category].cost += log.totalPrice;
    }
    return stats;
  }, [consumptionLogs, filterByPeriod]);

  const totalCost = useMemo(() =>
    consumptionLogs.filter((l) => filterByPeriod(l.reportedAt)).reduce((s, l) => s + l.totalPrice, 0),
    [consumptionLogs, filterByPeriod]
  );

  const roomCosts = useMemo(() => {
    const map = new Map<string, { roomNumber: string; total: number; count: number }>();
    const logsToUse = consumptionLogs.filter((l) => filterByPeriod(l.reportedAt));
    for (const log of logsToUse) {
      const existing = map.get(log.roomId) ?? { roomNumber: log.roomNumber, total: 0, count: 0 };
      existing.total += log.totalPrice;
      existing.count += log.quantity;
      map.set(log.roomId, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [consumptionLogs, filterByPeriod]);

  const totalStockValue = useMemo(() =>
    consumableProducts.reduce((s, p) => s + p.currentStock * p.unitPrice, 0),
    [consumableProducts]
  );

  const handleOpenAddStock = useCallback((product: ConsumableProduct) => {
    setSelectedProduct(product);
    setAddStockQty('');
    setAddStockPrice(product.unitPrice.toFixed(2));
    setShowAddStock(true);
  }, []);

  const handleOpenEditPrice = useCallback((product: ConsumableProduct) => {
    setSelectedProduct(product);
    setEditPriceValue(product.unitPrice.toFixed(2));
    setShowEditPrice(true);
  }, []);

  const handleSubmitAddStock = useCallback(() => {
    if (!selectedProduct) return;
    const qty = parseInt(addStockQty, 10);
    const price = parseFloat(addStockPrice);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(t.common.error, 'Quantité invalide');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert(t.common.error, 'Prix invalide');
      return;
    }
    addStockEntry({
      productId: selectedProduct.id,
      quantity: qty,
      unitPrice: price,
      reportedBy: 'Gouvernante',
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Stock ajouté', `+${qty} ${selectedProduct.name}`);
    setShowAddStock(false);
    setSelectedProduct(null);
  }, [selectedProduct, addStockQty, addStockPrice, addStockEntry, t]);

  const handleSubmitEditPrice = useCallback(() => {
    if (!selectedProduct) return;
    const price = parseFloat(editPriceValue);
    if (isNaN(price) || price < 0) {
      Alert.alert(t.common.error, 'Prix invalide');
      return;
    }
    updateConsumableProduct({
      productId: selectedProduct.id,
      updates: { unitPrice: price },
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Prix mis à jour', `${selectedProduct.name}: ${price.toFixed(2)}€`);
    setShowEditPrice(false);
    setSelectedProduct(null);
  }, [selectedProduct, editPriceValue, updateConsumableProduct, t]);

  const getStockStatus = useCallback((product: ConsumableProduct) => {
    if (product.currentStock <= 0) return { label: 'Rupture', color: '#C62828', bg: '#FFCDD2' };
    if (product.currentStock <= product.lowStockThreshold) return { label: 'Critique', color: '#E65100', bg: '#FFE0B2' };
    if (product.currentStock <= product.lowStockThreshold * 1.5) return { label: 'Bas', color: '#F9A825', bg: '#FFF9C4' };
    return { label: 'OK', color: '#2E7D32', bg: '#E8F5E9' };
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return `${days[d.getDay()]} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const renderProductItem = useCallback(({ item }: { item: ConsumableProduct }) => {
    const status = getStockStatus(item);
    const stockValue = (item.currentStock * item.unitPrice).toFixed(2);
    return (
      <View style={[s.productCard, { backgroundColor: cardBg }]}>
        <View style={s.productCardLeft}>
          <Text style={s.productCardIcon}>{item.icon}</Text>
          <View style={s.productCardInfo}>
            <Text style={[s.productCardName, { color: textColor }]}>{item.name}</Text>
            <Text style={[s.productCardMeta, { color: textMut }]}>
              {CONSUMABLE_CATEGORY_CONFIG[item.category].label} • {item.unitPrice.toFixed(2)}€/{item.unit}
            </Text>
            <Text style={[s.productStockValue, { color: textSec }]}>Valeur: {stockValue}€</Text>
          </View>
        </View>
        <View style={s.productCardRight}>
          <View style={[s.stockBadge, { backgroundColor: status.bg }]}>
            <Text style={[s.stockBadgeText, { color: status.color }]}>{item.currentStock}</Text>
          </View>
          <View style={s.productActions}>
            <TouchableOpacity
              style={s.editPriceBtn}
              onPress={() => handleOpenEditPrice(item)}
              activeOpacity={0.7}
            >
              <Edit3 size={14} color={Colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.addStockBtn}
              onPress={() => handleOpenAddStock(item)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [getStockStatus, handleOpenAddStock, handleOpenEditPrice, cardBg, textColor, textMut, textSec]);

  const renderConsumptionItem = useCallback(({ item }: { item: ConsumptionLog }) => {
    const date = new Date(item.reportedAt);
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (
      <View style={[s.logCard, { backgroundColor: cardBg }]}>
        <Text style={s.logIcon}>{item.productIcon}</Text>
        <View style={s.logInfo}>
          <Text style={[s.logName, { color: textColor }]}>{item.productName}</Text>
          <Text style={[s.logMeta, { color: textMut }]}>Ch. {item.roomNumber} • {item.reportedBy} • {timeStr}</Text>
        </View>
        <View style={s.logRight}>
          <Text style={[s.logQty, { color: textColor }]}>×{item.quantity}</Text>
          <Text style={[s.logCost, { color: textSec }]}>{item.totalPrice.toFixed(2)}€</Text>
        </View>
      </View>
    );
  }, [cardBg, textColor, textMut, textSec]);

  const renderDailyItem = useCallback(({ item }: { item: { date: string; total: number; count: number; items: number } }) => (
    <TouchableOpacity
      style={[s.dailyCard, { backgroundColor: cardBg }]}
      onPress={() => setSelectedDay(item.date)}
      activeOpacity={0.7}
    >
      <View style={s.dailyLeft}>
        <View style={s.dailyIconContainer}>
          <Calendar size={16} color={Colors.primary} />
        </View>
        <View>
          <Text style={[s.dailyDate, { color: textColor }]}>{formatDate(item.date)}</Text>
          <Text style={[s.dailyInfo, { color: textMut }]}>{item.count} enregistrements • {item.items} articles</Text>
        </View>
      </View>
      <View style={s.dailyRight}>
        <Text style={[s.dailyTotal, { color: Colors.primary }]}>{item.total.toFixed(2)}€</Text>
        <ChevronRight size={14} color={textMut} />
      </View>
    </TouchableOpacity>
  ), [cardBg, textColor, textMut, formatDate]);

  const periodOptions: { key: PeriodFilter; label: string }[] = [
    { key: 'today', label: t.common.today },
    { key: 'week', label: t.common.thisWeek },
    { key: 'month', label: t.common.thisMonth },
    { key: 'year', label: t.common.thisYear },
    { key: 'all', label: t.common.all },
  ];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: t.economat.title,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { backgroundColor: cardBg }]}>
          <Package size={18} color="#5C6BC0" />
          <Text style={[s.kpiValue, { color: textColor }]}>{consumableProducts.length}</Text>
          <Text style={[s.kpiLabel, { color: textSec }]}>{t.economat.articles}</Text>
        </View>
        <View style={[s.kpiCard, lowStockConsumables.length > 0 && s.kpiCardAlert, { backgroundColor: cardBg }]}>
          <TrendingDown size={18} color={lowStockConsumables.length > 0 ? '#E53935' : '#FB8C00'} />
          <Text style={[s.kpiValue, lowStockConsumables.length > 0 && { color: '#E53935' }, { color: textColor }]}>
            {lowStockConsumables.length}
          </Text>
          <Text style={[s.kpiLabel, { color: textSec }]}>{t.economat.lowStock}</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: cardBg }]}>
          <TrendingUp size={18} color="#00897B" />
          <Text style={[s.kpiValue, { color: textColor }]}>{todayConsumptionTotal.toFixed(0)}€</Text>
          <Text style={[s.kpiLabel, { color: textSec }]}>{t.economat.todayTotal}</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: cardBg }]}>
          <BarChart3 size={18} color="#5C6BC0" />
          <Text style={[s.kpiValue, { color: textColor }]}>{totalStockValue.toFixed(0)}€</Text>
          <Text style={[s.kpiLabel, { color: textSec }]}>Stock</Text>
        </View>
      </View>

      <View style={[s.tabRow, { backgroundColor: isDarkMode ? modeColors.surfaceLight : '#E8ECF0' }]}>
        {([
          { key: 'stocks' as TabKey, label: `📦 ${t.economat.stocks}` },
          { key: 'daily' as TabKey, label: `📅 ${t.economat.dailyReport.split(' ')[1] ?? 'Jour'}` },
          { key: 'consumptions' as TabKey, label: `📊 Consos` },
          { key: 'analytics' as TabKey, label: `💰 ${t.economat.analytics}` },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && [s.tabActive, { backgroundColor: cardBg }]]}
            onPress={() => { setActiveTab(tab.key); setSelectedDay(null); }}
          >
            <Text style={[s.tabText, { color: textSec }, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {(activeTab === 'consumptions' || activeTab === 'daily' || activeTab === 'analytics') && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.periodBar} contentContainerStyle={s.periodBarContent}>
          {periodOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[s.periodChip, periodFilter === opt.key && s.periodChipActive]}
              onPress={() => setPeriodFilter(opt.key)}
            >
              <Text style={[s.periodChipText, periodFilter === opt.key && s.periodChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {(activeTab === 'stocks' || activeTab === 'consumptions') && (
        <View style={s.filterBar}>
          <View style={[s.searchBox, { backgroundColor: cardBg }]}>
            <Search size={16} color={textMut} />
            <TextInput
              style={[s.searchInput, { color: textColor }]}
              placeholder={t.common.search + '...'}
              placeholderTextColor={textMut}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryFilter} contentContainerStyle={s.categoryFilterContent}>
            <TouchableOpacity
              style={[s.catChip, categoryFilter === 'all' && s.catChipActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Text style={[s.catChipText, categoryFilter === 'all' && s.catChipTextActive]}>{t.common.all}</Text>
            </TouchableOpacity>
            {(Object.keys(CONSUMABLE_CATEGORY_CONFIG) as ConsumableCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, categoryFilter === cat && s.catChipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[s.catChipText, categoryFilter === cat && s.catChipTextActive]}>
                  {CONSUMABLE_CATEGORY_CONFIG[cat].icon} {CONSUMABLE_CATEGORY_CONFIG[cat].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTab === 'stocks' && (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={[s.emptyText, { color: textSec }]}>{t.economat.noArticlesFound}</Text>
            </View>
          }
        />
      )}

      {activeTab === 'daily' && !selectedDay && (
        <FlatList
          data={dailySummary}
          keyExtractor={(item) => item.date}
          renderItem={renderDailyItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📅</Text>
              <Text style={[s.emptyText, { color: textSec }]}>{t.common.noData}</Text>
            </View>
          }
        />
      )}

      {activeTab === 'daily' && selectedDay && (
        <>
          <TouchableOpacity
            style={[s.dayDetailHeader, { backgroundColor: cardBg }]}
            onPress={() => setSelectedDay(null)}
          >
            <Text style={[s.dayDetailBack, { color: Colors.primary }]}>← {t.common.back}</Text>
            <Text style={[s.dayDetailTitle, { color: textColor }]}>{formatDate(selectedDay)}</Text>
            <Text style={[s.dayDetailTotal, { color: Colors.primary }]}>
              {selectedDayLogs.reduce((s, l) => s + l.totalPrice, 0).toFixed(2)}€
            </Text>
          </TouchableOpacity>
          <FlatList
            data={selectedDayLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderConsumptionItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'consumptions' && (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderConsumptionItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📊</Text>
              <Text style={[s.emptyText, { color: textSec }]}>{t.economat.noConsumptions}</Text>
            </View>
          }
        />
      )}

      {activeTab === 'analytics' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.analyticsContent} showsVerticalScrollIndicator={false}>
          <View style={[s.analyticSection, { backgroundColor: cardBg }]}>
            <Text style={[s.analyticSectionTitle, { color: textColor }]}>{t.economat.categoryBreakdown}</Text>
            {(Object.keys(CONSUMABLE_CATEGORY_CONFIG) as ConsumableCategory[]).map((cat) => {
              const stat = categoryStats[cat];
              if (!stat) return null;
              const config = CONSUMABLE_CATEGORY_CONFIG[cat];
              const pct = totalCost > 0 ? (stat.cost / totalCost) * 100 : 0;
              return (
                <View key={cat} style={s.analyticRow}>
                  <Text style={s.analyticIcon}>{config.icon}</Text>
                  <View style={s.analyticInfo}>
                    <Text style={[s.analyticLabel, { color: textColor }]}>{config.label}</Text>
                    <View style={s.analyticBarBg}>
                      <View style={[s.analyticBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: config.color }]} />
                    </View>
                  </View>
                  <View style={s.analyticValues}>
                    <Text style={[s.analyticCost, { color: textColor }]}>{stat.cost.toFixed(2)}€</Text>
                    <Text style={[s.analyticCount, { color: textMut }]}>{stat.count} art.</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[s.analyticSection, { backgroundColor: cardBg }]}>
            <Text style={[s.analyticSectionTitle, { color: textColor }]}>{t.economat.costPerRoom}</Text>
            {roomCosts.slice(0, 10).map((rc, index) => (
              <View key={rc.roomNumber} style={s.roomCostRow}>
                <View style={s.roomCostRank}>
                  <Text style={[s.roomCostRankText, { color: textSec }]}>{index + 1}</Text>
                </View>
                <Text style={[s.roomCostNumber, { color: textColor }]}>Ch. {rc.roomNumber}</Text>
                <View style={{ flex: 1 }} />
                <Text style={[s.roomCostItems, { color: textMut }]}>{rc.count} art.</Text>
                <Text style={s.roomCostTotal}>{rc.total.toFixed(2)}€</Text>
              </View>
            ))}
            {roomCosts.length === 0 && (
              <Text style={[s.analyticEmpty, { color: textMut }]}>{t.common.noData}</Text>
            )}
          </View>

          <View style={[s.analyticSection, { backgroundColor: cardBg }]}>
            <Text style={[s.analyticSectionTitle, { color: textColor }]}>{t.economat.criticalStock}</Text>
            {lowStockConsumables.map((p) => (
              <View key={p.id} style={s.criticalRow}>
                <Text style={s.criticalIcon}>{p.icon}</Text>
                <Text style={[s.criticalName, { color: textColor }]}>{p.name}</Text>
                <View style={s.criticalBadge}>
                  <Text style={s.criticalBadgeText}>{p.currentStock}/{p.lowStockThreshold}</Text>
                </View>
              </View>
            ))}
            {lowStockConsumables.length === 0 && (
              <View style={s.allGoodBanner}>
                <Text style={s.allGoodIcon}>✅</Text>
                <Text style={s.allGoodText}>{t.economat.allStocksOk}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={showAddStock} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: isDarkMode ? modeColors.surface : '#FFF' }]}>
            <View style={[s.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[s.modalTitle, { color: textColor }]}>📦 {t.economat.restock}</Text>
              <TouchableOpacity onPress={() => setShowAddStock(false)}>
                <Text style={[s.modalClose, { color: textMut }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <View style={s.modalBody}>
                <View style={[s.modalProductInfo, { backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F8F9FA' }]}>
                  <Text style={s.modalProductIcon}>{selectedProduct.icon}</Text>
                  <View>
                    <Text style={[s.modalProductName, { color: textColor }]}>{selectedProduct.name}</Text>
                    <Text style={[s.modalProductStock, { color: textSec }]}>Stock actuel: {selectedProduct.currentStock} {selectedProduct.unit}s</Text>
                  </View>
                </View>

                <Text style={[s.fieldLabel, { color: textSec }]}>{t.economat.quantityToAdd}</Text>
                <TextInput
                  style={[s.modalInput, { color: textColor, backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F5F7FA', borderColor }]}
                  placeholder="Ex: 50"
                  placeholderTextColor={textMut}
                  keyboardType="numeric"
                  value={addStockQty}
                  onChangeText={setAddStockQty}
                />

                <Text style={[s.fieldLabel, { color: textSec }]}>{t.economat.unitPrice}</Text>
                <TextInput
                  style={[s.modalInput, { color: textColor, backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F5F7FA', borderColor }]}
                  placeholder="Ex: 1.80"
                  placeholderTextColor={textMut}
                  keyboardType="decimal-pad"
                  value={addStockPrice}
                  onChangeText={setAddStockPrice}
                />
              </View>
            )}
            <TouchableOpacity style={s.modalSubmitBtn} onPress={handleSubmitAddStock}>
              <Text style={s.modalSubmitText}>✅ {t.economat.addToStock}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditPrice} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: isDarkMode ? modeColors.surface : '#FFF' }]}>
            <View style={[s.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[s.modalTitle, { color: textColor }]}>✏️ {t.economat.editPrice}</Text>
              <TouchableOpacity onPress={() => setShowEditPrice(false)}>
                <Text style={[s.modalClose, { color: textMut }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <View style={s.modalBody}>
                <View style={[s.modalProductInfo, { backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F8F9FA' }]}>
                  <Text style={s.modalProductIcon}>{selectedProduct.icon}</Text>
                  <View>
                    <Text style={[s.modalProductName, { color: textColor }]}>{selectedProduct.name}</Text>
                    <Text style={[s.modalProductStock, { color: textSec }]}>Prix actuel: {selectedProduct.unitPrice.toFixed(2)}€/{selectedProduct.unit}</Text>
                  </View>
                </View>

                <Text style={[s.fieldLabel, { color: textSec }]}>Nouveau prix unitaire (€)</Text>
                <TextInput
                  style={[s.modalInput, { color: textColor, backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F5F7FA', borderColor }]}
                  placeholder="Ex: 2.50"
                  placeholderTextColor={textMut}
                  keyboardType="decimal-pad"
                  value={editPriceValue}
                  onChangeText={setEditPriceValue}
                />
              </View>
            )}
            <TouchableOpacity style={[s.modalSubmitBtn, { backgroundColor: Colors.warning }]} onPress={handleSubmitEditPrice}>
              <Text style={s.modalSubmitText}>✅ Mettre à jour le prix</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  kpiRow: { flexDirection: 'row', padding: 12, gap: 8 },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiCardAlert: { borderWidth: 1, borderColor: '#FFCDD2' },
  kpiValue: { fontSize: 16, fontWeight: '800' as const },
  kpiLabel: { fontSize: 9, fontWeight: '500' as const },

  tabRow: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: '600' as const },
  tabTextActive: { color: Colors.primary },

  periodBar: { maxHeight: 36, marginBottom: 8 },
  periodBarContent: { paddingHorizontal: 12, gap: 6 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  periodChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  periodChipText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  periodChipTextActive: { color: Colors.primary, fontWeight: '600' as const },

  filterBar: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  categoryFilter: { maxHeight: 36 },
  categoryFilterContent: { gap: 6, paddingRight: 12 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  catChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  catChipText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primary, fontWeight: '600' as const },

  listContent: { paddingHorizontal: 12, paddingBottom: 100, gap: 6 },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  productCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productCardIcon: { fontSize: 28 },
  productCardInfo: { flex: 1 },
  productCardName: { fontSize: 14, fontWeight: '600' as const },
  productCardMeta: { fontSize: 11, marginTop: 2 },
  productStockValue: { fontSize: 10, marginTop: 1 },
  productCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productActions: { flexDirection: 'column', gap: 4 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 40, alignItems: 'center' },
  stockBadgeText: { fontSize: 14, fontWeight: '800' as const },
  addStockBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPriceBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  logIcon: { fontSize: 24 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '600' as const },
  logMeta: { fontSize: 11, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logQty: { fontSize: 14, fontWeight: '700' as const },
  logCost: { fontSize: 11, marginTop: 2 },

  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dailyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyDate: { fontSize: 14, fontWeight: '700' as const },
  dailyInfo: { fontSize: 11, marginTop: 2 },
  dailyRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyTotal: { fontSize: 16, fontWeight: '800' as const },

  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  dayDetailBack: { fontSize: 13, fontWeight: '600' as const },
  dayDetailTitle: { fontSize: 15, fontWeight: '700' as const },
  dayDetailTotal: { fontSize: 15, fontWeight: '800' as const },

  analyticsContent: { padding: 12, paddingBottom: 100, gap: 12 },
  analyticSection: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  analyticSectionTitle: { fontSize: 15, fontWeight: '700' as const, marginBottom: 14 },
  analyticRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  analyticIcon: { fontSize: 22 },
  analyticInfo: { flex: 1, gap: 4 },
  analyticLabel: { fontSize: 13, fontWeight: '500' as const },
  analyticBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  analyticBarFill: { height: 6, borderRadius: 3 },
  analyticValues: { alignItems: 'flex-end' },
  analyticCost: { fontSize: 13, fontWeight: '700' as const },
  analyticCount: { fontSize: 10 },

  roomCostRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  roomCostRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F2F4', justifyContent: 'center', alignItems: 'center' },
  roomCostRankText: { fontSize: 11, fontWeight: '700' as const },
  roomCostNumber: { fontSize: 14, fontWeight: '600' as const },
  roomCostItems: { fontSize: 12 },
  roomCostTotal: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary, minWidth: 60, textAlign: 'right' as const },

  criticalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  criticalIcon: { fontSize: 20 },
  criticalName: { flex: 1, fontSize: 14, fontWeight: '500' as const },
  criticalBadge: { backgroundColor: '#FFCDD2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  criticalBadgeText: { fontSize: 12, fontWeight: '700' as const, color: '#C62828' },
  allGoodBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  allGoodIcon: { fontSize: 20 },
  allGoodText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' as const },
  analyticEmpty: { fontSize: 13, textAlign: 'center' as const, paddingVertical: 16 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const },
  modalClose: { fontSize: 20, padding: 4 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  modalProductInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  modalProductIcon: { fontSize: 32 },
  modalProductName: { fontSize: 16, fontWeight: '700' as const },
  modalProductStock: { fontSize: 12, marginTop: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, marginBottom: 6, marginTop: 12 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  modalSubmitBtn: { backgroundColor: Colors.primary, marginHorizontal: 20, marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
});

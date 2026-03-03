import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import { Settings, Users, Package, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import {
  BreakfastStaff,
  BreakfastProduct,
  BREAKFAST_STAFF_POSITIONS,
  BREAKFAST_PRODUCT_CATEGORIES,
} from '@/constants/types';

type TabKey = 'pricing' | 'staff' | 'products';

export default function BreakfastConfigScreen() {
  const { theme } = useTheme();
  const {
    breakfastConfig,
    breakfastStaff,
    breakfastProducts,
    updateBreakfastConfig,
    addBreakfastStaff,
    updateBreakfastStaff,
    addBreakfastProduct,
  } = useHotel();

  const [activeTab, setActiveTab] = useState<TabKey>('pricing');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [adultPriceDining, setAdultPriceDining] = useState(breakfastConfig.adultPriceDining.toString());
  const [adultPriceRoom, setAdultPriceRoom] = useState(breakfastConfig.adultPriceRoom.toString());
  const [childPrice, setChildPrice] = useState(breakfastConfig.childPrice.toString());
  const [childAgeLimit, setChildAgeLimit] = useState(breakfastConfig.childAgeLimit.toString());
  const [seatingCapacity, setSeatingCapacity] = useState(breakfastConfig.seatingCapacity.toString());

  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffPosition, setStaffPosition] = useState<BreakfastStaff['position']>('serveur');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRate, setStaffRate] = useState('13.50');

  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<BreakfastProduct['category']>('boissons');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('pièce');
  const [prodSupplier, setProdSupplier] = useState('');

  const activeStaff = useMemo(() => breakfastStaff.filter((s) => s.active), [breakfastStaff]);
  const inactiveStaff = useMemo(() => breakfastStaff.filter((s) => !s.active), [breakfastStaff]);
  const activeProducts = useMemo(() => breakfastProducts.filter((p) => p.active), [breakfastProducts]);

  const handleSavePricing = useCallback(() => {
    updateBreakfastConfig({
      adultPriceDining: parseFloat(adultPriceDining) || 0,
      adultPriceRoom: parseFloat(adultPriceRoom) || 0,
      childPrice: parseFloat(childPrice) || 0,
      childAgeLimit: parseInt(childAgeLimit) || 12,
      seatingCapacity: parseInt(seatingCapacity) || 60,
    });
    Alert.alert('Succès', 'Configuration enregistrée');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [adultPriceDining, adultPriceRoom, childPrice, childAgeLimit, seatingCapacity, updateBreakfastConfig]);

  const handleAddStaff = useCallback(() => {
    if (!staffFirstName.trim() || !staffLastName.trim()) return;
    addBreakfastStaff({
      hotelId: 'h1',
      firstName: staffFirstName.trim(),
      lastName: staffLastName.trim(),
      position: staffPosition,
      email: '',
      phone: staffPhone.trim(),
      hourlyRate: parseFloat(staffRate) || 0,
      active: true,
    });
    setStaffFirstName('');
    setStaffLastName('');
    setStaffPhone('');
    setStaffRate('13.50');
    setShowAddStaff(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [staffFirstName, staffLastName, staffPosition, staffPhone, staffRate, addBreakfastStaff]);

  const handleToggleStaff = useCallback((id: string, active: boolean) => {
    updateBreakfastStaff({ id, updates: { active: !active } });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateBreakfastStaff]);

  const handleAddProduct = useCallback(() => {
    if (!prodName.trim() || !prodPrice) return;
    addBreakfastProduct({
      hotelId: 'h1',
      name: prodName.trim(),
      category: prodCategory,
      purchasePrice: parseFloat(prodPrice) || 0,
      unit: prodUnit.trim() || 'pièce',
      supplier: prodSupplier.trim(),
      active: true,
    });
    setProdName('');
    setProdPrice('');
    setProdSupplier('');
    setShowAddProduct(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [prodName, prodCategory, prodPrice, prodUnit, prodSupplier, addBreakfastProduct]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Config. Petit-déjeuner',
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
        }}
      />

      <View style={styles.tabRow}>
        {[
          { key: 'pricing' as TabKey, label: '💰 Tarifs', icon: Settings },
          { key: 'staff' as TabKey, label: '👥 Personnel', icon: Users },
          { key: 'products' as TabKey, label: '📦 Produits', icon: Package },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: theme.primary }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && { color: theme.primary, fontWeight: '700' as const }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'pricing' && (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tarifs petit-déjeuner</Text>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Adulte en salle (€)</Text>
              <TextInput style={styles.formInput} value={adultPriceDining} onChangeText={setAdultPriceDining} keyboardType="numeric" />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Adulte en chambre (€)</Text>
              <TextInput style={styles.formInput} value={adultPriceRoom} onChangeText={setAdultPriceRoom} keyboardType="numeric" />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Enfant (€)</Text>
              <TextInput style={styles.formInput} value={childPrice} onChangeText={setChildPrice} keyboardType="numeric" />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Âge limite enfant</Text>
              <TextInput style={styles.formInput} value={childAgeLimit} onChangeText={setChildAgeLimit} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Capacité</Text>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Places assises</Text>
              <TextInput style={styles.formInput} value={seatingCapacity} onChangeText={setSeatingCapacity} keyboardType="numeric" />
            </View>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSavePricing}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === 'staff' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={[...activeStaff, ...inactiveStaff]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 14, paddingBottom: 80, gap: 8 }}
            ListHeaderComponent={
              <Text style={styles.listHeader}>{activeStaff.length} actif{activeStaff.length > 1 ? 's' : ''} • {inactiveStaff.length} inactif{inactiveStaff.length > 1 ? 's' : ''}</Text>
            }
            renderItem={({ item }) => {
              const posConfig = BREAKFAST_STAFF_POSITIONS[item.position];
              return (
                <View style={[styles.staffCard, !item.active && styles.staffCardInactive]}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffInitials}>
                      {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{item.firstName} {item.lastName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.posBadge, { backgroundColor: posConfig?.color + '15' }]}>
                        <Text style={[styles.posText, { color: posConfig?.color }]}>{posConfig?.label ?? item.position}</Text>
                      </View>
                      <Text style={styles.staffRate}>{item.hourlyRate.toFixed(2)}€/h</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, item.active ? styles.toggleActive : styles.toggleInactive]}
                    onPress={() => handleToggleStaff(item.id, item.active)}
                  >
                    <Text style={styles.toggleText}>{item.active ? 'Actif' : 'Inactif'}</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>👥</Text><Text style={styles.emptyText}>Aucun personnel</Text></View>}
          />
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => setShowAddStaff(true)}>
            <Plus size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'products' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={activeProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 14, paddingBottom: 80, gap: 8 }}
            renderItem={({ item }) => {
              const catConfig = BREAKFAST_PRODUCT_CATEGORIES[item.category];
              return (
                <View style={styles.productCard}>
                  <Text style={styles.productIcon}>{catConfig?.icon ?? '📦'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productMeta}>{catConfig?.label} • {item.unit}{item.supplier ? ` • ${item.supplier}` : ''}</Text>
                  </View>
                  <Text style={styles.productPrice}>{item.purchasePrice.toFixed(2)}€</Text>
                </View>
              );
            }}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>📦</Text><Text style={styles.emptyText}>Aucun produit</Text></View>}
          />
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => setShowAddProduct(true)}>
            <Plus size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showAddStaff} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un membre</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Prénom *" placeholderTextColor={Colors.textMuted} value={staffFirstName} onChangeText={setStaffFirstName} />
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Nom *" placeholderTextColor={Colors.textMuted} value={staffLastName} onChangeText={setStaffLastName} />
            </View>
            <Text style={styles.modalSubtitle}>Poste</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(BREAKFAST_STAFF_POSITIONS).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.posChip, staffPosition === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setStaffPosition(key as BreakfastStaff['position'])}
                >
                  <Text style={[styles.posChipText, staffPosition === key && { color: '#FFF' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Téléphone" placeholderTextColor={Colors.textMuted} value={staffPhone} onChangeText={setStaffPhone} keyboardType="phone-pad" />
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Taux horaire (€)" placeholderTextColor={Colors.textMuted} value={staffRate} onChangeText={setStaffRate} keyboardType="numeric" />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddStaff(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!staffFirstName || !staffLastName) && { opacity: 0.5 }]}
                onPress={handleAddStaff}
                disabled={!staffFirstName || !staffLastName}
              >
                <Text style={styles.modalConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un produit</Text>
            <TextInput style={styles.modalInput} placeholder="Nom du produit *" placeholderTextColor={Colors.textMuted} value={prodName} onChangeText={setProdName} />
            <Text style={styles.modalSubtitle}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(BREAKFAST_PRODUCT_CATEGORIES).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.catChip, prodCategory === key && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setProdCategory(key as BreakfastProduct['category'])}
                >
                  <Text style={[styles.catChipText, prodCategory === key && { color: '#FFF' }]}>{cfg.icon} {cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Prix achat (€) *" placeholderTextColor={Colors.textMuted} value={prodPrice} onChangeText={setProdPrice} keyboardType="numeric" />
              <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Unité" placeholderTextColor={Colors.textMuted} value={prodUnit} onChangeText={setProdUnit} />
            </View>
            <TextInput style={styles.modalInput} placeholder="Fournisseur (optionnel)" placeholderTextColor={Colors.textMuted} value={prodSupplier} onChangeText={setProdSupplier} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddProduct(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!prodName || !prodPrice) && { opacity: 0.5 }]}
                onPress={handleAddProduct}
                disabled={!prodName || !prodPrice}
              >
                <Text style={styles.modalConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnText: { fontSize: 12, fontWeight: '500' as const, color: '#8A9AA8' },
  scrollContent: { flex: 1 },
  card: { backgroundColor: '#FFF', margin: 14, marginBottom: 0, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E4E8EC' },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, color: '#1A2B33', marginBottom: 4 },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formLabel: { fontSize: 14, color: '#5A6B78', flex: 1 },
  formInput: { backgroundColor: '#F8FAFB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1A2B33', borderWidth: 1, borderColor: '#E4E8EC', width: 100, textAlign: 'right' as const, fontWeight: '600' as const },
  saveBtn: { marginHorizontal: 14, marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
  listHeader: { fontSize: 12, color: '#8A9AA8', fontWeight: '500' as const, marginBottom: 4 },
  staffCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E8EC' },
  staffCardInactive: { opacity: 0.5 },
  staffAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  staffInitials: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary },
  staffName: { fontSize: 14, fontWeight: '600' as const, color: '#1A2B33' },
  posBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  posText: { fontSize: 10, fontWeight: '600' as const },
  staffRate: { fontSize: 11, color: '#8A9AA8' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  toggleActive: { backgroundColor: '#22C55E15' },
  toggleInactive: { backgroundColor: '#EF444415' },
  toggleText: { fontSize: 11, fontWeight: '600' as const, color: '#5A6B78' },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E8EC' },
  productIcon: { fontSize: 24 },
  productName: { fontSize: 14, fontWeight: '600' as const, color: '#1A2B33' },
  productMeta: { fontSize: 11, color: '#8A9AA8' },
  productPrice: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#8A9AA8' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: '#1A2B33' },
  modalSubtitle: { fontSize: 13, fontWeight: '600' as const, color: '#5A6B78', marginTop: 4 },
  modalInput: { backgroundColor: '#F8FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A2B33', borderWidth: 1, borderColor: '#E4E8EC' },
  posChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#E4E8EC' },
  posChipText: { fontSize: 12, fontWeight: '500' as const, color: '#5A6B78' },
  catChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#E4E8EC' },
  catChipText: { fontSize: 11, fontWeight: '500' as const, color: '#5A6B78' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E4E8EC' },
  modalCancelText: { fontSize: 14, fontWeight: '600' as const, color: '#5A6B78' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.teal },
  modalConfirmText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
});

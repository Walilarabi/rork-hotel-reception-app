import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Package,
  CheckSquare,
  AlertTriangle,
  BedDouble,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Search,
} from 'lucide-react-native';
import { useConfiguration } from '@/providers/ConfigurationProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Colors } from '@/constants/colors';
import { FT } from '@/constants/flowtym';
import {
  ConfigProduct,
  ConfigChecklistItem,
  ConfigProblemTemplate,
  ConfigRoomType,
  HousekeeperDetail,
  CHECKLIST_CATEGORIES,
  MAINTENANCE_CATEGORY_OPTIONS,
  PROBLEM_ICONS,
  CONTRACT_TYPES,
} from '@/constants/configTypes';

type TabId = 'products' | 'checklists' | 'problems' | 'roomTypes' | 'staff';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'products', label: 'Produits', icon: <Package size={16} color={Colors.primary} /> },
  { id: 'checklists', label: 'Checklists', icon: <CheckSquare size={16} color={Colors.primary} /> },
  { id: 'problems', label: 'Signalements', icon: <AlertTriangle size={16} color={Colors.warning} /> },
  { id: 'roomTypes', label: 'Chambres', icon: <BedDouble size={16} color={Colors.info} /> },
  { id: 'staff', label: 'Personnel', icon: <Users size={16} color={Colors.teal} /> },
];

export default function ConfigurationScreen() {
  const { currentUser } = useAuth();
  const config = useConfiguration();
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [searchQuery, setSearchQuery] = useState('');

  const userRole = currentUser?.role;
  const canWrite = userRole === 'direction' || userRole === 'super_admin' || userRole === 'gouvernante';
  const isReception = userRole === 'reception';

  const visibleTabs = useMemo(() => {
    if (isReception) {
      return TABS.filter((t) => t.id === 'roomTypes' || t.id === 'products' || t.id === 'checklists' || t.id === 'problems');
    }
    return TABS;
  }, [isReception]);

  if (config.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Configuration', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Configuration', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF' }} />

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {visibleTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
              onPress={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              testID={`config-tab-${tab.id}`}
            >
              {tab.icon}
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'products' && (
        <ProductsTab config={config} search={searchQuery} canWrite={canWrite && !isReception} />
      )}
      {activeTab === 'checklists' && (
        <ChecklistsTab config={config} search={searchQuery} canWrite={canWrite && !isReception} />
      )}
      {activeTab === 'problems' && (
        <ProblemsTab config={config} search={searchQuery} canWrite={canWrite && !isReception} />
      )}
      {activeTab === 'roomTypes' && (
        <RoomTypesTab config={config} search={searchQuery} canWrite={canWrite || isReception} />
      )}
      {activeTab === 'staff' && (
        <StaffTab config={config} search={searchQuery} canWrite={canWrite && !isReception} />
      )}
    </View>
  );
}

interface TabProps {
  config: ReturnType<typeof useConfiguration>;
  search: string;
  canWrite: boolean;
}

function ProductsTab({ config, search, canWrite }: TabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ConfigProduct | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = config.products
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const map = new Map<string, { category: typeof config.productCategories[0]; products: ConfigProduct[] }>();
    for (const cat of config.productCategories.filter((c) => c.active).sort((a, b) => a.displayOrder - b.displayOrder)) {
      map.set(cat.id, { category: cat, products: [] });
    }
    for (const p of filtered) {
      const group = map.get(p.categoryId);
      if (group) group.products.push(p);
    }
    return Array.from(map.values()).filter((g) => g.products.length > 0);
  }, [config.products, config.productCategories, search]);

  return (
    <View style={styles.tabContent}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        {grouped.map((group) => {
          const isExpanded = expandedCategory === group.category.id || expandedCategory === null;
          return (
            <View key={group.category.id} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => setExpandedCategory(isExpanded && expandedCategory !== null ? null : group.category.id)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.categoryTitle}>{group.category.name}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{group.products.length}</Text>
                  </View>
                </View>
                {isExpanded ? <ChevronUp size={16} color={Colors.textMuted} /> : <ChevronDown size={16} color={Colors.textMuted} />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.categoryBody}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thCell, { flex: 2 }]}>Produit</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' as const }]}>Simple</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' as const }]}>Double</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' as const }]}>Suite</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' as const }]}>Seuil</Text>
                    {canWrite && <Text style={[styles.thCell, { width: 60, textAlign: 'center' as const }]}></Text>}
                  </View>
                  {group.products.map((p) => (
                    <View key={p.id} style={[styles.tableRow, !p.active && styles.tableRowInactive]}>
                      <View style={{ flex: 2, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 }}>
                        <Text style={[styles.tdCell, !p.active && styles.tdCellInactive]}>{p.name}</Text>
                        {!p.active && <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>OFF</Text></View>}
                      </View>
                      <Text style={[styles.tdCellCenter, { flex: 1 }]}>{p.defaultQuantitySimple}</Text>
                      <Text style={[styles.tdCellCenter, { flex: 1 }]}>{p.defaultQuantityDouble}</Text>
                      <Text style={[styles.tdCellCenter, { flex: 1 }]}>{p.defaultQuantitySuite}</Text>
                      <Text style={[styles.tdCellCenter, { flex: 1 }]}>{p.alertThreshold}</Text>
                      {canWrite && (
                        <View style={{ width: 60, flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 8 }}>
                          <TouchableOpacity onPress={() => setEditingProduct(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Edit3 size={14} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => config.updateProduct({ id: p.id, updates: { active: !p.active } })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            {p.active ? <ToggleRight size={14} color={Colors.success} /> : <ToggleLeft size={14} color={Colors.textMuted} />}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {grouped.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        )}
      </ScrollView>

      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} testID="add-product-btn">
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {(showAddModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={config.productCategories.filter((c) => c.active)}
          onSave={(data) => {
            if (editingProduct) {
              config.updateProduct({ id: editingProduct.id, updates: data });
            } else {
              config.addProduct(data as Omit<ConfigProduct, 'id'>);
            }
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
        />
      )}
    </View>
  );
}

interface ProductFormModalProps {
  product: ConfigProduct | null;
  categories: { id: string; name: string }[];
  onSave: (data: Partial<ConfigProduct>) => void;
  onClose: () => void;
}

function ProductFormModal({ product, categories, onSave, onClose }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [qSimple, setQSimple] = useState(String(product?.defaultQuantitySimple ?? 1));
  const [qDouble, setQDouble] = useState(String(product?.defaultQuantityDouble ?? 2));
  const [qSuite, setQSuite] = useState(String(product?.defaultQuantitySuite ?? 3));
  const [threshold, setThreshold] = useState(String(product?.alertThreshold ?? 10));
  const [unit, setUnit] = useState(product?.unit ?? 'pièce');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const selectedCat = categories.find((c) => c.id === categoryId);

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire'); return; }
    onSave({
      name: name.trim(),
      categoryId,
      defaultQuantitySimple: parseInt(qSimple, 10) || 0,
      defaultQuantityDouble: parseInt(qDouble, 10) || 0,
      defaultQuantitySuite: parseInt(qSuite, 10) || 0,
      alertThreshold: parseInt(threshold, 10) || 0,
      unit,
      active: true,
      displayOrder: product?.displayOrder ?? Date.now(),
      description: product?.description ?? '',
    });
  }, [name, categoryId, qSimple, qDouble, qSuite, threshold, unit, product, onSave]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{product ? 'Modifier le produit' : 'Nouveau produit'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Nom du produit</Text>
            <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Ex: Serviette bain" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Catégorie</Text>
            <TouchableOpacity style={styles.fieldSelect} onPress={() => setShowCatPicker(!showCatPicker)}>
              <Text style={styles.fieldSelectText}>{selectedCat?.name ?? 'Sélectionner'}</Text>
              <ChevronDown size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showCatPicker && (
              <View style={styles.pickerDropdown}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pickerItem, c.id === categoryId && styles.pickerItemActive]}
                    onPress={() => { setCategoryId(c.id); setShowCatPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, c.id === categoryId && styles.pickerItemTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Unité</Text>
            <TextInput style={styles.fieldInput} value={unit} onChangeText={setUnit} placeholder="pièce, flacon, ..." placeholderTextColor={Colors.textMuted} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Qté Simple</Text>
                <TextInput style={styles.fieldInput} value={qSimple} onChangeText={setQSimple} keyboardType="numeric" />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Qté Double</Text>
                <TextInput style={styles.fieldInput} value={qDouble} onChangeText={setQDouble} keyboardType="numeric" />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Qté Suite</Text>
                <TextInput style={styles.fieldInput} value={qSuite} onChangeText={setQSuite} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Seuil d'alerte stock</Text>
            <TextInput style={styles.fieldInput} value={threshold} onChangeText={setThreshold} keyboardType="numeric" />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChecklistsTab({ config, search, canWrite }: TabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigChecklistItem | null>(null);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = config.checklistItems
      .filter((i) => !q || i.itemName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const map = new Map<string, ConfigChecklistItem[]>();
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [config.checklistItems, search]);

  return (
    <View style={styles.tabContent}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        {grouped.map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <View style={[styles.categoryDot, { backgroundColor: Colors.teal }]} />
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{items.length}</Text>
                </View>
              </View>
            </View>
            <View style={styles.categoryBody}>
              {items.map((item) => (
                <View key={item.id} style={[styles.checklistRow, !item.active && styles.tableRowInactive]}>
                  <View style={styles.checklistLeft}>
                    <Text style={[styles.checklistName, !item.active && styles.tdCellInactive]}>{item.itemName}</Text>
                    {!item.active && <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>OFF</Text></View>}
                  </View>
                  <View style={styles.checklistBadges}>
                    <View style={[styles.appliesToBadge, item.appliesToSimple && styles.appliesToBadgeActive]}>
                      <Text style={[styles.appliesToText, item.appliesToSimple && styles.appliesToTextActive]}>S</Text>
                    </View>
                    <View style={[styles.appliesToBadge, item.appliesToDouble && styles.appliesToBadgeActive]}>
                      <Text style={[styles.appliesToText, item.appliesToDouble && styles.appliesToTextActive]}>D</Text>
                    </View>
                    <View style={[styles.appliesToBadge, item.appliesToSuite && styles.appliesToBadgeActive]}>
                      <Text style={[styles.appliesToText, item.appliesToSuite && styles.appliesToTextActive]}>Ste</Text>
                    </View>
                  </View>
                  {canWrite && (
                    <View style={styles.rowActions}>
                      <TouchableOpacity onPress={() => setEditingItem(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Edit3 size={14} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => config.updateChecklistItem({ id: item.id, updates: { active: !item.active } })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {item.active ? <ToggleRight size={14} color={Colors.success} /> : <ToggleLeft size={14} color={Colors.textMuted} />}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {grouped.length === 0 && (
          <View style={styles.emptyState}>
            <CheckSquare size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun item trouvé</Text>
          </View>
        )}
      </ScrollView>

      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} testID="add-checklist-btn">
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {(showAddModal || editingItem) && (
        <ChecklistFormModal
          item={editingItem}
          onSave={(data) => {
            if (editingItem) {
              config.updateChecklistItem({ id: editingItem.id, updates: data });
            } else {
              config.addChecklistItem(data as Omit<ConfigChecklistItem, 'id'>);
            }
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
        />
      )}
    </View>
  );
}

interface ChecklistFormModalProps {
  item: ConfigChecklistItem | null;
  onSave: (data: Partial<ConfigChecklistItem>) => void;
  onClose: () => void;
}

function ChecklistFormModal({ item, onSave, onClose }: ChecklistFormModalProps) {
  const [itemName, setItemName] = useState(item?.itemName ?? '');
  const [category, setCategory] = useState(item?.category ?? CHECKLIST_CATEGORIES[0]);
  const [simple, setSimple] = useState(item?.appliesToSimple ?? true);
  const [double, setDouble] = useState(item?.appliesToDouble ?? true);
  const [suite, setSuite] = useState(item?.appliesToSuite ?? true);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const handleSave = useCallback(() => {
    if (!itemName.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire'); return; }
    onSave({
      itemName: itemName.trim(),
      category,
      appliesToSimple: simple,
      appliesToDouble: double,
      appliesToSuite: suite,
      active: true,
      displayOrder: item?.displayOrder ?? Date.now(),
    });
  }, [itemName, category, simple, double, suite, item, onSave]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{item ? 'Modifier l\'item' : 'Nouvel item checklist'}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Nom de l'item</Text>
            <TextInput style={styles.fieldInput} value={itemName} onChangeText={setItemName} placeholder="Ex: Lits faits" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Catégorie</Text>
            <TouchableOpacity style={styles.fieldSelect} onPress={() => setShowCatPicker(!showCatPicker)}>
              <Text style={styles.fieldSelectText}>{category}</Text>
              <ChevronDown size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showCatPicker && (
              <View style={styles.pickerDropdown}>
                {CHECKLIST_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pickerItem, c === category && styles.pickerItemActive]}
                    onPress={() => { setCategory(c); setShowCatPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, c === category && styles.pickerItemTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Applicable aux types de chambre</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Simple</Text>
              <Switch value={simple} onValueChange={setSimple} trackColor={{ false: Colors.border, true: Colors.primary + '60' }} thumbColor={simple ? Colors.primary : '#f4f3f4'} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Double</Text>
              <Switch value={double} onValueChange={setDouble} trackColor={{ false: Colors.border, true: Colors.primary + '60' }} thumbColor={double ? Colors.primary : '#f4f3f4'} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Suite</Text>
              <Switch value={suite} onValueChange={setSuite} trackColor={{ false: Colors.border, true: Colors.primary + '60' }} thumbColor={suite ? Colors.primary : '#f4f3f4'} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProblemsTab({ config, search, canWrite }: TabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConfigProblemTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return config.problemTemplates
      .filter((t) => !q || t.label.toLowerCase().includes(q) || t.maintenanceCategory.toLowerCase().includes(q))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [config.problemTemplates, search]);

  const priorityColor = (p: string) => {
    switch (p) {
      case 'haute': return Colors.danger;
      case 'moyenne': return Colors.warning;
      case 'basse': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const getEmoji = (iconName: string) => {
    return PROBLEM_ICONS.find((i) => i.name === iconName)?.emoji ?? '🔧';
  };

  return (
    <View style={styles.tabContent}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.problemGrid}>
          {filtered.map((tpl) => (
            <View key={tpl.id} style={[styles.problemCard, !tpl.active && styles.problemCardInactive]}>
              <View style={styles.problemCardTop}>
                <Text style={styles.problemEmoji}>{getEmoji(tpl.iconName)}</Text>
                {canWrite && (
                  <View style={styles.problemCardActions}>
                    <TouchableOpacity onPress={() => setEditingTemplate(tpl)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Edit3 size={12} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => config.updateProblemTemplate({ id: tpl.id, updates: { active: !tpl.active } })}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {tpl.active ? <ToggleRight size={12} color={Colors.success} /> : <ToggleLeft size={12} color={Colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={[styles.problemLabel, !tpl.active && styles.tdCellInactive]}>{tpl.label}</Text>
              <View style={styles.problemMeta}>
                <Text style={styles.problemCategory}>{tpl.maintenanceCategory}</Text>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor(tpl.defaultPriority) }]} />
              </View>
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <AlertTriangle size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun modèle trouvé</Text>
          </View>
        )}
      </ScrollView>

      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} testID="add-problem-btn">
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {(showAddModal || editingTemplate) && (
        <ProblemFormModal
          template={editingTemplate}
          onSave={(data) => {
            if (editingTemplate) {
              config.updateProblemTemplate({ id: editingTemplate.id, updates: data });
            } else {
              config.addProblemTemplate(data as Omit<ConfigProblemTemplate, 'id'>);
            }
            setShowAddModal(false);
            setEditingTemplate(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingTemplate(null); }}
        />
      )}
    </View>
  );
}

interface ProblemFormModalProps {
  template: ConfigProblemTemplate | null;
  onSave: (data: Partial<ConfigProblemTemplate>) => void;
  onClose: () => void;
}

function ProblemFormModal({ template, onSave, onClose }: ProblemFormModalProps) {
  const [label, setLabel] = useState(template?.label ?? '');
  const [iconName, setIconName] = useState(template?.iconName ?? PROBLEM_ICONS[0].name);
  const [category, setCategory] = useState(template?.maintenanceCategory ?? MAINTENANCE_CATEGORY_OPTIONS[0]);
  const [priority, setPriority] = useState<'haute' | 'moyenne' | 'basse'>(template?.defaultPriority ?? 'moyenne');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const handleSave = useCallback(() => {
    if (!label.trim()) { Alert.alert('Erreur', 'Le libellé est obligatoire'); return; }
    onSave({
      label: label.trim(),
      iconName,
      maintenanceCategory: category,
      defaultPriority: priority,
      active: true,
      displayOrder: template?.displayOrder ?? Date.now(),
    });
  }, [label, iconName, category, priority, template, onSave]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{template ? 'Modifier le modèle' : 'Nouveau signalement'}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Libellé</Text>
            <TextInput style={styles.fieldInput} value={label} onChangeText={setLabel} placeholder="Ex: WC bouché" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Icône</Text>
            <View style={styles.iconGrid}>
              {PROBLEM_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[styles.iconBtn, iconName === icon.name && styles.iconBtnActive]}
                  onPress={() => setIconName(icon.name)}
                >
                  <Text style={styles.iconBtnEmoji}>{icon.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Catégorie maintenance</Text>
            <TouchableOpacity style={styles.fieldSelect} onPress={() => setShowCatPicker(!showCatPicker)}>
              <Text style={styles.fieldSelectText}>{category}</Text>
              <ChevronDown size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showCatPicker && (
              <View style={styles.pickerDropdown}>
                {MAINTENANCE_CATEGORY_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pickerItem, c === category && styles.pickerItemActive]}
                    onPress={() => { setCategory(c); setShowCatPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, c === category && styles.pickerItemTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Priorité par défaut</Text>
            <View style={styles.priorityRow}>
              {(['haute', 'moyenne', 'basse'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityBtn, priority === p && styles.priorityBtnActive,
                    priority === p && { backgroundColor: p === 'haute' ? Colors.danger + '15' : p === 'moyenne' ? Colors.warning + '15' : Colors.success + '15', borderColor: p === 'haute' ? Colors.danger : p === 'moyenne' ? Colors.warning : Colors.success }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityBtnText, priority === p && { color: p === 'haute' ? Colors.danger : p === 'moyenne' ? Colors.warning : Colors.success }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RoomTypesTab({ config, search, canWrite }: TabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState<ConfigRoomType | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return config.roomTypes
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [config.roomTypes, search]);

  return (
    <View style={styles.tabContent}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.roomTypesList}>
          {filtered.map((rt) => (
            <View key={rt.id} style={[styles.roomTypeCard, !rt.active && styles.tableRowInactive]}>
              <View style={styles.roomTypeLeft}>
                <View style={[styles.roomTypeCodeBadge, !rt.active && { opacity: 0.4 }]}>
                  <Text style={styles.roomTypeCode}>{rt.code}</Text>
                </View>
                <View>
                  <Text style={[styles.roomTypeName, !rt.active && styles.tdCellInactive]}>{rt.name}</Text>
                  {!rt.active && <Text style={styles.roomTypeInactive}>Désactivé</Text>}
                </View>
              </View>
              {canWrite && (
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => setEditingType(rt)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Edit3 size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => config.updateRoomType({ id: rt.id, updates: { active: !rt.active } })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {rt.active ? <ToggleRight size={14} color={Colors.success} /> : <ToggleLeft size={14} color={Colors.textMuted} />}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <BedDouble size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun type trouvé</Text>
          </View>
        )}
      </ScrollView>

      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} testID="add-roomtype-btn">
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {(showAddModal || editingType) && (
        <RoomTypeFormModal
          roomType={editingType}
          onSave={(data) => {
            if (editingType) {
              config.updateRoomType({ id: editingType.id, updates: data });
            } else {
              config.addRoomType(data as Omit<ConfigRoomType, 'id'>);
            }
            setShowAddModal(false);
            setEditingType(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingType(null); }}
        />
      )}
    </View>
  );
}

interface RoomTypeFormModalProps {
  roomType: ConfigRoomType | null;
  onSave: (data: Partial<ConfigRoomType>) => void;
  onClose: () => void;
}

function RoomTypeFormModal({ roomType, onSave, onClose }: RoomTypeFormModalProps) {
  const [name, setName] = useState(roomType?.name ?? '');
  const [code, setCode] = useState(roomType?.code ?? '');

  const handleSave = useCallback(() => {
    if (!name.trim() || !code.trim()) { Alert.alert('Erreur', 'Nom et code obligatoires'); return; }
    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      active: true,
      displayOrder: roomType?.displayOrder ?? Date.now(),
    });
  }, [name, code, roomType, onSave]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: 340 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{roomType ? 'Modifier le type' : 'Nouveau type de chambre'}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Ex: Suite Junior" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.fieldLabel}>Code</Text>
            <TextInput style={styles.fieldInput} value={code} onChangeText={setCode} placeholder="Ex: SJR" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" maxLength={5} />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StaffTab({ config, search, canWrite }: TabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHk, setEditingHk] = useState<HousekeeperDetail | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return config.housekeeperDetails.filter((h) =>
      !q || h.firstName.toLowerCase().includes(q) || h.lastName.toLowerCase().includes(q)
    );
  }, [config.housekeeperDetails, search]);

  const contractColor = (ct: string) => {
    switch (ct) {
      case 'CDI': return Colors.success;
      case 'CDD': return Colors.info;
      case 'Stagiaire': return Colors.warning;
      case 'Intérimaire': return '#9C27B0';
      default: return Colors.textMuted;
    }
  };

  return (
    <View style={styles.tabContent}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        {filtered.map((hk) => (
          <View key={hk.id} style={[styles.staffCard, !hk.active && styles.staffCardInactive]}>
            <View style={[styles.staffAvatar, { backgroundColor: hk.active ? Colors.primary + '15' : Colors.border }]}>
              <Text style={styles.staffAvatarText}>
                {hk.firstName.charAt(0)}{hk.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffName, !hk.active && styles.tdCellInactive]}>{hk.firstName} {hk.lastName}</Text>
              <View style={styles.staffMeta}>
                <View style={[styles.contractBadge, { backgroundColor: contractColor(hk.contractType) + '15' }]}>
                  <Text style={[styles.contractBadgeText, { color: contractColor(hk.contractType) }]}>{hk.contractType}</Text>
                </View>
                <Text style={styles.staffFloors}>
                  {hk.assignedFloors.length > 0
                    ? `Étages: ${hk.assignedFloors.join(', ')}`
                    : 'Pas d\'étages assignés'}
                </Text>
              </View>
            </View>
            {canWrite && (
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => setEditingHk(hk)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Edit3 size={14} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => config.updateHousekeeper({ id: hk.id, updates: { active: !hk.active } })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {hk.active ? <ToggleRight size={14} color={Colors.success} /> : <ToggleLeft size={14} color={Colors.textMuted} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun personnel trouvé</Text>
          </View>
        )}
      </ScrollView>

      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} testID="add-staff-btn">
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {(showAddModal || editingHk) && (
        <StaffFormModal
          housekeeper={editingHk}
          onSave={(data) => {
            if (editingHk) {
              config.updateHousekeeper({ id: editingHk.id, updates: data });
            } else {
              config.addHousekeeper(data as Omit<HousekeeperDetail, 'id'>);
            }
            setShowAddModal(false);
            setEditingHk(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingHk(null); }}
        />
      )}
    </View>
  );
}

interface StaffFormModalProps {
  housekeeper: HousekeeperDetail | null;
  onSave: (data: Partial<HousekeeperDetail>) => void;
  onClose: () => void;
}

function StaffFormModal({ housekeeper, onSave, onClose }: StaffFormModalProps) {
  const [firstName, setFirstName] = useState(housekeeper?.firstName ?? '');
  const [lastName, setLastName] = useState(housekeeper?.lastName ?? '');
  const [contractType, setContractType] = useState<HousekeeperDetail['contractType']>(housekeeper?.contractType ?? 'CDI');
  const [floors, setFloors] = useState(housekeeper?.assignedFloors.join(', ') ?? '');
  const [showContractPicker, setShowContractPicker] = useState(false);

  const handleSave = useCallback(() => {
    if (!firstName.trim() || !lastName.trim()) { Alert.alert('Erreur', 'Prénom et nom obligatoires'); return; }
    const parsedFloors = floors
      .split(',')
      .map((f) => parseInt(f.trim(), 10))
      .filter((f) => !isNaN(f));
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contractType,
      assignedFloors: parsedFloors,
      photoUrl: housekeeper?.photoUrl ?? '',
      active: true,
    });
  }, [firstName, lastName, contractType, floors, housekeeper, onSave]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{housekeeper ? 'Modifier' : 'Nouveau membre'}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <TextInput style={styles.fieldInput} value={firstName} onChangeText={setFirstName} placeholder="Julie" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Nom</Text>
                <TextInput style={styles.fieldInput} value={lastName} onChangeText={setLastName} placeholder="Thomas" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Type de contrat</Text>
            <TouchableOpacity style={styles.fieldSelect} onPress={() => setShowContractPicker(!showContractPicker)}>
              <Text style={styles.fieldSelectText}>{contractType}</Text>
              <ChevronDown size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showContractPicker && (
              <View style={styles.pickerDropdown}>
                {CONTRACT_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct}
                    style={[styles.pickerItem, ct === contractType && styles.pickerItemActive]}
                    onPress={() => { setContractType(ct); setShowContractPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, ct === contractType && styles.pickerItemTextActive]}>{ct}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Étages assignés</Text>
            <TextInput
              style={styles.fieldInput}
              value={floors}
              onChangeText={setFloors}
              placeholder="1, 2, 3"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.fieldHint}>Séparez les étages par des virgules</Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  tabBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabItemActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.text, padding: 0 },

  tabContent: { flex: 1 },
  scrollContent: { flex: 1 },
  scrollPadding: { padding: 14, paddingBottom: 80 },

  categorySection: { marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLight,
  },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  countBadge: { backgroundColor: Colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.primary },

  categoryBody: { paddingBottom: 4 },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  thCell: { fontSize: 10, fontWeight: '700' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  tableRowInactive: { opacity: 0.5 },
  tdCell: { fontSize: 13, color: Colors.text, fontWeight: '500' as const },
  tdCellCenter: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' as const, fontWeight: '600' as const },
  tdCellInactive: { color: Colors.textMuted, textDecorationLine: 'line-through' as const },

  inactiveBadge: { backgroundColor: Colors.danger + '15', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  inactiveBadgeText: { fontSize: 8, fontWeight: '700' as const, color: Colors.danger },

  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  checklistLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  checklistName: { fontSize: 13, color: Colors.text, fontWeight: '500' as const },
  checklistBadges: { flexDirection: 'row', gap: 4, marginRight: 12 },
  appliesToBadge: {
    width: 26,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  appliesToBadgeActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '40' },
  appliesToText: { fontSize: 10, fontWeight: '600' as const, color: Colors.textMuted },
  appliesToTextActive: { color: Colors.primary },

  rowActions: { flexDirection: 'row', gap: 10 },

  problemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  problemCard: {
    width: '47%' as any,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  problemCardInactive: { opacity: 0.5 },
  problemCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  problemEmoji: { fontSize: 28 },
  problemCardActions: { flexDirection: 'row', gap: 8 },
  problemLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.text, marginBottom: 6 },
  problemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  problemCategory: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  roomTypesList: { gap: 8 },
  roomTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomTypeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  roomTypeCodeBadge: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomTypeCode: { fontSize: 12, fontWeight: '800' as const, color: Colors.primary, letterSpacing: 1 },
  roomTypeName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  roomTypeInactive: { fontSize: 10, color: Colors.danger, marginTop: 2 },

  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  staffCardInactive: { opacity: 0.5 },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffAvatarText: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
  staffInfo: { flex: 1, gap: 4 },
  staffName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  staffMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contractBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  contractBadgeText: { fontSize: 10, fontWeight: '700' as const },
  staffFloors: { fontSize: 11, color: Colors.textMuted },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
      default: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    }),
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 10 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
    }),
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  modalBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },

  fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldHint: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },

  fieldSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldSelectText: { fontSize: 14, color: Colors.text },

  pickerDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  pickerItemActive: { backgroundColor: Colors.primarySoft },
  pickerItemText: { fontSize: 13, color: Colors.text },
  pickerItemTextActive: { color: Colors.primary, fontWeight: '600' as const },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldCol: { flex: 1 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: Colors.text },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  iconBtnEmoji: { fontSize: 20 },

  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  priorityBtnActive: {},
  priorityBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },

  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary },
  saveBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
});

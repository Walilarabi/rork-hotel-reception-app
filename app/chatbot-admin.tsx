import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  MessageCircle,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  X,
  Check,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChatbot } from '@/providers/ChatbotProvider';
import { ChatbotFaqItem } from '@/mocks/chatbotFaq';
import { AdminUserRole, ADMIN_ROLE_CONFIG } from '@/constants/types';

const SA = {
  bg: '#0B0E14',
  surface: '#151923',
  surfaceLight: '#1C2230',
  accent: '#6B5CE7',
  accentLight: '#8B7FF0',
  border: '#232A38',
  text: '#E8ECF2',
  textSec: '#8B95A8',
  textMuted: '#5A6478',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const ALL_ROLES: AdminUserRole[] = ['reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast', 'direction', 'super_admin', 'support'];

const FAQ_CATEGORIES = ['Général', 'Réception', 'Gouvernante', 'Femme de chambre', 'Maintenance', 'Petit-déjeuner', 'Direction', 'Super Admin'];

export default function ChatbotAdminScreen() {
  const { faqItems, stats, addFaq, updateFaq, deleteFaq } = useChatbot();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<ChatbotFaqItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'stats'>('faq');

  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formCategory, setFormCategory] = useState('Général');
  const [formRoles, setFormRoles] = useState<AdminUserRole[]>([]);
  const [formActive, setFormActive] = useState(true);

  const filteredItems = useMemo(() => {
    let items = faqItems;
    if (filterCategory) {
      items = items.filter(f => f.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    return items.sort((a, b) => b.usageCount - a.usageCount);
  }, [faqItems, filterCategory, searchQuery]);

  const openNewForm = useCallback(() => {
    setEditingItem(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormKeywords('');
    setFormCategory('Général');
    setFormRoles([]);
    setFormActive(true);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((item: ChatbotFaqItem) => {
    setEditingItem(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormKeywords(item.keywords.join(', '));
    setFormCategory(item.category);
    setFormRoles([...item.roles]);
    setFormActive(item.isActive);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      Alert.alert('Erreur', 'La question et la réponse sont obligatoires.');
      return;
    }

    const keywords = formKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (editingItem) {
      updateFaq({
        id: editingItem.id,
        updates: {
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          keywords,
          category: formCategory,
          roles: formRoles,
          isActive: formActive,
        },
      });
    } else {
      addFaq({
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        keywords,
        category: formCategory,
        roles: formRoles,
        isActive: formActive,
      });
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowForm(false);
  }, [editingItem, formQuestion, formAnswer, formKeywords, formCategory, formRoles, formActive, updateFaq, addFaq]);

  const handleDelete = useCallback((id: string, question: string) => {
    Alert.alert('Supprimer', `Supprimer la question "${question.substring(0, 50)}..." ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteFaq(id);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [deleteFaq]);

  const toggleRole = useCallback((role: AdminUserRole) => {
    setFormRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Gestion FAQ Assistant' }} />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
          onPress={() => setActiveTab('faq')}
        >
          <MessageCircle size={16} color={activeTab === 'faq' ? SA.accent : SA.textMuted} />
          <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQ ({faqItems.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} color={activeTab === 'stats' ? SA.accent : SA.textMuted} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Statistiques</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stats' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Questions totales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: SA.success }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Actives</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: SA.accent }]}>{stats.totalUsage}</Text>
              <Text style={styles.statLabel}>Utilisations totales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: SA.warning }]}>{stats.categories.length}</Text>
              <Text style={styles.statLabel}>Catégories</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Top 10 questions les plus posées</Text>
          {stats.topQuestions.map((faq, i) => (
            <View key={faq.id} style={styles.topQuestionRow}>
              <View style={styles.topQuestionRank}>
                <Text style={styles.topQuestionRankText}>#{i + 1}</Text>
              </View>
              <View style={styles.topQuestionInfo}>
                <Text style={styles.topQuestionText} numberOfLines={2}>{faq.question}</Text>
                <Text style={styles.topQuestionMeta}>{faq.category} · {faq.usageCount} utilisations</Text>
              </View>
              <View style={styles.topQuestionBadge}>
                <TrendingUp size={12} color={SA.success} />
                <Text style={styles.topQuestionCount}>{faq.usageCount}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <>
          <View style={styles.toolbar}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color={SA.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher..."
                  placeholderTextColor={SA.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={SA.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={openNewForm} testID="faq-add">
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
                onPress={() => setFilterCategory(null)}
              >
                <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>Toutes</Text>
              </TouchableOpacity>
              {FAQ_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                  onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
                >
                  <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <HelpCircle size={40} color={SA.textMuted} />
                <Text style={styles.emptyText}>Aucune question trouvée</Text>
              </View>
            ) : (
              filteredItems.map(item => (
                <View key={item.id} style={[styles.faqCard, !item.isActive && styles.faqCardInactive]}>
                  <View style={styles.faqCardHeader}>
                    <View style={styles.faqCardMeta}>
                      <View style={[styles.categoryBadge, { backgroundColor: SA.accent + '15' }]}>
                        <Text style={[styles.categoryBadgeText, { color: SA.accent }]}>{item.category}</Text>
                      </View>
                      {!item.isActive && (
                        <View style={[styles.categoryBadge, { backgroundColor: SA.danger + '15' }]}>
                          <Text style={[styles.categoryBadgeText, { color: SA.danger }]}>Inactive</Text>
                        </View>
                      )}
                      <Text style={styles.faqUsage}>{item.usageCount}x</Text>
                    </View>
                    <View style={styles.faqCardActions}>
                      <TouchableOpacity
                        style={styles.faqActionBtn}
                        onPress={() => updateFaq({ id: item.id, updates: { isActive: !item.isActive } })}
                      >
                        {item.isActive ? <Eye size={16} color={SA.success} /> : <EyeOff size={16} color={SA.danger} />}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.faqActionBtn} onPress={() => openEditForm(item)}>
                        <Edit3 size={16} color={SA.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.faqActionBtn} onPress={() => handleDelete(item.id, item.question)}>
                        <Trash2 size={16} color={SA.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.faqQuestion} numberOfLines={2}>{item.question}</Text>
                  <Text style={styles.faqAnswer} numberOfLines={3}>{item.answer}</Text>
                  {item.roles.length > 0 && (
                    <View style={styles.faqRoles}>
                      {item.roles.map(role => (
                        <View key={role} style={[styles.rolePill, { backgroundColor: (ADMIN_ROLE_CONFIG[role]?.color ?? '#666') + '20' }]}>
                          <Text style={[styles.rolePillText, { color: ADMIN_ROLE_CONFIG[role]?.color ?? '#666' }]}>
                            {ADMIN_ROLE_CONFIG[role]?.label ?? role}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {item.keywords.length > 0 && (
                    <Text style={styles.faqKeywords}>Mots-clés : {item.keywords.join(', ')}</Text>
                  )}
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.formOverlay}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingItem ? 'Modifier la question' : 'Nouvelle question'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={22} color={SA.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Question *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Comment assigner une chambre ?"
                placeholderTextColor={SA.textMuted}
                value={formQuestion}
                onChangeText={setFormQuestion}
                multiline
              />

              <Text style={styles.formLabel}>Réponse *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Instructions étape par étape..."
                placeholderTextColor={SA.textMuted}
                value={formAnswer}
                onChangeText={setFormAnswer}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.formLabel}>Mots-clés (séparés par des virgules)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="assigner, chambre, femme de chambre"
                placeholderTextColor={SA.textMuted}
                value={formKeywords}
                onChangeText={setFormKeywords}
              />

              <Text style={styles.formLabel}>Catégorie</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.formSelectText}>{formCategory}</Text>
                <ChevronDown size={16} color={SA.textMuted} />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerDropdown}>
                  {FAQ_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pickerOption, formCategory === cat && styles.pickerOptionActive]}
                      onPress={() => { setFormCategory(cat); setShowCategoryPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, formCategory === cat && { color: SA.accent }]}>{cat}</Text>
                      {formCategory === cat && <Check size={14} color={SA.accent} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.formLabel}>Rôles concernés (vide = tous)</Text>
              <View style={styles.rolesGrid}>
                {ALL_ROLES.map(role => {
                  const config = ADMIN_ROLE_CONFIG[role];
                  const selected = formRoles.includes(role);
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleToggle, selected && { borderColor: config.color, backgroundColor: config.color + '15' }]}
                      onPress={() => toggleRole(role)}
                    >
                      <View style={[styles.roleToggleDot, { backgroundColor: config.color }]} />
                      <Text style={[styles.roleToggleText, selected && { color: config.color }]}>{config.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formActiveRow}>
                <Text style={styles.formLabel}>Active</Text>
                <TouchableOpacity
                  style={[styles.toggleSwitch, formActive && styles.toggleSwitchActive]}
                  onPress={() => setFormActive(!formActive)}
                >
                  <View style={[styles.toggleKnob, formActive && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.formCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formSaveBtn} onPress={handleSave}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.formSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  tabBar: { flexDirection: 'row', backgroundColor: SA.surface, borderBottomWidth: 1, borderBottomColor: SA.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: SA.accent },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: SA.textMuted },
  tabTextActive: { color: SA.accent },
  toolbar: { backgroundColor: SA.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SA.border, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surfaceLight, borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: SA.text },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: SA.accent, justifyContent: 'center', alignItems: 'center' },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: SA.surfaceLight, borderWidth: 1, borderColor: SA.border },
  filterChipActive: { backgroundColor: SA.accent + '20', borderColor: SA.accent },
  filterChipText: { fontSize: 12, fontWeight: '500' as const, color: SA.textSec },
  filterChipTextActive: { color: SA.accent },
  content: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: SA.textMuted },
  faqCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, gap: 8 },
  faqCardInactive: { opacity: 0.5 },
  faqCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' as const },
  faqUsage: { fontSize: 11, color: SA.textMuted },
  faqCardActions: { flexDirection: 'row', gap: 4 },
  faqActionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: SA.surfaceLight },
  faqQuestion: { fontSize: 14, fontWeight: '600' as const, color: SA.text, lineHeight: 20 },
  faqAnswer: { fontSize: 12, color: SA.textSec, lineHeight: 18 },
  faqRoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 10, fontWeight: '600' as const },
  faqKeywords: { fontSize: 11, color: SA.textMuted, fontStyle: 'italic' as const },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%' as unknown as number, backgroundColor: SA.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.border, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '800' as const, color: SA.text },
  statLabel: { fontSize: 11, color: SA.textSec, textAlign: 'center' as const },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: SA.text, marginBottom: 12 },
  topQuestionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: SA.border, gap: 12 },
  topQuestionRank: { width: 32, height: 32, borderRadius: 8, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center' },
  topQuestionRankText: { fontSize: 12, fontWeight: '700' as const, color: SA.accent },
  topQuestionInfo: { flex: 1, gap: 2 },
  topQuestionText: { fontSize: 13, fontWeight: '500' as const, color: SA.text },
  topQuestionMeta: { fontSize: 11, color: SA.textMuted },
  topQuestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SA.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  topQuestionCount: { fontSize: 12, fontWeight: '700' as const, color: SA.success },
  formOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  formContainer: { backgroundColor: SA.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: SA.border },
  formTitle: { fontSize: 18, fontWeight: '700' as const, color: SA.text },
  formScroll: { paddingHorizontal: 20, maxHeight: 500 },
  formLabel: { fontSize: 13, fontWeight: '600' as const, color: SA.textSec, marginTop: 16, marginBottom: 8 },
  formInput: { backgroundColor: SA.surface, borderRadius: 12, padding: 14, fontSize: 14, color: SA.text, borderWidth: 1, borderColor: SA.border },
  formTextarea: { minHeight: 120 },
  formSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SA.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SA.border },
  formSelectText: { fontSize: 14, color: SA.text },
  pickerDropdown: { backgroundColor: SA.surface, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: SA.border, overflow: 'hidden' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: SA.border },
  pickerOptionActive: { backgroundColor: SA.accent + '10' },
  pickerOptionText: { fontSize: 13, color: SA.text },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: SA.surface, borderWidth: 1, borderColor: SA.border },
  roleToggleDot: { width: 8, height: 8, borderRadius: 4 },
  roleToggleText: { fontSize: 12, fontWeight: '500' as const, color: SA.textSec },
  formActiveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toggleSwitch: { width: 48, height: 28, borderRadius: 14, backgroundColor: SA.surfaceLight, padding: 2, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: SA.success },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleKnobActive: { alignSelf: 'flex-end' as const },
  formActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: SA.border },
  formCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: SA.surface, borderWidth: 1, borderColor: SA.border },
  formCancelText: { fontSize: 15, fontWeight: '600' as const, color: SA.textSec },
  formSaveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: SA.accent },
  formSaveText: { fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
});

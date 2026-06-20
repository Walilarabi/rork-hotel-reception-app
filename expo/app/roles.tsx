import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Plus, Pencil, Trash2, Check, X, Lock } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { MOBILE_MODULES, type MobileModuleId, type RoleDefinition } from '@/constants/roles';
import { useRoles, type CustomRoleInput } from '@/providers/RolesProvider';

const COLOR_CHOICES = ['#6B5CE7', '#00897B', '#FB8C00', '#78909C', '#E53935', '#1E88E5', '#43A047', '#AB47BC'];

interface DraftState {
  id: string | null; // null = création
  label: string;
  color: string;
  modules: MobileModuleId[];
  landing: MobileModuleId;
}

const EMPTY_DRAFT: DraftState = {
  id: null,
  label: '',
  color: COLOR_CHOICES[0],
  modules: [],
  landing: MOBILE_MODULES[0].id,
};

export default function RolesScreen() {
  const { roles, addRole, updateRole, deleteRole } = useRoles();
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  const openCreate = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((role: RoleDefinition) => {
    setDraft({ id: role.id, label: role.label, color: role.color, modules: role.modules, landing: role.landing });
    setModalVisible(true);
  }, []);

  const toggleModule = useCallback((moduleId: MobileModuleId) => {
    setDraft((prev) => {
      const has = prev.modules.includes(moduleId);
      const modules = has ? prev.modules.filter((m) => m !== moduleId) : [...prev.modules, moduleId];
      const landing = modules.includes(prev.landing) ? prev.landing : modules[0] ?? MOBILE_MODULES[0].id;
      return { ...prev, modules, landing };
    });
  }, []);

  const save = useCallback(() => {
    if (!draft.label.trim()) {
      Alert.alert('Nom requis', 'Donnez un nom au rôle.');
      return;
    }
    if (draft.modules.length === 0) {
      Alert.alert('Modules requis', 'Sélectionnez au moins un module accessible.');
      return;
    }
    const input: CustomRoleInput = {
      label: draft.label,
      color: draft.color,
      modules: draft.modules,
      landing: draft.landing,
    };
    if (draft.id) {
      updateRole(draft.id, input);
    } else {
      addRole(input);
    }
    setModalVisible(false);
  }, [draft, addRole, updateRole]);

  const confirmDelete = useCallback((role: RoleDefinition) => {
    Alert.alert('Supprimer le rôle', `Supprimer le rôle « ${role.label} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteRole(role.id) },
    ]);
  }, [deleteRole]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Rôles & accès' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Définissez quels modules chaque rôle terrain peut consulter. Les rôles système ne sont pas modifiables ;
          créez des rôles personnalisés pour des besoins spécifiques.
        </Text>

        {roles.map((role) => (
          <View key={role.id} style={styles.card}>
            <View style={[styles.colorDot, { backgroundColor: role.color }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{role.label}</Text>
                {role.builtin ? (
                  <View style={styles.systemBadge}>
                    <Lock size={10} color={FT.textMuted} />
                    <Text style={styles.systemBadgeText}>Système</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardModules}>
                {role.modules.map((m) => MOBILE_MODULES.find((mm) => mm.id === m)?.label ?? m).join(' · ')}
              </Text>
            </View>
            {!role.builtin ? (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(role)}>
                  <Pencil size={16} color={FT.brand} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(role)}>
                  <Trash2 size={16} color={FT.danger} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Créer un rôle</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{draft.id ? 'Modifier le rôle' : 'Nouveau rôle'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={FT.textSec} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.fieldLabel}>Nom du rôle</Text>
              <TextInput
                style={styles.input}
                value={draft.label}
                onChangeText={(label) => setDraft((p) => ({ ...p, label }))}
                placeholder="Ex. Lingère, Veilleur de nuit…"
                placeholderTextColor={FT.textMuted}
              />

              <Text style={styles.fieldLabel}>Couleur</Text>
              <View style={styles.colorRow}>
                {COLOR_CHOICES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorChoice, { backgroundColor: c }, draft.color === c && styles.colorChoiceActive]}
                    onPress={() => setDraft((p) => ({ ...p, color: c }))}
                  >
                    {draft.color === c ? <Check size={14} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Modules accessibles</Text>
              {MOBILE_MODULES.map((module) => {
                const active = draft.modules.includes(module.id);
                return (
                  <TouchableOpacity key={module.id} style={styles.moduleRow} onPress={() => toggleModule(module.id)}>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active ? <Check size={14} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                  </TouchableOpacity>
                );
              })}

              {draft.modules.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>Écran d&apos;accueil</Text>
                  <View style={styles.landingRow}>
                    {draft.modules.map((mId) => {
                      const module = MOBILE_MODULES.find((m) => m.id === mId);
                      if (!module) return null;
                      const active = draft.landing === mId;
                      return (
                        <TouchableOpacity
                          key={mId}
                          style={[styles.landingChip, active && styles.landingChipActive]}
                          onPress={() => setDraft((p) => ({ ...p, landing: mId }))}
                        >
                          <Text style={[styles.landingChipText, active && styles.landingChipTextActive]}>{module.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>{draft.id ? 'Enregistrer' : 'Créer le rôle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { color: FT.textSec, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    borderWidth: 1,
    borderColor: FT.border,
    padding: 14,
    marginBottom: 10,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: FT.text },
  systemBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: FT.surfaceHover, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  systemBadgeText: { fontSize: 10, color: FT.textMuted, fontWeight: '600' },
  cardModules: { fontSize: 12, color: FT.textSec, marginTop: 3 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FT.brand,
    borderRadius: FT.cardRadius,
    paddingVertical: 14,
    marginTop: 8,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,16,53,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: FT.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: FT.text },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: FT.textSec, marginTop: 14, marginBottom: 8 },
  input: { backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: FT.text },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorChoice: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  colorChoiceActive: { borderWidth: 2, borderColor: FT.text },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: FT.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  moduleLabel: { fontSize: 15, color: FT.text },
  landingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  landingChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: FT.chipRadius, borderWidth: 1, borderColor: FT.border, backgroundColor: FT.surfaceAlt },
  landingChipActive: { backgroundColor: FT.brandSoft, borderColor: FT.brand },
  landingChipText: { fontSize: 13, color: FT.textSec, fontWeight: '600' },
  landingChipTextActive: { color: FT.brand },
  saveBtn: { backgroundColor: FT.brand, borderRadius: FT.cardRadius, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

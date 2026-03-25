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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AlertTriangle, CheckCircle, Send, User, Clock, Plus, DollarSign, Repeat, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import { MaintenanceCost } from '@/constants/types';

const PRIORITY_CONFIG = {
  haute: { label: 'Haute', color: Colors.danger },
  moyenne: { label: 'Moyenne', color: Colors.warning },
  basse: { label: 'Basse', color: Colors.info },
};

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: Colors.warning },
  en_cours: { label: 'En cours', color: Colors.teal },
  resolu: { label: 'Résolu', color: Colors.success },
};

export default function TicketDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const { maintenanceTasks, updateMaintenance, addMaintenanceCost } = useHotel();

  const task = useMemo(() => maintenanceTasks.find((t) => t.id === taskId), [maintenanceTasks, taskId]);
  const [commentText, setCommentText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showCostModal, setShowCostModal] = useState(false);
  const [costName, setCostName] = useState('');
  const [costQty, setCostQty] = useState('1');
  const [costPrice, setCostPrice] = useState('');
  const [costSupplier, setCostSupplier] = useState('');

  const handleTakeCharge = useCallback(() => {
    if (!task) return;
    updateMaintenance({ taskId: task.id, updates: { status: 'en_cours', assignedTo: 'Pierre D.' } });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [task, updateMaintenance]);

  const handleResolve = useCallback(() => {
    if (!task) return;
    Alert.alert('Résoudre l\'intervention', 'Marquer comme résolu ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Résoudre',
        onPress: () => {
          updateMaintenance({
            taskId: task.id,
            updates: {
              status: 'resolu',
              resolutionNotes: resolutionNotes || 'Résolu',
              resolvedAt: new Date().toISOString(),
            },
          });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  }, [task, resolutionNotes, updateMaintenance, router]);

  const handleAddComment = useCallback(() => {
    if (!task || !commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: task.assignedTo ?? 'Technicien',
      text: commentText.trim(),
      date: new Date().toISOString(),
    };
    updateMaintenance({ taskId: task.id, updates: { comments: [...task.comments, newComment] } });
    setCommentText('');
  }, [task, commentText, updateMaintenance]);

  const handleAddCost = useCallback(() => {
    if (!task || !costName.trim() || !costPrice) return;
    const qty = parseFloat(costQty) || 1;
    const price = parseFloat(costPrice) || 0;
    if (price <= 0) {
      Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
      return;
    }
    addMaintenanceCost({
      taskId: task.id,
      cost: {
        productName: costName.trim(),
        quantity: qty,
        unitPrice: price,
        supplier: costSupplier.trim(),
      },
    });
    setCostName('');
    setCostQty('1');
    setCostPrice('');
    setCostSupplier('');
    setShowCostModal(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [task, costName, costQty, costPrice, costSupplier, addMaintenanceCost]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Intervention introuvable' }} />
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Intervention introuvable</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Ch. ${task.roomNumber}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.roomLabel}>Chambre {task.roomNumber}</Text>
              {task.isPeriodic && (
                <View style={styles.periodicBadge}>
                  <Repeat size={10} color="#6B5CE7" />
                  <Text style={styles.periodicText}>Périodique</Text>
                </View>
              )}
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '15' }]}>
              <AlertTriangle size={12} color={priorityConfig.color} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>{priorityConfig.label}</Text>
            </View>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.category ? (
            <Text style={styles.categoryLabel}>📂 {task.category}</Text>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{task.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <User size={14} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Signalé par</Text>
            <Text style={styles.infoValue}>{task.reportedBy}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(task.reportedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {task.assignedTo ? (
            <View style={styles.infoRow}>
              <User size={14} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Assigné à</Text>
              <Text style={styles.infoValue}>{task.assignedTo}</Text>
            </View>
          ) : null}
          {task.resolvedAt ? (
            <View style={styles.infoRow}>
              <CheckCircle size={14} color={Colors.success} />
              <Text style={styles.infoLabel}>Résolu le</Text>
              <Text style={styles.infoValue}>
                {new Date(task.resolvedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Coûts marchandises</Text>
            {task.status !== 'resolu' && (
              <TouchableOpacity style={styles.addCostBtn} onPress={() => setShowCostModal(true)}>
                <Plus size={14} color={Colors.white} />
                <Text style={styles.addCostBtnText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
          {task.costs && task.costs.length > 0 ? (
            <>
              {task.costs.map((cost: MaintenanceCost) => (
                <View key={cost.id} style={styles.costItem}>
                  <View style={styles.costItemLeft}>
                    <Package size={14} color={Colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.costItemName}>{cost.productName}</Text>
                      {cost.supplier ? <Text style={styles.costItemSupplier}>{cost.supplier}</Text> : null}
                    </View>
                  </View>
                  <View style={styles.costItemRight}>
                    <Text style={styles.costItemQty}>{cost.quantity} × {cost.unitPrice.toFixed(2)}€</Text>
                    <Text style={styles.costItemTotal}>{cost.totalPrice.toFixed(2)}€</Text>
                  </View>
                </View>
              ))}
              <View style={styles.costTotalRow}>
                <DollarSign size={16} color={Colors.primary} />
                <Text style={styles.costTotalLabel}>Total</Text>
                <Text style={styles.costTotalValue}>{task.costTotal.toFixed(2)}€</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noCostText}>Aucun coût enregistré</Text>
          )}
        </View>

        {task.resolutionNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes de résolution</Text>
            <Text style={styles.resolutionText}>{task.resolutionNotes}</Text>
          </View>
        ) : null}

        {task.comments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaires</Text>
            {task.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentContent}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.commentInputSection}>
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={Colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleAddComment}>
              <Send size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {task.status === 'en_attente' && (
          <TouchableOpacity style={styles.takeChargeBtn} onPress={handleTakeCharge}>
            <Text style={styles.takeChargeBtnText}>Prendre en charge</Text>
          </TouchableOpacity>
        )}

        {task.status === 'en_cours' && (
          <View style={styles.resolveSection}>
            <TextInput
              style={styles.resolveInput}
              placeholder="Notes de résolution..."
              placeholderTextColor={Colors.textMuted}
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
            />
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <CheckCircle size={18} color={Colors.white} />
              <Text style={styles.resolveBtnText}>Résoudre</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showCostModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un coût</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du produit / pièce *"
              placeholderTextColor={Colors.textMuted}
              value={costName}
              onChangeText={setCostName}
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Quantité"
                placeholderTextColor={Colors.textMuted}
                value={costQty}
                onChangeText={setCostQty}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Prix unitaire € *"
                placeholderTextColor={Colors.textMuted}
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Fournisseur (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={costSupplier}
              onChangeText={setCostSupplier}
            />
            {costName && costPrice ? (
              <Text style={styles.costPreview}>
                Total : {((parseFloat(costQty) || 1) * (parseFloat(costPrice) || 0)).toFixed(2)}€
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCostModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!costName || !costPrice) && styles.modalBtnDisabled]}
                onPress={handleAddCost}
                disabled={!costName || !costPrice}
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
  container: { flex: 1, backgroundColor: Colors.background },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnText: { color: Colors.white, fontWeight: '600' as const },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerCard: { backgroundColor: Colors.surface, padding: 20, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary },
  periodicBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6B5CE715', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  periodicText: { fontSize: 10, fontWeight: '600' as const, color: '#6B5CE7' },
  categoryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  priorityText: { fontSize: 12, fontWeight: '600' as const },
  taskTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  section: { backgroundColor: Colors.surface, padding: 16, marginTop: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  descriptionText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '500' as const, color: Colors.text },
  addCostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.teal, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addCostBtnText: { fontSize: 11, fontWeight: '600' as const, color: Colors.white },
  costItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceLight, borderRadius: 10, padding: 12 },
  costItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  costItemName: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  costItemSupplier: { fontSize: 11, color: Colors.textMuted },
  costItemRight: { alignItems: 'flex-end' },
  costItemQty: { fontSize: 11, color: Colors.textSecondary },
  costItemTotal: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary },
  costTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  costTotalLabel: { flex: 1, fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  costTotalValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.primary },
  noCostText: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' as const },
  resolutionText: { fontSize: 14, color: Colors.success, fontWeight: '500' as const, lineHeight: 22 },
  commentItem: { backgroundColor: Colors.surfaceLight, borderRadius: 10, padding: 12, gap: 4 },
  commentAuthor: { fontSize: 12, fontWeight: '700' as const, color: Colors.primary },
  commentContent: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  commentDate: { fontSize: 10, color: Colors.textMuted },
  commentInputSection: { backgroundColor: Colors.surface, padding: 16, marginTop: 8 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentInput: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  takeChargeBtn: { backgroundColor: Colors.teal, paddingVertical: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 12, alignItems: 'center' },
  takeChargeBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.white },
  resolveSection: { padding: 16, gap: 12 },
  resolveInput: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 80, textAlignVertical: 'top' as const },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, paddingVertical: 16, borderRadius: 12, gap: 8 },
  resolveBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  modalInput: { backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  modalRow: { flexDirection: 'row', gap: 10 },
  costPreview: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary, textAlign: 'right' as const },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.teal },
  modalConfirmText: { fontSize: 14, fontWeight: '600' as const, color: Colors.white },
  modalBtnDisabled: { opacity: 0.5 },
});

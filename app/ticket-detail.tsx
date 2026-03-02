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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AlertTriangle, CheckCircle, Send, User, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';

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
  const { maintenanceTasks, updateMaintenance } = useHotel();

  const task = useMemo(() => maintenanceTasks.find((t) => t.id === taskId), [maintenanceTasks, taskId]);
  const [commentText, setCommentText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleTakeCharge = useCallback(() => {
    if (!task) return;
    updateMaintenance({ taskId: task.id, updates: { status: 'en_cours', assignedTo: 'Pierre D.' } });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [task, updateMaintenance]);

  const handleResolve = useCallback(() => {
    if (!task) return;
    Alert.alert('Résoudre l\'intervention', `Marquer comme résolu ?`, [
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
            <Text style={styles.roomLabel}>Chambre {task.roomNumber}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '15' }]}>
              <AlertTriangle size={12} color={priorityConfig.color} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>{priorityConfig.label}</Text>
            </View>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
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
          {task.assignedTo && (
            <View style={styles.infoRow}>
              <User size={14} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Assigné à</Text>
              <Text style={styles.infoValue}>{task.assignedTo}</Text>
            </View>
          )}
          {task.resolvedAt && (
            <View style={styles.infoRow}>
              <CheckCircle size={14} color={Colors.success} />
              <Text style={styles.infoLabel}>Résolu le</Text>
              <Text style={styles.infoValue}>
                {new Date(task.resolvedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
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
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  priorityText: { fontSize: 12, fontWeight: '600' as const },
  taskTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  section: { backgroundColor: Colors.surface, padding: 16, marginTop: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  descriptionText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '500' as const, color: Colors.text },
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
});

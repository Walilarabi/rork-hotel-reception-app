import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Animated,
  Switch,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { Colors } from '@/constants/colors';
import {
  CHECKLIST_ITEMS,
  MAINTENANCE_CATEGORIES,
  HousekeepingChecklist,
  DEFAULT_CHECKLIST,
  ConsumableProduct,
  ConsumableCategory,
  CONSUMABLE_CATEGORY_CONFIG,
} from '@/constants/types';

interface CommentItem {
  id: string;
  author: string;
  text: string;
  time: string;
}

export default function TaskDetailScreen() {
  const { roomId, openReport } = useLocalSearchParams<{ roomId: string; openReport?: string }>();
  const router = useRouter();
  const { rooms, startCleaning, completeCleaning, reportProblem, updateRoom, consumableProducts, addConsumptions } = useHotel();

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  const [checklist, setChecklist] = useState<HousekeepingChecklist>({ ...DEFAULT_CHECKLIST });
  const [showConsumption, setShowConsumption] = useState(false);
  const [showReport, setShowReport] = useState(openReport === '1');
  const [showLostFound, setShowLostFound] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [consumptions, setConsumptions] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<ConsumableCategory | null>(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportPriority, setReportPriority] = useState<'haute' | 'moyenne' | 'basse'>('moyenne');
  const [lostFoundDesc, setLostFoundDesc] = useState('');
  const [isNPD, setIsNPD] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([
    { id: 'c1', author: 'Ayanty', text: 'Manque une serviette taille moyenne', time: '09:24' },
  ]);
  const [newComment, setNewComment] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isInProgress = room?.cleaningStatus === 'en_cours';
  const isNotStarted = room?.cleaningStatus === 'none' || room?.cleaningStatus === 'refusee';
  const isDone = room?.cleaningStatus === 'nettoyee' || room?.cleaningStatus === 'validee';

  useEffect(() => {
    if (room?.status === 'hors_service') {
      setIsBlocked(true);
    }
  }, [room?.status]);

  useEffect(() => {
    if (isInProgress && room?.cleaningStartedAt) {
      const start = new Date(room.cleaningStartedAt).getTime();
      const update = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      update();
      timerRef.current = setInterval(update, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isInProgress, room?.cleaningStartedAt]);

  useEffect(() => {
    if (isInProgress) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isInProgress, pulseAnim]);

  const formatTimer = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const handleToggleChecklist = useCallback((key: keyof HousekeepingChecklist) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleStart = useCallback(() => {
    if (!room) return;
    startCleaning(room.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [room, startCleaning]);

  const handleComplete = useCallback(() => {
    if (!room) return;
    Alert.alert(
      '✅ Terminer ?',
      `Chambre ${room.roomNumber} terminée ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: () => {
            completeCleaning(room.id);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [room, completeCleaning, router]);

  const handleNPDToggle = useCallback((value: boolean) => {
    if (!room) return;
    setIsNPD(value);
    if (value) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('🔕 NPD activé', `Chambre ${room.roomNumber} marquée Ne Pas Déranger`);
    }
  }, [room]);

  const handleBlockToggle = useCallback((value: boolean) => {
    if (!room) return;
    setIsBlocked(value);
    if (value) {
      updateRoom({ roomId: room.id, updates: { status: 'hors_service' as const } });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [room, updateRoom]);

  const handleInProgressToggle = useCallback(() => {
    if (!room) return;
    if (isInProgress) {
      handleComplete();
    } else if (isNotStarted) {
      handleStart();
    }
  }, [room, isInProgress, isNotStarted, handleComplete, handleStart]);

  const handleConsumptionUpdate = useCallback((productId: string, delta: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConsumptions((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  }, []);

  const handleSubmitConsumptions = useCallback(() => {
    if (!room) return;
    const items = Object.entries(consumptions)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) {
      Alert.alert('Aucun article', 'Sélectionnez au moins un article.');
      return;
    }
    addConsumptions({
      roomId: room.id,
      roomNumber: room.roomNumber,
      items,
      reportedBy: room.cleaningAssignee ?? 'Femme de chambre',
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Enregistré', `${items.length} article(s) déclaré(s).`);
    setConsumptions({});
    setSelectedCategory(null);
    setShowConsumption(false);
  }, [room, consumptions, addConsumptions]);

  const handleSubmitReport = useCallback(() => {
    if (!room || !reportCategory) {
      Alert.alert('Erreur', 'Choisissez une catégorie.');
      return;
    }
    reportProblem({
      roomId: room.id,
      roomNumber: room.roomNumber,
      title: reportCategory,
      description: reportDesc.trim(),
      priority: reportPriority,
      reportedBy: room.cleaningAssignee ?? 'Femme de chambre',
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('⚠️ Signalement envoyé', 'La maintenance a été prévenue.');
    setShowReport(false);
    setReportCategory('');
    setReportDesc('');
  }, [room, reportCategory, reportDesc, reportPriority, reportProblem]);

  const handleSubmitLostFound = useCallback(() => {
    if (!lostFoundDesc.trim()) {
      Alert.alert('Erreur', 'Décrivez l\'objet trouvé.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('🔍 Objet enregistré', 'La gouvernante a été prévenue.');
    setShowLostFound(false);
    setLostFoundDesc('');
  }, [lostFoundDesc]);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setComments((prev) => [...prev, {
      id: `c-${Date.now()}`,
      author: 'Moi',
      text: newComment.trim(),
      time,
    }]);
    setNewComment('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newComment]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return consumableProducts.filter((p) => p.category === selectedCategory);
  }, [consumableProducts, selectedCategory]);

  const consumptionTotal = useMemo(() => {
    return Object.entries(consumptions).reduce((sum, [productId, qty]) => {
      const product = consumableProducts.find((p) => p.id === productId);
      return sum + (product ? product.unitPrice * qty : 0);
    }, 0);
  }, [consumptions, consumableProducts]);

  const totalConsumptionItems = useMemo(() => {
    return Object.values(consumptions).reduce((s, q) => s + q, 0);
  }, [consumptions]);

  if (!room) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Introuvable' }} />
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>❓</Text>
          <Text style={styles.errorText}>Chambre introuvable</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.roomHeader}>
            <Text style={styles.roomNumber}>{room.roomNumber}</Text>
            <Text style={styles.roomType}>{room.roomType}</Text>
            {room.clientBadge === 'vip' && (
              <View style={styles.vipTag}>
                <Text style={styles.vipTagText}>⭐ VIP</Text>
              </View>
            )}
            {room.clientBadge === 'prioritaire' && (
              <View style={[styles.vipTag, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.vipTagText, { color: '#C62828' }]}>⚡ Prioritaire</Text>
              </View>
            )}
            {room.cleaningStatus === 'refusee' && (
              <View style={[styles.vipTag, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.vipTagText, { color: '#C62828' }]}>❌ À refaire</Text>
              </View>
            )}
          </View>

          {room.currentReservation && (
            <View style={styles.guestCard}>
              <View style={styles.guestAvatarCircle}>
                <Text style={styles.guestAvatarText}>
                  {room.currentReservation.guestName[0]}
                </Text>
              </View>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>{room.currentReservation.guestName}</Text>
              </View>
            </View>
          )}

          {room.currentReservation && (
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Check-in</Text>
                <Text style={styles.infoValue}>
                  {new Date(room.currentReservation.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Check-out</Text>
                <Text style={styles.infoValue}>
                  {new Date(room.currentReservation.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )}

          {room.vipInstructions ? (
            <View style={styles.instructionsBanner}>
              <Text style={styles.instructionsIcon}>💬</Text>
              <Text style={styles.instructionsText}>{room.vipInstructions}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleIcon}>🔕</Text>
                <Text style={styles.toggleLabel}>NPD</Text>
              </View>
              <Switch
                value={isNPD}
                onValueChange={handleNPDToggle}
                trackColor={{ false: '#E0E0E0', true: '#FFB74D' }}
                thumbColor={isNPD ? '#FB8C00' : '#F5F5F5'}
                testID="npd-toggle"
              />
            </View>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.toggleRow} onPress={handleInProgressToggle} activeOpacity={0.7}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleIcon}>🕐</Text>
                <Text style={styles.toggleLabel}>EN COURS</Text>
              </View>
              {isInProgress ? (
                <Animated.View style={[styles.timerBadge, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.timerBadgeText}>{formatTimer(elapsedSeconds)}</Text>
                </Animated.View>
              ) : (
                <View style={[styles.statusDot, isNotStarted ? styles.statusDotInactive : styles.statusDotDone]} />
              )}
            </TouchableOpacity>

            <View style={styles.separator} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleIcon}>🚫</Text>
                <Text style={styles.toggleLabel}>BLOQUÉE</Text>
              </View>
              <Switch
                value={isBlocked}
                onValueChange={handleBlockToggle}
                trackColor={{ false: '#E0E0E0', true: '#EF9A9A' }}
                thumbColor={isBlocked ? '#E53935' : '#F5F5F5'}
                testID="block-toggle"
              />
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowLostFound(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>📷</Text>
              <Text style={styles.actionButtonLabel}>Objet trouvé</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowConsumption(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>📋</Text>
              <Text style={styles.actionButtonLabel}>Consommables</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReport(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>⚠️</Text>
              <Text style={styles.actionButtonLabel}>Signaler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowChecklist(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>✅</Text>
              <Text style={styles.actionButtonLabel}>Checklist</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaires</Text>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentMeta}>{c.author} | {c.time}</Text>
              </View>
            ))}
          </View>

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={Colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              testID="comment-input"
            />
            <TouchableOpacity
              style={[styles.commentSendBtn, !newComment.trim() && styles.commentSendBtnDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Text style={styles.commentSendText}>Envoyer</Text>
            </TouchableOpacity>
          </View>

          {isNotStarted && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8} testID="start-cleaning">
              <Text style={styles.mainBtnIcon}>▶️</Text>
              <Text style={styles.mainBtnText}>Je commence</Text>
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8} testID="complete-cleaning">
              <Text style={styles.mainBtnIcon}>✅</Text>
              <Text style={styles.mainBtnText}>Terminé</Text>
            </TouchableOpacity>
          )}

          {isDone && (
            <View style={styles.doneNotice}>
              <Text style={styles.doneIcon}>🎉</Text>
              <Text style={styles.doneText}>Nettoyage terminé</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showConsumption} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory
                  ? `${CONSUMABLE_CATEGORY_CONFIG[selectedCategory].icon} ${CONSUMABLE_CATEGORY_CONFIG[selectedCategory].label}`
                  : '🧴 Consommables'}
              </Text>
              <TouchableOpacity onPress={() => {
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  setShowConsumption(false);
                }
              }}>
                <Text style={styles.modalClose}>{selectedCategory ? '←' : '✕'}</Text>
              </TouchableOpacity>
            </View>

            {!selectedCategory ? (
              <View style={styles.categoryGrid}>
                {(Object.keys(CONSUMABLE_CATEGORY_CONFIG) as ConsumableCategory[]).map((cat) => {
                  const config = CONSUMABLE_CATEGORY_CONFIG[cat];
                  const catItems = Object.entries(consumptions).filter(([pid, qty]) => {
                    const p = consumableProducts.find((pr) => pr.id === pid);
                    return p?.category === cat && qty > 0;
                  });
                  const catCount = catItems.reduce((s, [, q]) => s + q, 0);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryCard, { borderColor: config.color + '30' }]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryCardIcon}>{config.icon}</Text>
                      <Text style={styles.categoryCardLabel}>{config.label}</Text>
                      {catCount > 0 && (
                        <View style={[styles.categoryBadge, { backgroundColor: config.color }]}>
                          <Text style={styles.categoryBadgeText}>{catCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <FlatList
                data={categoryProducts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.productsList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }: { item: ConsumableProduct }) => {
                  const qty = consumptions[item.id] ?? 0;
                  return (
                    <View style={styles.productRow}>
                      <Text style={styles.productIcon}>{item.icon}</Text>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>{item.unitPrice.toFixed(2)}€/{item.unit}</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                          onPress={() => handleConsumptionUpdate(item.id, -1)}
                          disabled={qty === 0}
                        >
                          <Text style={[styles.qtyBtnText, qty === 0 && styles.qtyBtnTextDisabled]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.qtyValue, qty > 0 && styles.qtyValueActive]}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, styles.qtyBtnPlus]}
                          onPress={() => handleConsumptionUpdate(item.id, 1)}
                        >
                          <Text style={[styles.qtyBtnText, { color: '#FFF' }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {totalConsumptionItems > 0 && (
              <View style={styles.consumptionSummary}>
                <Text style={styles.consumptionSummaryText}>
                  {totalConsumptionItems} article(s) • {consumptionTotal.toFixed(2)}€
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, totalConsumptionItems === 0 && { opacity: 0.5 }]}
              onPress={handleSubmitConsumptions}
              disabled={totalConsumptionItems === 0}
            >
              <Text style={styles.modalSubmitText}>✅ Valider les consommables</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReport} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Signaler</Text>
              <TouchableOpacity onPress={() => setShowReport(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.reportCategoryGrid}>
                {MAINTENANCE_CATEGORIES.map((cat) => {
                  const icon = cat === 'Plomberie' ? '🔧' : cat === 'Électricité' ? '💡' : cat === 'Climatisation' ? '❄️' : cat === 'Serrurerie' ? '🔑' : cat === 'Mobilier' ? '🪑' : '📦';
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.reportCategoryChip, reportCategory === cat && styles.reportCategoryChipActive]}
                      onPress={() => setReportCategory(cat)}
                    >
                      <Text style={styles.reportCategoryIcon}>{icon}</Text>
                      <Text style={[styles.reportCategoryText, reportCategory === cat && styles.reportCategoryTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Décrivez le problème..."
                placeholderTextColor={Colors.textMuted}
                value={reportDesc}
                onChangeText={setReportDesc}
                multiline
              />
              <Text style={styles.fieldLabel}>Priorité</Text>
              <View style={styles.priorityRow}>
                {(['haute', 'moyenne', 'basse'] as const).map((p) => {
                  const active = reportPriority === p;
                  const color = p === 'haute' ? '#E53935' : p === 'moyenne' ? '#FB8C00' : '#43A047';
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityChip, { backgroundColor: active ? color : color + '15', borderColor: active ? color : 'transparent', borderWidth: 2 }]}
                      onPress={() => setReportPriority(p)}
                    >
                      <Text style={[styles.priorityChipText, active && { color: '#FFF' }]}>
                        {p === 'haute' ? '🔴' : p === 'moyenne' ? '🟡' : '🟢'} {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.photoPlaceholder} onPress={() => Alert.alert('📷 Photo', 'Fonctionnalité appareil photo')}>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>Ajouter photo</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#FB8C00' }]} onPress={handleSubmitReport}>
              <Text style={styles.modalSubmitText}>⚠️ Envoyer le signalement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLostFound} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Objet trouvé</Text>
              <TouchableOpacity onPress={() => setShowLostFound(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalScroll}>
              <TouchableOpacity style={styles.photoPlaceholder} onPress={() => Alert.alert('📷 Photo', 'Fonctionnalité appareil photo')}>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>Prendre une photo</Text>
              </TouchableOpacity>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Portefeuille noir, montre dorée..."
                placeholderTextColor={Colors.textMuted}
                value={lostFoundDesc}
                onChangeText={setLostFoundDesc}
                multiline
              />
            </View>
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#7B1FA2' }]} onPress={handleSubmitLostFound}>
              <Text style={styles.modalSubmitText}>🔍 Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showChecklist} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✅ Checklist</Text>
              <TouchableOpacity onPress={() => setShowChecklist(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CHECKLIST_ITEMS.map((item) => {
                const checked = checklist[item.key];
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.checklistRow, checked && styles.checklistRowChecked]}
                    onPress={() => handleToggleChecklist(item.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.checklistItemIcon}>{checked ? '✅' : item.icon}</Text>
                    <Text style={[styles.checklistItemLabel, checked && styles.checklistItemLabelChecked]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setShowChecklist(false)}>
              <Text style={styles.modalSubmitText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F7' },
  backBtn: { padding: 4 },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  errorEmoji: { fontSize: 56 },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  errorBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorBtnText: { color: '#FFF', fontWeight: '600' as const, fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  roomHeader: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  roomNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  roomType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vipTag: {
    marginTop: 8,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  vipTagText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#F57F17',
  },

  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  guestAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAvatarText: { fontSize: 18, fontWeight: '700' as const, color: '#E65100' },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },

  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    padding: 14,
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F2F4',
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  instructionsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  instructionsIcon: { fontSize: 16 },
  instructionsText: { flex: 1, fontSize: 13, color: '#5D4037', lineHeight: 18, fontStyle: 'italic' as const },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleIcon: { fontSize: 18 },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timerBadge: {
    backgroundColor: '#00897B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timerBadgeText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  statusDotInactive: {
    backgroundColor: '#E0E0E0',
  },
  statusDotDone: {
    backgroundColor: '#43A047',
  },

  actionButtonsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonIcon: { fontSize: 20 },
  actionButtonLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },

  commentItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  commentMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  commentSendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  commentSendText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00897B',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43A047',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainBtnIcon: { fontSize: 22 },
  mainBtnText: { fontSize: 18, fontWeight: '800' as const, color: '#FFF' },

  doneNotice: {
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
    paddingVertical: 20,
  },
  doneIcon: { fontSize: 40 },
  doneText: { fontSize: 16, fontWeight: '600' as const, color: Colors.textSecondary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalScroll: { paddingHorizontal: 20, paddingVertical: 12 },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  categoryCard: {
    width: '47%' as unknown as number,
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    position: 'relative',
  },
  categoryCardIcon: { fontSize: 36 },
  categoryCardLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF' },

  productsList: { paddingHorizontal: 20, paddingVertical: 8 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  productIcon: { fontSize: 28 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  productPrice: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: { opacity: 0.3 },
  qtyBtnPlus: { backgroundColor: Colors.primary },
  qtyBtnText: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  qtyBtnTextDisabled: { color: Colors.textMuted },
  qtyValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    minWidth: 28,
    textAlign: 'center' as const,
  },
  qtyValueActive: { color: Colors.text },

  consumptionSummary: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  consumptionSummaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'center',
  },

  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  reportCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportCategoryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  reportCategoryIcon: { fontSize: 18 },
  reportCategoryText: { fontSize: 13, color: Colors.text },
  reportCategoryTextActive: { color: Colors.primary, fontWeight: '600' as const },
  textArea: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  priorityChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.text },

  photoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: { fontSize: 20 },
  photoPlaceholderText: { fontSize: 14, color: Colors.textSecondary },

  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  checklistRowChecked: {
    backgroundColor: '#F1F8E9',
  },
  checklistItemIcon: { fontSize: 24 },
  checklistItemLabel: { fontSize: 15, color: Colors.text, flex: 1, fontWeight: '500' as const },
  checklistItemLabelChecked: { color: '#2E7D32', textDecorationLine: 'line-through' as const },
});

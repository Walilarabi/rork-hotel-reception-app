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
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Play, Flame, Camera as CameraIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useColors } from '@/hooks/useColors';
import { Colors } from '@/constants/colors';
import {
  CHECKLIST_ITEMS,
  HousekeepingChecklist,
  DEFAULT_CHECKLIST,
  ConsumableProduct,
} from '@/constants/types';

const OFFLINE_QUEUE_KEY = 'offline_task_queue';

interface ReportItem {
  id: string;
  icon: string;
  label: string;
  category: string;
}

const REPORT_ITEMS: ReportItem[] = [
  { id: 'r1', icon: '🚽', label: 'WC bouché', category: 'Plomberie' },
  { id: 'r2', icon: '💡', label: 'Ampoule grillée', category: 'Électricité' },
  { id: 'r3', icon: '❄️', label: 'Clim en panne', category: 'Climatisation' },
  { id: 'r4', icon: '🔑', label: 'Serrure cassée', category: 'Serrurerie' },
  { id: 'r5', icon: '🚿', label: 'Fuite robinet', category: 'Plomberie' },
  { id: 'r6', icon: '🪑', label: 'Mobilier abîmé', category: 'Mobilier' },
  { id: 'r7', icon: '📺', label: 'TV ne marche pas', category: 'Électricité' },
  { id: 'r8', icon: '📦', label: 'Autre problème', category: 'Autre' },
];

interface LostObjectType {
  id: string;
  icon: string;
  label: string;
}

const LOST_OBJECT_TYPES: LostObjectType[] = [
  { id: 'lo1', icon: '📱', label: 'Téléphone' },
  { id: 'lo2', icon: '💻', label: 'PC portable' },
  { id: 'lo3', icon: '🔑', label: 'Clés' },
  { id: 'lo4', icon: '👔', label: 'Vêtement' },
  { id: 'lo5', icon: '👜', label: 'Sac' },
  { id: 'lo6', icon: '👟', label: 'Chaussures' },
  { id: 'lo7', icon: '💍', label: 'Bijoux' },
  { id: 'lo8', icon: '💶', label: 'Argent' },
];

export default function TaskDetailScreen() {
  const { roomId, openReport } = useLocalSearchParams<{ roomId: string; openReport?: string }>();
  const router = useRouter();
  const { rooms, startCleaning, completeCleaning, reportProblem, consumableProducts, addConsumptions, updateRoom } = useHotel();
  const { theme } = useTheme();
  const colors = useColors();

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  const [checklist, setChecklist] = useState<HousekeepingChecklist>({ ...DEFAULT_CHECKLIST });
  const [showReport, setShowReport] = useState(openReport === '1');
  const [showLostObject, setShowLostObject] = useState(false);
  const [consumptions, setConsumptions] = useState<Record<string, number>>({});
  const [selectedReportItem, setSelectedReportItem] = useState<ReportItem | null>(null);
  const [reportDesc, setReportDesc] = useState('');
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('checklist');

  const [selectedLostObject, setSelectedLostObject] = useState<LostObjectType | null>(null);
  const [lostObjectDesc, setLostObjectDesc] = useState('');
  const [lostObjectPhotos, setLostObjectPhotos] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isInProgress = room?.cleaningStatus === 'en_cours';
  const isNotStarted = room?.cleaningStatus === 'none' || room?.cleaningStatus === 'refusee';
  const isDone = room?.cleaningStatus === 'nettoyee' || room?.cleaningStatus === 'validee';
  const isNpd = room?.status === 'hors_service' && room?.vipInstructions === 'NPD';

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
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
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
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const saveOfflineAction = useCallback(async (action: Record<string, unknown>) => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = stored ? JSON.parse(stored) : [];
      queue.push(action);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('[TaskDetail] Offline action queued:', action);
    } catch (e) {
      console.log('[TaskDetail] Failed to queue offline action:', e);
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!room) return;
    startCleaning(room.id);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [room, startCleaning]);

  const handleComplete = useCallback(() => {
    if (!room) return;
    const consumptionItems = Object.entries(consumptions)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    Alert.alert(
      '✅ Terminer le nettoyage ?',
      `Chambre ${room.roomNumber}\nStatut: Terminé, en Attente de Validation${consumptionItems.length > 0 ? `\n${consumptionItems.length} consommable(s)` : ''}`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: () => {
            if (consumptionItems.length > 0) {
              addConsumptions({
                roomId: room.id,
                roomNumber: room.roomNumber,
                items: consumptionItems,
                reportedBy: room.cleaningAssignee ?? 'Femme de chambre',
              });
            }
            completeCleaning(room.id);
            if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void saveOfflineAction({ type: 'complete', roomId: room.id, timestamp: Date.now() });
            router.back();
          },
        },
      ]
    );
  }, [room, completeCleaning, router, consumptions, addConsumptions, saveOfflineAction]);

  const handleNpd = useCallback(() => {
    if (!room) return;
    if (isNpd) {
      updateRoom({ roomId: room.id, updates: { status: 'occupe', vipInstructions: '' } });
    } else {
      updateRoom({ roomId: room.id, updates: { status: 'hors_service', vipInstructions: 'NPD' } });
      if (isInProgress && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [room, isNpd, isInProgress, updateRoom]);

  const handleConsumptionUpdate = useCallback((productId: string, delta: number) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConsumptions((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  }, []);

  const handleSubmitReport = useCallback(() => {
    if (!room || !selectedReportItem) {
      Alert.alert('Erreur', 'Choisissez un type de problème.');
      return;
    }
    reportProblem({
      roomId: room.id,
      roomNumber: room.roomNumber,
      title: selectedReportItem.label,
      description: reportDesc.trim() || selectedReportItem.label,
      priority: 'moyenne',
      reportedBy: room.cleaningAssignee ?? 'Femme de chambre',
    });
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void saveOfflineAction({ type: 'report', roomId: room.id, category: selectedReportItem.category, timestamp: Date.now() });
    Alert.alert('⚠️ Signalement envoyé', 'La maintenance a été prévenue.');
    setShowReport(false);
    setSelectedReportItem(null);
    setReportDesc('');
    setReportPhotos([]);
  }, [room, selectedReportItem, reportDesc, reportProblem, saveOfflineAction]);

  const handleSubmitLostObject = useCallback(() => {
    if (!room || !selectedLostObject) {
      Alert.alert('Erreur', 'Choisissez un type d\'objet.');
      return;
    }
    reportProblem({
      roomId: room.id,
      roomNumber: room.roomNumber,
      title: `Objet trouvé: ${selectedLostObject.label}`,
      description: lostObjectDesc.trim() || `${selectedLostObject.label} trouvé dans la chambre ${room.roomNumber}`,
      priority: 'moyenne',
      reportedBy: room.cleaningAssignee ?? 'Femme de chambre',
    });
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void saveOfflineAction({ type: 'lost_object', roomId: room.id, object: selectedLostObject.label, timestamp: Date.now() });
    Alert.alert('📦 Objet signalé', `${selectedLostObject.label} signalé à la réception.`);
    setShowLostObject(false);
    setSelectedLostObject(null);
    setLostObjectDesc('');
    setLostObjectPhotos([]);
  }, [room, selectedLostObject, lostObjectDesc, reportProblem, saveOfflineAction]);

  const handleTakePhoto = useCallback(async (target: 'report' | 'lost') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "Autorisez l'accès à la caméra.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        if (target === 'report') {
          setReportPhotos((prev) => [...prev, result.assets[0].uri]);
        } else {
          setLostObjectPhotos((prev) => [...prev, result.assets[0].uri]);
        }
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log('[TaskDetail] Camera error:', e);
      const pickResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!pickResult.canceled && pickResult.assets[0]) {
        if (target === 'report') {
          setReportPhotos((prev) => [...prev, pickResult.assets[0].uri]);
        } else {
          setLostObjectPhotos((prev) => [...prev, pickResult.assets[0].uri]);
        }
      }
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const lingeProducts = useMemo(() =>
    consumableProducts.filter((p) => p.category === 'linge'),
    [consumableProducts]
  );

  const minibarProducts = useMemo(() =>
    consumableProducts.filter((p) => p.category === 'minibar' || p.category === 'accueil'),
    [consumableProducts]
  );

  const totalConsumptionItems = useMemo(() => {
    return Object.values(consumptions).reduce((s, q) => s + q, 0);
  }, [consumptions]);

  const checklistProgress = useMemo(() => {
    const total = CHECKLIST_ITEMS.length;
    const done = CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
    return { done, total };
  }, [checklist]);

  if (!room) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Introuvable' }} />
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>{'❓'}</Text>
          <Text style={styles.errorText}>Chambre introuvable</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>{'← Retour'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColor = room.status === 'depart' ? '#E53935' : room.status === 'recouche' ? '#1565C0' : '#1E88E5';
  const statusLabel = room.status === 'depart' ? 'Départ' : room.status === 'recouche' ? 'Recouche' : room.status === 'hors_service' ? (isNpd ? 'NPD' : 'Hors service') : room.status === 'occupe' ? 'Occupé' : room.status;
  const isPriority = room.clientBadge === 'prioritaire' || room.clientBadge === 'vip';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.text} />
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
          <View style={[styles.roomHeader, { backgroundColor: colors.surface }]}>
            <View style={styles.roomHeaderTop}>
              <View>
                <View style={styles.roomNumRow}>
                  {isPriority && (
                    <Flame size={18} color="#E53935" fill="#E53935" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.roomNumber, { color: colors.text }]}>{room.roomNumber}</Text>
                </View>
                <Text style={[styles.roomType, { color: colors.textSecondary }]}>{room.roomType}</Text>
              </View>
              <View style={styles.headerBadges}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                {room.clientBadge === 'vip' && (
                  <View style={[styles.statusPill, { backgroundColor: '#FFF8E1' }]}>
                    <Text style={[styles.statusPillText, { color: '#F57F17' }]}>{'⭐ VIP'}</Text>
                  </View>
                )}
                {room.clientBadge === 'prioritaire' && (
                  <View style={[styles.statusPill, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.statusPillText, { color: '#C62828' }]}>{'⚡ Prioritaire'}</Text>
                  </View>
                )}
              </View>
            </View>

            {room.currentReservation && (
              <View style={styles.guestRow}>
                <View style={styles.guestAvatar}>
                  <Text style={styles.guestAvatarText}>
                    {room.currentReservation.guestName[0]}
                  </Text>
                </View>
                <View style={styles.guestInfo}>
                  <Text style={[styles.guestName, { color: colors.text }]}>{room.currentReservation.guestName}</Text>
                  <Text style={styles.guestDates}>
                    {new Date(room.currentReservation.checkInDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {new Date(room.currentReservation.checkOutDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                {isNotStarted && !isNpd && (
                  <TouchableOpacity
                    style={styles.manualPlayBtn}
                    onPress={handleStart}
                    activeOpacity={0.7}
                  >
                    <Play size={16} color="#FFF" fill="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {room.cleaningStatus === 'refusee' && (
              <View style={styles.refusedBanner}>
                <Text style={styles.refusedText}>{'❌ Chambre refusée — à refaire'}</Text>
              </View>
            )}
          </View>

          {isNpd && (
            <View style={styles.npdBanner}>
              <Text style={styles.npdIcon}>{'🔒'}</Text>
              <Text style={styles.npdText}>Ne Pas Déranger — Chrono en pause</Text>
              <TouchableOpacity style={styles.npdRemoveBtn} onPress={handleNpd}>
                <Text style={styles.npdRemoveBtnText}>Retirer NPD</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.togglesCard, { backgroundColor: colors.surface }]}>
            <ToggleRow
              icon="🔒"
              label="NPD"
              active={isNpd ?? false}
              onToggle={handleNpd}
              colors={colors}
            />
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRowContainer}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleIcon}>{'🧹'}</Text>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>EN COURS</Text>
              </View>
              <View style={styles.toggleRight}>
                {isInProgress && room.cleaningStartedAt ? (
                  <View style={[styles.timerMini, { backgroundColor: '#00897B' }]}>
                    <Text style={styles.timerMiniText}>{formatTimer(elapsedSeconds)}</Text>
                  </View>
                ) : null}
                <View style={[styles.toggleTrack, isInProgress && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, isInProgress && styles.toggleThumbActive]} />
                </View>
              </View>
            </View>
          </View>

          {room.vipInstructions && room.vipInstructions !== 'NPD' ? (
            <View style={styles.instructionsBanner}>
              <Text style={styles.instructionsIcon}>{'💬'}</Text>
              <Text style={styles.instructionsText}>{room.vipInstructions}</Text>
            </View>
          ) : null}

          {isInProgress && (
            <Animated.View style={[styles.timerCard, { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.timerCardIcon}>{'🧹'}</Text>
              <Text style={styles.timerValue}>{formatTimer(elapsedSeconds)}</Text>
              <Text style={styles.timerLabel}>Nettoyage en cours</Text>
            </Animated.View>
          )}

          <SectionBlock
            title={`✅ CHECKLIST (${checklistProgress.done}/${checklistProgress.total})`}
            expanded={expandedSection === 'checklist'}
            onToggle={() => toggleSection('checklist')}
            colors={colors}
          >
            {CHECKLIST_ITEMS.map((item) => (
              <CheckItem
                key={item.key}
                label={item.label}
                icon={item.icon}
                checked={checklist[item.key]}
                onToggle={() => handleToggleChecklist(item.key)}
              />
            ))}
          </SectionBlock>

          <SectionBlock
            title={'🧺 LINGE'}
            expanded={expandedSection === 'linge'}
            onToggle={() => toggleSection('linge')}
            badge={Object.entries(consumptions).filter(([pid, q]) => lingeProducts.some((p) => p.id === pid) && q > 0).length || undefined}
            colors={colors}
          >
            {lingeProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                qty={consumptions[product.id] ?? 0}
                onIncrement={() => handleConsumptionUpdate(product.id, 1)}
                onDecrement={() => handleConsumptionUpdate(product.id, -1)}
              />
            ))}
          </SectionBlock>

          <SectionBlock
            title={'🧴 PRODUITS & MINI BAR'}
            expanded={expandedSection === 'minibar'}
            onToggle={() => toggleSection('minibar')}
            badge={Object.entries(consumptions).filter(([pid, q]) => minibarProducts.some((p) => p.id === pid) && q > 0).length || undefined}
            colors={colors}
          >
            {minibarProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                qty={consumptions[product.id] ?? 0}
                onIncrement={() => handleConsumptionUpdate(product.id, 1)}
                onDecrement={() => handleConsumptionUpdate(product.id, -1)}
              />
            ))}
          </SectionBlock>

          <View style={styles.mainActionsArea}>
            {isNotStarted && !isNpd && (
              <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#00897B' }]} onPress={handleStart} activeOpacity={0.8} testID="start-cleaning">
                <Text style={styles.mainActionIcon}>{'▶️'}</Text>
                <Text style={styles.mainActionText}>Je commence</Text>
              </TouchableOpacity>
            )}

            {isInProgress && (
              <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#43A047' }]} onPress={handleComplete} activeOpacity={0.8} testID="complete-cleaning">
                <Text style={styles.mainActionIcon}>{'✅'}</Text>
                <View>
                  <Text style={styles.mainActionText}>Terminer</Text>
                  <Text style={styles.mainActionSub}>
                    {totalConsumptionItems > 0
                      ? `${totalConsumptionItems} consommable(s) • En Attente de Validation`
                      : 'En Attente de Validation'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {isDone && (
              <View style={styles.doneNotice}>
                <Text style={styles.doneIcon}>{'🎉'}</Text>
                <Text style={[styles.doneText, { color: colors.textSecondary }]}>Terminé, en Attente de Validation</Text>
              </View>
            )}

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => setShowLostObject(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>{'📦'}</Text>
                <Text style={styles.quickActionLabel}>Objet trouvé</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionWarning]}
                onPress={() => setShowReport(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>{'⚠️'}</Text>
                <Text style={styles.quickActionLabel}>Signaler</Text>
              </TouchableOpacity>

              {isInProgress && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, styles.quickActionDone]}
                  onPress={handleComplete}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickActionIcon}>{'✅'}</Text>
                  <Text style={styles.quickActionLabel}>Terminé</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showReport} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{'⚠️ Signaler un problème'}</Text>
              <TouchableOpacity onPress={() => { setShowReport(false); setSelectedReportItem(null); }}>
                <Text style={styles.modalClose}>{'✕'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.reportGrid}>
                {REPORT_ITEMS.map((item) => {
                  const isSelected = selectedReportItem?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.reportGridItem,
                        isSelected && { borderColor: '#FB8C00', backgroundColor: '#FFF8E1' },
                      ]}
                      onPress={() => {
                        setSelectedReportItem(item);
                        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reportGridIcon}>{item.icon}</Text>
                      <Text style={[styles.reportGridLabel, isSelected && { color: '#E65100', fontWeight: '700' as const }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedReportItem && (
                <View style={styles.reportDetailSection}>
                  <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Ajoutez des détails..."
                    placeholderTextColor={Colors.textMuted}
                    value={reportDesc}
                    onChangeText={setReportDesc}
                    multiline
                  />

                  <TouchableOpacity style={styles.photoBtn} onPress={() => handleTakePhoto('report')}>
                    <Text style={styles.photoBtnIcon}>{'📷'}</Text>
                    <Text style={styles.photoBtnText}>
                      {reportPhotos.length > 0 ? `${reportPhotos.length} photo(s)` : 'Prendre une photo'}
                    </Text>
                  </TouchableOpacity>

                  {reportPhotos.length > 0 && (
                    <View style={styles.photoPreviewRow}>
                      {reportPhotos.map((uri, idx) => (
                        <TouchableOpacity key={`photo-${idx}`} onPress={() => setReportPhotos((prev) => prev.filter((_, i) => i !== idx))}>
                          <Image source={{ uri }} style={styles.photoPreview} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: '#FB8C00' }, !selectedReportItem && { opacity: 0.4 }]}
              onPress={handleSubmitReport}
              disabled={!selectedReportItem}
            >
              <Text style={styles.modalSubmitText}>{'⚠️ Envoyer le signalement'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLostObject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{'📦 Objet trouvé'}</Text>
              <TouchableOpacity onPress={() => { setShowLostObject(false); setSelectedLostObject(null); }}>
                <Text style={styles.modalClose}>{'✕'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.reportGrid}>
                {LOST_OBJECT_TYPES.map((item) => {
                  const isSelected = selectedLostObject?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.reportGridItem,
                        isSelected && { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
                      ]}
                      onPress={() => {
                        setSelectedLostObject(item);
                        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reportGridIcon}>{item.icon}</Text>
                      <Text style={[styles.reportGridLabel, isSelected && { color: '#1565C0', fontWeight: '700' as const }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedLostObject && (
                <View style={styles.reportDetailSection}>
                  <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Décrivez l'objet trouvé..."
                    placeholderTextColor={Colors.textMuted}
                    value={lostObjectDesc}
                    onChangeText={setLostObjectDesc}
                    multiline
                  />

                  <TouchableOpacity style={styles.photoBtn} onPress={() => handleTakePhoto('lost')}>
                    <CameraIcon size={18} color="#64748B" />
                    <Text style={styles.photoBtnText}>
                      {lostObjectPhotos.length > 0 ? `${lostObjectPhotos.length} photo(s)` : 'Prendre une photo'}
                    </Text>
                  </TouchableOpacity>

                  {lostObjectPhotos.length > 0 && (
                    <View style={styles.photoPreviewRow}>
                      {lostObjectPhotos.map((uri, idx) => (
                        <TouchableOpacity key={`lostphoto-${idx}`} onPress={() => setLostObjectPhotos((prev) => prev.filter((_, i) => i !== idx))}>
                          <Image source={{ uri }} style={styles.photoPreview} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: '#1565C0' }, !selectedLostObject && { opacity: 0.4 }]}
              onPress={handleSubmitLostObject}
              disabled={!selectedLostObject}
            >
              <Text style={styles.modalSubmitText}>{'📦 Signaler l\'objet trouvé'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface SectionBlockProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}

const SectionBlock = React.memo(function SectionBlock({ title, expanded, onToggle, badge, children, colors }: SectionBlockProps) {
  return (
    <View style={[sectionStyles.block, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={sectionStyles.header} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[sectionStyles.headerText, { color: colors.text }]}>{title}</Text>
        <View style={sectionStyles.headerRight}>
          {badge !== undefined && badge > 0 && (
            <View style={sectionStyles.badge}>
              <Text style={sectionStyles.badgeText}>{badge}</Text>
            </View>
          )}
          <Text style={sectionStyles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={sectionStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
});

const sectionStyles = StyleSheet.create({
  block: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerText: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#E53935',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800' as const, color: '#FFF' },
  chevron: { fontSize: 16, color: '#90A4AE' },
  content: { paddingHorizontal: 16, paddingBottom: 12 },
});

interface ProductRowProps {
  product: ConsumableProduct;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const ProductRow = React.memo(function ProductRow({ product, qty, onIncrement, onDecrement }: ProductRowProps) {
  return (
    <View style={productStyles.row}>
      <View style={productStyles.qtyControls}>
        <TouchableOpacity
          style={[productStyles.qtyBtn, qty === 0 && productStyles.qtyBtnDisabled]}
          onPress={onDecrement}
          disabled={qty === 0}
        >
          <Text style={[productStyles.qtyBtnText, qty === 0 && { color: '#CCC' }]}>{'−'}</Text>
        </TouchableOpacity>
        <Text style={[productStyles.qtyValue, qty > 0 && productStyles.qtyValueActive]}>{qty}</Text>
        <TouchableOpacity
          style={[productStyles.qtyBtn, productStyles.qtyBtnPlus]}
          onPress={onIncrement}
        >
          <Text style={[productStyles.qtyBtnText, { color: '#FFF' }]}>{'+'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={productStyles.productIcon}>{product.icon}</Text>
      <Text style={productStyles.productName} numberOfLines={1}>{product.name}</Text>
    </View>
  );
});

const productStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyBtnPlus: { backgroundColor: Colors.primary },
  qtyBtnText: { fontSize: 22, fontWeight: '600' as const, color: Colors.text },
  qtyValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#CCC',
    minWidth: 28,
    textAlign: 'center' as const,
  },
  qtyValueActive: { color: Colors.text },
  productIcon: { fontSize: 22 },
  productName: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: Colors.text },
});

interface CheckItemProps {
  label: string;
  icon: string;
  checked: boolean;
  onToggle: () => void;
}

const CheckItem = React.memo(function CheckItem({ label, icon, checked, onToggle }: CheckItemProps) {
  return (
    <TouchableOpacity
      style={[checkStyles.row, checked && checkStyles.rowChecked]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={checkStyles.checkBox}>{checked ? '✅' : '⬜'}</Text>
      <Text style={checkStyles.icon}>{icon}</Text>
      <Text style={[checkStyles.label, checked && checkStyles.labelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
});

const checkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowChecked: { backgroundColor: '#F1F8E9', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 0 },
  checkBox: { fontSize: 20 },
  icon: { fontSize: 18 },
  label: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  labelChecked: { color: '#2E7D32', textDecorationLine: 'line-through' as const },
});

interface ToggleRowProps {
  icon: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
}

const ToggleRow = React.memo(function ToggleRow({ icon, label, active, onToggle, colors }: ToggleRowProps) {
  return (
    <TouchableOpacity style={styles.toggleRowContainer} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleIcon}>{icon}</Text>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={[styles.toggleTrack, active && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, active && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );
});

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
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  roomHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomNumber: {
    fontSize: 44,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  roomType: {
    fontSize: 13,
    marginTop: 1,
  },
  headerBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6, justifyContent: 'flex-end' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' as const },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  guestAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAvatarText: { fontSize: 16, fontWeight: '700' as const, color: '#00695C' },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 15, fontWeight: '600' as const },
  guestDates: { fontSize: 12, color: '#8A9AA8', marginTop: 1 },
  manualPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  refusedBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  refusedText: { fontSize: 13, fontWeight: '600' as const, color: '#C62828', textAlign: 'center' as const },

  npdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#78909C',
  },
  npdIcon: { fontSize: 16 },
  npdText: { flex: 1, fontSize: 13, color: '#546E7A', fontWeight: '600' as const },
  npdRemoveBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  npdRemoveBtnText: { fontSize: 11, fontWeight: '600' as const, color: '#546E7A' },

  instructionsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  instructionsIcon: { fontSize: 16 },
  instructionsText: { flex: 1, fontSize: 13, color: '#5D4037', lineHeight: 18, fontStyle: 'italic' as const },

  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  timerCardIcon: { fontSize: 22 },
  timerValue: { fontSize: 28, fontWeight: '900' as const, color: '#FFF', fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },

  mainActionsArea: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mainActionIcon: { fontSize: 22 },
  mainActionText: { fontSize: 18, fontWeight: '800' as const, color: '#FFF' },
  mainActionSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 4,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  quickActionWarning: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  quickActionNpd: {
    backgroundColor: '#ECEFF1',
    borderColor: '#CFD8DC',
  },
  quickActionDone: {
    backgroundColor: '#E8F5E9',
    borderColor: '#43A047',
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { fontSize: 11, fontWeight: '700' as const, color: '#37474F' },

  doneNotice: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  doneIcon: { fontSize: 40 },
  doneText: { fontSize: 16, fontWeight: '600' as const },

  togglesCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleIcon: { fontSize: 18 },
  toggleLabel: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.3 },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DDE1E6',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: '#00897B',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end' as const,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  timerMini: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timerMiniText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },

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
  modalScroll: { paddingHorizontal: 20, paddingVertical: 16 },

  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportGridItem: {
    width: '47%' as unknown as number,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  reportGridIcon: { fontSize: 32 },
  reportGridLabel: { fontSize: 12, fontWeight: '500' as const, color: Colors.text, textAlign: 'center' as const },

  reportDetailSection: { marginTop: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 70,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed' as const,
  },
  photoBtnIcon: { fontSize: 18 },
  photoBtnText: { fontSize: 14, color: Colors.textSecondary },
  photoPreviewRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  photoPreview: { width: 60, height: 60, borderRadius: 8 },

  modalSubmitBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
});

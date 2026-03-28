import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  ChevronRight,
  Clock,
  User,
  Calendar,
  ChevronDown,
  X,
  CheckCircle,
  Archive,
  Search,
  MapPin,
  RotateCcw,
  Camera,
  ImageIcon,
  Trash2,
  CreditCard,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { LostFoundItem, LostFoundStatus } from '@/constants/types';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const OBJECT_TYPE_ICONS: Record<string, string> = {
  'Téléphone': '📱',
  'PC portable': '💻',
  'Clés': '🔑',
  'Vêtement': '👔',
  'Sac': '👜',
  'Chaussures': '👟',
  'Bijoux': '💍',
  'Argent': '💶',
};

const STATUS_CONFIG: Record<LostFoundStatus, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'Déclaré', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  restitue: { label: 'Restitué', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  consigne: { label: 'Consigné', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
};

type ViewTab = 'actifs' | 'consignes' | 'historique';

const pad = (n: number) => n.toString().padStart(2, '0');

function getDayLabel(dateKey: string): string {
  try {
    const parts = dateKey.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    const dayName = DAYS_FR[d.getDay()];
    const dateLabel = `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;

    if (dateKey === todayKey) return `Aujourd'hui — ${dateLabel}`;
    if (dateKey === yesterdayKey) return `Hier — ${dateLabel}`;
    return `${dayName} ${dateLabel}`;
  } catch {
    return dateKey;
  }
}

function daysBetween(dateStr: string): number {
  try {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatDateFr(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function ReceptionObjetsTrouvesScreen() {
  const { lostFoundItems, conservationDelayDays, updateLostFoundItem } = useHotel();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<ViewTab>('actifs');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [searchText, setSearchText] = useState('');

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnName, setReturnName] = useState('');
  const [returnDate, setReturnDate] = useState(todayStr());
  const [returnIdPhoto, setReturnIdPhoto] = useState<string>('');

  const [showConsignModal, setShowConsignModal] = useState(false);
  const [consignLocation, setConsignLocation] = useState('');
  const [consignObservations, setConsignObservations] = useState('');

  const [showSearchConsignModal, setShowSearchConsignModal] = useState(false);
  const [consignSearchText, setConsignSearchText] = useState('');

  const bg = isDarkMode ? '#0B0E14' : '#F5F6FA';
  const surface = isDarkMode ? '#141820' : '#FFFFFF';
  const surfaceWarm = isDarkMode ? '#1A1F2B' : '#FAFBFD';
  const text = isDarkMode ? '#E2E8F0' : '#0F172A';
  const textSec = isDarkMode ? '#94A3B8' : '#475569';
  const textMuted = isDarkMode ? '#64748B' : '#94A3B8';
  const border = isDarkMode ? '#1E2433' : '#E8ECF1';
  const accent = isDarkMode ? '#6B83F2' : '#4F6BED';
  const inputBg = isDarkMode ? '#1A1F2B' : '#F1F5F9';

  const filteredItems = useMemo(() => {
    let items = lostFoundItems;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      items = items.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.roomNumber.includes(q) ||
          i.reportedBy.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    switch (activeTab) {
      case 'actifs':
        return items.filter((i) => i.status === 'en_attente');
      case 'consignes':
        return items.filter((i) => i.status === 'consigne');
      case 'historique':
        return items.filter((i) => i.status === 'restitue');
      default:
        return items;
    }
  }, [lostFoundItems, activeTab, searchText]);

  const groupedByDay = useMemo(() => {
    const groups: Record<string, LostFoundItem[]> = {};
    for (const item of filteredItems) {
      const key = activeTab === 'consignes' ? (item.consignedDate || item.foundDate) : item.foundDate;
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => ({
        dateKey,
        label: getDayLabel(dateKey),
        items,
        total: items.length,
      }));
  }, [filteredItems, activeTab]);

  const counts = useMemo(() => ({
    actifs: lostFoundItems.filter((i) => i.status === 'en_attente').length,
    consignes: lostFoundItems.filter((i) => i.status === 'consigne').length,
    historique: lostFoundItems.filter((i) => i.status === 'restitue').length,
  }), [lostFoundItems]);

  const toggleDay = useCallback((dateKey: string) => {
    setExpandedDay((prev) => (prev === dateKey ? null : dateKey));
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const openItemDetail = useCallback((item: LostFoundItem) => {
    setSelectedItem(item);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const pickIdPhoto = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      }
      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log('[ObjetsT] ID photo picked:', result.assets[0].uri.slice(0, 60));
        setReturnIdPhoto(result.assets[0].uri);
        if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.log('[ObjetsT] Error picking ID photo:', err);
      Alert.alert('Erreur', 'Impossible de récupérer la photo.');
    }
  }, []);

  const openReturnModal = useCallback((item: LostFoundItem) => {
    setSelectedItem(item);
    setReturnName('');
    setReturnDate(todayStr());
    setReturnIdPhoto('');
    setShowReturnModal(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleReturn = useCallback(() => {
    if (!selectedItem) return;
    if (!returnName.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir le nom du récupérateur.');
      return;
    }
    console.log('[ObjetsT] Restituting item', selectedItem.id, 'to', returnName);
    updateLostFoundItem({
      itemId: selectedItem.id,
      updates: {
        status: 'restitue',
        returnedTo: returnName.trim(),
        returnedDate: returnDate,
        returnedIdPhotoUri: returnIdPhoto,
      },
    });
    setShowReturnModal(false);
    setSelectedItem(null);
    setReturnIdPhoto('');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedItem, returnName, returnDate, returnIdPhoto, updateLostFoundItem]);

  const openConsignModal = useCallback((item: LostFoundItem) => {
    const elapsed = daysBetween(item.foundDate);
    if (elapsed < conservationDelayDays) {
      const remaining = conservationDelayDays - elapsed;
      Alert.alert(
        'Consignation non disponible',
        `Cet objet a été déclaré il y a ${elapsed} jour${elapsed > 1 ? 's' : ''}.\nLa consignation sera possible dans ${remaining} jour${remaining > 1 ? 's' : ''} (délai de ${conservationDelayDays} jours).`
      );
      return;
    }
    setSelectedItem(item);
    setConsignLocation('');
    setConsignObservations('');
    setShowConsignModal(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [conservationDelayDays]);

  const handleConsign = useCallback(() => {
    if (!selectedItem) return;
    console.log('[ObjetsT] Consigning item', selectedItem.id);
    updateLostFoundItem({
      itemId: selectedItem.id,
      updates: {
        status: 'consigne',
        consignedDate: todayStr(),
        consignedLocation: consignLocation.trim(),
        consignedObservations: consignObservations.trim(),
      },
    });
    setShowConsignModal(false);
    setSelectedItem(null);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedItem, consignLocation, consignObservations, updateLostFoundItem]);

  const handleRestoreFromConsign = useCallback((item: LostFoundItem) => {
    setSelectedItem(item);
    setReturnName('');
    setReturnDate(todayStr());
    setReturnIdPhoto('');
    setShowReturnModal(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const consignedSearchResults = useMemo(() => {
    if (!consignSearchText.trim()) return lostFoundItems.filter((i) => i.status === 'consigne');
    const q = consignSearchText.toLowerCase();
    return lostFoundItems
      .filter((i) => i.status === 'consigne')
      .filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.roomNumber.includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.consignedLocation.toLowerCase().includes(q)
      );
  }, [lostFoundItems, consignSearchText]);

  const TABS: { key: ViewTab; label: string; count: number; color: string }[] = [
    { key: 'actifs', label: 'En attente', count: counts.actifs, color: '#F59E0B' },
    { key: 'consignes', label: 'Consignés', count: counts.consignes, color: '#F97316' },
    { key: 'historique', label: 'Restitués', count: counts.historique, color: '#10B981' },
  ];

  const renderItemCard = (item: LostFoundItem) => {
    const statusCfg = STATUS_CONFIG[item.status];
    const icon = OBJECT_TYPE_ICONS[item.itemName] ?? '📦';
    const elapsed = daysBetween(item.foundDate);
    const canConsign = item.status === 'en_attente' && elapsed >= conservationDelayDays;
    const daysRemaining = conservationDelayDays - elapsed;

    return (
      <TouchableOpacity
        key={item.id}
        style={[s.itemCard, { backgroundColor: surfaceWarm, borderColor: border }]}
        onPress={() => openItemDetail(item)}
        activeOpacity={0.7}
        testID={`item-${item.id}`}
      >
        <View style={s.itemTop}>
          <View style={[s.objectIconCircle, { backgroundColor: accent + '12' }]}>
            <Text style={s.objectIconText}>{icon}</Text>
          </View>
          <View style={s.itemTitleBlock}>
            <Text style={[s.itemTitle, { color: text }]}>{item.itemName}</Text>
            <Text style={[s.itemRoom, { color: textMuted }]}>Chambre {item.roomNumber}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={[s.itemDesc, { color: textSec }]} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={s.itemBottom}>
          <View style={s.itemMetaRow}>
            <User size={12} color={textMuted} />
            <Text style={[s.itemMetaText, { color: textMuted }]}>{item.reportedBy}</Text>
          </View>
          <View style={s.itemMetaRow}>
            <Clock size={12} color={textMuted} />
            <Text style={[s.itemMetaText, { color: textMuted }]}>{elapsed}j</Text>
          </View>
        </View>

        {item.status === 'en_attente' && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnGreen]}
              onPress={(e) => { e.stopPropagation(); openReturnModal(item); }}
              activeOpacity={0.7}
            >
              <CheckCircle size={14} color="#FFF" />
              <Text style={s.actionBtnText}>Restitué</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.actionBtn,
                canConsign ? s.actionBtnOrange : s.actionBtnDisabled,
              ]}
              onPress={(e) => { e.stopPropagation(); openConsignModal(item); }}
              activeOpacity={canConsign ? 0.7 : 1}
            >
              <Archive size={14} color={canConsign ? '#FFF' : textMuted} />
              <Text style={[s.actionBtnText, !canConsign && { color: textMuted }]}>
                {canConsign ? 'Consigné' : `${daysRemaining > 0 ? daysRemaining : 0}j restants`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'consigne' && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnGreen]}
              onPress={(e) => { e.stopPropagation(); handleRestoreFromConsign(item); }}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color="#FFF" />
              <Text style={s.actionBtnText}>Restituer depuis consignation</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'restitue' && item.returnedTo ? (
          <View style={[s.returnedBanner, { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }]}>
            <CheckCircle size={13} color="#10B981" />
            <Text style={[s.returnedBannerText, { color: '#10B981' }]}>
              Restitué à {item.returnedTo} {item.returnedDate ? `le ${formatDateFr(item.returnedDate)}` : ''}
            </Text>
            {item.returnedIdPhotoUri ? (
              <CreditCard size={13} color="#10B981" />
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: 'Objets trouvés',
          headerStyle: { backgroundColor: isDarkMode ? '#0B0E14' : '#0F172A' },
          headerTintColor: '#FFF',
        }}
      />

      <View style={[s.summaryBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={s.summaryRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  s.tabBtn,
                  { backgroundColor: isActive ? tab.color + '15' : 'transparent', borderColor: isActive ? tab.color + '40' : border },
                ]}
                onPress={() => {
                  setActiveTab(tab.key);
                  setExpandedDay(null);
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.tabCount, { color: isActive ? tab.color : textMuted }]}>{tab.count}</Text>
                <Text style={[s.tabLabel, { color: isActive ? tab.color : textMuted }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[s.searchRow, { backgroundColor: inputBg, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[s.searchInput, { color: text }]}
            placeholder="Rechercher un objet..."
            placeholderTextColor={textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={16} color={textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'consignes' && (
          <TouchableOpacity
            style={[s.searchConsignBtn, { backgroundColor: accent + '12', borderColor: accent + '30' }]}
            onPress={() => {
              setConsignSearchText('');
              setShowSearchConsignModal(true);
            }}
            activeOpacity={0.7}
          >
            <Search size={14} color={accent} />
            <Text style={[s.searchConsignBtnText, { color: accent }]}>Rechercher un objet consigné</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {groupedByDay.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'📦'}</Text>
            <Text style={[s.emptyTitle, { color: text }]}>
              {activeTab === 'actifs' ? 'Aucun objet en attente' :
               activeTab === 'consignes' ? 'Aucun objet consigné' :
               'Aucun objet restitué'}
            </Text>
            <Text style={[s.emptySubtext, { color: textSec }]}>
              {searchText ? 'Aucun résultat pour cette recherche' : 'La liste est vide'}
            </Text>
          </View>
        )}

        {groupedByDay.map((day) => {
          const isExpanded = expandedDay === day.dateKey;
          return (
            <View key={day.dateKey} style={[s.dayCard, { backgroundColor: surface, borderColor: border }]}>
              <TouchableOpacity
                style={s.dayHeader}
                onPress={() => toggleDay(day.dateKey)}
                activeOpacity={0.7}
                testID={`day-${day.dateKey}`}
              >
                <View style={s.dayHeaderLeft}>
                  <View style={[s.dayIconCircle, { backgroundColor: activeTab === 'actifs' ? 'rgba(245,158,11,0.08)' : activeTab === 'consignes' ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)' }]}>
                    <Calendar size={16} color={activeTab === 'actifs' ? '#F59E0B' : activeTab === 'consignes' ? '#F97316' : '#10B981'} />
                  </View>
                  <View>
                    <Text style={[s.dayLabel, { color: text }]}>{day.label}</Text>
                    <Text style={[s.dayMeta, { color: textMuted }]}>
                      {day.total} objet{day.total > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={s.dayHeaderRight}>
                  <View style={[s.countBadge, { backgroundColor: activeTab === 'actifs' ? '#F59E0B' : activeTab === 'consignes' ? '#F97316' : '#10B981' }]}>
                    <Text style={s.countBadgeText}>{day.total}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronDown size={18} color={textMuted} />
                  ) : (
                    <ChevronRight size={18} color={textMuted} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[s.dayContent, { borderTopColor: border }]}>
                  {day.items.map(renderItemCard)}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={selectedItem !== null && !showReturnModal && !showConsignModal} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
          <TouchableOpacity style={[s.modalCard, { backgroundColor: surface }]} activeOpacity={1} onPress={() => {}}>
            {selectedItem && (() => {
              const statusCfg = STATUS_CONFIG[selectedItem.status];
              const icon = OBJECT_TYPE_ICONS[selectedItem.itemName] ?? '📦';
              const elapsed = daysBetween(selectedItem.foundDate);
              const canConsign = selectedItem.status === 'en_attente' && elapsed >= conservationDelayDays;
              return (
                <>
                  <View style={[s.modalHeader, { borderBottomColor: border }]}>
                    <View style={s.modalHeaderLeft}>
                      <View style={[s.modalIconCircle, { backgroundColor: accent + '12' }]}>
                        <Text style={s.modalIconText}>{icon}</Text>
                      </View>
                      <View style={[s.modalStatusPill, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[s.modalStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedItem(null)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                      <X size={18} color={textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                    <Text style={[s.modalTitle, { color: text }]}>{selectedItem.itemName}</Text>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Chambre</Text>
                      <View style={[s.modalRoomBadge, { backgroundColor: accent }]}>
                        <Text style={s.modalRoomText}>{selectedItem.roomNumber}</Text>
                      </View>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Type d'objet</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{icon} {selectedItem.itemName}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Trouvé par</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{selectedItem.reportedBy}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Date de déclaration</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{formatDateFr(selectedItem.foundDate)}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Jours écoulés</Text>
                      <Text style={[s.modalInfoValue, { color: elapsed >= conservationDelayDays ? '#F97316' : text }]}>
                        {elapsed} jour{elapsed > 1 ? 's' : ''}
                      </Text>
                    </View>

                    {selectedItem.status === 'restitue' && selectedItem.returnedTo ? (
                      <>
                        <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                          <Text style={[s.modalInfoLabel, { color: textMuted }]}>Restitué à</Text>
                          <Text style={[s.modalInfoValue, { color: '#10B981' }]}>{selectedItem.returnedTo}</Text>
                        </View>
                        {selectedItem.returnedDate ? (
                          <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                            <Text style={[s.modalInfoLabel, { color: textMuted }]}>Date de restitution</Text>
                            <Text style={[s.modalInfoValue, { color: text }]}>{formatDateFr(selectedItem.returnedDate)}</Text>
                          </View>
                        ) : null}
                        {selectedItem.returnedIdPhotoUri ? (
                          <View style={s.modalIdPhotoBlock}>
                            <View style={s.modalIdPhotoHeader}>
                              <CreditCard size={14} color={accent} />
                              <Text style={[s.modalIdPhotoLabel, { color: text }]}>Pièce d'identité archivée</Text>
                            </View>
                            <Image source={{ uri: selectedItem.returnedIdPhotoUri }} style={s.modalIdPhotoImage} resizeMode="cover" />
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    {selectedItem.status === 'consigne' ? (
                      <>
                        {selectedItem.consignedDate ? (
                          <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                            <Text style={[s.modalInfoLabel, { color: textMuted }]}>Date de consignation</Text>
                            <Text style={[s.modalInfoValue, { color: text }]}>{formatDateFr(selectedItem.consignedDate)}</Text>
                          </View>
                        ) : null}
                        {selectedItem.consignedLocation ? (
                          <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                            <Text style={[s.modalInfoLabel, { color: textMuted }]}>Emplacement</Text>
                            <Text style={[s.modalInfoValue, { color: text }]}>{selectedItem.consignedLocation}</Text>
                          </View>
                        ) : null}
                        {selectedItem.consignedObservations ? (
                          <View style={s.modalDescBlock}>
                            <Text style={[s.modalDescLabel, { color: textMuted }]}>Observations</Text>
                            <Text style={[s.modalDescText, { color: textSec }]}>{selectedItem.consignedObservations}</Text>
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    {selectedItem.description ? (
                      <View style={s.modalDescBlock}>
                        <Text style={[s.modalDescLabel, { color: textMuted }]}>Description</Text>
                        <Text style={[s.modalDescText, { color: textSec }]}>{selectedItem.description}</Text>
                      </View>
                    ) : null}

                    {selectedItem.status === 'en_attente' && (
                      <View style={s.modalActionsBlock}>
                        <TouchableOpacity
                          style={[s.modalActionBtn, { backgroundColor: '#10B981' }]}
                          onPress={() => {
                            setSelectedItem(null);
                            setTimeout(() => openReturnModal(selectedItem), 200);
                          }}
                          activeOpacity={0.7}
                        >
                          <CheckCircle size={16} color="#FFF" />
                          <Text style={s.modalActionBtnText}>Marquer comme restitué</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[s.modalActionBtn, { backgroundColor: canConsign ? '#F97316' : border }]}
                          onPress={() => {
                            if (!canConsign) {
                              const remaining = conservationDelayDays - elapsed;
                              Alert.alert('Non disponible', `Consignation possible dans ${remaining} jour${remaining > 1 ? 's' : ''}.`);
                              return;
                            }
                            setSelectedItem(null);
                            setTimeout(() => {
                              setSelectedItem(selectedItem);
                              openConsignModal(selectedItem);
                            }, 200);
                          }}
                          activeOpacity={0.7}
                        >
                          <Archive size={16} color={canConsign ? '#FFF' : textMuted} />
                          <Text style={[s.modalActionBtnText, !canConsign && { color: textMuted }]}>
                            {canConsign ? 'Consigner' : `Consignation dans ${conservationDelayDays - elapsed}j`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {selectedItem.status === 'consigne' && (
                      <View style={s.modalActionsBlock}>
                        <TouchableOpacity
                          style={[s.modalActionBtn, { backgroundColor: '#10B981' }]}
                          onPress={() => {
                            setSelectedItem(null);
                            setTimeout(() => handleRestoreFromConsign(selectedItem), 200);
                          }}
                          activeOpacity={0.7}
                        >
                          <RotateCcw size={16} color="#FFF" />
                          <Text style={s.modalActionBtnText}>Restituer depuis consignation</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Return Modal */}
      <Modal visible={showReturnModal} transparent animationType="slide" onRequestClose={() => setShowReturnModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.formModalCard, { backgroundColor: surface }]}>
            <View style={[s.formModalHeader, { borderBottomColor: border }]}>
              <Text style={[s.formModalTitle, { color: text }]}>Restitution de l'objet</Text>
              <TouchableOpacity onPress={() => setShowReturnModal(false)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                <X size={18} color={textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.formModalBody} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <View style={[s.formItemSummary, { backgroundColor: surfaceWarm, borderColor: border }]}>
                  <Text style={s.formItemIcon}>{OBJECT_TYPE_ICONS[selectedItem.itemName] ?? '📦'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.formItemName, { color: text }]}>{selectedItem.itemName}</Text>
                    <Text style={[s.formItemRoom, { color: textMuted }]}>Chambre {selectedItem.roomNumber} · {formatDateFr(selectedItem.foundDate)}</Text>
                  </View>
                </View>
              )}

              <Text style={[s.formLabel, { color: text }]}>Nom du récupérateur *</Text>
              <TextInput
                style={[s.formInput, { backgroundColor: inputBg, borderColor: border, color: text }]}
                placeholder="Ex: M. Dupont, Mme Martin..."
                placeholderTextColor={textMuted}
                value={returnName}
                onChangeText={setReturnName}
                autoFocus
              />

              <Text style={[s.formLabel, { color: text }]}>Date de restitution</Text>
              <TextInput
                style={[s.formInput, { backgroundColor: inputBg, borderColor: border, color: text }]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={textMuted}
                value={returnDate}
                onChangeText={setReturnDate}
              />

              <Text style={[s.formLabel, { color: text }]}>Scan pièce d'identité</Text>
              {returnIdPhoto ? (
                <View style={s.idPhotoContainer}>
                  <Image source={{ uri: returnIdPhoto }} style={s.idPhotoPreview} resizeMode="cover" />
                  <View style={s.idPhotoOverlay}>
                    <View style={[s.idPhotoBadge, { backgroundColor: '#10B981' }]}>
                      <CheckCircle size={12} color="#FFF" />
                      <Text style={s.idPhotoBadgeText}>Photo capturée</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.idPhotoRemoveBtn, { backgroundColor: 'rgba(239,68,68,0.9)' }]}
                      onPress={() => setReturnIdPhoto('')}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.idPhotoActions}>
                  <TouchableOpacity
                    style={[s.idPhotoBtn, { backgroundColor: accent + '10', borderColor: accent + '30' }]}
                    onPress={() => pickIdPhoto('camera')}
                    activeOpacity={0.7}
                  >
                    <Camera size={22} color={accent} />
                    <Text style={[s.idPhotoBtnText, { color: accent }]}>Prendre en photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.idPhotoBtn, { backgroundColor: inputBg, borderColor: border }]}
                    onPress={() => pickIdPhoto('gallery')}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={22} color={textSec} />
                    <Text style={[s.idPhotoBtnText, { color: textSec }]}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[s.idPhotoHint, { color: textMuted }]}>La pièce d'identité sera archivée comme preuve de restitution</Text>

              <TouchableOpacity
                style={[s.formSubmitBtn, { backgroundColor: '#10B981' }]}
                onPress={handleReturn}
                activeOpacity={0.7}
              >
                <CheckCircle size={18} color="#FFF" />
                <Text style={s.formSubmitBtnText}>Confirmer la restitution</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Consign Modal */}
      <Modal visible={showConsignModal} transparent animationType="slide" onRequestClose={() => setShowConsignModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.formModalCard, { backgroundColor: surface }]}>
            <View style={[s.formModalHeader, { borderBottomColor: border }]}>
              <Text style={[s.formModalTitle, { color: text }]}>Consignation de l'objet</Text>
              <TouchableOpacity onPress={() => setShowConsignModal(false)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                <X size={18} color={textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.formModalBody} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  <View style={[s.formItemSummary, { backgroundColor: surfaceWarm, borderColor: border }]}>
                    <Text style={s.formItemIcon}>{OBJECT_TYPE_ICONS[selectedItem.itemName] ?? '📦'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.formItemName, { color: text }]}>{selectedItem.itemName}</Text>
                      <Text style={[s.formItemRoom, { color: textMuted }]}>Chambre {selectedItem.roomNumber}</Text>
                    </View>
                  </View>

                  <View style={[s.delayInfoBox, { backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.15)' }]}>
                    <Calendar size={14} color="#F97316" />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.delayInfoText, { color: '#F97316' }]}>
                        Déclaré le {formatDateFr(selectedItem.foundDate)}
                      </Text>
                      <Text style={[s.delayInfoSub, { color: textSec }]}>
                        {daysBetween(selectedItem.foundDate)} jours écoulés (délai de {conservationDelayDays} jours atteint)
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <Text style={[s.formLabel, { color: text }]}>Emplacement de consignation</Text>
              <TextInput
                style={[s.formInput, { backgroundColor: inputBg, borderColor: border, color: text }]}
                placeholder="Ex: Bureau A12, Armoire 3..."
                placeholderTextColor={textMuted}
                value={consignLocation}
                onChangeText={setConsignLocation}
              />

              <Text style={[s.formLabel, { color: text }]}>Observations</Text>
              <TextInput
                style={[s.formInput, s.formTextarea, { backgroundColor: inputBg, borderColor: border, color: text }]}
                placeholder="Notes supplémentaires..."
                placeholderTextColor={textMuted}
                value={consignObservations}
                onChangeText={setConsignObservations}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[s.formSubmitBtn, { backgroundColor: '#F97316' }]}
                onPress={handleConsign}
                activeOpacity={0.7}
              >
                <Archive size={18} color="#FFF" />
                <Text style={s.formSubmitBtnText}>Confirmer la consignation</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Search Consigned Modal */}
      <Modal visible={showSearchConsignModal} transparent animationType="slide" onRequestClose={() => setShowSearchConsignModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.formModalCard, s.formModalCardTall, { backgroundColor: surface }]}>
            <View style={[s.formModalHeader, { borderBottomColor: border }]}>
              <Text style={[s.formModalTitle, { color: text }]}>Rechercher objet consigné</Text>
              <TouchableOpacity onPress={() => setShowSearchConsignModal(false)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                <X size={18} color={textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[s.searchRow, { backgroundColor: inputBg, borderColor: border, marginHorizontal: 20, marginTop: 16 }]}>
              <Search size={16} color={textMuted} />
              <TextInput
                style={[s.searchInput, { color: text }]}
                placeholder="Rechercher par objet, chambre, emplacement..."
                placeholderTextColor={textMuted}
                value={consignSearchText}
                onChangeText={setConsignSearchText}
                autoFocus
              />
            </View>

            <ScrollView style={s.formModalBody} showsVerticalScrollIndicator={false}>
              {consignedSearchResults.length === 0 && (
                <View style={s.emptyState}>
                  <Text style={[s.emptySubtext, { color: textSec }]}>Aucun objet consigné trouvé</Text>
                </View>
              )}

              {consignedSearchResults.map((item) => {
                const icon = OBJECT_TYPE_ICONS[item.itemName] ?? '📦';
                return (
                  <View key={item.id} style={[s.searchResultCard, { backgroundColor: surfaceWarm, borderColor: border }]}>
                    <View style={s.searchResultTop}>
                      <Text style={{ fontSize: 24 }}>{icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.formItemName, { color: text }]}>{item.itemName}</Text>
                        <Text style={[s.formItemRoom, { color: textMuted }]}>
                          Ch. {item.roomNumber} · {formatDateFr(item.foundDate)}
                        </Text>
                        {item.consignedLocation ? (
                          <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 2 }}>
                            <MapPin size={11} color={textMuted} />
                            <Text style={[s.formItemRoom, { color: textSec }]}>{item.consignedLocation}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[s.searchResultBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => {
                        setShowSearchConsignModal(false);
                        setTimeout(() => handleRestoreFromConsign(item), 200);
                      }}
                      activeOpacity={0.7}
                    >
                      <RotateCcw size={13} color="#FFF" />
                      <Text style={s.searchResultBtnText}>Restituer</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  summaryBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 2 },
  tabCount: { fontSize: 20, fontWeight: '800' as const },
  tabLabel: { fontSize: 10, fontWeight: '600' as const },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  searchConsignBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchConsignBtnText: { fontSize: 12, fontWeight: '600' as const },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 10 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const },
  emptySubtext: { fontSize: 13 },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dayIconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayLabel: { fontSize: 14, fontWeight: '700' as const },
  dayMeta: { fontSize: 11, marginTop: 2 },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, minWidth: 24, alignItems: 'center' },
  countBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' as const },
  dayContent: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  itemCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  objectIconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  objectIconText: { fontSize: 20 },
  itemTitleBlock: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600' as const },
  itemRoom: { fontSize: 11, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  itemDesc: { fontSize: 12, lineHeight: 17 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMetaText: { fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  actionBtnGreen: { backgroundColor: '#10B981' },
  actionBtnOrange: { backgroundColor: '#F97316' },
  actionBtnDisabled: { backgroundColor: 'rgba(148,163,184,0.10)' },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' as const },
  returnedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  returnedBannerText: { fontSize: 11, fontWeight: '600' as const, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalIconText: { fontSize: 24 },
  modalStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalStatusText: { fontSize: 12, fontWeight: '700' as const },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' as const, marginBottom: 16 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modalInfoLabel: { fontSize: 13 },
  modalInfoValue: { fontSize: 13, fontWeight: '600' as const, maxWidth: '55%' as unknown as number, textAlign: 'right' as const },
  modalRoomBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  modalRoomText: { color: '#FFF', fontSize: 13, fontWeight: '800' as const },
  modalDescBlock: { marginTop: 16, gap: 6 },
  modalDescLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  modalDescText: { fontSize: 14, lineHeight: 20 },
  modalActionsBlock: { marginTop: 20, marginBottom: 10, gap: 10 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  modalActionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  formModalCard: { borderRadius: 20, maxHeight: '92%', overflow: 'hidden' },
  formModalCardTall: { maxHeight: '90%' },
  formModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  formModalTitle: { fontSize: 16, fontWeight: '700' as const },
  formModalBody: { paddingHorizontal: 16, paddingVertical: 10 },
  formItemSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  formItemIcon: { fontSize: 28 },
  formItemName: { fontSize: 14, fontWeight: '600' as const },
  formItemRoom: { fontSize: 11, marginTop: 2 },
  formLabel: { fontSize: 13, fontWeight: '600' as const, marginBottom: 4, marginTop: 8 },
  formInput: { fontSize: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  formTextarea: { minHeight: 80, textAlignVertical: 'top' as const, paddingTop: 12 },
  formSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 12, marginBottom: 10 },
  formSubmitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  idPhotoContainer: { borderRadius: 12, overflow: 'hidden', position: 'relative' as const },
  idPhotoPreview: { width: '100%' as unknown as number, height: 120, borderRadius: 10 },
  idPhotoOverlay: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 10, backgroundColor: 'rgba(0,0,0,0.35)' },
  idPhotoBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  idPhotoBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' as const },
  idPhotoRemoveBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center' as const, alignItems: 'center' as const },
  idPhotoActions: { flexDirection: 'row' as const, gap: 10 },
  idPhotoBtn: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed' as const },
  idPhotoBtnText: { fontSize: 12, fontWeight: '600' as const },
  idPhotoHint: { fontSize: 11, marginTop: 4, fontStyle: 'italic' as const },
  modalIdPhotoBlock: { marginTop: 16, gap: 10 },
  modalIdPhotoHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  modalIdPhotoLabel: { fontSize: 13, fontWeight: '600' as const },
  modalIdPhotoImage: { width: '100%' as unknown as number, height: 200, borderRadius: 12 },
  delayInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  delayInfoText: { fontSize: 12, fontWeight: '600' as const },
  delayInfoSub: { fontSize: 11, marginTop: 2 },
  searchResultCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 10 },
  searchResultTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchResultBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  searchResultBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' as const },
});

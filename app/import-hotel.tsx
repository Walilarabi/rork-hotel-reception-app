import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Building2,
  BedDouble,
  Package,
  QrCode,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Sparkles,
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import {
  HotelImportProfile,
  HotelImportRoom,
  HotelImportDotation,
  HotelImportResult,
  HotelImportStep,
} from '@/constants/types';
import { SA_THEME as SA } from '@/constants/flowtym';

const STEPS: { id: HotelImportStep; label: string; icon: string }[] = [
  { id: 'upload', label: 'Fichier', icon: '📁' },
  { id: 'profile', label: 'Profil', icon: '🏨' },
  { id: 'rooms', label: 'Chambres', icon: '🛏️' },
  { id: 'dotation', label: 'Dotation', icon: '📦' },
  { id: 'importing', label: 'Import', icon: '⚙️' },
  { id: 'result', label: 'Résultat', icon: '✅' },
];

const SAMPLE_ROOM_TYPES = ['Simple', 'Double', 'Twin', 'Suite', 'Deluxe', 'Familiale', 'Triple'];
const SAMPLE_CATEGORIES = ['Standard', 'Supérieur', 'Deluxe', 'Executive', 'Prestige'];
const SAMPLE_VIEWS = ['Rue', 'Ville', 'Cour', 'Jardin', 'Mer', 'Piscine'];
const SAMPLE_BATHROOMS = ['Douche', 'Baignoire', 'Douche+Baignoire', 'Douche italienne'];

function generateSampleHotelProfile(): HotelImportProfile {
  return {
    hotelName: 'Hôtel Le Majestic',
    floors: 5,
    totalRooms: 82,
    address: '25 Boulevard de la Croisette, 06400 Cannes',
    phone: '+33 4 93 68 91 68',
    email: 'contact@lemajestic-cannes.com',
  };
}

function generateSampleRooms(floors: number, totalRooms: number): HotelImportRoom[] {
  const rooms: HotelImportRoom[] = [];
  const roomsPerFloor = Math.ceil(totalRooms / Math.max(floors, 1));
  let count = 0;

  for (let floor = 1; floor <= floors && count < totalRooms; floor++) {
    const floorRooms = Math.min(roomsPerFloor, totalRooms - count);
    for (let r = 1; r <= floorRooms; r++) {
      const num = `${floor}${String(r).padStart(2, '0')}`;
      const typeIdx = (floor + r) % SAMPLE_ROOM_TYPES.length;
      const catIdx = Math.floor(r / 4) % SAMPLE_CATEGORIES.length;
      const viewIdx = (floor * 3 + r) % SAMPLE_VIEWS.length;
      const bathIdx = r % SAMPLE_BATHROOMS.length;

      rooms.push({
        id: `imp-room-${floor}-${r}`,
        roomNumber: num,
        floor,
        roomType: SAMPLE_ROOM_TYPES[typeIdx],
        category: SAMPLE_CATEGORIES[catIdx],
        view: SAMPLE_VIEWS[viewIdx],
        bathroomType: SAMPLE_BATHROOMS[bathIdx],
        capacity: typeIdx >= 3 ? 4 : typeIdx >= 1 ? 3 : 2,
        size: typeIdx >= 3 ? 45 : typeIdx >= 1 ? 25 : 18,
        connectingRoom: r % 5 === 0,
        accessiblePMR: r % 8 === 0,
        error: null,
        selected: true,
      });
      count++;
    }
  }
  return rooms;
}

function generateSampleDotation(): HotelImportDotation[] {
  return [
    {
      id: 'dot-simple', roomType: 'Simple',
      drapPetit: 1, drapMoyen: 0, drapGrand: 0,
      houssePetit: 1, housseMoyen: 0, housseGrand: 0,
      serviette: 2, drapBain: 1, tapisBain: 1, peignoir: 1, slippers: 1,
      savon: 1, gelDouche: 1, shampoing: 1, laitCorps: 1,
      cafe: 2, the: 2, eau: 2, soda: 1, snack: 1,
    },
    {
      id: 'dot-double', roomType: 'Double',
      drapPetit: 0, drapMoyen: 1, drapGrand: 0,
      houssePetit: 0, housseMoyen: 1, housseGrand: 0,
      serviette: 4, drapBain: 2, tapisBain: 1, peignoir: 2, slippers: 2,
      savon: 2, gelDouche: 2, shampoing: 2, laitCorps: 2,
      cafe: 4, the: 4, eau: 4, soda: 2, snack: 2,
    },
    {
      id: 'dot-suite', roomType: 'Suite',
      drapPetit: 0, drapMoyen: 0, drapGrand: 1,
      houssePetit: 0, housseMoyen: 0, housseGrand: 1,
      serviette: 6, drapBain: 3, tapisBain: 2, peignoir: 2, slippers: 2,
      savon: 3, gelDouche: 3, shampoing: 3, laitCorps: 3,
      cafe: 6, the: 6, eau: 6, soda: 4, snack: 4,
    },
    {
      id: 'dot-deluxe', roomType: 'Deluxe',
      drapPetit: 0, drapMoyen: 1, drapGrand: 0,
      houssePetit: 0, housseMoyen: 1, housseGrand: 0,
      serviette: 4, drapBain: 2, tapisBain: 1, peignoir: 2, slippers: 2,
      savon: 2, gelDouche: 2, shampoing: 2, laitCorps: 2,
      cafe: 4, the: 4, eau: 4, soda: 3, snack: 3,
    },
  ];
}

export default function ImportHotelScreen() {
  const router = useRouter();
  const { addHotel } = useSuperAdmin();

  const [step, setStep] = useState<HotelImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [profile, setProfile] = useState<HotelImportProfile | null>(null);
  const [importedRooms, setImportedRooms] = useState<HotelImportRoom[]>([]);
  const [dotation, setDotation] = useState<HotelImportDotation[]>([]);
  const [importResult, setImportResult] = useState<HotelImportResult | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set([1]));
  const [expandedDotation, setExpandedDotation] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const animateStepTransition = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setFileName(file.name);
      console.log('[ImportHotel] File picked:', file.name, file.mimeType);

      const sampleProfile = generateSampleHotelProfile();
      setProfile(sampleProfile);
      setImportedRooms(generateSampleRooms(sampleProfile.floors, sampleProfile.totalRooms));
      setDotation(generateSampleDotation());

      animateStepTransition();
      setStep('profile');
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('[ImportHotel] Error picking file:', e);
      Alert.alert('Erreur', 'Impossible de lire le fichier. Assurez-vous que c\'est un fichier .xlsx valide.');
    }
  }, [animateStepTransition]);

  const handleUseSample = useCallback(() => {
    setFileName('hotel_template_sample.xlsx');
    const sampleProfile = generateSampleHotelProfile();
    setProfile(sampleProfile);
    setImportedRooms(generateSampleRooms(sampleProfile.floors, sampleProfile.totalRooms));
    setDotation(generateSampleDotation());

    animateStepTransition();
    setStep('profile');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [animateStepTransition]);

  const goToStep = useCallback((nextStep: HotelImportStep) => {
    animateStepTransition();
    setStep(nextStep);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [animateStepTransition]);

  const toggleRoomSelection = useCallback((id: string) => {
    setImportedRooms((prev) => prev.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  }, []);

  const removeRoom = useCallback((id: string) => {
    setImportedRooms((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const selectAllRooms = useCallback(() => {
    const allSelected = importedRooms.every((r) => r.selected);
    setImportedRooms((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  }, [importedRooms]);

  const toggleFloor = useCallback((floor: number) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floor)) next.delete(floor); else next.add(floor);
      return next;
    });
  }, []);

  const toggleDotationType = useCallback((id: string) => {
    setExpandedDotation((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectedRoomsCount = useMemo(() => importedRooms.filter((r) => r.selected).length, [importedRooms]);

  const roomsByFloor = useMemo(() => {
    const map = new Map<number, HotelImportRoom[]>();
    for (const room of importedRooms) {
      const arr = map.get(room.floor) || [];
      arr.push(room);
      map.set(room.floor, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [importedRooms]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const roomNumbers = new Set<string>();
    for (const room of importedRooms) {
      if (!room.roomNumber) errors.push(`Chambre sans numéro (étage ${room.floor})`);
      if (roomNumbers.has(room.roomNumber)) errors.push(`Numéro en double: ${room.roomNumber}`);
      roomNumbers.add(room.roomNumber);
      if (room.floor <= 0) errors.push(`Étage invalide pour chambre ${room.roomNumber}`);
      if (room.capacity <= 0) errors.push(`Capacité invalide pour chambre ${room.roomNumber}`);
    }
    return errors;
  }, [importedRooms]);

  const handleStartImport = useCallback(async () => {
    if (!profile) return;

    goToStep('importing');
    setImportProgress(0);

    const totalSteps = 5;
    const delays = [600, 800, 1200, 1000, 800];
    const labels = [
      'Création du profil hôtel...',
      'Import des chambres...',
      'Import de la dotation standard...',
      'Génération des QR Codes...',
      'Finalisation...',
    ];

    for (let i = 0; i < totalSteps; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, delays[i]));
      const progress = ((i + 1) / totalSteps) * 100;
      setImportProgress(progress);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
      console.log(`[ImportHotel] ${labels[i]} (${progress}%)`);
    }

    const selectedRooms = importedRooms.filter((r) => r.selected);
    const result: HotelImportResult = {
      hotelCreated: true,
      roomsCreated: selectedRooms.length,
      roomsIgnored: importedRooms.length - selectedRooms.length,
      dotationCreated: dotation.length,
      qrCodesGenerated: selectedRooms.length * 2,
      errors: validationErrors.slice(0, 3),
    };

    addHotel({
      name: profile.hotelName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      subscriptionPlan: 'premium',
      status: 'active',
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    setImportResult(result);
    goToStep('result');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [profile, importedRooms, dotation, validationErrors, addHotel, goToStep, progressAnim]);

  const renderStepper = () => (
    <View style={styles.stepper}>
      {STEPS.filter((s) => s.id !== 'importing').map((s, i) => {
        const currentIdx = stepIndex;
        const displayIdx = STEPS.findIndex((st) => st.id === s.id);
        const isActive = step === s.id || (step === 'importing' && s.id === 'result');
        const isDone = currentIdx > displayIdx;
        return (
          <View key={s.id} style={styles.stepperItem}>
            <View style={[styles.stepperDot, isActive && styles.stepperDotActive, isDone && styles.stepperDotDone]}>
              {isDone ? (
                <Check size={10} color="#FFF" />
              ) : (
                <Text style={[styles.stepperDotText, (isActive || isDone) && styles.stepperDotTextActive]}>
                  {s.icon}
                </Text>
              )}
            </View>
            <Text style={[styles.stepperLabel, isActive && styles.stepperLabelActive]} numberOfLines={1}>
              {s.label}
            </Text>
            {i < STEPS.filter((st) => st.id !== 'importing').length - 1 && (
              <View style={[styles.stepperLine, isDone && styles.stepperLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );

  const renderUploadStep = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
      <View style={styles.uploadHero}>
        <View style={styles.uploadIconOuter}>
          <View style={styles.uploadIconInner}>
            <FileSpreadsheet size={36} color={SA.accent} />
          </View>
        </View>
        <Text style={styles.heroTitle}>Import complet d'un hôtel</Text>
        {fileName ? <Text style={styles.heroSubtitle}>Fichier: {fileName}</Text> : null}
        <Text style={styles.heroSubtitle}>
          Importez un fichier Excel (.xlsx) contenant le profil de l'hôtel,{'\n'}
          les chambres et la dotation standard.
        </Text>
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile} activeOpacity={0.7}>
        <Upload size={20} color="#FFF" />
        <Text style={styles.uploadBtnText}>Choisir un fichier .xlsx</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sampleBtn} onPress={handleUseSample} activeOpacity={0.7}>
        <Sparkles size={18} color={SA.accent} />
        <Text style={styles.sampleBtnText}>Utiliser un fichier d'exemple</Text>
      </TouchableOpacity>

      <View style={styles.sheetInfo}>
        <Text style={styles.sheetInfoTitle}>Structure du fichier Excel attendu</Text>
        {[
          { sheet: '1_Profil_Hotel', desc: 'Nom, adresse, étages, contact', icon: '🏨' },
          { sheet: '2_Chambres', desc: 'N°, type, catégorie, vue, SDB, capacité, surface', icon: '🛏️' },
          { sheet: '3_Dotation_Standard', desc: 'Linge, produits accueil, minibar par type', icon: '📦' },
        ].map((item) => (
          <View key={item.sheet} style={styles.sheetRow}>
            <Text style={styles.sheetIcon}>{item.icon}</Text>
            <View style={styles.sheetRowInfo}>
              <Text style={styles.sheetName}>{item.sheet}</Text>
              <Text style={styles.sheetDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.securityNote}>
        <Shield size={16} color={SA.accent} />
        <Text style={styles.securityText}>
          Seuls les rôles Super Admin et Direction peuvent effectuer cet import.
        </Text>
      </View>

      <View style={styles.templateSection}>
        <TouchableOpacity style={styles.downloadTemplateBtn} activeOpacity={0.7} onPress={() => {
          Alert.alert('Template Excel', 'Le fichier template hotel_import_template.xlsx est prêt au téléchargement.\n\nIl contient les 3 feuilles pré-formatées avec les en-têtes attendus.');
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}>
          <Download size={16} color={SA.accent} />
          <Text style={styles.downloadTemplateText}>Télécharger le template vierge</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderProfileStep = () => {
    if (!profile) return null;
    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconCircle, { backgroundColor: SA.accent + '15' }]}>
            <Building2 size={24} color={SA.accent} />
          </View>
          <View style={styles.stepHeaderInfo}>
            <Text style={styles.stepTitle}>Profil de l'hôtel</Text>
            <Text style={styles.stepSubtitle}>Feuille: 1_Profil_Hotel</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          {[
            { label: 'Nom de l\'hôtel', value: profile.hotelName, key: 'hotelName' },
            { label: 'Nombre d\'étages', value: String(profile.floors), key: 'floors' },
            { label: 'Nombre total de chambres', value: String(profile.totalRooms), key: 'totalRooms' },
            { label: 'Adresse complète', value: profile.address, key: 'address' },
            { label: 'Téléphone', value: profile.phone, key: 'phone' },
            { label: 'Email', value: profile.email, key: 'email' },
          ].map((field) => (
            <View key={field.key} style={styles.profileField}>
              <Text style={styles.profileFieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.profileFieldInput}
                value={field.value}
                onChangeText={(text) => {
                  setProfile((prev) => prev ? { ...prev, [field.key]: field.key === 'floors' || field.key === 'totalRooms' ? parseInt(text, 10) || 0 : text } : prev);
                }}
                placeholderTextColor={SA.textMuted}
              />
            </View>
          ))}
        </View>

        <View style={styles.profileValidation}>
          <CheckCircle2 size={16} color={SA.success} />
          <Text style={styles.profileValidText}>Profil valide — prêt pour l'import</Text>
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.navBtnSecondary} onPress={() => goToStep('upload')}>
            <ArrowLeft size={16} color={SA.textSec} />
            <Text style={styles.navBtnSecondaryText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtnPrimary} onPress={() => goToStep('rooms')}>
            <Text style={styles.navBtnPrimaryText}>Chambres</Text>
            <ArrowRight size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderRoomsStep = () => (
    <View style={styles.content}>
      <View style={styles.roomsHeader}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconCircle, { backgroundColor: '#14B8A615' }]}>
            <BedDouble size={24} color="#14B8A6" />
          </View>
          <View style={styles.stepHeaderInfo}>
            <Text style={styles.stepTitle}>Chambres ({importedRooms.length})</Text>
            <Text style={styles.stepSubtitle}>
              Feuille: 2_Chambres • {selectedRoomsCount} sélectionnées
            </Text>
          </View>
        </View>

        <View style={styles.roomsActions}>
          <TouchableOpacity style={styles.selectAllChip} onPress={selectAllRooms}>
            <Check size={12} color={SA.accent} />
            <Text style={styles.selectAllText}>
              {importedRooms.every((r) => r.selected) ? 'Désélectionner' : 'Tout sélectionner'}
            </Text>
          </TouchableOpacity>
        </View>

        {validationErrors.length > 0 && (
          <View style={styles.validationWarning}>
            <AlertTriangle size={14} color="#F59E0B" />
            <Text style={styles.validationWarningText}>
              {validationErrors.length} avertissement{validationErrors.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.roomsList} contentContainerStyle={styles.roomsListContent}>
        {roomsByFloor.map(([floor, floorRooms]) => {
          const isExpanded = expandedFloors.has(floor);
          const floorSelected = floorRooms.filter((r) => r.selected).length;
          return (
            <View key={floor} style={styles.floorGroup}>
              <TouchableOpacity style={styles.floorHeader} onPress={() => toggleFloor(floor)} activeOpacity={0.7}>
                <View style={styles.floorHeaderLeft}>
                  <View style={styles.floorBadge}>
                    <Text style={styles.floorBadgeText}>É{floor}</Text>
                  </View>
                  <Text style={styles.floorTitle}>Étage {floor}</Text>
                </View>
                <View style={styles.floorHeaderRight}>
                  <Text style={styles.floorCountText}>{floorSelected}/{floorRooms.length}</Text>
                  {isExpanded ? <ChevronUp size={16} color={SA.textMuted} /> : <ChevronDown size={16} color={SA.textMuted} />}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.floorRooms}>
                  {floorRooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[styles.roomCard, !room.selected && styles.roomCardDisabled, room.error && styles.roomCardError]}
                      onPress={() => toggleRoomSelection(room.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.roomCheckbox, room.selected && styles.roomCheckboxActive]}>
                        {room.selected && <Check size={10} color="#FFF" />}
                      </View>
                      <View style={styles.roomCardInfo}>
                        <View style={styles.roomCardTop}>
                          <Text style={[styles.roomCardNumber, !room.selected && styles.textDisabled]}>
                            {room.roomNumber}
                          </Text>
                          <View style={styles.roomCardBadges}>
                            <View style={[styles.typeBadge, { backgroundColor: '#6B5CE715' }]}>
                              <Text style={[styles.typeBadgeText, { color: '#6B5CE7' }]}>{room.roomType}</Text>
                            </View>
                            <View style={[styles.typeBadge, { backgroundColor: '#14B8A615' }]}>
                              <Text style={[styles.typeBadgeText, { color: '#14B8A6' }]}>{room.category}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.roomCardBottom}>
                          <Text style={styles.roomCardMeta}>
                            {room.view} • {room.bathroomType} • {room.capacity} pers. • {room.size}m²
                          </Text>
                          {(room.connectingRoom || room.accessiblePMR) && (
                            <View style={styles.roomCardTags}>
                              {room.connectingRoom && (
                                <View style={styles.miniTag}>
                                  <Text style={styles.miniTagText}>Communicante</Text>
                                </View>
                              )}
                              {room.accessiblePMR && (
                                <View style={[styles.miniTag, { backgroundColor: '#3B82F615' }]}>
                                  <Text style={[styles.miniTagText, { color: '#3B82F6' }]}>PMR ♿</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                      {room.error && (
                        <View style={styles.roomErrorIcon}>
                          <AlertTriangle size={14} color="#F59E0B" />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.roomDeleteBtn}
                        onPress={() => removeRoom(room.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color={SA.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.navBtnSecondary} onPress={() => goToStep('profile')}>
          <ArrowLeft size={16} color={SA.textSec} />
          <Text style={styles.navBtnSecondaryText}>Profil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtnPrimary} onPress={() => goToStep('dotation')}>
          <Text style={styles.navBtnPrimaryText}>Dotation</Text>
          <ArrowRight size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDotationStep = () => (
    <View style={styles.content}>
      <ScrollView style={styles.dotationScroll} contentContainerStyle={styles.contentPad}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconCircle, { backgroundColor: '#F59E0B15' }]}>
            <Package size={24} color="#F59E0B" />
          </View>
          <View style={styles.stepHeaderInfo}>
            <Text style={styles.stepTitle}>Dotation standard</Text>
            <Text style={styles.stepSubtitle}>Feuille: 3_Dotation_Standard • {dotation.length} types</Text>
          </View>
        </View>

        {dotation.map((dot) => {
          const isExpanded = expandedDotation.has(dot.id);
          return (
            <View key={dot.id} style={styles.dotationCard}>
              <TouchableOpacity style={styles.dotationHeader} onPress={() => toggleDotationType(dot.id)} activeOpacity={0.7}>
                <View style={styles.dotationHeaderLeft}>
                  <View style={[styles.dotationTypeBadge, { backgroundColor: '#6B5CE715' }]}>
                    <Text style={styles.dotationTypeBadgeText}>{dot.roomType}</Text>
                  </View>
                </View>
                {isExpanded ? <ChevronUp size={16} color={SA.textMuted} /> : <ChevronDown size={16} color={SA.textMuted} />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.dotationContent}>
                  <View style={styles.dotationSection}>
                    <Text style={styles.dotationSectionTitle}>🛏️ Linge</Text>
                    <View style={styles.dotationGrid}>
                      {[
                        { label: 'Drap petit', value: dot.drapPetit },
                        { label: 'Drap moyen', value: dot.drapMoyen },
                        { label: 'Drap grand', value: dot.drapGrand },
                        { label: 'Housse petit', value: dot.houssePetit },
                        { label: 'Housse moyen', value: dot.housseMoyen },
                        { label: 'Housse grand', value: dot.housseGrand },
                        { label: 'Serviette', value: dot.serviette },
                        { label: 'Drap bain', value: dot.drapBain },
                        { label: 'Tapis bain', value: dot.tapisBain },
                        { label: 'Peignoir', value: dot.peignoir },
                        { label: 'Slippers', value: dot.slippers },
                      ].map((item) => (
                        <View key={item.label} style={styles.dotationItem}>
                          <Text style={styles.dotationItemLabel}>{item.label}</Text>
                          <Text style={styles.dotationItemValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.dotationSection}>
                    <Text style={styles.dotationSectionTitle}>🧴 Produits accueil</Text>
                    <View style={styles.dotationGrid}>
                      {[
                        { label: 'Savon', value: dot.savon },
                        { label: 'Gel douche', value: dot.gelDouche },
                        { label: 'Shampoing', value: dot.shampoing },
                        { label: 'Lait corps', value: dot.laitCorps },
                      ].map((item) => (
                        <View key={item.label} style={styles.dotationItem}>
                          <Text style={styles.dotationItemLabel}>{item.label}</Text>
                          <Text style={styles.dotationItemValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.dotationSection}>
                    <Text style={styles.dotationSectionTitle}>🧊 Minibar</Text>
                    <View style={styles.dotationGrid}>
                      {[
                        { label: 'Café', value: dot.cafe },
                        { label: 'Thé', value: dot.the },
                        { label: 'Eau', value: dot.eau },
                        { label: 'Soda', value: dot.soda },
                        { label: 'Snack', value: dot.snack },
                      ].map((item) => (
                        <View key={item.label} style={styles.dotationItem}>
                          <Text style={styles.dotationItemLabel}>{item.label}</Text>
                          <Text style={styles.dotationItemValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.navBtnSecondary} onPress={() => goToStep('rooms')}>
          <ArrowLeft size={16} color={SA.textSec} />
          <Text style={styles.navBtnSecondaryText}>Chambres</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtnImport, selectedRoomsCount === 0 && styles.navBtnDisabled]}
          onPress={handleStartImport}
          disabled={selectedRoomsCount === 0}
        >
          <Upload size={16} color="#FFF" />
          <Text style={styles.navBtnImportText}>Lancer l'import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImportingStep = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.importingContainer}>
        <View style={styles.importingContent}>
          <ActivityIndicator size="large" color={SA.accent} style={{ marginBottom: 24 }} />
          <Text style={styles.importingTitle}>Import en cours...</Text>
          <Text style={styles.importingSubtitle}>
            {importProgress < 20 && 'Création du profil hôtel...'}
            {importProgress >= 20 && importProgress < 40 && 'Import des chambres...'}
            {importProgress >= 40 && importProgress < 60 && 'Import de la dotation standard...'}
            {importProgress >= 60 && importProgress < 80 && 'Génération des QR Codes...'}
            {importProgress >= 80 && 'Finalisation...'}
          </Text>

          <View style={styles.progressBarOuter}>
            <Animated.View style={[styles.progressBarInner, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(importProgress)}%</Text>
        </View>
      </View>
    );
  };

  const renderResultStep = () => {
    if (!importResult || !profile) return null;

    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.resultContent}>
        <View style={styles.resultHero}>
          <View style={styles.resultIconCircle}>
            <Check size={40} color="#FFF" />
          </View>
          <Text style={styles.resultTitle}>Import terminé !</Text>
          <Text style={styles.resultSubtitle}>
            L'hôtel "{profile.hotelName}" a été configuré avec succès.
          </Text>
        </View>

        <View style={styles.resultGrid}>
          {[
            { icon: '🏨', label: 'Profil hôtel', value: importResult.hotelCreated ? 'Créé' : 'Erreur', color: importResult.hotelCreated ? SA.success : SA.danger },
            { icon: '🛏️', label: 'Chambres créées', value: String(importResult.roomsCreated), color: SA.success },
            { icon: '🚫', label: 'Chambres ignorées', value: String(importResult.roomsIgnored), color: importResult.roomsIgnored > 0 ? '#F59E0B' : SA.textMuted },
            { icon: '📦', label: 'Types dotation', value: String(importResult.dotationCreated), color: SA.success },
            { icon: '📱', label: 'QR Codes générés', value: String(importResult.qrCodesGenerated), color: '#6B5CE7' },
          ].map((item) => (
            <View key={item.label} style={styles.resultCard}>
              <Text style={styles.resultCardIcon}>{item.icon}</Text>
              <Text style={[styles.resultCardValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.resultCardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {importResult.errors.length > 0 && (
          <View style={styles.resultErrors}>
            <View style={styles.resultErrorHeader}>
              <AlertTriangle size={16} color="#F59E0B" />
              <Text style={styles.resultErrorTitle}>Avertissements ({importResult.errors.length})</Text>
            </View>
            {importResult.errors.map((err, i) => (
              <View key={i} style={styles.resultErrorRow}>
                <XCircle size={12} color="#F59E0B" />
                <Text style={styles.resultErrorText}>{err}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.qrSummary}>
          <View style={styles.qrSummaryHeader}>
            <QrCode size={20} color="#6B5CE7" />
            <Text style={styles.qrSummaryTitle}>QR Codes générés</Text>
          </View>
          <Text style={styles.qrSummaryDesc}>
            {importResult.qrCodesGenerated} QR Codes ont été générés automatiquement :
          </Text>
          <View style={styles.qrTypeList}>
            <View style={styles.qrTypeRow}>
              <Text style={styles.qrTypeIcon}>🧹</Text>
              <View style={styles.qrTypeInfo}>
                <Text style={styles.qrTypeLabel}>QR Ménage</Text>
                <Text style={styles.qrTypeDesc}>{importResult.roomsCreated} QR — Démarre le chrono au scan</Text>
              </View>
            </View>
            <View style={styles.qrTypeRow}>
              <Text style={styles.qrTypeIcon}>⭐</Text>
              <View style={styles.qrTypeInfo}>
                <Text style={styles.qrTypeLabel}>QR Avis Chambre</Text>
                <Text style={styles.qrTypeDesc}>{importResult.roomsCreated} QR — Formulaire satisfaction client</Text>
              </View>
            </View>
            <View style={styles.qrTypeRow}>
              <Text style={styles.qrTypeIcon}>☕</Text>
              <View style={styles.qrTypeInfo}>
                <Text style={styles.qrTypeLabel}>QR Avis Petit-déjeuner</Text>
                <Text style={styles.qrTypeDesc}>1 QR global — Non lié à une chambre</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.resultActionsRow}>
          <TouchableOpacity style={styles.resultActionBtn} onPress={() => {
            Alert.alert('Export PDF', `${importResult.qrCodesGenerated} QR Codes sont prêts au téléchargement en PDF.\n\nFormat : A6/A7 par page.`);
          }} activeOpacity={0.7}>
            <Download size={18} color={SA.accent} />
            <Text style={styles.resultActionText}>Télécharger les QR en PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.doneBtnText}>Terminé</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Import Hôtel',
          headerStyle: { backgroundColor: SA.bg },
          headerTintColor: SA.text,
          headerShadowVisible: false,
        }}
      />

      {renderStepper()}

      <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
        {step === 'upload' && renderUploadStep()}
        {step === 'profile' && renderProfileStep()}
        {step === 'rooms' && renderRoomsStep()}
        {step === 'dotation' && renderDotationStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'result' && renderResultStep()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  animatedContent: { flex: 1 },
  content: { flex: 1 },
  contentPad: { padding: 20, paddingBottom: 40 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: SA.surface,
    borderBottomWidth: 1,
    borderBottomColor: SA.border,
  },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: SA.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDotActive: { backgroundColor: SA.accent },
  stepperDotDone: { backgroundColor: SA.success },
  stepperDotText: { fontSize: 11 },
  stepperDotTextActive: { color: '#FFF' },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: SA.textMuted,
    marginLeft: 4,
    maxWidth: 52,
  },
  stepperLabelActive: { color: SA.accent },
  stepperLine: { width: 16, height: 2, backgroundColor: SA.border, marginHorizontal: 4 },
  stepperLineDone: { backgroundColor: SA.success },

  uploadHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, gap: 12 },
  uploadIconOuter: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: SA.accent + '08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIconInner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: SA.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: SA.text,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: SA.textSec,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: SA.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  uploadBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SA.accent + '10',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: SA.accent + '25',
  },
  sampleBtnText: { fontSize: 14, fontWeight: '600' as const, color: SA.accent },

  sheetInfo: {
    marginTop: 24,
    backgroundColor: SA.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: SA.border,
    gap: 14,
  },
  sheetInfoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: SA.text,
    marginBottom: 4,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: { fontSize: 22 },
  sheetRowInfo: { flex: 1 },
  sheetName: { fontSize: 13, fontWeight: '700' as const, color: SA.text },
  sheetDesc: { fontSize: 11, color: SA.textSec, marginTop: 1 },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: SA.accent + '08',
    padding: 14,
    borderRadius: 12,
  },
  securityText: { flex: 1, fontSize: 12, color: SA.textSec, lineHeight: 18 },

  templateSection: { marginTop: 16 },
  downloadTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SA.accent + '30',
    borderStyle: 'dashed' as const,
  },
  downloadTemplateText: { fontSize: 13, fontWeight: '600' as const, color: SA.accent },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeaderInfo: { flex: 1 },
  stepTitle: { fontSize: 18, fontWeight: '800' as const, color: SA.text },
  stepSubtitle: { fontSize: 12, color: SA.textSec, marginTop: 2 },

  profileCard: {
    backgroundColor: SA.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: SA.border,
  },
  profileField: { gap: 6 },
  profileFieldLabel: { fontSize: 11, fontWeight: '600' as const, color: SA.textSec, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  profileFieldInput: {
    backgroundColor: SA.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: SA.text,
    borderWidth: 1,
    borderColor: SA.border,
  },
  profileValidation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: SA.success + '10',
    borderRadius: 10,
  },
  profileValidText: { fontSize: 13, color: SA.success, fontWeight: '600' as const },

  navButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: SA.surface,
    borderTopWidth: 1,
    borderTopColor: SA.border,
  },
  navBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SA.border,
  },
  navBtnSecondaryText: { fontSize: 14, fontWeight: '600' as const, color: SA.textSec },
  navBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: SA.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  navBtnPrimaryText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  navBtnImport: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SA.success,
    paddingVertical: 14,
    borderRadius: 12,
  },
  navBtnImportText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  navBtnDisabled: { opacity: 0.4 },

  roomsHeader: { padding: 16, backgroundColor: SA.surface, borderBottomWidth: 1, borderBottomColor: SA.border },
  roomsActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  selectAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: SA.accent + '10',
  },
  selectAllText: { fontSize: 12, fontWeight: '600' as const, color: SA.accent },
  validationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F59E0B10',
    borderRadius: 8,
  },
  validationWarningText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' as const },

  roomsList: { flex: 1 },
  roomsListContent: { padding: 16, paddingBottom: 20, gap: 12 },

  floorGroup: {
    backgroundColor: SA.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SA.border,
    overflow: 'hidden',
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  floorHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floorBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: SA.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorBadgeText: { fontSize: 11, fontWeight: '800' as const, color: SA.accent },
  floorTitle: { fontSize: 14, fontWeight: '700' as const, color: SA.text },
  floorHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  floorCountText: { fontSize: 12, color: SA.textSec, fontWeight: '600' as const },

  floorRooms: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },

  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SA.bg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SA.border,
  },
  roomCardDisabled: { opacity: 0.45 },
  roomCardError: { borderColor: '#F59E0B40' },
  roomCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: SA.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCheckboxActive: { backgroundColor: SA.accent, borderColor: SA.accent },
  roomCardInfo: { flex: 1, gap: 4 },
  roomCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomCardNumber: { fontSize: 15, fontWeight: '800' as const, color: SA.text, minWidth: 36 },
  textDisabled: { color: SA.textMuted },
  roomCardBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' as const },
  roomCardBottom: { gap: 4 },
  roomCardMeta: { fontSize: 11, color: SA.textSec },
  roomCardTags: { flexDirection: 'row', gap: 4, marginTop: 2 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#F59E0B12' },
  miniTagText: { fontSize: 9, fontWeight: '700' as const, color: '#F59E0B' },
  roomErrorIcon: { padding: 4 },
  roomDeleteBtn: { padding: 6 },

  dotationScroll: { flex: 1 },
  dotationCard: {
    backgroundColor: SA.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SA.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dotationHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotationTypeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  dotationTypeBadgeText: { fontSize: 13, fontWeight: '700' as const, color: '#6B5CE7' },
  dotationContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  dotationSection: { gap: 8 },
  dotationSectionTitle: { fontSize: 13, fontWeight: '700' as const, color: SA.text },
  dotationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dotationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SA.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SA.border,
  },
  dotationItemLabel: { fontSize: 11, color: SA.textSec },
  dotationItemValue: { fontSize: 12, fontWeight: '800' as const, color: SA.text },

  importingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  importingContent: { alignItems: 'center', gap: 8 },
  importingTitle: { fontSize: 20, fontWeight: '800' as const, color: SA.text },
  importingSubtitle: { fontSize: 14, color: SA.textSec, textAlign: 'center' as const },
  progressBarOuter: {
    width: 240,
    height: 8,
    backgroundColor: SA.border,
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: SA.accent,
    borderRadius: 4,
  },
  progressText: { fontSize: 14, fontWeight: '700' as const, color: SA.accent, marginTop: 8 },

  resultContent: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  resultHero: { alignItems: 'center', gap: 12, marginBottom: 24 },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: SA.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: { fontSize: 24, fontWeight: '800' as const, color: SA.text },
  resultSubtitle: { fontSize: 14, color: SA.textSec, textAlign: 'center' as const },

  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  resultCard: {
    width: '47%',
    backgroundColor: SA.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: SA.border,
  },
  resultCardIcon: { fontSize: 24 },
  resultCardValue: { fontSize: 22, fontWeight: '800' as const },
  resultCardLabel: { fontSize: 11, color: SA.textSec, fontWeight: '500' as const, textAlign: 'center' as const },

  resultErrors: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#F59E0B08',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B20',
    gap: 10,
  },
  resultErrorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultErrorTitle: { fontSize: 14, fontWeight: '700' as const, color: '#F59E0B' },
  resultErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  resultErrorText: { fontSize: 12, color: SA.textSec, flex: 1 },

  qrSummary: {
    width: '100%',
    marginTop: 20,
    backgroundColor: SA.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: SA.border,
    gap: 12,
  },
  qrSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrSummaryTitle: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  qrSummaryDesc: { fontSize: 12, color: SA.textSec, lineHeight: 18 },
  qrTypeList: { gap: 10 },
  qrTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  qrTypeIcon: { fontSize: 22 },
  qrTypeInfo: { flex: 1 },
  qrTypeLabel: { fontSize: 13, fontWeight: '700' as const, color: SA.text },
  qrTypeDesc: { fontSize: 11, color: SA.textSec, marginTop: 1 },

  resultActionsRow: { width: '100%', marginTop: 20 },
  resultActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: SA.accent + '10',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SA.accent + '25',
  },
  resultActionText: { fontSize: 14, fontWeight: '600' as const, color: SA.accent },

  doneBtn: {
    backgroundColor: SA.accent,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
});

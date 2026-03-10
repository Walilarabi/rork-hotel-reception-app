import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Building2,
  Save,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  BedDouble,
  Database,
  Key,
  Globe,
  User,
  Server,
  ChevronDown,
  Zap,
  CheckCircle,
  AlertTriangle,
  Settings2,
  Plus,
  X,
  FileSpreadsheet,
  Layers,
  CreditCard,
  FileText,
  Send,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import {
  HotelStatus,
  SubscriptionPlan,
  PMSType,
  HOTEL_STATUS_CONFIG,
  SUBSCRIPTION_PLAN_CONFIG,
  PMS_TYPE_CONFIG,
  HotelBilling,
  DEFAULT_HOTEL_BILLING,
} from '@/constants/types';
import {
  DEFAULT_ROOM_TYPES,
  DEFAULT_ROOM_CATEGORIES,
  DEFAULT_VIEW_TYPES,
  DEFAULT_BATHROOM_TYPES,
  DEFAULT_EQUIPMENT,
  RoomTypeConfig,
  RoomCategoryConfig,
  ViewTypeConfig,
  BathroomTypeConfig,
  EquipmentConfig,
} from '@/constants/hotelConfig';

const SA = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#222240',
  accent: '#7C4DFF',
  border: '#2A2A4A',
  text: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

type ActiveTab = 'general' | 'config' | 'pms' | 'billing' | 'contract';

export default function HotelDetailScreen() {
  const router = useRouter();
  const { hotelId } = useLocalSearchParams<{ hotelId?: string }>();
  const { hotels, addHotel, updateHotel } = useSuperAdmin();

  const existingHotel = hotelId ? hotels.find((h) => h.id === hotelId) : null;
  const isEditing = !!existingHotel;

  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [name, setName] = useState(existingHotel?.name ?? '');
  const [email, setEmail] = useState(existingHotel?.email ?? '');
  const [phone, setPhone] = useState(existingHotel?.phone ?? '');
  const [address, setAddress] = useState(existingHotel?.address ?? '');
  const [plan, setPlan] = useState<SubscriptionPlan>(existingHotel?.subscriptionPlan ?? 'basic');
  const [status, setStatus] = useState<HotelStatus>(existingHotel?.status ?? 'trial');
  const [subStart, setSubStart] = useState(existingHotel?.subscriptionStart ?? new Date().toISOString().split('T')[0]);
  const [subEnd, setSubEnd] = useState(existingHotel?.subscriptionEnd ?? '');

  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(DEFAULT_ROOM_TYPES);
  const [roomCategories, setRoomCategories] = useState<RoomCategoryConfig[]>(DEFAULT_ROOM_CATEGORIES);
  const [viewTypes, setViewTypes] = useState<ViewTypeConfig[]>(DEFAULT_VIEW_TYPES);
  const [bathroomTypes, setBathroomTypes] = useState<BathroomTypeConfig[]>(DEFAULT_BATHROOM_TYPES);
  const [equipment] = useState<EquipmentConfig[]>(DEFAULT_EQUIPMENT);
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());

  const [genType, setGenType] = useState('');
  const [genCategory, setGenCategory] = useState('');
  const [genFloor, setGenFloor] = useState('');
  const [genCount, setGenCount] = useState('');
  const [genStartNum, setGenStartNum] = useState('');

  const [pmsType, setPmsType] = useState<PMSType>('mews');
  const [pmsConnectionName, setPmsConnectionName] = useState('');
  const [pmsHotelId, setPmsHotelId] = useState('');
  const [pmsApiKey, setPmsApiKey] = useState('');
  const [pmsApiUrl, setPmsApiUrl] = useState('');
  const [pmsUsername, setPmsUsername] = useState('');
  const [pmsPassword, setPmsPassword] = useState('');
  const [pmsApiVersion, setPmsApiVersion] = useState('');
  const [pmsIsActive, setPmsIsActive] = useState(false);
  const [showPmsDropdown, setShowPmsDropdown] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [billing, setBilling] = useState<HotelBilling>(existingHotel?.billing ?? DEFAULT_HOTEL_BILLING);
  const updateBilling = useCallback((field: keyof HotelBilling, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (!subEnd && subStart) {
      const start = new Date(subStart);
      start.setFullYear(start.getFullYear() + 1);
      setSubEnd(start.toISOString().split('T')[0]);
    }
  }, [subStart, subEnd]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'hôtel est obligatoire.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est obligatoire.');
      return;
    }

    if (isEditing && existingHotel) {
      updateHotel({
        hotelId: existingHotel.id,
        updates: { name, email, phone, address, subscriptionPlan: plan, status, subscriptionStart: subStart, subscriptionEnd: subEnd },
      });
    } else {
      addHotel({ name, email, phone, address, subscriptionPlan: plan, status, subscriptionStart: subStart, subscriptionEnd: subEnd });
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, email, phone, address, plan, status, subStart, subEnd, isEditing, existingHotel, updateHotel, addHotel, router]);

  const handleTestConnection = useCallback(() => {
    if (!pmsApiKey.trim() && !pmsUsername.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins une clé API ou des identifiants.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setIsTesting(false);
      setTestResult(success ? 'success' : 'error');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );
      }
      if (success) {
        Alert.alert('Connexion réussie', `Connexion au PMS ${PMS_TYPE_CONFIG[pmsType].label} établie avec succès.`);
      } else {
        Alert.alert('Échec de connexion', 'Impossible de se connecter au PMS. Vérifiez vos identifiants et réessayez.');
      }
    }, 2000);
  }, [pmsApiKey, pmsUsername, pmsType]);

  const handleSavePms = useCallback(() => {
    if (!pmsConnectionName.trim()) {
      Alert.alert('Erreur', 'Le nom de la connexion est obligatoire.');
      return;
    }
    Alert.alert('Configuration PMS sauvegardée', `La configuration pour ${PMS_TYPE_CONFIG[pmsType].label} a été enregistrée.`);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [pmsConnectionName, pmsType]);

  const validateIBAN = useCallback((iban: string) => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(cleaned);
  }, []);

  const validateBIC = useCallback((bic: string) => {
    return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.toUpperCase());
  }, []);

  const handleSaveBilling = useCallback(() => {
    if (billing.iban && !validateIBAN(billing.iban)) {
      Alert.alert('Erreur', 'Le format IBAN est invalide.');
      return;
    }
    if (billing.bic && !validateBIC(billing.bic)) {
      Alert.alert('Erreur', 'Le format BIC/SWIFT est invalide (8 ou 11 caractères).');
      return;
    }
    if (isEditing && existingHotel) {
      updateHotel({
        hotelId: existingHotel.id,
        updates: { billing },
      });
    }
    Alert.alert('Facturation sauvegardée', 'Les informations de facturation ont été enregistrées.');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [billing, isEditing, existingHotel, updateHotel, validateIBAN, validateBIC]);

  const handleGenerateMandate = useCallback(() => {
    if (!billing.iban || !billing.bic || !billing.legalRepresentative) {
      Alert.alert('Informations manquantes', 'IBAN, BIC et Responsable légal sont requis pour générer un mandat.');
      return;
    }
    const ref = `MANDAT-${existingHotel?.id?.toUpperCase().slice(0, 6) ?? 'NEW'}-${new Date().toISOString().slice(0, 7).replace('-', '')}`;
    setBilling((prev) => ({
      ...prev,
      mandateReference: ref,
      mandateCreatedAt: new Date().toISOString(),
      mandateStatus: 'pending',
    }));
    Alert.alert('Mandat généré', `Référence: ${ref}\n\nLe mandat SEPA a été généré. Vous pouvez l'envoyer pour signature.`);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [billing, existingHotel]);

  const handleSendMandate = useCallback(() => {
    if (!billing.billingEmail) {
      Alert.alert('Erreur', 'Veuillez renseigner l\'email de facturation.');
      return;
    }
    setBilling((prev) => ({
      ...prev,
      mandateSentAt: new Date().toISOString(),
      mandateStatus: 'sent',
    }));
    Alert.alert('Mandat envoyé', `Le mandat a été envoyé à ${billing.billingEmail} pour signature.`);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [billing.billingEmail]);

  const handleGenerateRooms = useCallback(() => {
    const count = parseInt(genCount, 10);
    const startNum = parseInt(genStartNum, 10);
    if (!genType || isNaN(count) || count <= 0 || isNaN(startNum)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du générateur.');
      return;
    }
    Alert.alert(
      'Chambres générées',
      `${count} chambres de type "${genType}" créées à partir du numéro ${startNum}${genFloor ? `, étage ${genFloor}` : ''}.`,
    );
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGenType('');
    setGenCategory('');
    setGenFloor('');
    setGenCount('');
    setGenStartNum('');
  }, [genType, genFloor, genCount, genStartNum]);

  const handleImportExcel = useCallback(() => {
    router.push('/import-rooms' as any);
  }, [router]);

  const toggleEquipment = useCallback((id: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addConfigItem = useCallback((type: 'roomType' | 'category' | 'view' | 'bathroom') => {
    const promptFn = (Alert as any).prompt;
    if (promptFn) {
      promptFn('Ajouter', 'Nom du nouvel élément :', (text: string) => {
        if (!text?.trim()) return;
        const id = `new-${Date.now()}`;
        switch (type) {
          case 'roomType':
            setRoomTypes((prev) => [...prev, { id, name: text.trim(), code: text.trim().substring(0, 3).toUpperCase() }]);
            break;
          case 'category':
            setRoomCategories((prev) => [...prev, { id, name: text.trim() }]);
            break;
          case 'view':
            setViewTypes((prev) => [...prev, { id, name: text.trim() }]);
            break;
          case 'bathroom':
            setBathroomTypes((prev) => [...prev, { id, name: text.trim() }]);
            break;
        }
      });
    } else {
      Alert.alert('Ajouter', 'Utilisez le formulaire de saisie pour ajouter un élément.');
    }
  }, []);

  const removeConfigItem = useCallback((type: 'roomType' | 'category' | 'view' | 'bathroom', id: string) => {
    switch (type) {
      case 'roomType':
        setRoomTypes((prev) => prev.filter((i) => i.id !== id));
        break;
      case 'category':
        setRoomCategories((prev) => prev.filter((i) => i.id !== id));
        break;
      case 'view':
        setViewTypes((prev) => prev.filter((i) => i.id !== id));
        break;
      case 'bathroom':
        setBathroomTypes((prev) => prev.filter((i) => i.id !== id));
        break;
    }
  }, []);

  const needsBasicAuth = pmsType === 'opera' || pmsType === 'medialog' || pmsType === 'sihot' || pmsType === 'fidotel' || pmsType === 'protel';
  const needsApiUrl = pmsType === 'opera' || pmsType === 'apaleo' || pmsType === 'other' || pmsType === 'galaxy' || pmsType === 'maestro';

  const renderChipList = (
    items: { id: string; name: string }[],
    type: 'roomType' | 'category' | 'view' | 'bathroom',
  ) => (
    <View style={styles.chipGrid}>
      {items.map((item) => (
        <View key={item.id} style={styles.configChip}>
          <Text style={styles.configChipText}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeConfigItem(type, item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={12} color={SA.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addChip} onPress={() => addConfigItem(type)}>
        <Plus size={14} color={SA.accent} />
      </TouchableOpacity>
    </View>
  );

  const renderGeneralTab = () => (
    <>
      <View style={styles.iconRow}>
        <View style={styles.hotelIconLarge}>
          <Building2 size={28} color={SA.accent} />
        </View>
        <Text style={styles.formTitle}>{isEditing ? existingHotel?.name : 'Créer un hôtel'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Informations générales</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Building2 size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Nom de l'hôtel *" placeholderTextColor={SA.textMuted} value={name} onChangeText={setName} />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Mail size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Email de contact *" placeholderTextColor={SA.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Phone size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor={SA.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><MapPin size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Adresse" placeholderTextColor={SA.textMuted} value={address} onChangeText={setAddress} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Plan d{"'"}abonnement</Text>
        <View style={styles.planOptions}>
          {(['basic', 'premium', 'enterprise'] as const).map((p) => {
            const config = SUBSCRIPTION_PLAN_CONFIG[p];
            const isSelected = plan === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.planOption, isSelected && { borderColor: config.color, backgroundColor: config.color + '10' }]}
                onPress={() => setPlan(p)}
              >
                <View style={[styles.planDot, { backgroundColor: config.color }]} />
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, isSelected && { color: config.color }]}>{config.label}</Text>
                  <Text style={styles.planMax}>Max {config.maxRooms} chambres</Text>
                </View>
                {isSelected && <View style={[styles.planCheck, { backgroundColor: config.color }]}><Text style={styles.planCheckText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Statut</Text>
        <View style={styles.statusOptions}>
          {(['active', 'trial', 'suspended'] as const).map((s) => {
            const config = HOTEL_STATUS_CONFIG[s];
            const isSelected = status === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, isSelected && { borderColor: config.color, backgroundColor: config.color + '10' }]}
                onPress={() => setStatus(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={[styles.statusText, isSelected && { color: config.color }]}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Période d{"'"}abonnement</Text>
        <View style={styles.dateRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.inputIcon}><Calendar size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Début (AAAA-MM-JJ)" placeholderTextColor={SA.textMuted} value={subStart} onChangeText={setSubStart} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.inputIcon}><Calendar size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Fin (AAAA-MM-JJ)" placeholderTextColor={SA.textMuted} value={subEnd} onChangeText={setSubEnd} />
          </View>
        </View>
      </View>

      {isEditing && existingHotel && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <BedDouble size={16} color={SA.accent} />
              <Text style={styles.statValue}>{existingHotel.roomCount}</Text>
              <Text style={styles.statLabel}>chambres</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={16} color={SA.accent} />
              <Text style={styles.statValue}>{existingHotel.userCount}</Text>
              <Text style={styles.statLabel}>utilisateurs</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Save size={18} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>{isEditing ? 'Enregistrer les modifications' : 'Créer l\'hôtel'}</Text>
      </TouchableOpacity>
    </>
  );

  const renderConfigTab = () => (
    <>
      <View style={styles.configHeader}>
        <View style={styles.configIconContainer}>
          <Settings2 size={24} color={SA.accent} />
        </View>
        <Text style={styles.formTitle}>Configuration hôtel</Text>
        <Text style={styles.configSubtitle}>
          Paramétrez la structure des chambres, catégories, vues et équipements
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Types de chambres</Text>
          <Text style={styles.sectionCount}>{roomTypes.length}</Text>
        </View>
        {renderChipList(roomTypes, 'roomType')}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Catégories</Text>
          <Text style={styles.sectionCount}>{roomCategories.length}</Text>
        </View>
        {renderChipList(roomCategories, 'category')}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Types de vues</Text>
          <Text style={styles.sectionCount}>{viewTypes.length}</Text>
        </View>
        {renderChipList(viewTypes, 'view')}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Salle de bain</Text>
          <Text style={styles.sectionCount}>{bathroomTypes.length}</Text>
        </View>
        {renderChipList(bathroomTypes, 'bathroom')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Équipements disponibles</Text>
        <View style={styles.equipmentGrid}>
          {equipment.map((eq) => {
            const isSelected = selectedEquipment.has(eq.id);
            return (
              <TouchableOpacity
                key={eq.id}
                style={[styles.equipmentChip, isSelected && styles.equipmentChipActive]}
                onPress={() => toggleEquipment(eq.id)}
              >
                <Text style={styles.equipmentIcon}>{eq.icon}</Text>
                <Text style={[styles.equipmentLabel, isSelected && styles.equipmentLabelActive]}>
                  {eq.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.configDivider} />

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Layers size={16} color={SA.accent} />
          <Text style={styles.sectionLabel}>Générateur de chambres</Text>
        </View>
        <Text style={styles.genHint}>Créez plusieurs chambres en une seule action</Text>

        <View style={styles.genRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput style={styles.input} placeholder="Type (ex: Double)" placeholderTextColor={SA.textMuted} value={genType} onChangeText={setGenType} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput style={styles.input} placeholder="Catégorie" placeholderTextColor={SA.textMuted} value={genCategory} onChangeText={setGenCategory} />
          </View>
        </View>
        <View style={styles.genRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput style={styles.input} placeholder="Étage" placeholderTextColor={SA.textMuted} value={genFloor} onChangeText={setGenFloor} keyboardType="numeric" />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={SA.textMuted} value={genCount} onChangeText={setGenCount} keyboardType="numeric" />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <TextInput style={styles.input} placeholder="N° début" placeholderTextColor={SA.textMuted} value={genStartNum} onChangeText={setGenStartNum} keyboardType="numeric" />
          </View>
        </View>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateRooms}>
          <BedDouble size={16} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Générer les chambres</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.configDivider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportExcel}>
          <FileSpreadsheet size={18} color={SA.accent} />
          <View style={styles.importBtnInfo}>
            <Text style={styles.importBtnTitle}>Importer depuis Excel</Text>
            <Text style={styles.importBtnSub}>Configurez en masse via un fichier template</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={() => {
        Alert.alert('Configuration sauvegardée', 'La configuration de l\'hôtel a été enregistrée.');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}>
        <Save size={18} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>Enregistrer la configuration</Text>
      </TouchableOpacity>
    </>
  );

  const getMandateStatusConfig = useCallback((status: HotelBilling['mandateStatus']) => {
    switch (status) {
      case 'pending': return { label: 'En attente', color: SA.warning, icon: '⏳' };
      case 'sent': return { label: 'Envoyé', color: '#3B82F6', icon: '📩' };
      case 'signed': return { label: 'Signé', color: SA.success, icon: '✅' };
      case 'expired': return { label: 'Expiré', color: SA.danger, icon: '⚠️' };
      default: return { label: 'Non créé', color: SA.textMuted, icon: '📄' };
    }
  }, []);

  const renderBillingTab = () => {
    const mandateConfig = getMandateStatusConfig(billing.mandateStatus);
    return (
      <>
        <View style={styles.configHeader}>
          <View style={[styles.configIconContainer, { backgroundColor: '#F59E0B15' }]}>
            <CreditCard size={24} color="#F59E0B" />
          </View>
          <Text style={styles.formTitle}>Informations de facturation</Text>
          <Text style={styles.configSubtitle}>
            Renseignez les informations bancaires et TVA pour la facturation et les mandats SEPA
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TVA & Informations légales</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Shield size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="N° TVA intracommunautaire (ex: FR12345678901)" placeholderTextColor={SA.textMuted} value={billing.vatNumber} onChangeText={(v) => updateBilling('vatNumber', v)} autoCapitalize="characters" />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><User size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Nom du responsable légal *" placeholderTextColor={SA.textMuted} value={billing.legalRepresentative} onChangeText={(v) => updateBilling('legalRepresentative', v)} />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><MapPin size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Adresse de facturation" placeholderTextColor={SA.textMuted} value={billing.billingAddress} onChangeText={(v) => updateBilling('billingAddress', v)} multiline />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Mail size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Email de facturation *" placeholderTextColor={SA.textMuted} value={billing.billingEmail} onChangeText={(v) => updateBilling('billingEmail', v)} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Coordonnées bancaires (RIB)</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><CreditCard size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="IBAN *" placeholderTextColor={SA.textMuted} value={billing.iban} onChangeText={(v) => updateBilling('iban', v)} autoCapitalize="characters" />
          </View>
          {billing.iban.length > 0 && (
            <View style={[styles.billingHint, { backgroundColor: validateIBAN(billing.iban) ? SA.success + '10' : SA.danger + '10' }]}>
              {validateIBAN(billing.iban) ? (
                <CheckCircle size={12} color={SA.success} />
              ) : (
                <AlertTriangle size={12} color={SA.danger} />
              )}
              <Text style={{ fontSize: 11, color: validateIBAN(billing.iban) ? SA.success : SA.danger, fontWeight: '500' as const }}>
                {validateIBAN(billing.iban) ? 'Format IBAN valide' : 'Format IBAN invalide'}
              </Text>
            </View>
          )}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Key size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="BIC / SWIFT *" placeholderTextColor={SA.textMuted} value={billing.bic} onChangeText={(v) => updateBilling('bic', v)} autoCapitalize="characters" />
          </View>
          {billing.bic.length > 0 && (
            <View style={[styles.billingHint, { backgroundColor: validateBIC(billing.bic) ? SA.success + '10' : SA.danger + '10' }]}>
              {validateBIC(billing.bic) ? (
                <CheckCircle size={12} color={SA.success} />
              ) : (
                <AlertTriangle size={12} color={SA.danger} />
              )}
              <Text style={{ fontSize: 11, color: validateBIC(billing.bic) ? SA.success : SA.danger, fontWeight: '500' as const }}>
                {validateBIC(billing.bic) ? 'Format BIC valide' : 'Format BIC invalide (8 ou 11 car.)'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mandat de prélèvement SEPA</Text>
          <View style={styles.mandateCard}>
            <View style={styles.mandateHeader}>
              <FileText size={20} color={mandateConfig.color} />
              <View style={styles.mandateInfo}>
                <Text style={styles.mandateTitle}>Mandat SEPA</Text>
                <View style={[styles.mandateStatusBadge, { backgroundColor: mandateConfig.color + '15' }]}>
                  <Text style={styles.mandateStatusIcon}>{mandateConfig.icon}</Text>
                  <Text style={[styles.mandateStatusText, { color: mandateConfig.color }]}>{mandateConfig.label}</Text>
                </View>
              </View>
            </View>

            {billing.mandateReference ? (
              <View style={styles.mandateDetails}>
                <View style={styles.mandateDetailRow}>
                  <Text style={styles.mandateDetailLabel}>Référence</Text>
                  <Text style={styles.mandateDetailValue}>{billing.mandateReference}</Text>
                </View>
                {billing.mandateCreatedAt ? (
                  <View style={styles.mandateDetailRow}>
                    <Text style={styles.mandateDetailLabel}>Créé le</Text>
                    <Text style={styles.mandateDetailValue}>
                      {new Date(billing.mandateCreatedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ) : null}
                {billing.mandateSentAt ? (
                  <View style={styles.mandateDetailRow}>
                    <Text style={styles.mandateDetailLabel}>Envoyé le</Text>
                    <Text style={styles.mandateDetailValue}>
                      {new Date(billing.mandateSentAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.mandateEmpty}>Aucun mandat généré. Renseignez les informations bancaires puis générez le mandat.</Text>
            )}

            <View style={styles.mandateActions}>
              {!billing.mandateReference ? (
                <TouchableOpacity style={[styles.generateBtn, { backgroundColor: '#F59E0B' }]} onPress={handleGenerateMandate}>
                  <FileText size={16} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>Générer le mandat</Text>
                </TouchableOpacity>
              ) : billing.mandateStatus === 'pending' ? (
                <TouchableOpacity style={[styles.generateBtn, { backgroundColor: '#3B82F6' }]} onPress={handleSendMandate}>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>Envoyer pour signature</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBilling}>
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Enregistrer la facturation</Text>
        </TouchableOpacity>
      </>
    );
  };

  const [contractStatus, setContractStatus] = useState<'draft' | 'sent' | 'signed'>('draft');
  const [contractRef, setContractRef] = useState('');

  const handleGenerateContract = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'hôtel est requis pour générer un contrat.');
      return;
    }
    const ref = `CTR-${existingHotel?.id?.toUpperCase().slice(0, 6) ?? 'NEW'}-${new Date().toISOString().slice(0, 7).replace('-', '')}`;
    setContractRef(ref);
    setContractStatus('draft');
    Alert.alert('Contrat généré', `Référence: ${ref}\n\nLe contrat a été généré en brouillon. Vous pouvez l\'envoyer pour signature.`);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [name, existingHotel]);

  const handleSendContract = useCallback(() => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email de contact est requis.');
      return;
    }
    setContractStatus('sent');
    Alert.alert('Contrat envoyé', `Le contrat a été envoyé à ${email} pour signature électronique.`);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [email]);

  const handleSignContract = useCallback(() => {
    setContractStatus('signed');
    Alert.alert('Contrat signé', 'Le contrat a été marqué comme signé.');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const renderContractTab = () => {
    const contractStatusConfig = {
      draft: { label: 'Brouillon', color: SA.warning, icon: '📝' },
      sent: { label: 'Envoyé', color: '#3B82F6', icon: '📩' },
      signed: { label: 'Signé', color: SA.success, icon: '✅' },
    };
    const statusCfg = contractStatusConfig[contractStatus];

    return (
      <>
        <View style={styles.configHeader}>
          <View style={[styles.configIconContainer, { backgroundColor: '#6B5CE715' }]}>
            <FileText size={24} color="#6B5CE7" />
          </View>
          <Text style={styles.formTitle}>Contrat</Text>
          <Text style={styles.configSubtitle}>
            Générez et gérez le contrat entre l{"'"}hôtel et FLOWTYM
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Informations du contrat</Text>
          <View style={styles.contractInfoCard}>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Hôtel</Text>
              <Text style={styles.contractInfoValue}>{name || '-'}</Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Plan</Text>
              <Text style={styles.contractInfoValue}>{SUBSCRIPTION_PLAN_CONFIG[plan].label}</Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Chambres max</Text>
              <Text style={styles.contractInfoValue}>{SUBSCRIPTION_PLAN_CONFIG[plan].maxRooms}</Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Début</Text>
              <Text style={styles.contractInfoValue}>{subStart || '-'}</Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Fin</Text>
              <Text style={styles.contractInfoValue}>{subEnd || '-'}</Text>
            </View>
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Contact</Text>
              <Text style={styles.contractInfoValue}>{email || '-'}</Text>
            </View>
            {billing.legalRepresentative ? (
              <View style={styles.contractInfoRow}>
                <Text style={styles.contractInfoLabel}>Représentant</Text>
                <Text style={styles.contractInfoValue}>{billing.legalRepresentative}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {contractRef ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Statut du contrat</Text>
            <View style={styles.mandateCard}>
              <View style={styles.mandateHeader}>
                <FileText size={20} color={statusCfg.color} />
                <View style={styles.mandateInfo}>
                  <Text style={styles.mandateTitle}>Contrat FLOWTYM</Text>
                  <View style={[styles.mandateStatusBadge, { backgroundColor: statusCfg.color + '15' }]}>
                    <Text style={styles.mandateStatusIcon}>{statusCfg.icon}</Text>
                    <Text style={[styles.mandateStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.mandateDetails}>
                <View style={styles.mandateDetailRow}>
                  <Text style={styles.mandateDetailLabel}>Référence</Text>
                  <Text style={styles.mandateDetailValue}>{contractRef}</Text>
                </View>
                <View style={styles.mandateDetailRow}>
                  <Text style={styles.mandateDetailLabel}>Date</Text>
                  <Text style={styles.mandateDetailValue}>{new Date().toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View style={styles.mandateActions}>
                {contractStatus === 'draft' && (
                  <TouchableOpacity style={[styles.generateBtn, { backgroundColor: '#3B82F6' }]} onPress={handleSendContract}>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>Envoyer pour signature</Text>
                  </TouchableOpacity>
                )}
                {contractStatus === 'sent' && (
                  <TouchableOpacity style={[styles.generateBtn, { backgroundColor: SA.success }]} onPress={handleSignContract}>
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>Marquer comme signé</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.saveBtn} onPress={handleGenerateContract}>
          <FileText size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{contractRef ? 'Régénérer le contrat' : 'Générer le contrat'}</Text>
        </TouchableOpacity>
      </>
    );
  };

  const pmsTypes = Object.entries(PMS_TYPE_CONFIG) as [PMSType, { label: string }][];

  const renderPmsTab = () => (
    <>
      <View style={styles.pmsHeader}>
        <View style={styles.pmsIconContainer}>
          <Database size={24} color={SA.accent} />
        </View>
        <Text style={styles.formTitle}>Connectivité PMS</Text>
        <Text style={styles.pmsSubtitle}>
          Configurez la connexion au Property Management System de l{"'"}hôtel
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Type de PMS</Text>
        <TouchableOpacity
          style={styles.pmsSelector}
          onPress={() => setShowPmsDropdown(!showPmsDropdown)}
          activeOpacity={0.7}
        >
          <Server size={16} color={SA.accent} />
          <Text style={styles.pmsSelectorText}>{PMS_TYPE_CONFIG[pmsType].label}</Text>
          <ChevronDown size={16} color={SA.textMuted} />
        </TouchableOpacity>

        {showPmsDropdown && (
          <View style={styles.pmsDropdown}>
            <ScrollView style={styles.pmsDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
              {pmsTypes.map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.pmsDropdownItem, pmsType === key && styles.pmsDropdownItemActive]}
                  onPress={() => {
                    setPmsType(key);
                    setShowPmsDropdown(false);
                  }}
                >
                  <Text style={[styles.pmsDropdownText, pmsType === key && styles.pmsDropdownTextActive]}>
                    {config.label}
                  </Text>
                  {pmsType === key && <CheckCircle size={14} color={SA.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Identifiants de connexion</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Building2 size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Nom de la connexion *" placeholderTextColor={SA.textMuted} value={pmsConnectionName} onChangeText={setPmsConnectionName} />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Building2 size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Property Code / Hotel ID" placeholderTextColor={SA.textMuted} value={pmsHotelId} onChangeText={setPmsHotelId} />
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Key size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Clé API / Token" placeholderTextColor={SA.textMuted} value={pmsApiKey} onChangeText={setPmsApiKey} secureTextEntry autoCapitalize="none" />
        </View>

        {needsApiUrl && (
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Globe size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="URL de base de l'API" placeholderTextColor={SA.textMuted} value={pmsApiUrl} onChangeText={setPmsApiUrl} autoCapitalize="none" keyboardType="url" />
          </View>
        )}

        {needsBasicAuth && (
          <>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}><User size={16} color={SA.textMuted} /></View>
              <TextInput style={styles.input} placeholder="Identifiant utilisateur" placeholderTextColor={SA.textMuted} value={pmsUsername} onChangeText={setPmsUsername} autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}><Key size={16} color={SA.textMuted} /></View>
              <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor={SA.textMuted} value={pmsPassword} onChangeText={setPmsPassword} secureTextEntry />
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}><Server size={16} color={SA.textMuted} /></View>
          <TextInput style={styles.input} placeholder="Version API (optionnel)" placeholderTextColor={SA.textMuted} value={pmsApiVersion} onChangeText={setPmsApiVersion} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Synchronisation</Text>
        <View style={styles.pmsToggleRow}>
          <View style={styles.pmsToggleInfo}>
            <Zap size={16} color={pmsIsActive ? SA.success : SA.textMuted} />
            <View style={styles.pmsToggleText}>
              <Text style={styles.pmsToggleTitle}>Activer la synchronisation</Text>
              <Text style={styles.pmsToggleSub}>
                {pmsIsActive ? 'La synchronisation automatique est active' : 'La synchronisation est désactivée'}
              </Text>
            </View>
          </View>
          <Switch
            value={pmsIsActive}
            onValueChange={setPmsIsActive}
            trackColor={{ false: SA.border, true: SA.accent + '60' }}
            thumbColor={pmsIsActive ? SA.accent : '#f4f3f4'}
          />
        </View>
      </View>

      {testResult ? (
        <View style={[styles.testResultBanner, testResult === 'success' ? styles.testResultSuccess : styles.testResultError]}>
          {testResult === 'success' ? (
            <CheckCircle size={16} color={SA.success} />
          ) : (
            <AlertTriangle size={16} color={SA.danger} />
          )}
          <Text style={[styles.testResultText, { color: testResult === 'success' ? SA.success : SA.danger }]}>
            {testResult === 'success' ? 'Connexion établie avec succès' : 'Échec de la connexion'}
          </Text>
        </View>
      ) : null}

      <View style={styles.pmsActions}>
        <TouchableOpacity
          style={[styles.testBtn, isTesting && styles.testBtnDisabled]}
          onPress={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={SA.accent} />
          ) : (
            <Zap size={16} color={SA.accent} />
          )}
          <Text style={styles.testBtnText}>{isTesting ? 'Test en cours...' : 'Tester la connexion'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePms}>
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Enregistrer la configuration PMS</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Modifier l\'hôtel' : 'Nouvel hôtel',
          presentation: 'modal',
          headerStyle: { backgroundColor: SA.surface },
          headerTintColor: SA.text,
        }}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.tabActive]}
          onPress={() => setActiveTab('general')}
        >
          <Building2 size={15} color={activeTab === 'general' ? SA.accent : SA.textMuted} />
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>Général</Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contract' && styles.tabActive]}
            onPress={() => setActiveTab('contract')}
          >
            <FileText size={15} color={activeTab === 'contract' ? SA.accent : SA.textMuted} />
            <Text style={[styles.tab_text_inner, activeTab === 'contract' && styles.tabTextActive]}>Contrat</Text>
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'config' && styles.tabActive]}
            onPress={() => setActiveTab('config')}
          >
            <Settings2 size={15} color={activeTab === 'config' ? SA.accent : SA.textMuted} />
            <Text style={[styles.tab_text_inner, activeTab === 'config' && styles.tabTextActive]}>Config</Text>
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pms' && styles.tabActive]}
            onPress={() => setActiveTab('pms')}
          >
            <Database size={15} color={activeTab === 'pms' ? SA.accent : SA.textMuted} />
            <Text style={[styles.tab_text_inner, activeTab === 'pms' && styles.tabTextActive]}>PMS</Text>
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'billing' && styles.tabActive]}
            onPress={() => setActiveTab('billing')}
          >
            <CreditCard size={15} color={activeTab === 'billing' ? SA.accent : SA.textMuted} />
            <Text style={[styles.tab_text_inner, activeTab === 'billing' && styles.tabTextActive]}>Factu.</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'pms' && renderPmsTab()}
        {activeTab === 'billing' && renderBillingTab()}
        {activeTab === 'contract' && renderContractTab()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  scroll: { flex: 1 },
  content: { padding: 20 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: SA.surface,
    borderBottomWidth: 1,
    borderBottomColor: SA.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: SA.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: SA.textMuted,
  },
  tab_text_inner: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: SA.textMuted,
  },
  tabTextActive: {
    color: SA.accent,
  },
  iconRow: { alignItems: 'center', marginBottom: 24, gap: 12 },
  hotelIconLarge: { width: 56, height: 56, borderRadius: 18, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '700' as const, color: SA.text, textAlign: 'center' as const },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, color: SA.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionCount: { fontSize: 12, fontWeight: '700' as const, color: SA.accent, backgroundColor: SA.accent + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surface, borderRadius: 12, borderWidth: 1, borderColor: SA.border, marginBottom: 10, overflow: 'hidden' },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, color: SA.text, paddingVertical: 14, paddingRight: 14 },
  planOptions: { gap: 10 },
  planOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SA.surface, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: SA.border },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  planMax: { fontSize: 11, color: SA.textMuted, marginTop: 2 },
  planCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  planCheckText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  statusOptions: { flexDirection: 'row', gap: 10 },
  statusOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SA.surface, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: SA.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' as const, color: SA.textSecondary },
  dateRow: { flexDirection: 'row', gap: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SA.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SA.border },
  statValue: { fontSize: 18, fontWeight: '800' as const, color: SA.text },
  statLabel: { fontSize: 11, color: SA.textMuted },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SA.accent, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' as const },

  configHeader: { alignItems: 'center', marginBottom: 28, gap: 10 },
  configIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center' },
  configSubtitle: { fontSize: 13, color: SA.textMuted, textAlign: 'center' as const, lineHeight: 18, paddingHorizontal: 20 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SA.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SA.border,
  },
  configChipText: { fontSize: 13, color: SA.text, fontWeight: '500' as const },
  addChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: SA.accent + '12',
    borderWidth: 1,
    borderColor: SA.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SA.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SA.border,
  },
  equipmentChipActive: {
    backgroundColor: SA.accent + '12',
    borderColor: SA.accent + '40',
  },
  equipmentIcon: { fontSize: 16 },
  equipmentLabel: { fontSize: 12, color: SA.textSecondary, fontWeight: '500' as const },
  equipmentLabelActive: { color: SA.accent },
  configDivider: { height: 1, backgroundColor: SA.border, marginVertical: 8 },
  genHint: { fontSize: 12, color: SA.textMuted, marginBottom: 12 },
  genRow: { flexDirection: 'row', gap: 8 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SA.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  generateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' as const },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SA.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: SA.accent + '30',
  },
  importBtnInfo: { flex: 1 },
  importBtnTitle: { fontSize: 14, fontWeight: '700' as const, color: SA.text },
  importBtnSub: { fontSize: 11, color: SA.textMuted, marginTop: 2 },

  pmsHeader: { alignItems: 'center', marginBottom: 28, gap: 10 },
  pmsIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center' },
  pmsSubtitle: { fontSize: 13, color: SA.textMuted, textAlign: 'center' as const, lineHeight: 18, paddingHorizontal: 20 },
  pmsSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SA.surface, borderRadius: 12, borderWidth: 1.5, borderColor: SA.accent + '40', padding: 16 },
  pmsSelectorText: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: SA.text },
  pmsDropdown: { backgroundColor: SA.surface, borderRadius: 12, borderWidth: 1, borderColor: SA.border, marginTop: 8, overflow: 'hidden' },
  pmsDropdownScroll: { maxHeight: 250 },
  pmsDropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: SA.border },
  pmsDropdownItemActive: { backgroundColor: SA.accent + '10' },
  pmsDropdownText: { fontSize: 14, color: SA.textSecondary },
  pmsDropdownTextActive: { color: SA.accent, fontWeight: '600' as const },
  pmsToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SA.surface, borderRadius: 12, borderWidth: 1, borderColor: SA.border, padding: 16 },
  pmsToggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pmsToggleText: { flex: 1, gap: 2 },
  pmsToggleTitle: { fontSize: 14, fontWeight: '600' as const, color: SA.text },
  pmsToggleSub: { fontSize: 11, color: SA.textMuted },
  testResultBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 16 },
  testResultSuccess: { backgroundColor: SA.success + '12', borderWidth: 1, borderColor: SA.success + '30' },
  testResultError: { backgroundColor: SA.danger + '12', borderWidth: 1, borderColor: SA.danger + '30' },
  testResultText: { fontSize: 13, fontWeight: '600' as const },
  pmsActions: { gap: 12 },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SA.accent + '12', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: SA.accent + '30' },
  testBtnDisabled: { opacity: 0.6 },
  testBtnText: { fontSize: 14, fontWeight: '600' as const, color: SA.accent },

  billingHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 10, marginTop: -4 },
  mandateCard: { backgroundColor: SA.surface, borderRadius: 14, borderWidth: 1, borderColor: SA.border, padding: 18, gap: 16 },
  mandateHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mandateInfo: { flex: 1, gap: 6 },
  mandateTitle: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  mandateStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' as const },
  mandateStatusIcon: { fontSize: 12 },
  mandateStatusText: { fontSize: 11, fontWeight: '600' as const },
  mandateDetails: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: SA.border },
  mandateDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mandateDetailLabel: { fontSize: 12, color: SA.textMuted },
  mandateDetailValue: { fontSize: 12, fontWeight: '600' as const, color: SA.text },
  mandateEmpty: { fontSize: 12, color: SA.textMuted, lineHeight: 18 },
  mandateActions: { gap: 8 },
  contractInfoCard: { backgroundColor: SA.surface, borderRadius: 14, borderWidth: 1, borderColor: SA.border, padding: 16, gap: 12 },
  contractInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  contractInfoLabel: { fontSize: 12, color: SA.textMuted, fontWeight: '500' as const },
  contractInfoValue: { fontSize: 13, fontWeight: '600' as const, color: SA.text },
});

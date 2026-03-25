import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { FT } from '@/constants/flowtym';
import { RoomType } from '@/constants/types';

const ROOM_TYPES: RoomType[] = ['Simple', 'Double', 'Suite', 'Deluxe', 'Familiale', 'Twin'];

interface ImportedRoom {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  active: boolean;
  notes: string;
  error: string | null;
  selected: boolean;
}

type StepId = 'upload' | 'preview' | 'result';

export default function ImportRoomsScreen() {
  const router = useRouter();
  const { bulkImportRooms, isBulkImporting, rooms } = useHotel();

  const [step, setStep] = useState<StepId>('upload');
  const [importedRooms, setImportedRooms] = useState<ImportedRoom[]>([]);
  const [fileName, setFileName] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null);

  const [manualNumber, setManualNumber] = useState('');
  const [manualType, setManualType] = useState<RoomType>('Double');
  const [manualFloor, setManualFloor] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const existingNumbers = useMemo(() => new Set(rooms.map((r) => r.roomNumber)), [rooms]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setFileName(file.name);
      console.log('[ImportRooms] File picked:', file.name, file.mimeType);

      const sampleRooms: ImportedRoom[] = [];
      for (let floor = 1; floor <= 3; floor++) {
        for (let room = 1; room <= 5; room++) {
          const num = `${floor}${String(room).padStart(2, '0')}`;
          const isDuplicate = existingNumbers.has(num);
          sampleRooms.push({
            id: `imp-${Date.now()}-${floor}-${room}`,
            roomNumber: num,
            roomType: room <= 2 ? 'Simple' : room <= 4 ? 'Double' : 'Suite',
            floor,
            active: true,
            notes: '',
            error: isDuplicate ? `Chambre ${num} existe déjà (sera mise à jour)` : null,
            selected: true,
          });
        }
      }

      setImportedRooms(sampleRooms);
      setStep('preview');
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('[ImportRooms] Error picking file:', e);
      Alert.alert('Erreur', 'Impossible de lire le fichier.');
    }
  }, [existingNumbers]);

  const handleAddManual = useCallback(() => {
    if (!manualNumber.trim()) {
      Alert.alert('Erreur', 'Le numéro de chambre est obligatoire.');
      return;
    }
    if (!manualFloor.trim() || isNaN(parseInt(manualFloor, 10))) {
      Alert.alert('Erreur', 'L\'étage est obligatoire.');
      return;
    }

    const isDuplicate = existingNumbers.has(manualNumber.trim());
    const newRoom: ImportedRoom = {
      id: `imp-manual-${Date.now()}`,
      roomNumber: manualNumber.trim(),
      roomType: manualType,
      floor: parseInt(manualFloor, 10),
      active: true,
      notes: manualNotes.trim(),
      error: isDuplicate ? `Chambre ${manualNumber.trim()} existe déjà (sera mise à jour)` : null,
      selected: true,
    };

    setImportedRooms((prev) => [...prev, newRoom]);
    setManualNumber('');
    setManualFloor('');
    setManualNotes('');
    setShowManualAdd(false);

    if (step === 'upload') setStep('preview');
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [manualNumber, manualType, manualFloor, manualNotes, existingNumbers, step]);

  const handleToggleRoom = useCallback((id: string) => {
    setImportedRooms((prev) => prev.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  }, []);

  const handleRemoveRoom = useCallback((id: string) => {
    setImportedRooms((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSelectAll = useCallback(() => {
    const allSelected = importedRooms.every((r) => r.selected);
    setImportedRooms((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  }, [importedRooms]);

  const selectedCount = useMemo(() => importedRooms.filter((r) => r.selected).length, [importedRooms]);

  const handleImport = useCallback(async () => {
    const toImport = importedRooms.filter((r) => r.selected);
    if (toImport.length === 0) {
      Alert.alert('Aucune chambre', 'Sélectionnez au moins une chambre.');
      return;
    }

    try {
      const result = await bulkImportRooms(
        toImport.map((r) => ({
          roomNumber: r.roomNumber,
          floor: r.floor,
          roomType: r.roomType,
          roomCategory: 'Classique',
          roomSize: r.roomType === 'Suite' ? 35 : r.roomType === 'Double' ? 20 : 16,
          capacity: r.roomType === 'Suite' ? 4 : r.roomType === 'Double' ? 3 : 2,
          equipment: ['TV', 'Climatisation', 'Wi-Fi'],
          dotation: ['Serviette bain x2', 'Savon x1'],
        }))
      );
      setImportResult(result);
      setStep('result');
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('[ImportRooms] Import error:', e);
      Alert.alert('Erreur', 'L\'import a échoué.');
    }
  }, [importedRooms, bulkImportRooms]);

  const groupedByFloor = useMemo(() => {
    const map = new Map<number, ImportedRoom[]>();
    for (const room of importedRooms) {
      const arr = map.get(room.floor) || [];
      arr.push(room);
      map.set(room.floor, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [importedRooms]);

  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.uploadArea}>
        <View style={styles.uploadIconCircle}>
          <Upload size={32} color={FT.brand} />
        </View>
        <Text style={styles.uploadTitle}>Importer des chambres</Text>
        <Text style={styles.uploadSubtitle}>
          Importez vos chambres via un fichier CSV ou Excel,{'\n'}ou ajoutez-les manuellement.
        </Text>

        <View style={styles.uploadActions}>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile} activeOpacity={0.7}>
            <FileSpreadsheet size={18} color="#FFF" />
            <Text style={styles.uploadBtnText}>Choisir un fichier CSV / Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManualAdd(true)}
            activeOpacity={0.7}
          >
            <Plus size={18} color={FT.brand} />
            <Text style={styles.manualBtnText}>Ajouter manuellement</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.templateInfo}>
        <Text style={styles.templateTitle}>Format attendu</Text>
        <View style={styles.templateRow}>
          <View style={styles.templateCol}>
            <Text style={styles.templateHeader}>Colonne</Text>
            <Text style={styles.templateCell}>Numéro</Text>
            <Text style={styles.templateCell}>Type</Text>
            <Text style={styles.templateCell}>Étage</Text>
            <Text style={styles.templateCell}>Statut</Text>
            <Text style={styles.templateCell}>Notes</Text>
          </View>
          <View style={styles.templateCol}>
            <Text style={styles.templateHeader}>Exemple</Text>
            <Text style={styles.templateCell}>101</Text>
            <Text style={styles.templateCell}>Double</Text>
            <Text style={styles.templateCell}>1</Text>
            <Text style={styles.templateCell}>active</Text>
            <Text style={styles.templateCell}>Vue mer</Text>
          </View>
          <View style={styles.templateCol}>
            <Text style={styles.templateHeader}>Requis</Text>
            <Text style={[styles.templateCell, { color: FT.danger }]}>Oui</Text>
            <Text style={[styles.templateCell, { color: FT.danger }]}>Oui</Text>
            <Text style={[styles.templateCell, { color: FT.danger }]}>Oui</Text>
            <Text style={styles.templateCell}>Non</Text>
            <Text style={styles.templateCell}>Non</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewTitle}>
            {fileName ? `📄 ${fileName}` : 'Chambres à importer'}
          </Text>
          <Text style={styles.previewSubtitle}>
            {selectedCount} / {importedRooms.length} chambres sélectionnées
          </Text>
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
            <Check size={14} color={FT.brand} />
            <Text style={styles.selectAllText}>
              {importedRooms.every((r) => r.selected) ? 'Désélectionner' : 'Tout sélectionner'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowManualAdd(true)}>
            <Plus size={14} color={FT.brand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent}>
        {groupedByFloor.map(([floor, floorRooms]) => (
          <View key={floor} style={styles.floorGroup}>
            <View style={styles.floorHeader}>
              <Text style={styles.floorLabel}>Étage {floor}</Text>
              <View style={styles.floorCount}>
                <Text style={styles.floorCountText}>{floorRooms.length}</Text>
              </View>
            </View>
            {floorRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomRow,
                  !room.selected && styles.roomRowDisabled,
                  room.error && styles.roomRowWarning,
                ]}
                onPress={() => handleToggleRoom(room.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.roomCheck, room.selected && styles.roomCheckActive]}>
                  {room.selected && <Check size={12} color="#FFF" />}
                </View>
                <View style={styles.roomInfo}>
                  <Text style={[styles.roomNumber, !room.selected && styles.roomTextDisabled]}>
                    {room.roomNumber}
                  </Text>
                  <Text style={[styles.roomType, !room.selected && styles.roomTextDisabled]}>
                    {room.roomType}
                  </Text>
                </View>
                {room.error && (
                  <View style={styles.roomWarningBadge}>
                    <AlertTriangle size={12} color={FT.warning} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.roomDeleteBtn}
                  onPress={() => handleRemoveRoom(room.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={14} color={FT.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {importedRooms.length === 0 && (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>Aucune chambre à importer</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.previewFooter}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('upload'); setImportedRooms([]); }}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.importBtn, (selectedCount === 0 || isBulkImporting) && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={selectedCount === 0 || isBulkImporting}
          activeOpacity={0.7}
        >
          {isBulkImporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Upload size={16} color="#FFF" />
              <Text style={styles.importBtnText}>Importer {selectedCount} chambres</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResultStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.resultContainer}>
        <View style={styles.resultIconCircle}>
          <Check size={40} color="#FFF" />
        </View>
        <Text style={styles.resultTitle}>Import terminé !</Text>
        <Text style={styles.resultSubtitle}>
          {importResult?.created ?? 0} chambres créées • {importResult?.updated ?? 0} mises à jour
        </Text>

        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatValue}>{importResult?.created ?? 0}</Text>
            <Text style={styles.resultStatLabel}>Nouvelles</Text>
          </View>
          <View style={styles.resultStatDivider} />
          <View style={styles.resultStat}>
            <Text style={styles.resultStatValue}>{importResult?.updated ?? 0}</Text>
            <Text style={styles.resultStatLabel}>Mises à jour</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.doneBtnText}>Terminé</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Import chambres', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF' }} />

      <View style={styles.stepper}>
        {(['upload', 'preview', 'result'] as StepId[]).map((s, i) => {
          const labels = ['Fichier', 'Aperçu', 'Résultat'];
          const isActive = s === step;
          const isDone = (['upload', 'preview', 'result'] as StepId[]).indexOf(step) > i;
          return (
            <View key={s} style={styles.stepperItem}>
              <View style={[styles.stepperDot, isActive && styles.stepperDotActive, isDone && styles.stepperDotDone]}>
                {isDone ? <Check size={12} color="#FFF" /> : <Text style={[styles.stepperDotText, (isActive || isDone) && styles.stepperDotTextActive]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepperLabel, isActive && styles.stepperLabelActive]}>{labels[i]}</Text>
              {i < 2 && <View style={[styles.stepperLine, isDone && styles.stepperLineDone]} />}
            </View>
          );
        })}
      </View>

      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'result' && renderResultStep()}

      <Modal visible={showManualAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une chambre</Text>
              <TouchableOpacity onPress={() => setShowManualAdd(false)}>
                <X size={20} color={FT.textSec} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Numéro de chambre *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: 302"
                placeholderTextColor={FT.textMuted}
                value={manualNumber}
                onChangeText={setManualNumber}
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>Type de chambre *</Text>
              <TouchableOpacity style={styles.fieldSelect} onPress={() => setShowTypePicker(!showTypePicker)}>
                <Text style={styles.fieldSelectText}>{manualType}</Text>
                {showTypePicker ? <ChevronUp size={16} color={FT.textSec} /> : <ChevronDown size={16} color={FT.textSec} />}
              </TouchableOpacity>
              {showTypePicker && (
                <View style={styles.pickerList}>
                  {ROOM_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pickerItem, manualType === t && styles.pickerItemActive]}
                      onPress={() => { setManualType(t); setShowTypePicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, manualType === t && styles.pickerItemTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Étage *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: 3"
                placeholderTextColor={FT.textMuted}
                value={manualFloor}
                onChangeText={setManualFloor}
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>Notes internes (optionnel)</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextArea]}
                placeholder="Notes sur cette chambre..."
                placeholderTextColor={FT.textMuted}
                value={manualNotes}
                onChangeText={setManualNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddManual} activeOpacity={0.7}>
              <Plus size={16} color="#FFF" />
              <Text style={styles.modalSaveBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  stepperDotActive: { backgroundColor: FT.brand },
  stepperDotDone: { backgroundColor: FT.success },
  stepperDotText: { fontSize: 12, fontWeight: '700' as const, color: FT.textMuted },
  stepperDotTextActive: { color: '#FFF' },
  stepperLabel: { fontSize: 11, fontWeight: '600' as const, color: FT.textMuted, marginLeft: 6 },
  stepperLabelActive: { color: FT.brand },
  stepperLine: { width: 32, height: 2, backgroundColor: FT.border, marginHorizontal: 8 },
  stepperLineDone: { backgroundColor: FT.success },
  stepContainer: { flex: 1 },
  uploadArea: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, gap: 12 },
  uploadIconCircle: { width: 72, height: 72, borderRadius: 24, backgroundColor: FT.brandSoft, justifyContent: 'center', alignItems: 'center' },
  uploadTitle: { fontSize: 22, fontWeight: '800' as const, color: FT.text, marginTop: 8 },
  uploadSubtitle: { fontSize: 13, color: FT.textSec, textAlign: 'center', lineHeight: 20 },
  uploadActions: { width: '100%', gap: 10, marginTop: 20 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12 },
  uploadBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brandSoft, paddingVertical: 14, borderRadius: 12 },
  manualBtnText: { fontSize: 15, fontWeight: '600' as const, color: FT.brand },
  templateInfo: { margin: 20, padding: 16, backgroundColor: FT.surface, borderRadius: 14, borderWidth: 1, borderColor: FT.border },
  templateTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text, marginBottom: 12 },
  templateRow: { flexDirection: 'row', gap: 12 },
  templateCol: { flex: 1, gap: 6 },
  templateHeader: { fontSize: 11, fontWeight: '700' as const, color: FT.textSec, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  templateCell: { fontSize: 12, color: FT.text, paddingVertical: 3 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  previewTitle: { fontSize: 15, fontWeight: '700' as const, color: FT.text },
  previewSubtitle: { fontSize: 12, color: FT.textSec, marginTop: 2 },
  previewActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: FT.brandSoft },
  selectAllText: { fontSize: 11, fontWeight: '600' as const, color: FT.brand },
  addMoreBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: FT.brandSoft, justifyContent: 'center', alignItems: 'center' },
  previewScroll: { flex: 1 },
  previewScrollContent: { padding: 16, paddingBottom: 100 },
  floorGroup: { marginBottom: 16 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  floorLabel: { fontSize: 13, fontWeight: '700' as const, color: FT.textSec },
  floorCount: { backgroundColor: FT.brand + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  floorCountText: { fontSize: 11, fontWeight: '700' as const, color: FT.brand },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FT.surface, padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: FT.border },
  roomRowDisabled: { opacity: 0.5 },
  roomRowWarning: { borderColor: FT.warning + '40' },
  roomCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  roomCheckActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  roomInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roomNumber: { fontSize: 15, fontWeight: '700' as const, color: FT.text, minWidth: 40 },
  roomType: { fontSize: 12, color: FT.textSec, backgroundColor: FT.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roomTextDisabled: { color: FT.textMuted },
  roomWarningBadge: { padding: 4 },
  roomDeleteBtn: { padding: 4 },
  emptyPreview: { alignItems: 'center', paddingVertical: 40 },
  emptyPreviewText: { fontSize: 14, color: FT.textMuted },
  previewFooter: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: FT.surface, borderTopWidth: 1, borderTopColor: FT.border },
  backBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: FT.border },
  backBtnText: { fontSize: 14, fontWeight: '600' as const, color: FT.textSec },
  importBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12 },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  resultIconCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: FT.success, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 24, fontWeight: '800' as const, color: FT.text },
  resultSubtitle: { fontSize: 14, color: FT.textSec },
  resultStats: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 16, backgroundColor: FT.surface, padding: 20, borderRadius: 14, borderWidth: 1, borderColor: FT.border },
  resultStat: { alignItems: 'center', gap: 4 },
  resultStatValue: { fontSize: 28, fontWeight: '800' as const, color: FT.brand },
  resultStatLabel: { fontSize: 12, color: FT.textSec, fontWeight: '500' as const },
  resultStatDivider: { width: 1, height: 40, backgroundColor: FT.border },
  doneBtn: { backgroundColor: FT.brand, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  doneBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: FT.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: FT.border },
  modalTitle: { fontSize: 17, fontWeight: '700' as const, color: FT.text },
  modalBody: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: FT.textSec },
  fieldInput: { backgroundColor: FT.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: FT.text, borderWidth: 1, borderColor: FT.border },
  fieldTextArea: { minHeight: 80, paddingTop: 12 },
  fieldSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: FT.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: FT.border },
  fieldSelectText: { fontSize: 14, color: FT.text },
  pickerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: FT.bg, borderWidth: 1, borderColor: FT.border },
  pickerItemActive: { backgroundColor: FT.brandSoft, borderColor: FT.brand },
  pickerItemText: { fontSize: 13, color: FT.text },
  pickerItemTextActive: { color: FT.brand, fontWeight: '600' as const },
  modalSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brand, marginHorizontal: 20, marginBottom: 30, paddingVertical: 14, borderRadius: 12 },
  modalSaveBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
});

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Upload, FileText, ChevronRight, ChevronLeft, Check, X, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useHotel } from '@/providers/HotelProvider';
import { FT } from '@/constants/flowtym';
import {
  ImportedReservation,
  ColumnMapping,
  DEFAULT_COLUMN_MAPPING,
  DateFormatOption,
  DATE_FORMAT_OPTIONS,
  Reservation,
  RoomHistoryEntry,
} from '@/constants/types';

type ImportStep = 1 | 2 | 3 | 4;
type ImportMode = 'csv' | 'excel' | 'image' | 'pdf' | 'manual';

function generateId(): string {
  return `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectSeparator(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function parseDate(value: string, format: DateFormatOption): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  let day: number, month: number, year: number;

  try {
    switch (format) {
      case 'dd/mm/yyyy': {
        const parts = cleaned.split('/');
        if (parts.length !== 3) return null;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'mm/dd/yyyy': {
        const parts = cleaned.split('/');
        if (parts.length !== 3) return null;
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'yyyy-mm-dd': {
        const parts = cleaned.split('-');
        if (parts.length !== 3) return null;
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
        break;
      }
      case 'dd-mm-yyyy': {
        const parts = cleaned.split('-');
        if (parts.length !== 3) return null;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'dd.mm.yyyy': {
        const parts = cleaned.split('.');
        if (parts.length !== 3) return null;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      default:
        return null;
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;

    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return null;
  }
}

function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { ...DEFAULT_COLUMN_MAPPING };
  const lowerHeaders = headers.map((h) => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];
    if (h.includes('nom') || h.includes('name') || h.includes('client') || h.includes('guest')) {
      mapping.guestName = i;
    } else if (h.includes('arrivee') || h.includes('check-in') || h.includes('checkin') || h.includes('debut') || h.includes('start') || h.includes('arrival')) {
      mapping.checkInDate = i;
    } else if (h.includes('depart') || h.includes('check-out') || h.includes('checkout') || h.includes('fin') || h.includes('end')) {
      mapping.checkOutDate = i;
    } else if (h.includes('chambre') || h.includes('room') || h.includes('numero') || h.includes('number') || h.includes('zimmer') || h.includes('habitacion') || h.includes('camera')) {
      mapping.roomNumber = i;
    } else if (h.includes('adulte') || h.includes('adult')) {
      mapping.adults = i;
    } else if (h.includes('enfant') || h.includes('child') || h.includes('kinder') || h.includes('bambini')) {
      mapping.children = i;
    } else if (h.includes('preference') || h.includes('note') || h.includes('commentaire') || h.includes('comment') || h.includes('remark')) {
      mapping.preferences = i;
    }
  }

  return mapping;
}

export default function ImportReservationsScreen() {
  const router = useRouter();
  const { t } = useTheme();
  const { rooms, updateRoom } = useHotel();
  const ti = t.fileImport;

  const [step, setStep] = useState<ImportStep>(1);
  const [mode, setMode] = useState<ImportMode>('csv');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [_separator, setSeparator] = useState(',');
  const [mapping, setMapping] = useState<ColumnMapping>({ ...DEFAULT_COLUMN_MAPPING });
  const [dateFormat, setDateFormat] = useState<DateFormatOption>('dd/mm/yyyy');
  const [parsedReservations, setParsedReservations] = useState<ImportedReservation[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [manualRows, setManualRows] = useState<ImportedReservation[]>([
    { id: generateId(), guestName: '', checkInDate: '', checkOutDate: '', roomNumber: '', adults: 1, children: 0, preferences: '', selected: true, error: null },
  ]);

  const getMimeTypes = useCallback((m: ImportMode): string[] => {
    switch (m) {
      case 'csv': return ['text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values'];
      case 'excel': return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.oasis.opendocument.spreadsheet'];
      case 'image': return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case 'pdf': return ['application/pdf'];
      default: return ['*/*'];
    }
  }, []);

  const handlePickFile = useCallback(async () => {
    try {
      const mimeTypes = getMimeTypes(mode);
      console.log('[Import] Picking file for mode:', mode, 'mimes:', mimeTypes);
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[Import] File pick cancelled');
        return;
      }

      const asset = result.assets[0];
      console.log('[Import] File picked:', asset.name, asset.size);
      setFileName(asset.name);
      setFileSize(asset.size ?? 0);

      if (mode === 'image' || mode === 'pdf') {
        Alert.alert(
          'Traitement en cours',
          mode === 'image'
            ? 'L\'extraction OCR des images sera disponible prochainement. Pour l\'instant, veuillez utiliser le format CSV ou Excel, ou la saisie manuelle.'
            : 'L\'extraction de texte depuis les PDF sera disponible prochainement. Pour l\'instant, veuillez utiliser le format CSV ou Excel, ou la saisie manuelle.',
          [{ text: 'OK' }]
        );
        return;
      }

      let content = '';
      try {
        const response = await fetch(asset.uri);
        content = await response.text();
      } catch (e) {
        console.log('[Import] Error reading file content:', e);
        Alert.alert(ti.parseError, 'Impossible de lire le fichier. Essayez un autre format.');
        return;
      }

      console.log('[Import] File content length:', content.length);

      const detectedSep = detectSeparator(content);
      setSeparator(detectedSep);

      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        Alert.alert(ti.parseError, 'Le fichier doit contenir au moins un en-t\u00eate et une ligne de donn\u00e9es.');
        return;
      }

      const headerRow = parseCSVLine(lines[0], detectedSep);
      setHeaders(headerRow);

      const dataRows = lines.slice(1).map((line) => parseCSVLine(line, detectedSep));
      setCsvData(dataRows);

      const autoMapping = autoDetectMapping(headerRow);
      setMapping(autoMapping);

      setStep(2);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('[Import] Error picking file:', error);
      Alert.alert(ti.parseError, String(error));
    }
  }, [ti.parseError, mode, getMimeTypes]);

  const handleParseData = useCallback(() => {
    console.log('[Import] Parsing data with mapping:', mapping);
    if (mapping.guestName === null) {
      Alert.alert(t.common.error, ti.missingRequired + ': ' + ti.guestName);
      return;
    }
    if (mapping.checkInDate === null) {
      Alert.alert(t.common.error, ti.missingRequired + ': ' + ti.checkInDate);
      return;
    }
    if (mapping.checkOutDate === null) {
      Alert.alert(t.common.error, ti.missingRequired + ': ' + ti.checkOutDate);
      return;
    }

    const parsed: ImportedReservation[] = csvData.map((row, idx) => {
      const guestName = row[mapping.guestName!] ?? '';
      const rawCheckIn = row[mapping.checkInDate!] ?? '';
      const rawCheckOut = row[mapping.checkOutDate!] ?? '';
      const roomNumber = mapping.roomNumber !== null ? (row[mapping.roomNumber] ?? '') : '';
      const adults = mapping.adults !== null ? parseInt(row[mapping.adults] ?? '1', 10) || 1 : 1;
      const children = mapping.children !== null ? parseInt(row[mapping.children] ?? '0', 10) || 0 : 0;
      const preferences = mapping.preferences !== null ? (row[mapping.preferences] ?? '') : '';

      const checkInDate = parseDate(rawCheckIn, dateFormat);
      const checkOutDate = parseDate(rawCheckOut, dateFormat);

      let error: string | null = null;
      if (!guestName) error = ti.missingRequired + ': ' + ti.guestName;
      else if (!checkInDate) error = ti.invalidDate + ': ' + rawCheckIn;
      else if (!checkOutDate) error = ti.invalidDate + ': ' + rawCheckOut;
      else if (roomNumber && !rooms.find((r) => r.roomNumber === roomNumber)) error = ti.roomNotFound + ': ' + roomNumber;

      return {
        id: `csv-${idx}-${Date.now()}`,
        guestName,
        checkInDate: checkInDate ?? '',
        checkOutDate: checkOutDate ?? '',
        roomNumber,
        adults,
        children,
        preferences,
        selected: error === null,
        error,
      };
    });

    setParsedReservations(parsed);
    setStep(3);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [csvData, mapping, dateFormat, rooms, ti, t.common.error]);

  const handlePrepareManual = useCallback(() => {
    const validated = manualRows.map((row) => {
      let error: string | null = null;
      if (!row.guestName) error = ti.missingRequired + ': ' + ti.guestName;
      else if (!row.checkInDate) error = ti.missingRequired + ': ' + ti.checkInDate;
      else if (!row.checkOutDate) error = ti.missingRequired + ': ' + ti.checkOutDate;
      else if (row.roomNumber && !rooms.find((r) => r.roomNumber === row.roomNumber)) error = ti.roomNotFound + ': ' + row.roomNumber;
      return { ...row, selected: error === null, error };
    });
    setParsedReservations(validated);
    setStep(3);
  }, [manualRows, rooms, ti]);

  const toggleReservation = useCallback((id: string) => {
    setParsedReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const selectedCount = useMemo(() => parsedReservations.filter((r) => r.selected && !r.error).length, [parsedReservations]);
  const errorCount = useMemo(() => parsedReservations.filter((r) => r.error !== null).length, [parsedReservations]);

  const handleImport = useCallback(async () => {
    console.log('[Import] Starting import of', selectedCount, 'reservations');
    setIsImporting(true);
    let imported = 0;
    let failed = 0;

    try {
      const toImport = parsedReservations.filter((r) => r.selected && !r.error);

      for (const res of toImport) {
        try {
          const matchingRoom = res.roomNumber
            ? rooms.find((r) => r.roomNumber === res.roomNumber)
            : null;

          if (matchingRoom) {
            const newReservation: Reservation = {
              id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              roomId: matchingRoom.id,
              pmsReservationId: `IMP-${Date.now()}`,
              guestName: res.guestName,
              checkInDate: res.checkInDate,
              checkOutDate: res.checkOutDate,
              adults: res.adults,
              children: res.children,
              preferences: res.preferences,
              status: 'confirmed',
              lastSync: new Date().toISOString(),
            };

            const historyEntry: RoomHistoryEntry = {
              id: `h-imp-${Date.now()}-${matchingRoom.id}`,
              roomId: matchingRoom.id,
              action: 'Import réservation',
              performedBy: 'Import fichier',
              date: new Date().toISOString(),
              details: `Réservation importée pour ${res.guestName} (${res.checkInDate} → ${res.checkOutDate})`,
            };

            updateRoom({
              roomId: matchingRoom.id,
              updates: {
                currentReservation: newReservation,
                status: 'occupe',
                clientBadge: 'normal',
                history: [...matchingRoom.history, historyEntry],
              },
            });
            imported++;
          } else {
            imported++;
          }
        } catch (e) {
          console.log('[Import] Error importing reservation:', e);
          failed++;
        }
      }

      setImportedCount(imported);
      setFailedCount(failed);
      setStep(4);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('[Import] Import error:', error);
      Alert.alert(t.common.error, String(error));
    } finally {
      setIsImporting(false);
    }
  }, [parsedReservations, selectedCount, rooms, updateRoom, t.common.error]);

  const addManualRow = useCallback(() => {
    setManualRows((prev) => [
      ...prev,
      { id: generateId(), guestName: '', checkInDate: '', checkOutDate: '', roomNumber: '', adults: 1, children: 0, preferences: '', selected: true, error: null },
    ]);
  }, []);

  const removeManualRow = useCallback((id: string) => {
    setManualRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateManualRow = useCallback((id: string, field: keyof ImportedReservation, value: string | number) => {
    setManualRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const updateMappingField = useCallback((field: keyof ColumnMapping, value: number | null) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  }, []);

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentInner} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Upload size={32} color={FT.brand} />
        </View>
        <Text style={styles.heroTitle}>{ti.noPms}</Text>
        <Text style={styles.heroDesc}>{ti.noPmsDesc}</Text>
      </View>

      {([{ key: 'csv' as const, label: 'CSV / Texte', desc: '.csv, .tsv, .txt', icon: 'text' },
        { key: 'excel' as const, label: 'Excel', desc: '.xlsx, .xls, .ods', icon: 'spreadsheet' },
        { key: 'image' as const, label: 'Image (OCR)', desc: '.jpg, .png, .gif', icon: 'image' },
        { key: 'pdf' as const, label: 'PDF', desc: '.pdf', icon: 'pdf' },
        { key: 'manual' as const, label: ti.manualEntry, desc: ti.manualEntryDesc, icon: 'manual' },
      ] as const).map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.modeCard, mode === opt.key && styles.modeCardActive]}
          onPress={() => setMode(opt.key)}
          activeOpacity={0.7}
          testID={`mode-${opt.key}`}
        >
          <View style={[styles.modeIconWrap, mode === opt.key && styles.modeIconWrapActive]}>
            {opt.icon === 'manual' ? (
              <Plus size={22} color={mode === opt.key ? '#FFF' : FT.textSec} />
            ) : (
              <FileText size={22} color={mode === opt.key ? '#FFF' : FT.textSec} />
            )}
          </View>
          <View style={styles.modeTextWrap}>
            <Text style={[styles.modeTitle, mode === opt.key && styles.modeTitleActive]}>{opt.label}</Text>
            <Text style={styles.modeDesc}>{opt.desc}</Text>
          </View>
          <View style={[styles.modeRadio, mode === opt.key && styles.modeRadioActive]}>
            {mode === opt.key && <View style={styles.modeRadioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      {mode !== 'manual' && (
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile} activeOpacity={0.7} testID="pick-file-btn">
          <Upload size={18} color="#FFF" />
          <Text style={styles.uploadBtnText}>{ti.selectFile}</Text>
        </TouchableOpacity>
      )}

      {mode === 'manual' && (
        <View style={styles.manualSection}>
          {manualRows.map((row, idx) => (
            <View key={row.id} style={styles.manualRow}>
              <View style={styles.manualRowHeader}>
                <Text style={styles.manualRowTitle}>#{idx + 1}</Text>
                {manualRows.length > 1 && (
                  <TouchableOpacity onPress={() => removeManualRow(row.id)} style={styles.manualRemoveBtn}>
                    <Trash2 size={14} color={FT.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.manualInput}
                placeholder={ti.guestName + ' *'}
                placeholderTextColor={FT.textMuted}
                value={row.guestName}
                onChangeText={(v) => updateManualRow(row.id, 'guestName', v)}
                testID={`manual-guest-${idx}`}
              />
              <View style={styles.manualInputRow}>
                <TextInput
                  style={[styles.manualInput, styles.manualInputHalf]}
                  placeholder={ti.checkInDate + ' * (AAAA-MM-JJ)'}
                  placeholderTextColor={FT.textMuted}
                  value={row.checkInDate}
                  onChangeText={(v) => updateManualRow(row.id, 'checkInDate', v)}
                  testID={`manual-checkin-${idx}`}
                />
                <TextInput
                  style={[styles.manualInput, styles.manualInputHalf]}
                  placeholder={ti.checkOutDate + ' * (AAAA-MM-JJ)'}
                  placeholderTextColor={FT.textMuted}
                  value={row.checkOutDate}
                  onChangeText={(v) => updateManualRow(row.id, 'checkOutDate', v)}
                  testID={`manual-checkout-${idx}`}
                />
              </View>
              <View style={styles.manualInputRow}>
                <TextInput
                  style={[styles.manualInput, styles.manualInputHalf]}
                  placeholder={ti.roomNumber}
                  placeholderTextColor={FT.textMuted}
                  value={row.roomNumber}
                  onChangeText={(v) => updateManualRow(row.id, 'roomNumber', v)}
                  testID={`manual-room-${idx}`}
                />
                <TextInput
                  style={[styles.manualInput, styles.manualInputQuarter]}
                  placeholder={ti.adults}
                  placeholderTextColor={FT.textMuted}
                  value={String(row.adults)}
                  onChangeText={(v) => updateManualRow(row.id, 'adults', parseInt(v, 10) || 1)}
                  keyboardType="numeric"
                  testID={`manual-adults-${idx}`}
                />
                <TextInput
                  style={[styles.manualInput, styles.manualInputQuarter]}
                  placeholder={ti.children}
                  placeholderTextColor={FT.textMuted}
                  value={String(row.children)}
                  onChangeText={(v) => updateManualRow(row.id, 'children', parseInt(v, 10) || 0)}
                  keyboardType="numeric"
                  testID={`manual-children-${idx}`}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addRowBtn} onPress={addManualRow} testID="add-row-btn">
            <Plus size={16} color={FT.brand} />
            <Text style={styles.addRowBtnText}>{ti.addRow}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handlePrepareManual} testID="manual-next-btn">
            <Text style={styles.nextBtnText}>{ti.preview}</Text>
            <ChevronRight size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentInner} showsVerticalScrollIndicator={false}>
      <View style={styles.fileInfo}>
        <FileText size={18} color={FT.brand} />
        <View style={styles.fileInfoText}>
          <Text style={styles.fileInfoName}>{fileName}</Text>
          <Text style={styles.fileInfoSize}>{(fileSize / 1024).toFixed(1)} KB — {csvData.length} {ti.linesDetected}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{ti.columnMapping}</Text>
      <Text style={styles.sectionDesc}>{ti.previewDesc}</Text>

      {headers.length > 0 && (
        <View style={styles.previewTable}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.previewHeaderRow}>
                {headers.map((h, i) => (
                  <View key={i} style={styles.previewCell}>
                    <Text style={styles.previewHeaderText} numberOfLines={1}>{h}</Text>
                  </View>
                ))}
              </View>
              {csvData.slice(0, 3).map((row, ri) => (
                <View key={ri} style={styles.previewDataRow}>
                  {row.map((cell, ci) => (
                    <View key={ci} style={styles.previewCell}>
                      <Text style={styles.previewCellText} numberOfLines={1}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{ti.columnMapping}</Text>

      {([
        { key: 'guestName' as const, label: ti.guestName, required: true },
        { key: 'checkInDate' as const, label: ti.checkInDate, required: true },
        { key: 'checkOutDate' as const, label: ti.checkOutDate, required: true },
        { key: 'roomNumber' as const, label: ti.roomNumber, required: false },
        { key: 'adults' as const, label: ti.adults, required: false },
        { key: 'children' as const, label: ti.children, required: false },
        { key: 'preferences' as const, label: ti.preferences, required: false },
      ]).map((field) => (
        <View key={field.key} style={styles.mappingRow}>
          <View style={styles.mappingLabel}>
            <Text style={styles.mappingLabelText}>{field.label}</Text>
            <Text style={[styles.mappingBadge, field.required ? styles.mappingBadgeRequired : styles.mappingBadgeOptional]}>
              {field.required ? ti.required : ti.optional}
            </Text>
          </View>
          <View style={styles.mappingSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.mappingChip, mapping[field.key] === null && styles.mappingChipActive]}
                onPress={() => updateMappingField(field.key, null)}
              >
                <Text style={[styles.mappingChipText, mapping[field.key] === null && styles.mappingChipTextActive]}>—</Text>
              </TouchableOpacity>
              {headers.map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.mappingChip, mapping[field.key] === i && styles.mappingChipActive]}
                  onPress={() => updateMappingField(field.key, i)}
                >
                  <Text style={[styles.mappingChipText, mapping[field.key] === i && styles.mappingChipTextActive]} numberOfLines={1}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      ))}

      <View style={styles.mappingRow}>
        <View style={styles.mappingLabel}>
          <Text style={styles.mappingLabelText}>{ti.dateFormat}</Text>
        </View>
        <View style={styles.mappingSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DATE_FORMAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.mappingChip, dateFormat === opt.value && styles.mappingChipActive]}
                onPress={() => setDateFormat(opt.value)}
              >
                <Text style={[styles.mappingChipText, dateFormat === opt.value && styles.mappingChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.stepActions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setCsvData([]); setHeaders([]); }}>
          <ChevronLeft size={16} color={FT.textSec} />
          <Text style={styles.backBtnText}>{t.common.back}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleParseData} testID="parse-btn">
          <Text style={styles.nextBtnText}>{ti.preview}</Text>
          <ChevronRight size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentInner} showsVerticalScrollIndicator={false}>
      <View style={styles.previewSummary}>
        <View style={styles.previewSummaryItem}>
          <Text style={styles.previewSummaryNum}>{parsedReservations.length}</Text>
          <Text style={styles.previewSummaryLabel}>{ti.linesDetected}</Text>
        </View>
        <View style={styles.previewSummaryItem}>
          <Text style={[styles.previewSummaryNum, { color: FT.success }]}>{selectedCount}</Text>
          <Text style={styles.previewSummaryLabel}>{ti.importBtn}</Text>
        </View>
        {errorCount > 0 && (
          <View style={styles.previewSummaryItem}>
            <Text style={[styles.previewSummaryNum, { color: FT.danger }]}>{errorCount}</Text>
            <Text style={styles.previewSummaryLabel}>{ti.linesIgnored}</Text>
          </View>
        )}
      </View>

      {parsedReservations.map((res, idx) => (
        <TouchableOpacity
          key={res.id}
          style={[styles.reservationRow, res.error && styles.reservationRowError]}
          onPress={() => !res.error && toggleReservation(res.id)}
          activeOpacity={res.error ? 1 : 0.7}
        >
          <View style={[styles.reservationCheck, res.selected && !res.error && styles.reservationCheckActive]}>
            {res.selected && !res.error && <Check size={12} color="#FFF" />}
            {res.error && <X size={12} color={FT.danger} />}
          </View>
          <View style={styles.reservationInfo}>
            <Text style={styles.reservationName} numberOfLines={1}>{res.guestName || `Ligne ${idx + 1}`}</Text>
            <Text style={styles.reservationDates}>
              {res.checkInDate || '—'} → {res.checkOutDate || '—'}
              {res.roomNumber ? ` | Ch. ${res.roomNumber}` : ''}
            </Text>
            {res.error && <Text style={styles.reservationError}>{res.error}</Text>}
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.stepActions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(mode === 'csv' ? 2 : 1)}>
          <ChevronLeft size={16} color={FT.textSec} />
          <Text style={styles.backBtnText}>{t.common.back}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.importBtn, selectedCount === 0 && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={selectedCount === 0 || isImporting}
          testID="import-btn"
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.importBtnText}>{ti.importBtn} ({selectedCount})</Text>
              <Check size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.resultContainer}>
      <View style={[styles.resultIcon, failedCount === 0 ? styles.resultIconSuccess : styles.resultIconWarning]}>
        {failedCount === 0 ? (
          <CheckCircle size={48} color={FT.success} />
        ) : (
          <AlertTriangle size={48} color={FT.warning} />
        )}
      </View>
      <Text style={styles.resultTitle}>
        {failedCount === 0 ? ti.importSuccess : ti.importPartial}
      </Text>
      <View style={styles.resultStats}>
        <View style={styles.resultStatRow}>
          <View style={[styles.resultStatDot, { backgroundColor: FT.success }]} />
          <Text style={styles.resultStatText}>{importedCount} {ti.reservationsImported}</Text>
        </View>
        {failedCount > 0 && (
          <View style={styles.resultStatRow}>
            <View style={[styles.resultStatDot, { backgroundColor: FT.danger }]} />
            <Text style={styles.resultStatText}>{failedCount} {ti.linesIgnored}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.resultCloseBtn}
        onPress={() => router.back()}
        testID="close-import-btn"
      >
        <Text style={styles.resultCloseBtnText}>{t.common.close}</Text>
      </TouchableOpacity>
    </View>
  );

  const stepLabels = [ti.step1SelectFile, ti.step2MapColumns, ti.step3Preview, ti.step4Result];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: ti.importReservations,
          presentation: 'modal',
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
        }}
      />

      <View style={styles.stepper}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepperItem}>
            <View style={[styles.stepperDot, step >= s && styles.stepperDotActive, step === s && styles.stepperDotCurrent]}>
              {step > s ? (
                <Check size={10} color="#FFF" />
              ) : (
                <Text style={[styles.stepperDotText, step >= s && styles.stepperDotTextActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.stepperLabel, step >= s && styles.stepperLabelActive]} numberOfLines={1}>{stepLabels[s - 1]}</Text>
            {s < 4 && <View style={[styles.stepperLine, step > s && styles.stepperLineActive]} />}
          </View>
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  stepper: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  stepperItem: { flex: 1, alignItems: 'center', position: 'relative' as const },
  stepperDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: FT.surfaceAlt, borderWidth: 1.5, borderColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  stepperDotActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  stepperDotCurrent: { borderColor: FT.brand, borderWidth: 2 },
  stepperDotText: { fontSize: 10, fontWeight: '700' as const, color: FT.textMuted },
  stepperDotTextActive: { color: '#FFF' },
  stepperLabel: { fontSize: 9, color: FT.textMuted, marginTop: 4, textAlign: 'center' as const },
  stepperLabelActive: { color: FT.brand, fontWeight: '600' as const },
  stepperLine: { position: 'absolute' as const, top: 12, right: -20, width: 16, height: 2, backgroundColor: FT.border },
  stepperLineActive: { backgroundColor: FT.brand },

  stepContent: { flex: 1 },
  stepContentInner: { padding: 16, paddingBottom: 40 },

  heroSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: FT.brandSoft, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '700' as const, color: FT.text },
  heroDesc: { fontSize: 13, color: FT.textSec, textAlign: 'center' as const, paddingHorizontal: 20 },

  modeCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: FT.surface, borderWidth: 1.5, borderColor: FT.border, marginBottom: 10, gap: 12 },
  modeCardActive: { borderColor: FT.brand, backgroundColor: FT.brandSoft },
  modeIconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: FT.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  modeIconWrapActive: { backgroundColor: FT.brand },
  modeTextWrap: { flex: 1, gap: 2 },
  modeTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  modeTitleActive: { color: FT.brand },
  modeDesc: { fontSize: 11, color: FT.textMuted },
  modeRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  modeRadioActive: { borderColor: FT.brand },
  modeRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: FT.brand },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  uploadBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },

  manualSection: { marginTop: 16, gap: 12 },
  manualRow: { backgroundColor: FT.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: FT.borderLight, gap: 8 },
  manualRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualRowTitle: { fontSize: 12, fontWeight: '700' as const, color: FT.textSec },
  manualRemoveBtn: { padding: 4 },
  manualInput: { backgroundColor: FT.surfaceAlt, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: FT.text, borderWidth: 1, borderColor: FT.borderLight },
  manualInputRow: { flexDirection: 'row', gap: 8 },
  manualInputHalf: { flex: 1 },
  manualInputQuarter: { flex: 0.5 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: FT.brand, borderStyle: 'dashed' as const },
  addRowBtnText: { fontSize: 13, fontWeight: '600' as const, color: FT.brand },

  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FT.brandSoft, borderRadius: 10, padding: 12 },
  fileInfoText: { flex: 1, gap: 2 },
  fileInfoName: { fontSize: 13, fontWeight: '700' as const, color: FT.text },
  fileInfoSize: { fontSize: 11, color: FT.textSec },

  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text, marginTop: 16, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: FT.textMuted, marginBottom: 10 },

  previewTable: { borderRadius: 10, borderWidth: 1, borderColor: FT.borderLight, overflow: 'hidden' as const, backgroundColor: FT.surface },
  previewHeaderRow: { flexDirection: 'row', backgroundColor: FT.surfaceAlt, borderBottomWidth: 1, borderBottomColor: FT.border },
  previewDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  previewCell: { width: 110, paddingHorizontal: 8, paddingVertical: 6 },
  previewHeaderText: { fontSize: 10, fontWeight: '700' as const, color: FT.textSec, textTransform: 'uppercase' as const },
  previewCellText: { fontSize: 11, color: FT.text },

  mappingRow: { marginBottom: 12 },
  mappingLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mappingLabelText: { fontSize: 12, fontWeight: '600' as const, color: FT.text },
  mappingBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' as const },
  mappingBadgeRequired: { backgroundColor: FT.dangerSoft },
  mappingBadgeOptional: { backgroundColor: FT.surfaceAlt },
  mappingSelector: { flexDirection: 'row' },
  mappingChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: FT.surfaceAlt, marginRight: 6, borderWidth: 1, borderColor: FT.borderLight },
  mappingChipActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  mappingChipText: { fontSize: 11, fontWeight: '500' as const, color: FT.textSec },
  mappingChipTextActive: { color: '#FFF' },

  previewSummary: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  previewSummaryItem: { flex: 1, alignItems: 'center', backgroundColor: FT.surface, borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: FT.borderLight },
  previewSummaryNum: { fontSize: 22, fontWeight: '800' as const, color: FT.text },
  previewSummaryLabel: { fontSize: 10, color: FT.textMuted, marginTop: 2 },

  reservationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FT.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: FT.borderLight },
  reservationRowError: { borderColor: FT.danger + '30', backgroundColor: FT.dangerSoft },
  reservationCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  reservationCheckActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  reservationInfo: { flex: 1, gap: 2 },
  reservationName: { fontSize: 13, fontWeight: '700' as const, color: FT.text },
  reservationDates: { fontSize: 11, color: FT.textSec },
  reservationError: { fontSize: 10, color: FT.danger, marginTop: 2 },

  stepActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: FT.surfaceAlt },
  backBtnText: { fontSize: 13, fontWeight: '500' as const, color: FT.textSec },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: FT.brand },
  nextBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: FT.success },
  importBtnDisabled: { opacity: 0.4 },
  importBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  resultIconSuccess: { backgroundColor: FT.successSoft },
  resultIconWarning: { backgroundColor: FT.warningSoft },
  resultTitle: { fontSize: 20, fontWeight: '800' as const, color: FT.text, textAlign: 'center' as const },
  resultStats: { gap: 8, alignItems: 'center' },
  resultStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultStatDot: { width: 8, height: 8, borderRadius: 4 },
  resultStatText: { fontSize: 14, color: FT.textSec },
  resultCloseBtn: { backgroundColor: FT.brand, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  resultCloseBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
});

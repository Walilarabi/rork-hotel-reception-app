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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Upload, FileText, ChevronRight, ChevronLeft, Check, X, Plus, Trash2, AlertTriangle, CheckCircle, Coffee, Download, Sparkles, PlusCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as XLSX from 'xlsx';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { useTheme } from '@/providers/ThemeProvider';
import { useHotel } from '@/providers/HotelProvider';
import { FT } from '@/constants/flowtym';
import {
  ImportedReservation,
  ColumnMapping,
  DEFAULT_COLUMN_MAPPING,
  DateFormatOption,
  DATE_FORMAT_OPTIONS,
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

function tryParseAnyDate(value: string): string | null {
  if (!value) return null;
  const cleaned = value.trim();

  const patterns: Array<{ regex: RegExp; parse: (m: RegExpMatchArray) => { d: number; m: number; y: number } }> = [
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, parse: (m) => ({ y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) }) },
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, parse: (m) => ({ d: parseInt(m[1], 10), m: parseInt(m[2], 10), y: parseInt(m[3], 10) }) },
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, parse: (m) => ({ d: parseInt(m[1], 10), m: parseInt(m[2], 10), y: parseInt(m[3], 10) }) },
    { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/, parse: (m) => ({ d: parseInt(m[1], 10), m: parseInt(m[2], 10), y: parseInt(m[3], 10) }) },
  ];

  for (const pat of patterns) {
    const match = cleaned.match(pat.regex);
    if (match) {
      let { d, m: mo, y } = pat.parse(match);
      if (y < 100) y += 2000;
      if (mo > 12 && d <= 12) {
        const tmp = mo;
        mo = d;
        d = tmp;
      }
      if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
      const date = new Date(y, mo - 1, d);
      if (isNaN(date.getTime())) continue;
      const yyyy = date.getFullYear().toString().padStart(4, '0');
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  if (typeof cleaned === 'string' && !isNaN(Number(cleaned))) {
    const num = Number(cleaned);
    if (num > 30000 && num < 60000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + num * 86400000);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear().toString().padStart(4, '0');
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  return null;
}

function parseDate(value: string, format: DateFormatOption): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  let day: number, month: number, year: number;

  try {
    switch (format) {
      case 'dd/mm/yyyy': {
        const parts = cleaned.split('/');
        if (parts.length !== 3) return tryParseAnyDate(cleaned);
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'mm/dd/yyyy': {
        const parts = cleaned.split('/');
        if (parts.length !== 3) return tryParseAnyDate(cleaned);
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'yyyy-mm-dd': {
        const parts = cleaned.split('-');
        if (parts.length !== 3) return tryParseAnyDate(cleaned);
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
        break;
      }
      case 'dd-mm-yyyy': {
        const parts = cleaned.split('-');
        if (parts.length !== 3) return tryParseAnyDate(cleaned);
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case 'dd.mm.yyyy': {
        const parts = cleaned.split('.');
        if (parts.length !== 3) return tryParseAnyDate(cleaned);
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      default:
        return tryParseAnyDate(cleaned);
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return tryParseAnyDate(cleaned);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return tryParseAnyDate(cleaned);

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return tryParseAnyDate(cleaned);

    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return tryParseAnyDate(cleaned);
  }
}

function parseBreakfastValue(value: string): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return lower === 'oui' || lower === 'yes' || lower === 'true' || lower === '1' || lower === 'inclus' || lower === 'included' || lower === 'x' || lower === 'o';
}

function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { ...DEFAULT_COLUMN_MAPPING };
  const lowerHeaders = headers.map((h) => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];
    if (h.includes('nom') || h.includes('name') || h.includes('client') || h.includes('guest') || h.includes('hote') || h.includes('pax')) {
      if (mapping.guestName === null) mapping.guestName = i;
    } else if (h.includes('arrivee') || h.includes('check-in') || h.includes('checkin') || h.includes('debut') || h.includes('start') || h.includes('arrival') || h.includes('in') || h.includes('entree')) {
      if (mapping.checkInDate === null) mapping.checkInDate = i;
    } else if (h.includes('depart') || h.includes('check-out') || h.includes('checkout') || h.includes('fin') || h.includes('end') || h.includes('out') || h.includes('sortie')) {
      if (mapping.checkOutDate === null) mapping.checkOutDate = i;
    } else if (h.includes('chambre') || h.includes('room') || h.includes('numero') || h.includes('number') || h.includes('zimmer') || h.includes('habitacion') || h.includes('camera') || h.includes('n°') || h.includes('no')) {
      if (mapping.roomNumber === null) mapping.roomNumber = i;
    } else if (h.includes('adulte') || h.includes('adult') || h.includes('nb adulte')) {
      mapping.adults = i;
    } else if (h.includes('enfant') || h.includes('child') || h.includes('kinder') || h.includes('bambini')) {
      mapping.children = i;
    } else if (h.includes('preference') || h.includes('note') || h.includes('commentaire') || h.includes('comment') || h.includes('remark') || h.includes('remarque')) {
      mapping.preferences = i;
    } else if (h.includes('petit') || h.includes('dejeuner') || h.includes('pdj') || h.includes('breakfast') || h.includes('petit-dej') || h.includes('petit dej')) {
      mapping.breakfastIncluded = i;
    }
  }

  return mapping;
}

function autoDetectDateFormat(rows: string[][], dateColIdx: number): DateFormatOption {
  for (const row of rows.slice(0, 10)) {
    const val = row[dateColIdx]?.trim() ?? '';
    if (!val) continue;
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(val)) return 'yyyy-mm-dd';
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) return 'dd/mm/yyyy';
    if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(val)) return 'dd-mm-yyyy';
    if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(val)) return 'dd.mm.yyyy';
  }
  return 'dd/mm/yyyy';
}

async function parseExcelFile(uri: string): Promise<{ headers: string[]; rows: string[][] }> {
  console.log('[Import] Parsing Excel file from URI:', uri);
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Aucune feuille trouvée dans le fichier');
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

    if (jsonData.length < 2) throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données');

    const headers = (jsonData[0] as string[]).map((h) => String(h ?? '').trim());
    const rows = jsonData.slice(1).filter((row) => {
      const arr = row as string[];
      return arr.some((cell) => String(cell ?? '').trim().length > 0);
    }).map((row) => (row as string[]).map((cell) => String(cell ?? '').trim()));

    console.log('[Import] Excel parsed successfully. Headers:', headers, 'Rows:', rows.length);
    return { headers, rows };
  } catch (e) {
    console.log('[Import] Excel parse error:', e);
    throw e;
  }
}

async function parseTextFile(uri: string): Promise<string> {
  console.log('[Import] Reading text from URI:', uri);
  const response = await fetch(uri);
  const text = await response.text();
  console.log('[Import] Text content length:', text.length);
  return text;
}

const reservationExtractionSchema = z.object({
  reservations: z.array(z.object({
    guestName: z.string().describe('Nom complet du client / guest full name'),
    roomNumber: z.string().describe('Numéro de chambre / room number'),
    checkInDate: z.string().describe('Date d\'arrivée au format YYYY-MM-DD'),
    checkOutDate: z.string().describe('Date de départ au format YYYY-MM-DD'),
    adults: z.number().optional().describe('Nombre d\'adultes'),
    children: z.number().optional().describe('Nombre d\'enfants'),
    preferences: z.string().optional().describe('Notes ou préférences'),
    breakfastIncluded: z.boolean().optional().describe('Petit-déjeuner inclus'),
  })),
});

type ExtractedReservation = z.infer<typeof reservationExtractionSchema>['reservations'][number];

async function readFileAsBase64(uri: string): Promise<string> {
  console.log('[Import] Reading file as base64 from URI:', uri);
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);
  console.log('[Import] Base64 length:', base64.length);
  return base64;
}

async function extractReservationsFromPDFWithAI(base64Content: string): Promise<ExtractedReservation[]> {
  console.log('[Import] Sending PDF to AI for extraction...');
  const dataUri = `data:application/pdf;base64,${base64Content}`;

  const result = await generateObject({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyse ce document PDF contenant des réservations d'hôtel. Extrais TOUTES les réservations trouvées dans le document.

Pour chaque réservation, extrais :
- guestName : Le nom complet du client
- roomNumber : Le numéro de chambre (en string)
- checkInDate : La date d'arrivée au format YYYY-MM-DD
- checkOutDate : La date de départ au format YYYY-MM-DD
- adults : Le nombre d'adultes (par défaut 1 si non précisé)
- children : Le nombre d'enfants (par défaut 0 si non précisé)
- preferences : Les notes, remarques ou préférences
- breakfastIncluded : Si le petit-déjeuner est inclus (true/false)

Si une information n'est pas disponible, utilise une valeur par défaut raisonnable.
Retourne les dates au format YYYY-MM-DD uniquement.`,
          },
          {
            type: 'image',
            image: dataUri,
          },
        ],
      },
    ],
    schema: reservationExtractionSchema,
  });

  console.log('[Import] AI extracted', result.reservations.length, 'reservations');
  return result.reservations;
}

export default function ImportReservationsScreen() {
  const router = useRouter();
  const { t } = useTheme();
  const { rooms, bulkImportReservations, isBulkImportingReservations } = useHotel();
  const params = useLocalSearchParams<{ mode?: string }>();
  const ti = t.fileImport;

  const initialMode = (params.mode === 'csv' || params.mode === 'excel' || params.mode === 'pdf' || params.mode === 'image') ? params.mode : 'csv';
  const [step, setStep] = useState<ImportStep>(1);
  const [mode, setMode] = useState<ImportMode>(initialMode);
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
  const [isParsing, setIsParsing] = useState(false);

  const [manualRows, setManualRows] = useState<ImportedReservation[]>([
    { id: generateId(), guestName: '', checkInDate: '', checkOutDate: '', roomNumber: '', adults: 1, children: 0, preferences: '', breakfastIncluded: false, selected: true, error: null },
  ]);

  const handleDownloadTemplate = useCallback(async () => {
    console.log('[Import] Generating template file');
    try {
      const templateHeaders = [
        'Chambre', 'Nom du client', 'Date arrivée', 'Date départ',
        'Adultes', 'Enfants', 'Petit-déjeuner', 'Préférences'
      ];
      const templateRows = [
        ['101', 'Jean Dupont', '15/03/2026', '18/03/2026', '2', '0', 'Oui', 'Vue mer'],
        ['205', 'Marie Martin', '16/03/2026', '20/03/2026', '1', '1', 'Non', ''],
        ['312', 'Pierre Bernard', '15/03/2026', '17/03/2026', '2', '2', 'Oui', 'Lit bébé'],
        ['404', 'Sophie Leroy', '17/03/2026', '22/03/2026', '1', '0', 'Oui', 'Étage élevé'],
        ['108', 'Ahmed Benali', '15/03/2026', '16/03/2026', '2', '0', 'Non', 'Late check-in'],
      ];

      const wsData = [templateHeaders, ...templateRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 10 }, { wch: 22 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 24 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Import Clients');

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, 'modele_import_clients.xlsx');
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const { File, Paths } = await import('expo-file-system');
        const file = new File(Paths.cache, 'modele_import_clients.xlsx');
        const binaryString = atob(wbout);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        file.write(bytes);
        Alert.alert('Modèle généré', 'Le fichier modèle a été enregistré. Vous pouvez le retrouver dans vos fichiers.');
      }

      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('[Import] Template generated successfully');
    } catch (e) {
      console.log('[Import] Template generation error:', e);
      Alert.alert('Erreur', 'Impossible de générer le modèle : ' + String(e));
    }
  }, []);

  const getMimeTypes = useCallback((m: ImportMode): string[] => {
    switch (m) {
      case 'csv': return ['text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values'];
      case 'excel': return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.oasis.opendocument.spreadsheet'];
      case 'image': return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case 'pdf': return ['application/pdf', 'text/plain'];
      default: return ['*/*'];
    }
  }, []);

  const processCSVContent = useCallback((content: string) => {
    const detectedSep = detectSeparator(content);
    setSeparator(detectedSep);

    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      Alert.alert(ti.parseError, 'Le fichier doit contenir au moins un en-tête et une ligne de données.');
      return;
    }

    const headerRow = parseCSVLine(lines[0], detectedSep);
    setHeaders(headerRow);

    const dataRows = lines.slice(1).map((line) => parseCSVLine(line, detectedSep));
    setCsvData(dataRows);

    const autoMapping = autoDetectMapping(headerRow);
    setMapping(autoMapping);

    if (autoMapping.checkInDate !== null) {
      const detectedFmt = autoDetectDateFormat(dataRows, autoMapping.checkInDate);
      setDateFormat(detectedFmt);
    }

    setStep(2);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [ti.parseError]);

  const processExcelContent = useCallback(async (uri: string) => {
    setIsParsing(true);
    try {
      const { headers: excelHeaders, rows: excelRows } = await parseExcelFile(uri);
      setHeaders(excelHeaders);
      setCsvData(excelRows);

      const autoMapping = autoDetectMapping(excelHeaders);
      setMapping(autoMapping);

      if (autoMapping.checkInDate !== null) {
        const detectedFmt = autoDetectDateFormat(excelRows, autoMapping.checkInDate);
        setDateFormat(detectedFmt);
      }

      setStep(2);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.log('[Import] Excel processing error:', e);
      Alert.alert(ti.parseError, `Erreur lors du traitement du fichier Excel : ${String(e)}`);
    } finally {
      setIsParsing(false);
    }
  }, [ti.parseError]);

  const processPDFContent = useCallback(async (uri: string) => {
    setIsParsing(true);
    try {
      let content = '';
      let isBinaryPDF = false;
      try {
        const response = await fetch(uri);
        content = await response.text();
        isBinaryPDF = content.length < 10 || content.startsWith('%PDF');
      } catch {
        isBinaryPDF = true;
      }

      if (!isBinaryPDF) {
        const detectedSep = detectSeparator(content);
        setSeparator(detectedSep);
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length >= 2) {
          const headerRow = parseCSVLine(lines[0], detectedSep);
          setHeaders(headerRow);
          const dataRows = lines.slice(1).map((line) => parseCSVLine(line, detectedSep));
          setCsvData(dataRows);
          const autoMapping = autoDetectMapping(headerRow);
          setMapping(autoMapping);
          if (autoMapping.checkInDate !== null) {
            setDateFormat(autoDetectDateFormat(dataRows, autoMapping.checkInDate));
          }
          setStep(2);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return;
        }
      }

      console.log('[Import] PDF is binary, using AI extraction...');
      const base64 = await readFileAsBase64(uri);
      const extracted = await extractReservationsFromPDFWithAI(base64);

      if (!extracted || extracted.length === 0) {
        Alert.alert(
          'Aucune réservation détectée',
          'L\'IA n\'a pas pu extraire de réservations depuis ce PDF. Vérifiez que le fichier contient bien des données de réservation (nom client, chambre, dates).\n\nVous pouvez aussi essayer la saisie manuelle.',
          [{ text: 'OK' }]
        );
        return;
      }

      const aiHeaders = ['Nom client', 'N° Chambre', 'Arrivée', 'Départ', 'Adultes', 'Enfants', 'Préférences', 'Petit-déj'];
      const aiRows = extracted.map((r) => [
        r.guestName ?? '',
        r.roomNumber ?? '',
        r.checkInDate ?? '',
        r.checkOutDate ?? '',
        String(r.adults ?? 1),
        String(r.children ?? 0),
        r.preferences ?? '',
        r.breakfastIncluded ? 'Oui' : 'Non',
      ]);

      setHeaders(aiHeaders);
      setCsvData(aiRows);
      setMapping({
        guestName: 0,
        roomNumber: 1,
        checkInDate: 2,
        checkOutDate: 3,
        adults: 4,
        children: 5,
        preferences: 6,
        breakfastIncluded: 7,
      });
      setDateFormat('yyyy-mm-dd');
      setStep(2);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('[Import] AI extraction complete:', extracted.length, 'reservations found');
    } catch (e) {
      console.log('[Import] PDF processing error:', e);
      Alert.alert(
        'Erreur d\'extraction PDF',
        `L'extraction des données a échoué : ${String(e)}\n\nVeuillez réessayer ou utiliser un autre format (CSV, Excel) ou la saisie manuelle.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsParsing(false);
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
      console.log('[Import] File picked:', asset.name, asset.size, asset.mimeType);
      setFileName(asset.name);
      setFileSize(asset.size ?? 0);

      if (mode === 'image') {
        Alert.alert(
          'Image non supportée',
          'L\'extraction OCR depuis les images nécessite un service externe. Veuillez :\n\n1. Copier les données de l\'image dans un fichier Excel ou CSV\n2. Importer le fichier converti\n3. Ou utiliser la saisie manuelle',
          [{ text: 'OK' }]
        );
        return;
      }

      if (mode === 'pdf') {
        await processPDFContent(asset.uri);
        return;
      }

      if (mode === 'excel') {
        await processExcelContent(asset.uri);
        return;
      }

      let content = '';
      try {
        content = await parseTextFile(asset.uri);
      } catch (e) {
        console.log('[Import] Error reading file content:', e);
        Alert.alert(ti.parseError, 'Impossible de lire le fichier. Essayez un autre format.');
        return;
      }

      processCSVContent(content);
    } catch (error) {
      console.log('[Import] Error picking file:', error);
      Alert.alert(ti.parseError, String(error));
    }
  }, [ti.parseError, mode, getMimeTypes, processCSVContent, processExcelContent, processPDFContent]);

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
      const roomNumber = mapping.roomNumber !== null ? (row[mapping.roomNumber] ?? '').replace(/\s/g, '') : '';
      const adults = mapping.adults !== null ? parseInt(row[mapping.adults] ?? '1', 10) || 1 : 1;
      const children = mapping.children !== null ? parseInt(row[mapping.children] ?? '0', 10) || 0 : 0;
      const preferences = mapping.preferences !== null ? (row[mapping.preferences] ?? '') : '';
      const breakfastIncluded = mapping.breakfastIncluded !== null ? parseBreakfastValue(row[mapping.breakfastIncluded] ?? '') : false;

      const checkInDate = parseDate(rawCheckIn, dateFormat);
      const checkOutDate = parseDate(rawCheckOut, dateFormat);

      const roomExists = roomNumber ? rooms.some((r) => r.roomNumber === roomNumber) : false;
      const willCreateRoom = !!(roomNumber && !roomExists);

      let error: string | null = null;
      if (!guestName) error = ti.missingRequired + ': ' + ti.guestName;
      else if (!checkInDate) error = ti.invalidDate + ': ' + rawCheckIn;
      else if (!checkOutDate) error = ti.invalidDate + ': ' + rawCheckOut;
      else if (!roomNumber) error = 'N° chambre manquant';

      return {
        id: `csv-${idx}-${Date.now()}`,
        guestName,
        checkInDate: checkInDate ?? '',
        checkOutDate: checkOutDate ?? '',
        roomNumber,
        adults,
        children,
        preferences,
        breakfastIncluded,
        selected: error === null,
        error,
        willCreateRoom,
      };
    });

    setParsedReservations(parsed);
    setStep(3);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [csvData, mapping, dateFormat, rooms, ti, t.common.error]);

  const handlePrepareManual = useCallback(() => {
    const validated = manualRows.map((row) => {
      const roomExists = row.roomNumber ? rooms.some((r) => r.roomNumber === row.roomNumber) : false;
      const willCreateRoom = !!(row.roomNumber && !roomExists);
      let error: string | null = null;
      if (!row.guestName) error = ti.missingRequired + ': ' + ti.guestName;
      else if (!row.checkInDate) error = ti.missingRequired + ': ' + ti.checkInDate;
      else if (!row.checkOutDate) error = ti.missingRequired + ': ' + ti.checkOutDate;
      else if (!row.roomNumber) error = 'N° chambre manquant';
      return { ...row, selected: error === null, error, willCreateRoom };
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

    try {
      const toImport = parsedReservations.filter((r) => r.selected && !r.error);

      const reservationsData = toImport.map((res) => ({
        roomNumber: res.roomNumber,
        guestName: res.guestName,
        checkInDate: res.checkInDate,
        checkOutDate: res.checkOutDate,
        adults: res.adults,
        children: res.children,
        preferences: res.preferences,
        breakfastIncluded: res.breakfastIncluded,
      }));

      const result = await bulkImportReservations(reservationsData);

      setImportedCount(result.imported);
      setFailedCount(result.failed);
      setStep(4);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('[Import] Import error:', error);
      Alert.alert(t.common.error, String(error));
    } finally {
      setIsImporting(false);
    }
  }, [parsedReservations, selectedCount, bulkImportReservations, t.common.error]);

  const addManualRow = useCallback(() => {
    setManualRows((prev) => [
      ...prev,
      { id: generateId(), guestName: '', checkInDate: '', checkOutDate: '', roomNumber: '', adults: 1, children: 0, preferences: '', breakfastIncluded: false, selected: true, error: null },
    ]);
  }, []);

  const removeManualRow = useCallback((id: string) => {
    setManualRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateManualRow = useCallback((id: string, field: keyof ImportedReservation, value: string | number | boolean) => {
    setManualRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const updateMappingField = useCallback((field: keyof ColumnMapping, value: number | null) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const getStatusPreview = useCallback((checkIn: string, checkOut: string): { label: string; color: string } => {
    if (!checkIn || !checkOut) return { label: '—', color: FT.textMuted };
    if (checkOut <= today) return { label: 'Départ', color: '#E53935' };
    if (checkIn <= today) return { label: 'Occupé', color: '#43A047' };
    return { label: 'À venir', color: '#1E88E5' };
  }, [today]);

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentInner} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Upload size={32} color={FT.brand} />
        </View>
        <Text style={styles.heroTitle}>{ti.noPms}</Text>
        <Text style={styles.heroDesc}>{ti.noPmsDesc}</Text>
      </View>

      <TouchableOpacity
        style={styles.templateBtn}
        onPress={handleDownloadTemplate}
        activeOpacity={0.7}
        testID="download-template-btn"
      >
        <View style={styles.templateBtnIcon}>
          <Download size={18} color={FT.brand} />
        </View>
        <View style={styles.templateBtnContent}>
          <Text style={styles.templateBtnTitle}>Télécharger le modèle Excel</Text>
          <Text style={styles.templateBtnDesc}>Fichier .xlsx pré-rempli avec les colonnes attendues et des exemples</Text>
        </View>
        <ChevronRight size={16} color={FT.textMuted} />
      </TouchableOpacity>

      {([{ key: 'csv' as const, label: 'CSV / Texte', desc: '.csv, .tsv, .txt', icon: 'text' },
        { key: 'excel' as const, label: 'Excel', desc: '.xlsx, .xls, .ods', icon: 'spreadsheet' },
        { key: 'image' as const, label: 'Image (OCR)', desc: '.jpg, .png, .gif', icon: 'image' },
        { key: 'pdf' as const, label: 'PDF (IA)', desc: '.pdf — extraction automatique par IA', icon: 'pdf' },
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

      {mode === 'pdf' && (
        <View style={styles.aiInfoBanner}>
          <Sparkles size={16} color="#7C3AED" />
          <Text style={styles.aiInfoBannerText}>
            {'L\'IA analysera automatiquement votre PDF pour en extraire les réservations (noms, chambres, dates...). Formats variés acceptés.'}
          </Text>
        </View>
      )}

      {mode !== 'manual' && (
        <TouchableOpacity
          style={[styles.uploadBtn, isParsing && styles.uploadBtnDisabled]}
          onPress={handlePickFile}
          activeOpacity={0.7}
          disabled={isParsing}
          testID="pick-file-btn"
        >
          {isParsing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : mode === 'pdf' ? (
            <Sparkles size={18} color="#FFF" />
          ) : (
            <Upload size={18} color="#FFF" />
          )}
          <Text style={styles.uploadBtnText}>{isParsing ? 'Extraction IA en cours...' : ti.selectFile}</Text>
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
                  placeholder={'N° Chambre *'}
                  placeholderTextColor={FT.textMuted}
                  value={row.roomNumber}
                  onChangeText={(v) => updateManualRow(row.id, 'roomNumber', v)}
                  testID={`manual-room-${idx}`}
                />
                <TouchableOpacity
                  style={[styles.breakfastToggle, row.breakfastIncluded && styles.breakfastToggleActive]}
                  onPress={() => updateManualRow(row.id, 'breakfastIncluded', !row.breakfastIncluded)}
                >
                  <Coffee size={14} color={row.breakfastIncluded ? '#FFF' : FT.textMuted} />
                  <Text style={[styles.breakfastToggleText, row.breakfastIncluded && styles.breakfastToggleTextActive]}>
                    {'PDJ'}
                  </Text>
                </TouchableOpacity>
              </View>
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

      <Text style={styles.sectionTitle}>{'Aperçu des données'}</Text>
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
        { key: 'roomNumber' as const, label: ti.roomNumber, required: true },
        { key: 'breakfastIncluded' as const, label: 'Petit-déjeuner inclus', required: false },
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
                <Text style={[styles.mappingChipText, mapping[field.key] === null && styles.mappingChipTextActive]}>{'—'}</Text>
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

      <View style={styles.overwriteWarning}>
        <AlertTriangle size={16} color={FT.warning} />
        <Text style={styles.overwriteWarningText}>
          {'L\'import écrasera les données existantes des chambres concernées (client, dates, PDJ).'}
        </Text>
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
          <Text style={styles.previewSummaryLabel}>{'À importer'}</Text>
        </View>
        {errorCount > 0 && (
          <View style={styles.previewSummaryItem}>
            <Text style={[styles.previewSummaryNum, { color: FT.danger }]}>{errorCount}</Text>
            <Text style={styles.previewSummaryLabel}>{ti.linesIgnored}</Text>
          </View>
        )}
      </View>

      {parsedReservations.map((res, idx) => {
        const statusPreview = getStatusPreview(res.checkInDate, res.checkOutDate);
        return (
          <TouchableOpacity
            key={res.id}
            style={[styles.reservationRow, res.error && styles.reservationRowError, !res.error && res.willCreateRoom && styles.reservationRowNewRoom]}
            onPress={() => !res.error && toggleReservation(res.id)}
            activeOpacity={res.error ? 1 : 0.7}
          >
            <View style={[styles.reservationCheck, res.selected && !res.error && styles.reservationCheckActive]}>
              {res.selected && !res.error && <Check size={12} color="#FFF" />}
              {res.error && <X size={12} color={FT.danger} />}
            </View>
            <View style={styles.reservationInfo}>
              <View style={styles.reservationHeaderRow}>
                <Text style={styles.reservationName} numberOfLines={1}>{res.guestName || `Ligne ${idx + 1}`}</Text>
                {res.roomNumber ? (
                  <View style={[styles.reservationRoomBadge, res.willCreateRoom && styles.reservationRoomBadgeNew]}>
                    <Text style={[styles.reservationRoomText, res.willCreateRoom && styles.reservationRoomTextNew]}>{'Ch. '}{res.roomNumber}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.reservationMetaRow}>
                <Text style={styles.reservationDates}>
                  {res.checkInDate || '—'} {'→'} {res.checkOutDate || '—'}
                </Text>
                {!res.error && (
                  <View style={[styles.statusBadge, { backgroundColor: statusPreview.color + '18' }]}>
                    <Text style={[styles.statusBadgeText, { color: statusPreview.color }]}>{statusPreview.label}</Text>
                  </View>
                )}
                {res.breakfastIncluded && (
                  <View style={styles.pdjBadge}>
                    <Coffee size={10} color={FT.success} />
                    <Text style={styles.pdjBadgeText}>{'PDJ'}</Text>
                  </View>
                )}
              </View>
              {res.error && <Text style={styles.reservationError}>{res.error}</Text>}
              {!res.error && res.willCreateRoom && (
                <View style={styles.newRoomIndicator}>
                  <PlusCircle size={10} color="#F59E0B" />
                  <Text style={styles.newRoomIndicatorText}>{'Chambre sera cr\u00e9\u00e9e automatiquement'}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.stepActions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
          <ChevronLeft size={16} color={FT.textSec} />
          <Text style={styles.backBtnText}>{t.common.back}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.importBtn, (selectedCount === 0 || isImporting || isBulkImportingReservations) && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={selectedCount === 0 || isImporting || isBulkImportingReservations}
          testID="import-btn"
        >
          {isImporting || isBulkImportingReservations ? (
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
      <Text style={styles.resultSubtitle}>
        {'Les données existantes ont été écrasées.'}
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

  templateBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 14, borderRadius: 12, backgroundColor: '#EBF5FF', borderWidth: 1.5, borderColor: '#B3D9FF', marginBottom: 18, gap: 12 },
  templateBtnIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#DBEAFE', justifyContent: 'center' as const, alignItems: 'center' as const },
  templateBtnContent: { flex: 1, gap: 2 },
  templateBtnTitle: { fontSize: 13, fontWeight: '700' as const, color: FT.brand },
  templateBtnDesc: { fontSize: 11, color: '#5B8DB8', lineHeight: 15 },

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
  uploadBtnDisabled: { opacity: 0.6 },

  manualSection: { marginTop: 16, gap: 12 },
  manualRow: { backgroundColor: FT.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: FT.borderLight, gap: 8 },
  manualRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualRowTitle: { fontSize: 12, fontWeight: '700' as const, color: FT.textSec },
  manualRemoveBtn: { padding: 4 },
  manualInput: { backgroundColor: FT.surfaceAlt, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: FT.text, borderWidth: 1, borderColor: FT.borderLight },
  manualInputRow: { flexDirection: 'row', gap: 8 },
  manualInputHalf: { flex: 1 },
  manualInputQuarter: { flex: 0.5 },
  breakfastToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.borderLight },
  breakfastToggleActive: { backgroundColor: FT.success, borderColor: FT.success },
  breakfastToggleText: { fontSize: 12, fontWeight: '600' as const, color: FT.textMuted },
  breakfastToggleTextActive: { color: '#FFF' },
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

  overwriteWarning: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  overwriteWarningText: { fontSize: 12, color: '#E65100', flex: 1, lineHeight: 18 },

  previewSummary: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  previewSummaryItem: { flex: 1, alignItems: 'center', backgroundColor: FT.surface, borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: FT.borderLight },
  previewSummaryNum: { fontSize: 22, fontWeight: '800' as const, color: FT.text },
  previewSummaryLabel: { fontSize: 10, color: FT.textMuted, marginTop: 2 },

  reservationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FT.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: FT.borderLight },
  reservationRowError: { borderColor: FT.danger + '30', backgroundColor: FT.dangerSoft },
  reservationCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: FT.border, justifyContent: 'center', alignItems: 'center' },
  reservationCheckActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  reservationInfo: { flex: 1, gap: 3 },
  reservationHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reservationName: { fontSize: 13, fontWeight: '700' as const, color: FT.text, flexShrink: 1 },
  reservationRoomBadge: { backgroundColor: FT.brandSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  reservationRoomText: { fontSize: 10, fontWeight: '700' as const, color: FT.brand },
  reservationMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reservationDates: { fontSize: 11, color: FT.textSec },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '700' as const },
  pdjBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(67,160,71,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pdjBadgeText: { fontSize: 9, fontWeight: '700' as const, color: FT.success },
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
  resultSubtitle: { fontSize: 13, color: FT.textSec, textAlign: 'center' as const },
  resultStats: { gap: 8, alignItems: 'center' },
  resultStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultStatDot: { width: 8, height: 8, borderRadius: 4 },
  resultStatText: { fontSize: 14, color: FT.textSec },
  resultCloseBtn: { backgroundColor: FT.brand, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  resultCloseBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },

  aiInfoBanner: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: '#F3E8FF', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  aiInfoBannerText: { fontSize: 12, color: '#6D28D9', flex: 1, lineHeight: 18 },

  reservationRowNewRoom: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  reservationRoomBadgeNew: { backgroundColor: '#FEF3C7' },
  reservationRoomTextNew: { color: '#B45309' },
  newRoomIndicator: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 2 },
  newRoomIndicatorText: { fontSize: 10, color: '#F59E0B' },
});

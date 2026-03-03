import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  X,
  FileText,
  BarChart3,
  BedDouble,
  Package,
  TrendingUp,
  Building2,
  Download,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FT } from '@/constants/flowtym';

interface ExportPDFModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  showRoomList?: boolean;
  showConsumptions?: boolean;
  showCharts?: boolean;
}

type PeriodOption = 'today' | 'week' | 'month' | 'custom';

const PERIOD_OPTIONS: { id: PeriodOption; label: string; icon: string }[] = [
  { id: 'today', label: "Aujourd'hui", icon: '📅' },
  { id: 'week', label: 'Cette semaine', icon: '📆' },
  { id: 'month', label: 'Ce mois', icon: '🗓️' },
  { id: 'custom', label: 'Personnalisé', icon: '⚙️' },
];

export default function ExportPDFModal({
  visible,
  onClose,
  title,
  showRoomList = true,
  showConsumptions = true,
  showCharts = true,
}: ExportPDFModalProps) {
  const [period, setPeriod] = useState<PeriodOption>('today');
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeRoomList, setIncludeRoomList] = useState(true);
  const [includeConsumptions, setIncludeConsumptions] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeHotelInfo, setIncludeHotelInfo] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setGenerated(false);

    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        Alert.alert(
          'Rapport généré',
          `Le rapport "${title}" a été généré avec succès.\n\nPériode : ${PERIOD_OPTIONS.find((p) => p.id === period)?.label}\nOrientation : ${orientation === 'portrait' ? 'Portrait' : 'Paysage'}\n\nLe fichier PDF est prêt au téléchargement.`,
          [
            {
              text: 'Télécharger',
              onPress: () => {
                Alert.alert('Téléchargement', 'Le PDF a été enregistré dans vos fichiers.');
                setGenerated(false);
                onClose();
              },
            },
            { text: 'Fermer', style: 'cancel', onPress: () => setGenerated(false) },
          ]
        );
      }, 300);
    }, 1500);
  }, [title, period, orientation, onClose]);

  const handleClose = useCallback(() => {
    setGenerated(false);
    onClose();
  }, [onClose]);

  const sections = [
    { key: 'kpis', label: 'KPIs & Indicateurs', icon: BarChart3, value: includeKPIs, setter: setIncludeKPIs, show: true },
    { key: 'rooms', label: 'Liste des chambres', icon: BedDouble, value: includeRoomList, setter: setIncludeRoomList, show: showRoomList },
    { key: 'consumptions', label: 'Détail consommations', icon: Package, value: includeConsumptions, setter: setIncludeConsumptions, show: showConsumptions },
    { key: 'charts', label: 'Graphiques', icon: TrendingUp, value: includeCharts, setter: setIncludeCharts, show: showCharts },
    { key: 'hotel', label: "Informations hôtel", icon: Building2, value: includeHotelInfo, setter: setIncludeHotelInfo, show: true },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <FileText size={20} color={FT.brand} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Exporter en PDF</Text>
              <Text style={styles.headerSub}>{title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={FT.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Période</Text>
              <View style={styles.periodGrid}>
                {PERIOD_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.periodChip, period === opt.id && styles.periodChipActive]}
                    onPress={() => setPeriod(opt.id)}
                  >
                    <Text style={styles.periodIcon}>{opt.icon}</Text>
                    <Text style={[styles.periodLabel, period === opt.id && styles.periodLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Sections à inclure</Text>
              <View style={styles.toggleList}>
                {sections.filter((s) => s.show).map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <View key={sec.key} style={styles.toggleRow}>
                      <View style={[styles.toggleIcon, sec.value && { backgroundColor: FT.brand + '12' }]}>
                        <Icon size={16} color={sec.value ? FT.brand : FT.textMuted} />
                      </View>
                      <Text style={[styles.toggleLabel, !sec.value && { color: FT.textMuted }]}>{sec.label}</Text>
                      <Switch
                        value={sec.value}
                        onValueChange={sec.setter}
                        trackColor={{ false: FT.border, true: FT.brand + '50' }}
                        thumbColor={sec.value ? FT.brand : '#f4f3f4'}
                        style={styles.toggleSwitch}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Mise en page</Text>
              <View style={styles.orientationRow}>
                <TouchableOpacity
                  style={[styles.orientBtn, orientation === 'portrait' && styles.orientBtnActive]}
                  onPress={() => setOrientation('portrait')}
                >
                  <View style={[styles.orientPreview, { width: 24, height: 32 }]}>
                    <View style={styles.orientLine} />
                    <View style={styles.orientLine} />
                    <View style={[styles.orientLine, { width: '60%' }]} />
                  </View>
                  <Text style={[styles.orientLabel, orientation === 'portrait' && styles.orientLabelActive]}>Portrait</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orientBtn, orientation === 'landscape' && styles.orientBtnActive]}
                  onPress={() => setOrientation('landscape')}
                >
                  <View style={[styles.orientPreview, { width: 32, height: 24 }]}>
                    <View style={styles.orientLine} />
                    <View style={styles.orientLine} />
                    <View style={[styles.orientLine, { width: '60%' }]} />
                  </View>
                  <Text style={[styles.orientLabel, orientation === 'landscape' && styles.orientLabelActive]}>Paysage</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {generated ? (
              <View style={styles.successBanner}>
                <CheckCircle size={18} color={FT.success} />
                <Text style={styles.successText}>Rapport généré avec succès</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                <Download size={18} color="#FFF" />
                <Text style={styles.generateBtnText}>
                  {isGenerating ? 'Génération en cours...' : 'Générer le PDF'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: FT.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
    backgroundColor: FT.surface,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: FT.text },
  headerSub: { fontSize: 12, color: FT.textMuted },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: FT.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 20 },
  sectionGroup: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, color: FT.textSec, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 10 },

  periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: FT.surface,
    borderWidth: 1,
    borderColor: FT.border,
  },
  periodChipActive: {
    backgroundColor: FT.brandSoft,
    borderColor: FT.brand,
  },
  periodIcon: { fontSize: 14 },
  periodLabel: { fontSize: 13, fontWeight: '500' as const, color: FT.textSec },
  periodLabelActive: { color: FT.brand, fontWeight: '600' as const },

  toggleList: {
    backgroundColor: FT.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FT.border,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FT.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: FT.text },
  toggleSwitch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  orientationRow: { flexDirection: 'row', gap: 12 },
  orientBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: FT.surface,
    borderWidth: 1.5,
    borderColor: FT.border,
  },
  orientBtnActive: {
    borderColor: FT.brand,
    backgroundColor: FT.brandSoft,
  },
  orientPreview: {
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: FT.border,
    padding: 3,
    justifyContent: 'center',
    gap: 2,
  },
  orientLine: {
    height: 2,
    width: '100%',
    backgroundColor: FT.border,
    borderRadius: 1,
  },
  orientLabel: { fontSize: 12, fontWeight: '600' as const, color: FT.textSec },
  orientLabelActive: { color: FT.brand },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: FT.border,
    backgroundColor: FT.surface,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: FT.brand,
    paddingVertical: 16,
    borderRadius: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: FT.success + '10',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FT.success + '25',
  },
  successText: { fontSize: 14, fontWeight: '600' as const, color: FT.success },
});

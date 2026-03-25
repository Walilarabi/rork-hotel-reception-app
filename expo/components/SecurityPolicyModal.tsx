import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Shield, Lock, Eye, Server, Mail, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface SecurityPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityPolicyModal({ visible, onClose }: SecurityPolicyModalProps) {
  const { t, isDarkMode, modeColors } = useTheme();

  const bg = isDarkMode ? modeColors.surface : '#FFFFFF';
  const textColor = isDarkMode ? modeColors.text : '#1A2B33';
  const textSec = isDarkMode ? modeColors.textSecondary : '#546E7A';
  const border = isDarkMode ? modeColors.border : '#E4E8EC';
  const sectionBg = isDarkMode ? modeColors.surfaceLight : '#F8FAFB';

  const sections = [
    { icon: Eye, color: '#3B82F6', title: t.security.dataCollection, desc: t.security.dataCollectionDesc },
    { icon: Server, color: '#8B5CF6', title: t.security.purposes, desc: t.security.purposesDesc },
    { icon: Shield, color: '#10B981', title: t.security.rights, desc: t.security.rightsDesc },
    { icon: Lock, color: '#F59E0B', title: t.security.measures, desc: t.security.measuresDesc },
    { icon: Mail, color: '#EF4444', title: t.security.contact, desc: t.security.contactDesc },
    { icon: CheckCircle, color: '#0D9488', title: t.security.compliance, desc: t.security.complianceDesc },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Shield size={20} color="#10B981" />
            </View>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={2}>
              {t.security.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={textSec} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.introCard, { backgroundColor: sectionBg, borderColor: border }]}>
            <Text style={[styles.introText, { color: textSec }]}>
              {t.security.intro}
            </Text>
          </View>

          {sections.map((section, index) => {
            const IconComp = section.icon;
            return (
              <View key={index} style={[styles.sectionCard, { backgroundColor: sectionBg, borderColor: border }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconCircle, { backgroundColor: section.color + '15' }]}>
                    <IconComp size={18} color={section.color} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{section.title}</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: textSec }]}>{section.desc}</Text>
              </View>
            );
          })}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textSec }]}>
              FLOWTYM © {new Date().getFullYear()}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  introCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 46,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
  },
});

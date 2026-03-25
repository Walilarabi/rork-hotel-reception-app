import { useMemo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export interface AppColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  card: string;
  cardBorder: string;
  inputBg: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  overlay: string;
  modalBg: string;
}

export function useColors(): AppColors {
  const { isDarkMode, modeColors, theme } = useTheme();

  return useMemo(() => {
    if (isDarkMode) {
      return {
        background: modeColors.background,
        surface: modeColors.surface,
        surfaceAlt: modeColors.surfaceLight,
        text: modeColors.text,
        textSecondary: modeColors.textSecondary,
        textMuted: modeColors.textMuted,
        border: modeColors.border,
        borderLight: modeColors.borderLight,
        card: modeColors.surface,
        cardBorder: modeColors.border,
        inputBg: modeColors.surfaceLight,
        headerBg: '#0F1117',
        tabBarBg: modeColors.surface,
        tabBarBorder: modeColors.border,
        overlay: 'rgba(0,0,0,0.6)',
        modalBg: modeColors.surface,
      };
    }
    return {
      background: '#F0F2F5',
      surface: '#FFFFFF',
      surfaceAlt: '#F8F9FA',
      text: '#1A2B33',
      textSecondary: '#546E7A',
      textMuted: '#90A4AE',
      border: '#E4E8EC',
      borderLight: '#EDF0F2',
      card: '#FFFFFF',
      cardBorder: '#E4E8EC',
      inputBg: '#F0F2F5',
      headerBg: theme.headerBg,
      tabBarBg: '#FFFFFF',
      tabBarBorder: '#E4E8EC',
      overlay: 'rgba(0,0,0,0.4)',
      modalBg: '#FFFFFF',
    };
  }, [isDarkMode, modeColors, theme]);
}

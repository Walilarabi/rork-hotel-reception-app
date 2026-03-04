import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { LanguageId, TRANSLATION_MAP } from '@/constants/i18n';

const THEME_KEY_PREFIX = 'app_theme_preference_';
const DARK_MODE_KEY_PREFIX = 'app_dark_mode_';
const LANGUAGE_KEY_PREFIX = 'app_language_';
const GLOBAL_THEME_KEY = 'app_theme_preference';
const GLOBAL_DARK_KEY = 'app_dark_mode';
const GLOBAL_LANG_KEY = 'app_language';

function getUserKeys(userId: string | null) {
  if (!userId) return { themeKey: GLOBAL_THEME_KEY, darkKey: GLOBAL_DARK_KEY, langKey: GLOBAL_LANG_KEY };
  return {
    themeKey: THEME_KEY_PREFIX + userId,
    darkKey: DARK_MODE_KEY_PREFIX + userId,
    langKey: LANGUAGE_KEY_PREFIX + userId,
  };
}

export type MobileThemeId = 'ocean' | 'forest' | 'earth' | 'lavender' | 'night';

export interface MobileTheme {
  id: MobileThemeId;
  label: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  headerBg: string;
  gradientStart: string;
  gradientEnd: string;
}

export interface DarkModeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
}

export const LIGHT_COLORS: DarkModeColors = {
  background: '#F2F4F6',
  surface: '#FFFFFF',
  surfaceLight: '#F8F9FA',
  text: '#1A2B33',
  textSecondary: '#546E7A',
  textMuted: '#90A4AE',
  border: '#E2E6E9',
  borderLight: '#EDF0F2',
};

export const DARK_COLORS: DarkModeColors = {
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceLight: '#222632',
  text: '#E8ECF2',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#2A2E3A',
  borderLight: '#232730',
};

export const MOBILE_THEMES: Record<MobileThemeId, MobileTheme> = {
  ocean: {
    id: 'ocean',
    label: 'Océan',
    primary: '#0D6E8A',
    primaryLight: '#1A9AB5',
    primaryDark: '#064D63',
    primarySoft: '#E0F4F8',
    accent: '#00B4D8',
    headerBg: '#0D6E8A',
    gradientStart: '#0D6E8A',
    gradientEnd: '#064D63',
  },
  forest: {
    id: 'forest',
    label: 'Forêt',
    primary: '#2D6A4F',
    primaryLight: '#40916C',
    primaryDark: '#1B4332',
    primarySoft: '#D8F3DC',
    accent: '#52B788',
    headerBg: '#2D6A4F',
    gradientStart: '#2D6A4F',
    gradientEnd: '#1B4332',
  },
  earth: {
    id: 'earth',
    label: 'Terre',
    primary: '#9C4A2D',
    primaryLight: '#C1634A',
    primaryDark: '#6B3420',
    primarySoft: '#FBEAE4',
    accent: '#E07A5F',
    headerBg: '#9C4A2D',
    gradientStart: '#9C4A2D',
    gradientEnd: '#6B3420',
  },
  lavender: {
    id: 'lavender',
    label: 'Lavande',
    primary: '#6C5CE7',
    primaryLight: '#8B7FF0',
    primaryDark: '#4A3DAE',
    primarySoft: '#EDE9FE',
    accent: '#A78BFA',
    headerBg: '#6C5CE7',
    gradientStart: '#6C5CE7',
    gradientEnd: '#4A3DAE',
  },
  night: {
    id: 'night',
    label: 'Nuit',
    primary: '#374151',
    primaryLight: '#6B7280',
    primaryDark: '#1F2937',
    primarySoft: '#E5E7EB',
    accent: '#9CA3AF',
    headerBg: '#374151',
    gradientStart: '#374151',
    gradientEnd: '#1F2937',
  },
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeId, setThemeId] = useState<MobileThemeId>('ocean');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [languageId, setLanguageId] = useState<LanguageId>('fr');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const keysRef = useRef(getUserKeys(null));

  const loadUserPrefs = useCallback(async (userId: string | null) => {
    console.log('[ThemeProvider] Loading prefs for user:', userId);
    const keys = getUserKeys(userId);
    keysRef.current = keys;
    setCurrentUserId(userId);
    try {
      const [storedTheme, storedDark, storedLang] = await Promise.all([
        AsyncStorage.getItem(keys.themeKey),
        AsyncStorage.getItem(keys.darkKey),
        AsyncStorage.getItem(keys.langKey),
      ]);
      console.log('[ThemeProvider] Loaded prefs:', { storedTheme, storedDark, storedLang });
      setThemeId((storedTheme && storedTheme in MOBILE_THEMES) ? storedTheme as MobileThemeId : 'ocean');
      setIsDarkMode(storedDark === 'true');
      setLanguageId((storedLang && storedLang in TRANSLATION_MAP) ? storedLang as LanguageId : 'fr');
    } catch (e) {
      console.log('[ThemeProvider] Error reading preferences:', e);
      setThemeId('ocean');
      setIsDarkMode(false);
      setLanguageId('fr');
    }
  }, []);

  const prefsQuery = useQuery({
    queryKey: ['user_preferences', currentUserId, keysRef.current.themeKey],
    queryFn: async () => {
      const keys = getUserKeys(currentUserId);
      try {
        const [storedTheme, storedDark, storedLang] = await Promise.all([
          AsyncStorage.getItem(keys.themeKey),
          AsyncStorage.getItem(keys.darkKey),
          AsyncStorage.getItem(keys.langKey),
        ]);
        return {
          theme: (storedTheme && storedTheme in MOBILE_THEMES) ? storedTheme as MobileThemeId : 'ocean' as MobileThemeId,
          darkMode: storedDark === 'true',
          language: (storedLang && storedLang in TRANSLATION_MAP) ? storedLang as LanguageId : 'fr' as LanguageId,
        };
      } catch (e) {
        console.log('[ThemeProvider] Error reading preferences:', e);
        return { theme: 'ocean' as MobileThemeId, darkMode: false, language: 'fr' as LanguageId };
      }
    },
  });

  useEffect(() => {
    if (prefsQuery.data) {
      setThemeId(prefsQuery.data.theme);
      setIsDarkMode(prefsQuery.data.darkMode);
      setLanguageId(prefsQuery.data.language);
    }
  }, [prefsQuery.data]);

  const setMobileTheme = useCallback(async (id: MobileThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(keysRef.current.themeKey, id);
  }, []);

  const toggleDarkMode = useCallback(async () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(keysRef.current.darkKey, String(next));
      return next;
    });
  }, []);

  const setDarkMode = useCallback(async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem(keysRef.current.darkKey, String(value));
  }, []);

  const setLanguage = useCallback(async (id: LanguageId) => {
    setLanguageId(id);
    await AsyncStorage.setItem(keysRef.current.langKey, id);
  }, []);

  const theme = MOBILE_THEMES[themeId];
  const modeColors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const t = useMemo(() => TRANSLATION_MAP[languageId], [languageId]);

  return {
    themeId,
    theme,
    isDarkMode,
    languageId,
    modeColors,
    t,
    setMobileTheme,
    toggleDarkMode,
    setDarkMode,
    setLanguage,
    loadUserPrefs,
    allThemes: MOBILE_THEMES,
  };
});

export const Colors = {
  primary: '#1A4D5C',
  primaryLight: '#257D8A',
  primaryDark: '#0E3545',
  primarySoft: '#E4F0F3',

  background: '#F2F4F6',
  surface: '#FFFFFF',
  surfaceLight: '#F8F9FA',
  surfaceHover: '#EEF1F3',

  border: '#E2E6E9',
  borderLight: '#EDF0F2',

  text: '#1A2B33',
  textSecondary: '#546E7A',
  textMuted: '#90A4AE',

  accent: '#1A4D5C',
  accentLight: '#257D8A',
  accentSoft: '#E4F0F3',

  statusLibre: '#43A047',
  statusOccupe: '#1E88E5',
  statusDepart: '#E53935',
  statusRecouche: '#FB8C00',
  statusHorsService: '#78909C',

  cleaningInProgress: '#00897B',
  cleaningDone: '#43A047',
  cleaningValidated: '#2E7D32',
  cleaningRefused: '#E53935',

  vipGold: '#FFB300',
  priorityRed: '#E53935',

  success: '#43A047',
  danger: '#E53935',
  warning: '#FB8C00',
  info: '#1E88E5',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(26, 77, 92, 0.5)',

  teal: '#00897B',
  tealLight: '#E0F2F1',
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.primary,
  },
};

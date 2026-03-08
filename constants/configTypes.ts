export interface ConfigProductCategory {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
}

export interface ConfigProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  defaultQuantitySimple: number;
  defaultQuantityDouble: number;
  defaultQuantitySuite: number;
  alertThreshold: number;
  unit: string;
  active: boolean;
  displayOrder: number;
}

export interface ConfigChecklistItem {
  id: string;
  category: string;
  itemName: string;
  appliesToSimple: boolean;
  appliesToDouble: boolean;
  appliesToSuite: boolean;
  displayOrder: number;
  active: boolean;
}

export interface ConfigProblemTemplate {
  id: string;
  label: string;
  iconName: string;
  maintenanceCategory: string;
  defaultPriority: 'haute' | 'moyenne' | 'basse';
  displayOrder: number;
  active: boolean;
}

export interface ConfigRoomType {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  active: boolean;
}

export interface HousekeeperDetail {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  contractType: 'CDI' | 'CDD' | 'Stagiaire' | 'Intérimaire';
  assignedFloors: number[];
  active: boolean;
}

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stagiaire', 'Intérimaire'] as const;

export const PROBLEM_ICONS: { name: string; label: string; emoji: string }[] = [
  { name: 'toilet', label: 'WC bouché', emoji: '🚽' },
  { name: 'lightbulb', label: 'Ampoule grillée', emoji: '💡' },
  { name: 'droplets', label: 'Fuite eau', emoji: '💧' },
  { name: 'thermometer', label: 'Climatisation', emoji: '🌡️' },
  { name: 'lock', label: 'Serrure', emoji: '🔒' },
  { name: 'tv', label: 'TV / Écran', emoji: '📺' },
  { name: 'wifi', label: 'Wi-Fi', emoji: '📶' },
  { name: 'zap', label: 'Électricité', emoji: '⚡' },
  { name: 'wrench', label: 'Mobilier', emoji: '🔧' },
  { name: 'shower-head', label: 'Douche', emoji: '🚿' },
  { name: 'wind', label: 'Ventilation', emoji: '🌀' },
  { name: 'bug', label: 'Nuisibles', emoji: '🐛' },
];

export const CHECKLIST_CATEGORIES = [
  'Ménage',
  'Équipements',
  'Salle de bain',
  'Literie',
  'Mini-bar',
  'Général',
] as const;

export const MAINTENANCE_CATEGORY_OPTIONS = [
  'Plomberie',
  'Électricité',
  'Climatisation',
  'Serrurerie',
  'Mobilier',
  'Multimédia',
  'Ventilation',
  'Nuisibles',
  'Autre',
] as const;

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  linge: 'Linge',
  accueil: 'Produits d\'accueil',
  minibar: 'Mini-bar',
  menage: 'Ménage',
};

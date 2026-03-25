export interface RoomTypeConfig {
  id: string;
  name: string;
  code: string;
}

export interface RoomCategoryConfig {
  id: string;
  name: string;
}

export interface ViewTypeConfig {
  id: string;
  name: string;
}

export interface BathroomTypeConfig {
  id: string;
  name: string;
}

export interface EquipmentConfig {
  id: string;
  name: string;
  icon: string;
}

export interface HotelConfiguration {
  roomTypes: RoomTypeConfig[];
  roomCategories: RoomCategoryConfig[];
  viewTypes: ViewTypeConfig[];
  bathroomTypes: BathroomTypeConfig[];
  equipment: EquipmentConfig[];
}

export const DEFAULT_ROOM_TYPES: RoomTypeConfig[] = [
  { id: 'rt1', name: 'Simple', code: 'SGL' },
  { id: 'rt2', name: 'Double', code: 'DBL' },
  { id: 'rt3', name: 'Twin', code: 'TWN' },
  { id: 'rt4', name: 'Suite', code: 'STE' },
  { id: 'rt5', name: 'Triple', code: 'TRP' },
  { id: 'rt6', name: 'Familiale', code: 'FAM' },
  { id: 'rt7', name: 'Duplex', code: 'DPX' },
  { id: 'rt8', name: 'Communicante', code: 'COM' },
  { id: 'rt9', name: 'Appartement', code: 'APT' },
];

export const DEFAULT_ROOM_CATEGORIES: RoomCategoryConfig[] = [
  { id: 'rc1', name: 'Standard' },
  { id: 'rc2', name: 'Supérieur' },
  { id: 'rc3', name: 'Deluxe' },
  { id: 'rc4', name: 'Executive' },
  { id: 'rc5', name: 'Prestige' },
];

export const DEFAULT_VIEW_TYPES: ViewTypeConfig[] = [
  { id: 'vt1', name: 'Rue' },
  { id: 'vt2', name: 'Ville' },
  { id: 'vt3', name: 'Cour' },
  { id: 'vt4', name: 'Jardin' },
  { id: 'vt5', name: 'Mer' },
  { id: 'vt6', name: 'Montagne' },
  { id: 'vt7', name: 'Piscine' },
];

export const DEFAULT_BATHROOM_TYPES: BathroomTypeConfig[] = [
  { id: 'bt1', name: 'Douche' },
  { id: 'bt2', name: 'Baignoire' },
  { id: 'bt3', name: 'Douche + Baignoire' },
  { id: 'bt4', name: 'Douche italienne' },
];

export const DEFAULT_EQUIPMENT: EquipmentConfig[] = [
  { id: 'eq1', name: 'Climatisation', icon: '❄️' },
  { id: 'eq2', name: 'TV écran plat', icon: '📺' },
  { id: 'eq3', name: 'Coffre-fort', icon: '🔐' },
  { id: 'eq4', name: 'Mini-bar', icon: '🧊' },
  { id: 'eq5', name: 'Wi-Fi', icon: '📶' },
  { id: 'eq6', name: 'Sèche-cheveux', icon: '💨' },
  { id: 'eq7', name: 'Machine à café', icon: '☕' },
  { id: 'eq8', name: 'Fer à repasser', icon: '👔' },
  { id: 'eq9', name: 'Bureau', icon: '🖥️' },
  { id: 'eq10', name: 'Balcon', icon: '🌅' },
  { id: 'eq11', name: 'Terrasse', icon: '🏖️' },
  { id: 'eq12', name: 'Baignoire balnéo', icon: '🛁' },
  { id: 'eq13', name: 'Accessibilité PMR', icon: '♿' },
];

export const DEFAULT_HOTEL_CONFIG: HotelConfiguration = {
  roomTypes: DEFAULT_ROOM_TYPES,
  roomCategories: DEFAULT_ROOM_CATEGORIES,
  viewTypes: DEFAULT_VIEW_TYPES,
  bathroomTypes: DEFAULT_BATHROOM_TYPES,
  equipment: DEFAULT_EQUIPMENT,
};

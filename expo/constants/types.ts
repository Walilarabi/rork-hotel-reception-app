export type RoomStatus = 'libre' | 'occupe' | 'depart' | 'recouche' | 'hors_service';

export type ClientBadge = 'normal' | 'vip' | 'prioritaire';

export type CleaningStatus =
  | 'none'
  | 'en_cours'
  | 'nettoyee'
  | 'validee'
  | 'refusee';

export type RoomType = 'Simple' | 'Double' | 'Suite' | 'Deluxe' | 'Familiale' | 'Twin';

export type RoomViewType = 'Rue' | 'Cour' | 'Jardin' | 'Mer' | 'Piscine';
export type RoomBathroomType = 'Douche' | 'Baignoire' | 'Douche+Baignoire';

export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Reservation {
  id: string;
  roomId: string;
  pmsReservationId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  preferences: string;
  status: ReservationStatus;
  lastSync: string;
}

export interface RoomHistoryEntry {
  id: string;
  roomId: string;
  action: string;
  performedBy: string;
  date: string;
  details: string;
}

export type RoomCleanlinessStatus = 'propre' | 'en_nettoyage' | 'sale' | 'inspectee';

export type BookingSource = 'Booking' | 'Expedia' | 'Direct' | 'Airbnb' | 'Téléphone' | 'Agoda' | 'HRS' | 'Ctrip' | 'Walk-in' | 'Autre';

export type BookingChannelType = 'ota' | 'direct' | 'phone' | 'walkin' | 'other';

export const CHANNEL_TYPE_CONFIG: Record<BookingChannelType, { label: string; color: string; bgColor: string }> = {
  ota: { label: 'OTA', color: '#7C3AED', bgColor: 'rgba(124,58,237,0.10)' },
  direct: { label: 'Direct', color: '#16A34A', bgColor: 'rgba(22,163,74,0.10)' },
  phone: { label: 'Téléphone', color: '#64748B', bgColor: 'rgba(100,116,139,0.10)' },
  walkin: { label: 'Walk-in', color: '#EA580C', bgColor: 'rgba(234,88,12,0.10)' },
  other: { label: 'Autre', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.10)' },
};

export const ROOM_CLEANLINESS_CONFIG: Record<RoomCleanlinessStatus, { label: string; color: string; icon: string }> = {
  propre: { label: 'Propre', color: '#43A047', icon: '🟢' },
  en_nettoyage: { label: 'En nettoyage', color: '#FB8C00', icon: '🟡' },
  sale: { label: 'Sale', color: '#E53935', icon: '🔴' },
  inspectee: { label: 'Inspectée', color: '#1E88E5', icon: '🔵' },
};

export const BOOKING_SOURCE_CONFIG: Record<BookingSource, { label: string; color: string; icon: string; channelType: BookingChannelType; hasCommission: boolean }> = {
  Booking: { label: 'Booking.com', color: '#003580', icon: 'B', channelType: 'ota', hasCommission: true },
  Expedia: { label: 'Expedia', color: '#1A1A6C', icon: 'E', channelType: 'ota', hasCommission: true },
  Direct: { label: 'Site direct', color: '#16A34A', icon: 'D', channelType: 'direct', hasCommission: false },
  Airbnb: { label: 'Airbnb', color: '#FF5A5F', icon: 'A', channelType: 'ota', hasCommission: true },
  'Téléphone': { label: 'Téléphone', color: '#64748B', icon: '☎', channelType: 'phone', hasCommission: false },
  Agoda: { label: 'Agoda', color: '#5392F9', icon: 'Ag', channelType: 'ota', hasCommission: true },
  HRS: { label: 'HRS', color: '#C8102E', icon: 'H', channelType: 'ota', hasCommission: true },
  Ctrip: { label: 'Trip.com / Ctrip', color: '#287DFA', icon: 'T', channelType: 'ota', hasCommission: true },
  'Walk-in': { label: 'Walk-in', color: '#EA580C', icon: 'W', channelType: 'walkin', hasCommission: false },
  Autre: { label: 'Autre', color: '#94A3B8', icon: '?', channelType: 'other', hasCommission: false },
};

export const ALL_BOOKING_SOURCES: BookingSource[] = ['Booking', 'Expedia', 'Agoda', 'Ctrip', 'Airbnb', 'HRS', 'Direct', 'Téléphone', 'Walk-in', 'Autre'];

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  status: RoomStatus;
  clientBadge: ClientBadge;
  vipInstructions: string;
  cleaningStatus: CleaningStatus;
  cleaningAssignee: string | null;
  currentReservation: Reservation | null;
  history: RoomHistoryEntry[];
  assignedTo: string | null;
  cleaningStartedAt: string | null;
  cleaningCompletedAt: string | null;
  breakfastIncluded: boolean;
  viewType: RoomViewType;
  bathroomType: RoomBathroomType;
  roomCategory: string;
  roomSize: number;
  capacity: number;
  equipment: string[];
  dotation: string[];
  cleanlinessStatus?: RoomCleanlinessStatus;
  etaArrival?: string | null;
  bookingSource?: BookingSource;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: 'femme_de_chambre' | 'gouvernante' | 'reception' | 'maintenance' | 'breakfast';
  currentLoad: number;
  maxLoad: number;
  active: boolean;
}

export type PMSSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface PMSSyncState {
  status: PMSSyncStatus;
  lastSyncTime: string | null;
  recordsUpdated: number;
  errorMessage: string | null;
}

export type MaintenancePriority = 'haute' | 'moyenne' | 'basse';
export type MaintenanceStatus = 'en_attente' | 'en_cours' | 'resolu';

export interface MaintenanceTask {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo: string | null;
  photos: string[];
  resolutionNotes: string;
  resolvedAt: string | null;
  comments: CommentEntry[];
  scheduleId: string | null;
  isPeriodic: boolean;
  costs: MaintenanceCost[];
  costTotal: number;
  category: string;
}

export interface CommentEntry {
  id: string;
  author: string;
  text: string;
  date: string;
}

export type InspectionStatus = 'en_attente' | 'valide' | 'refuse';

export interface Inspection {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  cleanedBy: string;
  completedAt: string;
  status: InspectionStatus;
  checklistResults: Record<string, boolean>;
  comments: string;
  guestName: string | null;
}

export type BreakfastStatus = 'a_preparer' | 'prepare' | 'en_livraison' | 'servi';

export interface BreakfastOrder {
  id: string;
  roomId: string;
  roomNumber: string;
  orderDate: string;
  included: boolean;
  personCount: number;
  adults: number;
  children: number;
  formule: string;
  boissons: string[];
  options: string[];
  status: BreakfastStatus;
  servedAt: string | null;
  billingNotificationSent: boolean;
  notes: string;
  guestName: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: 'linge' | 'produit' | 'minibar';
  currentStock: number;
  minimumThreshold: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

export type LostFoundStatus = 'en_attente' | 'restitue' | 'consigne';

export interface LostFoundItem {
  id: string;
  roomId: string;
  roomNumber: string;
  reportedBy: string;
  itemName: string;
  description: string;
  foundDate: string;
  status: LostFoundStatus;
  returnedTo: string;
  returnedDate: string;
  consignedDate: string;
  consignedLocation: string;
  consignedObservations: string;
}

export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; emoji: string }> = {
  libre: { label: 'Libre', color: '#43A047', emoji: '🟢' },
  occupe: { label: 'Occupé', color: '#1E88E5', emoji: '🔵' },
  depart: { label: 'Départ', color: '#E53935', emoji: '🟠' },
  recouche: { label: 'Recouche', color: '#FB8C00', emoji: '🟣' },
  hors_service: { label: 'Hors service', color: '#78909C', emoji: '⚫' },
};

export const CLEANING_STATUS_CONFIG: Record<CleaningStatus, { label: string; color: string; icon: string }> = {
  none: { label: '', color: 'transparent', icon: '' },
  en_cours: { label: 'En cours', color: '#00897B', icon: '⏳' },
  nettoyee: { label: 'À valider', color: '#43A047', icon: '✅' },
  validee: { label: 'Validée', color: '#2E7D32', icon: '✔️' },
  refusee: { label: 'À refaire', color: '#E53935', icon: '❌' },
};

export const INSPECTION_CHECKLIST = [
  { key: 'lits', label: 'Lit refait correctement' },
  { key: 'sous_lit', label: 'Sous le lit vérifié' },
  { key: 'sdb', label: 'Salle de bain propre' },
  { key: 'poubelle', label: 'Poubelle vidée' },
  { key: 'objets', label: 'Aucun objet oublié' },
  { key: 'minibar', label: 'Mini-bar approvisionné' },
  { key: 'poussiere', label: 'Poussière vérifiée' },
  { key: 'equipements', label: 'Équipements fonctionnels' },
];

export const BREAKFAST_FORMULES = ['Continental', 'Américain', 'Enfant', 'Buffet'];
export const BREAKFAST_BOISSONS = ['Café', 'Thé', 'Jus d\'orange', 'Lait', 'Chocolat chaud'];
export const BREAKFAST_OPTIONS = ['Sans gluten', 'Végétarien', 'Végan', 'Sans lactose', 'Halal'];

export const MAINTENANCE_CATEGORIES = [
  'Plomberie',
  'Électricité',
  'Climatisation',
  'Serrurerie',
  'Mobilier',
  'Autre',
];

export interface HousekeepingChecklist {
  lits: boolean;
  sdb: boolean;
  poussiere: boolean;
  minibar: boolean;
  equipements: boolean;
  serviettes: boolean;
  produits: boolean;
}

export const DEFAULT_CHECKLIST: HousekeepingChecklist = {
  lits: false,
  sdb: false,
  poussiere: false,
  minibar: false,
  equipements: false,
  serviettes: false,
  produits: false,
};

export const CHECKLIST_ITEMS: { key: keyof HousekeepingChecklist; icon: string; label: string }[] = [
  { key: 'lits', icon: '🛏️', label: 'Lits' },
  { key: 'sdb', icon: '🚿', label: 'Salle de bain' },
  { key: 'poussiere', icon: '✨', label: 'Poussière' },
  { key: 'minibar', icon: '🧊', label: 'Mini-bar' },
  { key: 'equipements', icon: '📺', label: 'Équipements' },
  { key: 'serviettes', icon: '🧺', label: 'Serviettes' },
  { key: 'produits', icon: '🧴', label: 'Produits' },
];

export interface MinibarProduct {
  id: string;
  name: string;
  icon: string;
  price: number;
}

export const MINIBAR_PRODUCTS: MinibarProduct[] = [
  { id: 'mp1', name: 'Eau', icon: '💧', price: 3 },
  { id: 'mp2', name: 'Coca', icon: '🥤', price: 5 },
  { id: 'mp3', name: 'Bière', icon: '🍺', price: 7 },
  { id: 'mp4', name: 'Jus', icon: '🧃', price: 4 },
  { id: 'mp5', name: 'Chips', icon: '🍿', price: 4 },
  { id: 'mp6', name: 'Vin', icon: '🍷', price: 12 },
  { id: 'mp7', name: 'Chocolat', icon: '🍫', price: 3 },
  { id: 'mp8', name: 'Noix', icon: '🥜', price: 5 },
];

export type ConsumableCategory = 'linge' | 'accueil' | 'minibar' | 'menage';

export interface ConsumableProduct {
  id: string;
  name: string;
  icon: string;
  category: ConsumableCategory;
  unit: string;
  unitPrice: number;
  lowStockThreshold: number;
  currentStock: number;
}

export interface ConsumptionLog {
  id: string;
  roomId: string;
  roomNumber: string;
  productId: string;
  productName: string;
  productIcon: string;
  category: ConsumableCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reportedBy: string;
  reportedAt: string;
  billed: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  movementType: 'entree' | 'sortie_consommation' | 'sortie_perte' | 'inventaire';
  unitPrice: number;
  roomId: string | null;
  roomNumber: string | null;
  reportedBy: string;
  createdAt: string;
}

export const CONSUMABLE_CATEGORY_CONFIG: Record<ConsumableCategory, { label: string; icon: string; color: string }> = {
  linge: { label: 'Linge', icon: '🧺', color: '#5C6BC0' },
  accueil: { label: 'Accueil', icon: '🧴', color: '#00897B' },
  minibar: { label: 'Mini-bar', icon: '🧊', color: '#E53935' },
  menage: { label: 'Ménage', icon: '🧹', color: '#FB8C00' },
};

export type RoomNpdStatus = 'none' | 'npd' | 'blocked';

export interface Consumption {
  id: string;
  roomId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  reportedBy: string;
  reportedAt: string;
  billed: boolean;
}

export type HotelStatus = 'active' | 'suspended' | 'trial';
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

export interface HotelBilling {
  vatNumber: string;
  iban: string;
  bic: string;
  billingAddress: string;
  billingEmail: string;
  legalRepresentative: string;
  mandateReference: string;
  mandateCreatedAt: string | null;
  mandateSentAt: string | null;
  mandateSignedAt: string | null;
  mandateStatus: 'none' | 'pending' | 'sent' | 'signed' | 'expired';
}

export const DEFAULT_HOTEL_BILLING: HotelBilling = {
  vatNumber: '',
  iban: '',
  bic: '',
  billingAddress: '',
  billingEmail: '',
  legalRepresentative: '',
  mandateReference: '',
  mandateCreatedAt: null,
  mandateSentAt: null,
  mandateSignedAt: null,
  mandateStatus: 'none',
};

export interface Hotel {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStart: string;
  subscriptionEnd: string;
  status: HotelStatus;
  roomCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  billing?: HotelBilling;
}

export interface HistoryDaySummary {
  date: string;
  dayName: string;
  departures: number;
  stayovers: number;
  incidents: number;
  blockedRooms: number;
  npdCount: number;
  consumptionTotal: number;
  occupancyRate: number;
}

export interface HistoryRoomDetail {
  roomNumber: string;
  cleaningStartedAt: string | null;
  cleaningCompletedAt: string | null;
  housekeeperName: string;
  consumables: { name: string; quantity: number; total: number }[];
  validatedAt: string | null;
  validatedBy: string | null;
  status: 'validated' | 'refused' | 'pending';
  incidents: string[];
}

export interface HousekeeperPerformance {
  id: string;
  name: string;
  totalRooms: number;
  departures: number;
  stayovers: number;
  npdCount: number;
  blockedCount: number;
  lostFoundCount: number;
  validationRate: number;
  refusalRate: number;
  incidentCount: number;
  avgTimeMinutes: number;
  confidenceIndex: number;
}

export type AdminUserRole = 'reception' | 'gouvernante' | 'femme_de_chambre' | 'maintenance' | 'breakfast' | 'direction' | 'super_admin' | 'support';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  hotelId: string | null;
  hotelName: string | null;
  active: boolean;
  invitedBy: string | null;
  invitationAcceptedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export type LogAction =
  | 'hotel_created'
  | 'hotel_updated'
  | 'hotel_suspended'
  | 'hotel_reactivated'
  | 'hotel_deleted'
  | 'user_invited'
  | 'user_suspended'
  | 'user_reactivated'
  | 'user_deleted'
  | 'support_mode_entered'
  | 'support_mode_exited'
  | 'admin_login'
  | 'pms_sync_forced'
  | 'data_export';

export interface AdminLog {
  id: string;
  userId: string;
  userName: string;
  action: LogAction;
  details: string;
  hotelName: string | null;
  ipAddress: string;
  createdAt: string;
}

export interface SupportSession {
  hotelId: string;
  hotelName: string;
  role: AdminUserRole;
  enteredAt: string;
}

export const SUBSCRIPTION_PLAN_CONFIG: Record<SubscriptionPlan, { label: string; color: string; maxRooms: number }> = {
  basic: { label: 'Basique', color: '#78909C', maxRooms: 50 },
  premium: { label: 'Premium', color: '#FB8C00', maxRooms: 200 },
  enterprise: { label: 'Enterprise', color: '#7C4DFF', maxRooms: 999 },
};

export const HOTEL_STATUS_CONFIG: Record<HotelStatus, { label: string; color: string }> = {
  active: { label: 'Actif', color: '#43A047' },
  suspended: { label: 'Suspendu', color: '#E53935' },
  trial: { label: 'Essai', color: '#1E88E5' },
};

export const ADMIN_ROLE_CONFIG: Record<AdminUserRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: '#7C4DFF' },
  support: { label: 'Support', color: '#0EA5E9' },
  direction: { label: 'Direction', color: '#1A4D5C' },
  reception: { label: 'Réception', color: '#1E88E5' },
  gouvernante: { label: 'Gouvernante', color: '#00897B' },
  femme_de_chambre: { label: 'Femme de chambre', color: '#FB8C00' },
  maintenance: { label: 'Maintenance', color: '#78909C' },
  breakfast: { label: 'Petit-déjeuner', color: '#E53935' },
};

export type PMSType =
  | 'mews'
  | 'opera'
  | 'medialog'
  | 'misterbooking'
  | 'apaleo'
  | 'asterio'
  | 'protel'
  | 'cloudbeds'
  | 'hoteltime'
  | 'lodge'
  | 'reselva'
  | 'vega'
  | 'sihot'
  | 'fidotel'
  | 'oracle_hospitality'
  | 'assistel'
  | 'galaxy'
  | 'maestro'
  | 'innquest'
  | 'skytouch'
  | 'guestline'
  | 'stayntouch'
  | 'other';

export interface PMSConfiguration {
  id: string;
  hotelId: string;
  pmsType: PMSType;
  connectionName: string;
  hotelIdentifier: string;
  apiKey: string;
  apiUrl: string;
  username: string;
  password: string;
  apiVersion: string;
  isActive: boolean;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PMS_TYPE_CONFIG: Record<PMSType, { label: string; logo?: string }> = {
  mews: { label: 'Mews' },
  opera: { label: 'Oracle Opera' },
  medialog: { label: 'Medialog (Medialogue)' },
  misterbooking: { label: 'Misterbooking' },
  apaleo: { label: 'Apaleo' },
  asterio: { label: 'Asterio' },
  protel: { label: 'Protel' },
  cloudbeds: { label: 'Cloudbeds' },
  hoteltime: { label: 'HotelTime' },
  lodge: { label: 'Lodge' },
  reselva: { label: 'Reselva' },
  vega: { label: 'Vega Hotel' },
  sihot: { label: 'Sihot' },
  fidotel: { label: 'Fidotel' },
  oracle_hospitality: { label: 'Oracle Hospitality' },
  assistel: { label: 'Assistel' },
  galaxy: { label: 'Galaxy Hotel Systems' },
  maestro: { label: 'Maestro PMS' },
  innquest: { label: 'InnQuest' },
  skytouch: { label: 'SkyTouch' },
  guestline: { label: 'Guestline' },
  stayntouch: { label: 'StayNTouch' },
  other: { label: 'Autre' },
};

export type MaintenanceTypeCategory = 'chambre' | 'parties_communes';
export type FrequencyUnit = 'day' | 'month' | 'year';

export interface MaintenanceType {
  id: string;
  hotelId: string;
  name: string;
  category: MaintenanceTypeCategory;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  active: boolean;
}

export interface MaintenanceSchedule {
  id: string;
  hotelId: string;
  maintenanceTypeId: string;
  roomId: string | null;
  commonArea: string | null;
  lastDone: string | null;
  nextDue: string | null;
}

export interface MaintenanceCost {
  id: string;
  maintenanceTaskId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
}

export interface BreakfastStaff {
  id: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  position: 'responsable' | 'serveur' | 'cuisinier' | 'plongeur';
  email: string;
  phone: string;
  hourlyRate: number;
  active: boolean;
}

export interface BreakfastService {
  id: string;
  hotelId: string;
  roomId: string | null;
  roomNumber: string;
  staffId: string | null;
  staffName: string;
  serviceDate: string;
  adults: number;
  children: number;
  location: 'salle' | 'chambre';
  included: boolean;
  amount: number;
  servedAt: string;
  recordedBy: string;
  notes: string;
  satisfactionScore: number | null;
}

export interface BreakfastConfig {
  id: string;
  hotelId: string;
  adultPriceDining: number;
  adultPriceRoom: number;
  childPrice: number;
  childAgeLimit: number;
  seatingCapacity: number;
}

export interface BreakfastProduct {
  id: string;
  hotelId: string;
  name: string;
  category: 'boissons' | 'laitiers' | 'viennoiseries' | 'charcuterie' | 'fruits' | 'cereales' | 'autre';
  purchasePrice: number;
  unit: string;
  supplier: string;
  active: boolean;
}

export const BREAKFAST_STAFF_POSITIONS: Record<string, { label: string; color: string }> = {
  responsable: { label: 'Responsable', color: '#6B5CE7' },
  serveur: { label: 'Serveur', color: '#3B82F6' },
  cuisinier: { label: 'Cuisinier', color: '#F59E0B' },
  plongeur: { label: 'Plongeur', color: '#78909C' },
};

export const BREAKFAST_PRODUCT_CATEGORIES: Record<string, { label: string; icon: string }> = {
  boissons: { label: 'Boissons', icon: '☕' },
  laitiers: { label: 'Produits laitiers', icon: '🥛' },
  viennoiseries: { label: 'Viennoiseries', icon: '🥐' },
  charcuterie: { label: 'Charcuterie', icon: '🥓' },
  fruits: { label: 'Fruits', icon: '🍎' },
  cereales: { label: 'Céréales', icon: '🥣' },
  autre: { label: 'Autre', icon: '🍽️' },
};

export const COMMON_AREAS = [
  'Réception',
  'Restaurant',
  'Salle PDJ',
  'Bar',
  'Hall',
  'Spa',
  'Business Center',
  'Salle de réunion',
  'Couloirs',
  'Parking',
  'Jardin',
  'Piscine',
];

export const MAINTENANCE_TYPE_TEMPLATES = [
  'Moquette / Sol',
  'Filtres climatisation',
  'VMC',
  'Joints carrelage SDB',
  'Joints silicone',
  'Papier peint',
  'Coffre-fort',
  'Serrures',
  'TV',
  'Téléphone',
  'Machine à café',
  'Sèche-cheveux',
  'Peinture',
  'Plomberie générale',
  'Électricité générale',
];

export const FREQUENCY_OPTIONS: { value: number; unit: FrequencyUnit; label: string }[] = [
  { value: 15, unit: 'day', label: '15 jours' },
  { value: 1, unit: 'month', label: '1 mois' },
  { value: 2, unit: 'month', label: '2 mois' },
  { value: 3, unit: 'month', label: '3 mois' },
  { value: 6, unit: 'month', label: '6 mois' },
  { value: 1, unit: 'year', label: '1 an' },
  { value: 2, unit: 'year', label: '2 ans' },
];

export interface ExportPDFOptions {
  title: string;
  period: 'today' | 'week' | 'month' | 'custom';
  customStart?: string;
  customEnd?: string;
  includeKPIs: boolean;
  includeRoomList: boolean;
  includeConsumptions: boolean;
  includeCharts: boolean;
  includeHistory: boolean;
  includeHotelInfo: boolean;
  orientation: 'portrait' | 'landscape';
}

export type BillingType = 'one_time' | 'monthly' | 'yearly';
export type DiscountType = 'percentage' | 'fixed';
export type PromotionStatus = 'active' | 'inactive' | 'scheduled';

export interface SubscriptionPlanDetail {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxRooms: number;
  maxUsers: number;
  maxHotels: number;
  extraHotelPrice: number;
  sortOrder: number;
  isActive: boolean;
  featureIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  billingType: BillingType;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  durationMonths: number | null;
  startDate: string | null;
  endDate: string | null;
  maxUses: number | null;
  maxUsesPerCustomer: number;
  firstPurchaseOnly: boolean;
  isActive: boolean;
  currentUses: number;
  applicablePlanIds: string[];
}

export interface HotelSubscription {
  id: string;
  hotelId: string;
  hotelName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  priceAtSubscription: number;
  promoCode: string | null;
  createdAt: string;
}

export interface SubscriptionGlobalConfig {
  defaultCurrency: string;
  defaultBillingCycle: 'monthly' | 'yearly';
  trialDays: number;
  termsUrl: string;
  billingEmail: string;
  reminderDaysBefore: number;
}

export const FEATURE_CATEGORIES = [
  'Modules',
  'Applications',
  'QR Codes',
  'Intégrations',
  'Rapports',
  'Support',
  'Formation',
] as const;

export const BILLING_TYPE_CONFIG: Record<BillingType, { label: string }> = {
  one_time: { label: 'Unique' },
  monthly: { label: 'Mensuel' },
  yearly: { label: 'Annuel' },
};

export interface HousekeepingForecastConfig {
  id: string;
  hotelId: string;
  defaultMaxRoomsPerHousekeeper: number;
  maxDepartsPerHousekeeper: number | null;
  departCoefficient: number;
  stayoverCoefficient: number;
  useRoomTypeCoefficients: boolean;
  updatedAt: string;
}

export const DEFAULT_FORECAST_CONFIG: HousekeepingForecastConfig = {
  id: 'hfc-default',
  hotelId: 'hotel-1',
  defaultMaxRoomsPerHousekeeper: 12,
  maxDepartsPerHousekeeper: null,
  departCoefficient: 1.0,
  stayoverCoefficient: 0.7,
  useRoomTypeCoefficients: false,
  updatedAt: new Date().toISOString(),
};

export interface RoomTypeCoefficient {
  roomType: RoomType;
  coefficient: number;
}

export const DEFAULT_ROOM_TYPE_COEFFICIENTS: RoomTypeCoefficient[] = [
  { roomType: 'Simple', coefficient: 0.8 },
  { roomType: 'Double', coefficient: 1.0 },
  { roomType: 'Suite', coefficient: 1.5 },
  { roomType: 'Deluxe', coefficient: 1.3 },
  { roomType: 'Familiale', coefficient: 1.4 },
];

export interface DayForecast {
  date: string;
  dayLabel: string;
  departures: number;
  stayovers: number;
  weightedTotal: number;
  estimatedStaff: number;
  availableStaff: number;
  status: 'ok' | 'warning' | 'critical';
}

export type ImportFileType = 'csv' | 'excel' | 'image' | 'pdf' | 'manual';
export type ImportStatus = 'success' | 'partial' | 'failed';

export interface ImportLog {
  id: string;
  filename: string;
  fileType: ImportFileType;
  importedBy: string;
  importedAt: string;
  recordsImported: number;
  recordsFailed: number;
  errorLog: string;
  status: ImportStatus;
}

export interface ImportedReservation {
  id: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  adults: number;
  children: number;
  preferences: string;
  breakfastIncluded: boolean;
  selected: boolean;
  error: string | null;
}

export interface ColumnMapping {
  guestName: number | null;
  checkInDate: number | null;
  checkOutDate: number | null;
  roomNumber: number | null;
  adults: number | null;
  children: number | null;
  preferences: number | null;
  breakfastIncluded: number | null;
}

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  guestName: null,
  checkInDate: null,
  checkOutDate: null,
  roomNumber: null,
  adults: null,
  children: null,
  preferences: null,
  breakfastIncluded: null,
};

export type DateFormatOption = 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'dd.mm.yyyy';

export const DATE_FORMAT_OPTIONS: { value: DateFormatOption; label: string }[] = [
  { value: 'dd/mm/yyyy', label: 'JJ/MM/AAAA' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-JJ' },
  { value: 'dd-mm-yyyy', label: 'JJ-MM-AAAA' },
  { value: 'dd.mm.yyyy', label: 'JJ.MM.AAAA' },
];

export const LOG_ACTION_CONFIG: Record<LogAction, { label: string; icon: string }> = {
  hotel_created: { label: 'Hôtel créé', icon: '🏨' },
  hotel_updated: { label: 'Hôtel modifié', icon: '✏️' },
  hotel_suspended: { label: 'Hôtel suspendu', icon: '⏸️' },
  hotel_reactivated: { label: 'Hôtel réactivé', icon: '▶️' },
  hotel_deleted: { label: 'Hôtel supprimé', icon: '🗑️' },
  user_invited: { label: 'Utilisateur invité', icon: '📧' },
  user_suspended: { label: 'Utilisateur suspendu', icon: '🚫' },
  user_reactivated: { label: 'Utilisateur réactivé', icon: '✅' },
  user_deleted: { label: 'Utilisateur supprimé', icon: '🗑️' },
  support_mode_entered: { label: 'Mode support activé', icon: '🔧' },
  support_mode_exited: { label: 'Mode support quitté', icon: '🔙' },
  admin_login: { label: 'Connexion admin', icon: '🔐' },
  pms_sync_forced: { label: 'Sync PMS forcée', icon: '🔄' },
  data_export: { label: 'Export de données', icon: '📊' },
};

export interface HotelImportProfile {
  hotelName: string;
  floors: number;
  totalRooms: number;
  address: string;
  phone: string;
  email: string;
}

export interface HotelImportRoom {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  category: string;
  view: string;
  bathroomType: string;
  capacity: number;
  size: number;
  connectingRoom: boolean;
  accessiblePMR: boolean;
  error: string | null;
  selected: boolean;
}

export interface HotelImportDotation {
  id: string;
  roomType: string;
  drapPetit: number;
  drapMoyen: number;
  drapGrand: number;
  houssePetit: number;
  housseMoyen: number;
  housseGrand: number;
  serviette: number;
  drapBain: number;
  tapisBain: number;
  peignoir: number;
  slippers: number;
  savon: number;
  gelDouche: number;
  shampoing: number;
  laitCorps: number;
  cafe: number;
  the: number;
  eau: number;
  soda: number;
  snack: number;
}

export interface HotelImportResult {
  hotelCreated: boolean;
  roomsCreated: number;
  roomsIgnored: number;
  dotationCreated: number;
  qrCodesGenerated: number;
  errors: string[];
}

export type HotelImportStep = 'upload' | 'profile' | 'rooms' | 'dotation' | 'importing' | 'result';

export type ReviewType = 'room' | 'breakfast';
export type ReviewRecommendation = 'yes' | 'maybe' | 'no';

export interface RoomReviewRatings {
  cleanliness: number;
  bedComfort: number;
  equipment: number;
  bathroom: number;
  quietness: number;
  temperature: number;
  overall: number;
}

export interface BreakfastReviewRatings {
  overallQuality: number;
  variety: number;
  freshness: number;
  presentation: number;
  cleanliness: number;
  availability: number;
  serviceQuality: number;
  valueForMoney: number;
  overallSatisfaction: number;
}

export interface ClientReview {
  id: string;
  hotelId: string;
  type: ReviewType;
  roomId: string | null;
  roomNumber: string | null;
  ratings: RoomReviewRatings | BreakfastReviewRatings;
  hasProblem: boolean;
  problemDescription: string;
  comment: string;
  recommendation: ReviewRecommendation;
  createdAt: string;
}

export interface QualityAlert {
  id: string;
  hotelId: string;
  roomId: string | null;
  roomNumber: string | null;
  reviewId: string;
  category: string;
  score: number;
  clientComment: string;
  status: 'active' | 'resolved';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface RecurringIssue {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  category: string;
  occurrences: number;
  periodDays: number;
  averageScore: number;
  status: 'active' | 'resolved';
  detectedAt: string;
  resolvedAt: string | null;
}

export const ROOM_REVIEW_CATEGORIES: { key: keyof RoomReviewRatings; label: string; icon: string }[] = [
  { key: 'cleanliness', label: 'Propreté générale', icon: '✨' },
  { key: 'bedComfort', label: 'Confort de la literie', icon: '🛏️' },
  { key: 'equipment', label: 'Équipements', icon: '📺' },
  { key: 'bathroom', label: 'Salle de bain', icon: '🚿' },
  { key: 'quietness', label: 'Calme & insonorisation', icon: '🤫' },
  { key: 'temperature', label: 'Température & confort', icon: '🌡️' },
  { key: 'overall', label: 'Satisfaction globale', icon: '⭐' },
];

export const BREAKFAST_REVIEW_CATEGORIES: { key: keyof BreakfastReviewRatings; label: string; icon: string }[] = [
  { key: 'overallQuality', label: 'Qualité globale', icon: '🍽️' },
  { key: 'variety', label: 'Variété des produits', icon: '🥐' },
  { key: 'freshness', label: 'Fraîcheur des produits', icon: '🥗' },
  { key: 'presentation', label: 'Présentation du buffet', icon: '🎨' },
  { key: 'cleanliness', label: 'Propreté de la salle', icon: '✨' },
  { key: 'availability', label: 'Disponibilité (réassort)', icon: '📦' },
  { key: 'serviceQuality', label: 'Accueil & service', icon: '👋' },
  { key: 'valueForMoney', label: 'Rapport qualité/prix', icon: '💰' },
  { key: 'overallSatisfaction', label: 'Satisfaction globale', icon: '⭐' },
];

export const RECOMMENDATION_CONFIG: Record<ReviewRecommendation, { label: string; color: string; icon: string }> = {
  yes: { label: 'Oui certainement', color: '#22C55E', icon: '👍' },
  maybe: { label: 'Peut-être', color: '#F59E0B', icon: '🤔' },
  no: { label: 'Non', color: '#EF4444', icon: '👎' },
};

export interface HotelFloor {
  id: string;
  hotelId: string;
  floorNumber: number;
  createdAt: string;
}

export interface HousekeepingZone {
  id: string;
  hotelId: string;
  zoneName: string;
  floorId: string;
  floorNumber: number;
  roomIds: string[];
  createdAt: string;
}

export interface HousekeepingAssignment {
  id: string;
  hotelId: string;
  zoneId: string;
  zoneName: string;
  staffId: string;
  staffName: string;
  date: string;
  roomIds: string[];
  createdAt: string;
}

export type CleaningTaskType = 'departure_cleaning' | 'stay_cleaning' | 'deep_cleaning' | 'inspection';
export type CleaningTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface RoomCleaningTask {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  date: string;
  cleaningType: CleaningTaskType;
  status: CleaningTaskStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedMinutes: number;
  createdAt: string;
}

export interface HousekeepingStaffMember {
  id: string;
  hotelId: string;
  name: string;
  status: 'available' | 'busy' | 'off';
  maxRoomsPerDay: number;
  createdAt: string;
}

export const CLEANING_TYPE_CONFIG: Record<CleaningTaskType, { label: string; color: string; estimatedMinutes: number }> = {
  departure_cleaning: { label: 'Départ', color: '#EF4444', estimatedMinutes: 35 },
  stay_cleaning: { label: 'Recouche', color: '#F59E0B', estimatedMinutes: 20 },
  deep_cleaning: { label: 'Nettoyage profond', color: '#8B5CF6', estimatedMinutes: 60 },
  inspection: { label: 'Inspection', color: '#3B82F6', estimatedMinutes: 10 },
};

export type RoomPlanStatus = 'clean' | 'dirty' | 'cleaning' | 'occupied' | 'inspection' | 'out_of_service';

export const ROOM_PLAN_STATUS_CONFIG: Record<RoomPlanStatus, { label: string; color: string; bgColor: string }> = {
  clean: { label: 'Propre', color: '#22C55E', bgColor: 'rgba(34,197,94,0.15)' },
  dirty: { label: 'Sale', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' },
  cleaning: { label: 'En cours', color: '#EAB308', bgColor: 'rgba(234,179,8,0.15)' },
  occupied: { label: 'Occupée', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' },
  inspection: { label: 'Inspection', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.15)' },
  out_of_service: { label: 'Hors service', color: '#6B7280', bgColor: 'rgba(107,114,128,0.15)' },
};

export interface ActivityEvent {
  id: string;
  time: string;
  description: string;
  type: 'cleaning' | 'checkin' | 'checkout' | 'review' | 'alert' | 'maintenance';
  roomNumber?: string;
}

export type RoomStatus = 'libre' | 'occupe' | 'depart' | 'recouche' | 'hors_service';

export type ClientBadge = 'normal' | 'vip' | 'prioritaire';

export type CleaningStatus =
  | 'none'
  | 'en_cours'
  | 'nettoyee'
  | 'validee'
  | 'refusee';

export type RoomType = 'Simple' | 'Double' | 'Suite' | 'Deluxe' | 'Familiale';

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

export type LostFoundStatus = 'en_attente' | 'rendu' | 'donne';

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
}

export type AdminUserRole = 'reception' | 'gouvernante' | 'femme_de_chambre' | 'maintenance' | 'breakfast' | 'direction' | 'super_admin';

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

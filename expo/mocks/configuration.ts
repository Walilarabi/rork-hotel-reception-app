import {
  ConfigProductCategory,
  ConfigProduct,
  ConfigChecklistItem,
  ConfigProblemTemplate,
  ConfigRoomType,
  HousekeeperDetail,
  ConfigUser,
} from '@/constants/configTypes';

export const INITIAL_PRODUCT_CATEGORIES: ConfigProductCategory[] = [
  { id: 'cat-1', name: 'Linge', displayOrder: 1, active: true },
  { id: 'cat-2', name: 'Produits d\'accueil', displayOrder: 2, active: true },
  { id: 'cat-3', name: 'Mini-bar', displayOrder: 3, active: true },
  { id: 'cat-4', name: 'Ménage', displayOrder: 4, active: true },
];

export const INITIAL_CONFIG_PRODUCTS: ConfigProduct[] = [
  { id: 'cprod-1', categoryId: 'cat-1', name: 'Drap housse 1P', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 1, defaultQuantitySuite: 2, alertThreshold: 15, unit: 'pièce', active: true, displayOrder: 1 },
  { id: 'cprod-2', categoryId: 'cat-1', name: 'Drap housse 2P', description: '', defaultQuantitySimple: 0, defaultQuantityDouble: 1, defaultQuantitySuite: 2, alertThreshold: 10, unit: 'pièce', active: true, displayOrder: 2 },
  { id: 'cprod-3', categoryId: 'cat-1', name: 'Serviette bain', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 20, unit: 'pièce', active: true, displayOrder: 3 },
  { id: 'cprod-4', categoryId: 'cat-1', name: 'Serviette main', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 25, unit: 'pièce', active: true, displayOrder: 4 },
  { id: 'cprod-5', categoryId: 'cat-1', name: 'Peignoir', description: '', defaultQuantitySimple: 0, defaultQuantityDouble: 0, defaultQuantitySuite: 2, alertThreshold: 5, unit: 'pièce', active: true, displayOrder: 5 },
  { id: 'cprod-6', categoryId: 'cat-1', name: 'Taie oreiller', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 15, unit: 'pièce', active: true, displayOrder: 6 },
  { id: 'cprod-7', categoryId: 'cat-1', name: 'Tapis de bain', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 1, defaultQuantitySuite: 2, alertThreshold: 10, unit: 'pièce', active: true, displayOrder: 7 },
  { id: 'cprod-8', categoryId: 'cat-2', name: 'Gel douche', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 1, defaultQuantitySuite: 2, alertThreshold: 30, unit: 'flacon', active: true, displayOrder: 1 },
  { id: 'cprod-9', categoryId: 'cat-2', name: 'Shampoing', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 1, defaultQuantitySuite: 2, alertThreshold: 30, unit: 'flacon', active: true, displayOrder: 2 },
  { id: 'cprod-10', categoryId: 'cat-2', name: 'Savon', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 3, alertThreshold: 50, unit: 'pièce', active: true, displayOrder: 3 },
  { id: 'cprod-11', categoryId: 'cat-2', name: 'Bonnet douche', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 2, alertThreshold: 40, unit: 'pièce', active: true, displayOrder: 4 },
  { id: 'cprod-12', categoryId: 'cat-2', name: 'Kit dentaire', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 2, alertThreshold: 30, unit: 'pièce', active: true, displayOrder: 5 },
  { id: 'cprod-13', categoryId: 'cat-3', name: 'Eau 50cl', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 20, unit: 'bouteille', active: true, displayOrder: 1 },
  { id: 'cprod-14', categoryId: 'cat-3', name: 'Coca-Cola', description: '', defaultQuantitySimple: 1, defaultQuantityDouble: 2, defaultQuantitySuite: 2, alertThreshold: 15, unit: 'canette', active: true, displayOrder: 2 },
  { id: 'cprod-15', categoryId: 'cat-3', name: 'Bière', description: '', defaultQuantitySimple: 0, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 10, unit: 'bouteille', active: true, displayOrder: 3 },
  { id: 'cprod-16', categoryId: 'cat-4', name: 'Papier toilette', description: '', defaultQuantitySimple: 2, defaultQuantityDouble: 2, defaultQuantitySuite: 4, alertThreshold: 40, unit: 'rouleau', active: true, displayOrder: 1 },
  { id: 'cprod-17', categoryId: 'cat-4', name: 'Sac poubelle', description: '', defaultQuantitySimple: 2, defaultQuantityDouble: 2, defaultQuantitySuite: 3, alertThreshold: 50, unit: 'pièce', active: true, displayOrder: 2 },
];

export const INITIAL_CHECKLIST_ITEMS: ConfigChecklistItem[] = [
  { id: 'cl-1', category: 'Literie', itemName: 'Lits faits', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 1, active: true },
  { id: 'cl-2', category: 'Literie', itemName: 'Sous le lit vérifié', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 2, active: true },
  { id: 'cl-3', category: 'Salle de bain', itemName: 'Salle de bain propre', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 3, active: true },
  { id: 'cl-4', category: 'Salle de bain', itemName: 'Serviettes remplacées', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 4, active: true },
  { id: 'cl-5', category: 'Ménage', itemName: 'Poussière vérifiée', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 5, active: true },
  { id: 'cl-6', category: 'Ménage', itemName: 'Poubelle vidée', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 6, active: true },
  { id: 'cl-7', category: 'Ménage', itemName: 'Sol aspiré/lavé', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 7, active: true },
  { id: 'cl-8', category: 'Mini-bar', itemName: 'Mini-bar réapprovisionné', appliesToSimple: false, appliesToDouble: true, appliesToSuite: true, displayOrder: 8, active: true },
  { id: 'cl-9', category: 'Équipements', itemName: 'TV fonctionnelle', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 9, active: true },
  { id: 'cl-10', category: 'Équipements', itemName: 'Climatisation testée', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 10, active: true },
  { id: 'cl-11', category: 'Équipements', itemName: 'Coffre-fort vérifié', appliesToSimple: false, appliesToDouble: true, appliesToSuite: true, displayOrder: 11, active: true },
  { id: 'cl-12', category: 'Général', itemName: 'Aucun objet oublié', appliesToSimple: true, appliesToDouble: true, appliesToSuite: true, displayOrder: 12, active: true },
];

export const INITIAL_PROBLEM_TEMPLATES: ConfigProblemTemplate[] = [
  { id: 'pt-1', label: 'WC bouché', iconName: 'toilet', maintenanceCategory: 'Plomberie', defaultPriority: 'haute', displayOrder: 1, active: true },
  { id: 'pt-2', label: 'Ampoule grillée', iconName: 'lightbulb', maintenanceCategory: 'Électricité', defaultPriority: 'basse', displayOrder: 2, active: true },
  { id: 'pt-3', label: 'Fuite d\'eau', iconName: 'droplets', maintenanceCategory: 'Plomberie', defaultPriority: 'haute', displayOrder: 3, active: true },
  { id: 'pt-4', label: 'Climatisation HS', iconName: 'thermometer', maintenanceCategory: 'Climatisation', defaultPriority: 'haute', displayOrder: 4, active: true },
  { id: 'pt-5', label: 'Serrure bloquée', iconName: 'lock', maintenanceCategory: 'Serrurerie', defaultPriority: 'haute', displayOrder: 5, active: true },
  { id: 'pt-6', label: 'TV en panne', iconName: 'tv', maintenanceCategory: 'Multimédia', defaultPriority: 'moyenne', displayOrder: 6, active: true },
  { id: 'pt-7', label: 'Wi-Fi défaillant', iconName: 'wifi', maintenanceCategory: 'Multimédia', defaultPriority: 'moyenne', displayOrder: 7, active: true },
  { id: 'pt-8', label: 'Prise électrique', iconName: 'zap', maintenanceCategory: 'Électricité', defaultPriority: 'moyenne', displayOrder: 8, active: true },
];

export const INITIAL_CONFIG_ROOM_TYPES: ConfigRoomType[] = [
  { id: 'rt-1', name: 'Simple', code: 'SGL', displayOrder: 1, active: true },
  { id: 'rt-2', name: 'Double', code: 'DBL', displayOrder: 2, active: true },
  { id: 'rt-3', name: 'Twin', code: 'TWN', displayOrder: 3, active: true },
  { id: 'rt-4', name: 'Suite', code: 'STE', displayOrder: 4, active: true },
  { id: 'rt-5', name: 'Deluxe', code: 'DLX', displayOrder: 5, active: true },
  { id: 'rt-6', name: 'Familiale', code: 'FAM', displayOrder: 6, active: true },
];

export const INITIAL_CONFIG_USERS: ConfigUser[] = [
  { id: 'cu-1', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@grandhotelparis.fr', role: 'reception', active: true, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'cu-2', firstName: 'Catherine', lastName: 'Moreau', email: 'c.moreau@grandhotelparis.fr', role: 'gouvernante', active: true, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'cu-3', firstName: 'Pierre', lastName: 'Durand', email: 'pierre.durand@grandhotelparis.fr', role: 'maintenance', active: true, createdAt: '2025-02-01T09:00:00Z' },
  { id: 'cu-4', firstName: 'Claire', lastName: 'Petit', email: 'claire.petit@grandhotelparis.fr', role: 'breakfast', active: true, createdAt: '2025-02-10T08:00:00Z' },
];

export const INITIAL_HOUSEKEEPER_DETAILS: HousekeeperDetail[] = [
  { id: 'hk-1', firstName: 'Julie', lastName: 'Thomas', photoUrl: '', contractType: 'CDI', assignedFloors: [1, 2], active: true },
  { id: 'hk-2', firstName: 'Fatima', lastName: 'Benali', photoUrl: '', contractType: 'CDI', assignedFloors: [2, 3], active: true },
  { id: 'hk-3', firstName: 'Maria', lastName: 'Santos', photoUrl: '', contractType: 'CDD', assignedFloors: [3, 4], active: true },
  { id: 'hk-4', firstName: 'Aminata', lastName: 'Diallo', photoUrl: '', contractType: 'CDI', assignedFloors: [1], active: true },
  { id: 'hk-5', firstName: 'Nathalie', lastName: 'Petit', photoUrl: '', contractType: 'Intérimaire', assignedFloors: [4], active: false },
];

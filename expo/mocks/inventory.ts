import { InventoryItem, LostFoundItem, Inspection } from '@/constants/types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', itemName: 'Serviettes de bain', category: 'linge', currentStock: 45, minimumThreshold: 20, unit: 'pièces', location: 'Réserve centrale', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv2', itemName: 'Draps (lit simple)', category: 'linge', currentStock: 30, minimumThreshold: 15, unit: 'pièces', location: 'Réserve centrale', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv3', itemName: 'Draps (lit double)', category: 'linge', currentStock: 8, minimumThreshold: 10, unit: 'pièces', location: 'Réserve centrale', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv4', itemName: 'Gel douche', category: 'produit', currentStock: 120, minimumThreshold: 50, unit: 'flacons', location: 'Étage 1', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv5', itemName: 'Shampoing', category: 'produit', currentStock: 95, minimumThreshold: 50, unit: 'flacons', location: 'Étage 1', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv6', itemName: 'Eau minérale (mini-bar)', category: 'minibar', currentStock: 5, minimumThreshold: 20, unit: 'bouteilles', location: 'Étage 2', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv7', itemName: 'Savon', category: 'produit', currentStock: 200, minimumThreshold: 80, unit: 'pièces', location: 'Réserve centrale', lastUpdated: '2026-03-01T07:00:00Z' },
  { id: 'inv8', itemName: 'Taies d\'oreiller', category: 'linge', currentStock: 25, minimumThreshold: 15, unit: 'pièces', location: 'Réserve centrale', lastUpdated: '2026-03-01T07:00:00Z' },
];

export const INITIAL_LOST_FOUND: LostFoundItem[] = [
  {
    id: 'lf1',
    roomId: '9',
    roomNumber: '204',
    reportedBy: 'Sophie Martin',
    itemName: 'Montre dorée',
    description: 'Montre dorée trouvée sur la table de nuit',
    foundDate: '2026-03-01',
    status: 'en_attente',
    returnedTo: '',
  },
  {
    id: 'lf2',
    roomId: '4',
    roomNumber: '104',
    reportedBy: 'Marie Dupont',
    itemName: 'Chargeur iPhone',
    description: 'Chargeur blanc Apple trouvé sous le lit',
    foundDate: '2026-03-01',
    status: 'en_attente',
    returnedTo: '',
  },
];

export const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: 'insp1',
    roomId: '9',
    roomNumber: '204',
    roomType: 'Double',
    floor: 2,
    cleanedBy: 'Sophie Martin',
    completedAt: '2026-03-01T08:45:00Z',
    status: 'en_attente',
    checklistResults: {},
    comments: '',
    guestName: 'David Leblanc',
  },
  {
    id: 'insp2',
    roomId: '10',
    roomNumber: '205',
    roomType: 'Deluxe',
    floor: 2,
    cleanedBy: 'Marie Dupont',
    completedAt: '2026-03-01T08:30:00Z',
    status: 'valide',
    checklistResults: { lits: true, sous_lit: true, sdb: true, poubelle: true, objets: true, minibar: true, poussiere: true, equipements: true },
    comments: '',
    guestName: null,
  },
];

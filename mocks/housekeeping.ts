import {
  HotelFloor,
  HousekeepingZone,
  HousekeepingAssignment,
  RoomCleaningTask,
  HousekeepingStaffMember,
  ActivityEvent,
} from '@/constants/types';

const today = new Date().toISOString().split('T')[0];

export const INITIAL_FLOORS: HotelFloor[] = [
  { id: 'floor-1', hotelId: 'hotel-1', floorNumber: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'floor-2', hotelId: 'hotel-1', floorNumber: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'floor-3', hotelId: 'hotel-1', floorNumber: 3, createdAt: '2026-01-01T00:00:00Z' },
];

export const INITIAL_ZONES: HousekeepingZone[] = [
  { id: 'zone-1', hotelId: 'hotel-1', zoneName: 'Zone 1', floorId: 'floor-1', floorNumber: 1, roomIds: ['1', '2', '3', '4', '5'], createdAt: '2026-01-01T00:00:00Z' },
  { id: 'zone-2', hotelId: 'hotel-1', zoneName: 'Zone 2', floorId: 'floor-2', floorNumber: 2, roomIds: ['6', '7', '8', '9', '10'], createdAt: '2026-01-01T00:00:00Z' },
  { id: 'zone-3', hotelId: 'hotel-1', zoneName: 'Zone 3', floorId: 'floor-3', floorNumber: 3, roomIds: ['11', '12', '13', '14', '15'], createdAt: '2026-01-01T00:00:00Z' },
];

export const INITIAL_HK_STAFF: HousekeepingStaffMember[] = [
  { id: 'hks-1', hotelId: 'hotel-1', name: 'Maria Lopez', status: 'available', maxRoomsPerDay: 12, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'hks-2', hotelId: 'hotel-1', name: 'Fatima Benali', status: 'available', maxRoomsPerDay: 14, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'hks-3', hotelId: 'hotel-1', name: 'Sofia Durand', status: 'available', maxRoomsPerDay: 10, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'hks-4', hotelId: 'hotel-1', name: 'Nadia Petit', status: 'off', maxRoomsPerDay: 12, createdAt: '2026-01-01T00:00:00Z' },
];

export const INITIAL_ASSIGNMENTS: HousekeepingAssignment[] = [
  { id: 'assign-1', hotelId: 'hotel-1', zoneId: 'zone-1', zoneName: 'Zone 1', staffId: 'hks-1', staffName: 'Maria Lopez', date: today, roomIds: ['1', '2', '3', '4', '5'], createdAt: today + 'T06:00:00Z' },
  { id: 'assign-2', hotelId: 'hotel-1', zoneId: 'zone-2', zoneName: 'Zone 2', staffId: 'hks-2', staffName: 'Fatima Benali', date: today, roomIds: ['6', '7', '8', '9', '10'], createdAt: today + 'T06:00:00Z' },
  { id: 'assign-3', hotelId: 'hotel-1', zoneId: 'zone-3', zoneName: 'Zone 3', staffId: 'hks-3', staffName: 'Sofia Durand', date: today, roomIds: ['11', '12', '13', '14', '15'], createdAt: today + 'T06:00:00Z' },
];

export const INITIAL_CLEANING_TASKS: RoomCleaningTask[] = [
  { id: 'ct-1', hotelId: 'hotel-1', roomId: '4', roomNumber: '104', date: today, cleaningType: 'departure_cleaning', status: 'pending', assignedTo: 'hks-1', assignedToName: 'Maria Lopez', startedAt: null, completedAt: null, estimatedMinutes: 35, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-2', hotelId: 'hotel-1', roomId: '5', roomNumber: '105', date: today, cleaningType: 'stay_cleaning', status: 'in_progress', assignedTo: 'hks-1', assignedToName: 'Maria Lopez', startedAt: today + 'T09:24:00Z', completedAt: null, estimatedMinutes: 20, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-3', hotelId: 'hotel-1', roomId: '7', roomNumber: '202', date: today, cleaningType: 'departure_cleaning', status: 'pending', assignedTo: 'hks-2', assignedToName: 'Fatima Benali', startedAt: null, completedAt: null, estimatedMinutes: 35, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-4', hotelId: 'hotel-1', roomId: '8', roomNumber: '203', date: today, cleaningType: 'stay_cleaning', status: 'in_progress', assignedTo: 'hks-2', assignedToName: 'Fatima Benali', startedAt: today + 'T09:24:00Z', completedAt: null, estimatedMinutes: 20, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-5', hotelId: 'hotel-1', roomId: '9', roomNumber: '204', date: today, cleaningType: 'departure_cleaning', status: 'completed', assignedTo: 'hks-1', assignedToName: 'Maria Lopez', startedAt: today + 'T08:00:00Z', completedAt: today + 'T08:45:00Z', estimatedMinutes: 35, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-6', hotelId: 'hotel-1', roomId: '13', roomNumber: '303', date: today, cleaningType: 'stay_cleaning', status: 'pending', assignedTo: 'hks-3', assignedToName: 'Sofia Durand', startedAt: null, completedAt: null, estimatedMinutes: 20, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-7', hotelId: 'hotel-1', roomId: '2', roomNumber: '102', date: today, cleaningType: 'inspection', status: 'completed', assignedTo: 'hks-1', assignedToName: 'Maria Lopez', startedAt: today + 'T07:30:00Z', completedAt: today + 'T07:40:00Z', estimatedMinutes: 10, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-8', hotelId: 'hotel-1', roomId: '10', roomNumber: '205', date: today, cleaningType: 'departure_cleaning', status: 'completed', assignedTo: 'hks-2', assignedToName: 'Fatima Benali', startedAt: today + 'T07:00:00Z', completedAt: today + 'T07:35:00Z', estimatedMinutes: 35, createdAt: today + 'T06:00:00Z' },
  { id: 'ct-9', hotelId: 'hotel-1', roomId: '11', roomNumber: '301', date: today, cleaningType: 'deep_cleaning', status: 'completed', assignedTo: 'hks-3', assignedToName: 'Sofia Durand', startedAt: today + 'T07:00:00Z', completedAt: today + 'T08:00:00Z', estimatedMinutes: 60, createdAt: today + 'T06:00:00Z' },
];

export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: 'evt-1', time: today + 'T10:05:00Z', description: 'Nettoyage commencé', type: 'cleaning', roomNumber: '203' },
  { id: 'evt-2', time: today + 'T10:22:00Z', description: 'Nettoyage terminé', type: 'cleaning', roomNumber: '105' },
  { id: 'evt-3', time: today + 'T10:28:00Z', description: 'Avis client reçu (4/5)', type: 'review', roomNumber: '304' },
  { id: 'evt-4', time: today + 'T10:40:00Z', description: 'Check-in effectué', type: 'checkin', roomNumber: '201' },
  { id: 'evt-5', time: today + 'T09:15:00Z', description: 'Check-out effectué', type: 'checkout', roomNumber: '204' },
  { id: 'evt-6', time: today + 'T09:30:00Z', description: 'Alerte propreté (2/5)', type: 'alert', roomNumber: '312' },
  { id: 'evt-7', time: today + 'T08:45:00Z', description: 'Intervention plomberie', type: 'maintenance', roomNumber: '305' },
  { id: 'evt-8', time: today + 'T08:00:00Z', description: 'Nettoyage terminé', type: 'cleaning', roomNumber: '204' },
  { id: 'evt-9', time: today + 'T07:40:00Z', description: 'Inspection terminée', type: 'cleaning', roomNumber: '102' },
  { id: 'evt-10', time: today + 'T07:35:00Z', description: 'Nettoyage terminé', type: 'cleaning', roomNumber: '205' },
];

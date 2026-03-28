import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  Room,
  StaffMember,
  PMSSyncState,
  RoomStatus,
  ClientBadge,
  RoomType,
  RoomHistoryEntry,
  MaintenanceTask,
  MaintenanceType,
  MaintenanceSchedule,
  MaintenanceCost,
  BreakfastOrder,
  Inspection,
  InventoryItem,
  LostFoundItem,
  InspectionStatus,
  ConsumableProduct,
  ConsumptionLog,
  StockMovement,
  BreakfastStaff,
  BreakfastService,
  BreakfastConfig,
  BreakfastProduct,
} from '@/constants/types';
import { INITIAL_ROOMS, INITIAL_STAFF } from '@/mocks/rooms';
import {
  INITIAL_MAINTENANCE,
  INITIAL_MAINTENANCE_TYPES,
  INITIAL_MAINTENANCE_SCHEDULES,
  INITIAL_BREAKFAST_STAFF,
  INITIAL_BREAKFAST_SERVICES,
  INITIAL_BREAKFAST_CONFIG,
  INITIAL_BREAKFAST_PRODUCTS,
} from '@/mocks/maintenance';
import { INITIAL_BREAKFAST_ORDERS } from '@/mocks/breakfast';
import { INITIAL_INSPECTIONS, INITIAL_INVENTORY, INITIAL_LOST_FOUND } from '@/mocks/inventory';
import { INITIAL_CONSUMABLE_PRODUCTS, INITIAL_CONSUMPTION_LOGS, INITIAL_STOCK_MOVEMENTS } from '@/mocks/consumables';

const ROOMS_KEY = 'hotel_rooms_v2';
const STAFF_KEY = 'hotel_staff_v2';
const PMS_KEY = 'pms_sync_state';
const MAINTENANCE_KEY = 'hotel_maintenance';
const BREAKFAST_KEY = 'hotel_breakfast';
const INSPECTIONS_KEY = 'hotel_inspections';
const INVENTORY_KEY = 'hotel_inventory';
const LOST_FOUND_KEY = 'hotel_lost_found';
const CONSUMABLE_PRODUCTS_KEY = 'hotel_consumable_products';
const CONSUMPTION_LOGS_KEY = 'hotel_consumption_logs';
const STOCK_MOVEMENTS_KEY = 'hotel_stock_movements';
const MAINT_TYPES_KEY = 'hotel_maintenance_types';
const MAINT_SCHEDULES_KEY = 'hotel_maintenance_schedules';
const BFAST_STAFF_KEY = 'hotel_breakfast_staff';
const BFAST_SERVICES_KEY = 'hotel_breakfast_services';
const BFAST_CONFIG_KEY = 'hotel_breakfast_config';
const BFAST_PRODUCTS_KEY = 'hotel_breakfast_products';
const CONSERVATION_DELAY_KEY = 'hotel_conservation_delay';

export const [HotelProvider, useHotel] = createContextHook(() => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [breakfastOrders, setBreakfastOrders] = useState<BreakfastOrder[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [consumableProducts, setConsumableProducts] = useState<ConsumableProduct[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [breakfastStaff, setBreakfastStaff] = useState<BreakfastStaff[]>([]);
  const [breakfastServices, setBreakfastServices] = useState<BreakfastService[]>([]);
  const [breakfastConfig, setBreakfastConfig] = useState<BreakfastConfig>(INITIAL_BREAKFAST_CONFIG);
  const [breakfastProducts, setBreakfastProducts] = useState<BreakfastProduct[]>([]);
  const [conservationDelayDays, setConservationDelayDays] = useState<number>(30);
  const [pmsSync, setPmsSync] = useState<PMSSyncState>({
    status: 'idle',
    lastSyncTime: null,
    recordsUpdated: 0,
    errorMessage: null,
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ROOMS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Room[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading rooms, resetting:', e);
        await AsyncStorage.removeItem(ROOMS_KEY);
      }
      await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    },
  });

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STAFF_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StaffMember[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading staff, resetting:', e);
        await AsyncStorage.removeItem(STAFF_KEY);
      }
      await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    },
  });

  const pmsQuery = useQuery({
    queryKey: ['pmsSync'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(PMS_KEY);
        if (stored) return JSON.parse(stored) as PMSSyncState;
      } catch (e) {
        console.log('[HotelProvider] Error reading PMS state, resetting:', e);
        await AsyncStorage.removeItem(PMS_KEY);
      }
      return { status: 'idle' as const, lastSyncTime: null, recordsUpdated: 0, errorMessage: null };
    },
  });

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(MAINTENANCE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as MaintenanceTask[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading maintenance, resetting:', e);
        await AsyncStorage.removeItem(MAINTENANCE_KEY);
      }
      await AsyncStorage.setItem(MAINTENANCE_KEY, JSON.stringify(INITIAL_MAINTENANCE));
      return INITIAL_MAINTENANCE;
    },
  });

  const breakfastQuery = useQuery({
    queryKey: ['breakfast'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(BREAKFAST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as BreakfastOrder[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading breakfast, resetting:', e);
        await AsyncStorage.removeItem(BREAKFAST_KEY);
      }
      await AsyncStorage.setItem(BREAKFAST_KEY, JSON.stringify(INITIAL_BREAKFAST_ORDERS));
      return INITIAL_BREAKFAST_ORDERS;
    },
  });

  const inspectionsQuery = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(INSPECTIONS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Inspection[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading inspections, resetting:', e);
        await AsyncStorage.removeItem(INSPECTIONS_KEY);
      }
      await AsyncStorage.setItem(INSPECTIONS_KEY, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    },
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(INVENTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as InventoryItem[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading inventory, resetting:', e);
        await AsyncStorage.removeItem(INVENTORY_KEY);
      }
      await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(INITIAL_INVENTORY));
      return INITIAL_INVENTORY;
    },
  });

  const lostFoundQuery = useQuery({
    queryKey: ['lostFound'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(LOST_FOUND_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as LostFoundItem[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading lostFound, resetting:', e);
        await AsyncStorage.removeItem(LOST_FOUND_KEY);
      }
      await AsyncStorage.setItem(LOST_FOUND_KEY, JSON.stringify(INITIAL_LOST_FOUND));
      return INITIAL_LOST_FOUND;
    },
  });

  const consumableProductsQuery = useQuery({
    queryKey: ['consumableProducts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(CONSUMABLE_PRODUCTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ConsumableProduct[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading consumable products:', e);
        await AsyncStorage.removeItem(CONSUMABLE_PRODUCTS_KEY);
      }
      await AsyncStorage.setItem(CONSUMABLE_PRODUCTS_KEY, JSON.stringify(INITIAL_CONSUMABLE_PRODUCTS));
      return INITIAL_CONSUMABLE_PRODUCTS;
    },
  });

  const consumptionLogsQuery = useQuery({
    queryKey: ['consumptionLogs'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(CONSUMPTION_LOGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ConsumptionLog[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading consumption logs:', e);
        await AsyncStorage.removeItem(CONSUMPTION_LOGS_KEY);
      }
      await AsyncStorage.setItem(CONSUMPTION_LOGS_KEY, JSON.stringify(INITIAL_CONSUMPTION_LOGS));
      return INITIAL_CONSUMPTION_LOGS;
    },
  });

  const stockMovementsQuery = useQuery({
    queryKey: ['stockMovements'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STOCK_MOVEMENTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StockMovement[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.log('[HotelProvider] Error reading stock movements:', e);
        await AsyncStorage.removeItem(STOCK_MOVEMENTS_KEY);
      }
      await AsyncStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
      return INITIAL_STOCK_MOVEMENTS;
    },
  });

  useEffect(() => { if (roomsQuery.data) setRooms(roomsQuery.data); }, [roomsQuery.data]);
  useEffect(() => { if (staffQuery.data) setStaff(staffQuery.data); }, [staffQuery.data]);
  useEffect(() => { if (pmsQuery.data) setPmsSync(pmsQuery.data); }, [pmsQuery.data]);
  useEffect(() => { if (maintenanceQuery.data) setMaintenanceTasks(maintenanceQuery.data); }, [maintenanceQuery.data]);
  useEffect(() => { if (breakfastQuery.data) setBreakfastOrders(breakfastQuery.data); }, [breakfastQuery.data]);
  useEffect(() => { if (inspectionsQuery.data) setInspections(inspectionsQuery.data); }, [inspectionsQuery.data]);
  useEffect(() => { if (inventoryQuery.data) setInventoryItems(inventoryQuery.data); }, [inventoryQuery.data]);
  useEffect(() => { if (lostFoundQuery.data) setLostFoundItems(lostFoundQuery.data); }, [lostFoundQuery.data]);

  const conservationDelayQuery = useQuery({
    queryKey: ['conservationDelay'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(CONSERVATION_DELAY_KEY);
        if (stored) return JSON.parse(stored) as number;
      } catch (e) { console.log('[HotelProvider] Error reading conservation delay:', e); }
      return 30;
    },
  });
  useEffect(() => { if (conservationDelayQuery.data !== undefined) setConservationDelayDays(conservationDelayQuery.data); }, [conservationDelayQuery.data]);
  useEffect(() => { if (consumableProductsQuery.data) setConsumableProducts(consumableProductsQuery.data); }, [consumableProductsQuery.data]);
  useEffect(() => { if (consumptionLogsQuery.data) setConsumptionLogs(consumptionLogsQuery.data); }, [consumptionLogsQuery.data]);
  useEffect(() => { if (stockMovementsQuery.data) setStockMovements(stockMovementsQuery.data); }, [stockMovementsQuery.data]);

  const maintTypesQuery = useQuery({
    queryKey: ['maintenanceTypes'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(MAINT_TYPES_KEY);
        if (stored) { const p = JSON.parse(stored) as MaintenanceType[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HotelProvider] Error reading maint types:', e); await AsyncStorage.removeItem(MAINT_TYPES_KEY); }
      await AsyncStorage.setItem(MAINT_TYPES_KEY, JSON.stringify(INITIAL_MAINTENANCE_TYPES));
      return INITIAL_MAINTENANCE_TYPES;
    },
  });
  const maintSchedulesQuery = useQuery({
    queryKey: ['maintenanceSchedules'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(MAINT_SCHEDULES_KEY);
        if (stored) { const p = JSON.parse(stored) as MaintenanceSchedule[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HotelProvider] Error reading maint schedules:', e); await AsyncStorage.removeItem(MAINT_SCHEDULES_KEY); }
      await AsyncStorage.setItem(MAINT_SCHEDULES_KEY, JSON.stringify(INITIAL_MAINTENANCE_SCHEDULES));
      return INITIAL_MAINTENANCE_SCHEDULES;
    },
  });
  const bfastStaffQuery = useQuery({
    queryKey: ['breakfastStaff'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(BFAST_STAFF_KEY);
        if (stored) { const p = JSON.parse(stored) as BreakfastStaff[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HotelProvider] Error reading bfast staff:', e); await AsyncStorage.removeItem(BFAST_STAFF_KEY); }
      await AsyncStorage.setItem(BFAST_STAFF_KEY, JSON.stringify(INITIAL_BREAKFAST_STAFF));
      return INITIAL_BREAKFAST_STAFF;
    },
  });
  const bfastServicesQuery = useQuery({
    queryKey: ['breakfastServices'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(BFAST_SERVICES_KEY);
        if (stored) { const p = JSON.parse(stored) as BreakfastService[]; if (Array.isArray(p)) return p; }
      } catch (e) { console.log('[HotelProvider] Error reading bfast services:', e); await AsyncStorage.removeItem(BFAST_SERVICES_KEY); }
      await AsyncStorage.setItem(BFAST_SERVICES_KEY, JSON.stringify(INITIAL_BREAKFAST_SERVICES));
      return INITIAL_BREAKFAST_SERVICES;
    },
  });
  const bfastConfigQuery = useQuery({
    queryKey: ['breakfastConfig'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(BFAST_CONFIG_KEY);
        if (stored) return JSON.parse(stored) as BreakfastConfig;
      } catch (e) { console.log('[HotelProvider] Error reading bfast config:', e); await AsyncStorage.removeItem(BFAST_CONFIG_KEY); }
      await AsyncStorage.setItem(BFAST_CONFIG_KEY, JSON.stringify(INITIAL_BREAKFAST_CONFIG));
      return INITIAL_BREAKFAST_CONFIG;
    },
  });
  const bfastProductsQuery = useQuery({
    queryKey: ['breakfastProducts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(BFAST_PRODUCTS_KEY);
        if (stored) { const p = JSON.parse(stored) as BreakfastProduct[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HotelProvider] Error reading bfast products:', e); await AsyncStorage.removeItem(BFAST_PRODUCTS_KEY); }
      await AsyncStorage.setItem(BFAST_PRODUCTS_KEY, JSON.stringify(INITIAL_BREAKFAST_PRODUCTS));
      return INITIAL_BREAKFAST_PRODUCTS;
    },
  });

  useEffect(() => { if (maintTypesQuery.data) setMaintenanceTypes(maintTypesQuery.data); }, [maintTypesQuery.data]);
  useEffect(() => { if (maintSchedulesQuery.data) setMaintenanceSchedules(maintSchedulesQuery.data); }, [maintSchedulesQuery.data]);
  useEffect(() => { if (bfastStaffQuery.data) setBreakfastStaff(bfastStaffQuery.data); }, [bfastStaffQuery.data]);
  useEffect(() => { if (bfastServicesQuery.data) setBreakfastServices(bfastServicesQuery.data); }, [bfastServicesQuery.data]);
  useEffect(() => { if (bfastConfigQuery.data) setBreakfastConfig(bfastConfigQuery.data); }, [bfastConfigQuery.data]);
  useEffect(() => { if (bfastProductsQuery.data) setBreakfastProducts(bfastProductsQuery.data); }, [bfastProductsQuery.data]);

  const persistRooms = useCallback(async (updated: Room[]) => {
    setRooms(updated);
    await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
  }, []);

  const persistStaff = useCallback(async (updated: StaffMember[]) => {
    setStaff(updated);
    await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(updated));
  }, []);

  const persistPms = useCallback(async (updated: PMSSyncState) => {
    setPmsSync(updated);
    await AsyncStorage.setItem(PMS_KEY, JSON.stringify(updated));
  }, []);

  const persistMaintenance = useCallback(async (updated: MaintenanceTask[]) => {
    setMaintenanceTasks(updated);
    await AsyncStorage.setItem(MAINTENANCE_KEY, JSON.stringify(updated));
  }, []);

  const persistBreakfast = useCallback(async (updated: BreakfastOrder[]) => {
    setBreakfastOrders(updated);
    await AsyncStorage.setItem(BREAKFAST_KEY, JSON.stringify(updated));
  }, []);

  const persistInspections = useCallback(async (updated: Inspection[]) => {
    setInspections(updated);
    await AsyncStorage.setItem(INSPECTIONS_KEY, JSON.stringify(updated));
  }, []);

  const persistInventory = useCallback(async (updated: InventoryItem[]) => {
    setInventoryItems(updated);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
  }, []);

  const persistLostFound = useCallback(async (updated: LostFoundItem[]) => {
    setLostFoundItems(updated);
    await AsyncStorage.setItem(LOST_FOUND_KEY, JSON.stringify(updated));
  }, []);

  const persistConsumableProducts = useCallback(async (updated: ConsumableProduct[]) => {
    setConsumableProducts(updated);
    await AsyncStorage.setItem(CONSUMABLE_PRODUCTS_KEY, JSON.stringify(updated));
  }, []);

  const persistConsumptionLogs = useCallback(async (updated: ConsumptionLog[]) => {
    setConsumptionLogs(updated);
    await AsyncStorage.setItem(CONSUMPTION_LOGS_KEY, JSON.stringify(updated));
  }, []);

  const persistStockMovements = useCallback(async (updated: StockMovement[]) => {
    setStockMovements(updated);
    await AsyncStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(updated));
  }, []);

  const persistMaintTypes = useCallback(async (updated: MaintenanceType[]) => {
    setMaintenanceTypes(updated);
    await AsyncStorage.setItem(MAINT_TYPES_KEY, JSON.stringify(updated));
  }, []);
  const persistMaintSchedules = useCallback(async (updated: MaintenanceSchedule[]) => {
    setMaintenanceSchedules(updated);
    await AsyncStorage.setItem(MAINT_SCHEDULES_KEY, JSON.stringify(updated));
  }, []);
  const persistBfastStaff = useCallback(async (updated: BreakfastStaff[]) => {
    setBreakfastStaff(updated);
    await AsyncStorage.setItem(BFAST_STAFF_KEY, JSON.stringify(updated));
  }, []);
  const persistBfastServices = useCallback(async (updated: BreakfastService[]) => {
    setBreakfastServices(updated);
    await AsyncStorage.setItem(BFAST_SERVICES_KEY, JSON.stringify(updated));
  }, []);
  const persistBfastConfig = useCallback(async (updated: BreakfastConfig) => {
    setBreakfastConfig(updated);
    await AsyncStorage.setItem(BFAST_CONFIG_KEY, JSON.stringify(updated));
  }, []);
  const persistBfastProducts = useCallback(async (updated: BreakfastProduct[]) => {
    setBreakfastProducts(updated);
    await AsyncStorage.setItem(BFAST_PRODUCTS_KEY, JSON.stringify(updated));
  }, []);

  const updateLostFoundItemMutation = useMutation({
    mutationFn: async (params: { itemId: string; updates: Partial<LostFoundItem> }) => {
      console.log('[HotelProvider] Updating lost found item', params.itemId, params.updates);
      const updated = lostFoundItems.map((item) =>
        item.id === params.itemId ? { ...item, ...params.updates } : item
      );
      await persistLostFound(updated);
      return updated;
    },
  });

  const updateConservationDelayMutation = useMutation({
    mutationFn: async (days: number) => {
      console.log('[HotelProvider] Updating conservation delay to', days, 'days');
      setConservationDelayDays(days);
      await AsyncStorage.setItem(CONSERVATION_DELAY_KEY, JSON.stringify(days));
      return days;
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (params: { roomId: string; updates: Partial<Room> }) => {
      const updated = rooms.map((r) =>
        r.id === params.roomId ? { ...r, ...params.updates } : r
      );
      await persistRooms(updated);
      return updated;
    },
  });

  const addRoomMutation = useMutation({
    mutationFn: async (params: { roomNumber: string; floor: number; roomType: RoomType; status: RoomStatus; roomCategory?: string; roomSize?: number; capacity?: number; equipment?: string[]; dotation?: string[]; viewType?: Room['viewType']; bathroomType?: Room['bathroomType'] }) => {
      const newRoom: Room = {
        id: Date.now().toString(),
        roomNumber: params.roomNumber,
        floor: params.floor,
        roomType: params.roomType,
        status: params.status,
        clientBadge: 'normal',
        vipInstructions: '',
        cleaningStatus: 'none',
        cleaningAssignee: null,
        assignedTo: null,
        cleaningStartedAt: null,
        cleaningCompletedAt: null,
        breakfastIncluded: false,
        viewType: params.viewType ?? 'Rue',
        bathroomType: params.bathroomType ?? 'Douche',
        roomCategory: params.roomCategory ?? 'Classique',
        roomSize: params.roomSize ?? 16,
        capacity: params.capacity ?? 2,
        equipment: params.equipment ?? [],
        dotation: params.dotation ?? [],
        currentReservation: null,
        history: [{
          id: `h-${Date.now()}`,
          roomId: Date.now().toString(),
          action: 'Création',
          performedBy: 'Réception',
          date: new Date().toISOString(),
          details: 'Chambre ajoutée au système',
        }],
      };
      const updated = [...rooms, newRoom];
      await persistRooms(updated);
      return newRoom;
    },
  });

  const bulkImportRoomsMutation = useMutation({
    mutationFn: async (importedRooms: Array<{ roomNumber: string; floor: number; roomType: RoomType; roomCategory: string; roomSize: number; capacity: number; equipment: string[]; dotation: string[] }>) => {
      console.log('[HotelProvider] Bulk importing rooms:', importedRooms.length);
      const now = Date.now();
      const newRooms: Room[] = importedRooms.map((r, idx) => {
        const existingRoom = rooms.find((er) => er.roomNumber === r.roomNumber);
        if (existingRoom) {
          return {
            ...existingRoom,
            floor: r.floor,
            roomType: r.roomType,
            roomCategory: r.roomCategory,
            roomSize: r.roomSize,
            capacity: r.capacity,
            equipment: r.equipment,
            dotation: r.dotation,
            history: [...existingRoom.history, {
              id: `h-${now}-${idx}`,
              roomId: existingRoom.id,
              action: 'Import mise à jour',
              performedBy: 'Configuration',
              date: new Date().toISOString(),
              details: 'Chambre mise à jour via import Excel',
            }],
          };
        }
        const roomId = `${now}-${idx}`;
        return {
          id: roomId,
          roomNumber: r.roomNumber,
          floor: r.floor,
          roomType: r.roomType,
          status: 'libre' as RoomStatus,
          clientBadge: 'normal' as ClientBadge,
          vipInstructions: '',
          cleaningStatus: 'none' as const,
          cleaningAssignee: null,
          assignedTo: null,
          cleaningStartedAt: null,
          cleaningCompletedAt: null,
          breakfastIncluded: false,
          viewType: 'Rue' as const,
          bathroomType: 'Douche' as const,
          roomCategory: r.roomCategory,
          roomSize: r.roomSize,
          capacity: r.capacity,
          equipment: r.equipment,
          dotation: r.dotation,
          currentReservation: null,
          history: [{
            id: `h-${now}-${idx}`,
            roomId,
            action: 'Création (import)',
            performedBy: 'Configuration',
            date: new Date().toISOString(),
            details: 'Chambre créée via import Excel',
          }],
        };
      });
      const existingNumbers = new Set(newRooms.map((r) => r.roomNumber));
      const kept = rooms.filter((r) => !existingNumbers.has(r.roomNumber));
      const merged = [...kept, ...newRooms].sort((a, b) => {
        if (a.floor !== b.floor) return a.floor - b.floor;
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
      await persistRooms(merged);
      console.log('[HotelProvider] Bulk import complete. Total rooms:', merged.length);
      return { created: newRooms.filter((r) => !rooms.find((er) => er.roomNumber === r.roomNumber)).length, updated: newRooms.filter((r) => rooms.find((er) => er.roomNumber === r.roomNumber)).length };
    },
  });

  const bulkImportReservationsMutation = useMutation({
    mutationFn: async (reservations: Array<{ roomNumber: string; guestName: string; checkInDate: string; checkOutDate: string; adults: number; children: number; preferences: string; breakfastIncluded: boolean }>) => {
      console.log('[HotelProvider] Bulk importing reservations:', reservations.length);
      const today = new Date().toISOString().split('T')[0];
      let imported = 0;
      let failed = 0;
      const updatedRooms = [...rooms];

      for (const res of reservations) {
        const roomIdx = updatedRooms.findIndex((r) => r.roomNumber === res.roomNumber);
        if (roomIdx === -1) {
          console.log('[HotelProvider] Room not found for import:', res.roomNumber);
          failed++;
          continue;
        }

        const room = updatedRooms[roomIdx];
        let newStatus: RoomStatus = room.status;
        if (res.checkOutDate <= today) {
          newStatus = 'depart';
        } else if (res.checkInDate <= today && res.checkOutDate > today) {
          newStatus = 'occupe';
        } else {
          newStatus = 'occupe';
        }

        const newReservation: import('@/constants/types').Reservation = {
          id: `res-imp-${Date.now()}-${roomIdx}`,
          roomId: room.id,
          pmsReservationId: `IMP-${Date.now()}-${roomIdx}`,
          guestName: res.guestName,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          adults: res.adults,
          children: res.children,
          preferences: res.preferences,
          status: res.checkOutDate <= today ? 'checked_out' : 'checked_in',
          lastSync: new Date().toISOString(),
        };

        const historyEntry: RoomHistoryEntry = {
          id: `h-imp-${Date.now()}-${room.id}`,
          roomId: room.id,
          action: 'Import réservation',
          performedBy: 'Import fichier',
          date: new Date().toISOString(),
          details: `Réservation importée pour ${res.guestName} (${res.checkInDate} → ${res.checkOutDate})`,
        };

        updatedRooms[roomIdx] = {
          ...room,
          currentReservation: newReservation,
          status: newStatus,
          breakfastIncluded: res.breakfastIncluded,
          clientBadge: room.clientBadge,
          history: [...room.history, historyEntry],
        };
        imported++;
      }

      await persistRooms(updatedRooms);
      console.log('[HotelProvider] Bulk import reservations complete. Imported:', imported, 'Failed:', failed);
      return { imported, failed };
    },
  });

  const bulkDepartureMutation = useMutation({
    mutationFn: async (roomIds: string[]) => {
      const updated = rooms.map((r) => {
        if (roomIds.includes(r.id) && r.status === 'occupe') {
          const historyEntry: RoomHistoryEntry = {
            id: `h-${Date.now()}-${r.id}`,
            roomId: r.id,
            action: 'Départ déclaré',
            performedBy: 'Réception',
            date: new Date().toISOString(),
            details: `Départ de ${r.currentReservation?.guestName ?? 'client'}`,
          };
          return { ...r, status: 'depart' as RoomStatus, history: [...r.history, historyEntry] };
        }
        return r;
      });
      await persistRooms(updated);
      setSelectedRoomIds(new Set());
      return updated;
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async (params: { roomIds: string[]; staffId: string }) => {
      const staffMember = staff.find((s) => s.id === params.staffId);
      if (!staffMember) throw new Error('Staff member not found');
      const assigneeName = `${staffMember.firstName} ${staffMember.lastName.charAt(0)}.`;
      const updated = rooms.map((r) => {
        if (params.roomIds.includes(r.id)) {
          const historyEntry: RoomHistoryEntry = {
            id: `h-${Date.now()}-${r.id}`,
            roomId: r.id,
            action: 'Assignation',
            performedBy: 'Réception',
            date: new Date().toISOString(),
            details: `Assignée à ${assigneeName}`,
          };
          return {
            ...r,
            cleaningAssignee: assigneeName,
            assignedTo: params.staffId,
            cleaningStatus: r.cleaningStatus === 'none' ? ('en_cours' as const) : r.cleaningStatus,
            history: [...r.history, historyEntry],
          };
        }
        return r;
      });
      const updatedStaff = staff.map((s) =>
        s.id === params.staffId ? { ...s, currentLoad: s.currentLoad + params.roomIds.length } : s
      );
      await persistRooms(updated);
      await persistStaff(updatedStaff);
      setSelectedRoomIds(new Set());
      return updated;
    },
  });

  const syncPmsMutation = useMutation({
    mutationFn: async () => {
      await persistPms({ ...pmsSync, status: 'syncing', errorMessage: null });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const shouldFail = Math.random() < 0.1;
      if (shouldFail) {
        const errorState: PMSSyncState = { status: 'error', lastSyncTime: pmsSync.lastSyncTime, recordsUpdated: 0, errorMessage: 'Connexion au PMS échouée - timeout' };
        await persistPms(errorState);
        throw new Error('PMS sync failed');
      }
      const updatedCount = rooms.filter((r) => r.currentReservation !== null).length;
      const successState: PMSSyncState = { status: 'success', lastSyncTime: new Date().toISOString(), recordsUpdated: updatedCount, errorMessage: null };
      await persistPms(successState);
      return successState;
    },
  });

  const startCleaningMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const updated = rooms.map((r) =>
        r.id === roomId ? { ...r, cleaningStatus: 'en_cours' as const, cleaningStartedAt: new Date().toISOString() } : r
      );
      await persistRooms(updated);
    },
  });

  const completeCleaningMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const updated = rooms.map((r) =>
        r.id === roomId ? { ...r, cleaningStatus: 'nettoyee' as const, cleaningCompletedAt: new Date().toISOString() } : r
      );
      await persistRooms(updated);
      const room = rooms.find((r) => r.id === roomId);
      if (room && !inspections.find((i) => i.roomId === roomId && i.status === 'en_attente')) {
        const newInspection: Inspection = {
          id: `insp-${Date.now()}`,
          roomId,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          floor: room.floor,
          cleanedBy: room.cleaningAssignee ?? 'Inconnu',
          completedAt: new Date().toISOString(),
          status: 'en_attente',
          checklistResults: {},
          comments: '',
          guestName: room.currentReservation?.guestName ?? null,
        };
        await persistInspections([...inspections, newInspection]);
      }
    },
  });

  const validateInspectionMutation = useMutation({
    mutationFn: async (params: { inspectionId: string; status: InspectionStatus; checklist: Record<string, boolean>; comments: string }) => {
      const updatedInspections = inspections.map((i) =>
        i.id === params.inspectionId ? { ...i, status: params.status, checklistResults: params.checklist, comments: params.comments } : i
      );
      await persistInspections(updatedInspections);
      const inspection = inspections.find((i) => i.id === params.inspectionId);
      if (inspection) {
        const newCleaningStatus = params.status === 'valide' ? 'validee' as const : 'refusee' as const;
        const updatedRooms = rooms.map((r) =>
          r.id === inspection.roomId ? { ...r, cleaningStatus: newCleaningStatus } : r
        );
        await persistRooms(updatedRooms);
      }
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: async (params: { taskId: string; updates: Partial<MaintenanceTask> }) => {
      const updated = maintenanceTasks.map((t) =>
        t.id === params.taskId ? { ...t, ...params.updates } : t
      );
      await persistMaintenance(updated);
    },
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async (task: Omit<MaintenanceTask, 'id'>) => {
      const newTask: MaintenanceTask = { ...task, id: `m-${Date.now()}` };
      await persistMaintenance([...maintenanceTasks, newTask]);
      return newTask;
    },
  });

  const updateBreakfastMutation = useMutation({
    mutationFn: async (params: { orderId: string; updates: Partial<BreakfastOrder> }) => {
      const updated = breakfastOrders.map((o) =>
        o.id === params.orderId ? { ...o, ...params.updates } : o
      );
      await persistBreakfast(updated);
    },
  });

  const addBreakfastMutation = useMutation({
    mutationFn: async (order: Omit<BreakfastOrder, 'id'>) => {
      const newOrder: BreakfastOrder = { ...order, id: `b-${Date.now()}` };
      await persistBreakfast([...breakfastOrders, newOrder]);
      return newOrder;
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async (params: { itemId: string; updates: Partial<InventoryItem> }) => {
      const updated = inventoryItems.map((i) =>
        i.id === params.itemId ? { ...i, ...params.updates } : i
      );
      await persistInventory(updated);
    },
  });

  const reportProblemMutation = useMutation({
    mutationFn: async (params: { roomId: string; roomNumber: string; title: string; description: string; priority: MaintenanceTask['priority']; reportedBy: string }) => {
      const newTask: MaintenanceTask = {
        id: `m-${Date.now()}`,
        roomId: params.roomId,
        roomNumber: params.roomNumber,
        title: params.title,
        description: params.description,
        reportedBy: params.reportedBy,
        reportedAt: new Date().toISOString(),
        priority: params.priority,
        status: 'en_attente',
        assignedTo: null,
        photos: [],
        resolutionNotes: '',
        resolvedAt: null,
        comments: [],
        scheduleId: null,
        isPeriodic: false,
        costs: [],
        costTotal: 0,
        category: '',
      };
      await persistMaintenance([...maintenanceTasks, newTask]);
    },
  });

  const addConsumptionsMutation = useMutation({
    mutationFn: async (params: { roomId: string; roomNumber: string; items: { productId: string; quantity: number }[]; reportedBy: string }) => {
      const now = new Date().toISOString();
      const newLogs: ConsumptionLog[] = [];
      const newMovements: StockMovement[] = [];
      let updatedProducts = [...consumableProducts];

      for (const item of params.items) {
        const product = updatedProducts.find((p) => p.id === item.productId);
        if (!product) continue;

        const log: ConsumptionLog = {
          id: `cl-${Date.now()}-${item.productId}`,
          roomId: params.roomId,
          roomNumber: params.roomNumber,
          productId: item.productId,
          productName: product.name,
          productIcon: product.icon,
          category: product.category,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          totalPrice: item.quantity * product.unitPrice,
          reportedBy: params.reportedBy,
          reportedAt: now,
          billed: false,
        };
        newLogs.push(log);

        const movement: StockMovement = {
          id: `sm-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: product.name,
          quantity: -item.quantity,
          movementType: 'sortie_consommation',
          unitPrice: product.unitPrice,
          roomId: params.roomId,
          roomNumber: params.roomNumber,
          reportedBy: params.reportedBy,
          createdAt: now,
        };
        newMovements.push(movement);

        updatedProducts = updatedProducts.map((p) =>
          p.id === item.productId ? { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) } : p
        );
      }

      await persistConsumableProducts(updatedProducts);
      await persistConsumptionLogs([...consumptionLogs, ...newLogs]);
      await persistStockMovements([...stockMovements, ...newMovements]);
      return newLogs;
    },
  });

  const addStockEntryMutation = useMutation({
    mutationFn: async (params: { productId: string; quantity: number; unitPrice: number; reportedBy: string }) => {
      const product = consumableProducts.find((p) => p.id === params.productId);
      if (!product) throw new Error('Product not found');

      const updatedProducts = consumableProducts.map((p) =>
        p.id === params.productId ? { ...p, currentStock: p.currentStock + params.quantity } : p
      );
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: params.productId,
        productName: product.name,
        quantity: params.quantity,
        movementType: 'entree',
        unitPrice: params.unitPrice,
        roomId: null,
        roomNumber: null,
        reportedBy: params.reportedBy,
        createdAt: new Date().toISOString(),
      };

      await persistConsumableProducts(updatedProducts);
      await persistStockMovements([...stockMovements, movement]);
    },
  });

  const updateConsumableProductMutation = useMutation({
    mutationFn: async (params: { productId: string; updates: Partial<ConsumableProduct> }) => {
      const updated = consumableProducts.map((p) =>
        p.id === params.productId ? { ...p, ...params.updates } : p
      );
      await persistConsumableProducts(updated);
    },
  });

  const addMaintenanceTypeMutation = useMutation({
    mutationFn: async (mt: Omit<MaintenanceType, 'id'>) => {
      const newMt: MaintenanceType = { ...mt, id: `mt-${Date.now()}` };
      await persistMaintTypes([...maintenanceTypes, newMt]);
      return newMt;
    },
  });
  const updateMaintenanceTypeMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<MaintenanceType> }) => {
      const updated = maintenanceTypes.map((mt) => mt.id === params.id ? { ...mt, ...params.updates } : mt);
      await persistMaintTypes(updated);
    },
  });
  const addMaintenanceScheduleMutation = useMutation({
    mutationFn: async (ms: Omit<MaintenanceSchedule, 'id'>) => {
      const newMs: MaintenanceSchedule = { ...ms, id: `ms-${Date.now()}` };
      await persistMaintSchedules([...maintenanceSchedules, newMs]);
      return newMs;
    },
  });
  const updateMaintenanceScheduleMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<MaintenanceSchedule> }) => {
      const updated = maintenanceSchedules.map((ms) => ms.id === params.id ? { ...ms, ...params.updates } : ms);
      await persistMaintSchedules(updated);
    },
  });
  const addMaintenanceCostMutation = useMutation({
    mutationFn: async (params: { taskId: string; cost: Omit<MaintenanceCost, 'id' | 'maintenanceTaskId' | 'totalPrice'> }) => {
      const newCost: MaintenanceCost = {
        id: `mc-${Date.now()}`,
        maintenanceTaskId: params.taskId,
        productName: params.cost.productName,
        quantity: params.cost.quantity,
        unitPrice: params.cost.unitPrice,
        totalPrice: params.cost.quantity * params.cost.unitPrice,
        supplier: params.cost.supplier,
      };
      const updated = maintenanceTasks.map((t) => {
        if (t.id === params.taskId) {
          const newCosts = [...t.costs, newCost];
          return { ...t, costs: newCosts, costTotal: newCosts.reduce((s, c) => s + c.totalPrice, 0) };
        }
        return t;
      });
      await persistMaintenance(updated);
      return newCost;
    },
  });
  const addBreakfastStaffMutation = useMutation({
    mutationFn: async (s: Omit<BreakfastStaff, 'id'>) => {
      const newS: BreakfastStaff = { ...s, id: `bs-${Date.now()}` };
      await persistBfastStaff([...breakfastStaff, newS]);
      return newS;
    },
  });
  const updateBreakfastStaffMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<BreakfastStaff> }) => {
      const updated = breakfastStaff.map((s) => s.id === params.id ? { ...s, ...params.updates } : s);
      await persistBfastStaff(updated);
    },
  });
  const addBreakfastServiceMutation = useMutation({
    mutationFn: async (svc: Omit<BreakfastService, 'id'>) => {
      const newSvc: BreakfastService = { ...svc, id: `bsv-${Date.now()}` };
      await persistBfastServices([...breakfastServices, newSvc]);
      return newSvc;
    },
  });
  const updateBreakfastConfigMutation = useMutation({
    mutationFn: async (updates: Partial<BreakfastConfig>) => {
      const updated = { ...breakfastConfig, ...updates };
      await persistBfastConfig(updated);
    },
  });
  const addBreakfastProductMutation = useMutation({
    mutationFn: async (p: Omit<BreakfastProduct, 'id'>) => {
      const newP: BreakfastProduct = { ...p, id: `bp-${Date.now()}` };
      await persistBfastProducts([...breakfastProducts, newP]);
      return newP;
    },
  });
  const updateBreakfastProductMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<BreakfastProduct> }) => {
      const updated = breakfastProducts.map((p) => p.id === params.id ? { ...p, ...params.updates } : p);
      await persistBfastProducts(updated);
    },
  });

  const toggleRoomSelection = useCallback((roomId: string) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }, []);

  const toggleFloorSelection = useCallback((floor: number) => {
    const floorRoomIds = rooms.filter((r) => r.floor === floor).map((r) => r.id);
    const allSelected = floorRoomIds.every((id) => selectedRoomIds.has(id));
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      floorRoomIds.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, [rooms, selectedRoomIds]);

  const clearSelection = useCallback(() => { setSelectedRoomIds(new Set()); }, []);

  const isLoading = roomsQuery.isLoading || staffQuery.isLoading;

  const housekeepingRooms = useMemo(() =>
    rooms.filter((r) => r.assignedTo !== null && (r.cleaningStatus === 'none' || r.cleaningStatus === 'en_cours' || r.cleaningStatus === 'refusee')),
    [rooms]
  );

  const pendingInspections = useMemo(() =>
    inspections.filter((i) => i.status === 'en_attente'),
    [inspections]
  );

  const lowStockItems = useMemo(() =>
    inventoryItems.filter((i) => i.currentStock <= i.minimumThreshold),
    [inventoryItems]
  );

  const lowStockConsumables = useMemo(() =>
    consumableProducts.filter((p) => p.currentStock <= p.lowStockThreshold),
    [consumableProducts]
  );

  const todayConsumptionTotal = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return consumptionLogs
      .filter((l) => l.reportedAt.startsWith(today))
      .reduce((sum, l) => sum + l.totalPrice, 0);
  }, [consumptionLogs]);

  return useMemo(() => ({
    rooms,
    staff: staff.filter((s) => s.role === 'femme_de_chambre' && s.active),
    allStaff: staff,
    maintenanceStaff: staff.filter((s) => s.role === 'maintenance' && s.active),
    selectedRoomIds,
    pmsSync,
    isLoading,
    maintenanceTasks,
    breakfastOrders,
    inspections,
    inventoryItems,
    lostFoundItems,
    conservationDelayDays,
    updateLostFoundItem: updateLostFoundItemMutation.mutate,
    updateConservationDelay: updateConservationDelayMutation.mutate,
    housekeepingRooms,
    pendingInspections,
    lowStockItems,
    consumableProducts,
    consumptionLogs,
    stockMovements,
    lowStockConsumables,
    todayConsumptionTotal,
    updateRoom: updateRoomMutation.mutate,
    addRoom: addRoomMutation.mutate,
    bulkImportRooms: bulkImportRoomsMutation.mutateAsync,
    isBulkImporting: bulkImportRoomsMutation.isPending,
    bulkImportReservations: bulkImportReservationsMutation.mutateAsync,
    isBulkImportingReservations: bulkImportReservationsMutation.isPending,
    bulkDeparture: bulkDepartureMutation.mutate,
    bulkAssign: bulkAssignMutation.mutate,
    syncPms: syncPmsMutation.mutate,
    isSyncing: syncPmsMutation.isPending,
    startCleaning: startCleaningMutation.mutate,
    completeCleaning: completeCleaningMutation.mutate,
    validateInspection: validateInspectionMutation.mutate,
    updateMaintenance: updateMaintenanceMutation.mutate,
    addMaintenance: addMaintenanceMutation.mutate,
    updateBreakfast: updateBreakfastMutation.mutate,
    addBreakfast: addBreakfastMutation.mutate,
    updateInventory: updateInventoryMutation.mutate,
    reportProblem: reportProblemMutation.mutate,
    addConsumptions: addConsumptionsMutation.mutate,
    addStockEntry: addStockEntryMutation.mutate,
    updateConsumableProduct: updateConsumableProductMutation.mutate,
    maintenanceTypes,
    maintenanceSchedules,
    breakfastStaff,
    breakfastServices,
    breakfastConfig,
    breakfastProducts,
    addMaintenanceType: addMaintenanceTypeMutation.mutate,
    updateMaintenanceType: updateMaintenanceTypeMutation.mutate,
    addMaintenanceSchedule: addMaintenanceScheduleMutation.mutate,
    updateMaintenanceSchedule: updateMaintenanceScheduleMutation.mutate,
    addMaintenanceCost: addMaintenanceCostMutation.mutate,
    addBreakfastStaff: addBreakfastStaffMutation.mutate,
    updateBreakfastStaff: updateBreakfastStaffMutation.mutate,
    addBreakfastService: addBreakfastServiceMutation.mutate,
    updateBreakfastConfig: updateBreakfastConfigMutation.mutate,
    addBreakfastProduct: addBreakfastProductMutation.mutate,
    updateBreakfastProduct: updateBreakfastProductMutation.mutate,
    toggleRoomSelection,
    toggleFloorSelection,
    clearSelection,
  }), [
    rooms, staff, selectedRoomIds, pmsSync, isLoading,
    maintenanceTasks, breakfastOrders, inspections, inventoryItems, lostFoundItems, conservationDelayDays,
    housekeepingRooms, pendingInspections, lowStockItems,
    consumableProducts, consumptionLogs, stockMovements, lowStockConsumables, todayConsumptionTotal,
    updateRoomMutation.mutate, addRoomMutation.mutate, bulkImportRoomsMutation.mutateAsync, bulkImportRoomsMutation.isPending, bulkImportReservationsMutation.mutateAsync, bulkImportReservationsMutation.isPending, bulkDepartureMutation.mutate, bulkAssignMutation.mutate,
    syncPmsMutation.mutate, syncPmsMutation.isPending,
    startCleaningMutation.mutate, completeCleaningMutation.mutate, validateInspectionMutation.mutate,
    updateMaintenanceMutation.mutate, addMaintenanceMutation.mutate,
    updateBreakfastMutation.mutate, addBreakfastMutation.mutate,
    updateInventoryMutation.mutate, reportProblemMutation.mutate,
    addConsumptionsMutation.mutate, addStockEntryMutation.mutate, updateConsumableProductMutation.mutate,
    maintenanceTypes, maintenanceSchedules,
    breakfastStaff, breakfastServices, breakfastConfig, breakfastProducts,
    addMaintenanceTypeMutation.mutate, updateMaintenanceTypeMutation.mutate,
    addMaintenanceScheduleMutation.mutate, updateMaintenanceScheduleMutation.mutate, addMaintenanceCostMutation.mutate,
    addBreakfastStaffMutation.mutate, updateBreakfastStaffMutation.mutate,
    addBreakfastServiceMutation.mutate, updateBreakfastConfigMutation.mutate,
    addBreakfastProductMutation.mutate, updateBreakfastProductMutation.mutate,
    updateLostFoundItemMutation.mutate, updateConservationDelayMutation.mutate,
    toggleRoomSelection, toggleFloorSelection, clearSelection,
  ]);
});

export function useFilteredRooms(filters: {
  status: RoomStatus | 'all';
  floor: number | 'all';
  badge: ClientBadge | 'all';
  search: string;
}) {
  const { rooms } = useHotel();
  const filtered = rooms.filter((room) => {
    if (filters.status !== 'all' && room.status !== filters.status) return false;
    if (filters.floor !== 'all' && room.floor !== filters.floor) return false;
    if (filters.badge !== 'all' && room.clientBadge !== filters.badge) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchesNumber = room.roomNumber.toLowerCase().includes(s);
      const matchesGuest = room.currentReservation?.guestName?.toLowerCase().includes(s);
      if (!matchesNumber && !matchesGuest) return false;
    }
    return true;
  });
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
  return { filtered, floors, total: rooms.length };
}

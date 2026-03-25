import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  HotelFloor,
  HousekeepingZone,
  HousekeepingAssignment,
  RoomCleaningTask,
  HousekeepingStaffMember,
  ActivityEvent,
  CleaningTaskStatus,
  CLEANING_TYPE_CONFIG,
} from '@/constants/types';
import {
  INITIAL_FLOORS,
  INITIAL_ZONES,
  INITIAL_ASSIGNMENTS,
  INITIAL_CLEANING_TASKS,
  INITIAL_HK_STAFF,
  INITIAL_ACTIVITY_EVENTS,
} from '@/mocks/housekeeping';

const FLOORS_KEY = 'hk_floors_v1';
const ZONES_KEY = 'hk_zones_v1';
const ASSIGNMENTS_KEY = 'hk_assignments_v1';
const CLEANING_TASKS_KEY = 'hk_cleaning_tasks_v1';
const HK_STAFF_KEY = 'hk_staff_v1';
const ACTIVITY_KEY = 'hk_activity_v1';

export const [HousekeepingManagerProvider, useHousekeepingManager] = createContextHook(() => {
  const [floors, setFloors] = useState<HotelFloor[]>([]);
  const [zones, setZones] = useState<HousekeepingZone[]>([]);
  const [assignments, setAssignments] = useState<HousekeepingAssignment[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<RoomCleaningTask[]>([]);
  const [hkStaff, setHkStaff] = useState<HousekeepingStaffMember[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  const floorsQuery = useQuery({
    queryKey: ['hk_floors'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FLOORS_KEY);
        if (stored) { const p = JSON.parse(stored) as HotelFloor[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HKProvider] Error reading floors:', e); await AsyncStorage.removeItem(FLOORS_KEY); }
      await AsyncStorage.setItem(FLOORS_KEY, JSON.stringify(INITIAL_FLOORS));
      return INITIAL_FLOORS;
    },
  });

  const zonesQuery = useQuery({
    queryKey: ['hk_zones'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ZONES_KEY);
        if (stored) { const p = JSON.parse(stored) as HousekeepingZone[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HKProvider] Error reading zones:', e); await AsyncStorage.removeItem(ZONES_KEY); }
      await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(INITIAL_ZONES));
      return INITIAL_ZONES;
    },
  });

  const assignmentsQuery = useQuery({
    queryKey: ['hk_assignments'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ASSIGNMENTS_KEY);
        if (stored) { const p = JSON.parse(stored) as HousekeepingAssignment[]; if (Array.isArray(p)) return p; }
      } catch (e) { console.log('[HKProvider] Error reading assignments:', e); await AsyncStorage.removeItem(ASSIGNMENTS_KEY); }
      await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    },
  });

  const cleaningTasksQuery = useQuery({
    queryKey: ['hk_cleaning_tasks'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(CLEANING_TASKS_KEY);
        if (stored) { const p = JSON.parse(stored) as RoomCleaningTask[]; if (Array.isArray(p)) return p; }
      } catch (e) { console.log('[HKProvider] Error reading cleaning tasks:', e); await AsyncStorage.removeItem(CLEANING_TASKS_KEY); }
      await AsyncStorage.setItem(CLEANING_TASKS_KEY, JSON.stringify(INITIAL_CLEANING_TASKS));
      return INITIAL_CLEANING_TASKS;
    },
  });

  const hkStaffQuery = useQuery({
    queryKey: ['hk_staff'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(HK_STAFF_KEY);
        if (stored) { const p = JSON.parse(stored) as HousekeepingStaffMember[]; if (Array.isArray(p) && p.length > 0) return p; }
      } catch (e) { console.log('[HKProvider] Error reading hk staff:', e); await AsyncStorage.removeItem(HK_STAFF_KEY); }
      await AsyncStorage.setItem(HK_STAFF_KEY, JSON.stringify(INITIAL_HK_STAFF));
      return INITIAL_HK_STAFF;
    },
  });

  const activityQuery = useQuery({
    queryKey: ['hk_activity'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVITY_KEY);
        if (stored) { const p = JSON.parse(stored) as ActivityEvent[]; if (Array.isArray(p)) return p; }
      } catch (e) { console.log('[HKProvider] Error reading activity:', e); await AsyncStorage.removeItem(ACTIVITY_KEY); }
      await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(INITIAL_ACTIVITY_EVENTS));
      return INITIAL_ACTIVITY_EVENTS;
    },
  });

  useEffect(() => { if (floorsQuery.data) setFloors(floorsQuery.data); }, [floorsQuery.data]);
  useEffect(() => { if (zonesQuery.data) setZones(zonesQuery.data); }, [zonesQuery.data]);
  useEffect(() => { if (assignmentsQuery.data) setAssignments(assignmentsQuery.data); }, [assignmentsQuery.data]);
  useEffect(() => { if (cleaningTasksQuery.data) setCleaningTasks(cleaningTasksQuery.data); }, [cleaningTasksQuery.data]);
  useEffect(() => { if (hkStaffQuery.data) setHkStaff(hkStaffQuery.data); }, [hkStaffQuery.data]);
  useEffect(() => { if (activityQuery.data) setActivityEvents(activityQuery.data); }, [activityQuery.data]);

  const persistFloors = useCallback(async (updated: HotelFloor[]) => {
    setFloors(updated);
    await AsyncStorage.setItem(FLOORS_KEY, JSON.stringify(updated));
  }, []);
  const persistZones = useCallback(async (updated: HousekeepingZone[]) => {
    setZones(updated);
    await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(updated));
  }, []);
  const persistAssignments = useCallback(async (updated: HousekeepingAssignment[]) => {
    setAssignments(updated);
    await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
  }, []);
  const persistCleaningTasks = useCallback(async (updated: RoomCleaningTask[]) => {
    setCleaningTasks(updated);
    await AsyncStorage.setItem(CLEANING_TASKS_KEY, JSON.stringify(updated));
  }, []);
  const persistHkStaff = useCallback(async (updated: HousekeepingStaffMember[]) => {
    setHkStaff(updated);
    await AsyncStorage.setItem(HK_STAFF_KEY, JSON.stringify(updated));
  }, []);
  const persistActivity = useCallback(async (updated: ActivityEvent[]) => {
    setActivityEvents(updated);
    await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  }, []);

  const addActivityEvent = useCallback(async (event: Omit<ActivityEvent, 'id'>) => {
    const newEvt: ActivityEvent = { ...event, id: `evt-${Date.now()}` };
    const updated = [newEvt, ...activityEvents].slice(0, 50);
    await persistActivity(updated);
  }, [activityEvents, persistActivity]);

  const generateFloorsAndZonesMutation = useMutation({
    mutationFn: async (params: { roomFloors: number[]; roomIds: Map<number, string[]> }) => {
      console.log('[HKProvider] Generating floors and zones...');
      const uniqueFloors = [...new Set(params.roomFloors)].sort((a, b) => a - b);
      const newFloors: HotelFloor[] = uniqueFloors.map((f) => ({
        id: `floor-${f}`,
        hotelId: 'hotel-1',
        floorNumber: f,
        createdAt: new Date().toISOString(),
      }));

      const newZones: HousekeepingZone[] = [];
      for (const floor of uniqueFloors) {
        const floorRoomIds = params.roomIds.get(floor) || [];
        if (floorRoomIds.length <= 20) {
          newZones.push({
            id: `zone-${floor}`,
            hotelId: 'hotel-1',
            zoneName: `Zone ${floor}`,
            floorId: `floor-${floor}`,
            floorNumber: floor,
            roomIds: floorRoomIds,
            createdAt: new Date().toISOString(),
          });
        } else {
          const mid = Math.ceil(floorRoomIds.length / 2);
          newZones.push({
            id: `zone-${floor}A`,
            hotelId: 'hotel-1',
            zoneName: `Zone ${floor}A`,
            floorId: `floor-${floor}`,
            floorNumber: floor,
            roomIds: floorRoomIds.slice(0, mid),
            createdAt: new Date().toISOString(),
          });
          newZones.push({
            id: `zone-${floor}B`,
            hotelId: 'hotel-1',
            zoneName: `Zone ${floor}B`,
            floorId: `floor-${floor}`,
            floorNumber: floor,
            roomIds: floorRoomIds.slice(mid),
            createdAt: new Date().toISOString(),
          });
        }
      }

      await persistFloors(newFloors);
      await persistZones(newZones);
      console.log('[HKProvider] Created', newFloors.length, 'floors and', newZones.length, 'zones');
      return { floorsCreated: newFloors.length, zonesCreated: newZones.length };
    },
  });

  const autoAssignRoomsMutation = useMutation({
    mutationFn: async (params: { date: string }) => {
      console.log('[HKProvider] Auto-assigning rooms for', params.date);
      const availableStaff = hkStaff.filter((s) => s.status === 'available');
      if (availableStaff.length === 0) {
        console.log('[HKProvider] No available staff');
        return { assigned: 0 };
      }

      const tasksForDay = cleaningTasks.filter((t) => t.date === params.date && t.status !== 'completed');
      const sortedTasks = [...tasksForDay].sort((a, b) => {
        const aTime = CLEANING_TYPE_CONFIG[a.cleaningType].estimatedMinutes;
        const bTime = CLEANING_TYPE_CONFIG[b.cleaningType].estimatedMinutes;
        return bTime - aTime;
      });

      const staffLoad: Map<string, { totalMinutes: number; roomIds: string[]; taskIds: string[] }> = new Map();
      for (const s of availableStaff) {
        staffLoad.set(s.id, { totalMinutes: 0, roomIds: [], taskIds: [] });
      }

      const zoneStaffMap: Map<string, string> = new Map();
      for (const zone of zones) {
        let bestStaff: string | null = null;
        let bestLoad = Infinity;
        for (const s of availableStaff) {
          const load = staffLoad.get(s.id)!;
          if (load.totalMinutes < bestLoad) {
            bestLoad = load.totalMinutes;
            bestStaff = s.id;
          }
        }
        if (bestStaff) zoneStaffMap.set(zone.id, bestStaff);
      }

      for (const task of sortedTasks) {
        const taskZone = zones.find((z) => z.roomIds.includes(task.roomId));
        let targetStaffId: string | null = null;

        if (taskZone) {
          targetStaffId = zoneStaffMap.get(taskZone.id) || null;
        }

        if (!targetStaffId) {
          let minLoad = Infinity;
          for (const s of availableStaff) {
            const load = staffLoad.get(s.id)!;
            if (load.totalMinutes < minLoad) {
              minLoad = load.totalMinutes;
              targetStaffId = s.id;
            }
          }
        }

        if (targetStaffId) {
          const load = staffLoad.get(targetStaffId)!;
          load.totalMinutes += CLEANING_TYPE_CONFIG[task.cleaningType].estimatedMinutes;
          load.roomIds.push(task.roomId);
          load.taskIds.push(task.id);
        }
      }

      const updatedTasks = cleaningTasks.map((t) => {
        for (const [staffId, load] of staffLoad.entries()) {
          if (load.taskIds.includes(t.id)) {
            const staffMember = availableStaff.find((s) => s.id === staffId);
            return { ...t, assignedTo: staffId, assignedToName: staffMember?.name || null };
          }
        }
        return t;
      });

      const newAssignments: HousekeepingAssignment[] = [];
      for (const [staffId, load] of staffLoad.entries()) {
        if (load.roomIds.length === 0) continue;
        const staffMember = availableStaff.find((s) => s.id === staffId);
        const assignedZone = zones.find((z) => {
          const overlap = z.roomIds.filter((rid) => load.roomIds.includes(rid));
          return overlap.length > 0;
        });
        newAssignments.push({
          id: `assign-${Date.now()}-${staffId}`,
          hotelId: 'hotel-1',
          zoneId: assignedZone?.id || '',
          zoneName: assignedZone?.zoneName || 'Général',
          staffId,
          staffName: staffMember?.name || '',
          date: params.date,
          roomIds: load.roomIds,
          createdAt: new Date().toISOString(),
        });
      }

      await persistCleaningTasks(updatedTasks);
      const existingOtherDay = assignments.filter((a) => a.date !== params.date);
      await persistAssignments([...existingOtherDay, ...newAssignments]);

      console.log('[HKProvider] Auto-assign complete. Assignments:', newAssignments.length);
      return { assigned: sortedTasks.length };
    },
  });

  const startCleaningTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const now = new Date().toISOString();
      const updated = cleaningTasks.map((t) =>
        t.id === taskId ? { ...t, status: 'in_progress' as CleaningTaskStatus, startedAt: now } : t
      );
      await persistCleaningTasks(updated);
      const task = cleaningTasks.find((t) => t.id === taskId);
      if (task) {
        await addActivityEvent({
          time: now,
          description: 'Nettoyage commencé',
          type: 'cleaning',
          roomNumber: task.roomNumber,
        });
      }
    },
  });

  const completeCleaningTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const now = new Date().toISOString();
      const updated = cleaningTasks.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' as CleaningTaskStatus, completedAt: now } : t
      );
      await persistCleaningTasks(updated);
      const task = cleaningTasks.find((t) => t.id === taskId);
      if (task) {
        await addActivityEvent({
          time: now,
          description: 'Nettoyage terminé',
          type: 'cleaning',
          roomNumber: task.roomNumber,
        });
      }
    },
  });

  const reassignTaskMutation = useMutation({
    mutationFn: async (params: { taskId: string; newStaffId: string }) => {
      const staffMember = hkStaff.find((s) => s.id === params.newStaffId);
      const updated = cleaningTasks.map((t) =>
        t.id === params.taskId ? { ...t, assignedTo: params.newStaffId, assignedToName: staffMember?.name || null } : t
      );
      await persistCleaningTasks(updated);
    },
  });

  const addHkStaffMutation = useMutation({
    mutationFn: async (params: { name: string; maxRoomsPerDay: number }) => {
      const newStaff: HousekeepingStaffMember = {
        id: `hks-${Date.now()}`,
        hotelId: 'hotel-1',
        name: params.name,
        status: 'available',
        maxRoomsPerDay: params.maxRoomsPerDay,
        createdAt: new Date().toISOString(),
      };
      await persistHkStaff([...hkStaff, newStaff]);
      return newStaff;
    },
  });

  const updateHkStaffMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<HousekeepingStaffMember> }) => {
      const updated = hkStaff.map((s) => s.id === params.id ? { ...s, ...params.updates } : s);
      await persistHkStaff(updated);
    },
  });

  const today = new Date().toISOString().split('T')[0];

  const todayTasks = useMemo(() =>
    cleaningTasks.filter((t) => t.date === today),
    [cleaningTasks, today]
  );

  const todayAssignments = useMemo(() =>
    assignments.filter((a) => a.date === today),
    [assignments, today]
  );

  const taskStats = useMemo(() => {
    const pending = todayTasks.filter((t) => t.status === 'pending').length;
    const inProgress = todayTasks.filter((t) => t.status === 'in_progress').length;
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    return { pending, inProgress, completed, total: todayTasks.length };
  }, [todayTasks]);

  const staffPerformance = useMemo(() => {
    return hkStaff.filter((s) => s.status === 'available').map((s) => {
      const staffTasks = todayTasks.filter((t) => t.assignedTo === s.id);
      const completed = staffTasks.filter((t) => t.status === 'completed');
      const totalTime = completed.reduce((sum, t) => {
        if (t.startedAt && t.completedAt) {
          return sum + (new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()) / 60000;
        }
        return sum;
      }, 0);
      const avgTime = completed.length > 0 ? Math.round(totalTime / completed.length) : 0;
      return {
        id: s.id,
        name: s.name,
        totalRooms: staffTasks.length,
        completed: completed.length,
        pending: staffTasks.filter((t) => t.status === 'pending').length,
        inProgress: staffTasks.filter((t) => t.status === 'in_progress').length,
        avgTimeMinutes: avgTime,
      };
    });
  }, [hkStaff, todayTasks]);

  const isLoading = floorsQuery.isLoading || zonesQuery.isLoading;

  return useMemo(() => ({
    floors,
    zones,
    assignments,
    cleaningTasks,
    hkStaff,
    activityEvents,
    todayTasks,
    todayAssignments,
    taskStats,
    staffPerformance,
    isLoading,
    generateFloorsAndZones: generateFloorsAndZonesMutation.mutateAsync,
    autoAssignRooms: autoAssignRoomsMutation.mutateAsync,
    startCleaningTask: startCleaningTaskMutation.mutate,
    completeCleaningTask: completeCleaningTaskMutation.mutate,
    reassignTask: reassignTaskMutation.mutate,
    addHkStaff: addHkStaffMutation.mutate,
    updateHkStaff: updateHkStaffMutation.mutate,
    addActivityEvent,
  }), [
    floors, zones, assignments, cleaningTasks, hkStaff, activityEvents,
    todayTasks, todayAssignments, taskStats, staffPerformance, isLoading,
    generateFloorsAndZonesMutation.mutateAsync, autoAssignRoomsMutation.mutateAsync,
    startCleaningTaskMutation.mutate, completeCleaningTaskMutation.mutate,
    reassignTaskMutation.mutate, addHkStaffMutation.mutate, updateHkStaffMutation.mutate,
    addActivityEvent,
  ]);
});

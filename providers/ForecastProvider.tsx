import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  HousekeepingForecastConfig,
  DEFAULT_FORECAST_CONFIG,
  RoomTypeCoefficient,
  DEFAULT_ROOM_TYPE_COEFFICIENTS,
  DayForecast,
  RoomType,
  Room,
  StaffMember,
} from '@/constants/types';

const FORECAST_CONFIG_KEY = 'hotel_forecast_config';
const FORECAST_COEFFICIENTS_KEY = 'hotel_forecast_coefficients';

function generateForecastData(
  rooms: Room[],
  staff: StaffMember[],
  config: HousekeepingForecastConfig,
  coefficients: RoomTypeCoefficient[],
  dayOffset: number,
): Omit<DayForecast, 'dayLabel'> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const dateStr = targetDate.toISOString().split('T')[0];

  let departures = 0;
  let stayovers = 0;

  if (dayOffset === 0) {
    departures = rooms.filter((r) => r.status === 'depart').length;
    stayovers = rooms.filter((r) => r.status === 'recouche').length;
  } else {
    const totalActive = rooms.filter((r) => r.status !== 'hors_service' && r.status !== 'libre').length;
    const baseDepartures = rooms.filter((r) => r.status === 'depart').length;
    const baseStayovers = rooms.filter((r) => r.status === 'recouche').length;

    const dayOfWeek = targetDate.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
    const variance = 0.85 + Math.random() * 0.3;

    departures = Math.max(1, Math.round(
      (baseDepartures > 0 ? baseDepartures : Math.round(totalActive * 0.25)) * weekendFactor * variance
    ));
    stayovers = Math.max(1, Math.round(
      (baseStayovers > 0 ? baseStayovers : Math.round(totalActive * 0.35)) * weekendFactor * variance
    ));
  }

  let weightedTotal: number;

  if (config.useRoomTypeCoefficients) {
    const departRooms = rooms.filter((r) => r.status === 'depart');
    const stayoverRooms = rooms.filter((r) => r.status === 'recouche');

    const getCoeff = (type: RoomType) =>
      coefficients.find((c) => c.roomType === type)?.coefficient ?? 1.0;

    const weightedDeparts = departRooms.reduce((sum, r) => sum + getCoeff(r.roomType), 0);
    const weightedStayovers = stayoverRooms.reduce((sum, r) => sum + getCoeff(r.roomType) * config.stayoverCoefficient, 0);

    if (dayOffset === 0) {
      weightedTotal = weightedDeparts * config.departCoefficient + weightedStayovers;
    } else {
      weightedTotal = departures * config.departCoefficient + stayovers * config.stayoverCoefficient;
    }
  } else {
    weightedTotal = departures * config.departCoefficient + stayovers * config.stayoverCoefficient;
  }

  const maxRooms = config.defaultMaxRoomsPerHousekeeper;
  const estimatedStaff = maxRooms > 0 ? Math.ceil(weightedTotal / maxRooms) : 0;

  const availableStaff = staff.filter(
    (s) => s.role === 'femme_de_chambre' && s.active
  ).length;

  const diff = estimatedStaff - availableStaff;
  let status: DayForecast['status'] = 'ok';
  if (diff > 0) {
    status = 'critical';
  } else if (diff === 0) {
    status = 'warning';
  }

  return {
    date: dateStr,
    departures,
    stayovers,
    weightedTotal: Math.round(weightedTotal * 10) / 10,
    estimatedStaff,
    availableStaff,
    status,
  };
}

function getDayLabel(dayOffset: number, locale: string): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  if (dayOffset === 0) return '';
  if (dayOffset === 1) return '';
  if (dayOffset === 2) return '';

  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

export const [ForecastProvider, useForecast] = createContextHook(() => {
  const [config, setConfig] = useState<HousekeepingForecastConfig>(DEFAULT_FORECAST_CONFIG);
  const [coefficients, setCoefficients] = useState<RoomTypeCoefficient[]>(DEFAULT_ROOM_TYPE_COEFFICIENTS);

  const configQuery = useQuery({
    queryKey: ['forecastConfig'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FORECAST_CONFIG_KEY);
        if (stored) return JSON.parse(stored) as HousekeepingForecastConfig;
      } catch (e) {
        console.log('[ForecastProvider] Error reading config:', e);
        await AsyncStorage.removeItem(FORECAST_CONFIG_KEY);
      }
      await AsyncStorage.setItem(FORECAST_CONFIG_KEY, JSON.stringify(DEFAULT_FORECAST_CONFIG));
      return DEFAULT_FORECAST_CONFIG;
    },
  });

  const coeffQuery = useQuery({
    queryKey: ['forecastCoefficients'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FORECAST_COEFFICIENTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RoomTypeCoefficient[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[ForecastProvider] Error reading coefficients:', e);
        await AsyncStorage.removeItem(FORECAST_COEFFICIENTS_KEY);
      }
      await AsyncStorage.setItem(FORECAST_COEFFICIENTS_KEY, JSON.stringify(DEFAULT_ROOM_TYPE_COEFFICIENTS));
      return DEFAULT_ROOM_TYPE_COEFFICIENTS;
    },
  });

  useEffect(() => {
    if (configQuery.data) setConfig(configQuery.data);
  }, [configQuery.data]);

  useEffect(() => {
    if (coeffQuery.data) setCoefficients(coeffQuery.data);
  }, [coeffQuery.data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<HousekeepingForecastConfig>) => {
      const updated = { ...config, ...updates, updatedAt: new Date().toISOString() };
      setConfig(updated);
      await AsyncStorage.setItem(FORECAST_CONFIG_KEY, JSON.stringify(updated));
      return updated;
    },
  });

  const updateCoefficientsMutation = useMutation({
    mutationFn: async (updated: RoomTypeCoefficient[]) => {
      setCoefficients(updated);
      await AsyncStorage.setItem(FORECAST_COEFFICIENTS_KEY, JSON.stringify(updated));
      return updated;
    },
  });

  const computeForecasts = useCallback(
    (rooms: Room[], allStaff: StaffMember[], days: number = 7): DayForecast[] => {
      const forecasts: DayForecast[] = [];

      for (let i = 0; i < days; i++) {
        const data = generateForecastData(rooms, allStaff, config, coefficients, i);
        const dayLabel = getDayLabel(i, 'fr-FR');
        forecasts.push({ ...data, dayLabel });
      }

      return forecasts;
    },
    [config, coefficients]
  );

  return {
    config,
    coefficients,
    isLoading: configQuery.isLoading,
    updateConfig: updateConfigMutation.mutate,
    updateCoefficients: updateCoefficientsMutation.mutate,
    computeForecasts,
  };
});

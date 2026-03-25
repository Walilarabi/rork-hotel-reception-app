import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, TrendingUp, TrendingDown, Minus, Settings, Calendar } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useHotel } from '@/providers/HotelProvider';
import { useForecast } from '@/providers/ForecastProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { DayForecast } from '@/constants/types';

const STATUS_COLORS = {
  ok: FT.success,
  warning: FT.warning,
  critical: FT.danger,
} as const;

const STATUS_BG = {
  ok: FT.successSoft,
  warning: FT.warningSoft,
  critical: FT.dangerSoft,
} as const;

interface ForecastDayBlockProps {
  forecast: DayForecast;
  label: string;
  isToday?: boolean;
  t: ReturnType<typeof useTheme>['t'];
}

const ForecastDayBlock = React.memo(function ForecastDayBlock({
  forecast,
  label,
  isToday,
  t,
}: ForecastDayBlockProps) {
  const statusColor = STATUS_COLORS[forecast.status];
  const statusBg = STATUS_BG[forecast.status];

  const diff = forecast.availableStaff - forecast.estimatedStaff;
  let availLabel = '';
  if (diff > 0) {
    availLabel = `${diff} ${t.forecast.inReserve}`;
  } else if (diff === 0) {
    availLabel = t.forecast.justEnough;
  } else {
    availLabel = `${Math.abs(diff)} ${t.forecast.shortage}`;
  }

  return (
    <View style={[s.dayBlock, isToday && s.dayBlockToday]}>
      <View style={s.dayHeader}>
        <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{label}</Text>
        {isToday && <View style={s.todayDot} />}
      </View>

      <View style={s.dayStats}>
        <View style={s.statPill}>
          <View style={[s.statDot, { backgroundColor: FT.danger }]} />
          <Text style={s.statValue}>{forecast.departures}</Text>
          <Text style={s.statLabel}>{t.forecast.departures}</Text>
        </View>
        <View style={s.statPill}>
          <View style={[s.statDot, { backgroundColor: FT.orange }]} />
          <Text style={s.statValue}>{forecast.stayovers}</Text>
          <Text style={s.statLabel}>{t.forecast.stayovers}</Text>
        </View>
      </View>

      <View style={s.dayTotalRow}>
        <Text style={s.dayTotalLabel}>{t.forecast.totalRooms}</Text>
        <Text style={s.dayTotalValue}>{forecast.weightedTotal}</Text>
      </View>

      <View style={s.daySeparator} />

      <View style={[s.needBadge, { backgroundColor: statusBg }]}>
        <View style={[s.needDot, { backgroundColor: statusColor }]} />
        <Text style={[s.needValue, { color: statusColor }]}>
          {forecast.estimatedStaff} {forecast.estimatedStaff === 1 ? t.forecast.employee : t.forecast.employees}
        </Text>
      </View>

      <View style={s.availRow}>
        <Users size={11} color={FT.textMuted} />
        <Text style={s.availText}>
          {t.forecast.available}: {forecast.availableStaff}
        </Text>
        {diff !== 0 && (
          <Text style={[s.availDiff, { color: diff > 0 ? FT.success : FT.danger }]}>
            ({availLabel})
          </Text>
        )}
        {diff === 0 && (
          <Text style={[s.availDiff, { color: FT.warning }]}>
            ({availLabel})
          </Text>
        )}
      </View>
    </View>
  );
});

interface WeekBarProps {
  forecasts: DayForecast[];
  t: ReturnType<typeof useTheme>['t'];
}

const WeekBar = React.memo(function WeekBar({ forecasts, t }: WeekBarProps) {
  const maxStaff = Math.max(...forecasts.map((f) => f.estimatedStaff), 1);

  const dayNames = useMemo(() => {
    return forecasts.map((f) => {
      const d = new Date(f.date);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' }).substring(0, 3);
    });
  }, [forecasts]);

  return (
    <View style={s.weekSection}>
      <Text style={s.weekTitle}>{t.forecast.weekForecast}</Text>
      <View style={s.weekBars}>
        {forecasts.map((f, i) => {
          const height = maxStaff > 0 ? (f.estimatedStaff / maxStaff) * 48 : 0;
          const barColor = STATUS_COLORS[f.status];
          return (
            <View key={f.date} style={s.weekBarCol}>
              <Text style={s.weekBarValue}>{f.estimatedStaff}</Text>
              <View style={s.weekBarTrack}>
                <View
                  style={[
                    s.weekBarFill,
                    { height: Math.max(4, height), backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text style={[s.weekBarDay, i === 0 && s.weekBarDayToday]}>{dayNames[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

export default function StaffForecastCard() {
  const router = useRouter();
  const { t } = useTheme();
  const { rooms, allStaff } = useHotel();
  const { computeForecasts, config } = useForecast();

  const forecasts = useMemo(
    () => computeForecasts(rooms, allStaff, 7),
    [rooms, allStaff, computeForecasts]
  );

  const todayForecast = forecasts[0];
  const tomorrowForecast = forecasts[1];
  const dayAfterForecast = forecasts[2];

  const trend = useMemo(() => {
    if (!todayForecast || !tomorrowForecast) return 0;
    return todayForecast.estimatedStaff - (tomorrowForecast?.estimatedStaff ?? todayForecast.estimatedStaff);
  }, [todayForecast, tomorrowForecast]);

  if (!todayForecast) return null;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleRow}>
          <View style={s.cardIcon}>
            <Users size={16} color={FT.brand} />
          </View>
          <Text style={s.cardTitle}>{t.forecast.staffNeeds}</Text>
        </View>
        <TouchableOpacity
          style={s.configBtn}
          onPress={() => router.push('/forecast-config')}
          activeOpacity={0.7}
        >
          <Settings size={14} color={FT.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={s.capacityRow}>
        <Calendar size={11} color={FT.textMuted} />
        <Text style={s.capacityText}>
          {t.forecast.capacityPerEmployee}: {config.defaultMaxRoomsPerHousekeeper} {t.rooms.rooms.toLowerCase()}
        </Text>
      </View>

      <ForecastDayBlock
        forecast={todayForecast}
        label={t.forecast.today}
        isToday
        t={t}
      />
      <ForecastDayBlock
        forecast={tomorrowForecast}
        label={t.forecast.tomorrow}
        t={t}
      />
      <ForecastDayBlock
        forecast={dayAfterForecast}
        label={t.forecast.dayAfter}
        t={t}
      />

      {trend !== 0 && (
        <View style={s.trendRow}>
          {trend > 0 ? (
            <TrendingDown size={13} color={FT.success} />
          ) : (
            <TrendingUp size={13} color={FT.warning} />
          )}
          <Text style={s.trendText}>
            {t.forecast.trend}: {Math.abs(trend)}{' '}
            {trend > 0 ? t.forecast.trendDown : t.forecast.trendUp}
          </Text>
        </View>
      )}
      {trend === 0 && (
        <View style={s.trendRow}>
          <Minus size={13} color={FT.textMuted} />
          <Text style={s.trendText}>{t.forecast.trendStable}</Text>
        </View>
      )}

      <WeekBar forecasts={forecasts} t={t} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: FT.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: FT.text,
  },
  configBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FT.surfaceAlt,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: FT.border,
  },
  capacityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingBottom: 2,
  },
  capacityText: {
    fontSize: 11,
    color: FT.textMuted,
    fontWeight: '500' as const,
  },
  dayBlock: {
    backgroundColor: FT.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: FT.border,
  },
  dayBlockToday: {
    borderColor: FT.brand + '30',
    backgroundColor: FT.brandSoft,
  },
  dayHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: FT.text,
  },
  dayLabelToday: {
    color: FT.brand,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FT.brand,
  },
  dayStats: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  statPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: FT.text,
  },
  statLabel: {
    fontSize: 11,
    color: FT.textMuted,
  },
  dayTotalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  dayTotalLabel: {
    fontSize: 11,
    color: FT.textSec,
    fontWeight: '500' as const,
  },
  dayTotalValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: FT.text,
  },
  daySeparator: {
    height: 1,
    backgroundColor: FT.border,
  },
  needBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  needDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  needValue: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  availRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  availText: {
    fontSize: 11,
    color: FT.textMuted,
    fontWeight: '500' as const,
  },
  availDiff: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  trendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: FT.surfaceAlt,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    color: FT.textSec,
    fontWeight: '500' as const,
  },
  weekSection: {
    gap: 8,
    paddingTop: 4,
  },
  weekTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: FT.textSec,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  weekBars: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    gap: 4,
  },
  weekBarCol: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 3,
  },
  weekBarValue: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: FT.text,
  },
  weekBarTrack: {
    width: '100%' as unknown as number,
    height: 48,
    backgroundColor: FT.bg,
    borderRadius: 4,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  weekBarFill: {
    width: '100%' as unknown as number,
    borderRadius: 4,
  },
  weekBarDay: {
    fontSize: 9,
    color: FT.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  weekBarDayToday: {
    color: FT.brand,
    fontWeight: '800' as const,
  },
});

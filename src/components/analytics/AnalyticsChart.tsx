import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Play } from 'lucide-react';
import type { Dog, TrainingSession } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { DISTRACTION_LABELS } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface AnalyticsChartProps {
  dog: Dog;
  sessions: TrainingSession[];
  onStartTraining?: () => void;
  className?: string;
}

export interface ChartDataPoint {
  id: string;
  sessionNumber: number;
  name: string;
  dateIso: string;
  dateShort: string;
  dateFull: string;
  distractionLabel: string;
  overallIndex: number;
  okdIndex: number;
  behaviorIndex: number;
  zksIndex: number | null;
  sportIndex: number | null;
  attentionIndex: number | null;
  trustIndex: number | null;
  hasBehaviorSkills: boolean;
  hasOkdSkills: boolean;
  hasZksSkills: boolean;
  hasSportSkills: boolean;
  hasAttentionSkills: boolean;
  hasTrustSkills: boolean;
}

interface ChartThemePalette {
  gridStroke: string;
  axisStroke: string;
  tickFill: string;
  dotFill: string;
  overall: string;
  okd: string;
  zks: string;
  sport: string;
  attention: string;
  trust: string;
  behavior: string;
}

function getChartPalette(isDark: boolean): ChartThemePalette {
  return {
    gridStroke: isDark ? '#322b23' : '#e6dfd4',
    axisStroke: isDark ? '#322b23' : '#e6dfd4',
    tickFill: isDark ? '#8a7f71' : '#94897a',
    dotFill: isDark ? '#1b1814' : '#fffcf8',
    overall: isDark ? '#58b482' : '#286144',
    okd: isDark ? '#ebe3d6' : '#221c15',
    zks: isDark ? '#e19b56' : '#b06728',
    sport: isDark ? '#7da6c4' : '#4a6b82',
    attention: isDark ? '#b590bf' : '#765480',
    trust: isDark ? '#d98d83' : '#a85247',
    behavior: isDark ? '#a69c8e' : '#8a8175',
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
  palette: ChartThemePalette;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, palette }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const showBaselinePair =
    !data.hasZksSkills &&
    !data.hasSportSkills &&
    !data.hasAttentionSkills &&
    !data.hasTrustSkills;

  const rows: Array<{
    key: string;
    label: string;
    color: string;
    valueText: string;
    isPrimary?: boolean;
  }> = [
    {
      key: 'overall',
      label: 'Общий индекс',
      color: palette.overall,
      valueText: `${data.overallIndex}%`,
      isPrimary: true,
    },
  ];

  if (data.hasOkdSkills || showBaselinePair) {
    rows.push({
      key: 'okd',
      label: 'Курс ОКД',
      color: palette.okd,
      valueText: data.hasOkdSkills ? `${data.okdIndex}%` : '—',
    });
  }

  if (data.hasZksSkills) {
    rows.push({
      key: 'zks',
      label: 'ЗКС',
      color: palette.zks,
      valueText: data.zksIndex !== null ? `${data.zksIndex}%` : '—',
    });
  }

  if (data.hasSportSkills) {
    rows.push({
      key: 'sport',
      label: 'Активный спорт',
      color: palette.sport,
      valueText: data.sportIndex !== null ? `${data.sportIndex}%` : '—',
    });
  }

  if (data.hasAttentionSkills) {
    rows.push({
      key: 'attention',
      label: 'Команды для внимания',
      color: palette.attention,
      valueText: data.attentionIndex !== null ? `${data.attentionIndex}%` : '—',
    });
  }

  if (data.hasTrustSkills) {
    rows.push({
      key: 'trust',
      label: 'Команды для доверия',
      color: palette.trust,
      valueText: data.trustIndex !== null ? `${data.trustIndex}%` : '—',
    });
  }

  if (data.hasBehaviorSkills || showBaselinePair) {
    rows.push({
      key: 'behavior',
      label: 'Коррекция поведения',
      color: palette.behavior,
      valueText: data.hasBehaviorSkills ? `${data.behaviorIndex}%` : '—',
    });
  }

  return (
    <div className="bg-[var(--bg-sheet)] border border-[var(--border-subtle)] rounded-xl p-3 min-w-[230px] text-[var(--text-primary)] shadow-[0_8px_24px_rgba(36,28,18,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] pointer-events-none">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 mb-2">
        <div>
          <span className="text-xs font-medium text-[var(--text-primary)] block">{data.name}</span>
          <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)] block">
            {data.dateFull}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-secondary)] font-mono tabular-nums">
          {data.distractionLabel}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full inline-block"
                style={{ backgroundColor: row.color }}
              />
              <span
                className={
                  row.isPrimary
                    ? 'text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)]'
                }
              >
                {row.label}
              </span>
            </div>
            <span
              className="font-mono font-medium tabular-nums"
              style={{ color: row.isPrimary ? palette.overall : row.color }}
            >
              {row.valueText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  dog,
  sessions,
  onStartTraining,
  className,
}) => {
  const theme = useDogStore((s) => s.theme);
  const palette = useMemo(() => getChartPalette(theme === 'dark'), [theme]);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const dogSessions = useMemo(
    () => sessions.filter((s) => s.dogId === dog.id),
    [sessions, dog.id]
  );

  const hasOkdSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'okd') ||
      dogSessions.some(
        (s) => s.okdIndexSnapshot > 0 || s.scores.some((sc) => sc.category === 'okd')
      ),
    [dog.skills, dogSessions]
  );

  const hasZksSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'zks') ||
      dogSessions.some(
        (s) => (s.zksIndexSnapshot ?? 0) > 0 || s.scores.some((sc) => sc.category === 'zks')
      ),
    [dog.skills, dogSessions]
  );

  const hasSportSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'sport') ||
      dogSessions.some(
        (s) =>
          (s.sportIndexSnapshot ?? 0) > 0 || s.scores.some((sc) => sc.category === 'sport')
      ),
    [dog.skills, dogSessions]
  );

  const hasAttentionSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'attention') ||
      dogSessions.some(
        (s) =>
          (s.attentionIndexSnapshot ?? 0) > 0 ||
          s.scores.some((sc) => sc.category === 'attention')
      ),
    [dog.skills, dogSessions]
  );

  const hasTrustSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'trust') ||
      dogSessions.some(
        (s) =>
          (s.trustIndexSnapshot ?? 0) > 0 || s.scores.some((sc) => sc.category === 'trust')
      ),
    [dog.skills, dogSessions]
  );

  const hasBehaviorSkills = useMemo(
    () =>
      dog.skills.some((s) => s.category === 'behavior') ||
      dogSessions.some(
        (s) =>
          s.behaviorIndexSnapshot > 0 || s.scores.some((sc) => sc.category === 'behavior')
      ),
    [dog.skills, dogSessions]
  );

  const chartData: ChartDataPoint[] = useMemo(() => {
    const sorted = [...dogSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((session, index) => {
      let dateShort = '—';
      let dateFull = '—';
      try {
        const parsedDate = parseISO(session.date);
        dateShort = format(parsedDate, 'd MMM', { locale: ru });
        dateFull = format(parsedDate, 'd MMMM yyyy', { locale: ru });
      } catch {
        dateShort = session.date.slice(0, 10);
        dateFull = session.date;
      }

      const distraction = DISTRACTION_LABELS[session.distractionLevel]?.label ?? 'Обычный';

      const hasSessionZks =
        session.zksIndexSnapshot !== undefined &&
        (session.zksIndexSnapshot > 0 || session.scores.some((sc) => sc.category === 'zks'));
      const hasSessionSport =
        session.sportIndexSnapshot !== undefined &&
        (session.sportIndexSnapshot > 0 ||
          session.scores.some((sc) => sc.category === 'sport'));
      const hasSessionAttention =
        session.attentionIndexSnapshot !== undefined &&
        (session.attentionIndexSnapshot > 0 ||
          session.scores.some((sc) => sc.category === 'attention'));
      const hasSessionTrust =
        session.trustIndexSnapshot !== undefined &&
        (session.trustIndexSnapshot > 0 ||
          session.scores.some((sc) => sc.category === 'trust'));

      return {
        id: session.id,
        sessionNumber: index + 1,
        name: `Занятие ${index + 1}`,
        dateIso: session.date,
        dateShort,
        dateFull,
        distractionLabel: distraction,
        overallIndex: session.overallIndexSnapshot,
        okdIndex: session.okdIndexSnapshot,
        behaviorIndex: session.behaviorIndexSnapshot,
        zksIndex: hasSessionZks ? (session.zksIndexSnapshot ?? 0) : null,
        sportIndex: hasSessionSport ? (session.sportIndexSnapshot ?? 0) : null,
        attentionIndex: hasSessionAttention ? (session.attentionIndexSnapshot ?? 0) : null,
        trustIndex: hasSessionTrust ? (session.trustIndexSnapshot ?? 0) : null,
        hasBehaviorSkills,
        hasOkdSkills,
        hasZksSkills,
        hasSportSkills,
        hasAttentionSkills,
        hasTrustSkills,
      };
    });
  }, [
    dogSessions,
    hasBehaviorSkills,
    hasOkdSkills,
    hasZksSkills,
    hasSportSkills,
    hasAttentionSkills,
    hasTrustSkills,
  ]);

  const toggleLine = (dataKey: string) => {
    setHiddenLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-subtle)] p-5 text-[var(--text-primary)]',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Динамика индекса по занятиям
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              График прогресса освоения нормативов
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)]">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            Журнал занятий пока пуст
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4 leading-relaxed">
            Проведите первое занятие с оценкой навыков, чтобы зафиксировать исходную точку и построить график динамики
          </p>
          {onStartTraining && (
            <button
              type="button"
              onClick={onStartTraining}
              className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Play className="size-3.5" strokeWidth={1.5} />
              <span>Начать занятие</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const latestPoint = chartData[chartData.length - 1];
  const firstPoint = chartData[0];
  const deltaFromStart = latestPoint.overallIndex - firstPoint.overallIndex;
  const showBaselinePair =
    !hasZksSkills && !hasSportSkills && !hasAttentionSkills && !hasTrustSkills;

  const activeSeriesLabels = [
    'Общий индекс',
    ...(hasOkdSkills || showBaselinePair ? ['курс ОКД'] : []),
    ...(hasZksSkills ? ['ЗКС'] : []),
    ...(hasSportSkills ? ['активный спорт'] : []),
    ...(hasAttentionSkills ? ['команды для внимания'] : []),
    ...(hasTrustSkills ? ['команды для доверия'] : []),
    ...(hasBehaviorSkills || showBaselinePair ? ['коррекция поведения'] : []),
  ];

  const subtitleText =
    activeSeriesLabels.length > 1
      ? `${activeSeriesLabels.slice(0, -1).join(', ')} и ${activeSeriesLabels[activeSeriesLabels.length - 1]}`
      : activeSeriesLabels[0];

  return (
    <div
      className={cn(
        'bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4 text-[var(--text-primary)]',
        className
      )}
    >
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Динамика индекса по занятиям
            </h3>
            <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
              {chartData.length}{' '}
              {chartData.length === 1
                ? 'занятие'
                : chartData.length < 5
                ? 'занятия'
                : 'занятий'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{subtitleText}</p>
        </div>

        {chartData.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">Изменение с первого занятия:</span>
            <span
              className={cn(
                'font-mono font-medium tabular-nums',
                deltaFromStart > 0
                  ? 'text-[var(--accent-forest)]'
                  : deltaFromStart < 0
                  ? 'text-[var(--accent-terracotta)]'
                  : 'text-[var(--text-secondary)]'
              )}
            >
              {deltaFromStart > 0 ? `+${deltaFromStart}%` : `${deltaFromStart}%`}
            </span>
          </div>
        )}
      </div>

      {chartData.length === 1 && (
        <div className="p-3 rounded-xl bg-[var(--bg-note)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          Зафиксировано первое занятие ({firstPoint.dateFull}). Линия тренда появится после второго занятия
        </div>
      )}

      {/* Recharts Container */}
      <div className="w-full h-64 min-h-[240px] min-w-0 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={palette.gridStroke} vertical={false} />
            <XAxis
              dataKey="dateShort"
              stroke={palette.axisStroke}
              tick={{ fill: palette.tickFill, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              stroke={palette.axisStroke}
              tick={{ fill: palette.tickFill, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickFormatter={(v: number) => `${v}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip palette={palette} />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', cursor: 'pointer' }}
              onClick={(e) => {
                if (e && typeof e.dataKey === 'string') {
                  toggleLine(e.dataKey);
                }
              }}
              formatter={(value: string, entry) => {
                const dataKey = entry.dataKey as string;
                const isHidden = hiddenLines[dataKey];
                return (
                  <span
                    className={cn(
                      'text-xs select-none transition-opacity',
                      isHidden
                        ? 'opacity-40 line-through text-[var(--text-muted)]'
                        : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {value}
                  </span>
                );
              }}
            />

            {/* Primary Accent Line: Общий индекс */}
            <Line
              type="monotone"
              dataKey="overallIndex"
              name="Общий индекс"
              stroke={palette.overall}
              strokeWidth={2}
              hide={hiddenLines.overallIndex}
              dot={{ r: 3.5, stroke: palette.overall, strokeWidth: 1.5, fill: palette.dotFill }}
              activeDot={{ r: 5, fill: palette.overall, stroke: palette.dotFill, strokeWidth: 1.5 }}
            />

            {/* Neutral Ramp: Курс ОКД */}
            {(hasOkdSkills || showBaselinePair) && (
              <Line
                type="monotone"
                dataKey="okdIndex"
                name="Курс ОКД"
                stroke={palette.okd}
                strokeWidth={1.5}
                hide={hiddenLines.okdIndex}
                dot={{ r: 3, stroke: palette.okd, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.okd, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}

            {/* ZKS Line: ЗКС */}
            {hasZksSkills && (
              <Line
                type="monotone"
                dataKey="zksIndex"
                name="ЗКС"
                stroke={palette.zks}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                connectNulls
                hide={hiddenLines.zksIndex}
                dot={{ r: 3, stroke: palette.zks, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.zks, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}

            {/* Sport Line: Активный спорт */}
            {hasSportSkills && (
              <Line
                type="monotone"
                dataKey="sportIndex"
                name="Активный спорт"
                stroke={palette.sport}
                strokeWidth={1.5}
                strokeDasharray="2 3"
                connectNulls
                hide={hiddenLines.sportIndex}
                dot={{ r: 3, stroke: palette.sport, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.sport, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}

            {/* Attention Line: Команды для внимания */}
            {hasAttentionSkills && (
              <Line
                type="monotone"
                dataKey="attentionIndex"
                name="Команды для внимания"
                stroke={palette.attention}
                strokeWidth={1.5}
                strokeDasharray="5 2"
                connectNulls
                hide={hiddenLines.attentionIndex}
                dot={{ r: 3, stroke: palette.attention, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.attention, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}

            {/* Trust Line: Команды для доверия */}
            {hasTrustSkills && (
              <Line
                type="monotone"
                dataKey="trustIndex"
                name="Команды для доверия"
                stroke={palette.trust}
                strokeWidth={1.5}
                strokeDasharray="3 2"
                connectNulls
                hide={hiddenLines.trustIndex}
                dot={{ r: 3, stroke: palette.trust, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.trust, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}

            {/* Neutral Ramp: Коррекция поведения */}
            {(hasBehaviorSkills || showBaselinePair) && (
              <Line
                type="monotone"
                dataKey="behaviorIndex"
                name="Коррекция поведения"
                stroke={palette.behavior}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                hide={hiddenLines.behaviorIndex}
                dot={{ r: 3, stroke: palette.behavior, strokeWidth: 1.5, fill: palette.dotFill }}
                activeDot={{ r: 4.5, fill: palette.behavior, stroke: palette.dotFill, strokeWidth: 1.5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

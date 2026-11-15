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
  hasBehaviorSkills: boolean;
  hasOkdSkills: boolean;
  hasZksSkills: boolean;
  hasSportSkills: boolean;
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
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const showBaselinePair = !data.hasZksSkills && !data.hasSportSkills;

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
      color: '#286144',
      valueText: `${data.overallIndex}%`,
      isPrimary: true,
    },
  ];

  if (data.hasOkdSkills || showBaselinePair) {
    rows.push({
      key: 'okd',
      label: 'Курс ОКД',
      color: '#221c15',
      valueText: data.hasOkdSkills ? `${data.okdIndex}%` : '—',
    });
  }

  if (data.hasZksSkills) {
    rows.push({
      key: 'zks',
      label: 'ЗКС',
      color: '#b06728',
      valueText: data.zksIndex !== null ? `${data.zksIndex}%` : '—',
    });
  }

  if (data.hasSportSkills) {
    rows.push({
      key: 'sport',
      label: 'Активный спорт',
      color: '#4a6b82',
      valueText: data.sportIndex !== null ? `${data.sportIndex}%` : '—',
    });
  }

  if (data.hasBehaviorSkills || showBaselinePair) {
    rows.push({
      key: 'behavior',
      label: 'Коррекция поведения',
      color: '#8a8175',
      valueText: data.hasBehaviorSkills ? `${data.behaviorIndex}%` : '—',
    });
  }

  return (
    <div className="bg-[#fffcf8] border border-[#221c15]/15 rounded-xl p-3 min-w-[230px] text-[#221c15] shadow-[0_8px_24px_rgba(36,28,18,0.08)] pointer-events-none">
      <div className="flex items-center justify-between gap-3 border-b border-[#221c15]/10 pb-2 mb-2">
        <div>
          <span className="text-xs font-medium text-[#221c15] block">{data.name}</span>
          <span className="font-mono text-[11px] tabular-nums text-[#94897a] block">
            {data.dateFull}
          </span>
        </div>
        <span className="text-[11px] text-[#655b4e] font-mono tabular-nums">
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
              <span className={row.isPrimary ? 'text-[#221c15] font-medium' : 'text-[#655b4e]'}>
                {row.label}
              </span>
            </div>
            <span
              className="font-mono font-medium tabular-nums"
              style={{ color: row.isPrimary ? '#286144' : row.color }}
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
        hasBehaviorSkills,
        hasOkdSkills,
        hasZksSkills,
        hasSportSkills,
      };
    });
  }, [dogSessions, hasBehaviorSkills, hasOkdSkills, hasZksSkills, hasSportSkills]);

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
          'bg-[#fffcf8] rounded-2xl border border-[#221c15]/10 p-5 text-[#221c15]',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#221c15]">
              Динамика индекса по занятиям
            </h3>
            <p className="text-xs text-[#655b4e]">
              График прогресса освоения нормативов
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[#221c15]/10 bg-[#f8f3eb]/60">
          <h4 className="text-sm font-medium text-[#221c15] mb-1">
            Журнал занятий пока пуст
          </h4>
          <p className="text-xs text-[#655b4e] max-w-sm mb-4 leading-relaxed">
            Проведите первое занятие с оценкой навыков, чтобы зафиксировать исходную точку и построить график динамики
          </p>
          {onStartTraining && (
            <button
              type="button"
              onClick={onStartTraining}
              className="h-9 px-4 rounded-lg bg-[#221c15] hover:bg-[#362d23] text-[#fffcf8] text-xs font-medium inline-flex items-center gap-2 transition-colors"
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
  const showBaselinePair = !hasZksSkills && !hasSportSkills;

  const activeSeriesLabels = [
    'Общий индекс',
    ...(hasOkdSkills || showBaselinePair ? ['курс ОКД'] : []),
    ...(hasZksSkills ? ['ЗКС'] : []),
    ...(hasSportSkills ? ['активный спорт'] : []),
    ...(hasBehaviorSkills || showBaselinePair ? ['коррекция поведения'] : []),
  ];

  const subtitleText =
    activeSeriesLabels.length > 1
      ? `${activeSeriesLabels.slice(0, -1).join(', ')} и ${activeSeriesLabels[activeSeriesLabels.length - 1]}`
      : activeSeriesLabels[0];

  return (
    <div
      className={cn(
        'bg-[#fffcf8] rounded-2xl border border-[#221c15]/10 p-5 space-y-4 text-[#221c15]',
        className
      )}
    >
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h3 className="text-sm font-medium text-[#221c15]">
              Динамика индекса по занятиям
            </h3>
            <span className="font-mono text-xs text-[#94897a] tabular-nums">
              {chartData.length}{' '}
              {chartData.length === 1
                ? 'занятие'
                : chartData.length < 5
                ? 'занятия'
                : 'занятий'}
            </span>
          </div>
          <p className="text-xs text-[#655b4e]">{subtitleText}</p>
        </div>

        {chartData.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#94897a]">Изменение с первого занятия:</span>
            <span
              className={cn(
                'font-mono font-medium tabular-nums',
                deltaFromStart > 0
                  ? 'text-[#286144]'
                  : deltaFromStart < 0
                  ? 'text-[#b84233]'
                  : 'text-[#655b4e]'
              )}
            >
              {deltaFromStart > 0 ? `+${deltaFromStart}%` : `${deltaFromStart}%`}
            </span>
          </div>
        )}
      </div>

      {chartData.length === 1 && (
        <div className="p-3 rounded-xl bg-[#f8f3eb]/70 border border-[#221c15]/10 text-xs text-[#655b4e]">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e6dfd4" vertical={false} />
            <XAxis
              dataKey="dateShort"
              stroke="#e6dfd4"
              tick={{ fill: '#94897a', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              stroke="#e6dfd4"
              tick={{ fill: '#94897a', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickFormatter={(v: number) => `${v}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
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
                      isHidden ? 'opacity-40 line-through text-[#94897a]' : 'text-[#655b4e]'
                    )}
                  >
                    {value}
                  </span>
                );
              }}
            />

            {/* Primary Accent Line: Общий индекс (#286144) */}
            <Line
              type="monotone"
              dataKey="overallIndex"
              name="Общий индекс"
              stroke="#286144"
              strokeWidth={2}
              hide={hiddenLines.overallIndex}
              dot={{ r: 3.5, stroke: '#286144', strokeWidth: 1.5, fill: '#fffcf8' }}
              activeDot={{ r: 5, fill: '#286144', stroke: '#fffcf8', strokeWidth: 1.5 }}
            />

            {/* Neutral Ramp: Курс ОКД (#221c15) */}
            {(hasOkdSkills || showBaselinePair) && (
              <Line
                type="monotone"
                dataKey="okdIndex"
                name="Курс ОКД"
                stroke="#221c15"
                strokeWidth={1.5}
                hide={hiddenLines.okdIndex}
                dot={{ r: 3, stroke: '#221c15', strokeWidth: 1.5, fill: '#fffcf8' }}
                activeDot={{ r: 4.5, fill: '#221c15', stroke: '#fffcf8', strokeWidth: 1.5 }}
              />
            )}

            {/* ZKS Line: ЗКС (#b06728) */}
            {hasZksSkills && (
              <Line
                type="monotone"
                dataKey="zksIndex"
                name="ЗКС"
                stroke="#b06728"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                connectNulls
                hide={hiddenLines.zksIndex}
                dot={{ r: 3, stroke: '#b06728', strokeWidth: 1.5, fill: '#fffcf8' }}
                activeDot={{ r: 4.5, fill: '#b06728', stroke: '#fffcf8', strokeWidth: 1.5 }}
              />
            )}

            {/* Sport Line: Активный спорт (#4a6b82) */}
            {hasSportSkills && (
              <Line
                type="monotone"
                dataKey="sportIndex"
                name="Активный спорт"
                stroke="#4a6b82"
                strokeWidth={1.5}
                strokeDasharray="2 3"
                connectNulls
                hide={hiddenLines.sportIndex}
                dot={{ r: 3, stroke: '#4a6b82', strokeWidth: 1.5, fill: '#fffcf8' }}
                activeDot={{ r: 4.5, fill: '#4a6b82', stroke: '#fffcf8', strokeWidth: 1.5 }}
              />
            )}

            {/* Neutral Ramp: Коррекция поведения (#8a8175 dashed) */}
            {(hasBehaviorSkills || showBaselinePair) && (
              <Line
                type="monotone"
                dataKey="behaviorIndex"
                name="Коррекция поведения"
                stroke="#8a8175"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                hide={hiddenLines.behaviorIndex}
                dot={{ r: 3, stroke: '#8a8175', strokeWidth: 1.5, fill: '#fffcf8' }}
                activeDot={{ r: 4.5, fill: '#8a8175', stroke: '#fffcf8', strokeWidth: 1.5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

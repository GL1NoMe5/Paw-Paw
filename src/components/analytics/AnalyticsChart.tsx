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
  hasBehaviorSkills: boolean;
  hasOkdSkills: boolean;
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

  return (
    <div className="bg-[#fdfbf7] border border-[#1f1b16]/15 rounded-lg p-3 min-w-[220px] text-[#1f1b16] shadow-[0_8px_24px_rgba(0,0,0,0.06)] pointer-events-none">
      <div className="flex items-center justify-between gap-3 border-b border-[#1f1b16]/10 pb-2 mb-2">
        <div>
          <span className="text-xs font-medium text-[#1f1b16] block">{data.name}</span>
          <span className="font-mono text-[11px] tabular-nums text-[#7b7266] block">
            {data.dateFull}
          </span>
        </div>
        <span className="text-[11px] text-[#5e554a] font-mono tabular-nums">
          {data.distractionLabel}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#1f5c3a] inline-block" />
            <span className="text-[#1f1b16] font-medium">Общий индекс</span>
          </div>
          <span className="font-mono font-medium text-[#1f5c3a] tabular-nums">
            {data.overallIndex}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#1f1b16] inline-block" />
            <span className="text-[#5e554a]">Курс ОКД</span>
          </div>
          <span className="font-mono font-medium text-[#1f1b16] tabular-nums">
            {data.hasOkdSkills ? `${data.okdIndex}%` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#8a8175] inline-block" />
            <span className="text-[#5e554a]">Коррекция поведения</span>
          </div>
          <span className="font-mono font-medium text-[#5e554a] tabular-nums">
            {data.hasBehaviorSkills ? `${data.behaviorIndex}%` : '—'}
          </span>
        </div>
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

  const hasOkdSkills = dog.skills.some((s) => s.category === 'okd');
  const hasBehaviorSkills = dog.skills.some((s) => s.category === 'behavior');

  const chartData: ChartDataPoint[] = useMemo(() => {
    const dogSessions = sessions.filter((s) => s.dogId === dog.id);
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
        hasBehaviorSkills,
        hasOkdSkills,
      };
    });
  }, [sessions, dog.id, hasBehaviorSkills, hasOkdSkills]);

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
          'bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 text-[#1f1b16]',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#1f1b16]">
              Динамика индекса по занятиям
            </h3>
            <p className="text-xs text-[#7b7266]">
              График прогресса освоения нормативов
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-[#1f1b16]/10 bg-[#efe9df]/40">
          <h4 className="text-sm font-medium text-[#1f1b16] mb-1">
            Журнал занятий пока пуст
          </h4>
          <p className="text-xs text-[#5e554a] max-w-sm mb-4 leading-relaxed">
            Проведите первое занятие с оценкой навыков, чтобы зафиксировать исходную точку и построить график динамики
          </p>
          {onStartTraining && (
            <button
              type="button"
              onClick={onStartTraining}
              className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-2 transition-colors"
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

  return (
    <div
      className={cn(
        'bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 space-y-4 text-[#1f1b16]',
        className
      )}
    >
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h3 className="text-sm font-medium text-[#1f1b16]">
              Динамика индекса по занятиям
            </h3>
            <span className="font-mono text-xs text-[#7b7266] tabular-nums">
              {chartData.length}{' '}
              {chartData.length === 1
                ? 'занятие'
                : chartData.length < 5
                ? 'занятия'
                : 'занятий'}
            </span>
          </div>
          <p className="text-xs text-[#7b7266]">
            Общий индекс, курс ОКД и коррекция поведения
          </p>
        </div>

        {chartData.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#7b7266]">Изменение с первого занятия:</span>
            <span
              className={cn(
                'font-mono font-medium tabular-nums',
                deltaFromStart > 0
                  ? 'text-[#1f5c3a]'
                  : deltaFromStart < 0
                  ? 'text-[#b93829]'
                  : 'text-[#5e554a]'
              )}
            >
              {deltaFromStart > 0 ? `+${deltaFromStart}%` : `${deltaFromStart}%`}
            </span>
          </div>
        )}
      </div>

      {chartData.length === 1 && (
        <div className="p-3 rounded-lg bg-[#efe9df]/60 border border-[#1f1b16]/10 text-xs text-[#5e554a]">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d6" vertical={false} />
            <XAxis
              dataKey="dateShort"
              stroke="#e6e0d6"
              tick={{ fill: '#7b7266', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              stroke="#e6e0d6"
              tick={{ fill: '#7b7266', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
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
                      isHidden ? 'opacity-40 line-through text-[#7b7266]' : 'text-[#5e554a]'
                    )}
                  >
                    {value}
                  </span>
                );
              }}
            />

            {/* Primary Accent Line: Общий индекс (#1f5c3a) */}
            <Line
              type="monotone"
              dataKey="overallIndex"
              name="Общий индекс"
              stroke="#1f5c3a"
              strokeWidth={2}
              hide={hiddenLines.overallIndex}
              dot={{ r: 3.5, stroke: '#1f5c3a', strokeWidth: 1.5, fill: '#fdfbf7' }}
              activeDot={{ r: 5, fill: '#1f5c3a', stroke: '#fdfbf7', strokeWidth: 1.5 }}
            />

            {/* Neutral Ramp Step 1: Курс ОКД (#1f1b16) */}
            <Line
              type="monotone"
              dataKey="okdIndex"
              name="Курс ОКД"
              stroke="#1f1b16"
              strokeWidth={1.5}
              hide={hiddenLines.okdIndex}
              dot={{ r: 3, stroke: '#1f1b16', strokeWidth: 1.5, fill: '#fdfbf7' }}
              activeDot={{ r: 4.5, fill: '#1f1b16', stroke: '#fdfbf7', strokeWidth: 1.5 }}
            />

            {/* Neutral Ramp Step 2: Коррекция поведения (#8a8175 dashed) */}
            <Line
              type="monotone"
              dataKey="behaviorIndex"
              name="Коррекция поведения"
              stroke="#8a8175"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              hide={hiddenLines.behaviorIndex}
              dot={{ r: 3, stroke: '#8a8175', strokeWidth: 1.5, fill: '#fdfbf7' }}
              activeDot={{ r: 4.5, fill: '#8a8175', stroke: '#fdfbf7', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

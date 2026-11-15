import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Dog } from '../../types';
import {
  calculateOverallDogIndex,
  getDogRank,
  DOG_RANKS,
  type DogRank,
} from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface IdealDogIndexCardProps {
  dog: Dog;
  className?: string;
  onNavigateToAnalytics?: () => void;
}

const SCALE_THRESHOLDS = [
  { percent: 0, label: 'Новичок' },
  { percent: 40, label: 'Прилежный ученик' },
  { percent: 60, label: 'Воспитанный компаньон' },
  { percent: 80, label: 'Без пяти минут спецназ' },
  { percent: 96, label: 'Идеальная служебная собака' },
];

export const IdealDogIndexCard: React.FC<IdealDogIndexCardProps> = ({
  dog,
  className,
  onNavigateToAnalytics,
}) => {
  const { overallIndex, okdIndex, behaviorIndex, zksIndex, sportIndex } =
    calculateOverallDogIndex(dog.skills);
  const currentRank = getDogRank(overallIndex);

  const currentRankIndex = DOG_RANKS.findIndex((r) => r.title === currentRank.title);
  const nextRank: DogRank | null =
    currentRankIndex >= 0 && currentRankIndex < DOG_RANKS.length - 1
      ? DOG_RANKS[currentRankIndex + 1]
      : null;

  const pointsToNext = nextRank ? Math.max(0, nextRank.minPercent - overallIndex) : 0;
  const pointsToHundred = Math.max(0, 100 - overallIndex);

  const allDisciplineMetrics = [
    {
      id: 'okd',
      label: 'Курс ОКД',
      count: dog.skills.filter((s) => s.category === 'okd').length,
      value: okdIndex,
    },
    {
      id: 'zks',
      label: 'ЗКС',
      count: dog.skills.filter((s) => s.category === 'zks').length,
      value: zksIndex,
    },
    {
      id: 'sport',
      label: 'Активный спорт',
      count: dog.skills.filter((s) => s.category === 'sport').length,
      value: sportIndex,
    },
    {
      id: 'behavior',
      label: 'Поведение',
      count: dog.skills.filter((s) => s.category === 'behavior').length,
      value: behaviorIndex,
    },
  ];

  const activeDisciplineMetrics = allDisciplineMetrics.filter((m) => m.count > 0);
  const visibleMetrics =
    activeDisciplineMetrics.length > 0
      ? activeDisciplineMetrics
      : [allDisciplineMetrics[0], allDisciplineMetrics[3]];

  return (
    <div
      className={cn(
        'bg-[#fffcf8] rounded-2xl border border-[#221c15]/10 p-5 space-y-5 text-[#221c15]',
        className
      )}
    >
      {/* 1. Header & Figures */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#221c15]/10">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-[#94897a] mb-1">
            <span>Квалификационный индекс</span>
            <span>·</span>
            <span className="text-[#286144] font-medium">{currentRank.title}</span>
          </div>
          <h2 className="font-serif text-xl font-medium text-[#221c15]">
            Индекс «Идеальная собака»
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-5 sm:gap-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            {visibleMetrics.map((metric) => (
              <React.Fragment key={metric.id}>
                <div>
                  <span className="block text-xs text-[#655b4e]">
                    {metric.label} ({metric.count})
                  </span>
                  <span className="font-mono text-lg font-medium tabular-nums text-[#221c15]">
                    {metric.value}%
                  </span>
                </div>
                <div className="h-7 w-px bg-[#221c15]/10" />
              </React.Fragment>
            ))}

            <div>
              <span className="block text-xs text-[#655b4e]">Общий индекс</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-medium tabular-nums text-[#286144]">
                  {overallIndex}%
                </span>
                <span className="font-mono text-xs tabular-nums text-[#94897a]">/ 100%</span>
              </div>
            </div>
          </div>

          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="h-9 px-3.5 rounded-lg border border-[#221c15]/15 bg-[#f8f3eb] hover:bg-[#ebe3d6] text-[#221c15] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <span>График и сводка</span>
              <ArrowRight className="size-4 text-[#655b4e]" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Single Horizontal Precision Instrument Scale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#655b4e]">
          <span>Шкала квалификационных нормативов</span>
          {nextRank ? (
            <span className="font-mono tabular-nums text-[#94897a]">
              До ранга «{nextRank.title}» ({nextRank.minPercent}%): +{pointsToNext}%
            </span>
          ) : (
            <span className="font-mono tabular-nums text-[#286144]">
              {overallIndex === 100
                ? 'Максимальный норматив выполнен (100%)'
                : `Высший ранг достигнут (до 100% осталось +${pointsToHundred}%)`}
            </span>
          )}
        </div>

        {/* Instrument Bar with 10% / 20% Graduations */}
        <div className="relative pt-1 pb-1">
          <div className="relative h-3 w-full rounded-[4px] bg-[#f2ece4] border border-[#221c15]/15 overflow-hidden">
            <div
              className="h-full w-full bg-[#286144] transition-transform duration-300"
              style={{
                transform: `translateX(-${100 - Math.max(0, Math.min(100, overallIndex))}%)`,
              }}
            />
            {/* Fine Tick Marks every 10% */}
            <div className="pointer-events-none absolute inset-0 flex justify-between">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => (
                <span
                  key={tick}
                  className={cn(
                    'w-px bg-[#221c15]',
                    tick === 0 || tick === 100
                      ? 'opacity-0'
                      : tick % 20 === 0
                      ? 'h-full opacity-30'
                      : 'h-1.5 self-end opacity-20'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Threshold Markers at 0%, 40%, 60%, 80%, 96% */}
          <div className="relative h-2 w-full">
            {SCALE_THRESHOLDS.map((item) => (
              <span
                key={item.percent}
                style={{ left: `${item.percent}%` }}
                className={cn(
                  'absolute top-0 h-2 w-px -translate-x-1/2',
                  overallIndex >= item.percent ? 'bg-[#286144]' : 'bg-[#221c15]/25'
                )}
              />
            ))}
          </div>
        </div>

        {/* 5 Rank Threshold Labels */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-[#221c15]/10">
          {SCALE_THRESHOLDS.map((item, idx) => {
            const nextThreshold = SCALE_THRESHOLDS[idx + 1]?.percent ?? 101;
            const isCurrent =
              overallIndex >= item.percent && overallIndex < nextThreshold;
            const isPassed = overallIndex >= item.percent;

            return (
              <div
                key={item.percent}
                className={cn(
                  'flex items-baseline gap-1.5 text-xs',
                  isCurrent
                    ? 'text-[#286144] font-medium'
                    : isPassed
                    ? 'text-[#221c15]'
                    : 'text-[#94897a]'
                )}
              >
                <span className="font-mono tabular-nums text-[11px] flex-shrink-0">
                  {item.percent}%
                </span>
                <span className="leading-snug">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

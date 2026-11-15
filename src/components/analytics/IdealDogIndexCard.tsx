import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Dog } from '../../types';
import { calculateOverallDogIndex, getDogRank, DOG_RANKS, type DogRank } from '../../utils/calculations';
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
  const { overallIndex, okdIndex, behaviorIndex } = calculateOverallDogIndex(dog.skills);
  const currentRank = getDogRank(overallIndex);

  const currentRankIndex = DOG_RANKS.findIndex((r) => r.title === currentRank.title);
  const nextRank: DogRank | null =
    currentRankIndex >= 0 && currentRankIndex < DOG_RANKS.length - 1
      ? DOG_RANKS[currentRankIndex + 1]
      : null;

  const pointsToNext = nextRank ? Math.max(0, nextRank.minPercent - overallIndex) : 0;
  const pointsToHundred = Math.max(0, 100 - overallIndex);

  const okdCount = dog.skills.filter((s) => s.category === 'okd').length;
  const behaviorCount = dog.skills.filter((s) => s.category === 'behavior').length;

  return (
    <div
      className={cn(
        'bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 space-y-5 text-[#1f1b16]',
        className
      )}
    >
      {/* 1. Header & Figures */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1f1b16]/10">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-[#7b7266] mb-1">
            <span>Квалификационный индекс</span>
            <span>·</span>
            <span className="text-[#1f5c3a] font-medium">{currentRank.title}</span>
          </div>
          <h2 className="font-serif text-xl font-medium text-[#1f1b16]">
            Индекс «Идеальная собака»
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-5">
            <div>
              <span className="block text-xs text-[#7b7266]">Курс ОКД ({okdCount})</span>
              <span className="font-mono text-lg font-medium tabular-nums text-[#1f1b16]">
                {okdIndex}%
              </span>
            </div>
            <div className="h-7 w-px bg-[#1f1b16]/10" />
            <div>
              <span className="block text-xs text-[#7b7266]">Поведение ({behaviorCount})</span>
              <span className="font-mono text-lg font-medium tabular-nums text-[#1f1b16]">
                {behaviorIndex}%
              </span>
            </div>
            <div className="h-7 w-px bg-[#1f1b16]/10" />
            <div>
              <span className="block text-xs text-[#7b7266]">Общий индекс</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-medium tabular-nums text-[#1f5c3a]">
                  {overallIndex}%
                </span>
                <span className="font-mono text-xs tabular-nums text-[#7b7266]">/ 100%</span>
              </div>
            </div>
          </div>

          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/15 bg-[#efe9df] hover:bg-[#e5dec9] text-[#1f1b16] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <span>График и сводка</span>
              <ArrowRight className="size-4 text-[#7b7266]" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Single Horizontal Precision Instrument Scale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5e554a]">
          <span>Шкала квалификационных нормативов</span>
          {nextRank ? (
            <span className="font-mono tabular-nums text-[#7b7266]">
              До ранга «{nextRank.title}» ({nextRank.minPercent}%): +{pointsToNext}%
            </span>
          ) : (
            <span className="font-mono tabular-nums text-[#1f5c3a]">
              {overallIndex === 100
                ? 'Максимальный норматив выполнен (100%)'
                : `Высший ранг достигнут (до 100% осталось +${pointsToHundred}%)`}
            </span>
          )}
        </div>

        {/* Instrument Bar with 10% / 20% Graduations */}
        <div className="relative pt-1 pb-1">
          <div className="relative h-3 w-full rounded-[4px] bg-[#efe9df] border border-[#1f1b16]/15 overflow-hidden">
            <div
              className="h-full w-full bg-[#1f5c3a] transition-transform duration-300"
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
                    'w-px bg-[#1f1b16]',
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
                  overallIndex >= item.percent ? 'bg-[#1f5c3a]' : 'bg-[#1f1b16]/25'
                )}
              />
            ))}
          </div>
        </div>

        {/* 5 Rank Threshold Labels */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-[#1f1b16]/10">
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
                    ? 'text-[#1f5c3a] font-medium'
                    : isPassed
                    ? 'text-[#1f1b16]'
                    : 'text-[#7b7266]'
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

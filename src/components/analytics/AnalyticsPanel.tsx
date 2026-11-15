import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import type { Dog } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { formatDogAgeRussian, calculateOverallDogIndex, getDogRank } from '../../utils/calculations';
import { IdealDogIndexCard } from './IdealDogIndexCard';
import { AnalyticsChart } from './AnalyticsChart';
import { MasterySummaryColumns } from './MasterySummaryColumns';
import { cn } from '../../utils/cn';

export interface AnalyticsPanelProps {
  dog: Dog;
  onBack: () => void;
  onStartTraining?: () => void;
  className?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  dog,
  onBack,
  onStartTraining,
  className,
}) => {
  const [imgError, setImgError] = useState(false);
  const [lastAvatar, setLastAvatar] = useState(dog.avatar);
  if (dog.avatar !== lastAvatar) {
    setLastAvatar(dog.avatar);
    setImgError(false);
  }

  const sessions = useDogStore((s) => s.sessions);
  const { overallIndex } = calculateOverallDogIndex(dog.skills);
  const currentRank = getDogRank(overallIndex);
  const ageString = formatDogAgeRussian(dog.birthDate);
  const showAvatar = Boolean(dog.avatar && !imgError);

  return (
    <div className={cn('space-y-5 pb-12 text-[#1f1b16]', className)}>
      {/* 1. Top Navigation & Archival Header Bar */}
      <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={onBack}
              className="size-9 rounded-lg border border-[#1f1b16]/15 bg-[#efe9df] hover:bg-[#e5dec9] text-[#1f1b16] flex items-center justify-center transition-colors flex-shrink-0"
              title="Вернуться в карточку собаки"
            >
              <ArrowLeft className="size-4 text-[#5e554a]" strokeWidth={1.5} />
            </button>

            {/* Dog Avatar — never overlaps initials */}
            <div className="relative size-12 rounded-lg overflow-hidden border border-[#1f1b16]/10 bg-[#efe9df] flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-mono text-sm font-medium text-[#5e554a]">
                  {dog.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-serif text-xl font-medium text-[#1f1b16]">
                  {dog.name}
                </h1>
                <span className="text-xs font-medium text-[#1f5c3a]">
                  {currentRank.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#5e554a] mt-0.5 flex-wrap">
                <span>{dog.gender === 'male' ? 'Кобель' : 'Сука'}</span>
                <span className="text-[#7b7266]">·</span>
                <span>{dog.breed}</span>
                <span className="text-[#7b7266]">·</span>
                <span className="font-mono tabular-nums">{ageString}</span>
                <span className="text-[#7b7266]">·</span>
                <span className="font-mono tabular-nums">{dog.weight} кг</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={onBack}
              className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>К досье</span>
            </button>
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
      </div>

      {/* 2. Ideal Dog Index Card */}
      <IdealDogIndexCard dog={dog} />

      {/* 3. Recharts Dynamic Trend Chart */}
      <AnalyticsChart
        dog={dog}
        sessions={sessions}
        onStartTraining={onStartTraining}
      />

      {/* 4. Two-Column Mastery Summary */}
      <MasterySummaryColumns skills={dog.skills} dog={dog} />
    </div>
  );
};

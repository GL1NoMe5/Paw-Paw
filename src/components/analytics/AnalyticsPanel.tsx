import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { DEFAULT_DISCIPLINES, type Dog } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import {
  formatDogAgeRussian,
  calculateOverallDogIndex,
  getDogRank,
} from '../../utils/calculations';
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

const DISCIPLINE_DISPLAY_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Активный спорт',
  behavior: 'Поведение',
};

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
  const { overallIndex, okdIndex, zksIndex, sportIndex, behaviorIndex } =
    calculateOverallDogIndex(dog.skills);
  const currentRank = getDogRank(overallIndex);
  const ageString = formatDogAgeRussian(dog.birthDate);
  const showAvatar = Boolean(dog.avatar && !imgError);

  const indexByCategory: Record<string, number> = {
    okd: okdIndex,
    zks: zksIndex,
    sport: sportIndex,
    behavior: behaviorIndex,
  };

  const activeDisciplines = DEFAULT_DISCIPLINES.map((disc) => ({
    id: disc.id,
    label: DISCIPLINE_DISPLAY_LABELS[String(disc.id)] ?? disc.shortTitle,
    count: dog.skills.filter((s) => s.category === disc.id).length,
    index: indexByCategory[String(disc.id)] ?? 0,
  })).filter((item) => item.count > 0);

  return (
    <div className={cn('space-y-5 pb-12 text-[var(--text-primary)]', className)}>
      {/* 1. Top Navigation & Archival Header Bar */}
      <div className="bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-subtle)] p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={onBack}
              className="size-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] flex items-center justify-center transition-colors flex-shrink-0"
              title="Вернуться в карточку собаки"
            >
              <ArrowLeft className="size-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </button>

            {/* Dog Avatar — never overlaps initials */}
            <div className="relative size-12 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-mono text-sm font-medium text-[var(--text-secondary)]">
                  {dog.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                  {dog.name}
                </h1>
                <span className="text-xs font-medium text-[var(--accent-forest)]">
                  {currentRank.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5 flex-wrap">
                <span>{dog.gender === 'male' ? 'Кобель' : 'Сука'}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span>{dog.breed}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="font-mono tabular-nums">{ageString}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="font-mono tabular-nums">{dog.weight} кг</span>
              </div>

              {activeDisciplines.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {activeDisciplines.map((disc) => (
                    <span
                      key={disc.id}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-note)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-mono tabular-nums"
                    >
                      {disc.label}: {disc.index}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={onBack}
              className="h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>К досье</span>
            </button>
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

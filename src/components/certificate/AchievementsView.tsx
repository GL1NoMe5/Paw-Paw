import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Award, Check, ArrowUpRight, RotateCcw } from 'lucide-react';
import type { Dog } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import {
  calculateOverallDogIndex,
  formatDogAgeRussian,
  getDogRank,
} from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { DiplomaStudio } from './CertificateModal';

export interface AchievementsViewProps {
  initialDogId?: string | null;
  onOpenStudent?: (dogId: string) => void;
  className?: string;
}

type AchievementsFilterTab = 'all' | 'issued' | 'ready';

const DogAvatarBadge: React.FC<{
  dog: Dog;
  hasError: boolean;
  onImageError: (avatarUrl: string) => void;
  sizeClass: string;
  textClass: string;
}> = ({ dog, hasError, onImageError, sizeClass, textClass }) => {
  const showImg = Boolean(dog.avatar && !hasError);
  const monogram = dog.name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'overflow-hidden border border-[#221c15]/10 bg-[#f2ece4] flex-shrink-0 flex items-center justify-center',
        sizeClass
      )}
    >
      {showImg ? (
        <img
          src={dog.avatar}
          alt={dog.name}
          className="size-full object-cover"
          onError={() => onImageError(dog.avatar)}
        />
      ) : (
        <span className={cn('font-mono font-medium text-[#655b4e]', textClass)}>
          {monogram}
        </span>
      )}
    </div>
  );
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  initialDogId,
  onOpenStudent,
  className,
}) => {
  const dogs = useDogStore((s) => s.dogs);

  const [filterTab, setFilterTab] = useState<AchievementsFilterTab>('all');
  const [selectedDogId, setSelectedDogId] = useState<string | null>(
    initialDogId ?? dogs[0]?.id ?? null
  );
  const [lastInitialDogId, setLastInitialDogId] = useState<string | null | undefined>(
    initialDogId
  );
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  if (initialDogId !== lastInitialDogId) {
    setLastInitialDogId(initialDogId);
    if (initialDogId) {
      setSelectedDogId(initialDogId);
      setFilterTab('all');
    }
  }

  const dogsWithStats = useMemo(() => {
    return dogs.map((dog) => {
      const indices = calculateOverallDogIndex(dog.skills);
      return {
        dog,
        overallIndex: indices.overallIndex,
        rank: getDogRank(indices.overallIndex),
      };
    });
  }, [dogs]);

  const issuedCount = useMemo(
    () => dogsWithStats.filter((item) => item.dog.certificateIssued === true).length,
    [dogsWithStats]
  );

  const inProgressCount = useMemo(
    () => dogsWithStats.filter((item) => !item.dog.certificateIssued).length,
    [dogsWithStats]
  );

  const readyCount = useMemo(
    () => dogsWithStats.filter((item) => item.overallIndex >= 96).length,
    [dogsWithStats]
  );

  const filteredItems = useMemo(() => {
    if (filterTab === 'issued') {
      return dogsWithStats.filter((item) => item.dog.certificateIssued === true);
    }
    if (filterTab === 'ready') {
      return dogsWithStats.filter((item) => item.overallIndex >= 96);
    }
    return dogsWithStats;
  }, [dogsWithStats, filterTab]);

  const activeItem = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return (
      filteredItems.find((item) => item.dog.id === selectedDogId) ??
      filteredItems[0]
    );
  }, [filteredItems, selectedDogId]);

  const selectedDog: Dog | null = activeItem?.dog ?? null;

  const handleMarkAvatarFailed = (avatarUrl: string) => {
    setFailedAvatars((prev) => ({ ...prev, [avatarUrl]: true }));
  };

  const formatIssuedAt = (iso?: string): string | null => {
    if (!iso) return null;
    try {
      const parsed = parseISO(iso);
      if (Number.isNaN(parsed.getTime())) return null;
      return format(parsed, 'd MMM yyyy', { locale: ru });
    } catch {
      return null;
    }
  };

  const filterTabs: Array<{ id: AchievementsFilterTab; label: string; count: number }> = [
    { id: 'all', label: 'Все ученики', count: dogsWithStats.length },
    { id: 'issued', label: 'С дипломами', count: issuedCount },
    { id: 'ready', label: 'Готовы к выпуску ≥96%', count: readyCount },
  ];

  return (
    <div className={cn('px-5 sm:px-9 py-7 space-y-6 text-[#221c15]', className)}>
      {/* 1. Header & Summary Counters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#221c15]/10">
        <div>
          <h1 className="font-serif text-[28px] leading-tight font-medium text-[#221c15] tracking-[-0.01em]">
            Достижения и дипломы
          </h1>
          <p className="text-[13px] text-[#655b4e] mt-1">
            Выпускная аттестация учеников Paw-Paw, присвоение званий и экспорт архивных дипломов А4
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="px-3.5 py-2 rounded-xl bg-[#f8f3eb] border border-[#221c15]/8 flex items-baseline gap-2.5">
            <span className="text-xs text-[#655b4e]">Выдано дипломов</span>
            <span className="font-mono text-lg font-medium tabular-nums text-[#286144]">
              {issuedCount}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#f8f3eb] border border-[#221c15]/8 flex items-baseline gap-2.5">
            <span className="text-xs text-[#655b4e]">Учеников в работе</span>
            <span className="font-mono text-lg font-medium tabular-nums text-[#221c15]">
              {inProgressCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Фильтр учеников для диплома"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#f8f3eb] border border-[#221c15]/8"
        >
          {filterTabs.map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  'h-8 px-3 rounded-[9px] text-xs font-medium inline-flex items-center gap-2 transition-colors',
                  isActive
                    ? 'bg-[#fffcf8] text-[#221c15] shadow-[0_1px_2px_rgba(36,28,18,0.06)] border border-[#221c15]/10'
                    : 'text-[#655b4e] hover:text-[#221c15]'
                )}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] tabular-nums text-[#94897a]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-[#94897a]">
          Выберите ученика, чтобы настроить и скачать диплом
        </span>
      </div>

      {/* 3. Empty States OR Dog Selector + Embedded Diploma Studio */}
      {dogs.length === 0 ? (
        <div className="craft-note p-10 text-center space-y-2">
          <Award className="size-6 text-[#94897a] mx-auto" strokeWidth={1.5} />
          <p className="text-sm font-medium text-[#221c15]">В картотеке пока нет учеников</p>
          <p className="text-xs text-[#655b4e] max-w-md mx-auto">
            Добавьте карточку собаки во вкладке «Ученики», чтобы оформлять аттестационные дипломы формата А4
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="craft-note p-10 text-center space-y-3">
          <p className="text-sm font-medium text-[#221c15]">
            В этой категории пока нет учеников
          </p>
          <p className="text-xs text-[#655b4e] max-w-md mx-auto">
            {filterTab === 'issued'
              ? 'Пока не выдан ни один диплом. Переключитесь на всех учеников, чтобы довести курс до 100% и оформить первый выпуск'
              : 'Пока нет учеников с индексом подготовки от 96%. Вы можете выбрать любого ученика из общего списка и подготовить макет диплома'}
          </p>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className="h-9 px-3.5 rounded-lg border border-[#221c15]/15 bg-[#fffcf8] hover:bg-[#f3ede3] text-xs font-medium text-[#221c15] inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="size-3.5" strokeWidth={1.5} />
            <span>Показать всех учеников</span>
          </button>
        </div>
      ) : (
        <>
          {/* Compact Interactive Selector of Dogs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredItems.map(({ dog, overallIndex }) => {
              const isSelected = selectedDog?.id === dog.id;

              return (
                <button
                  key={dog.id}
                  type="button"
                  onClick={() => setSelectedDogId(dog.id)}
                  className={cn(
                    'text-left p-3 rounded-xl border transition-all flex items-center gap-3',
                    isSelected
                      ? 'bg-[#f8f3eb] border-[#221c15]/30 shadow-[0_2px_8px_rgba(36,28,18,0.06)]'
                      : 'bg-[#fffcf8] border-[#221c15]/10 hover:bg-[#f8f3eb]/60 hover:border-[#221c15]/20'
                  )}
                >
                  <DogAvatarBadge
                    dog={dog}
                    hasError={Boolean(dog.avatar && failedAvatars[dog.avatar])}
                    onImageError={handleMarkAvatarFailed}
                    sizeClass="size-10 rounded-lg"
                    textClass="text-xs"
                  />

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-[#221c15] truncate">
                        {dog.name}
                      </span>
                      {dog.certificateIssued ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#286144]/10 border border-[#286144]/20 text-[11px] font-medium text-[#286144] flex-shrink-0">
                          Выпускник
                        </span>
                      ) : overallIndex >= 96 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#b06728]/10 border border-[#b06728]/25 text-[11px] font-medium text-[#b06728] flex-shrink-0 font-mono tabular-nums">
                          {overallIndex}%
                        </span>
                      ) : (
                        <span className="font-mono text-xs tabular-nums text-[#655b4e] flex-shrink-0">
                          {overallIndex}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#655b4e] truncate">
                        {dog.breed}
                      </span>
                      {dog.certificateIssued && (
                        <span className="font-mono text-[11px] tabular-nums text-[#94897a] flex-shrink-0">
                          {overallIndex}%
                        </span>
                      )}
                    </div>

                    <div className="h-1 w-full rounded-full bg-[#f2ece4] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#286144] transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, overallIndex))}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 4. Full Embedded A4 Diploma Studio */}
          {selectedDog && activeItem && (
            <div className="rounded-2xl border border-[#221c15]/10 bg-[#fffcf8] overflow-hidden shadow-[0_2px_12px_rgba(36,28,18,0.03)]">
              <DiplomaStudio
                dog={selectedDog}
                idPrefix="view-cert"
                controlsClassName="p-4 sm:p-5"
                previewContainerClassName="p-4 sm:p-6 bg-[#f2ece4]/80"
                renderTopBar={({ handleGraduate, officialGenderTitle }) => (
                  <div className="p-4 sm:p-5 border-b border-[#221c15]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <DogAvatarBadge
                        dog={selectedDog}
                        hasError={Boolean(
                          selectedDog.avatar && failedAvatars[selectedDog.avatar]
                        )}
                        onImageError={handleMarkAvatarFailed}
                        sizeClass="size-12 rounded-xl"
                        textClass="text-sm"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="font-serif text-xl font-medium text-[#221c15]">
                            {selectedDog.name}
                          </h2>
                          {selectedDog.certificateIssued ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#286144]/10 border border-[#286144]/20 text-[11px] font-medium text-[#286144]">
                              Выпускник
                              {formatIssuedAt(selectedDog.certificateIssuedAt)
                                ? ` · ${formatIssuedAt(selectedDog.certificateIssuedAt)}`
                                : ''}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#f8f3eb] border border-[#221c15]/12 text-[11px] font-mono tabular-nums text-[#655b4e]">
                              Индекс {activeItem.overallIndex}% · {activeItem.rank.title}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#655b4e] mt-0.5 truncate">
                          {selectedDog.breed} · {formatDogAgeRussian(selectedDog.birthDate)} · Звание:{' '}
                          {officialGenderTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {onOpenStudent && (
                        <button
                          type="button"
                          onClick={() => onOpenStudent(selectedDog.id)}
                          className="h-9 px-3.5 rounded-[8px] border border-[#221c15]/15 bg-[#fffcf8] hover:bg-[#f3ede3] text-[#221c15] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>К профилю ученика</span>
                          <ArrowUpRight className="size-3.5 text-[#655b4e]" strokeWidth={1.5} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleGraduate}
                        className="h-9 px-3.5 rounded-[8px] border border-[#286144]/30 bg-[#286144]/10 hover:bg-[#286144]/15 text-[#286144] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="size-3.5 stroke-[1.6]" />
                        <span>Довести курс до 100% и выдать диплом</span>
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

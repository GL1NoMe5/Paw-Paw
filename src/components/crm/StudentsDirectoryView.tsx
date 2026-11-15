import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Edit3,
  ArrowUpRight,
  RotateCcw,
  X,
  Award,
  Users,
} from 'lucide-react';
import type { Dog, DogFilter, SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import {
  calculateCategoryProgress,
  calculateOverallDogIndex,
  filterDogByCategory,
  formatDogAgeRussian,
  formatSessionDateRussian,
  getDogRank,
  getRussianPlural,
} from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface StudentsDirectoryViewProps {
  onSelectDog: (dogId: string) => void;
  onStartTrainingForDog: (dogId: string) => void;
  onAddDog: () => void;
  onEditDog: (dog: Dog) => void;
}

const FILTER_TABS: Array<{ id: DogFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'active_okd', label: 'ОКД' },
  { id: 'zks', label: 'ЗКС' },
  { id: 'sport', label: 'Активный спорт' },
  { id: 'behavior', label: 'Коррекция' },
  { id: 'graduates', label: 'Выпуск' },
];

const DISCIPLINE_SHORT_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Спорт',
  behavior: 'Коррекция',
};

const RULER_TICKS = [20, 40, 60, 80] as const;

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  onSelectDog,
  onStartTrainingForDog,
  onAddDog,
  onEditDog,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const sessions = useDogStore((s) => s.sessions);
  const filter = useDogStore((s) => s.filter);
  const setFilter = useDogStore((s) => s.setFilter);
  const searchQuery = useDogStore((s) => s.searchQuery);
  const setSearchQuery = useDogStore((s) => s.setSearchQuery);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const disciplines = useDogStore((s) => s.disciplines);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const disciplineNameMap = useMemo(() => {
    const map: Record<string, string> = { ...DISCIPLINE_SHORT_LABELS };
    for (const disc of disciplines) {
      map[String(disc.id)] = disc.shortTitle || disc.title;
    }
    return map;
  }, [disciplines]);

  const tabCounts = useMemo(() => {
    const counts: Record<DogFilter, number> = {
      all: dogs.length,
      active_okd: 0,
      zks: 0,
      sport: 0,
      behavior: 0,
      graduates: 0,
    };
    for (const dog of dogs) {
      if (filterDogByCategory(dog, 'active_okd')) counts.active_okd += 1;
      if (filterDogByCategory(dog, 'zks')) counts.zks += 1;
      if (filterDogByCategory(dog, 'sport')) counts.sport += 1;
      if (filterDogByCategory(dog, 'behavior')) counts.behavior += 1;
      if (filterDogByCategory(dog, 'graduates')) counts.graduates += 1;
    }
    return counts;
  }, [dogs]);

  const sessionsByDog = useMemo(() => {
    const map = new Map<string, { count: number; latestDate: string | null }>();
    for (const session of sessions) {
      const existing = map.get(session.dogId);
      if (!existing) {
        map.set(session.dogId, { count: 1, latestDate: session.date });
      } else {
        const nextLatest =
          existing.latestDate &&
          new Date(existing.latestDate).getTime() > new Date(session.date).getTime()
            ? existing.latestDate
            : session.date;
        map.set(session.dogId, { count: existing.count + 1, latestDate: nextLatest });
      }
    }
    return map;
  }, [sessions]);

  const filteredDogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dogs.filter((dog) => {
      if (!filterDogByCategory(dog, filter)) return false;
      if (!q) return true;
      return (
        dog.name.toLowerCase().includes(q) ||
        dog.breed.toLowerCase().includes(q) ||
        dog.ownerName.toLowerCase().includes(q)
      );
    });
  }, [dogs, filter, searchQuery]);

  const hasActiveFilters = filter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="px-6 sm:px-10 py-8 space-y-6 text-[var(--text-primary)]">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[32px] sm:text-[36px] font-medium text-[var(--text-primary)] leading-[1.08] tracking-[-0.02em]">
              Ученики
            </h1>
            <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded-[6px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              {filteredDogs.length === dogs.length
                ? `${dogs.length} ${getRussianPlural(dogs.length, 'собака', 'собаки', 'собак')}`
                : `${filteredDogs.length} из ${dogs.length}`}
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1.5">
            Картотека учеников, прогресс по курсам дрессировки и быстрый переход к тренировкам
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Кличка, порода или владелец..."
              aria-label="Поиск учеников"
              className="w-full h-9 pl-8 pr-8 text-[13px] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] focus:bg-[var(--bg-sheet)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Очистить поиск"
                aria-label="Очистить поиск"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Primary Add Dog Button */}
          <button
            type="button"
            onClick={onAddDog}
            className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 shadow-[0_1px_2px_rgba(31,27,22,0.12)] dark:shadow-none"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            <span>Добавить собаку</span>
          </button>
        </div>
      </header>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[10px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
          role="tablist"
          aria-label="Фильтр учеников по направлениям"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'h-7 px-3 rounded-[7px] text-[12.5px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap',
                  isActive
                    ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] font-medium shadow-[0_1px_2px_rgba(31,27,22,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isActive ? 'text-[var(--accent-forest)] font-medium' : 'text-[var(--text-muted)]'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="h-8 px-2.5 rounded-lg text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="size-3.5" strokeWidth={1.5} />
            <span>Сбросить фильтр</span>
          </button>
        )}
      </div>

      {/* Directory Grid or Empty State */}
      {filteredDogs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-sheet)] p-12 text-center max-w-xl mx-auto my-6">
          <div className="size-11 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]">
            <Users className="size-5" strokeWidth={1.5} />
          </div>

          <h2 className="font-serif text-xl font-medium text-[var(--text-primary)] mb-1.5">
            {dogs.length === 0 ? 'В картотеке пока нет учеников' : 'Подходящих учеников не найдено'}
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
            {dogs.length === 0
              ? 'Добавьте первую собаку в базу, чтобы вести дневник тренировок, команд и выпускных дипломов.'
              : 'Попробуйте изменить поисковый запрос, выбрать другую категорию или добавьте новую карточку собаки.'}
          </p>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="h-9 px-3.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="size-3.5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                <span>Сбросить фильтры</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAddDog}
              className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
              <span>Добавить собаку</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDogs.map((dog) => {
            const isActiveDog = dog.id === activeDogId;
            const { overallIndex } = calculateOverallDogIndex(dog.skills);
            const rank = getDogRank(overallIndex);
            const avatarKey = `${dog.id}:${dog.avatar}`;
            const showAvatar = Boolean(dog.avatar && !imgErrors[avatarKey]);
            const sessionStats = sessionsByDog.get(dog.id) ?? { count: 0, latestDate: null };

            // Collect present discipline indicators in canonical order first
            const presentCategories: SkillCategory[] = [];
            const seen = new Set<string>();
            for (const preferred of ['okd', 'zks', 'sport', 'behavior']) {
              if (dog.skills.some((s) => s.category === preferred)) {
                presentCategories.push(preferred);
                seen.add(preferred);
              }
            }
            for (const skill of dog.skills) {
              const key = String(skill.category);
              if (!seen.has(key)) {
                seen.add(key);
                presentCategories.push(skill.category);
              }
            }

            return (
              <article
                key={dog.id}
                className={cn(
                  'rounded-2xl border bg-[var(--bg-sheet)] p-5 flex flex-col justify-between gap-4 transition-all',
                  isActiveDog
                    ? 'border-[#286144]/40 dark:border-[#58b482]/50 shadow-[0_6px_20px_-6px_rgba(31,92,58,0.12)] dark:shadow-[0_8px_24px_-6px_rgba(88,180,130,0.15)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-[0_1px_2px_rgba(31,27,22,0.04)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.28)]'
                )}
              >
                <div className="space-y-4">
                  {/* Top Row: Avatar + Name + Overall % */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectDog(dog.id)}
                        className="size-12 rounded-xl overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#286144]/30 dark:focus:ring-[#58b482]/40"
                        title={`Открыть профиль: ${dog.name}`}
                      >
                        {showAvatar ? (
                          <img
                            src={dog.avatar}
                            alt={dog.name}
                            className="size-full object-cover"
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [avatarKey]: true }))
                            }
                          />
                        ) : (
                          <span className="font-mono text-xs font-medium text-[var(--text-secondary)] select-none">
                            {dog.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectDog(dog.id)}
                            className="font-serif text-[21px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-forest)] leading-tight text-left truncate transition-colors"
                          >
                            {dog.name}
                          </button>
                          {dog.certificateIssued && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#286144]/10 dark:bg-[#58b482]/15 border border-[#286144]/20 dark:border-[#58b482]/30 text-[var(--accent-forest)] text-[11px] font-medium"
                              title="Выпускной диплом выдан"
                            >
                              <Award className="size-3" strokeWidth={1.6} />
                              <span>Выпуск</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">
                          {dog.breed}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] flex-wrap">
                          <span>{dog.gender === 'male' ? 'Кобель' : 'Сука'}</span>
                          <span>·</span>
                          <span className="font-mono text-[11.5px] tabular-nums text-[var(--text-secondary)]">
                            {formatDogAgeRussian(dog.birthDate)}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[11.5px] tabular-nums">
                            {dog.weight} кг
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={cn(
                          'font-serif text-[26px] leading-none font-medium tabular-nums block',
                          overallIndex >= 96 ? 'text-[var(--accent-forest)]' : 'text-[var(--text-primary)]'
                        )}
                      >
                        {overallIndex}%
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                        индекс
                      </span>
                    </div>
                  </div>

                  {/* Precision Instrument Ruler + Rank */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-[var(--accent-forest)] font-medium truncate pr-2">
                        {rank.title}
                      </span>
                      <span className="font-mono tabular-nums text-[var(--text-muted)] flex-shrink-0">
                        {sessionStats.count}{' '}
                        {getRussianPlural(
                          sessionStats.count,
                          'тренировка',
                          'тренировки',
                          'тренировок'
                        )}
                      </span>
                    </div>

                    <div className="relative h-2 w-full rounded-[3px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          overallIndex >= 80 ? 'bg-[var(--accent-forest)]' : 'bg-[var(--text-secondary)]'
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, overallIndex))}%` }}
                      />
                      {RULER_TICKS.map((tick) => (
                        <div
                          key={tick}
                          className="absolute top-0 bottom-0 w-px bg-[#221c15]/15 dark:bg-[#f2ebe1]/15 pointer-events-none"
                          style={{ left: `${tick}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mini Discipline Indicators */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {presentCategories.length === 0 ? (
                      <span className="text-[11.5px] text-[var(--text-muted)]">
                        Навыки ещё не добавлены
                      </span>
                    ) : (
                      presentCategories.map((cat) => {
                        const pct = calculateCategoryProgress(dog.skills, cat);
                        const label = disciplineNameMap[String(cat)] || String(cat);
                        return (
                          <span
                            key={String(cat)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]"
                          >
                            <span>{label}</span>
                            <span
                              className={cn(
                                'font-mono tabular-nums font-medium',
                                pct >= 90 ? 'text-[var(--accent-forest)]' : 'text-[var(--text-primary)]'
                              )}
                            >
                              {pct}%
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Owner & Latest Session Meta */}
                  <div className="pt-2.5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2 text-[12px] text-[var(--text-secondary)]">
                    <span className="truncate">
                      <span className="text-[var(--text-muted)]">Владелец: </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {dog.ownerName || 'Не указан'}
                      </span>
                    </span>
                    {sessionStats.latestDate && (
                      <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)] flex-shrink-0">
                        {formatSessionDateRussian(sessionStats.latestDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectDog(dog.id)}
                    className="flex-1 h-8 px-3 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Открыть профиль</span>
                    <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartTrainingForDog(dog.id)}
                    className="h-8 px-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-[12px] font-medium inline-flex items-center justify-center gap-1 transition-colors flex-shrink-0"
                    title="Записать или начать тренировку"
                  >
                    <Play className="size-3 text-[var(--accent-forest)] fill-current" strokeWidth={1.5} />
                    <span>+ Тренировка</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditDog(dog)}
                    className="h-8 px-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] inline-flex items-center justify-center gap-1 transition-colors flex-shrink-0"
                    title="Редактировать карточку"
                    aria-label={`Редактировать ${dog.name}`}
                  >
                    <Edit3 className="size-3.5" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Редактировать</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

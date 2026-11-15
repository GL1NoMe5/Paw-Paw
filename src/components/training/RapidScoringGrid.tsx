import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { DistractionLevel, DogSkill, SkillCategory } from '../../types';
import {
  calculateNewMastery,
  SCORE_BASE_PERCENT,
  SCORE_COMPLETION_LABELS,
} from '../../utils/calculations';
import { cn } from '../../utils/cn';

export type RapidGradingMode = 'keys' | 'percent' | 'degree';

export interface RapidScoringGridProps {
  skills: DogSkill[];
  scores: Record<string, number>;
  practicedSkills: Set<string>;
  onScoreChange: (skillId: string, score: number) => void;
  onTogglePracticed: (skillId: string) => void;
  onSetAllPracticed?: (practiced: boolean) => void;
  distractionLevel?: DistractionLevel;
  activeCategory?: 'all' | SkillCategory;
  onActiveCategoryChange?: (category: 'all' | SkillCategory) => void;
  focusedSkillId?: string | null;
  onFocusedSkillIdChange?: (skillId: string) => void;
  className?: string;
}

const BUILTIN_CATEGORY_TABS: ReadonlyArray<{
  id: SkillCategory;
  tabLabel: string;
  badgeLabel: string;
}> = [
  { id: 'okd', tabLabel: 'ОКД', badgeLabel: 'ОКД' },
  { id: 'zks', tabLabel: 'ЗКС', badgeLabel: 'ЗКС' },
  { id: 'sport', tabLabel: 'Спорт', badgeLabel: 'Спорт' },
  { id: 'behavior', tabLabel: 'Коррекция', badgeLabel: 'Коррекция' },
];

const CATEGORY_BADGE_MAP: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Спорт',
  behavior: 'Коррекция',
};

const SCORE_LEVELS = [1, 2, 3, 4, 5] as const;
const RULER_TICKS = [20, 40, 60, 80] as const;

export const RapidScoringGrid: React.FC<RapidScoringGridProps> = ({
  skills,
  scores,
  practicedSkills,
  onScoreChange,
  onTogglePracticed,
  onSetAllPracticed,
  distractionLevel = 'quiet_yard',
  activeCategory: controlledCategory,
  onActiveCategoryChange,
  focusedSkillId,
  onFocusedSkillIdChange,
  className,
}) => {
  const [internalCategory, setInternalCategory] = useState<'all' | SkillCategory>('all');
  const [gradingMode, setGradingMode] = useState<RapidGradingMode>('keys');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeCategory = controlledCategory ?? internalCategory;
  const setActiveCategory = useCallback(
    (category: 'all' | SkillCategory) => {
      if (controlledCategory === undefined) {
        setInternalCategory(category);
      }
      onActiveCategoryChange?.(category);
    },
    [controlledCategory, onActiveCategoryChange]
  );

  const categoryTabs = useMemo(() => {
    const builtinIds = new Set(BUILTIN_CATEGORY_TABS.map((t) => String(t.id)));
    const extraCategories = Array.from(
      new Set(skills.map((s) => s.category).filter((cat) => !builtinIds.has(String(cat))))
    ).map((cat) => ({
      id: cat,
      tabLabel: String(cat),
      badgeLabel: String(cat),
    }));
    return [...BUILTIN_CATEGORY_TABS, ...extraCategories];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    if (activeCategory === 'all') return skills;
    return skills.filter((s) => s.category === activeCategory);
  }, [skills, activeCategory]);

  const matchedFocusedIndex = focusedSkillId
    ? filteredSkills.findIndex((s) => s.id === focusedSkillId)
    : -1;

  const clampedIndex =
    matchedFocusedIndex >= 0
      ? matchedFocusedIndex
      : filteredSkills.length > 0
      ? Math.min(Math.max(0, focusedIndex), filteredSkills.length - 1)
      : 0;

  const selectIndex = useCallback(
    (nextIndex: number) => {
      const clamped =
        filteredSkills.length > 0
          ? Math.min(Math.max(0, nextIndex), filteredSkills.length - 1)
          : 0;
      setFocusedIndex(clamped);
      const targetSkill = filteredSkills[clamped];
      if (targetSkill) {
        onFocusedSkillIdChange?.(targetSkill.id);
      }
    },
    [filteredSkills, onFocusedSkillIdChange]
  );

  useEffect(() => {
    const cardEl = cardRefs.current[clampedIndex];
    if (cardEl) {
      cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [clampedIndex]);

  const cycleGradingMode = useCallback(() => {
    setGradingMode((prev) =>
      prev === 'keys' ? 'percent' : prev === 'percent' ? 'degree' : 'keys'
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable ||
        target?.getAttribute('aria-label') === 'Секундомер выдержки'
      ) {
        return;
      }

      if (e.key === '%') {
        e.preventDefault();
        cycleGradingMode();
        return;
      }

      const currentSkill = filteredSkills[clampedIndex];
      if (!currentSkill) return;

      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const score = parseInt(e.key, 10);
        onScoreChange(currentSkill.id, score);
        if (!practicedSkills.has(currentSkill.id)) {
          onTogglePracticed(currentSkill.id);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectIndex(clampedIndex + 1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectIndex(clampedIndex - 1);
        return;
      }
    },
    [
      clampedIndex,
      cycleGradingMode,
      filteredSkills,
      onScoreChange,
      onTogglePracticed,
      practicedSkills,
      selectIndex,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const scoredCount = Object.keys(scores).filter((id) =>
    skills.some((s) => s.id === id)
  ).length;

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* Keyboard Shortcuts Bar & Mode Toggle */}
      <div className="rounded-lg bg-[var(--bg-note)] border border-[var(--border-subtle)] px-3.5 py-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[var(--text-primary)] font-medium">Быстрый ввод:</span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="keycap min-w-[24px] font-medium">
                1–5
              </kbd>
              <span>оценка</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="keycap min-w-[24px] font-medium">
                ↑ / ↓
              </kbd>
              <span>строка</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="keycap font-medium">
                %
              </kbd>
              <span>вид шкалы</span>
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            <div
              role="group"
              aria-label="Режим отображения шкалы оценок"
              className="inline-flex items-center rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] p-0.5"
            >
              <button
                type="button"
                onClick={() => setGradingMode('keys')}
                className={cn(
                  'h-6 px-2 rounded-[5px] text-[11px] font-mono tabular-nums transition-colors',
                  gradingMode === 'keys'
                    ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                1–5
              </button>
              <button
                type="button"
                onClick={() => setGradingMode('percent')}
                className={cn(
                  'h-6 px-2 rounded-[5px] text-[11px] font-mono tabular-nums transition-colors',
                  gradingMode === 'percent'
                    ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setGradingMode('degree')}
                className={cn(
                  'h-6 px-2 rounded-[5px] text-[11px] font-medium transition-colors',
                  gradingMode === 'degree'
                    ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                Степень
              </button>
            </div>

            <span className="font-mono tabular-nums text-xs text-[var(--text-primary)]">
              Оценено: <span className="font-medium">{scoredCount}</span> из {skills.length}
            </span>
          </div>
        </div>

        {/* Completion Degrees Reference Legend */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
          <span className="text-[var(--text-muted)] font-medium">Степень выполнения:</span>
          {SCORE_LEVELS.map((lvl) => {
            const info = SCORE_COMPLETION_LABELS[lvl];
            return (
              <span key={lvl} className="inline-flex items-center gap-1 font-mono tabular-nums">
                <span className="font-medium text-[var(--text-primary)]">{lvl}</span>
                <span className="font-sans text-[var(--text-secondary)]">{info.short}</span>
                <span className="text-[var(--text-muted)]">· {info.percent}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Category Filter Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[var(--bg-note)] rounded-lg border border-[var(--border-subtle)] text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
              activeCategory === 'all'
                ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <span>Все дисциплины</span>
            <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
              {skills.length}
            </span>
          </button>

          {categoryTabs.map((tab) => {
            const count = skills.filter((s) => s.category === tab.id).length;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
                  isActive
                    ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)]'
                    : count === 0
                    ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <span>{tab.tabLabel}</span>
                <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {onSetAllPracticed && (
          <div className="flex items-center gap-3 text-xs self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onSetAllPracticed(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Отметить все
            </button>
            <span className="text-[var(--text-muted)]">•</span>
            <button
              type="button"
              onClick={() => onSetAllPracticed(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Сбросить отметки
            </button>
          </div>
        )}
      </div>

      {/* Archival Rows of Skills */}
      <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sheet)] overflow-hidden">
        {filteredSkills.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">
            В выбранной категории у ученика пока нет добавленных команд. Используйте кнопку{' '}
            <span className="text-[var(--text-primary)] font-medium">«+ Добавить команду из наборов»</span>{' '}
            выше, чтобы включить упражнения из ОКД, ЗКС, спорта или коррекции.
          </div>
        ) : (
          filteredSkills.map((skill, index) => {
            const isFocused = index === clampedIndex;
            const isPracticed = practicedSkills.has(skill.id);
            const currentScore = scores[skill.id] || 0;
            const categoryLabel =
              CATEGORY_BADGE_MAP[String(skill.category)] ?? String(skill.category);
            const currentDegree = currentScore > 0 ? SCORE_COMPLETION_LABELS[currentScore] : null;

            const previewMastery =
              currentScore > 0
                ? calculateNewMastery(skill.mastery, currentScore, distractionLevel)
                : skill.mastery;
            const delta = previewMastery - skill.mastery;

            return (
              <div
                key={skill.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                tabIndex={0}
                onClick={() => selectIndex(index)}
                onFocus={() => selectIndex(index)}
                className={cn(
                  'px-4 py-3 transition-colors outline-none cursor-pointer select-none',
                  isFocused
                    ? 'bg-[var(--bg-active)]'
                    : isPracticed
                    ? 'bg-[var(--bg-note)] hover:bg-[var(--bg-hover)]'
                    : 'bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)]'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col justify-between gap-3',
                    gradingMode === 'degree'
                      ? 'xl:flex-row xl:items-center'
                      : 'lg:flex-row lg:items-center'
                  )}
                >
                  {/* Left: Checkbox, Name, Category, Score Status */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePracticed(skill.id);
                      }}
                      className={cn(
                        'mt-0.5 size-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0',
                        isPracticed
                          ? 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                          : 'bg-[var(--bg-sheet)] border-[var(--border-strong)] text-transparent hover:border-[var(--text-secondary)]'
                      )}
                      title={
                        isPracticed
                          ? 'Команда выбрана в тренировку (нажмите, чтобы исключить)'
                          : 'Включить команду в эту тренировку'
                      }
                      aria-label={`Отметить отработку ${skill.name}`}
                    >
                      <Check className="size-3 stroke-[2]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{skill.name}</span>
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-medium text-[var(--text-secondary)]">
                          {categoryLabel}
                        </span>
                        {currentDegree ? (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono tabular-nums font-medium border',
                              currentScore === 5
                                ? 'bg-[#286144]/10 dark:bg-[#58b482]/15 border-[#286144]/25 dark:border-[#58b482]/35 text-[var(--accent-forest)]'
                                : currentScore <= 2
                                ? 'bg-[#b84233]/10 dark:bg-[#e37163]/15 border-[#b84233]/25 dark:border-[#e37163]/35 text-[var(--accent-terracotta)]'
                                : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                            )}
                          >
                            {currentScore} {currentDegree.short} · {currentDegree.percent}%
                          </span>
                        ) : isPracticed ? (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#b06728]/10 dark:bg-[#e19b56]/15 border border-[#b06728]/25 dark:border-[#e19b56]/35 text-[10px] font-medium text-[var(--accent-ochre)]">
                            Укажите оценку 1–5
                          </span>
                        ) : null}
                      </div>
                      {skill.description && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Precision Tick-Mark Ruler & Live Delta */}
                  <div className="flex items-center gap-3 lg:w-56 flex-shrink-0">
                    <div className="relative h-2 flex-1 rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-forest)] transition-colors"
                        style={{ width: `${previewMastery}%` }}
                      />
                      {RULER_TICKS.map((tick) => (
                        <div
                          key={tick}
                          className="absolute top-0 bottom-0 w-px bg-[#221c15]/15 dark:bg-[#f2ebe1]/15 pointer-events-none"
                          style={{ left: `${tick}%` }}
                        />
                      ))}
                    </div>

                    <div className="w-24 text-right font-mono tabular-nums text-xs flex items-center justify-end gap-1.5">
                      <span className="text-[var(--text-primary)] font-medium">{previewMastery}%</span>
                      {currentScore > 0 && (
                        <span
                          className={cn(
                            'text-[11px]',
                            delta > 0
                              ? 'text-[var(--accent-forest)] font-medium'
                              : delta < 0
                              ? 'text-[var(--accent-terracotta)] font-medium'
                              : 'text-[var(--text-muted)]'
                          )}
                        >
                          {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '0%'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Tactile Score Buttons (1–5 / % / Степень) */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-auto flex-shrink-0">
                    {SCORE_LEVELS.map((scoreVal) => {
                      const isSelected = currentScore === scoreVal;
                      const compInfo = SCORE_COMPLETION_LABELS[scoreVal];
                      const basePct = SCORE_BASE_PERCENT[scoreVal];

                      return (
                        <button
                          key={scoreVal}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onScoreChange(skill.id, scoreVal);
                            if (!isPracticed) {
                              onTogglePracticed(skill.id);
                            }
                          }}
                          className={cn(
                            'h-8 rounded-[6px] border font-mono tabular-nums text-xs font-medium transition-colors inline-flex items-center justify-center',
                            gradingMode === 'degree'
                              ? 'px-2.5 font-sans'
                              : gradingMode === 'percent'
                              ? 'px-2 min-w-[44px]'
                              : 'w-8',
                            isSelected
                              ? scoreVal === 5
                                ? 'bg-[#286144] border-[#286144] text-[#fffcf8] dark:bg-[#58b482] dark:border-[#58b482] dark:text-[#12100e]'
                                : 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                              : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] shadow-[0_1px_0_rgba(31,27,22,0.1)] dark:shadow-[0_1px_0_rgba(0,0,0,0.45)]'
                          )}
                          title={`${scoreVal} ${compInfo.short} · ${compInfo.percent}% — ${compInfo.label}`}
                          aria-label={`${scoreVal} ${compInfo.short} · ${compInfo.percent}%`}
                        >
                          {gradingMode === 'percent' ? (
                            `${basePct}%`
                          ) : gradingMode === 'degree' ? (
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={cn(
                                  'font-mono text-[11px]',
                                  isSelected ? 'text-current opacity-80' : 'text-[var(--text-muted)]'
                                )}
                              >
                                {scoreVal}
                              </span>
                              <span>{compInfo.short}</span>
                            </span>
                          ) : (
                            scoreVal
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Row Status Bar */}
                {isFocused && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>Строка выбрана — нажмите</span>
                      <kbd className="keycap min-w-[24px] text-[10px] font-medium">
                        1–5
                      </kbd>
                      <span>для степени выполнения</span>
                    </span>
                    {currentDegree ? (
                      <span className="font-mono tabular-nums text-[var(--text-primary)]">
                        {currentScore} {currentDegree.short} · {currentDegree.percent}% (
                        {skill.mastery}% → {previewMastery}%)
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Степень выполнения ещё не выставлена</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

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
      <div className="rounded-lg bg-[#efe9df]/70 border border-[#1f1b16]/10 px-3.5 py-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5e554a]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[#1f1b16] font-medium">Быстрый ввод:</span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 rounded-[5px] border border-[#1f1b16]/20 bg-[#fffcf8] px-1.5 font-mono text-[11px] font-medium text-[#221c15] shadow-[0_1px_0_rgba(36,28,18,0.1)] select-none">
                1–5
              </kbd>
              <span>оценка</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 rounded-[5px] border border-[#1f1b16]/20 bg-[#fffcf8] px-1.5 font-mono text-[11px] font-medium text-[#221c15] shadow-[0_1px_0_rgba(36,28,18,0.1)] select-none">
                ↑ / ↓
              </kbd>
              <span>строка</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-[5px] border border-[#1f1b16]/20 bg-[#fffcf8] px-1.5 font-mono text-[11px] font-medium text-[#221c15] shadow-[0_1px_0_rgba(36,28,18,0.1)] select-none">
                %
              </kbd>
              <span>вид шкалы</span>
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            <div
              role="group"
              aria-label="Режим отображения шкалы оценок"
              className="inline-flex items-center rounded-[7px] border border-[#1f1b16]/10 bg-[#fffcf8] p-0.5"
            >
              <button
                type="button"
                onClick={() => setGradingMode('keys')}
                className={cn(
                  'h-6 px-2 rounded-[5px] text-[11px] font-mono tabular-nums transition-colors',
                  gradingMode === 'keys'
                    ? 'bg-[#1f1b16] text-[#fffcf8] font-medium'
                    : 'text-[#5e554a] hover:text-[#1f1b16]'
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
                    ? 'bg-[#1f1b16] text-[#fffcf8] font-medium'
                    : 'text-[#5e554a] hover:text-[#1f1b16]'
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
                    ? 'bg-[#1f1b16] text-[#fffcf8]'
                    : 'text-[#5e554a] hover:text-[#1f1b16]'
                )}
              >
                Степень
              </button>
            </div>

            <span className="font-mono tabular-nums text-xs text-[#1f1b16]">
              Оценено: <span className="font-medium">{scoredCount}</span> из {skills.length}
            </span>
          </div>
        </div>

        {/* Completion Degrees Reference Legend */}
        <div className="pt-2 border-t border-[#1f1b16]/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5e554a]">
          <span className="text-[#7b7266] font-medium">Степень выполнения:</span>
          {SCORE_LEVELS.map((lvl) => {
            const info = SCORE_COMPLETION_LABELS[lvl];
            return (
              <span key={lvl} className="inline-flex items-center gap-1 font-mono tabular-nums">
                <span className="font-medium text-[#1f1b16]">{lvl}</span>
                <span className="font-sans text-[#5e554a]">{info.short}</span>
                <span className="text-[#7b7266]">· {info.percent}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Category Filter Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1f1b16]/10">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#efe9df]/60 rounded-lg border border-[#1f1b16]/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
              activeCategory === 'all'
                ? 'bg-[#fffcf8] text-[#1f1b16] font-medium border border-[#1f1b16]/10'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
            )}
          >
            <span>Все дисциплины</span>
            <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">
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
                    ? 'bg-[#fffcf8] text-[#1f1b16] font-medium border border-[#1f1b16]/10'
                    : count === 0
                    ? 'text-[#7b7266] hover:text-[#1f1b16]'
                    : 'text-[#5e554a] hover:text-[#1f1b16]'
                )}
              >
                <span>{tab.tabLabel}</span>
                <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">
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
              className="text-[#5e554a] hover:text-[#1f1b16] transition-colors"
            >
              Отметить все
            </button>
            <span className="text-[#1f1b16]/20">•</span>
            <button
              type="button"
              onClick={() => onSetAllPracticed(false)}
              className="text-[#7b7266] hover:text-[#1f1b16] transition-colors"
            >
              Сбросить отметки
            </button>
          </div>
        )}
      </div>

      {/* Archival Rows of Skills */}
      <div className="divide-y divide-[#1f1b16]/10 rounded-xl border border-[#1f1b16]/10 bg-[#fffcf8] overflow-hidden">
        {filteredSkills.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-[#7b7266]">
            В выбранной категории у ученика пока нет добавленных команд. Используйте кнопку{' '}
            <span className="text-[#1f1b16] font-medium">«+ Добавить команду из наборов»</span>{' '}
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
                  'px-4 py-3 transition-colors outline-hidden cursor-pointer select-none',
                  isFocused
                    ? 'bg-[#efe9df]/80'
                    : isPracticed
                    ? 'bg-[#efe9df]/30 hover:bg-[#efe9df]/50'
                    : 'bg-[#fffcf8] hover:bg-[#efe9df]/40'
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
                          ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fffcf8]'
                          : 'bg-[#fffcf8] border-[#1f1b16]/25 text-transparent hover:border-[#1f1b16]/50'
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
                        <span className="text-sm font-medium text-[#1f1b16]">{skill.name}</span>
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[#efe9df] border border-[#1f1b16]/10 text-[10px] font-medium text-[#5e554a]">
                          {categoryLabel}
                        </span>
                        {currentDegree ? (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono tabular-nums font-medium border',
                              currentScore === 5
                                ? 'bg-[#286144]/10 border-[#286144]/25 text-[#286144]'
                                : currentScore <= 2
                                ? 'bg-[#b84233]/10 border-[#b84233]/25 text-[#b84233]'
                                : 'bg-[#1f1b16]/5 border-[#1f1b16]/15 text-[#1f1b16]'
                            )}
                          >
                            {currentScore} {currentDegree.short} · {currentDegree.percent}%
                          </span>
                        ) : isPracticed ? (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#b06728]/10 border border-[#b06728]/25 text-[10px] font-medium text-[#b06728]">
                            Укажите оценку 1–5
                          </span>
                        ) : null}
                      </div>
                      {skill.description && (
                        <p className="text-xs text-[#7b7266] line-clamp-1 mt-0.5">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Precision Tick-Mark Ruler & Live Delta */}
                  <div className="flex items-center gap-3 lg:w-56 flex-shrink-0">
                    <div className="relative h-2 flex-1 rounded-[4px] bg-[#efe9df] border border-[#1f1b16]/10 overflow-hidden">
                      <div
                        className="h-full bg-[#286144] transition-colors"
                        style={{ width: `${previewMastery}%` }}
                      />
                      {RULER_TICKS.map((tick) => (
                        <div
                          key={tick}
                          className="absolute top-0 bottom-0 w-px bg-[#1f1b16]/15 pointer-events-none"
                          style={{ left: `${tick}%` }}
                        />
                      ))}
                    </div>

                    <div className="w-24 text-right font-mono tabular-nums text-xs flex items-center justify-end gap-1.5">
                      <span className="text-[#1f1b16] font-medium">{previewMastery}%</span>
                      {currentScore > 0 && (
                        <span
                          className={cn(
                            'text-[11px]',
                            delta > 0
                              ? 'text-[#286144] font-medium'
                              : delta < 0
                              ? 'text-[#b84233] font-medium'
                              : 'text-[#7b7266]'
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
                                ? 'bg-[#286144] border-[#286144] text-[#fffcf8]'
                                : 'bg-[#1f1b16] border-[#1f1b16] text-[#fffcf8]'
                              : 'bg-[#fffcf8] border-[#1f1b16]/15 text-[#221c15] hover:bg-[#efe9df] shadow-[0_1px_0_rgba(31,27,22,0.1)]'
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
                                  isSelected ? 'text-[#fffcf8]/80' : 'text-[#7b7266]'
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
                  <div className="mt-2 pt-2 border-t border-[#1f1b16]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[#5e554a]">
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>Строка выбрана — нажмите</span>
                      <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 rounded-[5px] border border-[#1f1b16]/20 bg-[#fffcf8] px-1.5 font-mono text-[10px] font-medium text-[#221c15] shadow-[0_1px_0_rgba(36,28,18,0.1)] select-none">
                        1–5
                      </kbd>
                      <span>для степени выполнения</span>
                    </span>
                    {currentDegree ? (
                      <span className="font-mono tabular-nums text-[#1f1b16]">
                        {currentScore} {currentDegree.short} · {currentDegree.percent}% (
                        {skill.mastery}% → {previewMastery}%)
                      </span>
                    ) : (
                      <span className="text-[#7b7266]">Степень выполнения ещё не выставлена</span>
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

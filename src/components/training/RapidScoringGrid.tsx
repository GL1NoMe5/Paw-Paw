import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { DistractionLevel, DogSkill, SkillCategory } from '../../types';
import { calculateNewMastery, SCORE_BASE_PERCENT } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface RapidScoringGridProps {
  skills: DogSkill[];
  scores: Record<string, number>;
  practicedSkills: Set<string>;
  onScoreChange: (skillId: string, score: number) => void;
  onTogglePracticed: (skillId: string) => void;
  onSetAllPracticed?: (practiced: boolean) => void;
  distractionLevel?: DistractionLevel;
  className?: string;
}

const SCORE_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: '1 балл (Срыв)', desc: 'Отказ выполнять, срыв команды' },
  2: { title: '2 балла (Слабо)', desc: 'Грубые ошибки, повторные команды' },
  3: { title: '3 балла (Удовл.)', desc: 'С задержкой, помощь проводника' },
  4: { title: '4 балла (Хорошо)', desc: 'Быстро, мелкие погрешности' },
  5: { title: '5 баллов (Эталон)', desc: 'Безупречно по первой команде' },
};

const RULER_TICKS = [20, 40, 60, 80] as const;

export const RapidScoringGrid: React.FC<RapidScoringGridProps> = ({
  skills,
  scores,
  practicedSkills,
  onScoreChange,
  onTogglePracticed,
  onSetAllPracticed,
  distractionLevel = 'quiet_yard',
  className,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | SkillCategory>('all');
  const [gradingMode, setGradingMode] = useState<'keys' | 'percent'>('keys');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filteredSkills = skills.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  const okdCount = skills.filter((s) => s.category === 'okd').length;
  const behCount = skills.filter((s) => s.category === 'behavior').length;

  const clampedIndex =
    filteredSkills.length > 0 ? Math.min(Math.max(0, focusedIndex), filteredSkills.length - 1) : 0;

  useEffect(() => {
    const cardEl = cardRefs.current[clampedIndex];
    if (cardEl) {
      cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [clampedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable ||
        target?.getAttribute('aria-label') === 'Секундомер выдержки'
      ) {
        return;
      }

      if (e.key === '%') {
        e.preventDefault();
        setGradingMode((prev) => (prev === 'keys' ? 'percent' : 'keys'));
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
        setFocusedIndex((prev) => Math.min(filteredSkills.length - 1, prev + 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
    },
    [clampedIndex, filteredSkills, onScoreChange, onTogglePracticed, practicedSkills]
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
    <div className={cn('space-y-4', className)}>
      {/* Keyboard Shortcuts Bar & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#efe9df]/70 border border-[#1f1b16]/10 text-xs text-[#5e554a]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[#1f1b16] font-medium">Клавиатурный ввод:</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="keycap rounded-[5px] border border-[#1f1b16]/15 bg-[#fdfbf7] px-1.5 py-0.5 font-mono text-[11px] text-[#1f1b16]">
              1–5
            </kbd>
            <span>балл</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="keycap rounded-[5px] border border-[#1f1b16]/15 bg-[#fdfbf7] px-1.5 py-0.5 font-mono text-[11px] text-[#1f1b16]">
              ↑ / ↓
            </kbd>
            <span>строка</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="keycap rounded-[5px] border border-[#1f1b16]/15 bg-[#fdfbf7] px-1.5 py-0.5 font-mono text-[11px] text-[#1f1b16]">
              %
            </kbd>
            <span>режим шкалы</span>
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="inline-flex items-center rounded-[6px] border border-[#1f1b16]/10 bg-[#fdfbf7] p-0.5">
            <button
              type="button"
              onClick={() => setGradingMode('keys')}
              className={cn(
                'h-6 px-2 rounded-[4px] text-[11px] font-mono tabular-nums transition-colors',
                gradingMode === 'keys'
                  ? 'bg-[#1f1b16] text-[#fdfbf7] font-medium'
                  : 'text-[#5e554a] hover:text-[#1f1b16]'
              )}
            >
              1–5
            </button>
            <button
              type="button"
              onClick={() => setGradingMode('percent')}
              className={cn(
                'h-6 px-2 rounded-[4px] text-[11px] font-mono tabular-nums transition-colors',
                gradingMode === 'percent'
                  ? 'bg-[#1f1b16] text-[#fdfbf7] font-medium'
                  : 'text-[#5e554a] hover:text-[#1f1b16]'
              )}
            >
              %
            </button>
          </div>

          <span className="font-mono tabular-nums text-xs text-[#1f1b16]">
            Оценено: <span className="font-medium">{scoredCount}</span> из {skills.length}
          </span>
        </div>
      </div>

      {/* Category Filter Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1f1b16]/10">
        <div className="inline-flex items-center gap-1 p-1 bg-[#efe9df]/60 rounded-lg border border-[#1f1b16]/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
              activeCategory === 'all'
                ? 'bg-[#fdfbf7] text-[#1f1b16] font-medium border border-[#1f1b16]/10'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
            )}
          >
            <span>Все дисциплины</span>
            <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">{skills.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('okd')}
            className={cn(
              'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
              activeCategory === 'okd'
                ? 'bg-[#fdfbf7] text-[#1f1b16] font-medium border border-[#1f1b16]/10'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
            )}
          >
            <span>Курс ОКД</span>
            <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">{okdCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('behavior')}
            className={cn(
              'h-7 px-3 rounded-[6px] transition-colors inline-flex items-center gap-1.5',
              activeCategory === 'behavior'
                ? 'bg-[#fdfbf7] text-[#1f1b16] font-medium border border-[#1f1b16]/10'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
            )}
          >
            <span>Коррекция</span>
            <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">{behCount}</span>
          </button>
        </div>

        {onSetAllPracticed && (
          <div className="flex items-center gap-3 text-xs">
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
      <div className="divide-y divide-[#1f1b16]/10 rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] overflow-hidden">
        {filteredSkills.map((skill, index) => {
          const isFocused = index === clampedIndex;
          const isPracticed = practicedSkills.has(skill.id);
          const currentScore = scores[skill.id] || 0;
          const isOKD = skill.category === 'okd';

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
              onClick={() => setFocusedIndex(index)}
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                'px-4 py-3 transition-colors outline-hidden cursor-pointer select-none',
                isFocused
                  ? 'bg-[#efe9df]/80'
                  : isPracticed
                  ? 'bg-[#efe9df]/30 hover:bg-[#efe9df]/50'
                  : 'bg-[#fdfbf7] hover:bg-[#efe9df]/40'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Checkbox, Name, Category */}
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
                        ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                        : 'bg-[#fdfbf7] border-[#1f1b16]/25 text-transparent hover:border-[#1f1b16]/50'
                    )}
                    title={isPracticed ? 'Отработано в этой сессии' : 'Отметить отработку'}
                    aria-label={`Отметить отработку ${skill.name}`}
                  >
                    <Check className="size-3 stroke-[2]" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#1f1b16]">
                        {skill.name}
                      </span>
                      <span className="text-[11px] text-[#7b7266]">
                        {isOKD ? 'ОКД' : 'Коррекция'}
                      </span>
                    </div>
                    {skill.description && (
                      <p className="text-xs text-[#7b7266] line-clamp-1 mt-0.5">
                        {skill.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: Precision Tick-Mark Ruler & Live Delta */}
                <div className="flex items-center gap-3 lg:w-64 flex-shrink-0">
                  <div className="relative h-2 flex-1 rounded-[4px] bg-[#efe9df] border border-[#1f1b16]/10 overflow-hidden">
                    <div
                      className="h-full bg-[#1f5c3a] transition-colors"
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
                            ? 'text-[#1f5c3a] font-medium'
                            : delta < 0
                            ? 'text-[#b93829] font-medium'
                            : 'text-[#7b7266]'
                        )}
                      >
                        {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '0%'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Tactile Physical Keycaps (1–5 or % presets) */}
                <div className="flex items-center gap-1.5 self-end lg:self-auto flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((scoreVal) => {
                    const isSelected = currentScore === scoreVal;
                    const labelInfo = SCORE_LABELS[scoreVal];
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
                          gradingMode === 'percent' ? 'px-2 min-w-[42px]' : 'w-8',
                          isSelected
                            ? scoreVal === 5
                              ? 'bg-[#1f5c3a] border-[#1f5c3a] text-[#fdfbf7]'
                              : 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                            : 'keycap bg-[#fdfbf7] border-[#1f1b16]/15 text-[#5e554a] hover:bg-[#efe9df] hover:text-[#1f1b16] shadow-[0_1px_0_rgba(31,27,22,0.12)]'
                        )}
                        title={`${labelInfo.title}: ${labelInfo.desc}`}
                        aria-label={labelInfo.title}
                      >
                        {gradingMode === 'percent' ? `${basePct}%` : scoreVal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Row Status Bar */}
              {isFocused && (
                <div className="mt-2 pt-2 border-t border-[#1f1b16]/10 flex items-center justify-between text-[11px] text-[#5e554a]">
                  <span>
                    Строка выбрана — нажмите клавишу{' '}
                    <kbd className="font-mono text-[#1f1b16] font-medium">1–5</kbd> для оценки
                  </span>
                  {currentScore > 0 ? (
                    <span className="font-mono tabular-nums text-[#1f1b16]">
                      {SCORE_LABELS[currentScore].title} ({skill.mastery}% → {previewMastery}%)
                    </span>
                  ) : (
                    <span className="text-[#7b7266]">Оценка ещё не выставлена</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { DEFAULT_DISCIPLINES, type Dog, type DogSkill, type SkillCategory } from '../../types';
import { cn } from '../../utils/cn';

export interface MasterySummaryColumnsProps {
  skills?: DogSkill[];
  dog?: Dog;
  className?: string;
}

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Спорт',
  attention: 'Внимание',
  trust: 'Доверие',
  behavior: 'Поведение',
};

function getCategoryShortLabel(category: SkillCategory): string {
  const key = String(category);
  if (CATEGORY_SHORT_LABELS[key]) {
    return CATEGORY_SHORT_LABELS[key];
  }
  const matched = DEFAULT_DISCIPLINES.find((item) => item.id === key);
  return matched?.shortTitle ?? key;
}

const TickRuler: React.FC<{ value: number; accent?: boolean }> = ({ value, accent = false }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-2 w-full rounded-[3px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
      <div
        className={cn(
          'h-full w-full transition-transform duration-300',
          accent ? 'bg-[var(--accent-forest)]' : 'bg-[var(--text-secondary)]'
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
      <div className="pointer-events-none absolute inset-0 flex justify-between">
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <span
            key={tick}
            className={cn(
              'w-px h-full bg-[#221c15] dark:bg-[#f2ebe1]',
              tick === 0 || tick === 100 ? 'opacity-0' : 'opacity-20'
            )}
          />
        ))}
      </div>
    </div>
  );
};

const SkillMasteryRow: React.FC<{
  skill: DogSkill;
  isMastered: boolean;
}> = ({ skill, isMastered }) => {
  const deltaTo100 = Math.max(0, 100 - skill.mastery);
  return (
    <div className="py-3 first:pt-0 last:pb-0 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-medium text-[var(--text-primary)] truncate">
            {skill.name}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
            {getCategoryShortLabel(skill.category)}
          </span>
        </div>

        <div className="flex items-baseline gap-3 flex-shrink-0 font-mono text-xs tabular-nums">
          {skill.lastScore ? (
            <span className="text-[var(--text-muted)]">Оценка {skill.lastScore}/5</span>
          ) : (
            !isMastered && <span className="text-[var(--text-muted)]">Без оценки</span>
          )}
          {!isMastered && <span className="text-[var(--text-muted)]">+{deltaTo100}%</span>}
          <span
            className={cn(
              'font-medium w-10 text-right',
              isMastered ? 'text-[var(--accent-forest)]' : 'text-[var(--text-primary)]'
            )}
          >
            {skill.mastery}%
          </span>
        </div>
      </div>

      <TickRuler value={skill.mastery} accent={isMastered} />
    </div>
  );
};

export const MasterySummaryColumns: React.FC<MasterySummaryColumnsProps> = ({
  skills: skillsProp,
  dog,
  className,
}) => {
  const skills = skillsProp ?? dog?.skills ?? [];

  const masteredSkills = skills
    .filter((s) => s.mastery >= 90)
    .sort((a, b) => b.mastery - a.mastery || a.name.localeCompare(b.name, 'ru'));

  const needsWorkSkills = skills
    .filter((s) => s.mastery < 90)
    .sort((a, b) => a.mastery - b.mastery || a.name.localeCompare(b.name, 'ru'));

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-5 text-[var(--text-primary)]', className)}>
      {/* Column 1: Освоено и скорректировано (90–100%) */}
      <div className="bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-subtle)] p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Освоено и скорректировано (90–100%)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Стабильное выполнение норматива при раздражителях
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-[var(--accent-forest)]">
            {masteredSkills.length}
          </span>
        </div>

        {masteredSkills.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)]">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Пока нет навыков с освоением от 90%
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
              Дисциплины переместятся в этот список после достижения порога 90%
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {masteredSkills.map((skill) => (
              <SkillMasteryRow key={skill.id} skill={skill} isMastered />
            ))}
          </div>
        )}
      </div>

      {/* Column 2: В работе (<90%) */}
      <div className="bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-subtle)] p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              В работе (&lt;90%)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Дисциплины на этапе закрепления и коррекции
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-[var(--text-secondary)]">
            {needsWorkSkills.length}
          </span>
        </div>

        {needsWorkSkills.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)]">
            <p className="text-xs font-medium text-[var(--text-primary)]">
              Все навыки освоены на уровне 90–100%
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
              Текущих задолженностей по подключённым дисциплинам нет
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {needsWorkSkills.map((skill) => (
              <SkillMasteryRow key={skill.id} skill={skill} isMastered={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

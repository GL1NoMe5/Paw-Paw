import React from 'react';
import type { Dog, DogSkill } from '../../types';
import { cn } from '../../utils/cn';

export interface MasterySummaryColumnsProps {
  skills?: DogSkill[];
  dog?: Dog;
  className?: string;
}

const TickRuler: React.FC<{ value: number; accent?: boolean }> = ({ value, accent = false }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-2 w-full rounded-[3px] bg-[#efe9df] border border-[#1f1b16]/10 overflow-hidden">
      <div
        className={cn(
          'h-full w-full transition-transform duration-300',
          accent ? 'bg-[#1f5c3a]' : 'bg-[#5e554a]'
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
      <div className="pointer-events-none absolute inset-0 flex justify-between">
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <span
            key={tick}
            className={cn(
              'w-px h-full bg-[#1f1b16]',
              tick === 0 || tick === 100 ? 'opacity-0' : 'opacity-20'
            )}
          />
        ))}
      </div>
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
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-5 text-[#1f1b16]', className)}>
      {/* Column 1: Освоено и скорректировано (90–100%) */}
      <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1f1b16]/10">
          <div>
            <h3 className="text-sm font-medium text-[#1f1b16]">
              Освоено и скорректировано (90–100%)
            </h3>
            <p className="text-xs text-[#7b7266] mt-0.5">
              Стабильное выполнение норматива при раздражителях
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-[#1f5c3a]">
            {masteredSkills.length}
          </span>
        </div>

        {masteredSkills.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-[#1f1b16]/10 bg-[#efe9df]/40">
            <p className="text-xs font-medium text-[#5e554a]">
              Пока нет навыков с освоением от 90%
            </p>
            <p className="text-xs text-[#7b7266] mt-1 max-w-xs mx-auto">
              Дисциплины переместятся в этот список после достижения порога 90%
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f1b16]/10">
            {masteredSkills.map((skill) => (
              <div key={skill.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xs font-medium text-[#1f1b16] truncate">
                      {skill.name}
                    </span>
                    <span className="text-[11px] text-[#7b7266] flex-shrink-0">
                      {skill.category === 'okd' ? 'ОКД' : 'Поведение'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 flex-shrink-0 font-mono text-xs tabular-nums">
                    {skill.lastScore && (
                      <span className="text-[#7b7266]">Оценка {skill.lastScore}/5</span>
                    )}
                    <span className="font-medium text-[#1f5c3a] w-10 text-right">
                      {skill.mastery}%
                    </span>
                  </div>
                </div>

                <TickRuler value={skill.mastery} accent />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column 2: В работе (<90%) */}
      <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1f1b16]/10">
          <div>
            <h3 className="text-sm font-medium text-[#1f1b16]">
              В работе (&lt;90%)
            </h3>
            <p className="text-xs text-[#7b7266] mt-0.5">
              Дисциплины на этапе закрепления и коррекции
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-[#5e554a]">
            {needsWorkSkills.length}
          </span>
        </div>

        {needsWorkSkills.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-[#1f1b16]/10 bg-[#efe9df]/40">
            <p className="text-xs font-medium text-[#1f1b16]">
              Все навыки освоены на уровне 90–100%
            </p>
            <p className="text-xs text-[#7b7266] mt-1 max-w-xs mx-auto">
              Текущих задолженностей по курсу ОКД и поведению нет
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f1b16]/10">
            {needsWorkSkills.map((skill) => {
              const deltaTo100 = 100 - skill.mastery;
              return (
                <div key={skill.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-xs font-medium text-[#1f1b16] truncate">
                        {skill.name}
                      </span>
                      <span className="text-[11px] text-[#7b7266] flex-shrink-0">
                        {skill.category === 'okd' ? 'ОКД' : 'Поведение'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 flex-shrink-0 font-mono text-xs tabular-nums">
                      {skill.lastScore ? (
                        <span className="text-[#7b7266]">Оценка {skill.lastScore}/5</span>
                      ) : (
                        <span className="text-[#7b7266]">Без оценки</span>
                      )}
                      <span className="text-[#7b7266]">+{deltaTo100}%</span>
                      <span className="font-medium text-[#1f1b16] w-10 text-right">
                        {skill.mastery}%
                      </span>
                    </div>
                  </div>

                  <TickRuler value={skill.mastery} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

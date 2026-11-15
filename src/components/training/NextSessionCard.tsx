import React from 'react';
import type { NextSessionPlan } from '../../types';
import { DISTRACTION_LABELS } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface NextSessionCardProps {
  plan: NextSessionPlan;
  className?: string;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = ({ plan, className }) => {
  const distractionInfo = DISTRACTION_LABELS[plan.suggestedDistractionTarget] || {
    label: plan.suggestedDistractionTarget,
    multiplier: 1.0,
    description: 'Стандартные условия',
  };

  return (
    <section className={cn('px-2 pt-2 space-y-3.5 text-[var(--text-primary)]', className)}>
      <div className="flex items-baseline justify-between border-b border-[var(--border-hairline)] pb-2.5">
        <h4 className="font-serif text-[20px] leading-tight text-[var(--text-primary)]">
          План следующего урока
        </h4>
        <span className="text-[12px] text-[var(--text-secondary)]">
          {distractionInfo.label} · <span className="font-mono tabular-nums">{distractionInfo.multiplier}x</span>
        </span>
      </div>

      {/* Priority focus line */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
        <span className="text-[var(--text-muted)]">Фокус:</span>
        <span className="font-medium text-[var(--text-primary)]">
          {plan.prioritySkills.join(', ')}
        </span>
      </div>

      {/* Challenges list without boxes */}
      <div className="space-y-2">
        {plan.suggestedChallenges.map((challenge, idx) => (
          <div key={idx} className="flex items-baseline gap-2.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)] flex-shrink-0">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span>{challenge}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

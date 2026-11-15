import React, { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import type {
  Dog,
  DistractionLevel,
  GeneratedHomework,
  NextSessionPlan,
  SkillScoreRecord,
} from '../../types';
import { formatReportForClipboard } from '../../utils/homeworkGenerator';
import { cn } from '../../utils/cn';

export interface HomeworkCardProps {
  dog: Dog;
  session: {
    date: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    scores: SkillScoreRecord[];
    homework: GeneratedHomework;
    nextSessionPlan: NextSessionPlan;
    timerData?: {
      stayDurationSeconds?: number;
    };
  };
  className?: string;
}

function cleanUiCopy(text: string): string {
  return text.replace(/^[^\p{L}\p{N}«"(\d]+/u, '').replace(/!+/g, '.');
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({ dog, session, className }) => {
  const [copied, setCopied] = useState(false);
  const { homework } = session;

  const handleCopyReport = async () => {
    try {
      const text = formatReportForClipboard(dog, session);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Памятка скопирована для отправки в Telegram');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Не удалось скопировать памятку');
    }
  };

  return (
    <section className={cn('craft-note p-6 space-y-5 text-[#221c15]', className)}>
      {/* Craft Handmade Note Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#221c15]/[0.07]">
        <div>
          <h3 className="font-serif text-[24px] leading-tight text-[#221c15]">
            Домашняя тетрадь
          </h3>
          <p className="text-[13px] text-[#655b4e] mt-1">
            {homework.dailyPlanSummary}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyReport}
          className={cn(
            'h-8 px-3 rounded-[9px] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0',
            copied
              ? 'bg-[#286144] text-[#fffcf8]'
              : 'bg-[#221c15] hover:bg-[#382f24] text-[#fffcf8]'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5 stroke-[1.6]" />
              <span>Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 stroke-[1.6]" />
              <span>В Telegram</span>
            </>
          )}
        </button>
      </div>

      {/* Clean Editorial Exercise Paragraphs (no nested boxes) */}
      {homework.exercises.length === 0 ? (
        <p className="text-[13px] text-[#655b4e] leading-relaxed">
          Все основные нормативы усвоены стабильно. Поддерживайте бытовой контакт на обычных прогулках.
        </p>
      ) : (
        <div className="divide-y divide-[#221c15]/[0.07]">
          {homework.exercises.map((exercise, idx) => (
            <div
              key={`${exercise.skillId}_${idx}`}
              className="py-3.5 first:pt-0 last:pb-0 space-y-1.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="font-mono tabular-nums text-[12px] text-[#94897a]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] font-medium text-[#221c15]">
                    {exercise.skillName}
                  </span>
                </div>

                <span className="font-mono tabular-nums text-[12px] text-[#655b4e] flex-shrink-0">
                  {exercise.recommendedSets}
                </span>
              </div>

              <p className="text-[13px] text-[#655b4e] leading-relaxed pl-6">
                {cleanUiCopy(exercise.instruction)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Calm Finisher Line */}
      {homework.positiveFinisher && (
        <div className="pt-4 border-t border-[#221c15]/[0.07] space-y-1">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-[#286144] font-medium">
              Завершать каждый подход
            </span>
            <span className="font-medium text-[#221c15]">
              «{homework.positiveFinisher.skillName}»
            </span>
          </div>
          <p className="text-[12px] text-[#655b4e] leading-relaxed">
            {cleanUiCopy(homework.positiveFinisher.instruction)}
          </p>
        </div>
      )}
    </section>
  );
};

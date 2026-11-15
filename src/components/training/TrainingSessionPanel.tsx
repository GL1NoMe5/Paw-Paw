import React, { useState } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check } from 'lucide-react';
import type {
  Dog,
  DistractionLevel,
  MotivationType,
  SkillScoreRecord,
  TrainingSession,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { formatDogAgeRussian, DISTRACTION_LABELS } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { StayStopwatch } from './StayStopwatch';
import { RapidScoringGrid } from './RapidScoringGrid';
import { HomeworkCard } from './HomeworkCard';
import { NextSessionCard } from './NextSessionCard';

export interface TrainingSessionPanelProps {
  dog: Dog;
  onClose: () => void;
  onSessionCompleted?: (session: TrainingSession) => void;
  className?: string;
}

const DURATION_PRESETS = [15, 30, 45, 60] as const;

const DISTRACTION_KEYS: DistractionLevel[] = ['home', 'quiet_yard', 'city_street', 'dog_park'];

const MOTIVATION_LABELS: Record<MotivationType, string> = {
  food: 'Пищевая',
  play: 'Игровая',
  social: 'Социальная',
  mixed: 'Смешанная',
};

export const TrainingSessionPanel: React.FC<TrainingSessionPanelProps> = ({
  dog,
  onClose,
  onSessionCompleted,
  className,
}) => {
  const createSession = useDogStore((s) => s.createSession);

  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const imgError = Boolean(dog.avatar && failedAvatar === dog.avatar);

  // Form State
  const [durationMinutes, setDurationMinutes] = useState<number>(dog.dailyTrainingTime || 30);
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>('quiet_yard');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [practicedSkills, setPracticedSkills] = useState<Set<string>>(new Set());
  const [staySeconds, setStaySeconds] = useState<number>(0);
  const [trainerNotes, setTrainerNotes] = useState<string>('');

  // Completed Session State
  const [completedSession, setCompletedSession] = useState<TrainingSession | null>(null);

  const handleScoreChange = (skillId: string, score: number) => {
    setScores((prev) => ({ ...prev, [skillId]: score }));
  };

  const handleTogglePracticed = (skillId: string) => {
    setPracticedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleSetAllPracticed = (practiced: boolean) => {
    if (practiced) {
      setPracticedSkills(new Set(dog.skills.map((s) => s.id)));
    } else {
      setPracticedSkills(new Set());
    }
  };

  const handleExit = () => {
    const hasUnsavedData =
      Object.keys(scores).length > 0 || staySeconds > 0 || trainerNotes.trim() !== '';
    if (hasUnsavedData && !completedSession) {
      if (
        window.confirm(
          'Выйти без сохранения текущей тренировки? Введённые оценки будут потеряны.'
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSaveSession = () => {
    const scoredIds = Object.keys(scores);
    if (scoredIds.length === 0) {
      toast.error('Необходимо оценить хотя бы один навык', {
        description: 'Выберите дисциплину и выставьте оценку от 1 до 5 перед сохранением',
      });
      return;
    }

    const scoreRecords: SkillScoreRecord[] = scoredIds.map((skillId) => {
      const skill = dog.skills.find((s) => s.id === skillId);
      return {
        skillId,
        skillName: skill?.name || skillId,
        category: skill?.category || 'okd',
        score: scores[skillId],
      };
    });

    try {
      const savedSession = createSession({
        dogId: dog.id,
        durationMinutes,
        distractionLevel,
        scores: scoreRecords,
        timerStaySeconds: staySeconds > 0 ? staySeconds : undefined,
        trainerNotes: trainerNotes.trim(),
      });

      if (
        savedSession.overallIndexSnapshot >= 96 ||
        savedSession.okdIndexSnapshot >= 96
      ) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // Ignore confetti errors in headless environments
        }
      }

      setCompletedSession(savedSession);
      onSessionCompleted?.(savedSession);
      toast.success('Занятие сохранено в журнале', {
        description: `Сформировано домашнее задание для ${dog.name}`,
      });
    } catch {
      toast.error('Не удалось сохранить занятие');
    }
  };

  const showAvatarImg = Boolean(dog.avatar) && !imgError;
  const monogram = dog.name.slice(0, 2).toUpperCase();

  return (
    <div className={cn('space-y-5 pb-16 max-w-5xl mx-auto', className)}>
      {/* 1. Archival Session Header */}
      <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleExit}
            className="size-9 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] flex items-center justify-center transition-colors flex-shrink-0"
            title="Назад к карточке собаки"
            aria-label="Назад к карточке собаки"
          >
            <ArrowLeft className="size-4 stroke-[1.5]" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-lg overflow-hidden border border-[#1f1b16]/10 bg-[#efe9df] flex-shrink-0 flex items-center justify-center">
              {showAvatarImg ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setFailedAvatar(dog.avatar)}
                />
              ) : (
                <span className="font-mono text-xs font-medium text-[#5e554a] select-none">
                  {monogram}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="font-serif text-xl font-medium text-[#1f1b16]">
                  Протокол занятия: {dog.name}
                </h1>
                <span className="text-xs text-[#7b7266]">
                  {dog.breed} · <span className="font-mono tabular-nums">{formatDogAgeRussian(dog.birthDate)}</span>
                </span>
              </div>
              <div className="text-xs text-[#5e554a] flex items-center gap-2 mt-0.5 flex-wrap">
                <span>
                  Мотивация:{' '}
                  <span className="text-[#1f1b16] font-medium">
                    {MOTIVATION_LABELS[dog.motivationType] || dog.motivationType}
                  </span>
                </span>
                <span className="text-[#1f1b16]/20">•</span>
                <span>
                  Дневной норматив:{' '}
                  <span className="font-mono tabular-nums text-[#1f1b16] font-medium">
                    {dog.dailyTrainingTime} мин/день
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {completedSession ? (
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Check className="size-4 stroke-[1.5]" />
              <span>Вернуться к досье</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExit}
                className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] text-xs font-medium inline-flex items-center transition-colors"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-2 transition-colors"
              >
                <span>Завершить и сохранить занятие</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Completed Session Summary + Homework & Next Session Plan */}
      {completedSession ? (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-[#fdfbf7] border border-[#1f1b16]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[#1f1b16]">
                Протокол занятия внесён в картотеку
              </div>
              <div className="text-xs text-[#5e554a] mt-1 flex items-center gap-3 flex-wrap">
                <span>
                  Общий индекс подготовки:{' '}
                  <span className="font-mono tabular-nums font-medium text-[#1f5c3a]">
                    {completedSession.overallIndexSnapshot}%
                  </span>
                </span>
                <span className="text-[#1f1b16]/20">•</span>
                <span>
                  Курс ОКД:{' '}
                  <span className="font-mono tabular-nums font-medium text-[#1f1b16]">
                    {completedSession.okdIndexSnapshot}%
                  </span>
                </span>
                {completedSession.timerData?.stayDurationSeconds ? (
                  <>
                    <span className="text-[#1f1b16]/20">•</span>
                    <span>
                      Выдержка:{' '}
                      <span className="font-mono tabular-nums font-medium text-[#1f1b16]">
                        {completedSession.timerData.stayDurationSeconds} с
                      </span>
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/10 bg-[#efe9df] hover:bg-[#e5dec8] text-[#1f1b16] text-xs font-medium transition-colors self-start sm:self-center"
            >
              Открыть досье
            </button>
          </div>

          <HomeworkCard dog={dog} session={completedSession} />
          <NextSessionCard plan={completedSession.nextSessionPlan} />
        </div>
      ) : (
        /* Active Session Execution View */
        <div className="space-y-5">
          {/* 2. Compact Single-Bar Session Parameters */}
          <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Duration Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#5e554a] mr-1">Длительность:</span>
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={cn(
                    'h-8 px-3 rounded-[6px] text-xs font-mono tabular-nums transition-colors border',
                    durationMinutes === mins
                      ? 'bg-[#efe9df] border-[#1f1b16]/25 text-[#1f1b16] font-medium'
                      : 'bg-[#fdfbf7] border-[#1f1b16]/10 hover:bg-[#efe9df]/50 text-[#5e554a]'
                  )}
                >
                  {mins} мин
                </button>
              ))}
              <div className="inline-flex items-center gap-1.5 ml-1">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 15))
                  }
                  aria-label="Своя длительность в минутах"
                  className="h-8 w-16 px-2 rounded-[6px] border border-[#1f1b16]/15 bg-[#efe9df]/50 text-xs font-mono tabular-nums font-medium text-[#1f1b16] focus:outline-hidden focus:border-[#1f1b16]"
                />
                <span className="text-xs text-[#7b7266]">мин</span>
              </div>
            </div>

            <div className="hidden lg:block h-6 w-px bg-[#1f1b16]/10" />

            {/* Distraction Environment Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-[#5e554a] mr-1">Среда:</span>
              {DISTRACTION_KEYS.map((key) => {
                const info = DISTRACTION_LABELS[key];
                const isSelected = distractionLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDistractionLevel(key)}
                    title={info.description}
                    className={cn(
                      'h-8 px-2.5 rounded-[6px] text-xs transition-colors border inline-flex items-center gap-1.5',
                      isSelected
                        ? 'bg-[#efe9df] border-[#1f1b16]/25 text-[#1f1b16] font-medium'
                        : 'bg-[#fdfbf7] border-[#1f1b16]/10 hover:bg-[#efe9df]/50 text-[#5e554a]'
                    )}
                  >
                    <span>{info.label}</span>
                    <span className="font-mono tabular-nums text-[11px] text-[#7b7266]">
                      {info.multiplier}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Stay Stopwatch */}
          <StayStopwatch onSecondsChange={(sec) => setStaySeconds(sec)} />

          {/* 4. Rapid Scoring Grid */}
          <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-[#1f1b16]">
                  Ведомость оценки нормативов
                </h2>
                <p className="text-xs text-[#7b7266] mt-0.5">
                  Используйте клавиши 1–5 или кликайте по клавишам в строке дисциплины
                </p>
              </div>

              {Object.keys(scores).length === 0 && (
                <span className="text-xs text-[#b93829]">
                  Оцените минимум 1 дисциплину для сохранения
                </span>
              )}
            </div>

            <RapidScoringGrid
              skills={dog.skills}
              scores={scores}
              practicedSkills={practicedSkills}
              onScoreChange={handleScoreChange}
              onTogglePracticed={handleTogglePracticed}
              onSetAllPracticed={handleSetAllPracticed}
              distractionLevel={distractionLevel}
            />
          </div>

          {/* 5. Trainer Notes */}
          <div className="bg-[#fdfbf7] rounded-xl border border-[#1f1b16]/10 p-5 space-y-2.5">
            <label
              htmlFor="trainer-session-notes"
              className="block text-sm font-medium text-[#1f1b16]"
            >
              Заметки кинолога по занятию
            </label>
            <textarea
              id="trainer-session-notes"
              rows={3}
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              placeholder="Особенности концентрации, реакция на фоновые раздражители, комментарии для владельца"
              className="w-full rounded-lg border border-[#1f1b16]/10 bg-[#efe9df]/40 p-3 text-xs text-[#1f1b16] placeholder-[#7b7266] focus:outline-hidden focus:border-[#1f1b16]/30 transition-colors"
            />
          </div>

          {/* 6. Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#fdfbf7] border border-[#1f1b16]/10">
            <div className="text-xs text-[#5e554a] flex items-center gap-3">
              <span>
                Оценено дисциплин:{' '}
                <span className="font-mono tabular-nums font-medium text-[#1f1b16]">
                  {Object.keys(scores).length}
                </span>
              </span>
              {staySeconds > 0 && (
                <>
                  <span className="text-[#1f1b16]/20">•</span>
                  <span>
                    Выдержка:{' '}
                    <span className="font-mono tabular-nums font-medium text-[#1f1b16]">
                      {staySeconds} с
                    </span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleExit}
                className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] text-xs font-medium transition-colors"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-2 transition-colors"
              >
                <span>Завершить и сохранить</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

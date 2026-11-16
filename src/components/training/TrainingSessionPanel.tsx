import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Check,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Calendar,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  DisciplineCommandTemplate,
  Dog,
  DogSkill,
  DistractionLevel,
  MotivationType,
  SkillCategory,
  SkillScoreRecord,
  TrainingSession,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import {
  formatDogAgeRussian,
  formatDurationRussian,
  formatSessionDateRussian,
  DISTRACTION_LABELS,
  SCORE_COMPLETION_LABELS,
} from '../../utils/calculations';
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

const STOPWATCH_DURATION_PRESETS = [15, 30, 45, 60] as const;

const MANUAL_DURATION_PRESETS = [
  { label: '30 мин', minutes: 30 },
  { label: '45 мин', minutes: 45 },
  { label: '1 час', minutes: 60 },
  { label: '1 час 30 мин', minutes: 90 },
  { label: '2 часа', minutes: 120 },
] as const;

const DISTRACTION_KEYS: DistractionLevel[] = ['home', 'quiet_yard', 'city_street', 'dog_park'];

const MOTIVATION_LABELS: Record<MotivationType, string> = {
  food: 'Пищевая',
  play: 'Игровая',
  social: 'Социальная',
  mixed: 'Смешанная',
};

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Спорт',
  attention: 'Внимание',
  trust: 'Доверие',
  behavior: 'Коррекция',
};

function getTodayLocalDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSessionDateIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  if (dateStr === getTodayLocalDateInput()) {
    return new Date().toISOString();
  }
  const [y, m, d] = dateStr.split('-').map((part) => parseInt(part, 10));
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

function formatElapsedClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const TrainingSessionPanel: React.FC<TrainingSessionPanelProps> = ({
  dog,
  onClose,
  onSessionCompleted,
  className,
}) => {
  const createSession = useDogStore((s) => s.createSession);
  const sessions = useDogStore((s) => s.sessions);
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);

  const dogSessionsCount = useMemo(
    () => sessions.filter((s) => s.dogId === dog.id).length,
    [sessions, dog.id]
  );

  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const imgError = Boolean(dog.avatar && failedAvatar === dog.avatar);

  // Mode & Date/Duration State
  const initialDuration = dog.dailyTrainingTime || 30;
  const [timeEntryMode, setTimeEntryMode] = useState<'stopwatch' | 'manual'>('stopwatch');
  const [manualDate, setManualDate] = useState<string>(() => getTodayLocalDateInput());
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDuration);
  const [hoursDraft, setHoursDraft] = useState<string>(
    String(Math.floor(initialDuration / 60))
  );
  const [minsDraft, setMinsDraft] = useState<string>(
    String(initialDuration % 60).padStart(2, '0')
  );

  // Overall Workout Live Stopwatch State
  const [sessionElapsedMs, setSessionElapsedMs] = useState<number>(0);
  const [isSessionTimerRunning, setIsSessionTimerRunning] = useState<boolean>(false);
  const sessionIntervalRef = useRef<number | null>(null);
  const sessionLastTickRef = useRef<number>(0);

  // Scoring & Commands State
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>('quiet_yard');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [practicedSkills, setPracticedSkills] = useState<Set<string>>(new Set());
  const [addedTemplates, setAddedTemplates] = useState<DisciplineCommandTemplate[]>([]);
  const [isCommandPickerOpen, setIsCommandPickerOpen] = useState<boolean>(false);
  const [pickerCategory, setPickerCategory] = useState<SkillCategory>(
    disciplines[0]?.id ?? 'okd'
  );
  const [gridCategory, setGridCategory] = useState<'all' | SkillCategory>('all');
  const [focusedSkillId, setFocusedSkillId] = useState<string | null>(null);

  const [staySeconds, setStaySeconds] = useState<number>(0);
  const [trainerNotes, setTrainerNotes] = useState<string>('');
  const [completedSession, setCompletedSession] = useState<TrainingSession | null>(null);
  const [prevDogId, setPrevDogId] = useState<string>(dog.id);

  if (dog.id !== prevDogId) {
    const nextDuration = dog.dailyTrainingTime || 30;
    setPrevDogId(dog.id);
    setTimeEntryMode('stopwatch');
    setManualDate(getTodayLocalDateInput());
    setDurationMinutes(nextDuration);
    setHoursDraft(String(Math.floor(nextDuration / 60)));
    setMinsDraft(String(nextDuration % 60).padStart(2, '0'));
    setSessionElapsedMs(0);
    setIsSessionTimerRunning(false);
    setDistractionLevel('quiet_yard');
    setScores({});
    setPracticedSkills(new Set());
    setAddedTemplates([]);
    setIsCommandPickerOpen(false);
    setGridCategory('all');
    setFocusedSkillId(null);
    setStaySeconds(0);
    setTrainerNotes('');
    setCompletedSession(null);
  }

  const sessionNumber = completedSession ? dogSessionsCount : dogSessionsCount + 1;

  // Live session stopwatch ticker
  useEffect(() => {
    if (isSessionTimerRunning && timeEntryMode === 'stopwatch') {
      sessionLastTickRef.current = Date.now();
      sessionIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - sessionLastTickRef.current;
        sessionLastTickRef.current = now;
        setSessionElapsedMs((prev) => prev + delta);
      }, 250);
    } else if (sessionIntervalRef.current !== null) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }

    return () => {
      if (sessionIntervalRef.current !== null) {
        clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
    };
  }, [isSessionTimerRunning, timeEntryMode]);

  const sessionElapsedSeconds = Math.floor(sessionElapsedMs / 1000);
  const syncedTimerMinutes =
    sessionElapsedSeconds > 0 ? Math.max(1, Math.round(sessionElapsedSeconds / 60)) : 0;

  const syncDurationDrafts = (totalMinutes: number) => {
    const safe = Math.max(0, Math.round(totalMinutes));
    setHoursDraft(String(Math.floor(safe / 60)));
    setMinsDraft(String(safe % 60).padStart(2, '0'));
  };

  const applyDurationMinutes = (nextMinutes: number) => {
    const safe = Math.max(1, Math.min(720, Math.round(nextMinutes)));
    setDurationMinutes(safe);
    syncDurationDrafts(safe);
  };

  const handleTimeEntryModeSwitch = (nextMode: 'stopwatch' | 'manual') => {
    if (nextMode === timeEntryMode) return;
    if (nextMode === 'manual') {
      setIsSessionTimerRunning(false);
      syncDurationDrafts(durationMinutes);
    }
    setTimeEntryMode(nextMode);
  };

  const handleSyncStopwatchToDuration = () => {
    if (sessionElapsedSeconds <= 0) return;
    const mins = Math.max(1, Math.round(sessionElapsedSeconds / 60));
    applyDurationMinutes(mins);
    toast.success(`Длительность обновлена: ${formatDurationRussian(mins)}`);
  };

  const handleResetSessionTimer = () => {
    setIsSessionTimerRunning(false);
    setSessionElapsedMs(0);
  };

  const handleHoursDraftChange = (raw: string) => {
    setHoursDraft(raw);
    const h = Math.max(0, Math.min(12, parseInt(raw, 10) || 0));
    const m = Math.max(0, Math.min(599, parseInt(minsDraft, 10) || 0));
    setDurationMinutes(h * 60 + m);
  };

  const handleMinsDraftChange = (raw: string) => {
    setMinsDraft(raw);
    const h = Math.max(0, Math.min(12, parseInt(hoursDraft, 10) || 0));
    const m = Math.max(0, Math.min(599, parseInt(raw, 10) || 0));
    setDurationMinutes(h * 60 + m);
  };

  const handleDurationDraftBlur = () => {
    const safe = Math.max(1, durationMinutes);
    setDurationMinutes(safe);
    syncDurationDrafts(safe);
  };

  // Combine dog's existing skills with any commands added from discipline sets for this workout
  const sessionSkills: DogSkill[] = useMemo(() => {
    const existingIds = new Set(dog.skills.map((s) => s.id));
    const extras: DogSkill[] = addedTemplates
      .filter((t) => !existingIds.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        mastery: 0,
        description: t.description,
        isCustom: t.isCustom,
      }));
    return [...dog.skills, ...extras];
  }, [dog.skills, addedTemplates]);

  const handleScoreChange = (skillId: string, score: number) => {
    setScores((prev) => ({ ...prev, [skillId]: score }));
  };

  const handleTogglePracticed = (skillId: string) => {
    const currentlyPracticed = practicedSkills.has(skillId);
    setPracticedSkills((prev) => {
      const next = new Set(prev);
      if (currentlyPracticed) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });

    if (currentlyPracticed) {
      setScores((prev) => {
        if (prev[skillId] === undefined) return prev;
        const next = { ...prev };
        delete next[skillId];
        return next;
      });
    }
  };

  const handleSetAllPracticed = (practiced: boolean) => {
    if (practiced) {
      setPracticedSkills(new Set(sessionSkills.map((s) => s.id)));
    } else {
      setPracticedSkills(new Set());
      setScores({});
    }
  };

  const handlePickCommandFromSet = (cmd: DisciplineCommandTemplate) => {
    const existingByIdOrName = sessionSkills.find(
      (s) => s.id === cmd.id || s.name.trim().toLowerCase() === cmd.name.trim().toLowerCase()
    );

    if (existingByIdOrName) {
      const isAlreadyInWorkout =
        practicedSkills.has(existingByIdOrName.id) || scores[existingByIdOrName.id] !== undefined;

      if (isAlreadyInWorkout) {
        setPracticedSkills((prev) => {
          const next = new Set(prev);
          next.delete(existingByIdOrName.id);
          return next;
        });
        setScores((prev) => {
          if (prev[existingByIdOrName.id] === undefined) return prev;
          const next = { ...prev };
          delete next[existingByIdOrName.id];
          return next;
        });
        setAddedTemplates((prev) => prev.filter((t) => t.id !== existingByIdOrName.id));
      } else {
        setPracticedSkills((prev) => new Set(prev).add(existingByIdOrName.id));
        if (gridCategory !== 'all' && gridCategory !== existingByIdOrName.category) {
          setGridCategory('all');
        }
        setFocusedSkillId(existingByIdOrName.id);
      }
      return;
    }

    setAddedTemplates((prev) => [...prev, cmd]);
    setPracticedSkills((prev) => new Set(prev).add(cmd.id));
    if (gridCategory !== 'all' && gridCategory !== cmd.category) {
      setGridCategory(cmd.category);
    }
    setFocusedSkillId(cmd.id);
  };

  const handleRemoveSelectedSkill = (skillId: string) => {
    setPracticedSkills((prev) => {
      const next = new Set(prev);
      next.delete(skillId);
      return next;
    });
    setScores((prev) => {
      if (prev[skillId] === undefined) return prev;
      const next = { ...prev };
      delete next[skillId];
      return next;
    });
    setAddedTemplates((prev) => prev.filter((t) => t.id !== skillId));
  };

  const selectedWorkoutSkills = useMemo(() => {
    const activeIds = new Set<string>([...practicedSkills, ...Object.keys(scores)]);
    return sessionSkills.filter((s) => activeIds.has(s.id));
  }, [sessionSkills, practicedSkills, scores]);

  const handleExit = () => {
    const hasUnsavedData =
      Object.keys(scores).length > 0 ||
      practicedSkills.size > 0 ||
      addedTemplates.length > 0 ||
      staySeconds > 0 ||
      sessionElapsedMs > 0 ||
      trainerNotes.trim() !== '';
    if (hasUnsavedData && !completedSession) {
      if (
        window.confirm(
          'Выйти без сохранения текущей тренировки? Введённые оценки и замеры будут потеряны.'
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
      toast.error('Необходимо оценить хотя бы одну команду', {
        description: 'Выберите команды и выставьте степень выполнения от 1 до 5 перед сохранением',
      });
      return;
    }

    const unscoredAdded = addedTemplates.filter((t) => scores[t.id] === undefined);
    if (unscoredAdded.length > 0) {
      const firstUnscored = unscoredAdded[0];
      if (gridCategory !== 'all' && gridCategory !== firstUnscored.category) {
        setGridCategory('all');
      }
      setFocusedSkillId(firstUnscored.id);
      toast.error('Выставьте оценку добавленным командам', {
        description: `Укажите степень выполнения (1–5) для: ${unscoredAdded
          .map((c) => c.name)
          .join(', ')}`,
      });
      return;
    }

    if (durationMinutes < 1) {
      toast.error('Укажите длительность тренировки', {
        description: 'Длительность занятия должна составлять минимум 1 минуту',
      });
      return;
    }

    setIsSessionTimerRunning(false);

    const scoreRecords: SkillScoreRecord[] = scoredIds.map((skillId) => {
      const skill = sessionSkills.find((s) => s.id === skillId);
      return {
        skillId,
        skillName: skill?.name || skillId,
        category: skill?.category || 'okd',
        score: scores[skillId],
      };
    });

    const sessionDate =
      timeEntryMode === 'manual' ? buildSessionDateIso(manualDate) : undefined;

    try {
      const savedSession = createSession({
        dogId: dog.id,
        durationMinutes: Math.max(1, Math.round(durationMinutes)),
        distractionLevel,
        scores: scoreRecords,
        timerStaySeconds: staySeconds > 0 ? staySeconds : undefined,
        trainerNotes: trainerNotes.trim(),
        date: sessionDate,
        timeEntryMode,
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
  const currentPickerCommands = disciplineCommands[String(pickerCategory)] ?? [];
  const manualDatePreview = formatSessionDateRussian(buildSessionDateIso(manualDate));

  return (
    <div className={cn('space-y-5 pb-16 max-w-5xl mx-auto text-[var(--text-primary)]', className)}>
      {/* 1. Archival Session Header */}
      <div className="bg-[var(--bg-sheet)] rounded-xl border border-[var(--border-subtle)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleExit}
            className="size-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] flex items-center justify-center transition-colors flex-shrink-0"
            title="Назад к карточке собаки"
            aria-label="Назад к карточке собаки"
          >
            <ArrowLeft className="size-4 stroke-[1.5]" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex-shrink-0 flex items-center justify-center">
              {showAvatarImg ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setFailedAvatar(dog.avatar)}
                />
              ) : (
                <span className="font-mono text-xs font-medium text-[var(--text-secondary)] select-none">
                  {monogram}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                  Тренировка №{sessionNumber}: {dog.name}
                </h1>
                <span className="text-xs text-[var(--text-muted)]">
                  {dog.breed} ·{' '}
                  <span className="font-mono tabular-nums">
                    {formatDogAgeRussian(dog.birthDate)}
                  </span>
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5 flex-wrap">
                <span>
                  Мотивация:{' '}
                  <span className="text-[var(--text-primary)] font-medium">
                    {MOTIVATION_LABELS[dog.motivationType] || dog.motivationType}
                  </span>
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span>
                  Дневной норматив:{' '}
                  <span className="font-mono tabular-nums text-[var(--text-primary)] font-medium">
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
              className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Check className="size-4 stroke-[1.5]" />
              <span>Вернуться к досье</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExit}
                className="h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium inline-flex items-center transition-colors"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
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
          <div className="p-5 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Тренировка №{sessionNumber} внесена в картотеку
                </span>
                <span className="px-2 py-0.5 rounded-[5px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-secondary)]">
                  {completedSession.timeEntryMode === 'manual' ? 'Вручную' : 'Секундомер'}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-3 flex-wrap">
                <span>
                  {formatSessionDateRussian(completedSession.date)} ·{' '}
                  <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                    {formatDurationRussian(completedSession.durationMinutes)}
                  </span>
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span>
                  Общий индекс:{' '}
                  <span className="font-mono tabular-nums font-medium text-[var(--accent-forest)]">
                    {completedSession.overallIndexSnapshot}%
                  </span>
                </span>
                {completedSession.okdIndexSnapshot > 0 && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      ОКД:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {completedSession.okdIndexSnapshot}%
                      </span>
                    </span>
                  </>
                )}
                {(completedSession.zksIndexSnapshot ?? 0) > 0 && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      ЗКС:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {completedSession.zksIndexSnapshot}%
                      </span>
                    </span>
                  </>
                )}
                {(completedSession.sportIndexSnapshot ?? 0) > 0 && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      Спорт:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {completedSession.sportIndexSnapshot}%
                      </span>
                    </span>
                  </>
                )}
                {(completedSession.attentionIndexSnapshot ?? 0) > 0 && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      Внимание:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {completedSession.attentionIndexSnapshot}%
                      </span>
                    </span>
                  </>
                )}
                {(completedSession.trustIndexSnapshot ?? 0) > 0 && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      Доверие:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {completedSession.trustIndexSnapshot}%
                      </span>
                    </span>
                  </>
                )}
                {completedSession.timerData?.stayDurationSeconds ? (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span>
                      Выдержка:{' '}
                      <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
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
              className="h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-xs font-medium transition-colors self-start sm:self-center flex-shrink-0"
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
          {/* 2. Session Parameters Card with Two Time Modes */}
          <div className="bg-[var(--bg-sheet)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-4">
            {/* Mode Switch Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  Параметры и время тренировки
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {timeEntryMode === 'stopwatch'
                    ? 'Засекайте общее время занятия и выдержку прямо на площадке'
                    : 'Внесите дату и длительность уже проведённой тренировки задним числом'}
                </p>
              </div>

              <div
                role="group"
                aria-label="Режим учёта времени тренировки"
                className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] p-1 self-start sm:self-auto"
              >
                <button
                  type="button"
                  onClick={() => handleTimeEntryModeSwitch('stopwatch')}
                  className={cn(
                    'h-8 px-3 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                    timeEntryMode === 'stopwatch'
                      ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Clock className="size-3.5 stroke-[1.6]" />
                  <span>Секундомер (идёт сейчас)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeEntryModeSwitch('manual')}
                  className={cn(
                    'h-8 px-3 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                    timeEntryMode === 'manual'
                      ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Calendar className="size-3.5 stroke-[1.6]" />
                  <span>Уже проведена (вбить время вручную)</span>
                </button>
              </div>
            </div>

            {timeEntryMode === 'stopwatch' ? (
              /* Mode A: Live Workout Timer + Duration Controls */
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--bg-note)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          Таймер общей тренировки
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-medium',
                            isSessionTimerRunning ? 'text-[var(--accent-forest)]' : 'text-[var(--text-muted)]'
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              isSessionTimerRunning ? 'bg-[var(--accent-forest)]' : 'bg-[var(--text-muted)]'
                            )}
                          />
                          {isSessionTimerRunning
                            ? 'Идёт'
                            : sessionElapsedSeconds > 0
                            ? 'Пауза'
                            : 'Готов'}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-2xl font-medium text-[var(--text-primary)] mt-0.5">
                        {formatElapsedClock(sessionElapsedSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSessionTimerRunning((prev) => !prev)}
                      className={cn(
                        'h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors',
                        isSessionTimerRunning
                          ? 'bg-[var(--bg-sheet)] border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                          : 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] hover:bg-[var(--btn-dark-hover)]'
                      )}
                    >
                      {isSessionTimerRunning ? (
                        <>
                          <Pause className="size-3.5 stroke-[1.6]" />
                          <span>Пауза</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 stroke-[1.6]" />
                          <span>{sessionElapsedSeconds > 0 ? 'Продолжить' : 'Старт'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSessionTimer}
                      disabled={sessionElapsedSeconds === 0 && !isSessionTimerRunning}
                      className="h-8 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="size-3.5 stroke-[1.5]" />
                      <span>Сброс</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncStopwatchToDuration}
                      disabled={sessionElapsedSeconds === 0}
                      className="h-8 px-3 rounded-lg border border-[#286144]/25 dark:border-[#58b482]/35 bg-[#286144]/10 dark:bg-[#58b482]/15 hover:bg-[#286144]/15 dark:hover:bg-[#58b482]/25 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--accent-forest)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Записать в длительность</span>
                      {syncedTimerMinutes > 0 && (
                        <span className="font-mono tabular-nums">
                          ({syncedTimerMinutes} мин)
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Editable Duration Presets + Custom Minutes */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">Длительность:</span>
                  {STOPWATCH_DURATION_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => applyDurationMinutes(mins)}
                      className={cn(
                        'h-8 px-3 rounded-[6px] text-xs font-mono tabular-nums transition-colors border',
                        durationMinutes === mins
                          ? 'bg-[var(--bg-active)] border-[var(--border-strong)] text-[var(--text-primary)] font-medium'
                          : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                      )}
                    >
                      {mins} мин
                    </button>
                  ))}
                  <div className="inline-flex items-center gap-1.5 ml-1">
                    <input
                      type="number"
                      min={1}
                      max={360}
                      value={durationMinutes || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setDurationMinutes(val);
                        syncDurationDrafts(val);
                      }}
                      onBlur={() => {
                        if (durationMinutes < 1) applyDurationMinutes(15);
                      }}
                      aria-label="Длительность тренировки в минутах"
                      className="h-8 w-16 px-2 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-note)] text-xs font-mono tabular-nums font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">
                      мин ({formatDurationRussian(durationMinutes)})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode B: Already Conducted — Date + Hours/Minutes + Quick Presets */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-1.5">
                  <label
                    htmlFor="manual-session-date"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Дата проведения
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      id="manual-session-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value || getTodayLocalDateInput())}
                      className="h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] text-xs font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                    <span className="text-xs text-[var(--text-secondary)] font-medium">{manualDatePreview}</span>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Длительность (часы и минуты)
                    </span>
                    <span className="text-xs font-mono tabular-nums text-[var(--accent-forest)] font-medium">
                      Итого: {formatDurationRussian(durationMinutes)} ({durationMinutes} мин)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={hoursDraft}
                        onChange={(e) => handleHoursDraftChange(e.target.value)}
                        onBlur={handleDurationDraftBlur}
                        aria-label="Часы длительности"
                        className="h-9 w-16 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] text-sm font-mono tabular-nums font-medium text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--border-strong)]"
                      />
                      <span>ч</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <input
                        type="number"
                        min={0}
                        max={599}
                        value={minsDraft}
                        onChange={(e) => handleMinsDraftChange(e.target.value)}
                        onBlur={handleDurationDraftBlur}
                        aria-label="Минуты длительности"
                        className="h-9 w-16 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] text-sm font-mono tabular-nums font-medium text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--border-strong)]"
                      />
                      <span>мин</span>
                    </label>

                    <div className="h-5 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />

                    <div className="flex flex-wrap items-center gap-1.5">
                      {MANUAL_DURATION_PRESETS.map((preset) => {
                        const isSelected = durationMinutes === preset.minutes;
                        return (
                          <button
                            key={preset.minutes}
                            type="button"
                            onClick={() => applyDurationMinutes(preset.minutes)}
                            className={cn(
                              'h-8 px-2.5 rounded-[6px] text-xs font-medium transition-colors border',
                              isSelected
                                ? 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                                : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                            )}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Distraction Environment Selector */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">Среда:</span>
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
                        ? 'bg-[var(--bg-active)] border-[var(--border-strong)] text-[var(--text-primary)] font-medium'
                        : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    )}
                  >
                    <span>{info.label}</span>
                    <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                      {info.multiplier}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Stay Stopwatch (Synced with Time Entry Mode + Standalone Toggle) */}
          <StayStopwatch
            key={dog.id}
            mode={timeEntryMode}
            onSecondsChange={(sec) => setStaySeconds(sec)}
          />

          {/* 4. Command Picker & Rapid Scoring Grid */}
          <div className="bg-[var(--bg-sheet)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  Ведомость оценки нормативов
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Выбирайте команды тренировки, добавляйте новые из наборов и выставляйте степень выполнения (1–5)
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {Object.keys(scores).length === 0 && (
                  <span className="text-xs text-[var(--accent-terracotta)]">
                    Оцените минимум 1 команду
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsCommandPickerOpen((prev) => !prev)}
                  className={cn(
                    'h-8 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                    isCommandPickerOpen
                      ? 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)]'
                      : 'bg-[var(--bg-sheet)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                  )}
                >
                  <Plus className="size-3.5 stroke-[1.6]" />
                  <span>Добавить команду из наборов дисциплин</span>
                  {isCommandPickerOpen ? (
                    <ChevronUp className="size-3.5 stroke-[1.5]" />
                  ) : (
                    <ChevronDown className="size-3.5 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Inline Command Picker Drawer */}
            {isCommandPickerOpen && (
              <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-note)] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--bg-sheet)] border border-[var(--border-subtle)]">
                    {disciplines.map((disc) => {
                      const cmdsCount = (disciplineCommands[String(disc.id)] ?? []).length;
                      const isActive = pickerCategory === disc.id;
                      return (
                        <button
                          key={String(disc.id)}
                          type="button"
                          onClick={() => setPickerCategory(disc.id)}
                          className={cn(
                            'h-7 px-2.5 rounded-[5px] text-xs transition-colors inline-flex items-center gap-1.5',
                            isActive
                              ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          )}
                        >
                          <span>{disc.shortTitle}</span>
                          <span
                            className={cn(
                              'font-mono tabular-nums text-[10px]',
                              isActive ? 'text-current opacity-75' : 'text-[var(--text-muted)]'
                            )}
                          >
                            {cmdsCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCommandPickerOpen(false)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] self-end sm:self-auto"
                  >
                    Свернуть набор
                  </button>
                </div>

                {currentPickerCommands.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-2">
                    В этом наборе пока нет команд. Вы можете настроить наборы команд на главной странице.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentPickerCommands.map((cmd) => {
                      const matchedSkill = sessionSkills.find(
                        (s) =>
                          s.id === cmd.id ||
                          s.name.trim().toLowerCase() === cmd.name.trim().toLowerCase()
                      );
                      const isInWorkout = Boolean(
                        matchedSkill &&
                          (practicedSkills.has(matchedSkill.id) ||
                            scores[matchedSkill.id] !== undefined)
                      );
                      const isOnDogOnly = Boolean(matchedSkill && !isInWorkout);

                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => handlePickCommandFromSet(cmd)}
                          className={cn(
                            'text-left p-2.5 rounded-lg border transition-colors flex items-start justify-between gap-2.5',
                            isInWorkout
                              ? 'bg-[#286144]/10 dark:bg-[#58b482]/15 border-[#286144]/30 dark:border-[#58b482]/40 text-[var(--text-primary)]'
                              : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                          )}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[var(--text-primary)]">
                              {cmd.name}
                            </div>
                            {cmd.description && (
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                                {cmd.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-[5px] text-[10px] font-medium flex-shrink-0 inline-flex items-center gap-1',
                              isInWorkout
                                ? 'bg-[#286144] dark:bg-[#58b482] text-[#fffcf8] dark:text-[#12100e]'
                                : isOnDogOnly
                                ? 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                                : 'bg-[var(--bg-note)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                            )}
                          >
                            {isInWorkout ? (
                              <>
                                <Check className="size-3 stroke-[2]" />
                                <span>В тренировке</span>
                              </>
                            ) : isOnDogOnly ? (
                              <span>+ В тренировку</span>
                            ) : (
                              <span>+ Добавить</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Workout Commands Chip Strip */}
            {selectedWorkoutSkills.length > 0 && (
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[var(--text-primary)]">
                    Команды в этой тренировке ({selectedWorkoutSkills.length})
                  </span>
                  <span className="text-[var(--text-muted)] font-mono tabular-nums text-[11px]">
                    Оценено: {Object.keys(scores).length} из {selectedWorkoutSkills.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedWorkoutSkills.map((skill) => {
                    const scoreVal = scores[skill.id];
                    const comp = scoreVal ? SCORE_COMPLETION_LABELS[scoreVal] : null;
                    const catShort =
                      SHORT_CATEGORY_LABELS[String(skill.category)] ?? String(skill.category);
                    return (
                      <div
                        key={skill.id}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-[6px] border pl-2.5 pr-1.5 py-1 text-xs',
                          comp
                            ? 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-sheet)] border-[#b06728]/35 dark:border-[#e19b56]/45 text-[var(--text-primary)]'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (gridCategory !== 'all' && gridCategory !== skill.category) {
                              setGridCategory('all');
                            }
                            setFocusedSkillId(skill.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-left"
                        >
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            {catShort}
                          </span>
                          <span className="font-medium">{skill.name}</span>
                          {comp ? (
                            <span className="font-mono tabular-nums text-[11px] text-[var(--accent-forest)] font-medium">
                              · {scoreVal} {comp.short} ({comp.percent}%)
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--accent-ochre)]">· оценка 1–5</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedSkill(skill.id)}
                          aria-label={`Убрать команду ${skill.name} из тренировки`}
                          className="size-4 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-colors"
                        >
                          <X className="size-3 stroke-[1.8]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <RapidScoringGrid
              skills={sessionSkills}
              scores={scores}
              practicedSkills={practicedSkills}
              onScoreChange={handleScoreChange}
              onTogglePracticed={handleTogglePracticed}
              onSetAllPracticed={handleSetAllPracticed}
              distractionLevel={distractionLevel}
              activeCategory={gridCategory}
              onActiveCategoryChange={setGridCategory}
              focusedSkillId={focusedSkillId}
              onFocusedSkillIdChange={setFocusedSkillId}
            />
          </div>

          {/* 5. Trainer Notes */}
          <div className="bg-[var(--bg-sheet)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-2.5">
            <label
              htmlFor="trainer-session-notes"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Заметки кинолога по занятию
            </label>
            <textarea
              id="trainer-session-notes"
              rows={3}
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              placeholder="Особенности концентрации, реакция на фоновые раздражители, комментарии для владельца"
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
            />
          </div>

          {/* 6. Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-3 flex-wrap">
              <span>
                Оценено команд:{' '}
                <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {Object.keys(scores).length}
                </span>
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>
                Длительность:{' '}
                <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {formatDurationRussian(durationMinutes)}
                </span>
              </span>
              {timeEntryMode === 'manual' && (
                <>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>
                    Дата:{' '}
                    <span className="font-medium text-[var(--text-primary)]">{manualDatePreview}</span>
                  </span>
                </>
              )}
              {staySeconds > 0 && (
                <>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>
                    Выдержка:{' '}
                    <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
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
                className="h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
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

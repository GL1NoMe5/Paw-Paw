import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpDown,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  FileText,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type {
  DisciplineCommandTemplate,
  DisciplineInfo,
  DistractionLevel,
  Dog,
  DogSkill,
  SkillCategory,
  SkillScoreRecord,
  TrainingSession,
} from '../../types';
import { DEFAULT_DISCIPLINES } from '../../types';
import {
  DISTRACTION_LABELS,
  SCORE_COMPLETION_LABELS,
  calculateCategoryProgress,
  calculateNewMastery,
  calculateOverallDogIndex,
  formatDogAgeRussian,
  formatDurationRussian,
  formatSessionDateRussian,
  getDogRank,
  getRussianPlural,
} from '../../utils/calculations';
import {
  formatReportForClipboard,
  generateNextSessionPlan,
  generateSmartHomework,
} from '../../utils/homeworkGenerator';
import { HomeworkCard } from '../training/HomeworkCard';
import { NextSessionCard } from '../training/NextSessionCard';
import { AnalyticsChart } from '../analytics/AnalyticsChart';
import { cn } from '../../utils/cn';
import { useDogStore } from '../../store/useDogStore';

export interface DogDossierProps {
  dog: Dog;
  onBackToStudents?: () => void;
  onEditDog: () => void;
  onAddSkill: () => void;
  onStartTraining: () => void;
  onOpenAnalytics?: () => void;
  onOpenCertificate?: () => void;
}

const MOTIVATION_LABELS: Record<string, string> = {
  food: 'Пищевая',
  play: 'Игровая',
  social: 'Социальная',
  mixed: 'Смешанная',
};

const DISCIPLINE_TITLES: Record<string, string> = {
  okd: 'Общий курс дрессировки (ОКД)',
  zks: 'Защитно-караульная служба (ЗКС)',
  sport: 'Активный спорт и ноузворк',
  behavior: 'Коррекция поведения',
};

const DISCIPLINE_SHORT_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Спорт',
  behavior: 'Коррекция',
};

const DURATION_PRESETS = [
  { label: '30 мин', minutes: 30 },
  { label: '45 мин', minutes: 45 },
  { label: '1 ч', minutes: 60 },
  { label: '1 ч 30 мин', minutes: 90 },
  { label: '2 ч', minutes: 120 },
] as const;

function toLocalDateInputValue(isoDate: string): string {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate.slice(0, 10);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildLocalNoonDateIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((part) => parseInt(part, 10));
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

const RaycastSkillRow: React.FC<{
  skill: DogSkill;
  onQuickScore: (skill: DogSkill, score: number) => void;
  onDelete: (skill: DogSkill) => void;
}> = ({ skill, onQuickScore, onDelete }) => {
  const clamped = Math.max(0, Math.min(100, skill.mastery));
  const dotColor =
    clamped >= 80
      ? 'bg-[#1f5c3a]'
      : clamped >= 50
      ? 'bg-[#b06728]'
      : 'bg-[#7b7266]';

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          e.preventDefault();
          onQuickScore(skill, Number(e.key));
        }
      }}
      className="raycast-row h-11 px-3 -mx-3 flex items-center justify-between gap-3 group outline-none"
    >
      {/* Left: Dot + Skill Name + subtle description */}
      <div className="min-w-0 flex items-baseline gap-2.5 flex-1 pr-2">
        <span className={cn('size-1.5 rounded-full flex-shrink-0 self-center', dotColor)} />
        <span className="text-[13.5px] font-medium text-[#1f1b16] flex-shrink-0">
          {skill.name}
        </span>
        {skill.description && (
          <span className="hidden sm:inline text-[12px] text-[#7b7266] truncate min-w-0">
            {skill.description}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(skill);
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#7b7266] hover:text-[#b93829] transition-opacity ml-1 flex-shrink-0 self-center"
          title="Удалить навык из карточки"
          aria-label={`Удалить навык ${skill.name}`}
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Right: Hover-only Raycast Keycaps (1..5) + Precision Bar + Mono Value */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="hidden group-hover:flex group-focus-within:flex items-center gap-1 mr-1"
          role="group"
          aria-label={`Быстрая оценка навыка ${skill.name}`}
        >
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = skill.lastScore === score;
            const completionInfo = SCORE_COMPLETION_LABELS[score];
            return (
              <button
                key={score}
                type="button"
                onClick={() => onQuickScore(skill, score)}
                title={`${score} — ${completionInfo?.label ?? ''}`}
                className={cn(
                  isSelected
                    ? cn(
                        'inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-[5px] px-1.5 font-mono text-[11px] font-medium border transition-colors',
                        score === 5
                          ? 'bg-[#1f5c3a] border-[#1f5c3a] text-[#fdfbf7]'
                          : 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                      )
                    : 'keycap hover:text-[#1f1b16]'
                )}
              >
                {score}
              </button>
            );
          })}
        </div>

        <div className="w-16 sm:w-20 h-1.5 rounded-full bg-[#1f1b16]/[0.08] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              clamped >= 80
                ? 'bg-[#1f5c3a]'
                : clamped >= 50
                ? 'bg-[#5e554a]'
                : 'bg-[#7b7266]'
            )}
            style={{ width: `${clamped}%` }}
          />
        </div>

        <span className="w-9 text-right font-mono text-[12px] font-medium tabular-nums text-[#5e554a] group-hover:text-[#1f1b16]">
          {skill.mastery}%
        </span>
      </div>
    </div>
  );
};

interface SessionInlineEditorProps {
  dog: Dog;
  session: TrainingSession;
  sessionNumber: number;
  disciplines: DisciplineInfo[];
  disciplineCommands: Record<string, DisciplineCommandTemplate[]>;
  disciplineShortLabels: Record<string, string>;
  onSave: (
    sessionId: string,
    updates: {
      date: string;
      durationMinutes: number;
      distractionLevel: DistractionLevel;
      timeEntryMode: 'stopwatch' | 'manual';
      title?: string;
      scores: SkillScoreRecord[];
      trainerNotes: string;
      timerData?: { stayDurationSeconds: number; repsCount?: number };
    }
  ) => void;
  onDelete: (sessionId: string) => void;
  onCancel: () => void;
}

const SessionInlineEditor: React.FC<SessionInlineEditorProps> = ({
  dog,
  session,
  sessionNumber,
  disciplines,
  disciplineCommands,
  disciplineShortLabels,
  onSave,
  onDelete,
  onCancel,
}) => {
  const initialDateOnly = toLocalDateInputValue(session.date);
  const [editDate, setEditDate] = useState(initialDateOnly);
  const [hoursInput, setHoursInput] = useState(
    String(Math.floor(Math.max(0, session.durationMinutes) / 60))
  );
  const [minutesInput, setMinutesInput] = useState(
    String(Math.max(0, session.durationMinutes) % 60)
  );
  const [timeEntryMode, setTimeEntryMode] = useState<'stopwatch' | 'manual'>(
    session.timeEntryMode ?? 'manual'
  );
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>(
    session.distractionLevel
  );
  const [title, setTitle] = useState(session.title ?? '');
  const [staySecondsInput, setStaySecondsInput] = useState(
    String(session.timerData?.stayDurationSeconds ?? 0)
  );
  const [trainerNotes, setTrainerNotes] = useState(session.trainerNotes ?? '');
  const [editScores, setEditScores] = useState<SkillScoreRecord[]>(() =>
    session.scores.map((s) => ({ ...s }))
  );
  const [libraryTab, setLibraryTab] = useState<SkillCategory>('okd');
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  const totalMinutes = useMemo(() => {
    const h = Math.max(0, Math.floor(Number(hoursInput) || 0));
    const m = Math.max(0, Math.floor(Number(minutesInput) || 0));
    return h * 60 + m;
  }, [hoursInput, minutesInput]);

  const applyDurationPreset = (mins: number) => {
    setHoursInput(String(Math.floor(mins / 60)));
    setMinutesInput(String(mins % 60));
  };

  const selectedSkillIds = useMemo(
    () => new Set(editScores.map((s) => s.skillId)),
    [editScores]
  );

  const selectedSkillNames = useMemo(
    () => new Set(editScores.map((s) => s.skillName.trim().toLowerCase())),
    [editScores]
  );

  const toggleDogSkill = (skill: DogSkill) => {
    const normalizedName = skill.name.trim().toLowerCase();
    setEditScores((prev) => {
      const exists = prev.some(
        (s) =>
          s.skillId === skill.id ||
          s.skillName.trim().toLowerCase() === normalizedName
      );
      if (exists) {
        return prev.filter(
          (s) =>
            s.skillId !== skill.id &&
            s.skillName.trim().toLowerCase() !== normalizedName
        );
      }
      return [
        ...prev,
        {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          score: skill.lastScore ?? 4,
        },
      ];
    });
  };

  const addTemplateCommand = (cmd: DisciplineCommandTemplate) => {
    const normalizedName = cmd.name.trim().toLowerCase();
    setEditScores((prev) => {
      if (
        prev.some(
          (s) =>
            s.skillId === cmd.id ||
            s.skillName.trim().toLowerCase() === normalizedName
        )
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          skillId: cmd.id,
          skillName: cmd.name,
          category: cmd.category,
          score: 4,
        },
      ];
    });
  };

  const updateCommandScore = (skillId: string, score: number) => {
    setEditScores((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, score } : s))
    );
  };

  const removeCommandFromSession = (skillId: string) => {
    setEditScores((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  const availableLibraryCommands = useMemo(() => {
    const list = disciplineCommands[String(libraryTab)] ?? [];
    return list.filter(
      (cmd) =>
        !selectedSkillIds.has(cmd.id) &&
        !selectedSkillNames.has(cmd.name.trim().toLowerCase())
    );
  }, [disciplineCommands, libraryTab, selectedSkillIds, selectedSkillNames]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editDate) {
      toast.error('Укажите дату тренировки');
      return;
    }
    if (totalMinutes < 1) {
      toast.error('Укажите длительность тренировки (минимум 1 минута)');
      return;
    }
    if (editScores.length === 0) {
      toast.error('Выберите хотя бы одну команду для тренировки');
      return;
    }

    const nextIsoDate =
      editDate === initialDateOnly ? session.date : buildLocalNoonDateIso(editDate);

    const staySec = Math.max(0, Math.round(Number(staySecondsInput) || 0));

    onSave(session.id, {
      date: nextIsoDate,
      durationMinutes: totalMinutes,
      distractionLevel,
      timeEntryMode,
      title: title.trim() || undefined,
      scores: editScores,
      trainerNotes: trainerNotes.trim(),
      timerData:
        staySec > 0
          ? { ...session.timerData, stayDurationSeconds: staySec }
          : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSave}
      className="mt-3 pt-4 border-t border-[#1f1b16]/10 space-y-4 bg-[#f7f4ee]/65 -mx-4 px-4 pb-4 rounded-b-[14px]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-[#1f1b16]">
          Редактирование: Тренировка {sessionNumber}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11.5px] text-[#5e554a] hover:text-[#1f1b16] inline-flex items-center gap-1"
        >
          <X className="size-3.5" strokeWidth={1.5} />
          <span>Закрыть</span>
        </button>
      </div>

      {/* Row 1: Date + Duration (Hours + Minutes) + Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11.5px] font-medium text-[#5e554a] mb-1">
            Дата проведения
          </label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] font-mono text-[12px] tabular-nums text-[#1f1b16] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11.5px] font-medium text-[#5e554a]">
              Длительность (часы и минуты)
            </label>
            <span className="font-mono text-[11px] tabular-nums text-[#1f5c3a] font-medium">
              {totalMinutes > 0 ? formatDurationRussian(totalMinutes) : '0 мин'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={12}
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                aria-label="Часы"
                className="w-14 h-8 px-2 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] font-mono text-[12px] tabular-nums text-[#1f1b16] text-center focus:outline-none focus:border-[#1f1b16]/40"
              />
              <span className="text-[12px] text-[#5e554a]">ч</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutesInput}
                onChange={(e) => setMinutesInput(e.target.value)}
                aria-label="Минуты"
                className="w-16 h-8 px-2 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] font-mono text-[12px] tabular-nums text-[#1f1b16] text-center focus:outline-none focus:border-[#1f1b16]/40"
              />
              <span className="text-[12px] text-[#5e554a]">мин</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => applyDurationPreset(preset.minutes)}
                  className={cn(
                    'h-7 px-2 rounded-md border font-mono text-[11px] tabular-nums transition-colors',
                    totalMinutes === preset.minutes
                      ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                      : 'bg-[#fdfbf7] border-[#1f1b16]/15 text-[#5e554a] hover:bg-[#efe9df]'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Title + Distraction + Stay Seconds */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <label className="block text-[11.5px] font-medium text-[#5e554a] mb-1">
            Тема тренировки (необязательно)
          </label>
          <input
            type="text"
            placeholder="Например: Работа на дистанции"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] text-[12px] text-[#1f1b16] placeholder:text-[#7b7266] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[11.5px] font-medium text-[#5e554a] mb-1">
            Раздражители
          </label>
          <select
            value={distractionLevel}
            onChange={(e) => setDistractionLevel(e.target.value as DistractionLevel)}
            className="w-full h-8 px-2 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] text-[12px] text-[#1f1b16] focus:outline-none focus:border-[#1f1b16]/40"
          >
            {Object.entries(DISTRACTION_LABELS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11.5px] font-medium text-[#5e554a] mb-1">
            Выдержка (сек)
          </label>
          <input
            type="number"
            min={0}
            max={3600}
            value={staySecondsInput}
            onChange={(e) => setStaySecondsInput(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] font-mono text-[12px] tabular-nums text-[#1f1b16] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>
      </div>

      {/* Row 2b: Time Entry Mode */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11.5px] font-medium text-[#5e554a]">
          Учёт времени:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTimeEntryMode('stopwatch')}
            title="Режим секундомера"
            className={cn(
              'px-3 h-8 whitespace-nowrap rounded-lg border text-[12px] font-medium transition-colors',
              timeEntryMode === 'stopwatch'
                ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                : 'bg-[#fdfbf7] text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
            )}
          >
            Секундомер
          </button>
          <button
            type="button"
            onClick={() => setTimeEntryMode('manual')}
            title="Введено вручную"
            className={cn(
              'px-3 h-8 whitespace-nowrap rounded-lg border text-[12px] font-medium transition-colors',
              timeEntryMode === 'manual'
                ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                : 'bg-[#fdfbf7] text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
            )}
          >
            Вручную
          </button>
        </div>
      </div>

      {/* Step 1: Toggle dog skills & add from discipline sets */}
      <div className="space-y-2.5 pt-2 border-t border-[#1f1b16]/10">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[12px] font-medium text-[#1f1b16]">
            Команды из карточки собаки ({dog.skills.length})
          </span>
          <button
            type="button"
            onClick={() => setShowLibraryPicker((v) => !v)}
            className="h-7 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors"
          >
            <Plus className="size-3 text-[#1f5c3a]" strokeWidth={2} />
            <span>
              {showLibraryPicker
                ? 'Скрыть наборы команд'
                : 'Добавить из наборов (ОКД / ЗКС / Спорт / Коррекция)'}
            </span>
          </button>
        </div>

        {dog.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dog.skills.map((skill) => {
              const checked =
                selectedSkillIds.has(skill.id) ||
                selectedSkillNames.has(skill.name.trim().toLowerCase());
              return (
                <label
                  key={skill.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] cursor-pointer select-none transition-colors',
                    checked
                      ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7] font-medium'
                      : 'bg-[#fdfbf7] border-[#1f1b16]/15 text-[#5e554a] hover:bg-[#efe9df]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDogSkill(skill)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'size-3.5 rounded-[3px] border flex items-center justify-center',
                      checked
                        ? 'bg-[#1f5c3a] border-[#1f5c3a] text-[#fdfbf7]'
                        : 'border-[#1f1b16]/25 bg-transparent'
                    )}
                  >
                    {checked && <Check className="size-2.5 stroke-[2.5]" />}
                  </span>
                  <span>{skill.name}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Discipline Command Library Picker */}
        {showLibraryPicker && (
          <div className="rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] p-3 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {(disciplines.length > 0 ? disciplines : DEFAULT_DISCIPLINES).map((disc) => {
                const isTabActive = libraryTab === disc.id;
                const shortLabel =
                  disciplineShortLabels[String(disc.id)] ?? disc.shortTitle ?? disc.title;
                return (
                  <button
                    key={String(disc.id)}
                    type="button"
                    onClick={() => setLibraryTab(disc.id)}
                    className={cn(
                      'h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-colors',
                      isTabActive
                        ? 'bg-[#1f1b16] text-[#fdfbf7]'
                        : 'bg-[#efe9df]/70 text-[#5e554a] hover:text-[#1f1b16]'
                    )}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>

            {availableLibraryCommands.length === 0 ? (
              <p className="text-[11.5px] text-[#7b7266]">
                Все команды этого курса уже добавлены в данную тренировку.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableLibraryCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => addTemplateCommand(cmd)}
                    title={cmd.description}
                    className="h-7 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#efe9df]/50 hover:bg-[#1f5c3a] hover:border-[#1f5c3a] hover:text-[#fdfbf7] text-[#1f1b16] text-[11.5px] inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="size-3" strokeWidth={1.75} />
                    <span>{cmd.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Completion degree (1-5) for each selected command */}
      <div className="space-y-2 pt-2 border-t border-[#1f1b16]/10">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#1f1b16]">
            Степень выполнения команд ({editScores.length})
          </span>
          <span className="text-[11px] text-[#7b7266]">
            Выберите оценку 1–5 по каждой команде
          </span>
        </div>

        {editScores.length === 0 ? (
          <div className="p-3 rounded-lg border border-[#b93829]/25 bg-[#fdfbf7] text-[12px] text-[#b93829]">
            Нет выбранных команд. Отметьте команды выше или добавьте из наборов.
          </div>
        ) : (
          <div className="space-y-2">
            {editScores.map((rec) => {
              const catLabel =
                disciplineShortLabels[String(rec.category)] ?? String(rec.category);
              return (
                <div
                  key={rec.skillId}
                  className="rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12.5px] font-medium text-[#1f1b16] truncate">
                        {rec.skillName}
                      </span>
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#efe9df] text-[#5e554a] flex-shrink-0">
                        {catLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCommandFromSession(rec.skillId)}
                      className="text-[#7b7266] hover:text-[#b93829] p-1 transition-colors flex-shrink-0"
                      title="Убрать команду из тренировки"
                      aria-label={`Убрать ${rec.skillName}`}
                    >
                      <X className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((scoreVal) => {
                      const meta = SCORE_COMPLETION_LABELS[scoreVal];
                      const isSelected = rec.score === scoreVal;
                      return (
                        <button
                          key={scoreVal}
                          type="button"
                          onClick={() => updateCommandScore(rec.skillId, scoreVal)}
                          title={`${scoreVal} — ${meta?.label ?? ''} (${meta?.percent ?? 0}%)`}
                          className={cn(
                            'px-1.5 py-1.5 rounded-lg border text-center transition-colors flex flex-col items-center justify-center leading-tight',
                            isSelected
                              ? scoreVal === 5
                                ? 'bg-[#1f5c3a] border-[#1f5c3a] text-[#fdfbf7]'
                                : scoreVal === 1
                                ? 'bg-[#b93829] border-[#b93829] text-[#fdfbf7]'
                                : 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                              : 'bg-[#efe9df]/45 border-[#1f1b16]/10 text-[#5e554a] hover:bg-[#efe9df] hover:text-[#1f1b16]'
                          )}
                        >
                          <span className="font-mono text-[11px] font-medium tabular-nums">
                            {scoreVal}
                          </span>
                          <span className="text-[9.5px] truncate max-w-full mt-0.5">
                            {meta?.short}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trainer notes */}
      <div>
        <label className="block text-[11.5px] font-medium text-[#5e554a] mb-1">
          Заметка кинолога по тренировке
        </label>
        <textarea
          rows={2}
          value={trainerNotes}
          onChange={(e) => setTrainerNotes(e.target.value)}
          placeholder="Поведение собаки, условия площадки, рекомендации..."
          className="w-full p-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] text-[12px] text-[#1f1b16] placeholder:text-[#7b7266] focus:outline-none focus:border-[#1f1b16]/40 resize-none leading-relaxed"
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Удалить запись «Тренировка ${sessionNumber}» из журнала?`
              )
            ) {
              onDelete(session.id);
            }
          }}
          className="h-8 px-2.5 rounded-lg border border-[#b93829]/25 bg-[#fdfbf7] hover:bg-[#b93829]/10 text-[#b93829] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
          <span>Удалить тренировку</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] text-[12px] font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="h-8 px-3.5 rounded-lg bg-[#1f5c3a] hover:bg-[#194b2f] text-[#fdfbf7] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Check className="size-3.5" strokeWidth={1.75} />
            <span>Сохранить</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export const DogDossier: React.FC<DogDossierProps> = ({
  dog,
  onBackToStudents,
  onEditDog,
  onAddSkill,
  onStartTraining,
  onOpenAnalytics,
  onOpenCertificate,
}) => {
  const [imgError, setImgError] = useState(false);
  const [lastAvatar, setLastAvatar] = useState(dog.avatar);
  if (dog.avatar !== lastAvatar) {
    setLastAvatar(dog.avatar);
    setImgError(false);
  }

  const [fallbackIsoDate] = useState(() => new Date().toISOString());
  const [sessionSortOrder, setSessionSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const deleteDog = useDogStore((s) => s.deleteDog);
  const deleteSkill = useDogStore((s) => s.deleteSkill);
  const updateSession = useDogStore((s) => s.updateSession);
  const deleteSession = useDogStore((s) => s.deleteSession);
  const sessions = useDogStore((s) => s.sessions);
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);

  const disciplineTitles = useMemo(() => {
    const map: Record<string, string> = { ...DISCIPLINE_TITLES };
    for (const d of disciplines) {
      map[String(d.id)] = d.title;
    }
    return map;
  }, [disciplines]);

  const disciplineShortLabels = useMemo(() => {
    const map: Record<string, string> = { ...DISCIPLINE_SHORT_LABELS };
    for (const d of disciplines) {
      map[String(d.id)] = d.shortTitle || d.title;
    }
    return map;
  }, [disciplines]);

  // Number all dog sessions strictly chronologically (earliest = Тренировка 1)
  const chronologicalSessions = useMemo(() => {
    const dogSessions = sessions.filter((s) => s.dogId === dog.id);
    return [...dogSessions]
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      })
      .map((session, idx) => ({
        session,
        sessionNumber: idx + 1,
      }));
  }, [sessions, dog.id]);

  const displayedSessions = useMemo(
    () =>
      sessionSortOrder === 'asc'
        ? chronologicalSessions
        : [...chronologicalSessions].reverse(),
    [chronologicalSessions, sessionSortOrder]
  );

  const latestSession =
    chronologicalSessions.length > 0
      ? chronologicalSessions[chronologicalSessions.length - 1].session
      : null;

  const { overallIndex } = calculateOverallDogIndex(dog.skills);
  const dogRank = getDogRank(overallIndex);
  const motivationLabel = MOTIVATION_LABELS[dog.motivationType] || MOTIVATION_LABELS.food;

  // Group dog skills across ALL 4 disciplines + any custom category, hiding empty sections
  const skillGroups = useMemo(() => {
    const canonicalOrder: SkillCategory[] = ['okd', 'zks', 'sport', 'behavior'];
    for (const d of disciplines) {
      if (!canonicalOrder.includes(d.id)) {
        canonicalOrder.push(d.id);
      }
    }
    for (const skill of dog.skills) {
      if (!canonicalOrder.includes(skill.category)) {
        canonicalOrder.push(skill.category);
      }
    }

    return canonicalOrder
      .map((category) => {
        const skills = dog.skills.filter((s) => s.category === category);
        return {
          category,
          title: disciplineTitles[String(category)] ?? String(category),
          skills,
          average: calculateCategoryProgress(dog.skills, category),
        };
      })
      .filter((group) => group.skills.length > 0);
  }, [dog.skills, disciplines, disciplineTitles]);

  const showAvatar = Boolean(dog.avatar && !imgError);

  const activeHomeworkSession = useMemo(() => {
    if (latestSession) {
      return latestSession;
    }
    const synthesizedScores: SkillScoreRecord[] = dog.skills.map((s) => ({
      skillId: s.id,
      skillName: s.name,
      category: s.category,
      score:
        s.lastScore ??
        (s.mastery >= 90
          ? 5
          : s.mastery >= 75
          ? 4
          : s.mastery >= 50
          ? 3
          : s.mastery > 0
          ? 2
          : 1),
    }));

    return {
      date: dog.updatedAt || dog.createdAt || fallbackIsoDate,
      durationMinutes: dog.dailyTrainingTime || 30,
      distractionLevel: 'quiet_yard' as const,
      scores: synthesizedScores,
      homework: generateSmartHomework(dog, synthesizedScores),
      nextSessionPlan: generateNextSessionPlan(dog, synthesizedScores, 'quiet_yard'),
    };
  }, [latestSession, dog, fallbackIsoDate]);

  const handleQuickScore = (skill: DogSkill, score: number) => {
    const newMastery = calculateNewMastery(skill.mastery, score, 'quiet_yard');
    useDogStore.getState().updateSkill(dog.id, skill.id, {
      mastery: newMastery,
      lastScore: score,
      lastUpdated: new Date().toISOString(),
    });
    const label = SCORE_COMPLETION_LABELS[score]?.short ?? `${score}/5`;
    toast.success(`${skill.name}: ${score} (${label}) · ${newMastery}%`);
  };

  const handleDeleteDog = () => {
    if (
      window.confirm(
        `Вы уверены, что хотите удалить карточку собаки «${dog.name}»? Все связанные данные и занятия будут стёрты.`
      )
    ) {
      deleteDog(dog.id);
    }
  };

  const handleDeleteSkill = (skill: DogSkill) => {
    if (window.confirm(`Удалить навык «${skill.name}» из карточки собаки?`)) {
      deleteSkill(dog.id, skill.id);
    }
  };

  const handleSaveEditedSession = (
    sessionId: string,
    updates: {
      date: string;
      durationMinutes: number;
      distractionLevel: DistractionLevel;
      timeEntryMode: 'stopwatch' | 'manual';
      title?: string;
      scores: SkillScoreRecord[];
      trainerNotes: string;
      timerData?: { stayDurationSeconds: number; repsCount?: number };
    }
  ) => {
    const updated = updateSession(sessionId, updates);
    if (updated) {
      setEditingSessionId(null);
      toast.success('Тренировка обновлена');
    } else {
      toast.error('Не удалось обновить тренировку');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    if (editingSessionId === sessionId) setEditingSessionId(null);
    if (expandedSessionId === sessionId) setExpandedSessionId(null);
    toast.success('Запись о тренировке удалена');
  };

  const handleCopyHistoryReport = async (session: TrainingSession) => {
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
      setCopiedSessionId(session.id);
      toast.success('Отчёт скопирован в буфер обмена', {
        description: `Тренировка от ${formatSessionDateRussian(session.date)}`,
      });
      setTimeout(() => setCopiedSessionId(null), 2500);
    } catch {
      toast.error('Не удалось скопировать отчёт');
    }
  };

  const hasAllergyAlert = Boolean(
    dog.allergies &&
      dog.allergies.trim() !== '' &&
      dog.allergies.trim().toLowerCase() !== 'нет'
  );

  return (
    <div className="text-[#1f1b16] pb-14">
      {/* 1. COZY CRAFT DOCUMENT HEADER */}
      <div className="px-7 sm:px-11 pt-6 pb-6 bg-gradient-to-b from-[#f6efe3]/70 to-transparent border-b border-[#1f1b16]/[0.08]">
        {onBackToStudents && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onBackToStudents}
              className="h-8 px-2.5 -ml-2.5 rounded-lg hover:bg-[#efe9df] text-[#5e554a] hover:text-[#1f1b16] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.6} />
              <span>← Все ученики</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Tactile Photo + Serif Document Title */}
          <div className="flex items-start gap-5">
            <div className="relative size-[76px] rounded-[18px] overflow-hidden bg-[#efe9df] ring-1 ring-[#1f1b16]/10 shadow-[0_6px_16px_-4px_rgba(34,28,21,0.12)] flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-serif text-xl font-medium text-[#5e554a]">
                  {dog.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-[34px] sm:text-[38px] font-medium text-[#1f1b16] leading-[1.05] tracking-[-0.02em]">
                  {dog.name}
                </h1>
                {dog.certificateIssued && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1f5c3a]/10 border border-[#1f5c3a]/20 text-[#1f5c3a] text-[11px] font-medium">
                    <Award className="size-3" strokeWidth={1.6} />
                    <span>Диплом выдан</span>
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#5e554a]">
                <span>{dog.gender === 'male' ? 'Кобель' : 'Сука'}</span>
                <span className="text-[#7b7266]">·</span>
                <span>{dog.breed}</span>
                <span className="text-[#7b7266]">·</span>
                <span className="font-mono text-[12px] tabular-nums text-[#1f1b16]">
                  {formatDogAgeRussian(dog.birthDate)}
                </span>
                <span className="text-[#7b7266]">·</span>
                <span className="font-mono text-[12px] tabular-nums text-[#5e554a]">
                  {dog.weight} кг
                </span>
              </div>
            </div>
          </div>

          {/* Right: Editorial Index Score + Action Bar */}
          <div className="flex flex-col lg:items-end justify-between gap-3.5">
            <div className="flex items-baseline lg:justify-end gap-3">
              <div className="lg:text-right">
                <span className="text-[12px] font-medium text-[#1f5c3a] block">
                  {dogRank.title}
                </span>
                <div className="w-36 h-1.5 rounded-full bg-[#1f1b16]/[0.08] overflow-hidden mt-1.5 lg:ml-auto">
                  <div
                    className="h-full rounded-full bg-[#1f5c3a] transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, overallIndex))}%` }}
                  />
                </div>
              </div>
              <span className="font-serif text-[38px] leading-none font-medium text-[#1f1b16] tabular-nums">
                {overallIndex}%
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onStartTraining}
                className="h-9 px-3.5 rounded-[10px] bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-[0_2px_6px_rgba(34,28,21,0.12)]"
              >
                <Play className="size-3.5 fill-current" strokeWidth={1.5} />
                <span>Начать занятие</span>
              </button>

              {onOpenCertificate && (
                <button
                  type="button"
                  onClick={onOpenCertificate}
                  className="h-9 px-3 rounded-[10px] bg-[#efe9df]/90 hover:bg-[#e4dccf] text-[#1f1b16] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="size-3.5 text-[#5e554a]" strokeWidth={1.5} />
                  <span>Диплом А4</span>
                </button>
              )}

              {onOpenAnalytics && (
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="h-9 px-3 rounded-[10px] hover:bg-[#1f1b16]/[0.05] text-[#5e554a] hover:text-[#1f1b16] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <TrendingUp className="size-3.5 text-[#7b7266]" strokeWidth={1.5} />
                  <span>Аналитика</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEditDog}
                className="h-9 px-2.5 rounded-[10px] hover:bg-[#1f1b16]/[0.05] text-[#5e554a] hover:text-[#1f1b16] text-[13px] inline-flex items-center gap-1.5 transition-colors"
                title="Редактировать карточку"
              >
                <Edit3 className="size-3.5 text-[#7b7266]" strokeWidth={1.5} />
                <span>Анкета</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteDog}
                className="size-9 rounded-[10px] hover:bg-[#b93829]/10 text-[#7b7266] hover:text-[#b93829] inline-flex items-center justify-center transition-colors"
                title="Удалить карточку собаки"
                aria-label="Удалить карточку собаки"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata Rows */}
        <div className="mt-6 pt-5 border-t border-[#1f1b16]/[0.07] grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-[13px]">
          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#7b7266]">Владелец</span>
            <div className="min-w-0 flex items-center gap-2.5 flex-wrap text-[#1f1b16]">
              <span className="font-medium">{dog.ownerName || '—'}</span>
              {dog.ownerPhone && (
                <a
                  href={`tel:${dog.ownerPhone}`}
                  className="font-mono text-[12px] text-[#5e554a] hover:text-[#1f1b16] hover:underline tabular-nums"
                >
                  {dog.ownerPhone}
                </a>
              )}
              {dog.ownerTelegram && (
                <a
                  href={`https://t.me/${dog.ownerTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-[#1f5c3a] hover:underline"
                >
                  {dog.ownerTelegram}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#7b7266]">Мотивация</span>
            <span className="text-[#1f1b16] truncate">
              {motivationLabel} ·{' '}
              <span className="font-mono text-[12px] tabular-nums">
                {formatDurationRussian(dog.dailyTrainingTime)}/день
              </span>
              {dog.favoriteTreats ? ` · ${dog.favoriteTreats}` : ''}
            </span>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#7b7266]">Особенности</span>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className={cn(hasAllergyAlert ? 'text-[#b93829] font-medium' : 'text-[#5e554a]')}>
                Аллергия: {dog.allergies || 'Нет'}
              </span>
              <span className="text-[#7b7266]">·</span>
              <span className="text-[#5e554a] truncate">
                Триггеры: {dog.triggers || 'Не выявлены'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#7b7266]">Заметка</span>
            <span className="text-[#5e554a] line-clamp-1" title={dog.notes}>
              {dog.notes || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN CRAFT SHEET BODY */}
      <div className="px-7 sm:px-11 pt-7 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN (7 cols): FIRST-CLASS Градация тренировок + Ведомость навыков */}
        <div className="lg:col-span-7 space-y-9">
          {/* SECTION A: ГРАДАЦИЯ ТРЕНИРОВОК (prominent, never hidden behind tabs) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1b16]/10">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-serif text-[23px] leading-tight font-medium text-[#1f1b16]">
                  Градация тренировок
                </h2>
                <span className="font-mono text-[12px] tabular-nums text-[#7b7266]">
                  {chronologicalSessions.length}{' '}
                  {getRussianPlural(
                    chronologicalSessions.length,
                    'занятие',
                    'занятия',
                    'занятий'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {chronologicalSessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSessionSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    className="h-8 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] hover:text-[#1f1b16] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                    title="Переключить порядок сортировки"
                  >
                    <ArrowUpDown className="size-3.5" strokeWidth={1.5} />
                    <span>
                      {sessionSortOrder === 'asc'
                        ? `Сначала ранние (1 → ${chronologicalSessions.length})`
                        : `Сначала новые (${chronologicalSessions.length} → 1)`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onStartTraining}
                  className="h-8 px-3 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="size-3.5" strokeWidth={1.75} />
                  <span>Тренировка</span>
                </button>
              </div>
            </div>

            {displayedSessions.length === 0 ? (
              <div className="py-8 px-5 text-center rounded-[14px] border border-[#1f1b16]/10 bg-[#f7f4ee]/70">
                <p className="text-[13px] text-[#5e554a] mb-3">
                  Для собаки «{dog.name}» ещё не записано ни одной тренировки
                </p>
                <button
                  type="button"
                  onClick={onStartTraining}
                  className="h-9 px-4 rounded-[10px] bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Play className="size-3.5" strokeWidth={1.5} />
                  <span>Записать Тренировку 1</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedSessions.map(({ session, sessionNumber }) => {
                  const isEditing = editingSessionId === session.id;
                  const isExpanded = expandedSessionId === session.id;
                  const isCopied = copiedSessionId === session.id;
                  const distractionInfo = DISTRACTION_LABELS[session.distractionLevel] || {
                    label: session.distractionLevel,
                    multiplier: 1.0,
                    description: '',
                  };
                  const modeLabel =
                    session.timeEntryMode === 'stopwatch' ? 'Секундомер' : 'Вручную';

                  return (
                    <article
                      key={session.id}
                      className={cn(
                        'rounded-[14px] border bg-[#fdfbf7] p-4 space-y-3 transition-colors',
                        isEditing
                          ? 'border-[#1f5c3a]/40 shadow-[0_6px_20px_-8px_rgba(31,92,58,0.16)]'
                          : 'border-[#1f1b16]/10 hover:border-[#1f1b16]/20'
                      )}
                    >
                      {/* Top Header Line */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14.5px] font-medium text-[#1f1b16]">
                              Тренировка {sessionNumber} —{' '}
                              {formatSessionDateRussian(session.date)} ·{' '}
                              <span className="font-mono text-[13px] tabular-nums">
                                {formatDurationRussian(session.durationMinutes)}
                              </span>
                            </h3>

                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-[5px] border text-[11px] font-medium',
                                session.timeEntryMode === 'stopwatch'
                                  ? 'bg-[#1f5c3a]/10 border-[#1f5c3a]/20 text-[#1f5c3a]'
                                  : 'bg-[#efe9df] border-[#1f1b16]/10 text-[#5e554a]'
                              )}
                            >
                              {modeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[12px] text-[#5e554a]">
                            {session.title && (
                              <>
                                <span className="font-medium text-[#1f1b16]">
                                  {session.title}
                                </span>
                                <span className="text-[#7b7266]">·</span>
                              </>
                            )}
                            <span>{distractionInfo.label}</span>
                            {session.timerData?.stayDurationSeconds ? (
                              <>
                                <span className="text-[#7b7266]">·</span>
                                <span className="font-mono text-[11.5px] tabular-nums">
                                  Выдержка {session.timerData.stayDurationSeconds} сек
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[12.5px] font-medium tabular-nums text-[#1f5c3a] px-2 py-0.5 rounded-[6px] bg-[#1f5c3a]/[0.08] border border-[#1f5c3a]/20">
                            Индекс {session.overallIndexSnapshot}%
                          </span>
                        </div>
                      </div>

                      {/* Trainer Note */}
                      {session.trainerNotes && !isEditing && (
                        <p className="text-[13px] text-[#5e554a] leading-relaxed">
                          {session.trainerNotes}
                        </p>
                      )}

                      {/* Command Pills with Completion Grades */}
                      {!isEditing && session.scores.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {session.scores.map((rec) => {
                            const completion = SCORE_COMPLETION_LABELS[rec.score];
                            return (
                              <span
                                key={`${session.id}_${rec.skillId}`}
                                title={
                                  completion
                                    ? `${rec.skillName}: ${rec.score} — ${completion.label}`
                                    : rec.skillName
                                }
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-[7px] border text-[11.5px]',
                                  rec.score === 5
                                    ? 'bg-[#1f5c3a]/[0.07] border-[#1f5c3a]/25 text-[#1f1b16]'
                                    : rec.score <= 2
                                    ? 'bg-[#b93829]/[0.06] border-[#b93829]/25 text-[#1f1b16]'
                                    : 'bg-[#efe9df]/55 border-[#1f1b16]/10 text-[#1f1b16]'
                                )}
                              >
                                <span className="font-medium">{rec.skillName}</span>
                                <span
                                  className={cn(
                                    'font-mono text-[11px] tabular-nums',
                                    rec.score === 5
                                      ? 'text-[#1f5c3a] font-medium'
                                      : rec.score <= 2
                                      ? 'text-[#b93829] font-medium'
                                      : 'text-[#5e554a]'
                                  )}
                                >
                                  {rec.score} {completion?.short ?? ''}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Card Action Row */}
                      <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSessionId(isEditing ? null : session.id)
                            }
                            className={cn(
                              'h-7 px-2.5 rounded-[7px] border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors',
                              isEditing
                                ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                                : 'bg-[#efe9df]/70 border-[#1f1b16]/15 hover:bg-[#efe9df] text-[#1f1b16]'
                            )}
                          >
                            <SlidersHorizontal className="size-3" strokeWidth={1.6} />
                            <span>
                              {isEditing
                                ? 'Скрыть редактор'
                                : 'Настроить команды / изменить'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyHistoryReport(session)}
                            className={cn(
                              'h-7 px-2.5 rounded-[7px] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors',
                              isCopied
                                ? 'bg-[#1f5c3a] text-[#fdfbf7]'
                                : 'bg-[#efe9df]/60 hover:bg-[#efe9df] text-[#5e554a] hover:text-[#1f1b16]'
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3" strokeWidth={1.75} />
                                <span>Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" strokeWidth={1.5} />
                                <span>В Telegram</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSessionId(isExpanded ? null : session.id)
                          }
                          className="h-7 px-2 rounded-[7px] hover:bg-[#efe9df] text-[#5e554a] hover:text-[#1f1b16] text-[12px] inline-flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? 'Скрыть ДЗ' : 'ДЗ и план'}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" strokeWidth={1.5} />
                          ) : (
                            <ChevronDown className="size-3.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      {/* Inline Session Editor */}
                      {isEditing && (
                        <SessionInlineEditor
                          dog={dog}
                          session={session}
                          sessionNumber={sessionNumber}
                          disciplines={disciplines}
                          disciplineCommands={disciplineCommands}
                          disciplineShortLabels={disciplineShortLabels}
                          onSave={handleSaveEditedSession}
                          onDelete={handleDeleteSession}
                          onCancel={() => setEditingSessionId(null)}
                        />
                      )}

                      {/* Optional Expanded Homework & Next Session Plan for this historical session */}
                      {isExpanded && !isEditing && (
                        <div className="pt-3 space-y-4 border-t border-[#1f1b16]/[0.07]">
                          <HomeworkCard dog={dog} session={session} />
                          <NextSessionCard plan={session.nextSessionPlan} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION B: ВЕДОМОСТЬ НАВЫКОВ ПО ВСЕМ ДИСЦИПЛИНАМ */}
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1f1b16]/10">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-serif text-[23px] leading-tight font-medium text-[#1f1b16]">
                  Ведомость навыков
                </h2>
                <span className="font-mono text-[12px] tabular-nums text-[#7b7266]">
                  {dog.skills.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[11.5px] text-[#7b7266]">
                  Наведите для оценки <kbd className="keycap">1–5</kbd>
                </span>
                <button
                  type="button"
                  onClick={onAddSkill}
                  className="h-8 px-2.5 rounded-[8px] border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] text-[12.5px] font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="size-3.5 text-[#1f5c3a]" strokeWidth={1.75} />
                  <span>Навык</span>
                </button>
              </div>
            </div>

            {skillGroups.length === 0 ? (
              <div className="py-7 px-5 text-center rounded-[14px] border border-[#1f1b16]/10 bg-[#f7f4ee]/70">
                <p className="text-[13px] text-[#5e554a] mb-3">
                  В ведомость собаки «{dog.name}» ещё не добавлены команды или нормативы
                </p>
                <button
                  type="button"
                  onClick={onAddSkill}
                  className="h-8 px-3.5 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="size-3.5" strokeWidth={1.5} />
                  <span>Добавить навыки</span>
                </button>
              </div>
            ) : (
              <div className="space-y-7">
                {skillGroups.map((group) => (
                  <div key={String(group.category)}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[12.5px] font-medium text-[#5e554a]">
                        {group.title} ({group.skills.length})
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[12px] tabular-nums font-medium',
                          group.average >= 80 ? 'text-[#1f5c3a]' : 'text-[#5e554a]'
                        )}
                      >
                        Средний {group.average}%
                      </span>
                    </div>

                    <div className="divide-y divide-[#1f1b16]/[0.05]">
                      {group.skills.map((skill) => (
                        <RaycastSkillRow
                          key={skill.id}
                          skill={skill}
                          onQuickScore={handleQuickScore}
                          onDelete={handleDeleteSkill}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols): Analytics Chart + Cozy Handmade Craft Field Note */}
        <div className="lg:col-span-5 space-y-6">
          <AnalyticsChart
            dog={dog}
            sessions={sessions}
            onStartTraining={onStartTraining}
            className="border border-[#1f1b16]/10 bg-[#fdfbf7] rounded-2xl p-5"
          />
          <HomeworkCard dog={dog} session={activeHomeworkSession} />
          <NextSessionCard plan={activeHomeworkSession.nextSessionPlan} />
        </div>
      </div>
    </div>
  );
};

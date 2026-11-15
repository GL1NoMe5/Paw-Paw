import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Edit3,
  Trash2,
  Plus,
  Play,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  TrendingUp,
  FileText,
} from 'lucide-react';
import type { Dog, DogSkill, SkillScoreRecord, TrainingSession } from '../../types';
import {
  formatDogAgeRussian,
  calculateOverallDogIndex,
  calculateNewMastery,
  getDogRank,
  DISTRACTION_LABELS,
} from '../../utils/calculations';
import {
  formatReportForClipboard,
  generateSmartHomework,
  generateNextSessionPlan,
} from '../../utils/homeworkGenerator';
import { HomeworkCard } from '../training/HomeworkCard';
import { NextSessionCard } from '../training/NextSessionCard';
import { AnalyticsChart } from '../analytics/AnalyticsChart';
import { cn } from '../../utils/cn';
import { useDogStore } from '../../store/useDogStore';

export interface DogDossierProps {
  dog: Dog;
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

const RaycastSkillRow: React.FC<{
  skill: DogSkill;
  onQuickScore: (skill: DogSkill, score: number) => void;
  onDelete: (skill: DogSkill) => void;
}> = ({ skill, onQuickScore, onDelete }) => {
  const clamped = Math.max(0, Math.min(100, skill.mastery));
  const dotColor =
    clamped >= 80
      ? 'bg-[#2b5b3f]'
      : clamped >= 50
      ? 'bg-[#b86b24]'
      : 'bg-[#968b7c]';

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
      {/* Left: Dot + Skill Name (never truncated) + subtle description */}
      <div className="min-w-0 flex items-baseline gap-2.5 flex-1 pr-2">
        <span className={cn('size-1.5 rounded-full flex-shrink-0 self-center', dotColor)} />
        <span className="text-[13.5px] font-medium text-[#221c15] flex-shrink-0">
          {skill.name}
        </span>
        {skill.description && (
          <span className="hidden sm:inline text-[12px] text-[#968b7c] truncate min-w-0">
            {skill.description}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(skill);
          }}
          className="opacity-0 group-hover:opacity-100 text-[#968b7c] hover:text-[#b93829] transition-opacity ml-1 flex-shrink-0 self-center"
          title="Удалить навык из карточки"
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Right: Hover-only Raycast Keycaps (1..5) + Calm Progress Bar + Mono Value */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Raycast Keycaps: hidden at rest, revealed on row hover or keyboard focus */}
        <div
          className="hidden group-hover:flex group-focus-within:flex items-center gap-1 mr-1"
          role="group"
          aria-label={`Быстрая оценка навыка ${skill.name}`}
        >
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = skill.lastScore === score;
            return (
              <button
                key={score}
                type="button"
                onClick={() => onQuickScore(skill, score)}
                title={`Оценить «${skill.name}» на ${score} из 5`}
                className={cn('keycap hover:text-[#221c15]', isSelected && 'keycap-active')}
              >
                {score}
              </button>
            );
          })}
        </div>

        {/* Minimal thin Craft/Raycast progress bar */}
        <div className="w-16 sm:w-20 h-1.5 rounded-full bg-[#221c15]/[0.07] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              clamped >= 80 ? 'bg-[#2b5b3f]' : clamped >= 50 ? 'bg-[#63594c]' : 'bg-[#968b7c]'
            )}
            style={{ width: `${clamped}%` }}
          />
        </div>

        {/* Tabular Percentage */}
        <span className="w-9 text-right font-mono text-[12px] font-medium tabular-nums text-[#63594c] group-hover:text-[#221c15]">
          {skill.mastery}%
        </span>
      </div>
    </div>
  );
};

export const DogDossier: React.FC<DogDossierProps> = ({
  dog,
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

  const [activeTab, setActiveTab] = useState<'skills' | 'history'>('skills');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const deleteDog = useDogStore((s) => s.deleteDog);
  const deleteSkill = useDogStore((s) => s.deleteSkill);
  const sessions = useDogStore((s) => s.sessions);

  const dogSessions = useMemo(
    () => sessions.filter((s) => s.dogId === dog.id),
    [sessions, dog.id]
  );

  const sortedSessions = useMemo(
    () =>
      [...dogSessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [dogSessions]
  );

  const { overallIndex, okdIndex, behaviorIndex } = calculateOverallDogIndex(dog.skills);
  const dogRank = getDogRank(overallIndex);
  const motivationLabel = MOTIVATION_LABELS[dog.motivationType] || MOTIVATION_LABELS.food;

  const okdSkills = dog.skills.filter((s) => s.category === 'okd');
  const behaviorSkills = dog.skills.filter((s) => s.category === 'behavior');

  const showAvatar = Boolean(dog.avatar && !imgError);

  const activeHomeworkSession = useMemo(() => {
    if (sortedSessions[0]) {
      return sortedSessions[0];
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
      previousMastery: s.mastery,
      newMastery: s.mastery,
    }));

    return {
      date: dog.updatedAt || dog.createdAt || new Date().toISOString(),
      durationMinutes: dog.dailyTrainingTime || 30,
      distractionLevel: 'quiet_yard' as const,
      scores: synthesizedScores,
      homework: generateSmartHomework(dog, synthesizedScores),
      nextSessionPlan: generateNextSessionPlan(dog, synthesizedScores, 'quiet_yard'),
    };
  }, [sortedSessions, dog]);

  const handleQuickScore = (skill: DogSkill, score: number) => {
    const newMastery = calculateNewMastery(skill.mastery, score, 'quiet_yard');
    useDogStore.getState().updateSkill(dog.id, skill.id, {
      mastery: newMastery,
      lastScore: score,
      lastUpdated: new Date().toISOString(),
    });
    toast.success(`${skill.name}: оценка ${score}/5 (${newMastery}%)`);
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
        description: `Занятие от ${new Date(session.date).toLocaleDateString('ru-RU')}`,
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
    <div className="text-[#221c15] pb-14">
      {/* 1. COZY CRAFT DOCUMENT HEADER */}
      <div className="px-7 sm:px-11 pt-8 pb-6 bg-gradient-to-b from-[#f6efe3]/70 to-transparent border-b border-[#221c15]/[0.07]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Tactile Photo + Serif Document Title */}
          <div className="flex items-start gap-5">
            <div className="relative size-[76px] rounded-[18px] overflow-hidden bg-[#ebe3d7] ring-1 ring-[#221c15]/10 shadow-[0_6px_16px_-4px_rgba(34,28,21,0.12)] flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-serif text-xl font-medium text-[#63594c]">
                  {dog.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-[34px] sm:text-[38px] font-medium text-[#221c15] leading-[1.05] tracking-[-0.02em]">
                  {dog.name}
                </h1>
                {dog.certificateIssued && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2b5b3f]/10 text-[#2b5b3f] text-[11px] font-medium">
                    Диплом ОКД
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#63594c]">
                <span>{dog.gender === 'male' ? 'Кобель' : 'Сука'}</span>
                <span className="text-[#968b7c]">·</span>
                <span>{dog.breed}</span>
                <span className="text-[#968b7c]">·</span>
                <span className="font-mono text-[12px] tabular-nums text-[#221c15]">
                  {formatDogAgeRussian(dog.birthDate)}
                </span>
                <span className="text-[#968b7c]">·</span>
                <span className="font-mono text-[12px] tabular-nums text-[#63594c]">
                  {dog.weight} кг
                </span>
              </div>
            </div>
          </div>

          {/* Right: Editorial Index Score + Raycast Action Bar */}
          <div className="flex flex-col lg:items-end justify-between gap-3.5">
            <div className="flex items-baseline lg:justify-end gap-3">
              <div className="lg:text-right">
                <span className="text-[12px] font-medium text-[#2b5b3f] block">
                  {dogRank.title}
                </span>
                <div className="w-36 h-1.5 rounded-full bg-[#221c15]/[0.08] overflow-hidden mt-1.5 lg:ml-auto">
                  <div
                    className="h-full rounded-full bg-[#2b5b3f] transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, overallIndex))}%` }}
                  />
                </div>
              </div>
              <span className="font-serif text-[38px] leading-none font-medium text-[#221c15] tabular-nums">
                {overallIndex}%
              </span>
            </div>

            {/* Sleek Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onStartTraining}
                className="h-9 px-3.5 rounded-[10px] bg-[#221c15] hover:bg-[#362d23] text-[#fffcf8] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-[0_2px_6px_rgba(34,28,21,0.12)]"
              >
                <Play className="size-3.5 fill-current" strokeWidth={1.5} />
                <span>Начать занятие</span>
              </button>

              {onOpenCertificate && (
                <button
                  type="button"
                  onClick={onOpenCertificate}
                  className="h-9 px-3 rounded-[10px] bg-[#f4ede2]/80 hover:bg-[#ebe2d4] text-[#221c15] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="size-3.5 text-[#63594c]" strokeWidth={1.5} />
                  <span>Диплом А4</span>
                </button>
              )}

              {onOpenAnalytics && (
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="h-9 px-3 rounded-[10px] hover:bg-[#221c15]/[0.05] text-[#63594c] hover:text-[#221c15] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <TrendingUp className="size-3.5 text-[#968b7c]" strokeWidth={1.5} />
                  <span>Аналитика</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEditDog}
                className="h-9 px-2.5 rounded-[10px] hover:bg-[#221c15]/[0.05] text-[#63594c] hover:text-[#221c15] text-[13px] inline-flex items-center gap-1.5 transition-colors"
                title="Редактировать карточку"
              >
                <Edit3 className="size-3.5 text-[#968b7c]" strokeWidth={1.5} />
                <span>Анкета</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteDog}
                className="size-9 rounded-[10px] hover:bg-[#b93829]/10 text-[#968b7c] hover:text-[#b93829] inline-flex items-center justify-center transition-colors"
                title="Удалить карточку собаки"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Craft Page Properties (Borderless Notion/Craft-style metadata rows) */}
        <div className="mt-6 pt-5 border-t border-[#221c15]/[0.06] grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-[13px]">
          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#968b7c]">Владелец</span>
            <div className="min-w-0 flex items-center gap-2.5 flex-wrap text-[#221c15]">
              <span className="font-medium">{dog.ownerName || '—'}</span>
              {dog.ownerPhone && (
                <a
                  href={`tel:${dog.ownerPhone}`}
                  className="font-mono text-[12px] text-[#63594c] hover:text-[#221c15] hover:underline tabular-nums"
                >
                  {dog.ownerPhone}
                </a>
              )}
              {dog.ownerTelegram && (
                <a
                  href={`https://t.me/${dog.ownerTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-[#2b5b3f] hover:underline"
                >
                  {dog.ownerTelegram}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#968b7c]">Мотивация</span>
            <span className="text-[#221c15] truncate">
              {motivationLabel} ·{' '}
              <span className="font-mono text-[12px] tabular-nums">{dog.dailyTrainingTime} мин/день</span>
              {dog.favoriteTreats ? ` · ${dog.favoriteTreats}` : ''}
            </span>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#968b7c]">Особенности</span>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className={cn(hasAllergyAlert ? 'text-[#b93829] font-medium' : 'text-[#63594c]')}>
                Аллергия: {dog.allergies || 'Нет'}
              </span>
              <span className="text-[#968b7c]">·</span>
              <span className="text-[#63594c] truncate">
                Триггеры: {dog.triggers || 'Не выявлены'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 py-0.5">
            <span className="w-28 flex-shrink-0 text-[#968b7c]">Заметка</span>
            <span className="text-[#63594c] line-clamp-1" title={dog.notes}>
              {dog.notes || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN CRAFT SHEET BODY */}
      <div className="px-7 sm:px-11 pt-7 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN (7 cols): Raycast Skill List OR Dynamics & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Raycast-style Segmented Bar + Add Skill */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#221c15]/[0.07]">
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[#f4ede2]/80">
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={cn(
                  'px-3 py-1 rounded-[7px] text-[12.5px] font-medium transition-all',
                  activeTab === 'skills'
                    ? 'bg-[#fffcf8] text-[#221c15] shadow-[0_1px_2px_rgba(34,28,21,0.08)]'
                    : 'text-[#63594c] hover:text-[#221c15]'
                )}
              >
                Навыки ({dog.skills.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-3 py-1 rounded-[7px] text-[12.5px] font-medium transition-all',
                  activeTab === 'history'
                    ? 'bg-[#fffcf8] text-[#221c15] shadow-[0_1px_2px_rgba(34,28,21,0.08)]'
                    : 'text-[#63594c] hover:text-[#221c15]'
                )}
              >
                Динамика и журнал ({sortedSessions.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'skills' && (
                <span className="hidden sm:inline text-[11.5px] text-[#968b7c]">
                  Наведите для оценки <kbd className="font-mono">1–5</kbd>
                </span>
              )}
              <button
                type="button"
                onClick={onAddSkill}
                className="h-8 px-2.5 rounded-[8px] hover:bg-[#221c15]/[0.05] text-[#63594c] hover:text-[#221c15] text-[12.5px] font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="size-3.5" strokeWidth={1.5} />
                <span>Навык</span>
              </button>
            </div>
          </div>

          {activeTab === 'skills' ? (
            <div className="space-y-7">
              {/* Group 1: Курс ОКД */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[12px] font-medium text-[#968b7c]">
                    Курс ОКД ({okdSkills.length})
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-[#2b5b3f] font-medium">
                    Средний {okdIndex}%
                  </span>
                </div>

                {okdSkills.length === 0 ? (
                  <div className="py-4 text-[13px] text-[#968b7c] flex items-center justify-between">
                    <span>Нормативы курса ОКД ещё не добавлены</span>
                    <button
                      type="button"
                      onClick={onAddSkill}
                      className="text-[#221c15] font-medium hover:underline"
                    >
                      Добавить
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#221c15]/[0.04]">
                    {okdSkills.map((skill) => (
                      <RaycastSkillRow
                        key={skill.id}
                        skill={skill}
                        onQuickScore={handleQuickScore}
                        onDelete={handleDeleteSkill}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Group 2: Коррекция поведения (shown when present) */}
              {behaviorSkills.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[12px] font-medium text-[#968b7c]">
                      Коррекция поведения ({behaviorSkills.length})
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-[#63594c] font-medium">
                      Средний {behaviorIndex}%
                    </span>
                  </div>

                  <div className="divide-y divide-[#221c15]/[0.04]">
                    {behaviorSkills.map((skill) => (
                      <RaycastSkillRow
                        key={skill.id}
                        skill={skill}
                        onQuickScore={handleQuickScore}
                        onDelete={handleDeleteSkill}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quiet footer link to open full dynamics & session history */}
              {sortedSessions.length > 0 && (
                <div className="pt-3 border-t border-[#221c15]/[0.06] flex items-center justify-between text-[12.5px] text-[#63594c]">
                  <span>
                    В архиве записано {sortedSessions.length}{' '}
                    {sortedSessions.length === 1
                      ? 'занятие'
                      : sortedSessions.length < 5
                      ? 'занятия'
                      : 'занятий'}{' '}
                    (последнее —{' '}
                    {new Date(sortedSessions[0].date).toLocaleDateString('ru-RU')})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-[#221c15] font-medium hover:underline"
                  >
                    Открыть график и журнал →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: DYNAMICS & JOURNAL */
            <div className="space-y-7">
              <AnalyticsChart
                dog={dog}
                sessions={sessions}
                onStartTraining={onStartTraining}
                className="border-0 bg-[#f8f3eb]/70 rounded-[14px] p-5"
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-[18px] font-medium text-[#221c15]">
                    Журнал проведённых занятий
                  </h3>
                  <span className="font-mono text-[12px] text-[#968b7c] tabular-nums">
                    Всего: {sortedSessions.length}
                  </span>
                </div>

                {sortedSessions.length === 0 ? (
                  <div className="py-8 text-center rounded-[14px] bg-[#f8f3eb]/60">
                    <p className="text-[13px] text-[#63594c] mb-3">
                      Для собаки «{dog.name}» ещё не записано ни одного занятия
                    </p>
                    <button
                      type="button"
                      onClick={onStartTraining}
                      className="h-9 px-4 rounded-[10px] bg-[#221c15] text-[#fffcf8] text-[13px] font-medium inline-flex items-center gap-1.5"
                    >
                      <Play className="size-3.5" strokeWidth={1.5} />
                      <span>Записать первое занятие</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#221c15]/[0.07]">
                    {sortedSessions.map((session) => {
                      const isExpanded = expandedSessionId === session.id;
                      const isCopied = copiedSessionId === session.id;
                      const distractionInfo = DISTRACTION_LABELS[session.distractionLevel] || {
                        label: session.distractionLevel,
                        multiplier: 1.0,
                        description: '',
                      };

                      return (
                        <div key={session.id} className="py-4 space-y-2.5">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-[13px]">
                              <span className="font-mono font-medium tabular-nums text-[#221c15]">
                                {new Date(session.date).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="text-[#968b7c]">·</span>
                              <span className="text-[#63594c]">{distractionInfo.label}</span>
                              <span className="text-[#968b7c]">·</span>
                              <span className="font-mono text-[12px] text-[#2b5b3f] font-medium tabular-nums">
                                Индекс {session.overallIndexSnapshot}%
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyHistoryReport(session)}
                                className={cn(
                                  'h-7 px-2.5 rounded-[7px] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors',
                                  isCopied
                                    ? 'bg-[#2b5b3f] text-[#fffcf8]'
                                    : 'bg-[#f4ede2] hover:bg-[#e8dfd1] text-[#221c15]'
                                )}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="size-3" strokeWidth={1.75} />
                                    <span>Скопировано</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3 text-[#63594c]" strokeWidth={1.5} />
                                    <span>В Telegram</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSessionId(isExpanded ? null : session.id)
                                }
                                className="h-7 px-2 rounded-[7px] hover:bg-[#221c15]/[0.05] text-[#63594c] text-[12px] inline-flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Скрыть' : 'Детали'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="size-3.5" strokeWidth={1.5} />
                                ) : (
                                  <ChevronDown className="size-3.5" strokeWidth={1.5} />
                                )}
                              </button>
                            </div>
                          </div>

                          {session.trainerNotes && (
                            <p className="text-[13px] text-[#63594c] leading-relaxed">
                              {session.trainerNotes}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="pt-3 space-y-4">
                              <HomeworkCard dog={dog} session={session} />
                              <NextSessionCard plan={session.nextSessionPlan} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Cozy Handmade Craft Field Note */}
        <div className="lg:col-span-5 space-y-6">
          <HomeworkCard dog={dog} session={activeHomeworkSession} />
          <NextSessionCard plan={activeHomeworkSession.nextSessionPlan} />
        </div>
      </div>
    </div>
  );
};

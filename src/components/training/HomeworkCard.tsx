import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DoorOpen,
  Home,
  Pencil,
  Plus,
  Trees,
  Wand2,
  X,
} from 'lucide-react';
import type {
  CustomHomeworkSections,
  DistractionLevel,
  Dog,
  GeneratedHomework,
  NextSessionPlan,
  SkillScoreRecord,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import {
  buildDefaultHomeworkSections,
  formatReportForClipboard,
} from '../../utils/homeworkGenerator';
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

type HomeworkSectionKey = keyof CustomHomeworkSections;

interface SectionDescriptor {
  key: HomeworkSectionKey;
  label: string;
  hint: string;
  placeholder: string;
  Icon: React.FC<{ className?: string; strokeWidth?: number }>;
}

const HOMEWORK_SECTIONS: SectionDescriptor[] = [
  {
    key: 'atHome',
    label: 'Дома',
    hint: 'Короткие подходы в спокойной обстановке без уличных раздражителей',
    placeholder: 'Например: • «Сидеть» — 3 коротких повтора перед кормлением...',
    Icon: Home,
  },
  {
    key: 'beforeWalk',
    label: 'Перед прогулкой',
    hint: 'Спокойные сборы, пристёгивание поводка и выдержка у входной двери',
    placeholder: 'Например: • Посадка у порога на 5–10 секунд перед открытием двери...',
    Icon: DoorOpen,
  },
  {
    key: 'onWalk',
    label: 'На прогулке',
    hint: 'Контакт, подзыв и отработка навыков при реальных раздражителях',
    placeholder: 'Например: • «Ко мне» — 3 коротких повтора на длинном поводке...',
    Icon: Trees,
  },
];

const SECTION_LABELS: Record<HomeworkSectionKey, string> = {
  atHome: 'Дома',
  beforeWalk: 'Перед прогулкой',
  onWalk: 'На прогулке',
};

function cleanUiCopy(text: string): string {
  return text.replace(/^[^\p{L}\p{N}«"(\d]+/u, '').replace(/!+/g, '.');
}

function hasNonEmptySection(sections?: CustomHomeworkSections): boolean {
  return Boolean(
    sections &&
      (sections.atHome.trim() || sections.beforeWalk.trim() || sections.onWalk.trim())
  );
}

interface AutoSizedTextareaProps {
  id?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  isActive: boolean;
}

const AutoSizedTextarea: React.FC<AutoSizedTextareaProps> = ({
  id,
  value,
  placeholder,
  onChange,
  onFocus,
  textareaRef,
  isActive,
}) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(84, el.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      id={id}
      ref={(el) => {
        localRef.current = el;
        textareaRef(el);
      }}
      rows={3}
      value={value}
      placeholder={placeholder}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(e.target.value);
        const el = e.currentTarget;
        el.style.height = 'auto';
        el.style.height = `${Math.max(84, el.scrollHeight)}px`;
      }}
      className={cn(
        'w-full min-h-[84px] p-3 rounded-xl border bg-[var(--bg-sheet)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] leading-relaxed resize-none overflow-hidden focus:outline-none transition-colors',
        isActive
          ? 'border-[var(--accent-forest)] ring-1 ring-[#286144]/20 dark:ring-[#58b482]/25'
          : 'border-[var(--border-subtle)] focus:border-[var(--border-strong)]'
      )}
    />
  );
};

export const HomeworkCard: React.FC<HomeworkCardProps> = ({ dog, session, className }) => {
  const storeDog = useDogStore((s) => s.dogs.find((d) => d.id === dog.id));
  const updateDogHomework = useDogStore((s) => s.updateDogHomework);
  const currentDog = storeDog ?? dog;
  const { homework } = session;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAutoDetails, setShowAutoDetails] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeworkSectionKey>('atHome');
  const [prevDogId, setPrevDogId] = useState(dog.id);

  const hasCustomDogHomework = hasNonEmptySection(currentDog.customHomework);

  const viewSections = useMemo<CustomHomeworkSections>(() => {
    if (hasNonEmptySection(currentDog.customHomework)) {
      return {
        atHome: currentDog.customHomework?.atHome ?? '',
        beforeWalk: currentDog.customHomework?.beforeWalk ?? '',
        onWalk: currentDog.customHomework?.onWalk ?? '',
      };
    }
    if (hasNonEmptySection(homework.customSections)) {
      return {
        atHome: homework.customSections?.atHome ?? '',
        beforeWalk: homework.customSections?.beforeWalk ?? '',
        onWalk: homework.customSections?.onWalk ?? '',
      };
    }
    return buildDefaultHomeworkSections(currentDog, homework);
  }, [currentDog, homework]);

  const [draft, setDraft] = useState<CustomHomeworkSections>(() => ({ ...viewSections }));

  if (dog.id !== prevDogId) {
    setPrevDogId(dog.id);
    setIsEditing(false);
    setActiveSection('atHome');
    setShowAutoDetails(false);
    setDraft({ ...viewSections });
  }

  const textareaRefs = useRef<Record<HomeworkSectionKey, HTMLTextAreaElement | null>>({
    atHome: null,
    beforeWalk: null,
    onWalk: null,
  });

  const handleOpenEditor = () => {
    setDraft({ ...viewSections });
    setActiveSection('atHome');
    setIsEditing(true);
  };

  const handleCancelEditor = () => {
    setIsEditing(false);
  };

  const handleAutofill = () => {
    const generated = buildDefaultHomeworkSections(currentDog, homework);
    setDraft(generated);
    toast.success('Блоки заполнены автоподбором по итогам занятия');
  };

  const handleInsertSkill = (skillName: string) => {
    const snippet = `• «${skillName}» — 3 коротких повтора`;
    setDraft((prev) => {
      const currentText = prev[activeSection];
      const trimmedEnd = currentText.replace(/\s+$/, '');
      const nextText = trimmedEnd ? `${trimmedEnd}\n${snippet}` : snippet;
      return {
        ...prev,
        [activeSection]: nextText,
      };
    });

    requestAnimationFrame(() => {
      const targetEl = textareaRefs.current[activeSection];
      if (targetEl) {
        targetEl.focus();
        const len = targetEl.value.length;
        targetEl.setSelectionRange(len, len);
      }
    });
  };

  const handleSaveHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: CustomHomeworkSections = {
      atHome: draft.atHome.trim(),
      beforeWalk: draft.beforeWalk.trim(),
      onWalk: draft.onWalk.trim(),
    };
    updateDogHomework(currentDog.id, cleaned);
    setIsEditing(false);

    if (hasNonEmptySection(cleaned)) {
      toast.success('Домашнее задание сохранено');
    } else {
      toast.success('Индивидуальное ДЗ очищено — используется автоподбор');
    }
  };

  const handleCopyReport = async () => {
    try {
      const sectionsForReport = isEditing ? draft : viewSections;
      const dogForReport: Dog = hasNonEmptySection(sectionsForReport)
        ? { ...currentDog, customHomework: sectionsForReport }
        : currentDog;
      const text = formatReportForClipboard(dogForReport, session);

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
    <section className={cn('craft-note p-5 sm:p-6 space-y-5 text-[var(--text-primary)]', className)}>
      {/* Craft Handmade Note Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-[24px] leading-tight text-[var(--text-primary)]">
              Домашняя тетрадь
            </h3>
            {hasCustomDogHomework && !isEditing && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#286144]/10 dark:bg-[#58b482]/15 border border-[#286144]/20 dark:border-[#58b482]/30 text-[var(--accent-forest)]">
                Редакция кинолога
              </span>
            )}
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            {homework.dailyPlanSummary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={isEditing ? handleCancelEditor : handleOpenEditor}
            className={cn(
              'h-8 px-3 rounded-[9px] border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap',
              isEditing
                ? 'bg-[var(--bg-sheet)] border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {isEditing ? (
              <>
                <X className="size-3.5 stroke-[1.6]" />
                <span>Закрыть редактор</span>
              </>
            ) : (
              <>
                <Pencil className="size-3.5 stroke-[1.6] text-[var(--text-secondary)]" />
                <span>Составить / изменить ДЗ</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className={cn(
              'h-8 px-3 rounded-[9px] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0 whitespace-nowrap',
              copied
                ? 'bg-[var(--accent-forest)] text-[#fffcf8] dark:text-[#12100e]'
                : 'bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)]'
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
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveHomework} className="space-y-4">
          {/* Quick-insert command chips from dog.skills */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-sheet)] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                Быстрая вставка в блок{' '}
                <span className="text-[var(--accent-forest)]">
                  «{SECTION_LABELS[activeSection]}»
                </span>
              </span>
              <button
                type="button"
                onClick={handleAutofill}
                className="h-7 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Wand2 className="size-3.5 text-[var(--accent-ochre)]" strokeWidth={1.6} />
                <span>Заполнить автоподбором</span>
              </button>
            </div>

            {currentDog.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {currentDog.skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleInsertSkill(skill.name)}
                    title={`Вставить «${skill.name}» в блок «${SECTION_LABELS[activeSection]}»`}
                    className="h-7 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="size-3 text-[var(--accent-forest)]" strokeWidth={1.8} />
                    <span>{skill.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Навыки в карточке собаки пока не добавлены — вы можете ввести задания вручную.
              </p>
            )}
          </div>

          {/* 3 Structured Editable Blocks */}
          <div className="space-y-3.5">
            {HOMEWORK_SECTIONS.map(({ key, label, hint, placeholder, Icon }) => {
              const isActive = activeSection === key;
              const fieldId = `hw-${currentDog.id}-${key}`;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={fieldId}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-primary)] cursor-pointer"
                    >
                      <Icon
                        className={cn(
                          'size-4',
                          isActive ? 'text-[var(--accent-forest)]' : 'text-[var(--text-secondary)]'
                        )}
                        strokeWidth={1.6}
                      />
                      <span>{label}</span>
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                      {hint}
                    </span>
                  </div>

                  <AutoSizedTextarea
                    id={fieldId}
                    value={draft[key]}
                    placeholder={placeholder}
                    isActive={isActive}
                    onFocus={() => setActiveSection(key)}
                    onChange={(nextVal) =>
                      setDraft((prev) => ({
                        ...prev,
                        [key]: nextVal,
                      }))
                    }
                    textareaRef={(el) => {
                      textareaRefs.current[key] = el;
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Editor Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCancelEditor}
              className="h-8 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="h-8 px-3.5 rounded-lg bg-[var(--accent-forest)] hover:opacity-90 text-[#fffcf8] dark:text-[#12100e] text-[12px] font-medium inline-flex items-center gap-1.5 transition-opacity"
            >
              <Check className="size-3.5" strokeWidth={1.8} />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode: 3 Structured Homework Blocks */
        <div className="space-y-4">
          <div className="divide-y divide-[var(--border-hairline)]">
            {HOMEWORK_SECTIONS.map(({ key, label, Icon }) => {
              const content = viewSections[key]?.trim();
              return (
                <div key={key} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="size-4 text-[var(--accent-forest)] flex-shrink-0"
                      strokeWidth={1.6}
                    />
                    <h4 className="text-[13.5px] font-medium text-[var(--text-primary)]">
                      {label}
                    </h4>
                  </div>

                  {content ? (
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line pl-6">
                      {content}
                    </p>
                  ) : (
                    <p className="text-[12.5px] text-[var(--text-muted)] italic pl-6">
                      Не указано для этого этапа
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Collapsible Auto-Matched Exercise Breakdown */}
          {homework.exercises.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setShowAutoDetails((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 text-left text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1"
              >
                <span>
                  Методические подсказки по командам ({homework.exercises.length})
                </span>
                {showAutoDetails ? (
                  <ChevronUp className="size-3.5 flex-shrink-0" strokeWidth={1.6} />
                ) : (
                  <ChevronDown className="size-3.5 flex-shrink-0" strokeWidth={1.6} />
                )}
              </button>

              {showAutoDetails && (
                <div className="mt-2.5 divide-y divide-[var(--border-hairline)] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-sheet)] p-3.5">
                  {homework.exercises.map((exercise, idx) => (
                    <div
                      key={`${exercise.skillId}_${idx}`}
                      className="py-2.5 first:pt-0 last:pb-0 space-y-1"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-mono tabular-nums text-[11.5px] text-[var(--text-muted)]">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                            {exercise.skillName}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-[11.5px] text-[var(--text-secondary)] flex-shrink-0">
                          {exercise.recommendedSets}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed pl-6">
                        {cleanUiCopy(exercise.instruction)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calm Finisher Line */}
          {homework.positiveFinisher && (
            <div className="pt-4 border-t border-[var(--border-hairline)] space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[13px] flex-wrap">
                <span className="text-[var(--accent-forest)] font-medium">
                  Завершать каждый подход
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  «{homework.positiveFinisher.skillName}»
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                {cleanUiCopy(homework.positiveFinisher.instruction)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

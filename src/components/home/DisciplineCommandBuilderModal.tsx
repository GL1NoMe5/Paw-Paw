import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  DisciplineCommandTemplate,
  DogSkill,
  SkillCategory,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';
import { getRussianPlural } from '../../utils/calculations';

export interface DisciplineCommandBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: SkillCategory;
}

const TAB_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Активный спорт',
  behavior: 'Коррекция поведения',
};

interface BuilderBodyProps {
  initialCategory: SkillCategory;
  onClose: () => void;
}

const BuilderBody: React.FC<BuilderBodyProps> = ({ initialCategory, onClose }) => {
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);
  const dogs = useDogStore((s) => s.dogs);
  const addDisciplineCommand = useDogStore((s) => s.addDisciplineCommand);
  const updateDisciplineCommand = useDogStore((s) => s.updateDisciplineCommand);
  const deleteDisciplineCommand = useDogStore((s) => s.deleteDisciplineCommand);
  const resetDisciplineCommands = useDogStore((s) => s.resetDisciplineCommands);
  const updateDog = useDogStore((s) => s.updateDog);

  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(initialCategory);

  // Add new command draft
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Optional sync-to-dog target
  const [syncDogId, setSyncDogId] = useState<string>(dogs[0]?.id ?? '');
  const effectiveSyncDogId = dogs.some((d) => d.id === syncDogId)
    ? syncDogId
    : (dogs[0]?.id ?? '');

  const currentDiscipline =
    disciplines.find((d) => d.id === selectedCategory) ?? disciplines[0];
  const commands = disciplineCommands[String(selectedCategory)] ?? [];

  const handleSelectTab = (category: SkillCategory) => {
    setSelectedCategory(category);
    setEditingId(null);
  };

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error('Введите название команды');
      return;
    }

    const created = addDisciplineCommand(selectedCategory, {
      name: trimmedName,
      description: newDescription.trim(),
    });
    setNewName('');
    setNewDescription('');
    toast.success(`Команда «${created.name}» добавлена в набор`);
  };

  const handleStartEdit = (cmd: DisciplineCommandTemplate) => {
    setEditingId(cmd.id);
    setEditName(cmd.name);
    setEditDescription(cmd.description);
  };

  const handleSaveEdit = (commandId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error('Название команды не может быть пустым');
      return;
    }

    updateDisciplineCommand(selectedCategory, commandId, {
      name: trimmed,
      description: editDescription.trim(),
    });
    setEditingId(null);
    toast.success('Команда обновлена');
  };

  const handleDeleteCommand = (cmd: DisciplineCommandTemplate) => {
    deleteDisciplineCommand(selectedCategory, cmd.id);
    if (editingId === cmd.id) {
      setEditingId(null);
    }
    toast.success(`Команда «${cmd.name}» удалена из набора`);
  };

  const handleResetDefaults = () => {
    const label = TAB_LABELS[String(selectedCategory)] || currentDiscipline?.shortTitle || '';
    if (
      window.confirm(
        `Вернуть стандартный список команд для направления «${label}»? Ваши пользовательские команды этого раздела будут заменены на эталонные.`
      )
    ) {
      resetDisciplineCommands(selectedCategory);
      setEditingId(null);
      toast.info('Набор команд возвращён к стандартному составу');
    }
  };

  const handleSyncToDog = () => {
    const targetDog = dogs.find((d) => d.id === effectiveSyncDogId);
    if (!targetDog) return;

    const existingIds = new Set(targetDog.skills.map((s) => s.id));
    const existingCategoryNames = new Set(
      targetDog.skills
        .filter((s) => s.category === selectedCategory)
        .map((s) => s.name.trim().toLowerCase())
    );

    const commandsById = new Map(commands.map((cmd) => [cmd.id, cmd]));
    const commandsByName = new Map(
      commands.map((cmd) => [cmd.name.trim().toLowerCase(), cmd])
    );

    let updatedCount = 0;
    const syncedExistingSkills = targetDog.skills.map((skill) => {
      if (skill.category !== selectedCategory) return skill;
      const matched =
        commandsById.get(skill.id) ?? commandsByName.get(skill.name.trim().toLowerCase());
      if (!matched) return skill;

      const nextName = skill.id === matched.id ? matched.name : skill.name;
      const nextDesc = matched.description;
      if (skill.name !== nextName || (skill.description ?? '') !== nextDesc) {
        updatedCount += 1;
        return {
          ...skill,
          name: nextName,
          description: nextDesc,
        };
      }
      return skill;
    });

    const missing = commands.filter(
      (cmd) =>
        !existingIds.has(cmd.id) &&
        !existingCategoryNames.has(cmd.name.trim().toLowerCase())
    );

    if (missing.length === 0 && updatedCount === 0) {
      toast.info(`У ученика ${targetDog.name} уже актуальны все команды этого набора`);
      return;
    }

    const now = new Date().toISOString();
    const addedSkills: DogSkill[] = missing.map((cmd) => ({
      id: cmd.id,
      name: cmd.name,
      category: selectedCategory,
      mastery: 0,
      description: cmd.description,
      isCustom: cmd.isCustom ?? false,
      lastUpdated: now,
    }));

    updateDog(targetDog.id, {
      skills: [...syncedExistingSkills, ...addedSkills],
    });

    if (addedSkills.length > 0 && updatedCount > 0) {
      toast.success(
        `Подключено ${addedSkills.length} и обновлено ${updatedCount} команд для ${targetDog.name}`
      );
    } else if (addedSkills.length > 0) {
      toast.success(
        `Подключено ${addedSkills.length} ${getRussianPlural(
          addedSkills.length,
          'команда',
          'команды',
          'команд'
        )} для ${targetDog.name}`
      );
    } else {
      toast.success(`Обновлены описания команд (${updatedCount}) для ${targetDog.name}`);
    }
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      {/* Discipline Tabs */}
      <div className="px-6 pt-4 pb-3 border-b border-[var(--border-hairline)] bg-[var(--bg-note)] space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {disciplines.map((disc) => {
            const isActive = disc.id === selectedCategory;
            const count = disciplineCommands[String(disc.id)]?.length ?? 0;
            const label = TAB_LABELS[String(disc.id)] || disc.shortTitle;

            return (
              <button
                key={String(disc.id)}
                type="button"
                onClick={() => handleSelectTab(disc.id)}
                className={cn(
                  'h-9 px-3 rounded-[9px] text-[12.5px] font-medium inline-flex items-center gap-2 border transition-colors',
                  isActive
                    ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] border-[var(--btn-dark-bg)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isActive ? 'text-current opacity-75' : 'text-[var(--text-muted)]'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
          <div className="text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">{currentDiscipline?.title}</span>
            {currentDiscipline?.subtitle ? ` · ${currentDiscipline.subtitle}` : ''}
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RotateCcw strokeWidth={1.5} className="size-3.5" />
            <span>Сбросить к стандарту</span>
          </button>
        </div>
      </div>

      {/* Scrollable Middle: Add Form + Commands List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
        {/* Add New Command Form */}
        <form
          onSubmit={handleAddCommand}
          className="p-4 rounded-[14px] bg-[var(--bg-note)] border border-[var(--border-hairline)] space-y-3"
        >
          <div className="text-[12.5px] font-medium text-[var(--text-primary)]">
            Добавить новую команду в набор
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Название команды, например: Барьер 1 м"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-9 px-3 rounded-[9px] bg-[var(--bg-sheet)] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Критерий выполнения и подсказка для кинолога"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-[9px] bg-[var(--bg-sheet)] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-9 px-3 rounded-[9px] bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus strokeWidth={1.6} className="size-3.5" />
                <span>Добавить</span>
              </button>
            </div>
          </div>
        </form>

        {/* Master Command List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              Состав набора ({commands.length})
            </span>
          </div>

          {commands.length === 0 ? (
            <div className="py-10 text-center rounded-[14px] border border-dashed border-[var(--border-subtle)] text-[13px] text-[var(--text-secondary)]">
              В этом направлении пока нет команд. Добавьте первую выше или восстановите стандартный список
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-subtle)] rounded-[14px] bg-[var(--bg-sheet)] overflow-hidden">
              {commands.map((cmd, idx) => {
                const isEditing = editingId === cmd.id;

                if (isEditing) {
                  return (
                    <div key={cmd.id} className="p-3.5 bg-[var(--bg-note)] space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(cmd.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingId(null);
                            }
                          }}
                          placeholder="Название команды"
                          className="h-9 px-3 rounded-[8px] bg-[var(--bg-sheet)] border border-[var(--border-strong)] text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(cmd.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingId(null);
                            }
                          }}
                          placeholder="Описание / норматив"
                          className="h-9 px-3 rounded-[8px] bg-[var(--bg-sheet)] border border-[var(--border-strong)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-8 px-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-active)] text-[12px] text-[var(--text-secondary)] font-medium transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cmd.id)}
                          className="h-8 px-3 rounded-[8px] bg-[#286144] hover:bg-[#1f4f37] dark:bg-[#58b482] dark:hover:bg-[#4aa373] text-[#fffcf8] dark:text-[#12100e] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Check strokeWidth={1.6} className="size-3.5" />
                          <span>Сохранить</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cmd.id}
                    className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div className="min-w-0 flex items-start gap-3 flex-1">
                      <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)] pt-0.5 w-5 flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-[var(--text-primary)]">
                            {cmd.name}
                          </span>
                          {cmd.isCustom && (
                            <span className="px-1.5 py-0.5 rounded-[5px] bg-[#286144]/10 dark:bg-[#58b482]/15 text-[var(--accent-forest)] text-[10.5px] font-medium">
                              Своя
                            </span>
                          )}
                        </div>
                        {cmd.description && (
                          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                            {cmd.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cmd)}
                        title="Редактировать команду"
                        className="size-8 rounded-[8px] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
                      >
                        <Edit3 strokeWidth={1.5} className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCommand(cmd)}
                        title="Удалить команду из набора"
                        className="size-8 rounded-[8px] hover:bg-[#b84233]/10 dark:hover:bg-[#e37163]/15 text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] flex items-center justify-center transition-colors"
                      >
                        <Trash2 strokeWidth={1.5} className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Optional Sync to Existing Dog + Close */}
      <div className="px-6 py-3.5 border-t border-[var(--border-hairline)] bg-[var(--bg-note)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {dogs.length > 0 && commands.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={effectiveSyncDogId}
              onChange={(e) => setSyncDogId(e.target.value)}
              aria-label="Выбрать ученика для добавления набора команд"
              className="h-8 px-2.5 rounded-[8px] bg-[var(--bg-sheet)] border border-[var(--border-subtle)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              {dogs.map((dog) => (
                <option
                  key={dog.id}
                  value={dog.id}
                  className="bg-[var(--bg-sheet)] text-[var(--text-primary)]"
                >
                  {dog.name} ({dog.breed})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSyncToDog}
              className="h-8 px-3 rounded-[8px] bg-[var(--bg-sheet)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[12px] font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors"
            >
              <UserPlus strokeWidth={1.5} className="size-3.5 text-[var(--accent-forest)]" />
              <span>Добавить набор ученику</span>
            </button>
          </div>
        ) : (
          <div className="text-[12px] text-[var(--text-muted)]">
            Наборы применяются при создании ученика и на тренировке
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded-[9px] bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[13px] font-medium transition-colors self-end sm:self-auto"
        >
          Готово
        </button>
      </div>
    </div>
  );
};

export const DisciplineCommandBuilderModal: React.FC<
  DisciplineCommandBuilderModalProps
> = ({ open, onOpenChange, initialCategory = 'okd' }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 dark:bg-black/65 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-3xl max-h-[88vh] flex flex-col bg-[var(--bg-sheet)] rounded-[18px] border border-[var(--border-strong)] shadow-[0_14px_40px_rgba(34,28,21,0.14)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.65)] z-50 text-[var(--text-primary)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-hairline)]">
            <div>
              <Dialog.Title className="font-serif text-[22px] font-medium text-[var(--text-primary)] leading-tight">
                Конструктор наборов команд
              </Dialog.Title>
              <Dialog.Description className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                Добавляйте, изменяйте и упорядочивайте команды по всем четырём направлениям
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Закрыть конструктор"
                className="size-8 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X strokeWidth={1.5} className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {open && (
            <BuilderBody
              key={String(initialCategory)}
              initialCategory={initialCategory}
              onClose={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

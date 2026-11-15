import React, { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DisciplineCommandTemplate, DogSkill, SkillCategory } from '../../types';
import { DEFAULT_DISCIPLINES } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';

export interface SkillManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
}

const DISCIPLINE_TAB_LABELS: Record<string, string> = {
  okd: 'ОКД',
  zks: 'ЗКС',
  sport: 'Активный спорт',
  behavior: 'Коррекция поведения',
};

export const SkillManagerModal: React.FC<SkillManagerModalProps> = ({
  open,
  onOpenChange,
  dogId,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);
  const addSkillToDog = useDogStore((s) => s.addSkillToDog);
  const updateDog = useDogStore((s) => s.updateDog);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('okd');
  const [description, setDescription] = useState('');
  const [mastery, setMastery] = useState<number>(0);

  const dog = useMemo(() => dogs.find((d) => d.id === dogId), [dogs, dogId]);

  const disciplineTabs = useMemo(
    () => (disciplines.length > 0 ? disciplines : DEFAULT_DISCIPLINES),
    [disciplines]
  );

  const dogSkillIdSet = useMemo(
    () => new Set((dog?.skills ?? []).map((s) => s.id)),
    [dog]
  );
  const dogSkillNameSet = useMemo(
    () => new Set((dog?.skills ?? []).map((s) => s.name.trim().toLowerCase())),
    [dog]
  );

  const availableTemplates = useMemo(() => {
    const list = disciplineCommands[String(category)] ?? [];
    return list.filter(
      (cmd) =>
        !dogSkillIdSet.has(cmd.id) &&
        !dogSkillNameSet.has(cmd.name.trim().toLowerCase())
    );
  }, [disciplineCommands, category, dogSkillIdSet, dogSkillNameSet]);

  const handleQuickAttachTemplate = (cmd: DisciplineCommandTemplate) => {
    const clampedMastery = Math.max(0, Math.min(100, Number(mastery) || 0));
    if (dog) {
      const nextSkill: DogSkill = {
        id: cmd.id,
        name: cmd.name,
        category: cmd.category,
        description: cmd.description,
        mastery: clampedMastery,
        isCustom: Boolean(cmd.isCustom),
        lastUpdated: new Date().toISOString(),
      };
      updateDog(dog.id, { skills: [...dog.skills, nextSkill] });
    } else {
      addSkillToDog(dogId, {
        name: cmd.name,
        category: cmd.category,
        description: cmd.description,
        mastery: clampedMastery,
        isCustom: Boolean(cmd.isCustom),
        lastUpdated: new Date().toISOString(),
      });
    }
    toast.success(`Команда «${cmd.name}» добавлена в ведомость`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Введите название навыка');
      return;
    }

    const clampedMastery = Math.max(0, Math.min(100, Number(mastery) || 0));
    const trimmedName = name.trim();
    const matchedTemplate = (disciplineCommands[String(category)] ?? []).find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (matchedTemplate && dog && !dogSkillIdSet.has(matchedTemplate.id)) {
      const nextSkill: DogSkill = {
        id: matchedTemplate.id,
        name: trimmedName,
        category,
        description: description.trim() || matchedTemplate.description,
        mastery: clampedMastery,
        isCustom: Boolean(matchedTemplate.isCustom),
        lastUpdated: new Date().toISOString(),
      };
      updateDog(dog.id, { skills: [...dog.skills, nextSkill] });
    } else {
      addSkillToDog(dogId, {
        name: trimmedName,
        category,
        description: description.trim(),
        mastery: clampedMastery,
        isCustom: true,
        lastUpdated: new Date().toISOString(),
      });
    }

    toast.success(`Навык «${trimmedName}» добавлен в ведомость`);
    setName('');
    setDescription('');
    setMastery(0);
    onOpenChange(false);
  };

  const activeDiscInfo = disciplineTabs.find((d) => d.id === category);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#fdfbf7] rounded-2xl border border-[#1f1b16]/15 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-50 text-xs text-[#1f1b16]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1b16]/10">
            <div>
              <Dialog.Title className="font-serif text-lg font-medium text-[#1f1b16]">
                Добавить навык в ведомость
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#7b7266] mt-0.5">
                Выберите команду из сохранённых наборов или добавьте индивидуальный норматив
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="size-8 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] flex items-center justify-center text-[#7b7266] hover:text-[#1f1b16] transition-colors"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5 pt-4">
            {/* 4 Discipline Tabs */}
            <div>
              <label className="block font-medium text-[#5e554a] mb-1.5">
                Раздел ведомости
              </label>
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
                role="tablist"
                aria-label="Дисциплины"
              >
                {disciplineTabs.map((disc) => {
                  const isActive = category === disc.id;
                  const label =
                    DISCIPLINE_TAB_LABELS[String(disc.id)] ?? disc.shortTitle ?? disc.title;
                  const existingCount = (dog?.skills ?? []).filter(
                    (s) => s.category === disc.id
                  ).length;

                  return (
                    <button
                      key={String(disc.id)}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setCategory(disc.id)}
                      className={cn(
                        'min-h-[36px] px-2.5 py-1.5 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition-colors text-center',
                        isActive
                          ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                          : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df] hover:text-[#1f1b16]'
                      )}
                    >
                      <span className="truncate">{label}</span>
                      {existingCount > 0 && (
                        <span
                          className={cn(
                            'font-mono text-[10px] tabular-nums',
                            isActive ? 'text-[#fdfbf7]/75' : 'text-[#7b7266]'
                          )}
                        >
                          {existingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {activeDiscInfo && (
                <p className="text-[11px] text-[#7b7266] mt-1.5">
                  {activeDiscInfo.subtitle}
                </p>
              )}
            </div>

            {/* 1-Click Quick-Add Pills from Saved Discipline Command Set */}
            <div className="rounded-xl border border-[#1f1b16]/10 bg-[#efe9df]/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[#1f1b16]">
                  Быстрое добавление из набора ({availableTemplates.length})
                </span>
                <span className="text-[11px] text-[#7b7266]">
                  Нажмите, чтобы добавить в 1 клик
                </span>
              </div>

              {availableTemplates.length === 0 ? (
                <p className="text-[11.5px] text-[#5e554a] py-1">
                  Все команды этого набора уже добавлены в карточку собаки.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableTemplates.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => handleQuickAttachTemplate(cmd)}
                      title={cmd.description || cmd.name}
                      className="h-7 px-2.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#1f5c3a] hover:border-[#1f5c3a] hover:text-[#fdfbf7] text-[#1f1b16] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors group"
                    >
                      <Plus
                        className="size-3 text-[#1f5c3a] group-hover:text-[#fdfbf7] transition-colors"
                        strokeWidth={2}
                      />
                      <span>{cmd.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Command Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-[#1f1b16]/10">
              <div className="text-[11.5px] font-medium text-[#5e554a]">
                Или введите собственный навык вручную
              </div>

              <div>
                <label className="block font-medium text-[#5e554a] mb-1">
                  Название навыка или команды <span className="text-[#b93829]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Апортировка предмета, спокойное ожидание у двери"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
                />
              </div>

              <div>
                <label className="block font-medium text-[#5e554a] mb-1">
                  Критерий выполнения
                </label>
                <textarea
                  rows={2}
                  placeholder="Выполнение по первой команде на дистанции до 5 метров"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40 resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#5e554a]">
                    Исходный уровень освоения
                  </label>
                  <span className="font-mono font-medium text-[#1f5c3a] tabular-nums">
                    {mastery}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={mastery}
                  onChange={(e) => setMastery(Number(e.target.value))}
                  className="w-full h-2 bg-[#efe9df] rounded-lg appearance-none cursor-pointer accent-[#1f5c3a]"
                />
                <div className="flex justify-between font-mono text-[10px] tabular-nums text-[#7b7266] mt-1">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                  <span>60%</span>
                  <span>80%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1f1b16]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] font-medium transition-colors"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Check className="size-3.5" strokeWidth={1.5} />
                  <span>Добавить свой навык</span>
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

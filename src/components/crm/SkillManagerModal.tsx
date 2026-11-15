import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';

interface SkillManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
}

export const SkillManagerModal: React.FC<SkillManagerModalProps> = ({
  open,
  onOpenChange,
  dogId,
}) => {
  const addSkillToDog = useDogStore((s) => s.addSkillToDog);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('okd');
  const [description, setDescription] = useState('');
  const [mastery, setMastery] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Введите название навыка');
      return;
    }

    addSkillToDog(dogId, {
      name: name.trim(),
      category,
      description: description.trim(),
      mastery: Math.max(0, Math.min(100, Number(mastery) || 0)),
      isCustom: true,
      lastUpdated: new Date().toISOString(),
    });

    toast.success(`Навык «${name.trim()}» добавлен в ведомость`);
    setName('');
    setDescription('');
    setMastery(0);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#fdfbf7] rounded-2xl border border-[#1f1b16]/15 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-50 text-xs text-[#1f1b16]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1b16]/10">
            <div>
              <Dialog.Title className="font-serif text-base font-medium text-[#1f1b16]">
                Добавить навык в ведомость
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#7b7266] mt-0.5">
                Индивидуальный норматив ОКД или задача коррекции поведения
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

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block font-medium text-[#5e554a] mb-1">
                Раздел ведомости
              </label>
              <div className="grid grid-cols-2 gap-2 h-9">
                <button
                  type="button"
                  onClick={() => setCategory('okd')}
                  className={cn(
                    'rounded-lg font-medium border flex items-center justify-center transition-colors',
                    category === 'okd'
                      ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                      : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
                  )}
                >
                  Курс ОКД
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('behavior')}
                  className={cn(
                    'rounded-lg font-medium border flex items-center justify-center transition-colors',
                    category === 'behavior'
                      ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                      : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
                  )}
                >
                  Коррекция поведения
                </button>
              </div>
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
                rows={3}
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
                Отмена
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="size-3.5" strokeWidth={1.5} />
                <span>Добавить</span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

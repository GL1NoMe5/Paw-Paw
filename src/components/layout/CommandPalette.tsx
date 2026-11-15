import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Compass,
  Users,
  Award,
  SlidersHorizontal,
  ClipboardList,
  Play,
  LineChart,
  FileCheck2,
  Plus,
  Database,
  UserRound,
} from 'lucide-react';
import type { AppSection } from './Sidebar';
import type { SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex } from '../../utils/calculations';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateSection: (section: AppSection) => void;
  onSelectDog: (dogId: string) => void;
  onStartTraining: () => void;
  onOpenAnalytics: () => void;
  onOpenDossier: () => void;
  onOpenCertificate: () => void;
  onAddDog: () => void;
  onOpenDatabase: () => void;
  onOpenCommandBuilder?: (category?: SkillCategory) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNavigateSection,
  onSelectDog,
  onStartTraining,
  onOpenAnalytics,
  onOpenDossier,
  onOpenCertificate,
  onAddDog,
  onOpenDatabase,
  onOpenCommandBuilder,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDog = dogs.find((d) => d.id === activeDogId) || dogs[0] || null;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runAndClose = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-[#1f1b16]/35"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[580px] rounded-[16px] bg-[#fdfbf7] border border-[#1f1b16]/15 shadow-[0_12px_32px_rgba(31,27,22,0.12)] overflow-hidden text-[#1f1b16]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Поиск и команды" className="flex flex-col w-full">
          {/* Input Header */}
          <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[#1f1b16]/10 bg-[#f7f4ee]/65">
            <Search strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Поиск по ученикам, разделам и действиям"
              className="flex-1 bg-transparent text-[14px] text-[#1f1b16] placeholder:text-[#7b7266] focus:outline-none"
            />
            <kbd className="keycap">Esc</kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2 space-y-3">
            <Command.Empty className="py-8 text-center text-[13px] text-[#7b7266]">
              Ничего не найдено по вашему запросу
            </Command.Empty>

            {/* Top-Level App Sections */}
            <Command.Group
              heading="Разделы рабочей тетради"
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-[#7b7266]"
            >
              <Command.Item
                value="Главная направления дрессировки ОКД ЗКС спорт коррекция"
                onSelect={() => runAndClose(() => onNavigateSection('home'))}
                className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
              >
                <Compass strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                <span className="flex-1 text-[#1f1b16]">Главная — направления дрессировки</span>
                <kbd className="keycap">G</kbd>
              </Command.Item>

              <Command.Item
                value="Ученики справочник картотека собаки список"
                onSelect={() => runAndClose(() => onNavigateSection('students'))}
                className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
              >
                <Users strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                <span className="flex-1 text-[#1f1b16]">Ученики — справочник и профили</span>
                <span className="font-mono tabular-nums text-[11px] text-[#7b7266] mr-1">
                  {dogs.length}
                </span>
                <kbd className="keycap">U</kbd>
              </Command.Item>

              <Command.Item
                value="Достижения дипломы выпускники сертификаты А4"
                onSelect={() => runAndClose(() => onNavigateSection('achievements'))}
                className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
              >
                <Award strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                <span className="flex-1 text-[#1f1b16]">Достижения — дипломы А4</span>
                <kbd className="keycap">D</kbd>
              </Command.Item>

              {onOpenCommandBuilder && (
                <Command.Item
                  value="Настроить набор команд конструктор ОКД ЗКС спорт поведение"
                  onSelect={() => runAndClose(() => onOpenCommandBuilder('okd'))}
                  className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                >
                  <SlidersHorizontal
                    strokeWidth={1.5}
                    className="size-4 text-[#7b7266] flex-shrink-0"
                  />
                  <span className="flex-1 text-[#1f1b16]">Конструктор наборов команд</span>
                  <kbd className="keycap">C</kbd>
                </Command.Item>
              )}
            </Command.Group>

            {/* Dogs Group */}
            {dogs.length > 0 && (
              <Command.Group
                heading="Перейти к ученику"
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-[#7b7266]"
              >
                {dogs.map((dog) => {
                  const { overallIndex } = calculateOverallDogIndex(dog.skills);
                  const isCurrent = dog.id === activeDogId;
                  return (
                    <Command.Item
                      key={dog.id}
                      value={`${dog.name} ${dog.breed} ${dog.ownerName}`}
                      onSelect={() => runAndClose(() => onSelectDog(dog.id))}
                      className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                    >
                      <UserRound
                        strokeWidth={1.5}
                        className="size-4 text-[#7b7266] flex-shrink-0"
                      />
                      <span className="font-medium text-[#1f1b16] truncate">{dog.name}</span>
                      <span className="text-[13px] text-[#7b7266] truncate flex-1">
                        {dog.breed}
                        {dog.ownerName ? ` · ${dog.ownerName}` : ''}
                      </span>
                      {isCurrent && (
                        <span className="text-[12px] text-[#7b7266]">Текущий</span>
                      )}
                      <span className="font-mono tabular-nums text-[12px] text-[#1f5c3a] min-w-[36px] text-right">
                        {overallIndex}%
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Active Dog Actions */}
            {activeDog && (
              <Command.Group
                heading={`Работа с профилем · ${activeDog.name}`}
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-[#7b7266]"
              >
                <Command.Item
                  value={`Открыть досье карточку ${activeDog.name}`}
                  onSelect={() => runAndClose(onOpenDossier)}
                  className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                >
                  <ClipboardList
                    strokeWidth={1.5}
                    className="size-4 text-[#7b7266] flex-shrink-0"
                  />
                  <span className="flex-1 text-[#1f1b16]">Открыть профиль ученика</span>
                  <kbd className="keycap">1</kbd>
                </Command.Item>

                <Command.Item
                  value={`Начать тренировку проведение занятия секундомер ${activeDog.name}`}
                  onSelect={() => runAndClose(onStartTraining)}
                  className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                >
                  <Play strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                  <span className="flex-1 text-[#1f1b16]">Провести тренировку</span>
                  <kbd className="keycap">2</kbd>
                </Command.Item>

                <Command.Item
                  value={`Аналитика и журнал прогресса графики ${activeDog.name}`}
                  onSelect={() => runAndClose(onOpenAnalytics)}
                  className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                >
                  <LineChart strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                  <span className="flex-1 text-[#1f1b16]">Открыть аналитику прогресса</span>
                  <kbd className="keycap">3</kbd>
                </Command.Item>

                <Command.Item
                  value={`Выпускной диплом А4 сертификат ${activeDog.name}`}
                  onSelect={() => runAndClose(onOpenCertificate)}
                  className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
                >
                  <FileCheck2 strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                  <span className="flex-1 text-[#1f1b16]">Оформить диплом А4</span>
                  <kbd className="keycap">P</kbd>
                </Command.Item>
              </Command.Group>
            )}

            {/* Database & Registry Actions */}
            <Command.Group
              heading="Управление картотекой"
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-[#7b7266]"
            >
              <Command.Item
                value="Добавить новую собаку нового ученика анкета"
                onSelect={() => runAndClose(onAddDog)}
                className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
              >
                <Plus strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                <span className="flex-1 text-[#1f1b16]">Завести новую карточку ученика</span>
                <kbd className="keycap">N</kbd>
              </Command.Item>

              <Command.Item
                value="База данных JSON экспорт импорт резервная копия"
                onSelect={() => runAndClose(onOpenDatabase)}
                className="h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[14px] text-[#5e554a] data-[selected=true]:bg-[#efe9df] data-[selected=true]:text-[#1f1b16] cursor-pointer transition-colors"
              >
                <Database strokeWidth={1.5} className="size-4 text-[#7b7266] flex-shrink-0" />
                <span className="flex-1 text-[#1f1b16]">
                  Архив базы данных JSON (экспорт и импорт)
                </span>
                <kbd className="keycap">J</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Hints */}
          <div className="px-4 py-2.5 border-t border-[#1f1b16]/10 bg-[#f7f4ee]/65 flex items-center justify-between text-[12px] text-[#7b7266]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="keycap">↑↓</kbd>
                <span>Навигация</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="keycap">↵</kbd>
                <span>Выбрать</span>
              </span>
            </div>
            <span className="font-mono tabular-nums">Учеников: {dogs.length}</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

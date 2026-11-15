import type React from 'react';
import {
  Compass,
  Users,
  Award,
  Search,
  Plus,
  Database,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex } from '../../utils/calculations';

export type AppSection = 'home' | 'students' | 'achievements';

export interface SidebarProps {
  activeSection?: AppSection;
  onSectionChange?: (section: AppSection) => void;
  onAddDogClick?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection = 'home',
  onSectionChange,
  onAddDogClick,
  onOpenDatabaseModal,
  onOpenCommandPalette,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const trainerProfile = useDogStore((s) => s.trainerProfile);

  const issuedDiplomasCount = dogs.filter((d) => d.certificateIssued === true).length;

  const avgIndex =
    dogs.length > 0
      ? Math.round(
          dogs.reduce((acc, d) => acc + calculateOverallDogIndex(d.skills).overallIndex, 0) /
            dogs.length
        )
      : 0;

  const navItems: {
    id: AppSection;
    label: string;
    icon: React.ComponentType<{ strokeWidth?: number; className?: string }>;
    count?: number;
    countAccent?: boolean;
  }[] = [
    {
      id: 'home',
      label: 'Главная',
      icon: Compass,
    },
    {
      id: 'students',
      label: 'Ученики',
      icon: Users,
      count: dogs.length,
    },
    {
      id: 'achievements',
      label: 'Достижения',
      icon: Award,
      count: issuedDiplomasCount,
      countAccent: issuedDiplomasCount > 0,
    },
  ];

  return (
    <aside className="hidden md:flex w-[248px] lg:w-[260px] h-full flex-col select-none flex-shrink-0 px-1.5 py-2">
      {/* Craft Cozy Header */}
      <div className="px-2.5 pt-1 pb-3">
        <div className="font-serif text-[24px] leading-none text-[#221c15] tracking-tight">
          Paw-Paw
        </div>
        <div className="text-[11.5px] text-[#94897a] mt-1.5 font-sans">
          Тетрадь кинолога ·{' '}
          <span className="font-mono tabular-nums text-[#655b4e]">{avgIndex}%</span> ср.
        </div>
      </div>

      {/* Raycast-style Command Palette Trigger */}
      <div className="px-1.5 pb-4">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Открыть поиск и команды (⌘K)"
          className="w-full h-9 px-2.5 rounded-[10px] bg-[#e9e1d6]/75 hover:bg-[#e9e1d6] border border-[#221c15]/[0.08] text-[13px] text-[#655b4e] hover:text-[#221c15] flex items-center justify-between gap-2 transition-colors"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Search strokeWidth={1.5} className="size-4 text-[#94897a] flex-shrink-0" />
            <span className="truncate">Поиск и команды</span>
          </span>
          <kbd className="keycap flex-shrink-0">⌘K</kbd>
        </button>
      </div>

      {/* Top-Level Navigation */}
      <nav aria-label="Основные разделы" className="px-1.5 flex-1">
        <div className="px-2 pb-1.5 text-[11.5px] font-medium text-[#94897a]">
          Разделы
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange?.(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full h-9 px-2.5 rounded-[10px] flex items-center justify-between gap-2.5 text-[13.5px] transition-all border',
                  isActive
                    ? 'bg-[#fffcf8] text-[#221c15] font-medium border-[#221c15]/[0.09] shadow-[0_1px_3px_rgba(36,28,18,0.06)]'
                    : 'bg-transparent text-[#655b4e] hover:bg-[#e9e1d6]/65 hover:text-[#221c15] border-transparent'
                )}
              >
                <span className="inline-flex items-center gap-2.5 min-w-0">
                  <Icon
                    strokeWidth={1.5}
                    className={cn(
                      'size-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-[#286144]' : 'text-[#94897a]'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </span>

                {item.count !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-[6px] font-mono text-[11px] leading-none tabular-nums flex-shrink-0',
                      isActive
                        ? 'bg-[#f8f3eb] text-[#221c15]'
                        : item.countAccent
                        ? 'bg-[#286144]/10 text-[#286144]'
                        : 'text-[#94897a]'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quiet Trainer Meta & Footer Actions */}
      <div className="mt-auto px-1.5 pt-3 space-y-2.5">
        {trainerProfile.centerName && (
          <div className="px-2 py-2 rounded-[10px] bg-[#e9e1d6]/45 border border-[#221c15]/[0.05]">
            <div className="text-[11.5px] font-medium text-[#221c15] truncate">
              {trainerProfile.centerName}
            </div>
            {trainerProfile.name && (
              <div className="text-[11px] text-[#94897a] truncate mt-0.5">
                {trainerProfile.name}
              </div>
            )}
          </div>
        )}

        <div className="pt-2.5 border-t border-[#221c15]/[0.08] space-y-1.5">
          <button
            type="button"
            onClick={onAddDogClick}
            className="w-full h-9 px-3 rounded-[10px] bg-[#fffcf8] hover:bg-[#ebe3d6] border border-[#221c15]/[0.11] text-[#221c15] text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors shadow-[0_1px_2px_rgba(36,28,18,0.04)]"
          >
            <Plus strokeWidth={1.6} className="size-4 text-[#286144]" />
            <span>Новый ученик</span>
          </button>

          <button
            type="button"
            onClick={onOpenDatabaseModal}
            className="w-full h-8 px-2.5 rounded-[8px] hover:bg-[#e9e1d6]/70 text-[12px] text-[#655b4e] hover:text-[#221c15] inline-flex items-center justify-center gap-1.5 transition-colors"
            title="Экспорт и импорт базы JSON"
          >
            <Database strokeWidth={1.5} className="size-3.5 text-[#94897a]" />
            <span>Архив JSON</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

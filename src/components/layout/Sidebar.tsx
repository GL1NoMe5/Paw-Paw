import type React from 'react';
import {
  Compass,
  Users,
  Award,
  Search,
  Plus,
  Database,
  Sun,
  Moon,
  Leaf,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex } from '../../utils/calculations';
import { SidebarCozyPattern, SidebarPupAccent } from '../cozy/SidebarCozyPattern';

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
  const theme = useDogStore((s) => s.theme);
  const setTheme = useDogStore((s) => s.setTheme);
  const cozyAnimations = useDogStore((s) => s.cozyAnimations);
  const toggleCozyAnimations = useDogStore((s) => s.toggleCozyAnimations);

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
    <aside className="hidden md:flex relative overflow-hidden rounded-[18px] border border-[var(--border-subtle)] w-[248px] lg:w-[260px] h-full flex-col select-none flex-shrink-0 shadow-[0_6px_20px_-10px_rgba(36,28,18,0.1)] dark:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]">
      <SidebarCozyPattern isDark={theme === 'dark'} className="pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col h-full p-2.5 gap-2.5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-[#fffcf8]/90 dark:bg-[#1b1814]/90 backdrop-blur-[4px] border border-[var(--border-subtle)] shadow-[0_1px_3px_rgba(36,28,18,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex-shrink-0">
          <SidebarPupAccent isDark={theme === 'dark'} size={36} />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[23px] leading-none text-[var(--text-primary)] tracking-tight">
              Paw-Paw
            </div>
            <div className="text-[11.5px] text-[var(--text-secondary)] mt-1 font-sans leading-tight truncate">
              Тетрадь кинолога ·{' '}
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-medium">
                {avgIndex}%
              </span>{' '}
              ср.
            </div>
          </div>
        </div>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Открыть поиск и команды (⌘K)"
          className="w-full h-9 px-3 rounded-[12px] bg-[#fffcf8]/[0.88] hover:bg-[#fffcf8] dark:bg-[#1b1814]/[0.88] dark:hover:bg-[#231f1a] backdrop-blur-[4px] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] flex items-center justify-between gap-2 transition-colors shadow-[0_1px_2px_rgba(36,28,18,0.04)] dark:shadow-none flex-shrink-0"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Search strokeWidth={1.6} className="size-4 text-[var(--text-secondary)] flex-shrink-0" />
            <span className="truncate font-medium">Поиск и команды</span>
          </span>
          <kbd className="keycap flex-shrink-0">⌘K</kbd>
        </button>

        {/* Top-Level Navigation */}
        <nav aria-label="Основные разделы" className="flex-1 min-h-0">
          <div className="rounded-[14px] bg-[#fffcf8]/[0.88] dark:bg-[#1b1814]/[0.88] backdrop-blur-[4px] border border-[var(--border-subtle)] p-2 shadow-[0_1px_3px_rgba(36,28,18,0.04)] dark:shadow-none">
            <div className="px-2 pt-0.5 pb-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
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
                        ? 'bg-[var(--bg-note)] dark:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium border-[var(--border-subtle)] shadow-[0_1px_3px_rgba(36,28,18,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.35)]'
                        : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border-transparent'
                    )}
                  >
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      <Icon
                        strokeWidth={1.5}
                        className={cn(
                          'size-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-[var(--accent-forest)]' : 'text-[var(--text-secondary)]'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>

                    {item.count !== undefined && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-[6px] font-mono text-[11px] leading-none tabular-nums flex-shrink-0',
                          isActive
                            ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                            : item.countAccent
                            ? 'bg-[#286144]/10 dark:bg-[#58b482]/15 text-[var(--accent-forest)]'
                            : 'text-[var(--text-secondary)]'
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Theme Switcher, Cozy Ambience & Footer Actions */}
        <div className="mt-auto space-y-2 flex-shrink-0">
          <div className="rounded-[14px] bg-[#fffcf8]/[0.88] dark:bg-[#1b1814]/[0.88] backdrop-blur-[4px] border border-[var(--border-subtle)] p-1.5 space-y-1.5 shadow-[0_1px_3px_rgba(36,28,18,0.04)] dark:shadow-none">
            <div
              role="group"
              aria-label="Тема оформления"
              className="grid grid-cols-2 gap-1 p-0.5 rounded-[10px] bg-[var(--bg-subtle)] border border-[var(--border-hairline)]"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={cn(
                  'h-7 px-2 rounded-[7px] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors border',
                  theme === 'light'
                    ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] border-[var(--border-subtle)] shadow-[0_1px_2px_rgba(36,28,18,0.06)]'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
                )}
              >
                <Sun strokeWidth={1.6} className="size-3.5" />
                <span>Светлая</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={cn(
                  'h-7 px-2 rounded-[7px] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors border',
                  theme === 'dark'
                    ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] border-[var(--border-subtle)] shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
                )}
              >
                <Moon strokeWidth={1.6} className="size-3.5" />
                <span>Тёмная</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleCozyAnimations}
              aria-pressed={cozyAnimations}
              title={
                cozyAnimations
                  ? 'Отключить уютный листопад и анимации'
                  : 'Включить уютный листопад и анимации'
              }
              className={cn(
                'w-full h-8 px-2.5 rounded-[9px] text-[12px] font-medium flex items-center justify-between gap-2 transition-colors border',
                cozyAnimations
                  ? 'bg-[var(--bg-note)] dark:bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                  : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border-transparent'
              )}
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Leaf
                  strokeWidth={1.6}
                  className={cn(
                    'size-3.5 flex-shrink-0 transition-colors',
                    cozyAnimations ? 'text-[var(--accent-ochre)]' : 'text-[var(--text-muted)]'
                  )}
                />
                <span className="truncate">Уютный листопад</span>
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-[6px] text-[10.5px] font-medium leading-none flex-shrink-0 border',
                  cozyAnimations
                    ? 'bg-[#286144]/10 dark:bg-[#58b482]/15 text-[var(--accent-forest)] border-[#286144]/20 dark:border-[#58b482]/30'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-hairline)]'
                )}
              >
                {cozyAnimations ? 'Вкл' : 'Выкл'}
              </span>
            </button>
          </div>

          <div className="rounded-[14px] bg-[#fffcf8]/[0.88] dark:bg-[#1b1814]/[0.88] backdrop-blur-[4px] border border-[var(--border-subtle)] p-1.5 space-y-1 shadow-[0_1px_3px_rgba(36,28,18,0.04)] dark:shadow-none">
            <button
              type="button"
              onClick={onAddDogClick}
              className="w-full h-9 px-3 rounded-[10px] bg-[var(--bg-note)] hover:bg-[var(--bg-active)] dark:bg-[var(--bg-subtle)] dark:hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors shadow-[0_1px_2px_rgba(36,28,18,0.04)] dark:shadow-none"
            >
              <Plus strokeWidth={1.6} className="size-4 text-[var(--accent-forest)]" />
              <span>Новый ученик</span>
            </button>

            <button
              type="button"
              onClick={onOpenDatabaseModal}
              className="w-full h-8 px-2.5 rounded-[9px] hover:bg-[var(--bg-hover)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center gap-1.5 transition-colors"
              title="Экспорт и импорт базы JSON"
            >
              <Database strokeWidth={1.5} className="size-3.5 text-[var(--text-secondary)]" />
              <span>Архив JSON</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

import type React from 'react';
import { Compass, Users, Award, Search, Plus, Sun, Moon } from 'lucide-react';
import { Sidebar, type AppSection } from './Sidebar';
import { cn } from '../../utils/cn';
import { useDogStore } from '../../store/useDogStore';

export interface WorkstationLayoutProps {
  children?: React.ReactNode;
  activeSection?: AppSection;
  onSectionChange?: (section: AppSection) => void;
  onAddDogClick?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenCommandPalette?: () => void;
}

export const WorkstationLayout: React.FC<WorkstationLayoutProps> = ({
  children,
  activeSection = 'home',
  onSectionChange,
  onAddDogClick,
  onOpenDatabaseModal,
  onOpenCommandPalette,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const theme = useDogStore((s) => s.theme);
  const toggleTheme = useDogStore((s) => s.toggleTheme);
  const diplomasCount = dogs.filter((d) => d.certificateIssued === true).length;

  return (
    <div className="flex flex-col md:flex-row h-dvh w-screen overflow-hidden bg-[var(--bg-desk)] text-[var(--text-primary)] p-2 sm:p-3.5 gap-2.5 sm:gap-3">
      {/* Compact Mobile Header (shown below md breakpoint) */}
      <header className="flex md:hidden items-center justify-between gap-2 px-2 py-1.5 rounded-[14px] bg-[var(--bg-sheet)] border border-[var(--border-subtle)] flex-shrink-0">
        <span className="font-serif text-[20px] leading-none text-[var(--text-primary)] pl-1">
          Paw-Paw
        </span>

        <div className="flex items-center gap-1">
          {[
            { id: 'home' as AppSection, label: 'Главная', icon: Compass },
            { id: 'students' as AppSection, label: `Ученики (${dogs.length})`, icon: Users },
            {
              id: 'achievements' as AppSection,
              label: `Дипломы (${diplomasCount})`,
              icon: Award,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSectionChange?.(tab.id)}
                className={cn(
                  'h-8 px-2.5 rounded-[8px] text-[12px] inline-flex items-center gap-1.5 transition-colors',
                  isActive
                    ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon strokeWidth={1.5} className="size-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            className="size-8 rounded-[8px] bg-[var(--bg-note)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            {theme === 'dark' ? (
              <Sun strokeWidth={1.5} className="size-3.5" />
            ) : (
              <Moon strokeWidth={1.5} className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Поиск и команды"
            className="size-8 rounded-[8px] bg-[var(--bg-note)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            <Search strokeWidth={1.5} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onAddDogClick}
            aria-label="Добавить ученика"
            className="size-8 rounded-[8px] bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] flex items-center justify-center transition-colors"
          >
            <Plus strokeWidth={1.6} className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Cozy Craft Sidebar sitting directly on the warm desk surface */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onAddDogClick={onAddDogClick}
        onOpenDatabaseModal={onOpenDatabaseModal}
        onOpenCommandPalette={onOpenCommandPalette}
      />

      {/* Main Craft Document Sheet Viewport */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto craft-sheet">
        <div className="w-full max-w-[1320px] mx-auto">{children}</div>
      </main>
    </div>
  );
};

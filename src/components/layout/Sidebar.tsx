import type React from 'react';
import {
  Search,
  Plus,
  Database,
  FileCheck2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DogFilter } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex } from '../../utils/calculations';
import { DogList } from '../crm/DogList';

export interface SidebarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  activeFilter?: DogFilter;
  onFilterChange?: (filter: DogFilter) => void;
  onAddDogClick?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCertificate?: () => void;
  dogsCount?: number;
}

const FILTER_TABS: { id: DogFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'active_okd', label: 'ОКД' },
  { id: 'behavior', label: 'Поведение' },
  { id: 'graduates', label: 'Выпуск' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  searchQuery: propsSearchQuery,
  onSearchChange: propsOnSearchChange,
  activeFilter: propsActiveFilter,
  onFilterChange: propsOnFilterChange,
  onAddDogClick,
  onOpenDatabaseModal,
  onOpenCommandPalette,
  onOpenCertificate,
}) => {
  const storeDogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const setActiveDog = useDogStore((s) => s.setActiveDog);
  const storeFilter = useDogStore((s) => s.filter);
  const setStoreFilter = useDogStore((s) => s.setFilter);
  const storeSearchQuery = useDogStore((s) => s.searchQuery);
  const setStoreSearchQuery = useDogStore((s) => s.setSearchQuery);

  const searchQuery = propsSearchQuery !== undefined ? propsSearchQuery : storeSearchQuery;
  const onSearchChange = propsOnSearchChange || setStoreSearchQuery;
  const activeFilter = propsActiveFilter !== undefined ? propsActiveFilter : storeFilter;
  const onFilterChange = propsOnFilterChange || setStoreFilter;

  const matchesCategory = (dog: (typeof storeDogs)[number], filter: DogFilter) => {
    if (filter === 'all') return true;
    if (filter === 'active_okd') {
      const okdSkills = dog.skills.filter((s) => s.category === 'okd');
      return !dog.certificateIssued && okdSkills.some((s) => s.mastery < 100);
    }
    if (filter === 'behavior') {
      const behSkills = dog.skills.filter((s) => s.category === 'behavior');
      return behSkills.some((s) => s.mastery < 100);
    }
    if (filter === 'graduates') {
      return dog.certificateIssued === true;
    }
    return true;
  };

  const filteredDogs = storeDogs.filter((dog) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = dog.name.toLowerCase().includes(q);
      const matchBreed = dog.breed.toLowerCase().includes(q);
      const matchOwner = dog.ownerName.toLowerCase().includes(q);
      if (!matchName && !matchBreed && !matchOwner) return false;
    }
    return matchesCategory(dog, activeFilter);
  });

  const avgIndex =
    storeDogs.length > 0
      ? Math.round(
          storeDogs.reduce((acc, d) => acc + calculateOverallDogIndex(d.skills).overallIndex, 0) /
            storeDogs.length
        )
      : 0;

  return (
    <aside className="w-[260px] h-full flex flex-col select-none flex-shrink-0 px-1.5 py-2">
      {/* Craft Cozy Header */}
      <div className="px-2.5 pt-1 pb-3 flex items-center justify-between">
        <div>
          <div className="font-serif text-[22px] leading-none text-[#221c15] tracking-tight">
            Paw-Paw
          </div>
          <div className="text-[11px] text-[#94897a] mt-1">
            Тетрадь кинолога · {storeDogs.length} уч. · ср. {avgIndex}%
          </div>
        </div>

        <button
          type="button"
          onClick={onAddDogClick}
          title="Добавить карточку ученика"
          className="size-7 rounded-[8px] bg-[#fffcf8] hover:bg-[#e8dfd2] border border-[#221c15]/10 text-[#221c15] flex items-center justify-center transition-colors shadow-[0_1px_2px_rgba(36,28,18,0.04)]"
        >
          <Plus strokeWidth={1.6} className="size-3.5" />
        </button>
      </div>

      {/* Raycast-style Launcher / Search Bar */}
      <div className="px-1.5 pb-3">
        <div className="relative flex items-center">
          <Search
            strokeWidth={1.5}
            className="absolute left-3 size-3.5 text-[#94897a] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Поиск или команда..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-8 pr-14 text-[13px] bg-[#e9e1d6]/70 hover:bg-[#e9e1d6] focus:bg-[#fffcf8] border border-[#221c15]/[0.07] focus:border-[#221c15]/20 rounded-[10px] text-[#221c15] placeholder:text-[#94897a] focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Открыть палитру команд (⌘K)"
            className="keycap absolute right-2 hover:text-[#221c15] transition-colors"
          >
            ⌘K
          </button>
        </div>
      </div>

      {/* Compact Segmented Filter Pills (Craft style) */}
      <div className="px-1.5 pb-3">
        <div className="flex items-center justify-between p-0.5 rounded-[9px] bg-[#e6ded2]/75 border border-[#221c15]/[0.05]">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  'h-6 rounded-[7px] text-[11px] transition-colors whitespace-nowrap px-2.5',
                  isActive
                    ? 'bg-[#fffcf8] text-[#221c15] font-medium shadow-[0_1px_2px_rgba(36,28,18,0.06)]'
                    : 'text-[#655b4e] hover:text-[#221c15]'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dogs Notebook List */}
      <div className="flex-1 overflow-y-auto px-1 min-h-0">
        <DogList
          dogs={filteredDogs}
          activeDogId={activeDogId}
          onSelectDog={setActiveDog}
          searchQuery={searchQuery}
        />
      </div>

      {/* Minimal Footer Actions */}
      <div className="pt-2.5 mt-1 px-2 border-t border-[#221c15]/[0.07] flex items-center justify-between text-[12px] text-[#655b4e]">
        <button
          type="button"
          onClick={onOpenDatabaseModal}
          className="inline-flex items-center gap-1.5 hover:text-[#221c15] transition-colors py-1"
          title="Экспорт и импорт базы JSON"
        >
          <Database strokeWidth={1.5} className="size-3.5 text-[#94897a]" />
          <span>Архив JSON</span>
        </button>

        {onOpenCertificate && (
          <button
            type="button"
            onClick={onOpenCertificate}
            className="inline-flex items-center gap-1.5 hover:text-[#221c15] transition-colors py-1"
            title="Открыть диплом А4 текущего ученика"
          >
            <FileCheck2 strokeWidth={1.5} className="size-3.5 text-[#94897a]" />
            <span>Диплом А4</span>
          </button>
        )}
      </div>
    </aside>
  );
};

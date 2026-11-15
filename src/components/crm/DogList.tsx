import React, { useState } from 'react';
import type { Dog } from '../../types';
import { calculateOverallDogIndex } from '../../utils/calculations';
import { cn } from '../../utils/cn';

interface DogListProps {
  dogs: Dog[];
  activeDogId: string | null;
  onSelectDog: (id: string) => void;
  searchQuery?: string;
}

export const DogList: React.FC<DogListProps> = ({
  dogs,
  activeDogId,
  onSelectDog,
  searchQuery = '',
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (dogs.length === 0) {
    return (
      <div className="py-10 px-3 text-center">
        <p className="text-[13px] text-[#655b4e]">
          {searchQuery ? 'Ничего не найдено' : 'Тетрадь пуста'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {dogs.map((dog) => {
        const isSelected = dog.id === activeDogId;
        const { overallIndex } = calculateOverallDogIndex(dog.skills);
        const showAvatar = Boolean(dog.avatar && !imgErrors[dog.id]);

        return (
          <button
            key={dog.id}
            type="button"
            onClick={() => onSelectDog(dog.id)}
            className={cn(
              'w-full text-left px-2.5 py-2 rounded-[12px] transition-colors flex items-center gap-3 select-none group',
              isSelected
                ? 'bg-[#fffcf8] text-[#221c15] shadow-[0_2px_8px_-2px_rgba(36,28,18,0.07),0_1px_2px_rgba(36,28,18,0.04)] border border-[#221c15]/[0.07]'
                : 'text-[#655b4e] hover:bg-[#e9e1d5]/65 hover:text-[#221c15] border border-transparent'
            )}
          >
            {/* Clean Rounded Avatar */}
            <div className="size-9 rounded-[10px] overflow-hidden bg-[#e5ddd0] border border-[#221c15]/[0.08] flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [dog.id]: true }))
                  }
                />
              ) : (
                <span className="font-mono text-[11px] font-medium text-[#655b4e]">
                  {dog.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name & Breed */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1.5">
                <span
                  className={cn(
                    'text-[14px] truncate leading-tight',
                    isSelected ? 'font-medium text-[#221c15]' : 'text-[#221c15]/90'
                  )}
                >
                  {dog.name}
                </span>
                <span
                  className={cn(
                    'font-mono text-[12px] tabular-nums flex-shrink-0',
                    overallIndex >= 95
                      ? 'text-[#286144] font-medium'
                      : isSelected
                      ? 'text-[#221c15]'
                      : 'text-[#94897a]'
                  )}
                >
                  {overallIndex}%
                </span>
              </div>

              <div className="text-[12px] text-[#94897a] truncate mt-0.5">
                {dog.breed}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

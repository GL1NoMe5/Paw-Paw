import React, { useState } from 'react';
import type { Dog } from '../../types';
import { calculateOverallDogIndex } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface DogListProps {
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
        <p className="text-[13px] text-[#5e554a]">
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
        const avatarKey = `${dog.id}:${dog.avatar}`;
        const showAvatar = Boolean(dog.avatar && !imgErrors[avatarKey]);

        return (
          <button
            key={dog.id}
            type="button"
            onClick={() => onSelectDog(dog.id)}
            className={cn(
              'w-full text-left px-2.5 py-2 rounded-[12px] transition-colors flex items-center gap-3 select-none group',
              isSelected
                ? 'bg-[#fffcf8] text-[#1f1b16] shadow-[0_2px_8px_-2px_rgba(36,28,18,0.07),0_1px_2px_rgba(36,28,18,0.04)] border border-[#1f1b16]/[0.08]'
                : 'text-[#5e554a] hover:bg-[#efe9df]/70 hover:text-[#1f1b16] border border-transparent'
            )}
          >
            {/* Clean Rounded Avatar without overlapping fallback */}
            <div className="size-9 rounded-[10px] overflow-hidden bg-[#efe9df] border border-[#1f1b16]/10 flex-shrink-0 flex items-center justify-center">
              {showAvatar ? (
                <img
                  src={dog.avatar}
                  alt={dog.name}
                  className="size-full object-cover"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [avatarKey]: true }))
                  }
                />
              ) : (
                <span className="font-mono text-[11px] font-medium text-[#5e554a]">
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
                    isSelected ? 'font-medium text-[#1f1b16]' : 'text-[#1f1b16]/90'
                  )}
                >
                  {dog.name}
                </span>
                <span
                  className={cn(
                    'font-mono text-[12px] tabular-nums flex-shrink-0',
                    overallIndex >= 96
                      ? 'text-[#1f5c3a] font-medium'
                      : isSelected
                      ? 'text-[#1f1b16]'
                      : 'text-[#7b7266]'
                  )}
                >
                  {overallIndex}%
                </span>
              </div>

              <div className="text-[12px] text-[#7b7266] truncate mt-0.5">
                {dog.breed}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

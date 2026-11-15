import React, { useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Upload,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  DisciplineCommandTemplate,
  Dog,
  DogSkill,
  Gender,
  MotivationType,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { suggestBreeds } from '../../data/dogBreeds';
import { formatDurationRussian } from '../../utils/calculations';
import { cn } from '../../utils/cn';

interface DogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogToEdit?: Dog | null;
}

const AVATAR_PRESETS = [
  {
    name: 'Овчарка',
    url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Корги',
    url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Ретривер',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Хаски',
    url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=400&q=80',
  },
];

const DAILY_TIME_PRESETS = [15, 20, 30, 45, 60, 90, 120] as const;

interface DogFormProps {
  dogToEdit?: Dog | null;
  onClose: () => void;
}

const DogForm: React.FC<DogFormProps> = ({ dogToEdit, onClose }) => {
  const addDog = useDogStore((s) => s.addDog);
  const updateDog = useDogStore((s) => s.updateDog);
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);

  const [name, setName] = useState(dogToEdit ? dogToEdit.name : '');
  const [gender, setGender] = useState<Gender>(dogToEdit ? dogToEdit.gender : 'male');
  const [birthDate, setBirthDate] = useState(
    dogToEdit ? dogToEdit.birthDate.slice(0, 10) : '2024-06-01'
  );
  const [breed, setBreed] = useState(dogToEdit ? dogToEdit.breed : '');
  const [isBreedOpen, setIsBreedOpen] = useState(false);
  const [activeBreedIdx, setActiveBreedIdx] = useState<number>(-1);
  const breedWrapperRef = useRef<HTMLDivElement | null>(null);

  const [weight, setWeight] = useState<number>(dogToEdit ? dogToEdit.weight : 15);
  const [avatar, setAvatar] = useState(dogToEdit ? dogToEdit.avatar : AVATAR_PRESETS[0].url);
  const [imgError, setImgError] = useState(false);
  const [dailyTimeInput, setDailyTimeInput] = useState<string>(
    String(dogToEdit ? dogToEdit.dailyTrainingTime : 30)
  );
  const [motivationType, setMotivationType] = useState<MotivationType>(
    dogToEdit ? dogToEdit.motivationType : 'food'
  );
  const [favoriteTreats, setFavoriteTreats] = useState(
    dogToEdit?.favoriteTreats ?? 'Сушёное лёгкое, сыр'
  );
  const [allergies, setAllergies] = useState(dogToEdit?.allergies ?? '');
  const [triggers, setTriggers] = useState(dogToEdit?.triggers ?? '');
  const [ownerName, setOwnerName] = useState(dogToEdit?.ownerName ?? '');
  const [ownerPhone, setOwnerPhone] = useState(dogToEdit?.ownerPhone ?? '');
  const [ownerTelegram, setOwnerTelegram] = useState(dogToEdit?.ownerTelegram ?? '');
  const [notes, setNotes] = useState(dogToEdit?.notes ?? '');

  // Initial command sets selection for new dogs (defaults to OKD commands)
  const [selectedCommandIds, setSelectedCommandIds] = useState<Set<string>>(() => {
    if (dogToEdit) return new Set<string>();
    const okdCmds = disciplineCommands.okd ?? [];
    return new Set(okdCmds.map((c) => c.id));
  });
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});

  const breedSuggestions = useMemo(() => suggestBreeds(breed, 8), [breed]);

  const parsedDailyTime = useMemo(() => {
    const n = Number(dailyTimeInput);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n);
  }, [dailyTimeInput]);

  const selectBreed = (selected: string) => {
    setBreed(selected);
    setIsBreedOpen(false);
    setActiveBreedIdx(-1);
  };

  const handleBreedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isBreedOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (breedSuggestions.length > 0) {
        e.preventDefault();
        setIsBreedOpen(true);
        setActiveBreedIdx(0);
      }
      return;
    }

    if (!isBreedOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (breedSuggestions.length > 0) {
        setActiveBreedIdx((prev) => (prev + 1) % breedSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (breedSuggestions.length > 0) {
        setActiveBreedIdx((prev) =>
          prev <= 0 ? breedSuggestions.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (activeBreedIdx >= 0 && activeBreedIdx < breedSuggestions.length) {
        e.preventDefault();
        selectBreed(breedSuggestions[activeBreedIdx]);
      } else {
        setIsBreedOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsBreedOpen(false);
      setActiveBreedIdx(-1);
    }
  };

  const toggleDisciplineSet = (commands: DisciplineCommandTemplate[]) => {
    if (commands.length === 0) return;
    setSelectedCommandIds((prev) => {
      const next = new Set(prev);
      const anySelected = commands.some((c) => next.has(c.id));
      if (anySelected) {
        for (const c of commands) next.delete(c.id);
      } else {
        for (const c of commands) next.add(c.id);
      }
      return next;
    });
  };

  const toggleSingleCommand = (cmdId: string) => {
    setSelectedCommandIds((prev) => {
      const next = new Set(prev);
      if (next.has(cmdId)) {
        next.delete(cmdId);
      } else {
        next.add(cmdId);
      }
      return next;
    });
  };

  const selectAllForDiscipline = (commands: DisciplineCommandTemplate[], select: boolean) => {
    setSelectedCommandIds((prev) => {
      const next = new Set(prev);
      for (const c of commands) {
        if (select) next.add(c.id);
        else next.delete(c.id);
      }
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер фото не должен превышать 2 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImgError(false);
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Укажите кличку собаки');
      return;
    }
    if (!breed.trim()) {
      toast.error('Укажите породу собаки');
      return;
    }
    if (!birthDate) {
      toast.error('Укажите дату рождения');
      return;
    }

    const safeDailyTime = Math.max(5, Math.min(360, parsedDailyTime || 30));

    if (dogToEdit) {
      updateDog(dogToEdit.id, {
        name: name.trim(),
        gender,
        birthDate,
        breed: breed.trim(),
        weight: Number(weight) || 10,
        avatar,
        dailyTrainingTime: safeDailyTime,
        motivationType,
        favoriteTreats: favoriteTreats.trim(),
        allergies: allergies.trim(),
        triggers: triggers.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerTelegram: ownerTelegram.trim(),
        notes: notes.trim(),
      });
      toast.success(`Карточка собаки «${name.trim()}» обновлена`);
    } else {
      const initialSkills: DogSkill[] = [];
      const addedIds = new Set<string>();

      for (const disc of disciplines) {
        const cmds = disciplineCommands[String(disc.id)] ?? [];
        for (const cmd of cmds) {
          if (selectedCommandIds.has(cmd.id) && !addedIds.has(cmd.id)) {
            addedIds.add(cmd.id);
            initialSkills.push({
              id: cmd.id,
              name: cmd.name,
              category: cmd.category,
              description: cmd.description,
              isCustom: Boolean(cmd.isCustom),
              mastery: 0,
            });
          }
        }
      }

      addDog({
        name: name.trim(),
        gender,
        birthDate,
        breed: breed.trim(),
        weight: Number(weight) || 10,
        avatar: avatar || AVATAR_PRESETS[0].url,
        dailyTrainingTime: safeDailyTime,
        motivationType,
        favoriteTreats: favoriteTreats.trim(),
        allergies: allergies.trim(),
        triggers: triggers.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerTelegram: ownerTelegram.trim(),
        notes: notes.trim(),
        skills: initialSkills,
        certificateIssued: false,
      });
      toast.success(`Собака «${name.trim()}» добавлена в картотеку`);
    }

    onClose();
  };

  const showPreviewImage = Boolean(avatar && !imgError);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-4 text-[#1f1b16]">
      {/* 1. Avatar & Presets */}
      <div>
        <label className="block text-xs font-medium text-[#5e554a] mb-2">
          Фотография собаки
        </label>
        <div className="flex items-center gap-4">
          <div className="relative size-16 rounded-lg overflow-hidden border border-[#1f1b16]/15 bg-[#efe9df] flex-shrink-0 flex items-center justify-center">
            {showPreviewImage ? (
              <img
                src={avatar}
                alt="Предпросмотр"
                className="size-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : name.trim() ? (
              <span className="font-mono text-sm font-medium text-[#5e554a]">
                {name.trim().slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <Camera className="size-5 text-[#7b7266]" strokeWidth={1.5} />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <label className="h-8 px-3 rounded-lg border border-[#1f1b16]/15 bg-[#efe9df] hover:bg-[#e5dec9] text-[#1f1b16] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="size-3.5 text-[#5e554a]" strokeWidth={1.5} />
                <span>Загрузить фото (до 2 МБ)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar('');
                    setImgError(false);
                  }}
                  className="text-xs text-[#7b7266] hover:text-[#1f1b16] underline"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7b7266]">Шаблоны:</span>
              <div className="flex items-center gap-1.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setImgError(false);
                      setAvatar(preset.url);
                    }}
                    className={cn(
                      'size-7 rounded-md overflow-hidden border transition-opacity',
                      avatar === preset.url
                        ? 'border-[#1f1b16] ring-1 ring-[#1f1b16]'
                        : 'border-[#1f1b16]/15 opacity-60 hover:opacity-100'
                    )}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1f1b16]/10">
        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Кличка <span className="text-[#b93829]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Рекс"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">Пол</label>
          <div className="grid grid-cols-2 gap-2 h-9">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={cn(
                'rounded-lg font-medium border flex items-center justify-center transition-colors',
                gender === 'male'
                  ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                  : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
              )}
            >
              Кобель
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={cn(
                'rounded-lg font-medium border flex items-center justify-center transition-colors',
                gender === 'female'
                  ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                  : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
              )}
            >
              Сука
            </button>
          </div>
        </div>

        {/* Breed Autocomplete */}
        <div ref={breedWrapperRef} className="relative">
          <label className="block font-medium text-[#5e554a] mb-1">
            Порода <span className="text-[#b93829]">*</span>
          </label>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="Начните ввод (напр., фран, корги)"
            value={breed}
            onFocus={() => {
              if (breed.trim().length > 0 || breedSuggestions.length > 0) {
                setIsBreedOpen(true);
              }
            }}
            onBlur={() => {
              setIsBreedOpen(false);
              setActiveBreedIdx(-1);
            }}
            onChange={(e) => {
              setBreed(e.target.value);
              setIsBreedOpen(true);
              setActiveBreedIdx(0);
            }}
            onKeyDown={handleBreedKeyDown}
            role="combobox"
            aria-expanded={isBreedOpen && breedSuggestions.length > 0}
            aria-autocomplete="list"
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          />

          {isBreedOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-[#1f1b16]/15 bg-[#fdfbf7] shadow-[0_12px_28px_rgba(31,27,22,0.12)] overflow-hidden max-h-56 overflow-y-auto"
            >
              {breedSuggestions.length > 0 ? (
                <div className="p-1">
                  {breedSuggestions.map((suggestion, idx) => {
                    const isHighlighted = idx === activeBreedIdx;
                    const isExact =
                      suggestion.toLowerCase() === breed.trim().toLowerCase();
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectBreed(suggestion);
                        }}
                        onMouseEnter={() => setActiveBreedIdx(idx)}
                        className={cn(
                          'w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors',
                          isHighlighted
                            ? 'bg-[#efe9df] text-[#1f1b16] font-medium'
                            : 'text-[#5e554a] hover:bg-[#efe9df]/60 hover:text-[#1f1b16]'
                        )}
                      >
                        <span className="truncate">{suggestion}</span>
                        {isExact && (
                          <Check className="size-3.5 text-[#1f5c3a] flex-shrink-0" strokeWidth={1.75} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2.5 text-[11.5px] text-[#7b7266]">
                  Нет в справочнике — будет сохранена своя порода «{breed.trim()}»
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Дата рождения <span className="text-[#b93829]">*</span>
          </label>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono tabular-nums focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Вес (кг)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="120"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono tabular-nums focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          />
        </div>

        {/* Free Daily Training Time + Presets */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="font-medium text-[#5e554a]">
              Дневной норматив (мин/день)
            </label>
            <span className="font-mono text-[11px] tabular-nums text-[#1f5c3a]">
              {parsedDailyTime > 0 ? formatDurationRussian(parsedDailyTime) : '—'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative w-full sm:w-40 flex-shrink-0">
              <input
                type="number"
                min={5}
                max={360}
                step={1}
                value={dailyTimeInput}
                onChange={(e) => setDailyTimeInput(e.target.value)}
                onBlur={() => {
                  if (!parsedDailyTime || parsedDailyTime < 5) {
                    setDailyTimeInput('5');
                  } else if (parsedDailyTime > 360) {
                    setDailyTimeInput('360');
                  } else {
                    setDailyTimeInput(String(parsedDailyTime));
                  }
                }}
                aria-label="Дневной норматив (мин/день)"
                className="w-full h-9 pl-3 pr-16 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono tabular-nums focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#7b7266] pointer-events-none">
                мин/день
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {DAILY_TIME_PRESETS.map((presetMin) => {
                const isSelected = parsedDailyTime === presetMin;
                return (
                  <button
                    key={presetMin}
                    type="button"
                    onClick={() => setDailyTimeInput(String(presetMin))}
                    className={cn(
                      'h-8 px-2.5 rounded-lg border font-mono text-[11.5px] tabular-nums transition-colors',
                      isSelected
                        ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7] font-medium'
                        : 'bg-[#efe9df]/55 border-[#1f1b16]/15 text-[#5e554a] hover:bg-[#efe9df] hover:text-[#1f1b16]'
                    )}
                  >
                    {presetMin} мин
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cynological Motivations & Triggers */}
      <div className="pt-3 border-t border-[#1f1b16]/10 space-y-3">
        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Ведущий тип мотивации
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'food', label: 'Пищевая' },
              { id: 'play', label: 'Игровая' },
              { id: 'social', label: 'Социальная' },
              { id: 'mixed', label: 'Смешанная' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMotivationType(item.id as MotivationType)}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center',
                  motivationType === item.id
                    ? 'bg-[#1f1b16] text-[#fdfbf7] border-[#1f1b16]'
                    : 'bg-[#efe9df]/60 text-[#5e554a] border-[#1f1b16]/15 hover:bg-[#efe9df]'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Любимые лакомства
            </label>
            <input
              type="text"
              placeholder="Лёгкое, сыр, индейка"
              value={favoriteTreats}
              onChange={(e) => setFavoriteTreats(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Аллергии
            </label>
            <input
              type="text"
              placeholder="Курица, нет"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Триггеры
            </label>
            <input
              type="text"
              placeholder="Кошки, салюты, самокаты"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>
        </div>
      </div>

      {/* 4. Owner Contacts */}
      <div className="pt-3 border-t border-[#1f1b16]/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Владелец
            </label>
            <input
              type="text"
              placeholder="Иванов Иван"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Телефон
            </label>
            <input
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono tabular-nums placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Telegram
            </label>
            <input
              type="text"
              placeholder="@username"
              value={ownerTelegram}
              onChange={(e) => setOwnerTelegram(e.target.value)}
              className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Заметки кинолога
          </label>
          <textarea
            rows={2}
            placeholder="Особенности темперамента, рабочие пометки"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40 leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* 5. Dynamic Discipline Command Set Picker for new dogs */}
      {!dogToEdit && (
        <div className="pt-3 border-t border-[#1f1b16]/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block font-medium text-[#1f1b16]">
                Стартовые наборы команд и дисциплин
              </span>
              <span className="text-[11.5px] text-[#7b7266]">
                Выберите курсы целиком или раскройте список для точечной настройки команд
              </span>
            </div>
            <span className="font-mono text-[11.5px] tabular-nums px-2 py-0.5 rounded-[5px] bg-[#efe9df] border border-[#1f1b16]/10 text-[#1f5c3a] font-medium flex-shrink-0">
              Выбрано: {selectedCommandIds.size}
            </span>
          </div>

          <div className="space-y-2">
            {disciplines.map((disc) => {
              const discId = String(disc.id);
              const commands = disciplineCommands[discId] ?? [];
              const selectedCount = commands.filter((c) =>
                selectedCommandIds.has(c.id)
              ).length;
              const allSelected =
                commands.length > 0 && selectedCount === commands.length;
              const someSelected = selectedCount > 0 && !allSelected;
              const isExpanded = Boolean(expandedDisciplines[discId]);

              return (
                <div
                  key={discId}
                  className={cn(
                    'rounded-xl border transition-colors',
                    selectedCount > 0
                      ? 'border-[#1f5c3a]/30 bg-[#efe9df]/35'
                      : 'border-[#1f1b16]/10 bg-[#fdfbf7]'
                  )}
                >
                  <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDisciplineSet(commands)}
                      className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                    >
                      <span
                        className={cn(
                          'size-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors',
                          allSelected
                            ? 'bg-[#1f5c3a] border-[#1f5c3a] text-[#fdfbf7]'
                            : someSelected
                            ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7]'
                            : 'bg-[#fdfbf7] border-[#1f1b16]/25 text-transparent'
                        )}
                      >
                        {allSelected ? (
                          <Check className="size-3 stroke-[2.2]" />
                        ) : someSelected ? (
                          <Minus className="size-3 stroke-[2.2]" />
                        ) : null}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1f1b16] truncate">
                            {disc.title}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-[#7b7266] flex-shrink-0">
                            {selectedCount}/{commands.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7b7266] truncate">
                          {disc.subtitle}
                        </p>
                      </div>
                    </button>

                    {commands.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDisciplines((prev) => ({
                            ...prev,
                            [discId]: !prev[discId],
                          }))
                        }
                        className="h-7 px-2 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] text-[11px] inline-flex items-center gap-1 flex-shrink-0 transition-colors"
                      >
                        <span>{isExpanded ? 'Свернуть' : 'Команды'}</span>
                        {isExpanded ? (
                          <ChevronUp className="size-3.5" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="size-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                    )}
                  </div>

                  {isExpanded && commands.length > 0 && (
                    <div className="px-3 pb-3 pt-2 border-t border-[#1f1b16]/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#7b7266]">
                        <span>Отметьте нужные команды из набора:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllForDiscipline(commands, true)}
                            className="text-[#1f5c3a] hover:underline font-medium"
                          >
                            Выбрать все
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => selectAllForDiscipline(commands, false)}
                            className="text-[#5e554a] hover:underline"
                          >
                            Снять все
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {commands.map((cmd) => {
                          const checked = selectedCommandIds.has(cmd.id);
                          return (
                            <label
                              key={cmd.id}
                              title={cmd.description}
                              className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-colors text-[11.5px]',
                                checked
                                  ? 'bg-[#fdfbf7] border-[#1f5c3a]/35 text-[#1f1b16]'
                                  : 'bg-[#efe9df]/35 border-[#1f1b16]/10 text-[#5e554a] hover:bg-[#efe9df]/70'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSingleCommand(cmd.id)}
                                className="size-3.5 rounded border-[#1f1b16]/25 text-[#1f5c3a] focus:ring-[#1f5c3a]"
                              />
                              <span className="truncate font-medium">{cmd.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="pt-4 border-t border-[#1f1b16]/10 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] font-medium transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <Check className="size-3.5" strokeWidth={1.5} />
          <span>{dogToEdit ? 'Сохранить изменения' : 'Добавить собаку'}</span>
        </button>
      </div>
    </form>
  );
};

export const DogModal: React.FC<DogModalProps> = ({ open, onOpenChange, dogToEdit }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#fdfbf7] rounded-2xl border border-[#1f1b16]/15 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-50 text-xs text-[#1f1b16]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1f1b16]/10">
            <div>
              <Dialog.Title className="font-serif text-lg font-medium text-[#1f1b16]">
                {dogToEdit ? `Редактирование карточки: ${dogToEdit.name}` : 'Новая карточка в картотеку'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#7b7266] mt-0.5">
                Паспортные данные собаки, мотивационный профиль и контакты владельца
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

          {open && (
            <DogForm
              key={dogToEdit?.id ?? 'new'}
              dogToEdit={dogToEdit}
              onClose={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Dog, Gender, MotivationType, DogSkill } from '../../types';
import { OKD_PRESETS } from '../../types';
import { useDogStore } from '../../store/useDogStore';
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

interface DogFormProps {
  dogToEdit?: Dog | null;
  onClose: () => void;
}

const DogForm: React.FC<DogFormProps> = ({ dogToEdit, onClose }) => {
  const addDog = useDogStore((s) => s.addDog);
  const updateDog = useDogStore((s) => s.updateDog);

  const [name, setName] = useState(dogToEdit ? dogToEdit.name : '');
  const [gender, setGender] = useState<Gender>(dogToEdit ? dogToEdit.gender : 'male');
  const [birthDate, setBirthDate] = useState(
    dogToEdit ? dogToEdit.birthDate.slice(0, 10) : '2024-06-01'
  );
  const [breed, setBreed] = useState(dogToEdit ? dogToEdit.breed : '');
  const [weight, setWeight] = useState<number>(dogToEdit ? dogToEdit.weight : 15);
  const [avatar, setAvatar] = useState(dogToEdit ? dogToEdit.avatar : AVATAR_PRESETS[0].url);
  const [imgError, setImgError] = useState(false);
  const [dailyTrainingTime, setDailyTrainingTime] = useState<number>(
    dogToEdit ? dogToEdit.dailyTrainingTime : 30
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
  const [initOkdSkills, setInitOkdSkills] = useState(!dogToEdit);

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

    if (dogToEdit) {
      updateDog(dogToEdit.id, {
        name: name.trim(),
        gender,
        birthDate,
        breed: breed.trim(),
        weight: Number(weight) || 10,
        avatar,
        dailyTrainingTime: Number(dailyTrainingTime) || 30,
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
      let initialSkills: DogSkill[] = [];
      if (initOkdSkills) {
        initialSkills = OKD_PRESETS.map((p) => ({
          ...p,
          mastery: 0,
        }));
      }

      addDog({
        name: name.trim(),
        gender,
        birthDate,
        breed: breed.trim(),
        weight: Number(weight) || 10,
        avatar: avatar || AVATAR_PRESETS[0].url,
        dailyTrainingTime: Number(dailyTrainingTime) || 30,
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

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Порода <span className="text-[#b93829]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Немецкая овчарка"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] placeholder:text-[#7b7266] focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          />
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

        <div>
          <label className="block font-medium text-[#5e554a] mb-1">
            Дневной норматив (мин/день)
          </label>
          <select
            value={dailyTrainingTime}
            onChange={(e) => setDailyTrainingTime(Number(e.target.value))}
            className="w-full h-9 px-3 bg-[#efe9df]/60 border border-[#1f1b16]/15 rounded-lg text-[#1f1b16] font-mono tabular-nums focus:bg-[#fdfbf7] focus:outline-none focus:border-[#1f1b16]/40"
          >
            <option value={15}>15 минут (2 подхода по 7 мин)</option>
            <option value={20}>20 минут (2 подхода по 10 мин)</option>
            <option value={30}>30 минут (3 подхода по 10 мин)</option>
            <option value={45}>45 минут (3 подхода по 15 мин)</option>
            <option value={60}>60 минут (4 подхода по 15 мин)</option>
          </select>
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

      {/* 5. Initial OKD Skills checkbox for new dogs */}
      {!dogToEdit && (
        <div className="pt-3 border-t border-[#1f1b16]/10">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={initOkdSkills}
              onChange={(e) => setInitOkdSkills(e.target.checked)}
              className="size-4 rounded border-[#1f1b16]/25 text-[#1f5c3a] focus:ring-[#1f5c3a]"
            />
            <span className="font-medium text-[#1f1b16]">
              Подключить 9 базовых нормативов курса ОКД (Сидеть, Лежать, Рядом, Выдержка и др.)
            </span>
          </label>
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

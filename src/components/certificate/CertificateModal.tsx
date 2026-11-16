import React, { useState, useRef, useEffect, useId } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { toast } from 'sonner';
import { X, Download, FileDown, Check } from 'lucide-react';
import type {
  CertificateConfig,
  DiplomaPaletteId,
  DiplomaTemplateId,
  Dog,
  TrainerProfile,
} from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex, formatDogAgeRussian } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog;
}

interface DiplomaPaletteSpec {
  id: DiplomaPaletteId;
  label: string;
  bg: string;
  surface: string;
  surfaceSoft: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  okdBadgeBg: string;
  okdBadgeText: string;
  swatch: [string, string, string];
}

const DIPLOMA_TEMPLATES: ReadonlyArray<{
  id: DiplomaTemplateId;
  label: string;
}> = [
  { id: 'archival', label: 'Классическая рамка' },
  { id: 'minimal', label: 'Минимализм' },
  { id: 'editorial', label: 'Журнальный лист' },
  { id: 'warm_card', label: 'Уютная открытка' },
];

const DIPLOMA_PALETTES: Record<DiplomaPaletteId, DiplomaPaletteSpec> = {
  sand_gold: {
    id: 'sand_gold',
    label: 'Тёплый беж и золото',
    bg: '#faf6ee',
    surface: '#fdfbf7',
    surfaceSoft: '#efe9df',
    textPrimary: '#1f1b16',
    textSecondary: '#5e554a',
    textMuted: '#7b7266',
    accent: '#8c6d3f',
    accentSoft: 'rgba(140, 109, 63, 0.14)',
    border: 'rgba(31, 27, 22, 0.16)',
    borderStrong: '#1f1b16',
    okdBadgeBg: 'rgba(140, 109, 63, 0.13)',
    okdBadgeText: '#6d522b',
    swatch: ['#faf6ee', '#8c6d3f', '#1f1b16'],
  },
  forest_sage: {
    id: 'forest_sage',
    label: 'Лесной зелёный',
    bg: '#f4f7f4',
    surface: '#fbfdfb',
    surfaceSoft: '#e4ece5',
    textPrimary: '#17261d',
    textSecondary: '#43584b',
    textMuted: '#677b6f',
    accent: '#286144',
    accentSoft: 'rgba(40, 97, 68, 0.12)',
    border: 'rgba(23, 38, 29, 0.16)',
    borderStrong: '#1f4b34',
    okdBadgeBg: 'rgba(40, 97, 68, 0.12)',
    okdBadgeText: '#1f5137',
    swatch: ['#f4f7f4', '#286144', '#17261d'],
  },
  graphite_ink: {
    id: 'graphite_ink',
    label: 'Графит и золото',
    bg: '#f6f5f2',
    surface: '#ffffff',
    surfaceSoft: '#ebe8e1',
    textPrimary: '#18181b',
    textSecondary: '#4b4a46',
    textMuted: '#73716b',
    accent: '#a68342',
    accentSoft: 'rgba(166, 131, 66, 0.14)',
    border: 'rgba(24, 24, 27, 0.16)',
    borderStrong: '#18181b',
    okdBadgeBg: 'rgba(24, 24, 27, 0.08)',
    okdBadgeText: '#27272a',
    swatch: ['#f6f5f2', '#18181b', '#a68342'],
  },
  terracotta_rose: {
    id: 'terracotta_rose',
    label: 'Терракота',
    bg: '#fbf4f0',
    surface: '#fffaf7',
    surfaceSoft: '#f3e3da',
    textPrimary: '#2a1a16',
    textSecondary: '#684d45',
    textMuted: '#8c6f66',
    accent: '#b55239',
    accentSoft: 'rgba(181, 82, 57, 0.12)',
    border: 'rgba(42, 26, 22, 0.15)',
    borderStrong: '#8c3b27',
    okdBadgeBg: 'rgba(181, 82, 57, 0.12)',
    okdBadgeText: '#8c3b27',
    swatch: ['#fbf4f0', '#b55239', '#2a1a16'],
  },
  indigo_slate: {
    id: 'indigo_slate',
    label: 'Глубокий синий',
    bg: '#f3f5f9',
    surface: '#fafbfe',
    surfaceSoft: '#e3e8f2',
    textPrimary: '#161f33',
    textSecondary: '#44506b',
    textMuted: '#6b7791',
    accent: '#2c4b82',
    accentSoft: 'rgba(44, 75, 130, 0.12)',
    border: 'rgba(22, 31, 51, 0.15)',
    borderStrong: '#2c4b82',
    okdBadgeBg: 'rgba(44, 75, 130, 0.11)',
    okdBadgeText: '#1f3966',
    swatch: ['#f3f5f9', '#2c4b82', '#161f33'],
  },
};

const DIPLOMA_PALETTE_LIST: DiplomaPaletteSpec[] = [
  DIPLOMA_PALETTES.sand_gold,
  DIPLOMA_PALETTES.forest_sage,
  DIPLOMA_PALETTES.graphite_ink,
  DIPLOMA_PALETTES.terracotta_rose,
  DIPLOMA_PALETTES.indigo_slate,
];

const DEFAULT_RENDER_CONFIG: CertificateConfig = {
  templateId: 'archival',
  paletteId: 'sand_gold',
  includeOkdPercent: true,
  includeTrainerName: false,
};

const DIPLOMA_COURSE_OPTIONS = [
  'Общий курс дрессировки (ОКД)',
  'Защитно-караульная служба (ЗКС)',
  'Курс «Активный спорт»',
  'Курс «Контакт, внимание и доверие»',
  'Курс городской управляемости и коррекции поведения',
] as const;

function getDefaultCourseForDog(dog: Dog): string {
  if (dog.skills.some((s) => s.category === 'okd')) return DIPLOMA_COURSE_OPTIONS[0];
  if (dog.skills.some((s) => s.category === 'zks')) return DIPLOMA_COURSE_OPTIONS[1];
  if (dog.skills.some((s) => s.category === 'sport')) return DIPLOMA_COURSE_OPTIONS[2];
  if (dog.skills.some((s) => s.category === 'attention' || s.category === 'trust')) {
    return DIPLOMA_COURSE_OPTIONS[3];
  }
  if (dog.skills.some((s) => s.category === 'behavior')) return DIPLOMA_COURSE_OPTIONS[4];
  return DIPLOMA_COURSE_OPTIONS[0];
}

function getOfficialGenderTitle(gender: Dog['gender']): string {
  return gender === 'female' ? '«Самая хорошая девочка»' : '«Самый хороший мальчик»';
}

function sanitizeFilenamePart(value: string): string {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '_') || 'Ученик'
  );
}

async function renderDiplomaPngDataUrl(
  element: HTMLElement,
  backgroundColor: string
): Promise<string> {
  return toPng(element, {
    width: 1000,
    height: 707,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor,
  });
}

async function exportDiplomaPng(
  element: HTMLElement | null,
  dogName: string,
  backgroundColor: string
): Promise<void> {
  if (!element) return;
  try {
    const dataUrl = await renderDiplomaPngDataUrl(element, backgroundColor);
    const safeName = sanitizeFilenamePart(dogName);
    const link = document.createElement('a');
    link.download = `Paw-Paw_Diploma_${safeName}_A4.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Диплом сохранён в формате PNG HD');
  } catch {
    toast.error('Не удалось сформировать PNG файл');
  }
}

async function exportDiplomaPdf(
  element: HTMLElement | null,
  dogName: string,
  backgroundColor: string
): Promise<void> {
  if (!element) return;
  try {
    const dataUrl = await renderDiplomaPngDataUrl(element, backgroundColor);
    const safeName = sanitizeFilenamePart(dogName);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
    pdf.save(`Paw-Paw_Diploma_${safeName}_A4.pdf`);
    toast.success('Архивный диплом А4 сохранён в формате PDF');
  } catch {
    toast.error('Не удалось сформировать PDF документ');
  }
}

function graduateDogAndIssueDiploma(
  dog: Dog,
  updateDog: (id: string, updates: Partial<Dog>) => void,
  issueCertificate: (dogId: string) => void
): void {
  const now = new Date().toISOString();
  const maxedSkills = dog.skills.map((skill) => ({
    ...skill,
    mastery: 100,
    lastScore: 5,
    lastUpdated: now,
  }));

  updateDog(dog.id, {
    skills: maxedSkills,
    certificateIssued: true,
    certificateIssuedAt: now,
  });
  issueCertificate(dog.id);

  try {
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  } catch {
    // Ignore confetti errors in non-canvas environments
  }

  const officialGenderTitle = getOfficialGenderTitle(dog.gender);
  toast.success(`Курс доведён до 100%, диплом выдан для ${dog.name}`, {
    description: `Присвоено звание ${officialGenderTitle}`,
  });
}

const PawHeartEmblem: React.FC<{
  palette: DiplomaPaletteSpec;
  variant: DiplomaTemplateId;
  size?: number;
}> = ({ palette, variant, size = 76 }) => {
  const ringOpacity = variant === 'minimal' ? 0.5 : 0.85;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Эмблема лапка с сердечком"
    >
      {variant === 'archival' && (
        <>
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke={palette.accent}
            strokeWidth="1.2"
            strokeDasharray="2.5 2"
            strokeOpacity="0.85"
          />
          <circle cx="50" cy="50" r="41" stroke={palette.accent} strokeWidth="0.9" />
        </>
      )}

      {variant === 'minimal' && (
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke={palette.accent}
          strokeWidth="1"
          strokeOpacity={ringOpacity}
        />
      )}

      {variant === 'editorial' && (
        <>
          <circle cx="50" cy="50" r="44" stroke={palette.borderStrong} strokeWidth="1.2" />
          <circle cx="50" cy="50" r="39.5" stroke={palette.accent} strokeWidth="0.75" />
        </>
      )}

      {variant === 'warm_card' && (
        <>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill={palette.surfaceSoft}
            stroke={palette.accent}
            strokeWidth="1"
            strokeOpacity="0.55"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={palette.accent}
            strokeWidth="0.8"
            strokeDasharray="3 2.5"
            strokeOpacity="0.65"
          />
        </>
      )}

      {/* Four paw toes */}
      <ellipse
        cx="29"
        cy="43"
        rx="5.5"
        ry="7.8"
        transform="rotate(-24 29 43)"
        fill={palette.accent}
      />
      <ellipse
        cx="41.5"
        cy="32"
        rx="5.5"
        ry="8.2"
        transform="rotate(-9 41.5 32)"
        fill={palette.accent}
      />
      <ellipse
        cx="58.5"
        cy="32"
        rx="5.5"
        ry="8.2"
        transform="rotate(9 58.5 32)"
        fill={palette.accent}
      />
      <ellipse
        cx="71"
        cy="43"
        rx="5.5"
        ry="7.8"
        transform="rotate(24 71 43)"
        fill={palette.accent}
      />

      {/* Main paw pad */}
      <path
        d="M 50 44 C 57.5 44 63.5 49.5 67 57.5 C 69.5 63.8 66.8 71 59.8 71.8 C 54.6 72.4 51.8 69.8 50 69.8 C 48.2 69.8 45.4 72.4 40.2 71.8 C 33.2 71 30.5 63.8 33 57.5 C 36.5 49.5 42.5 44 50 44 Z"
        fill={palette.accent}
      />

      {/* Heart inside the main paw pad */}
      <path
        d="M 50 66.2 C 50 66.2 41 60.4 41 55 C 41 52.1 43.3 49.8 46 49.8 C 47.8 49.8 49.3 50.8 50 52.2 C 50.7 50.8 52.2 49.8 54 49.8 C 56.7 49.8 59 52.1 59 55 C 59 60.4 50 66.2 50 66.2 Z"
        fill={palette.bg}
      />
    </svg>
  );
};

const TemplateBackdrop: React.FC<{
  templateId: DiplomaTemplateId;
  palette: DiplomaPaletteSpec;
  patternId: string;
}> = ({ templateId, palette, patternId }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1000 707"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {templateId === 'archival' && (
        <>
          <defs>
            <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 0 12 Q 6 6 12 12 T 24 12"
                stroke={palette.accent}
                strokeWidth="0.45"
                strokeOpacity="0.18"
                fill="none"
              />
              <path
                d="M 12 0 Q 6 6 12 12 T 12 24"
                stroke={palette.accent}
                strokeWidth="0.45"
                strokeOpacity="0.18"
                fill="none"
              />
            </pattern>
          </defs>

          <rect x="24" y="24" width="952" height="659" fill={`url(#${patternId})`} />
          <rect x="34" y="34" width="932" height="639" fill={palette.bg} />
          <rect
            x="22"
            y="22"
            width="956"
            height="663"
            stroke={palette.borderStrong}
            strokeWidth="1.5"
          />
          <rect x="28" y="28" width="944" height="651" stroke={palette.accent} strokeWidth="0.8" />
          <rect
            x="34"
            y="34"
            width="932"
            height="639"
            stroke={palette.borderStrong}
            strokeWidth="0.75"
            strokeOpacity="0.55"
          />

          <path d="M 16 38 L 38 38 L 38 16" stroke={palette.accent} strokeWidth="1" />
          <circle cx="38" cy="38" r="2.5" fill={palette.accent} />
          <path d="M 984 38 L 962 38 L 962 16" stroke={palette.accent} strokeWidth="1" />
          <circle cx="962" cy="38" r="2.5" fill={palette.accent} />
          <path d="M 16 669 L 38 669 L 38 691" stroke={palette.accent} strokeWidth="1" />
          <circle cx="38" cy="669" r="2.5" fill={palette.accent} />
          <path d="M 984 669 L 962 669 L 962 691" stroke={palette.accent} strokeWidth="1" />
          <circle cx="962" cy="669" r="2.5" fill={palette.accent} />
        </>
      )}

      {templateId === 'minimal' && (
        <>
          <rect x="28" y="28" width="944" height="651" stroke={palette.border} strokeWidth="1" />
          <rect x="28" y="28" width="176" height="3" fill={palette.accent} />
          <rect x="796" y="676" width="176" height="3" fill={palette.accent} />
        </>
      )}

      {templateId === 'editorial' && (
        <>
          <rect x="0" y="0" width="22" height="707" fill={palette.accent} />
          <rect
            x="32"
            y="26"
            width="942"
            height="655"
            stroke={palette.border}
            strokeWidth="1"
          />
          <line x1="32" y1="30" x2="974" y2="30" stroke={palette.accent} strokeWidth="0.75" />
        </>
      )}

      {templateId === 'warm_card' && (
        <>
          <rect x="0" y="0" width="1000" height="707" fill={palette.surfaceSoft} />
          <rect
            x="24"
            y="22"
            width="952"
            height="663"
            rx="24"
            fill={palette.bg}
            stroke={palette.accent}
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <rect
            x="34"
            y="32"
            width="932"
            height="643"
            rx="18"
            stroke={palette.accent}
            strokeOpacity="0.32"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  );
};

interface DiplomaMetadataGridProps {
  palette: DiplomaPaletteSpec;
  formattedBirthDate: string;
  ageLabel: string;
  weight: number;
  ownerName: string;
  className?: string;
}

const DiplomaMetadataGrid: React.FC<DiplomaMetadataGridProps> = ({
  palette,
  formattedBirthDate,
  ageLabel,
  weight,
  ownerName,
  className,
}) => (
  <div className={cn('grid grid-cols-3 gap-4 text-xs', className)}>
    <div>
      <div style={{ color: palette.textMuted }}>Дата рождения и возраст</div>
      <div
        className="font-mono tabular-nums font-medium mt-0.5"
        style={{ color: palette.textPrimary }}
      >
        {formattedBirthDate} ({ageLabel})
      </div>
    </div>
    <div>
      <div style={{ color: palette.textMuted }}>Масса тела</div>
      <div
        className="font-mono tabular-nums font-medium mt-0.5"
        style={{ color: palette.textPrimary }}
      >
        {weight} кг
      </div>
    </div>
    <div>
      <div style={{ color: palette.textMuted }}>Владелец (проводник)</div>
      <div className="font-medium mt-0.5" style={{ color: palette.textPrimary }}>
        {ownerName}
      </div>
    </div>
  </div>
);

interface DiplomaCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const DiplomaCheckbox: React.FC<DiplomaCheckboxProps> = ({ id, checked, onChange, label }) => (
  <label
    htmlFor={id}
    className="inline-flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none"
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <span
      className={cn(
        'size-4 rounded-[4px] border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-forest)]',
        checked
          ? 'bg-[#286144] border-[#286144] text-white dark:bg-[#58b482] dark:border-[#58b482] dark:text-[#12100e]'
          : 'bg-[var(--bg-note)] border-[var(--border-strong)] text-transparent'
      )}
      aria-hidden="true"
    >
      <Check className="size-3 stroke-[2.4]" />
    </span>
    <span>{label}</span>
  </label>
);

interface DiplomaFooterProps {
  palette: DiplomaPaletteSpec;
  templateId: DiplomaTemplateId;
  formattedIssueDate: string;
  trainerName: string | null;
  emblemSize?: number;
  className?: string;
}

const DiplomaFooter: React.FC<DiplomaFooterProps> = ({
  palette,
  templateId,
  formattedIssueDate,
  trainerName,
  emblemSize = 74,
  className,
}) => {
  return (
    <div
      className={cn('relative z-10 pt-3.5 border-t grid grid-cols-3 items-end gap-4', className)}
      style={{ borderColor: palette.border }}
    >
      <div className="space-y-1 text-left">
        <div className="text-[11px]" style={{ color: palette.textMuted }}>
          Дата выдачи
        </div>
        <div
          className="font-mono tabular-nums text-sm font-medium"
          style={{ color: palette.textPrimary }}
        >
          {formattedIssueDate}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <PawHeartEmblem palette={palette} variant={templateId} size={emblemSize} />
      </div>

      <div className="text-right min-h-[24px] flex items-end justify-end">
        {trainerName && (
          <div className="text-xs font-medium" style={{ color: palette.textPrimary }}>
            <span style={{ color: palette.textMuted }}>Кинолог: </span>
            <span>{trainerName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export interface DiplomaCanvasProps {
  dog: Dog;
  trainerProfile: TrainerProfile;
  selectedCourse: string;
  config?: CertificateConfig;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const DiplomaCanvas: React.FC<DiplomaCanvasProps> = ({
  dog,
  trainerProfile,
  selectedCourse,
  config = DEFAULT_RENDER_CONFIG,
  sheetRef,
}) => {
  const rawId = useId();
  const patternId = `guillocheGrid_${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [fallbackDate] = useState<Date>(() => new Date());

  const templateId: DiplomaTemplateId = config.templateId ?? 'archival';
  const palette: DiplomaPaletteSpec =
    DIPLOMA_PALETTES[config.paletteId] ?? DIPLOMA_PALETTES.sand_gold;

  const imgError = Boolean(dog.avatar && failedAvatar === dog.avatar);
  const showAvatarImg = Boolean(dog.avatar) && !imgError;
  const monogram = dog.name.slice(0, 2).toUpperCase();

  const { overallIndex, okdIndex } = calculateOverallDogIndex(dog.skills);
  const hasOkdSkills = dog.skills.some((s) => s.category === 'okd');
  const okdPercent = hasOkdSkills ? okdIndex : overallIndex;
  const okdLabel = hasOkdSkills ? 'Процент сдачи ОКД' : 'Результат аттестации';

  const officialGenderTitle = getOfficialGenderTitle(dog.gender);
  const genderLabel = dog.gender === 'female' ? 'Сука' : 'Кобель';

  const issueDateObj = dog.certificateIssuedAt ? parseISO(dog.certificateIssuedAt) : fallbackDate;
  const formattedIssueDate = Number.isNaN(issueDateObj.getTime())
    ? format(fallbackDate, 'd MMMM yyyy г.', { locale: ru })
    : format(issueDateObj, 'd MMMM yyyy г.', { locale: ru });

  const formattedBirthDate = (() => {
    try {
      const parsed = parseISO(dog.birthDate);
      if (Number.isNaN(parsed.getTime())) return dog.birthDate || '—';
      return format(parsed, 'dd.MM.yyyy');
    } catch {
      return dog.birthDate || '—';
    }
  })();

  const ageLabel = formatDogAgeRussian(dog.birthDate);
  const completionVerb =
    dog.gender === 'female'
      ? 'Успешно освоила программу испытаний'
      : 'Успешно освоил программу испытаний';

  const trimmedTrainerName = trainerProfile.name.trim();
  const visibleTrainerName =
    config.includeTrainerName && trimmedTrainerName.length > 0 ? trimmedTrainerName : null;

  const renderPortrait = (wrapperClass: string, imgRadiusClass: string, monogramSize: string) => (
    <div
      className={cn('overflow-hidden flex items-center justify-center', wrapperClass, imgRadiusClass)}
      style={{
        backgroundColor: palette.surfaceSoft,
        borderColor: palette.border,
      }}
    >
      {showAvatarImg ? (
        <img
          src={dog.avatar}
          alt={dog.name}
          crossOrigin="anonymous"
          className="size-full object-cover"
          onError={() => setFailedAvatar(dog.avatar)}
        />
      ) : (
        <span
          className={cn('font-serif font-medium', monogramSize)}
          style={{ color: palette.textSecondary }}
        >
          {monogram}
        </span>
      )}
    </div>
  );

  return (
    <div
      ref={sheetRef}
      style={{
        backgroundColor: palette.bg,
        color: palette.textPrimary,
      }}
      className={cn(
        'relative w-[1000px] min-w-[1000px] h-[707px] select-none shadow-[0_8px_24px_rgba(31,27,22,0.08)] overflow-hidden flex flex-col justify-between',
        templateId === 'editorial'
          ? 'pl-14 pr-10 py-10'
          : templateId === 'warm_card'
            ? 'px-12 py-9'
            : 'p-11'
      )}
    >
      <TemplateBackdrop templateId={templateId} palette={palette} patternId={patternId} />

      {/* 1. ARCHIVAL TEMPLATE */}
      {templateId === 'archival' && (
        <>
          <div className="relative z-10 text-center pt-2 px-6">
            <div className="flex items-center justify-center gap-4">
              <span className="h-px w-16" style={{ backgroundColor: palette.accent }} />
              <h1
                className="font-serif text-[40px] leading-none font-medium tracking-[0.06em]"
                style={{ color: palette.textPrimary }}
              >
                СЕРТИФИКАТ
              </h1>
              <span className="h-px w-16" style={{ backgroundColor: palette.accent }} />
            </div>
          </div>

          <div className="relative z-10 px-6 grid grid-cols-12 gap-8 items-center my-auto">
            <div className="col-span-4 flex flex-col items-center justify-center">
              <div
                className="relative size-44 rounded-full p-2 border shadow-[0_2px_10px_rgba(31,27,22,0.06)] flex items-center justify-center"
                style={{
                  borderColor: palette.accent,
                  backgroundColor: palette.surface,
                }}
              >
                {renderPortrait('size-full border', 'rounded-full', 'text-4xl')}
              </div>
            </div>

            <div
              className="col-span-8 space-y-3.5 text-left border-l pl-8"
              style={{ borderColor: palette.border }}
            >
              <div>
                <div className="text-xs" style={{ color: palette.textMuted }}>
                  Настоящим удостоверяется, что собака по кличке
                </div>
                <div
                  className="flex items-baseline justify-between gap-4 mt-0.5 border-b pb-2"
                  style={{ borderColor: palette.border }}
                >
                  <h2
                    className="font-serif text-[36px] leading-tight font-medium"
                    style={{ color: palette.textPrimary }}
                  >
                    {dog.name}
                  </h2>
                  <span className="text-sm" style={{ color: palette.textSecondary }}>
                    {dog.breed} · {genderLabel}
                  </span>
                </div>
              </div>

              <DiplomaMetadataGrid
                palette={palette}
                formattedBirthDate={formattedBirthDate}
                ageLabel={ageLabel}
                weight={dog.weight}
                ownerName={dog.ownerName}
                className="py-0.5"
              />

              <div
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                <div className="text-[11px]" style={{ color: palette.textMuted }}>
                  {completionVerb}
                </div>
                <div
                  className="text-sm font-medium mt-0.5"
                  style={{ color: palette.textPrimary }}
                >
                  {selectedCourse}
                </div>
              </div>

              <div
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.accent,
                }}
              >
                <div className="text-[11px]" style={{ color: palette.textSecondary }}>
                  Присуждается звание
                </div>
                <div
                  data-testid="certificate-gender-title"
                  className="font-serif text-[25px] leading-snug font-medium mt-0.5"
                  style={{ color: palette.textPrimary }}
                >
                  {officialGenderTitle}
                </div>
              </div>

              {config.includeOkdPercent && (
                <div
                  className="px-3.5 py-2 rounded-lg flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: palette.okdBadgeBg,
                    color: palette.okdBadgeText,
                  }}
                >
                  <span className="font-medium">{okdLabel}</span>
                  <span className="font-mono tabular-nums text-sm font-semibold">
                    {okdPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <DiplomaFooter
            palette={palette}
            templateId="archival"
            formattedIssueDate={formattedIssueDate}
            trainerName={visibleTrainerName}
            className="px-6"
          />
        </>
      )}

      {/* 2. MINIMAL TEMPLATE */}
      {templateId === 'minimal' && (
        <>
          <div
            className="relative z-10 px-6 pt-3 pb-4 border-b flex items-end justify-between"
            style={{ borderColor: palette.border }}
          >
            <h1
              className="font-serif text-[42px] leading-none font-normal tracking-[0.08em]"
              style={{ color: palette.textPrimary }}
            >
              СЕРТИФИКАТ
            </h1>
            <span
              className="size-2.5 rounded-full mb-1"
              style={{ backgroundColor: palette.accent }}
            />
          </div>

          <div className="relative z-10 px-6 grid grid-cols-12 gap-9 items-center my-auto">
            <div className="col-span-4 flex items-center justify-center">
              {renderPortrait('w-44 h-52 border', 'rounded-2xl', 'text-4xl')}
            </div>

            <div className="col-span-8 space-y-4 text-left">
              <div>
                <div className="text-xs" style={{ color: palette.textMuted }}>
                  Настоящим удостоверяется, что собака по кличке
                </div>
                <div className="flex items-baseline justify-between gap-4 mt-1">
                  <h2
                    className="font-serif text-[38px] leading-none font-normal"
                    style={{ color: palette.textPrimary }}
                  >
                    {dog.name}
                  </h2>
                  <span className="text-sm" style={{ color: palette.textSecondary }}>
                    {dog.breed} · {genderLabel}
                  </span>
                </div>
              </div>

              <div
                className="py-2.5 border-y"
                style={{ borderColor: palette.border }}
              >
                <DiplomaMetadataGrid
                  palette={palette}
                  formattedBirthDate={formattedBirthDate}
                  ageLabel={ageLabel}
                  weight={dog.weight}
                  ownerName={dog.ownerName}
                />
              </div>

              <div
                className="border-l-2 pl-3.5 py-0.5"
                style={{ borderColor: palette.border }}
              >
                <div className="text-[11px]" style={{ color: palette.textMuted }}>
                  {completionVerb}
                </div>
                <div className="text-sm font-medium mt-0.5" style={{ color: palette.textPrimary }}>
                  {selectedCourse}
                </div>
              </div>

              <div
                className="border-l-[3px] pl-4 py-1"
                style={{ borderColor: palette.accent }}
              >
                <div className="text-[11px]" style={{ color: palette.textSecondary }}>
                  Присуждается звание
                </div>
                <div
                  data-testid="certificate-gender-title"
                  className="font-serif text-[26px] leading-snug font-medium mt-0.5"
                  style={{ color: palette.textPrimary }}
                >
                  {officialGenderTitle}
                </div>
              </div>

              {config.includeOkdPercent && (
                <div className="pt-1 flex items-center">
                  <span
                    className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: palette.okdBadgeBg,
                      color: palette.okdBadgeText,
                    }}
                  >
                    <span>{okdLabel}</span>
                    <span className="font-mono tabular-nums font-semibold">{okdPercent}%</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <DiplomaFooter
            palette={palette}
            templateId="minimal"
            formattedIssueDate={formattedIssueDate}
            trainerName={visibleTrainerName}
            emblemSize={68}
            className="px-6"
          />
        </>
      )}

      {/* 3. EDITORIAL TEMPLATE */}
      {templateId === 'editorial' && (
        <>
          <div
            className="relative z-10 flex items-center gap-5 pb-4 border-b"
            style={{ borderColor: palette.border }}
          >
            <h1
              className="font-serif text-[44px] leading-none font-medium tracking-[-0.01em]"
              style={{ color: palette.textPrimary }}
            >
              СЕРТИФИКАТ
            </h1>
            <div className="h-[2px] flex-1" style={{ backgroundColor: palette.accent }} />
          </div>

          <div className="relative z-10 grid grid-cols-12 gap-7 items-center my-auto">
            <div className="col-span-8 space-y-4 text-left">
              <div>
                <div className="text-xs" style={{ color: palette.textMuted }}>
                  Настоящим удостоверяется, что собака по кличке
                </div>
                <div className="flex items-baseline justify-between gap-4 mt-0.5">
                  <h2
                    className="font-serif text-[40px] leading-tight font-medium"
                    style={{ color: palette.textPrimary }}
                  >
                    {dog.name}
                  </h2>
                  <span className="text-sm" style={{ color: palette.textSecondary }}>
                    {dog.breed} · {genderLabel}
                  </span>
                </div>
              </div>

              <div
                className="py-2.5 border-y"
                style={{ borderColor: palette.border }}
              >
                <DiplomaMetadataGrid
                  palette={palette}
                  formattedBirthDate={formattedBirthDate}
                  ageLabel={ageLabel}
                  weight={dog.weight}
                  ownerName={dog.ownerName}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div
                  className="p-3.5 rounded-lg border flex flex-col justify-center"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  }}
                >
                  <div className="text-[11px]" style={{ color: palette.textMuted }}>
                    {completionVerb}
                  </div>
                  <div
                    className="text-sm font-medium mt-1 leading-snug"
                    style={{ color: palette.textPrimary }}
                  >
                    {selectedCourse}
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-lg border flex flex-col justify-center"
                  style={{
                    backgroundColor: palette.surfaceSoft,
                    borderColor: palette.accent,
                  }}
                >
                  <div className="text-[11px]" style={{ color: palette.textSecondary }}>
                    Присуждается звание
                  </div>
                  <div
                    data-testid="certificate-gender-title"
                    className="font-serif text-[21px] leading-snug font-medium mt-0.5"
                    style={{ color: palette.textPrimary }}
                  >
                    {officialGenderTitle}
                  </div>
                </div>
              </div>

              {config.includeOkdPercent && (
                <div
                  className="px-4 py-2 rounded-lg flex items-center justify-between text-xs border"
                  style={{
                    backgroundColor: palette.okdBadgeBg,
                    borderColor: palette.border,
                    color: palette.okdBadgeText,
                  }}
                >
                  <span className="font-medium">{okdLabel}</span>
                  <span className="font-mono tabular-nums text-sm font-semibold">
                    {okdPercent}%
                  </span>
                </div>
              )}
            </div>

            <div className="col-span-4 flex items-center justify-center">
              <div
                className="w-48 h-56 rounded-xl p-1.5 border shadow-[0_2px_10px_rgba(31,27,22,0.06)]"
                style={{
                  borderColor: palette.accent,
                  backgroundColor: palette.surface,
                }}
              >
                {renderPortrait('size-full border', 'rounded-[9px]', 'text-4xl')}
              </div>
            </div>
          </div>

          <DiplomaFooter
            palette={palette}
            templateId="editorial"
            formattedIssueDate={formattedIssueDate}
            trainerName={visibleTrainerName}
            emblemSize={72}
          />
        </>
      )}

      {/* 4. WARM CARD TEMPLATE */}
      {templateId === 'warm_card' && (
        <>
          <div className="relative z-10 text-center pt-1">
            <h1
              className="font-serif text-[36px] leading-none font-medium tracking-[0.04em]"
              style={{ color: palette.textPrimary }}
            >
              СЕРТИФИКАТ
            </h1>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-3">
            <div
              className="size-28 rounded-full p-1.5 border flex items-center justify-center"
              style={{
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.accent,
              }}
            >
              {renderPortrait('size-full border', 'rounded-full', 'text-3xl')}
            </div>

            <div>
              <div className="text-[11px]" style={{ color: palette.textMuted }}>
                Настоящим удостоверяется, что собака по кличке
              </div>
              <h2
                className="font-serif text-[34px] leading-tight font-medium mt-0.5"
                style={{ color: palette.textPrimary }}
              >
                {dog.name}
              </h2>
              <div
                className="text-xs mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5"
                style={{ color: palette.textSecondary }}
              >
                <span>
                  {dog.breed} · {genderLabel}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums">
                  {formattedBirthDate} ({ageLabel})
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums">{dog.weight} кг</span>
                <span>·</span>
                <span>Владелец: {dog.ownerName}</span>
              </div>
            </div>

            <div className="w-full max-w-[780px] grid grid-cols-2 gap-4 text-left pt-1">
              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                <div className="text-[11px]" style={{ color: palette.textMuted }}>
                  {completionVerb}
                </div>
                <div
                  className="text-sm font-medium mt-1 leading-snug"
                  style={{ color: palette.textPrimary }}
                >
                  {selectedCourse}
                </div>
              </div>

              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center"
                style={{
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.accent,
                }}
              >
                <div className="text-[11px]" style={{ color: palette.textSecondary }}>
                  Присуждается звание
                </div>
                <div
                  data-testid="certificate-gender-title"
                  className="font-serif text-[22px] leading-snug font-medium mt-0.5"
                  style={{ color: palette.textPrimary }}
                >
                  {officialGenderTitle}
                </div>
              </div>
            </div>

            {config.includeOkdPercent && (
              <div
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: palette.okdBadgeBg,
                  color: palette.okdBadgeText,
                }}
              >
                <span>{okdLabel}</span>
                <span className="font-mono tabular-nums font-semibold">{okdPercent}%</span>
              </div>
            )}
          </div>

          <DiplomaFooter
            palette={palette}
            templateId="warm_card"
            formattedIssueDate={formattedIssueDate}
            trainerName={visibleTrainerName}
            emblemSize={68}
            className="px-4"
          />
        </>
      )}
    </div>
  );
};

export interface ScaledDiplomaPreviewProps extends DiplomaCanvasProps {
  className?: string;
}

export const ScaledDiplomaPreview: React.FC<ScaledDiplomaPreviewProps> = ({
  dog,
  trainerProfile,
  selectedCourse,
  config,
  sheetRef,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const available = el.clientWidth;
      if (available > 0) {
        setScale(Math.min(1, Math.max(0.32, available / 1000)));
      }
    };

    updateScale();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateScale);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledWidth = Math.round(1000 * scale);
  const scaledHeight = Math.round(707 * scale);

  return (
    <div className={cn('w-full space-y-2.5', className)}>
      <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
        <div
          style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
          className="relative flex-shrink-0"
        >
          <div
            style={{
              width: '1000px',
              height: '707px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <DiplomaCanvas
              dog={dog}
              trainerProfile={trainerProfile}
              selectedCourse={selectedCourse}
              config={config}
              sheetRef={sheetRef}
            />
          </div>
        </div>
      </div>

      {scale < 0.98 && (
        <div className="text-center font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">
          Масштаб предпросмотра {Math.round(scale * 100)}% · Экспорт в полном формате А4 (2000×1414 px)
        </div>
      )}
    </div>
  );
};

export interface DiplomaStudioProps {
  dog: Dog;
  idPrefix?: string;
  renderTopBar?: (ctx: {
    handleGraduate: () => void;
    officialGenderTitle: string;
  }) => React.ReactNode;
  controlsClassName?: string;
  previewContainerClassName?: string;
}

export const DiplomaStudio: React.FC<DiplomaStudioProps> = ({
  dog,
  idPrefix = 'cert',
  renderTopBar,
  controlsClassName,
  previewContainerClassName,
}) => {
  const trainerProfile = useDogStore((s) => s.trainerProfile);
  const updateTrainerProfile = useDogStore((s) => s.updateTrainerProfile);
  const certificateConfig = useDogStore((s) => s.certificateConfig);
  const updateCertificateConfig = useDogStore((s) => s.updateCertificateConfig);
  const updateDog = useDogStore((s) => s.updateDog);
  const issueCertificate = useDogStore((s) => s.issueCertificate);

  const [courseByDogId, setCourseByDogId] = useState<Record<string, string>>({});
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const selectedCourse = courseByDogId[dog.id] ?? getDefaultCourseForDog(dog);
  const hasOkdSkills = dog.skills.some((s) => s.category === 'okd');
  const officialGenderTitle = getOfficialGenderTitle(dog.gender);
  const activePalette =
    DIPLOMA_PALETTES[certificateConfig.paletteId] ?? DIPLOMA_PALETTES.sand_gold;

  const handleCourseChange = (course: string) => {
    setCourseByDogId((prev) => ({
      ...prev,
      [dog.id]: course,
    }));
  };

  const handleGraduate = () => {
    graduateDogAndIssueDiploma(dog, updateDog, issueCertificate);
  };

  const handleDownloadPng = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    try {
      await exportDiplomaPng(certificateRef.current, dog.name, activePalette.bg);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportDiplomaPdf(certificateRef.current, dog.name, activePalette.bg);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      {renderTopBar?.({ handleGraduate, officialGenderTitle })}

      {/* Controls Bar: Template, Palette, Program, Optional OKD %, Optional Trainer Name & Export */}
      <div
        className={cn(
          'bg-[var(--bg-sheet)] border-b border-[var(--border-subtle)] space-y-3.5',
          controlsClassName
        )}
      >
        {/* Row 1: Program selector + Export actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="w-full md:max-w-md">
            <label
              htmlFor={`${idPrefix}-course-select`}
              className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1"
            >
              Наименование программы
            </label>
            <select
              id={`${idPrefix}-course-select`}
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="h-9 w-full px-2.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-note)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              {DIPLOMA_COURSE_OPTIONS.map((course) => (
                <option
                  key={course}
                  value={course}
                  className="bg-[var(--bg-sheet)] text-[var(--text-primary)]"
                >
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExportingPng}
              className="h-9 px-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="size-3.5 stroke-[1.5]" />
              <span>{isExportingPng ? 'Экспорт...' : 'Скачать PNG HD'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="h-9 px-3.5 rounded-[8px] bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileDown className="size-3.5 stroke-[1.5]" />
              <span>{isExportingPdf ? 'Экспорт...' : 'Скачать PDF А4'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Template Style + Color Palette */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 pt-1 border-t border-[var(--border-hairline)]">
          <div className="xl:col-span-6 space-y-1.5">
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">
              Шаблон / стиль
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DIPLOMA_TEMPLATES.map((tpl) => {
                const isSelected = certificateConfig.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateCertificateConfig({ templateId: tpl.id })}
                    className={cn(
                      'h-8 px-2.5 rounded-[8px] text-xs font-medium border transition-colors',
                      isSelected
                        ? 'bg-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] border-transparent'
                        : 'bg-[var(--bg-note)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {tpl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-6 space-y-1.5">
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">
              Цветовая палитра
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DIPLOMA_PALETTE_LIST.map((pal) => {
                const isSelected = certificateConfig.paletteId === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateCertificateConfig({ paletteId: pal.id })}
                    className={cn(
                      'h-8 px-2.5 rounded-[8px] text-xs font-medium border inline-flex items-center gap-2 transition-colors',
                      isSelected
                        ? 'bg-[var(--bg-active)] text-[var(--text-primary)] border-[var(--border-strong)]'
                        : 'bg-[var(--bg-note)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/15 dark:border-white/25 flex-shrink-0 overflow-hidden grid grid-cols-2"
                      aria-hidden="true"
                    >
                      <span style={{ backgroundColor: pal.swatch[0] }} />
                      <span style={{ backgroundColor: pal.swatch[1] }} />
                    </span>
                    <span>{pal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Optional OKD Percentage + Optional Trainer Name */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          <DiplomaCheckbox
            id={`${idPrefix}-include-okd`}
            checked={certificateConfig.includeOkdPercent}
            onChange={(checked) => updateCertificateConfig({ includeOkdPercent: checked })}
            label={
              hasOkdSkills
                ? 'Показывать процент сдачи ОКД'
                : 'Показывать результат аттестации'
            }
          />

          <DiplomaCheckbox
            id={`${idPrefix}-include-trainer`}
            checked={certificateConfig.includeTrainerName}
            onChange={(checked) => updateCertificateConfig({ includeTrainerName: checked })}
            label="Добавить имя кинолога в диплом"
          />

          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-xs">
            <label
              htmlFor={`${idPrefix}-trainer-name`}
              className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap"
            >
              Имя кинолога
            </label>
            <input
              id={`${idPrefix}-trainer-name`}
              type="text"
              value={trainerProfile.name}
              disabled={!certificateConfig.includeTrainerName}
              placeholder="Например: Иванов А. В."
              onChange={(e) => updateTrainerProfile({ name: e.target.value })}
              className={cn(
                'h-8 w-full px-2.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-note)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-opacity',
                !certificateConfig.includeTrainerName && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        </div>
      </div>

      {/* Responsive Preview Viewport */}
      <div className={cn('bg-[var(--bg-desk)]', previewContainerClassName)}>
        <ScaledDiplomaPreview
          dog={dog}
          trainerProfile={trainerProfile}
          selectedCourse={selectedCourse}
          config={certificateConfig}
          sheetRef={certificateRef}
        />
      </div>
    </>
  );
};

export const CertificateModal: React.FC<CertificateModalProps> = ({
  open,
  onOpenChange,
  dog,
}) => {
  if (!dog) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-[1px] transition-opacity" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-[1180px] max-h-[94vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-desk)] text-[var(--text-primary)] shadow-[0_16px_44px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden focus:outline-none"
        >
          <DiplomaStudio
            dog={dog}
            idPrefix="modal-cert"
            controlsClassName="px-6 py-3.5 max-h-[38vh] overflow-y-auto md:max-h-none md:overflow-visible"
            previewContainerClassName="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6"
            renderTopBar={({ handleGraduate }) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[var(--bg-sheet)] border-b border-[var(--border-subtle)]">
                <div>
                  <Dialog.Title className="font-serif text-xl font-medium text-[var(--text-primary)]">
                    Диплом выпускника (формат А4)
                  </Dialog.Title>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Оформление и экспорт сертификата Paw-Paw · {dog.name} ({dog.breed})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGraduate}
                    className="h-9 px-3.5 rounded-lg border border-[#286144]/30 bg-[#286144]/10 hover:bg-[#286144]/15 text-[var(--accent-forest)] dark:border-[#58b482]/35 dark:bg-[#58b482]/14 dark:hover:bg-[#58b482]/22 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="size-3.5 stroke-[1.6]" />
                    <span>Довести курс до 100% и выдать диплом</span>
                  </button>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="size-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-colors"
                      aria-label="Закрыть окно диплома"
                    >
                      <X className="size-4 stroke-[1.5]" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            )}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

import { differenceInMonths, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import type { DistractionLevel, Dog, DogFilter, DogSkill, SkillCategory } from '../types';

/**
 * Returns grammatically correct Russian plural word form based on count.
 */
export function getRussianPlural(number: number, one: string, two: string, five: string): string {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
}

/**
 * Calculates human-readable Russian dog age string (e.g. "1 год 4 мес.", "7 месяцев").
 */
export function formatDogAgeRussian(birthDateIso: string): string {
  if (!birthDateIso) return '—';
  try {
    const birthDate = parseISO(birthDateIso);
    if (Number.isNaN(birthDate.getTime())) return '—';
    const now = new Date();
    const totalMonths = differenceInMonths(now, birthDate);

    if (totalMonths < 0) return '—';
    if (totalMonths === 0) return 'Менее месяца';

    if (totalMonths < 12) {
      const monthWord = getRussianPlural(totalMonths, 'месяц', 'месяца', 'месяцев');
      return `${totalMonths} ${monthWord}`;
    }

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    const yearWord = getRussianPlural(years, 'год', 'года', 'лет');

    if (remainingMonths === 0) {
      return `${years} ${yearWord}`;
    }

    return `${years} ${yearWord} ${remainingMonths} мес.`;
  } catch {
    return '—';
  }
}

export const DISTRACTION_LABELS: Record<
  DistractionLevel,
  { label: string; multiplier: number; description: string }
> = {
  home: {
    label: 'Дома',
    multiplier: 1.0,
    description: 'Минимальные бытовые раздражители (1.0x)',
  },
  quiet_yard: {
    label: 'Тихий двор',
    multiplier: 1.1,
    description: 'Слабые раздражители, знакомая территория (1.1x)',
  },
  city_street: {
    label: 'Городская улица',
    multiplier: 1.25,
    description: 'Средние раздражители: пешеходы, транспорт, шумы (1.25x)',
  },
  dog_park: {
    label: 'Площадка с собаками',
    multiplier: 1.4,
    description: 'Высокие раздражители: сородичи, лай, игры (1.4x)',
  },
};

export const SCORE_BASE_PERCENT: Record<number, number> = {
  1: 20,
  2: 40,
  3: 65,
  4: 85,
  5: 100,
};

export const SCORE_COMPLETION_LABELS: Record<
  number,
  { short: string; label: string; percent: number }
> = {
  1: { short: 'Срыв', label: 'Не выполнено / Срыв', percent: 20 },
  2: { short: 'Слабо', label: 'Слабо / Ошибки', percent: 40 },
  3: { short: 'С подсказкой', label: 'С подсказкой / Частично', percent: 65 },
  4: { short: 'Хорошо', label: 'Хорошо', percent: 85 },
  5: { short: 'Идеально', label: 'Идеально', percent: 100 },
};

/**
 * Formats training duration in natural Russian (e.g. "45 мин", "1 час 30 мин", "2 часа").
 */
export function formatDurationRussian(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 мин';
  const totalMinutes = Math.round(minutes);
  if (totalMinutes < 60) {
    return `${totalMinutes} мин`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const hourWord = getRussianPlural(hours, 'час', 'часа', 'часов');
  if (remainingMinutes === 0) {
    return `${hours} ${hourWord}`;
  }
  return `${hours} ${hourWord} ${remainingMinutes} мин`;
}

/**
 * Formats an ISO session date in natural Russian (e.g. "5 ноября", or "5 ноября 2025" if year differs).
 */
export function formatSessionDateRussian(isoDate: string): string {
  if (!isoDate) return '—';
  try {
    const parsed = parseISO(isoDate);
    const date = Number.isNaN(parsed.getTime()) ? new Date(isoDate) : parsed;
    if (Number.isNaN(date.getTime())) return '—';
    const currentYear = new Date().getFullYear();
    const pattern = date.getFullYear() === currentYear ? 'd MMMM' : 'd MMMM yyyy';
    return format(date, pattern, { locale: ru });
  } catch {
    return '—';
  }
}

/**
 * Recalculate skill mastery (0-100%) based on previous mastery, score (1-5), and distraction level.
 */
export function calculateNewMastery(
  previousMastery: number,
  score: number,
  distraction: DistractionLevel
): number {
  const base = SCORE_BASE_PERCENT[score] ?? 60;
  const mult = DISTRACTION_LABELS[distraction]?.multiplier ?? 1.0;
  const adjustedTarget = Math.min(100, Math.round(base * mult));

  if (previousMastery === 0) {
    return adjustedTarget;
  }

  // EMA smoothing: 60% historical weight + 40% current session impact
  const updated = Math.round(previousMastery * 0.6 + adjustedTarget * 0.4);
  return Math.max(0, Math.min(100, updated));
}

/**
 * Calculate category progress average (0-100%).
 */
export function calculateCategoryProgress(skills: DogSkill[], category: SkillCategory): number {
  const filtered = skills.filter((s) => s.category === category);
  if (filtered.length === 0) return 0;
  const total = filtered.reduce((acc, s) => acc + s.mastery, 0);
  return Math.round(total / filtered.length);
}

/**
 * Calculate overall "Ideal / Working Dog" Index (0-100%).
 * Preserves 60% training + 40% Behavior Correction when behavior skills exist,
 * while supporting OKD, ZKS, Sport, and custom training categories.
 */
export function calculateOverallDogIndex(skills: DogSkill[]): {
  overallIndex: number;
  okdIndex: number;
  behaviorIndex: number;
  zksIndex: number;
  sportIndex: number;
  attentionIndex: number;
  trustIndex: number;
} {
  const okdIndex = calculateCategoryProgress(skills, 'okd');
  const behaviorIndex = calculateCategoryProgress(skills, 'behavior');
  const zksIndex = calculateCategoryProgress(skills, 'zks');
  const sportIndex = calculateCategoryProgress(skills, 'sport');
  const attentionIndex = calculateCategoryProgress(skills, 'attention');
  const trustIndex = calculateCategoryProgress(skills, 'trust');

  const behSkills = skills.filter((s) => s.category === 'behavior');
  const trainingCategories = Array.from(
    new Set(skills.filter((s) => s.category !== 'behavior').map((s) => s.category))
  );
  const activeTrainingIndices = trainingCategories.map((cat) =>
    calculateCategoryProgress(skills, cat)
  );

  let overallIndex = 0;
  if (activeTrainingIndices.length > 0 && behSkills.length > 0) {
    const trainingAvg =
      activeTrainingIndices.reduce((acc, val) => acc + val, 0) / activeTrainingIndices.length;
    overallIndex = Math.round(trainingAvg * 0.6 + behaviorIndex * 0.4);
  } else if (activeTrainingIndices.length > 0) {
    const trainingAvg =
      activeTrainingIndices.reduce((acc, val) => acc + val, 0) / activeTrainingIndices.length;
    overallIndex = Math.round(trainingAvg);
  } else if (behSkills.length > 0) {
    overallIndex = behaviorIndex;
  }

  return {
    overallIndex,
    okdIndex,
    behaviorIndex,
    zksIndex,
    sportIndex,
    attentionIndex,
    trustIndex,
  };
}

export interface DogRank {
  title: string;
  minPercent: number;
  maxPercent: number;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
}

export const DOG_RANKS: DogRank[] = [
  {
    title: 'Новичок на поводке',
    minPercent: 0,
    maxPercent: 39,
    colorClass: 'text-stone-700',
    badgeBg: 'bg-stone-100',
    badgeBorder: 'border-stone-300',
    description: 'Начальный этап социализации и базовой адаптации к командам.',
  },
  {
    title: 'Прилежный ученик',
    minPercent: 40,
    maxPercent: 59,
    colorClass: 'text-blue-700',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    description: 'Знает команды в спокойной обстановке, требует закрепления при раздражителях.',
  },
  {
    title: 'Воспитанный компаньон',
    minPercent: 60,
    maxPercent: 79,
    colorClass: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    description: 'Надежная городская собака, комфортна на прогулках и в общественных местах.',
  },
  {
    title: 'Без пяти минут спецназ',
    minPercent: 80,
    maxPercent: 95,
    colorClass: 'text-purple-700',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    description: 'Высокая концентрация, быстрый отклик даже при сильных раздражителях.',
  },
  {
    title: 'Идеальная служебная собака',
    minPercent: 96,
    maxPercent: 100,
    colorClass: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    description: 'Эталон послушания, абсолютный контроль и выдержка в любых условиях.',
  },
];

export function getDogRank(percent: number): DogRank {
  const rounded = Math.round(percent);
  const clamped = Math.max(0, Math.min(100, rounded));
  return DOG_RANKS.find((r) => clamped >= r.minPercent && clamped <= r.maxPercent) ?? DOG_RANKS[0];
}

/**
 * Evaluates whether a dog matches a specific category filter predicate.
 */
export function filterDogByCategory(dog: Dog, activeFilter: DogFilter): boolean {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'active_okd') {
    const okdSkills = dog.skills.filter((s) => s.category === 'okd');
    return !dog.certificateIssued && okdSkills.some((s) => s.mastery < 100);
  }
  if (activeFilter === 'zks') {
    return dog.skills.some((s) => s.category === 'zks');
  }
  if (activeFilter === 'sport') {
    return dog.skills.some((s) => s.category === 'sport');
  }
  if (activeFilter === 'attention') {
    return dog.skills.some((s) => s.category === 'attention');
  }
  if (activeFilter === 'trust') {
    return dog.skills.some((s) => s.category === 'trust');
  }
  if (activeFilter === 'behavior') {
    const behSkills = dog.skills.filter((s) => s.category === 'behavior');
    return behSkills.some((s) => s.mastery < 100);
  }
  if (activeFilter === 'graduates') {
    return dog.certificateIssued === true;
  }
  return true;
}

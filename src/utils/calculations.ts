import { differenceInMonths, parseISO } from 'date-fns';
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
 * 60% OKD + 40% Behavior Correction when both exist.
 */
export function calculateOverallDogIndex(skills: DogSkill[]): {
  overallIndex: number;
  okdIndex: number;
  behaviorIndex: number;
} {
  const okdSkills = skills.filter((s) => s.category === 'okd');
  const behSkills = skills.filter((s) => s.category === 'behavior');

  const okdIndex =
    okdSkills.length > 0
      ? Math.round(okdSkills.reduce((a, b) => a + b.mastery, 0) / okdSkills.length)
      : 0;

  const behaviorIndex =
    behSkills.length > 0
      ? Math.round(behSkills.reduce((a, b) => a + b.mastery, 0) / behSkills.length)
      : 0;

  let overallIndex = 0;
  if (okdSkills.length > 0 && behSkills.length > 0) {
    overallIndex = Math.round(okdIndex * 0.6 + behaviorIndex * 0.4);
  } else if (okdSkills.length > 0) {
    overallIndex = okdIndex;
  } else if (behSkills.length > 0) {
    overallIndex = behaviorIndex;
  }

  return { overallIndex, okdIndex, behaviorIndex };
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
  if (activeFilter === 'behavior') {
    const behSkills = dog.skills.filter((s) => s.category === 'behavior');
    return behSkills.some((s) => s.mastery < 100);
  }
  if (activeFilter === 'graduates') {
    return dog.certificateIssued === true;
  }
  return true;
}

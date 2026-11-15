export type Gender = 'male' | 'female';

export type MotivationType = 'food' | 'play' | 'social' | 'mixed';

export type SkillCategory = 'okd' | 'behavior';

export type DistractionLevel = 'home' | 'quiet_yard' | 'city_street' | 'dog_park';

export interface SkillScoreRecord {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  score: number; // 1-5
  notes?: string;
}

export interface DogSkill {
  id: string;
  name: string;
  category: SkillCategory;
  mastery: number; // 0 - 100%
  lastScore?: number; // 1 - 5
  lastUpdated?: string; // ISO date
  description?: string;
  isCustom?: boolean;
}

export interface Dog {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string; // ISO YYYY-MM-DD
  breed: string;
  weight: number; // in kg
  avatar: string; // Base64 data URL or preset identifier
  dailyTrainingTime: number; // minutes per day (e.g. 15, 20, 30, 45, 60)
  motivationType: MotivationType;
  favoriteTreats: string;
  allergies: string;
  triggers: string;
  ownerName: string;
  ownerPhone: string;
  ownerTelegram?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  skills: DogSkill[];
  certificateIssued?: boolean;
  certificateIssuedAt?: string;
}

export interface HomeworkExercise {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  score: number; // 1-3
  instruction: string;
  recommendedSets: string; // e.g. "2 подхода по 5 минут"
}

export interface GeneratedHomework {
  dailyPlanSummary: string; // e.g. "3 подхода по 10 минут в день (всего 30 мин)"
  exercises: HomeworkExercise[];
  positiveFinisher: {
    skillName: string;
    instruction: string;
  };
  generalAdvice: string;
}

export interface NextSessionPlan {
  prioritySkills: string[];
  suggestedDistractionTarget: DistractionLevel;
  suggestedChallenges: string[];
}

export interface TrainingSession {
  id: string;
  dogId: string;
  date: string; // ISO datetime
  durationMinutes: number; // 15, 30, 45, 60
  distractionLevel: DistractionLevel;
  timerData?: {
    stayDurationSeconds: number; // record stay time in seconds
    repsCount?: number;
  };
  scores: SkillScoreRecord[];
  overallIndexSnapshot: number; // index at the end of session
  okdIndexSnapshot: number;
  behaviorIndexSnapshot: number;
  homework: GeneratedHomework;
  nextSessionPlan: NextSessionPlan;
  trainerNotes: string;
}

export interface TrainerProfile {
  name: string; // e.g. "Иванов А. В."
  centerName: string; // e.g. "Кинологический Центр «Альфа-Дог»"
  phone?: string;
  telegram?: string;
}

export type DogFilter = 'all' | 'active_okd' | 'behavior' | 'graduates';

export interface AppExportData {
  version: '1.0.0';
  exportedAt: string;
  app: 'DogTeacher Workstation';
  trainerProfile: TrainerProfile;
  dogs: Dog[];
  sessions: TrainingSession[];
}

export const OKD_PRESETS: Omit<DogSkill, 'mastery' | 'lastScore' | 'lastUpdated'>[] = [
  {
    id: 'okd_sit',
    name: 'Сидеть',
    category: 'okd',
    description: 'Посадка по первой команде голосом и жестом с фиксацией до отмены',
    isCustom: false,
  },
  {
    id: 'okd_down',
    name: 'Лежать',
    category: 'okd',
    description: 'Укладка по первой команде голосом и жестом без продвижения вперед',
    isCustom: false,
  },
  {
    id: 'okd_come',
    name: 'Ко мне (подзыв)',
    category: 'okd',
    description: 'Безотказный быстрый подход к кинологу с посадкой у левой ноги',
    isCustom: false,
  },
  {
    id: 'okd_heel',
    name: 'Рядом',
    category: 'okd',
    description: 'Движение у левой ноги при различных темпах и поворотах',
    isCustom: false,
  },
  {
    id: 'okd_place',
    name: 'Место',
    category: 'okd',
    description: 'Возвращение на оставленную вещь по команде с расстояния от 15 метров',
    isCustom: false,
  },
  {
    id: 'okd_stay',
    name: 'Выдержка',
    category: 'okd',
    description: 'Сохранение заданного положения при отходе кинолога на 15+ метров',
    isCustom: false,
  },
  {
    id: 'okd_leave',
    name: 'Фу / Нельзя',
    category: 'okd',
    description: 'Мгновенное прекращение нежелательного действия и отказ от корма',
    isCustom: false,
  },
  {
    id: 'okd_fetch',
    name: 'Апорт',
    category: 'okd',
    description: 'Поднос брошенного предмета, посадка перед кинологом и отдача по команде',
    isCustom: false,
  },
  {
    id: 'okd_inspection',
    name: 'Показ зубов / Осмотр',
    category: 'okd',
    description: 'Спокойное отношение к осмотру прикуса, шерсти, лап и ушей',
    isCustom: false,
  },
];

export const BEHAVIOR_PRESETS: Omit<DogSkill, 'mastery' | 'lastScore' | 'lastUpdated'>[] = [
  {
    id: 'beh_dog_aggression',
    name: 'Агрессия на других собак',
    category: 'behavior',
    description: 'Реактивность, лай и броски на сородичей при встрече на поводке',
    isCustom: false,
  },
  {
    id: 'beh_leash_pulling',
    name: 'Тянет поводок на улице',
    category: 'behavior',
    description: 'Постоянное натяжение поводка, игнорирование натяжения и команд',
    isCustom: false,
  },
  {
    id: 'beh_distraction_ignoring',
    name: 'Не слушается при раздражителях',
    category: 'behavior',
    description: 'Срыв внимания при виде кошек, птиц, прохожих или машин',
    isCustom: false,
  },
  {
    id: 'beh_ground_scavenging',
    name: 'Подбор еды с земли',
    category: 'behavior',
    description: 'Попытки пылесосить мусор, кости и пищевые отходы на прогулке',
    isCustom: false,
  },
  {
    id: 'beh_jumping_people',
    name: 'Прыгает на людей при встрече',
    category: 'behavior',
    description: 'Постановка лап на хозяев и гостей от избытка эмоций',
    isCustom: false,
  },
  {
    id: 'beh_separation_anxiety',
    name: 'Воет / лает в одиночестве',
    category: 'behavior',
    description: 'Деструктивное поведение и вокал при уходе хозяев из дома',
    isCustom: false,
  },
  {
    id: 'beh_loud_noises_fear',
    name: 'Боязнь громких звуков',
    category: 'behavior',
    description: 'Паника и тремор при салютах, грозе, звуках перфоратора или пылесоса',
    isCustom: false,
  },
  {
    id: 'beh_lack_basic_discipline',
    name: 'Не знает базовых команд',
    category: 'behavior',
    description: 'Полное отсутствие бытовой дисциплины и маркеров внимания',
    isCustom: false,
  },
];

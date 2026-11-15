export type Gender = 'male' | 'female';

export type MotivationType = 'food' | 'play' | 'social' | 'mixed';

export type BuiltinDisciplineId = 'okd' | 'zks' | 'sport' | 'behavior';

export type SkillCategory = BuiltinDisciplineId | (string & {});

export type DistractionLevel = 'home' | 'quiet_yard' | 'city_street' | 'dog_park';

export interface DisciplineCommandTemplate {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  isCustom?: boolean;
}

export interface DisciplineInfo {
  id: SkillCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  normsSummary: string;
}

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
  durationMinutes: number; // custom or preset (e.g. 15, 30, 45, 60, 90, 120)
  timeEntryMode?: 'stopwatch' | 'manual';
  title?: string;
  distractionLevel: DistractionLevel;
  timerData?: {
    stayDurationSeconds: number; // record stay time in seconds
    repsCount?: number;
  };
  scores: SkillScoreRecord[];
  overallIndexSnapshot: number; // index at the end of session
  okdIndexSnapshot: number;
  behaviorIndexSnapshot: number;
  zksIndexSnapshot?: number;
  sportIndexSnapshot?: number;
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

export type DogFilter = 'all' | 'active_okd' | 'zks' | 'sport' | 'behavior' | 'graduates';

export interface AppExportData {
  version: '1.0.0';
  exportedAt: string;
  app: 'DogTeacher Workstation';
  trainerProfile: TrainerProfile;
  dogs: Dog[];
  sessions: TrainingSession[];
  disciplines?: DisciplineInfo[];
  disciplineCommands?: Record<string, DisciplineCommandTemplate[]>;
}

export const OKD_PRESETS: DisciplineCommandTemplate[] = [
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

export const ZKS_PRESETS: DisciplineCommandTemplate[] = [
  {
    id: 'zks_apprehension',
    name: 'Задержание нарушителя',
    category: 'zks',
    description: 'Стремительный пуск, уверенный перехват уходящего или сопротивляющегося фигуранта и плотное удержание',
    isCustom: false,
  },
  {
    id: 'zks_object_guard',
    name: 'Охрана вещи',
    category: 'zks',
    description: 'Устойчивая охрана оставленной вещи на месте без отвлечения на приманку и без смены позиции',
    isCustom: false,
  },
  {
    id: 'zks_scent_selection',
    name: 'Выборка вещи и человека',
    category: 'zks',
    description: 'Распознавание и чёткое обозначение целевой вещи или фигуранта по индивидуальному запаху среди контрольных образцов',
    isCustom: false,
  },
  {
    id: 'zks_escort',
    name: 'Конвоирование задержанного',
    category: 'zks',
    description: 'Сопровождение задержанного в заданной позиции с мгновенным пресечением попытки побега или нападения',
    isCustom: false,
  },
  {
    id: 'zks_courage_grip',
    name: 'Проверка на смелость и хватку',
    category: 'zks',
    description: 'Уверенная работа под психологическим давлением, замахом и шумом с полной глубокой хваткой в рукав или костюм',
    isCustom: false,
  },
  {
    id: 'zks_gunshot',
    name: 'Отношение к выстрелу',
    category: 'zks',
    description: 'Ровная собранная реакция на резкие звуки выстрела без испуга, потери контакта и отказа от задания',
    isCustom: false,
  },
  {
    id: 'zks_out_release',
    name: 'Прекращение хватки по команде «Дай»',
    category: 'zks',
    description: 'Мгновенный отпуск рукава по первой команде проводника и переход в фазу внимательной охраны',
    isCustom: false,
  },
];

export const SPORT_PRESETS: DisciplineCommandTemplate[] = [
  {
    id: 'sport_agility_jumps_slalom',
    name: 'Аджилити: барьеры и слалом',
    category: 'sport',
    description: 'Скоростное и безошибочное прохождение барьеров и 12-стоечного слалома по жестовому и голосовому управлению',
    isCustom: false,
  },
  {
    id: 'sport_agility_tunnel_boom',
    name: 'Аджилити: туннель и бум',
    category: 'sport',
    description: 'Смелый вход в жёсткие и мягкие туннели и точное прохождение контактных зон на буме и горке',
    isCustom: false,
  },
  {
    id: 'sport_nosework',
    name: 'Ноузворк: поиск целевого запаха',
    category: 'sport',
    description: 'Методичный обыск предметов, помещений и транспорта с ясным замиранием и обозначением закладки',
    isCustom: false,
  },
  {
    id: 'sport_rally_obedience',
    name: 'Ралли-обидиенс: связка команд в движении',
    category: 'sport',
    description: 'Слаженное прохождение трассы по станциям с поворотами, сменой темпа и фиксацией позиций без натяжения поводка',
    isCustom: false,
  },
  {
    id: 'sport_frisbee_speed_fetch',
    name: 'Дог-фризби / Скоростной апорт',
    category: 'sport',
    description: 'Ловля диска в прыжке или скоростной поднос снаряда с чистой отдачей в руку для следующего броска',
    isCustom: false,
  },
  {
    id: 'sport_balance_fitness',
    name: 'Баланс и физическая подготовка',
    category: 'sport',
    description: 'Координационные упражнения на балансировочных подушках, кавалетти и фитнес-снарядах без перегрузки суставов',
    isCustom: false,
  },
];

export const BEHAVIOR_PRESETS: DisciplineCommandTemplate[] = [
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

export const DEFAULT_DISCIPLINES: DisciplineInfo[] = [
  {
    id: 'okd',
    title: 'Общий курс дрессировки (ОКД)',
    shortTitle: 'ОКД',
    subtitle: 'Базовое послушание и нормативная управляемость',
    description:
      'Фундаментальный отечественный курс управляемости собаки в городе и на площадке: посадка, укладка, подзыв, движение рядом, выдержка и запрещающие команды.',
    normsSummary:
      '9 базовых нормативов · Управление голосом и жестом на дистанции до 15 м, выдержка, апортировка и осмотр прикуса.',
  },
  {
    id: 'zks',
    title: 'Защитно-караульная служба (ЗКС)',
    shortTitle: 'ЗКС',
    subtitle: 'Защитная работа, выборка запаха и управляемая хватка',
    description:
      'Специальная подготовка служебных и рабочих собак: задержание и конвоирование нарушителя, охрана вещи, запаховая выборка, выдержка при выстреле и мгновенный отпуск по команде «Дай».',
    normsSummary:
      '7 прикладных упражнений · Допуск на базе ОКД: баланс возбуждения и торможения, глубокая хватка и безотказный отпуск.',
  },
  {
    id: 'sport',
    title: 'Активный спорт и ноузворк',
    shortTitle: 'Спорт',
    subtitle: 'Аджилити, ноузворк, ралли-обидиенс, дог-фризби и ОФП',
    description:
      'Спортивные кинологические дисциплины для развития скорости, координации, обонятельного поиска и точного контакта проводника с собакой.',
    normsSummary:
      '6 направлений · Чистота прохождения трассы и контактных зон, чёткое обозначение запаха и контроль нагрузок.',
  },
  {
    id: 'behavior',
    title: 'Коррекция поведения',
    shortTitle: 'Поведение',
    subtitle: 'Бытовая адаптация, импульсный контроль и снятие триггеров',
    description:
      'Системная работа с нежелательными реакциями в быту и на прогулке: натяжение поводка, реактивность на сородичей, подбор с земли, прыжки на людей, шумовые фобии и тревога расставания.',
    normsSummary:
      '8 ключевых паттернов · Снижение реактивности при плавном повышении уровня раздражителей среды.',
  },
];

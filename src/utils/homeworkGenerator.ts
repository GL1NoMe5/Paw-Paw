import type {
  DistractionLevel,
  Dog,
  GeneratedHomework,
  HomeworkExercise,
  NextSessionPlan,
  SkillScoreRecord,
} from '../types';
import { formatDurationRussian, getRussianPlural } from './calculations';

export const SKILL_METHOD_TIPS: Record<string, string> = {
  okd_stay:
    'Правило 3D: увеличивайте сначала секунды (до 20–30 с), затем отходите на 2–3 шага. Никогда не зовите к себе из выдержки — всегда подходите обратно сами и поощряйте в том же положении!',
  okd_come:
    'Правило магнита: подзывайте только позитивным тоном, приседайте боком. Поощряйте серией из 3 кусочков прямо у бедра, не хватайте за ошейник сразу.',
  okd_heel:
    'Держите лакомство в закрытой руке у своего левого бедра на уровне носа собаки. Каждый шаг в правильной позиции — маркер «Да!» и кусочек. При забегании вперед — разворот на 180°.',
  okd_leave:
    'Упражнение «Дзен»: лакомство на открытой ладони. Собака тянется — ладонь мягко сжимается. Собака отвела взгляд — маркер «Да!» и угощение из ДРУГОЙ руки.',
  beh_leash_pulling:
    'Метод красного светофора: натяжение поводка = стоп на месте, вы стоите неподвижно как дерево. Как только поводок провис или собака оглянулась — похвала и продолжаем шаг.',
  beh_jumping_people:
    'Правило 4 лап на полу: при встрече гостей собаку полностью игнорируют (руки скрещены, взгляд в потолок). Внимание, ласка и вкусняшка даются ТОЛЬКО когда все 4 лапы стоят на полу.',
  beh_distraction_ignoring:
    'Упражнение «Внимание на имя»: на прогулке в тихом месте произнесите кличку один раз. Взгляд в глаза — мгновенный щелчок маркера и двойная порция любимого лакомства.',
  beh_ground_scavenging:
    'Отработка запрета на безопасных приманках дома. Если пытается схватить — наступите ногой на кусочек. Уступила — супер-награда из кармана.',
  zks_apprehension:
    'Отрабатывайте пуск на рукав только после устойчивой посадки у ноги и зрительного контакта. Не допускайте срыва с места до команды.',
  zks_object_guard:
    'Начинайте с короткой выдержки у вещи (15–20 с) при спокойном подходе помощника по дуге, поощряя уверенное облаивание без отхода от предмета.',
  zks_scent_selection:
    'Закладывайте простые линейки из 3–4 предметов без лишних запаховых следов, чётко подкрепляя спокойное обозначение целевой вещи укладкой или посадкой.',
  zks_escort:
    'Контролируйте дистанцию и плотность посадки при остановках; чередуйте спокойное движение рядом с внимательной фиксацией на фигуранте.',
  zks_courage_grip:
    'Развивайте глубокую полную хватку через игровую добычу на мягкой подушке, постепенно добавляя лёгкий замах без давления на психику.',
  zks_gunshot:
    'Знакомьте со звуком с большой дистанции (40–50 м) в момент позитивной игры или кормления, постепенно сокращая расстояние только при спокойной реакции.',
  zks_out_release:
    'Отрабатывайте «Дай» через обмен на лакомство или второй мяч: хватка замирает, прозвучала команда — мгновенный отпуск и новый игровой пуск.',
  sport_agility_jumps_slalom:
    'Работайте над отдельными связками из 2–3 барьеров и входом в слалом под разными углами, поддерживая скорость чистыми своевременными жестами.',
  sport_agility_tunnel_boom:
    'Чётко фиксируйте зоны контакта (два задних внизу трапа), поощряя прямо из конечной позиции без преждевременного схода.',
  sport_nosework:
    'Давайте собаке время самостоятельно проработать конус запаха; отмечайте момент замирания носа у источника сразу, до появления неуверенности.',
  sport_rally_obedience:
    'Проходите по 3–4 знака за один короткий подход, сохраняя бодрый контакт у левой ноги и чистые переходы между позициями.',
  sport_frisbee_speed_fetch:
    'Отрабатывайте ровные короткие роллы и броски на удобной высоте; меняйте диск на второй сразу при подносе для поддержания азарта.',
  sport_balance_fitness:
    'Следите за ровной спиной и симметрией лап: 3–4 коротких удержания по 10–15 секунд лучше, чем усталость и потеря техники.',
  default:
    'Короткие повторения по 3–5 минут перед кормлением. Хвалите искренне и энергично, заканчивайте упражнение на успешном выполнении!',
};

export function generateSmartHomework(dog: Dog, scores: SkillScoreRecord[]): GeneratedHomework {
  // 1. Calculate daily sets summary for any custom duration (5 to 300+ minutes)
  const rawTime = Number(dog.dailyTrainingTime);
  const dailyTime = Number.isFinite(rawTime) && rawTime > 0 ? Math.round(rawTime) : 30;

  let setsCount = 3;
  let setMinutes = 10;

  if (dailyTime === 15) {
    setsCount = 2;
    setMinutes = 7;
  } else if (dailyTime === 20) {
    setsCount = 2;
    setMinutes = 10;
  } else if (dailyTime === 30) {
    setsCount = 3;
    setMinutes = 10;
  } else if (dailyTime === 45) {
    setsCount = 3;
    setMinutes = 15;
  } else if (dailyTime === 60) {
    setsCount = 4;
    setMinutes = 15;
  } else if (dailyTime < 10) {
    setsCount = 1;
    setMinutes = dailyTime;
  } else if (dailyTime < 20) {
    setsCount = 2;
    setMinutes = Math.max(5, Math.round(dailyTime / 2));
  } else if (dailyTime < 45) {
    setsCount = 3;
    setMinutes = Math.round(dailyTime / 3);
  } else if (dailyTime < 60) {
    setsCount = 4;
    setMinutes = Math.round(dailyTime / 4);
  } else {
    setsCount = Math.min(12, Math.max(4, Math.round(dailyTime / 20)));
    setMinutes = Math.max(15, Math.round(dailyTime / setsCount));
  }

  const setsWord = getRussianPlural(setsCount, 'подход', 'подхода', 'подходов');
  const minWordAfterPo = getRussianPlural(setMinutes, 'минуте', 'минуты', 'минут');
  const setDuration = `${setMinutes} ${minWordAfterPo}`;
  const totalSummary = dailyTime > 60 ? formatDurationRussian(dailyTime) : `${dailyTime} мин`;
  const setsSummary = `${setsCount} ${setsWord} по ${setDuration} в день (всего ${totalSummary})`;

  // 2. Select priority exercises: scores 1 to 3
  const lowScored = scores.filter((s) => s.score <= 3);
  const targetExercises = (lowScored.length > 0 ? lowScored : scores.slice(0, 2)).slice(0, 3);

  const exercises: HomeworkExercise[] = targetExercises.map((s) => {
    const tip = SKILL_METHOD_TIPS[s.skillId] || SKILL_METHOD_TIPS.default;
    const perExerciseSets = Math.max(1, Math.floor(setsCount / (targetExercises.length || 1)));
    const exSetsWord = getRussianPlural(perExerciseSets, 'подход', 'подхода', 'подходов');
    return {
      skillId: s.skillId,
      skillName: s.skillName,
      category: s.category,
      score: s.score,
      instruction: tip,
      recommendedSets: `${perExerciseSets} ${exSetsWord} по ${setDuration}`,
    };
  });

  // 3. Positive finisher (score 4 or 5)
  const highScore = scores.find((s) => s.score >= 4);
  const positiveFinisher = {
    skillName: highScore ? highScore.skillName : 'Любимая команда собаки',
    instruction:
      'Завершайте каждый подход этим упражнением! Дайте собаке почувствовать победу и выдайте джекпот (3–4 кусочка подряд или любимую игрушку).',
  };

  // 4. Motivation advice
  let generalAdvice = '';
  switch (dog.motivationType) {
    case 'food':
      generalAdvice = `💡 Совет по мотивации: ${dog.name} — пищевик. Занимайтесь перед кормлением на голодный желудок. Используйте любимое лакомство (${dog.favoriteTreats || 'легкое / сыр'}).`;
      break;
    case 'play':
      generalAdvice = `💡 Совет по мотивации: ${dog.name} — игровик. Награждайте собаку короткой динамичной игрой (15–20 сек) в перетяжку жгута или мяча.`;
      break;
    case 'social':
      generalAdvice = `💡 Совет по мотивации: ${dog.name} высоко ценит социальный контакт. Радуйтесь искренне, хвалите высоким эмоциональным голосом и активно гладьте грудь.`;
      break;
    default:
      generalAdvice = `💡 Совет: Чередуйте пищевое поощрение за статичные упражнения и игру за активный подзыв.`;
  }

  return {
    dailyPlanSummary: setsSummary,
    exercises,
    positiveFinisher,
    generalAdvice,
  };
}

export function generateNextSessionPlan(
  _dog: Dog,
  scores: SkillScoreRecord[],
  currentDistraction: DistractionLevel
): NextSessionPlan {
  const lowScores = scores.filter((s) => s.score <= 3).map((s) => s.skillName);
  const prioritySkills = lowScores.length > 0 ? lowScores : [scores[0]?.skillName || 'ОКД Комплекс'];

  let nextDistractionTarget: DistractionLevel = currentDistraction;
  if (currentDistraction === 'home') nextDistractionTarget = 'quiet_yard';
  else if (currentDistraction === 'quiet_yard') nextDistractionTarget = 'city_street';
  else if (currentDistraction === 'city_street') nextDistractionTarget = 'dog_park';

  const suggestedChallenges: string[] = [
    'Увеличение дистанции управления до 5–10 метров',
    'Отработка выдержки при внезапном броске мяча в сторону',
    `Переход на следующий уровень раздражителей: ${nextDistractionTarget}`,
  ];

  return {
    prioritySkills,
    suggestedDistractionTarget: nextDistractionTarget,
    suggestedChallenges,
  };
}

function getDistractionLabelRussian(level: DistractionLevel): string {
  switch (level) {
    case 'home':
      return 'Дома (минимальные раздражители)';
    case 'quiet_yard':
      return 'Тихий двор (слабые раздражители)';
    case 'city_street':
      return 'Городская улица (средние раздражители)';
    case 'dog_park':
      return 'Площадка с собаками (высокие раздражители)';
  }
}

/**
 * Format complete training report for copying into Telegram / WhatsApp.
 */
export function formatReportForClipboard(
  dog: Dog,
  session: {
    date: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    scores: SkillScoreRecord[];
    homework: GeneratedHomework;
    nextSessionPlan: NextSessionPlan;
    timerData?: {
      stayDurationSeconds?: number;
    };
  }
): string {
  const distractionText = getDistractionLabelRussian(session.distractionLevel);

  let text = `🐾 ОТЧЕТ О ТРЕНИРОВКЕ: ${dog.name.toUpperCase()}\n`;
  text += `📅 Дата: ${new Date(session.date).toLocaleDateString('ru-RU')} | Время: ${session.durationMinutes} мин\n`;
  text += `📍 Локация: ${distractionText}\n`;
  if (session.timerData?.stayDurationSeconds && session.timerData.stayDurationSeconds > 0) {
    const totalSec = session.timerData.stayDurationSeconds;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formattedStr = mins > 0 ? `${mins} мин ${secs > 0 ? `${secs} с` : ''}`.trim() : `${secs} сек`;
    text += `⏱ Рекорд выдержки: ${totalSec} сек (${formattedStr})\n`;
  }
  text += `\n`;

  text += `📊 РЕЗУЛЬТАТЫ ЗАНЯТИЯ:\n`;
  session.scores.forEach((s) => {
    const stars = '★'.repeat(s.score) + '☆'.repeat(5 - s.score);
    text += `• ${s.skillName}: ${s.score}/5 [${stars}]\n`;
  });

  text += `\n🎯 ДОМАШНЕЕ ЗАДАНИЕ ДЛЯ ХОЗЯЕВ:\n`;
  text += `⏱ Режим: ${session.homework.dailyPlanSummary}\n\n`;

  session.homework.exercises.forEach((ex, idx) => {
    text += `${idx + 1}. Команда «${ex.skillName}» (${ex.recommendedSets}):\n`;
    text += `   👉 ${ex.instruction}\n`;
  });

  text += `\n✨ Закрепление успеха: «${session.homework.positiveFinisher.skillName}»\n`;
  text += `   👉 ${session.homework.positiveFinisher.instruction}\n\n`;

  text += `${session.homework.generalAdvice}\n\n`;

  text += `🗓 ПЛАН НА СЛЕДУЮЩЕЕ ЗАНЯТИЕ ДЛЯ КИНОЛОГА:\n`;
  text += `• Приоритетные навыки: ${session.nextSessionPlan.prioritySkills.join(', ')}\n`;
  text += `• Целевые усложнения: ${session.nextSessionPlan.suggestedChallenges.join('; ')}\n`;

  return text;
}

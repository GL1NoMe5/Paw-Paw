import type {
  DistractionLevel,
  Dog,
  GeneratedHomework,
  HomeworkExercise,
  NextSessionPlan,
  SkillScoreRecord,
} from '../types';

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
  default:
    'Короткие повторения по 3–5 минут перед кормлением. Хвалите искренне и энергично, заканчивайте упражнение на успешном выполнении!',
};

export function generateSmartHomework(dog: Dog, scores: SkillScoreRecord[]): GeneratedHomework {
  // 1. Calculate daily sets summary
  const dailyTime = dog.dailyTrainingTime || 30;
  let setsSummary = '';
  let setDuration = '10 минут';
  let setsCount = 3;

  if (dailyTime <= 15) {
    setsCount = 2;
    setDuration = '7 минут';
  } else if (dailyTime <= 20) {
    setsCount = 2;
    setDuration = '10 минут';
  } else if (dailyTime <= 30) {
    setsCount = 3;
    setDuration = '10 минут';
  } else if (dailyTime <= 45) {
    setsCount = 3;
    setDuration = '15 минут';
  } else {
    setsCount = 4;
    setDuration = '15 минут';
  }

  setsSummary = `${setsCount} подхода по ${setDuration} в день (всего ${dailyTime} мин)`;

  // 2. Select priority exercises: scores 1 to 3
  const lowScored = scores.filter((s) => s.score <= 3);
  const targetExercises = (lowScored.length > 0 ? lowScored : scores.slice(0, 2)).slice(0, 3);

  const exercises: HomeworkExercise[] = targetExercises.map((s) => {
    const tip = SKILL_METHOD_TIPS[s.skillId] || SKILL_METHOD_TIPS.default;
    return {
      skillId: s.skillId,
      skillName: s.skillName,
      category: s.category,
      score: s.score,
      instruction: tip,
      recommendedSets: `${Math.max(1, Math.floor(setsCount / (targetExercises.length || 1)))} подход(а) по ${setDuration}`,
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

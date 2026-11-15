import { useDogStore } from '../store/useDogStore';
import {
  calculateNewMastery,
  calculateOverallDogIndex,
  DISTRACTION_LABELS,
  SCORE_BASE_PERCENT,
} from '../utils/calculations';
import {
  generateSmartHomework,
  generateNextSessionPlan,
  formatReportForClipboard,
  SKILL_METHOD_TIPS,
} from '../utils/homeworkGenerator';
import type { Dog, SkillScoreRecord, TrainingSession } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== Starting Milestone 3 Comprehensive Verification Suite ===\n');

// -----------------------------------------------------------------------------
// Suite 1: EMA Mastery Recalculation & Distraction Multipliers
// -----------------------------------------------------------------------------
console.log('Suite 1: EMA Mastery Recalculation & Distraction Multipliers...');

// Test 1.1: Multipliers alignment
assert(DISTRACTION_LABELS.home.multiplier === 1.0, 'Home distraction multiplier must be 1.0');
assert(DISTRACTION_LABELS.quiet_yard.multiplier === 1.1, 'Quiet yard distraction multiplier must be 1.1');
assert(DISTRACTION_LABELS.city_street.multiplier === 1.25, 'City street distraction multiplier must be 1.25');
assert(DISTRACTION_LABELS.dog_park.multiplier === 1.4, 'Dog park distraction multiplier must be 1.4');

// Test 1.2: Base score percentages
assert(SCORE_BASE_PERCENT[1] === 20, 'Score 1 base is 20%');
assert(SCORE_BASE_PERCENT[2] === 40, 'Score 2 base is 40%');
assert(SCORE_BASE_PERCENT[3] === 65, 'Score 3 base is 65%');
assert(SCORE_BASE_PERCENT[4] === 85, 'Score 4 base is 85%');
assert(SCORE_BASE_PERCENT[5] === 100, 'Score 5 base is 100%');

// Test 1.3: Initial mastery calculation (when previousMastery === 0)
const initialHomeScore5 = calculateNewMastery(0, 5, 'home');
assert(initialHomeScore5 === 100, `Initial score 5 at home should be 100%, got ${initialHomeScore5}%`);

const initialHomeScore3 = calculateNewMastery(0, 3, 'home');
assert(initialHomeScore3 === 65, `Initial score 3 at home should be 65%, got ${initialHomeScore3}%`);

const initialQuietYardScore3 = calculateNewMastery(0, 3, 'quiet_yard');
// 65 * 1.1 = 71.5 -> 72
assert(initialQuietYardScore3 === 72, `Initial score 3 in quiet yard should be 72%, got ${initialQuietYardScore3}%`);

const initialCityStreetScore3 = calculateNewMastery(0, 3, 'city_street');
// 65 * 1.25 = 81.25 -> 81
assert(initialCityStreetScore3 === 81, `Initial score 3 on city street should be 81%, got ${initialCityStreetScore3}%`);

const initialDogParkScore3 = calculateNewMastery(0, 3, 'dog_park');
// 65 * 1.4 = 91 -> 91
assert(initialDogParkScore3 === 91, `Initial score 3 in dog park should be 91%, got ${initialDogParkScore3}%`);

// Test 1.4: EMA smoothing when previousMastery > 0
// Formula: Math.round(previousMastery * 0.6 + adjustedTarget * 0.4)
// previous: 50, score: 5, home: target = 100. 50 * 0.6 + 100 * 0.4 = 30 + 40 = 70
const smoothed = calculateNewMastery(50, 5, 'home');
assert(smoothed === 70, `EMA smoothed mastery expected 70%, got ${smoothed}%`);

// previous: 90, score: 1, home: target = 20. 90 * 0.6 + 20 * 0.4 = 54 + 8 = 62
const dropped = calculateNewMastery(90, 1, 'home');
assert(dropped === 62, `EMA dropped mastery expected 62%, got ${dropped}%`);

// Clamping between 0 and 100
const maxClamped = calculateNewMastery(95, 5, 'dog_park');
assert(maxClamped <= 100, 'Mastery must never exceed 100%');
const minClamped = calculateNewMastery(10, 1, 'home');
assert(minClamped >= 0, 'Mastery must never fall below 0%');

console.log('✓ Suite 1 passed.\n');

// -----------------------------------------------------------------------------
// Suite 2: Smart Homework Generation & Motivation Tailoring
// -----------------------------------------------------------------------------
console.log('Suite 2: Smart Homework Generation...');

const baseTestDog: Dog = {
  id: 'test_dog_charlie',
  name: 'Чарли',
  gender: 'male',
  birthDate: '2024-01-01',
  breed: 'Лабрадор',
  weight: 30,
  avatar: '',
  dailyTrainingTime: 30,
  motivationType: 'food',
  favoriteTreats: 'Сушеное легкое',
  allergies: 'Нет',
  triggers: 'Кошки',
  ownerName: 'Ирина',
  ownerPhone: '+7 (900) 123-45-67',
  notes: 'Тестовая собака',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  skills: [],
};

// Test 2.1: Training minutes breakdown
const hw15 = generateSmartHomework({ ...baseTestDog, dailyTrainingTime: 15 }, []);
assert(hw15.dailyPlanSummary.includes('2 подхода по 7 минут'), '15m daily goal breakdown');

const hw20 = generateSmartHomework({ ...baseTestDog, dailyTrainingTime: 20 }, []);
assert(hw20.dailyPlanSummary.includes('2 подхода по 10 минут'), '20m daily goal breakdown');

const hw30 = generateSmartHomework({ ...baseTestDog, dailyTrainingTime: 30 }, []);
assert(hw30.dailyPlanSummary.includes('3 подхода по 10 минут'), '30m daily goal breakdown');

const hw45 = generateSmartHomework({ ...baseTestDog, dailyTrainingTime: 45 }, []);
assert(hw45.dailyPlanSummary.includes('3 подхода по 15 минут'), '45m daily goal breakdown');

const hw60 = generateSmartHomework({ ...baseTestDog, dailyTrainingTime: 60 }, []);
assert(hw60.dailyPlanSummary.includes('4 подхода по 15 минут'), '60m daily goal breakdown');

// Test 2.2: Exercise priority selection for scores 1-3
const scoresMixed: SkillScoreRecord[] = [
  { skillId: 'okd_sit', skillName: 'Сидеть', category: 'okd', score: 5 },
  { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 2 },
  { skillId: 'okd_heel', skillName: 'Рядом', category: 'okd', score: 3 },
  { skillId: 'okd_come', skillName: 'Ко мне', category: 'okd', score: 4 },
];

const hwMixed = generateSmartHomework(baseTestDog, scoresMixed);
assert(hwMixed.exercises.length === 2, `Expected 2 priority exercises (scores 2 and 3), got ${hwMixed.exercises.length}`);
assert(hwMixed.exercises.some((e) => e.skillId === 'okd_stay'), 'Priority exercises include Выдержка');
assert(hwMixed.exercises.some((e) => e.skillId === 'okd_heel'), 'Priority exercises include Рядом');

// Test 2.3: Methodological tips injection from SKILL_METHOD_TIPS
const stayExercise = hwMixed.exercises.find((e) => e.skillId === 'okd_stay');
assert(
  stayExercise?.instruction === SKILL_METHOD_TIPS.okd_stay,
  'Stay exercise includes authentic cynological Rule 3D tip'
);

// Test 2.4: Positive finisher selection
assert(hwMixed.positiveFinisher.skillName === 'Сидеть', 'Positive finisher chooses high-score skill (Сидеть)');
assert(hwMixed.positiveFinisher.instruction.includes('джекпот'), 'Finisher includes positive reinforcement instruction');

// Test 2.5: Motivation tailoring
const hwFood = generateSmartHomework({ ...baseTestDog, motivationType: 'food' }, scoresMixed);
assert(hwFood.generalAdvice.includes('пищевик'), 'Food motivation advice');

const hwPlay = generateSmartHomework({ ...baseTestDog, motivationType: 'play' }, scoresMixed);
assert(hwPlay.generalAdvice.includes('игровик'), 'Play motivation advice');

const hwSocial = generateSmartHomework({ ...baseTestDog, motivationType: 'social' }, scoresMixed);
assert(hwSocial.generalAdvice.includes('социальный контакт'), 'Social motivation advice');

const hwMixedMotiv = generateSmartHomework({ ...baseTestDog, motivationType: 'mixed' }, scoresMixed);
assert(hwMixedMotiv.generalAdvice.includes('Чередуйте'), 'Mixed motivation advice');

console.log('✓ Suite 2 passed.\n');

// -----------------------------------------------------------------------------
// Suite 3: Next Session Plan Generation
// -----------------------------------------------------------------------------
console.log('Suite 3: Next Session Plan Generation...');

// Test 3.1: Priority skills matching low scores
const plan = generateNextSessionPlan(baseTestDog, scoresMixed, 'home');
assert(plan.prioritySkills.includes('Выдержка'), 'Next plan priority skills includes Выдержка');
assert(plan.prioritySkills.includes('Рядом'), 'Next plan priority skills includes Рядом');

// Test 3.2: Progression of distraction targets
const planFromHome = generateNextSessionPlan(baseTestDog, scoresMixed, 'home');
assert(planFromHome.suggestedDistractionTarget === 'quiet_yard', 'home steps up to quiet_yard');

const planFromYard = generateNextSessionPlan(baseTestDog, scoresMixed, 'quiet_yard');
assert(planFromYard.suggestedDistractionTarget === 'city_street', 'quiet_yard steps up to city_street');

const planFromStreet = generateNextSessionPlan(baseTestDog, scoresMixed, 'city_street');
assert(planFromStreet.suggestedDistractionTarget === 'dog_park', 'city_street steps up to dog_park');

const planFromPark = generateNextSessionPlan(baseTestDog, scoresMixed, 'dog_park');
assert(planFromPark.suggestedDistractionTarget === 'dog_park', 'dog_park stays dog_park at peak');

// Test 3.3: Suggested challenges
assert(plan.suggestedChallenges.length >= 3, 'Plan contains at least 3 progressive challenges');
assert(plan.suggestedChallenges.some((c) => c.includes('дистанции')), 'Challenge includes distance increase');

console.log('✓ Suite 3 passed.\n');

// -----------------------------------------------------------------------------
// Suite 4: Clipboard Report Formatting
// -----------------------------------------------------------------------------
console.log('Suite 4: Clipboard Report Formatting...');

const sampleSession: TrainingSession = {
  id: 'session_test_1',
  dogId: baseTestDog.id,
  date: '2026-11-14T14:30:00.000Z',
  durationMinutes: 45,
  distractionLevel: 'city_street',
  timerData: {
    stayDurationSeconds: 120,
  },
  scores: scoresMixed,
  overallIndexSnapshot: 84,
  okdIndexSnapshot: 84,
  behaviorIndexSnapshot: 0,
  homework: hwMixed,
  nextSessionPlan: plan,
  trainerNotes: 'Отличная концентрация на улице',
};

const clipboardText = formatReportForClipboard(baseTestDog, sampleSession);

assert(clipboardText.includes('🐾 ОТЧЕТ О ТРЕНИРОВКЕ: ЧАРЛИ'), 'Includes capitalized header');
assert(clipboardText.includes('Время: 45 мин'), 'Includes duration');
assert(clipboardText.includes('Локация: Городская улица'), 'Includes Russian distraction label');
assert(clipboardText.includes('⏱ Рекорд выдержки: 120 сек (2 мин)'), 'Includes stay timer record');
assert(clipboardText.includes('• Сидеть: 5/5 [★★★★★]'), 'Includes score rating stars');
assert(clipboardText.includes('• Выдержка: 2/5 [★★☆☆☆]'), 'Includes score rating stars for 2/5');
assert(clipboardText.includes('🎯 ДОМАШНЕЕ ЗАДАНИЕ ДЛЯ ХОЗЯЕВ:'), 'Includes homework section');
assert(clipboardText.includes('✨ Закрепление успеха: «Сидеть»'), 'Includes positive finisher');
assert(clipboardText.includes('🗓 ПЛАН НА СЛЕДУЮЩЕЕ ЗАНЯТИЕ ДЛЯ КИНОЛОГА:'), 'Includes next plan section');

console.log('✓ Suite 4 passed.\n');

// -----------------------------------------------------------------------------
// Suite 5: Zustand Store Session Integration & State Mutators
// -----------------------------------------------------------------------------
console.log('Suite 5: Zustand Store Session Integration...');

const store = useDogStore.getState();
store.resetToDemoData();

const initialRexSessionsCount = store.sessions.filter((s) => s.dogId === 'dog_rex').length;

// Create training session for Rex
const createdSession = store.createSession({
  dogId: 'dog_rex',
  durationMinutes: 45,
  distractionLevel: 'city_street',
  scores: [
    { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 5 },
    { skillId: 'okd_heel', skillName: 'Рядом', category: 'okd', score: 5 },
  ],
  timerStaySeconds: 150,
  trainerNotes: 'Рекс отлично выполнил выдержку 2.5 минуты на оживленной улице.',
});

// Verify session record
assert(createdSession.id.startsWith('session_'), 'Session ID format');
assert(createdSession.dogId === 'dog_rex', 'Session dogId matches');
assert(createdSession.durationMinutes === 45, 'Session duration matches');
assert(createdSession.distractionLevel === 'city_street', 'Distraction level recorded');
assert(createdSession.timerData?.stayDurationSeconds === 150, 'Stay timer recorded in session');
assert(createdSession.trainerNotes.includes('2.5 минуты'), 'Trainer notes recorded');

// Verify store session array updated
const updatedRexSessions = useDogStore.getState().sessions.filter((s) => s.dogId === 'dog_rex');
assert(
  updatedRexSessions.length === initialRexSessionsCount + 1,
  `Session count increased from ${initialRexSessionsCount} to ${updatedRexSessions.length}`
);
assert(updatedRexSessions[0].id === createdSession.id, 'New session is at head of list');

// Verify dog skill masteries updated in store
const updatedRex = useDogStore.getState().dogs.find((d) => d.id === 'dog_rex')!;
const updatedStay = updatedRex.skills.find((s) => s.id === 'okd_stay')!;
const updatedHeel = updatedRex.skills.find((s) => s.id === 'okd_heel')!;

assert(updatedStay.lastScore === 5, 'Stay last score updated to 5');
assert(updatedStay.mastery >= 95, `Stay mastery upgraded, now ${updatedStay.mastery}%`);
assert(updatedHeel.lastScore === 5, 'Heel last score updated to 5');

// Verify index recalculation and certificate transition
const rexOverall = calculateOverallDogIndex(updatedRex.skills);
assert(rexOverall.overallIndex >= 96, `Rex overall index >= 96%, got ${rexOverall.overallIndex}%`);
assert(updatedRex.certificateIssued === true, 'Rex certificateIssued transitioned to true');

console.log('✓ Suite 5 passed.\n');

// -----------------------------------------------------------------------------
// Suite 6: Multi-Session Progressive Learning Simulation
// -----------------------------------------------------------------------------
console.log('Suite 6: Multi-Session Progressive Learning Simulation...');

// Create a new novice dog
const pupId = store.addDog({
  name: 'Тайсон',
  gender: 'male',
  birthDate: '2026-05-01',
  breed: 'Доберман',
  weight: 22,
  avatar: '',
  dailyTrainingTime: 20,
  motivationType: 'play',
  favoriteTreats: 'Сушеное мясо',
  allergies: 'Нет',
  triggers: 'Громкие звуки',
  ownerName: 'Андрей',
  ownerPhone: '+7 (911) 222-33-44',
  notes: 'Молодой доберман на начальном этапе ОКД',
  skills: [
    { id: 'okd_sit', name: 'Сидеть', category: 'okd', mastery: 30 },
    { id: 'okd_stay', name: 'Выдержка', category: 'okd', mastery: 20 },
  ],
});

// Session 1: Novice practice at home (score 3)
const s1 = store.createSession({
  dogId: pupId,
  durationMinutes: 20,
  distractionLevel: 'home',
  scores: [
    { skillId: 'okd_sit', skillName: 'Сидеть', category: 'okd', score: 3 },
    { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 2 },
  ],
  timerStaySeconds: 25,
});
assert(s1.durationMinutes === 20, 'Session 1 duration matches');

const pupAfterS1 = useDogStore.getState().dogs.find((d) => d.id === pupId)!;
const sitAfterS1 = pupAfterS1.skills.find((s) => s.id === 'okd_sit')!;
// 30 * 0.6 + 65 * 0.4 = 18 + 26 = 44
assert(sitAfterS1.mastery === 44, `Sit mastery after S1 expected 44, got ${sitAfterS1.mastery}`);

// Session 2: Better practice in quiet yard (score 4)
const s2 = store.createSession({
  dogId: pupId,
  durationMinutes: 20,
  distractionLevel: 'quiet_yard',
  scores: [
    { skillId: 'okd_sit', skillName: 'Сидеть', category: 'okd', score: 4 },
    { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 4 },
  ],
  timerStaySeconds: 60,
});
assert(s2.distractionLevel === 'quiet_yard', 'Session 2 distraction matches');

const pupAfterS2 = useDogStore.getState().dogs.find((d) => d.id === pupId)!;
const sitAfterS2 = pupAfterS2.skills.find((s) => s.id === 'okd_sit')!;
// target: 85 * 1.1 = 93.5 -> 94. 44 * 0.6 + 94 * 0.4 = 26.4 + 37.6 = 64
assert(sitAfterS2.mastery === 64, `Sit mastery after S2 expected 64, got ${sitAfterS2.mastery}`);

// Session 3: Excellent performance on city street (score 5)
const s3 = store.createSession({
  dogId: pupId,
  durationMinutes: 30,
  distractionLevel: 'city_street',
  scores: [
    { skillId: 'okd_sit', skillName: 'Сидеть', category: 'okd', score: 5 },
    { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 5 },
  ],
  timerStaySeconds: 120,
});
assert(s3.timerData?.stayDurationSeconds === 120, 'Session 3 stay timer matches');

const pupAfterS3 = useDogStore.getState().dogs.find((d) => d.id === pupId)!;
const sitAfterS3 = pupAfterS3.skills.find((s) => s.id === 'okd_sit')!;
// target: 100 * 1.25 = 125 -> 100. 64 * 0.6 + 100 * 0.4 = 38.4 + 40 = 78.4 -> 78
assert(sitAfterS3.mastery === 78, `Sit mastery after S3 expected 78, got ${sitAfterS3.mastery}`);

const pupSessions = useDogStore.getState().sessions.filter((s) => s.dogId === pupId);
assert(pupSessions.length === 3, 'Tyson has 3 recorded sessions in history');

// Clean up test dog
store.deleteDog(pupId);
assert(useDogStore.getState().dogs.find((d) => d.id === pupId) === undefined, 'Test dog deleted');
assert(
  useDogStore.getState().sessions.filter((s) => s.dogId === pupId).length === 0,
  'Cascade deleted Tyson sessions'
);

// Reset store to clean demo data
store.resetToDemoData();

console.log('✓ Suite 6 passed.\n');

console.log('====================================================');
console.log('🎉 ALL MILESTONE 3 VERIFICATION TESTS PASSED (6/6 SUITES)');
console.log('====================================================');

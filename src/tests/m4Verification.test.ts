import { useDogStore } from '../store/useDogStore';
import {
  calculateOverallDogIndex,
  getDogRank,
  DOG_RANKS,
  formatDogAgeRussian,
  calculateNewMastery,
  DISTRACTION_LABELS,
  SCORE_BASE_PERCENT,
  type DogRank,
} from '../utils/calculations';
import {
  generateSmartHomework,
  generateNextSessionPlan,
  formatReportForClipboard,
} from '../utils/homeworkGenerator';
import type { Dog, DogSkill, TrainingSession } from '../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== Starting Milestone 4 Comprehensive Verification Suite ===\n');

// Reset store to pristine demo state before verification
useDogStore.getState().resetToDemoData();

// -----------------------------------------------------------------------------
// Suite 1: calculateOverallDogIndex 60/40 Weighting Engine & Edge Cases
// -----------------------------------------------------------------------------
console.log('Suite 1: calculateOverallDogIndex 60/40 Weighting Engine & Edge Cases...');

// 1.1 Dual category standard formula: 60% OKD + 40% Behavior
const dualSkills1: DogSkill[] = [
  { id: '1', name: 'Команда 1', category: 'okd', mastery: 100 },
  { id: '2', name: 'Проблема 1', category: 'behavior', mastery: 50 },
];
const result1 = calculateOverallDogIndex(dualSkills1);
// 100 * 0.6 + 50 * 0.4 = 60 + 20 = 80
assert(result1.okdIndex === 100, `OKD index must be 100, got ${result1.okdIndex}`);
assert(result1.behaviorIndex === 50, `Behavior index must be 50, got ${result1.behaviorIndex}`);
assert(result1.overallIndex === 80, `Dual index (100, 50) must be 80, got ${result1.overallIndex}`);

const dualSkills2: DogSkill[] = [
  { id: '1', name: 'Команда 1', category: 'okd', mastery: 80 },
  { id: '2', name: 'Проблема 1', category: 'behavior', mastery: 90 },
];
const result2 = calculateOverallDogIndex(dualSkills2);
// 80 * 0.6 + 90 * 0.4 = 48 + 36 = 84
assert(result2.overallIndex === 84, `Dual index (80, 90) must be 84, got ${result2.overallIndex}`);

const dualSkills3: DogSkill[] = [
  { id: '1', name: 'Команда 1', category: 'okd', mastery: 95 },
  { id: '2', name: 'Проблема 1', category: 'behavior', mastery: 97 },
];
const result3 = calculateOverallDogIndex(dualSkills3);
// 95 * 0.6 + 97 * 0.4 = 57 + 38.8 = 95.8 -> 96
assert(result3.overallIndex === 96, `Dual index (95, 97) must round to 96, got ${result3.overallIndex}`);

// 1.2 Single category: OKD only
const okdOnlySkills: DogSkill[] = [
  { id: '1', name: 'Сидеть', category: 'okd', mastery: 70 },
  { id: '2', name: 'Лежать', category: 'okd', mastery: 80 },
];
const okdResult = calculateOverallDogIndex(okdOnlySkills);
// avg = 75, behavior = 0 -> overall should equal OKD = 75
assert(okdResult.okdIndex === 75, `OKD avg should be 75, got ${okdResult.okdIndex}`);
assert(okdResult.behaviorIndex === 0, `Behavior should be 0, got ${okdResult.behaviorIndex}`);
assert(okdResult.overallIndex === 75, `Overall for OKD-only must equal okdIndex (75), got ${okdResult.overallIndex}`);

// 1.3 Single category: Behavior only
const behOnlySkills: DogSkill[] = [
  { id: '1', name: 'Поводок', category: 'behavior', mastery: 60 },
  { id: '2', name: 'Прыжки', category: 'behavior', mastery: 80 },
];
const behResult = calculateOverallDogIndex(behOnlySkills);
// avg = 70, okd = 0 -> overall should equal Behavior = 70
assert(behResult.okdIndex === 0, `OKD should be 0, got ${behResult.okdIndex}`);
assert(behResult.behaviorIndex === 70, `Behavior avg should be 70, got ${behResult.behaviorIndex}`);
assert(behResult.overallIndex === 70, `Overall for Behavior-only must equal behaviorIndex (70), got ${behResult.overallIndex}`);

// 1.4 Zero skills edge case
const emptyResult = calculateOverallDogIndex([]);
assert(emptyResult.overallIndex === 0, `Overall for empty skills must be 0, got ${emptyResult.overallIndex}`);
assert(emptyResult.okdIndex === 0, `OKD for empty skills must be 0, got ${emptyResult.okdIndex}`);
assert(emptyResult.behaviorIndex === 0, `Behavior for empty skills must be 0, got ${emptyResult.behaviorIndex}`);

// 1.5 Verification on seeded demo dogs
const dogs = useDogStore.getState().dogs;
const rex = dogs.find((d) => d.id === 'dog_rex')!;
const bulochka = dogs.find((d) => d.id === 'dog_bulochka')!;
const yuta = dogs.find((d) => d.id === 'dog_yuta')!;

assert(Boolean(rex && bulochka && yuta), 'All 3 demo dogs must exist in store');

const rexIndex = calculateOverallDogIndex(rex.skills);
assert(rexIndex.overallIndex === 96, `Rex overall index must be 96%, got ${rexIndex.overallIndex}%`);
assert(rexIndex.okdIndex === 96, `Rex OKD index must be 96%, got ${rexIndex.okdIndex}%`);

const bulochkaIndex = calculateOverallDogIndex(bulochka.skills);
// OKD avg: 70%, Behavior avg: 55% -> 70*0.6 + 55*0.4 = 42 + 22 = 64%
assert(bulochkaIndex.okdIndex === 70, `Bulochka OKD index must be 70%, got ${bulochkaIndex.okdIndex}%`);
assert(bulochkaIndex.behaviorIndex === 55, `Bulochka Behavior index must be 55%, got ${bulochkaIndex.behaviorIndex}%`);
assert(bulochkaIndex.overallIndex === 64, `Bulochka overall index must be 64%, got ${bulochkaIndex.overallIndex}%`);

const yutaIndex = calculateOverallDogIndex(yuta.skills);
assert(yutaIndex.overallIndex === 100, `Yuta overall index must be 100%, got ${yutaIndex.overallIndex}%`);

console.log('✓ Suite 1 passed.\n');

// -----------------------------------------------------------------------------
// Suite 2: DOG_RANKS 5-Tier Hierarchy & Exact Boundary Transitions
// -----------------------------------------------------------------------------
console.log('Suite 2: DOG_RANKS 5-Tier Hierarchy & Exact Boundary Transitions...');

// 2.1 Verify 5 tiers structure
assert(DOG_RANKS.length === 5, `Expected 5 rank tiers, found ${DOG_RANKS.length}`);
assert(DOG_RANKS[0].title === 'Новичок на поводке', 'Tier 1 title mismatch');
assert(DOG_RANKS[1].title === 'Прилежный ученик', 'Tier 2 title mismatch');
assert(DOG_RANKS[2].title === 'Воспитанный компаньон', 'Tier 3 title mismatch');
assert(DOG_RANKS[3].title === 'Без пяти минут спецназ', 'Tier 4 title mismatch');
assert(DOG_RANKS[4].title === 'Идеальная служебная собака', 'Tier 5 title mismatch');

// Range spans check
assert(DOG_RANKS[0].minPercent === 0 && DOG_RANKS[0].maxPercent === 39, 'Tier 1 range must be 0-39');
assert(DOG_RANKS[1].minPercent === 40 && DOG_RANKS[1].maxPercent === 59, 'Tier 2 range must be 40-59');
assert(DOG_RANKS[2].minPercent === 60 && DOG_RANKS[2].maxPercent === 79, 'Tier 3 range must be 60-79');
assert(DOG_RANKS[3].minPercent === 80 && DOG_RANKS[3].maxPercent === 95, 'Tier 4 range must be 80-95');
assert(DOG_RANKS[4].minPercent === 96 && DOG_RANKS[4].maxPercent === 100, 'Tier 5 range must be 96-100');

// 2.2 Boundary transitions
// 0–39
assert(getDogRank(0).title === 'Новичок на поводке', '0% must be Tier 1');
assert(getDogRank(39).title === 'Новичок на поводке', '39% must be Tier 1');
assert(getDogRank(39.4).title === 'Новичок на поводке', '39.4% must round to 39 -> Tier 1');
assert(getDogRank(39.5).title === 'Прилежный ученик', '39.5% must round to 40 -> Tier 2');

// 40–59
assert(getDogRank(40).title === 'Прилежный ученик', '40% must be Tier 2');
assert(getDogRank(59).title === 'Прилежный ученик', '59% must be Tier 2');
assert(getDogRank(59.4).title === 'Прилежный ученик', '59.4% must round to 59 -> Tier 2');
assert(getDogRank(59.5).title === 'Воспитанный компаньон', '59.5% must round to 60 -> Tier 3');

// 60–79
assert(getDogRank(60).title === 'Воспитанный компаньон', '60% must be Tier 3');
assert(getDogRank(79).title === 'Воспитанный компаньон', '79% must be Tier 3');
assert(getDogRank(79.4).title === 'Воспитанный компаньон', '79.4% must round to 79 -> Tier 3');
assert(getDogRank(79.5).title === 'Без пяти минут спецназ', '79.5% must round to 80 -> Tier 4');

// 80–95
assert(getDogRank(80).title === 'Без пяти минут спецназ', '80% must be Tier 4');
assert(getDogRank(95).title === 'Без пяти минут спецназ', '95% must be Tier 4');
assert(getDogRank(95.4).title === 'Без пяти минут спецназ', '95.4% must round to 95 -> Tier 4');
assert(getDogRank(95.5).title === 'Идеальная служебная собака', '95.5% must round to 96 -> Tier 5');

// 96–100
assert(getDogRank(96).title === 'Идеальная служебная собака', '96% must be Tier 5');
assert(getDogRank(100).title === 'Идеальная служебная собака', '100% must be Tier 5');

// 2.3 Clamping guards
assert(getDogRank(-15).title === 'Новичок на поводке', 'Negative percent must clamp to Tier 1');
assert(getDogRank(120).title === 'Идеальная служебная собака', 'Percent > 100 must clamp to Tier 5');

// 2.4 Seeded dogs ranks & Russian metadata
assert(getDogRank(rexIndex.overallIndex).title === 'Идеальная служебная собака', 'Rex must be Tier 5');
assert(getDogRank(bulochkaIndex.overallIndex).title === 'Воспитанный компаньон', 'Bulochka must be Tier 3');
assert(getDogRank(yutaIndex.overallIndex).title === 'Идеальная служебная собака', 'Yuta must be Tier 5');
assert(formatDogAgeRussian(rex.birthDate) !== '—', 'Rex age must be formatted in Russian');
assert(formatDogAgeRussian(bulochka.birthDate) !== '—', 'Bulochka age must be formatted in Russian');
assert(formatDogAgeRussian(yuta.birthDate) !== '—', 'Yuta age must be formatted in Russian');

console.log('✓ Suite 2 passed.\n');

// -----------------------------------------------------------------------------
// Suite 3: Recharts Dynamic Trend Data Mapping & Chronological Sorting
// -----------------------------------------------------------------------------
console.log('Suite 3: Recharts Dynamic Trend Data Mapping & Chronological Sorting...');

const allSessions = useDogStore.getState().sessions;

// Helper mirroring AnalyticsChart data mapping
function mapSessionsToChartData(sessions: TrainingSession[], dog: Dog) {
  const dogSessions = sessions.filter((s) => s.dogId === dog.id);
  const sorted = [...dogSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const hasBehaviorSkills = dog.skills.some((s) => s.category === 'behavior');
  const hasOkdSkills = dog.skills.some((s) => s.category === 'okd');

  return sorted.map((session, index) => {
    let dateShort = '—';
    let dateFull = '—';
    try {
      const parsedDate = parseISO(session.date);
      dateShort = format(parsedDate, 'd MMM', { locale: ru });
      dateFull = format(parsedDate, 'd MMMM yyyy', { locale: ru });
    } catch {
      dateShort = session.date.slice(0, 10);
      dateFull = session.date;
    }

    const distraction = DISTRACTION_LABELS[session.distractionLevel]?.label ?? 'Обычный';

    return {
      id: session.id,
      sessionNumber: index + 1,
      name: `Занятие ${index + 1}`,
      dateIso: session.date,
      dateShort,
      dateFull,
      distractionLabel: distraction,
      overallIndex: session.overallIndexSnapshot,
      okdIndex: session.okdIndexSnapshot,
      behaviorIndex: session.behaviorIndexSnapshot,
      hasBehaviorSkills,
      hasOkdSkills,
    };
  });
}

// 3.1 Chronological sorting check
const rexChartData = mapSessionsToChartData(allSessions, rex);
assert(rexChartData.length === 5, `Rex must have 5 charted sessions, got ${rexChartData.length}`);
for (let i = 0; i < rexChartData.length - 1; i++) {
  const current = new Date(rexChartData[i].dateIso).getTime();
  const next = new Date(rexChartData[i + 1].dateIso).getTime();
  assert(current <= next, `Sessions must be chronologically ascending: ${rexChartData[i].dateIso} vs ${rexChartData[i + 1].dateIso}`);
  assert(rexChartData[i].sessionNumber === i + 1, `Session numbering must be 1-based: expected ${i + 1}`);
}
assert(rexChartData[0].name === 'Занятие 1', 'First session label must be "Занятие 1"');
assert(rexChartData[4].name === 'Занятие 5', 'Fifth session label must be "Занятие 5"');
assert(rexChartData[0].overallIndex === 84, `Rex session 1 overall should be 84, got ${rexChartData[0].overallIndex}`);
assert(rexChartData[4].overallIndex === 96, `Rex session 5 overall should be 96, got ${rexChartData[4].overallIndex}`);

// 3.2 Bulochka dual-index trend check
const bulochkaChartData = mapSessionsToChartData(allSessions, bulochka);
assert(bulochkaChartData.length === 5, `Bulochka must have 5 charted sessions, got ${bulochkaChartData.length}`);
assert(bulochkaChartData[0].overallIndex === 42, `Bulochka session 1 should be 42%, got ${bulochkaChartData[0].overallIndex}`);
assert(bulochkaChartData[4].overallIndex === 64, `Bulochka session 5 should be 64%, got ${bulochkaChartData[4].overallIndex}`);
assert(bulochkaChartData[4].hasBehaviorSkills === true, 'Bulochka must indicate hasBehaviorSkills: true');

// 3.3 Yuta graduation trend check
const yutaChartData = mapSessionsToChartData(allSessions, yuta);
assert(yutaChartData.length === 6, `Yuta must have 6 charted sessions, got ${yutaChartData.length}`);
assert(yutaChartData[0].overallIndex === 88, `Yuta starts at 88%, got ${yutaChartData[0].overallIndex}%`);
assert(yutaChartData[5].overallIndex === 100, `Yuta final session reaches 100%, got ${yutaChartData[5].overallIndex}%`);

// 3.4 Empty & single session states
const emptyDog: Dog = { ...rex, id: 'dog_empty', skills: [] };
const emptyChartData = mapSessionsToChartData([], emptyDog);
assert(emptyChartData.length === 0, 'Empty sessions array must return 0 chart data points');

const singleSession: TrainingSession = {
  ...allSessions[0],
  dogId: 'dog_single',
  overallIndexSnapshot: 75,
  okdIndexSnapshot: 75,
  behaviorIndexSnapshot: 0,
};
const singleDog: Dog = { ...rex, id: 'dog_single' };
const singleChartData = mapSessionsToChartData([singleSession], singleDog);
assert(singleChartData.length === 1, 'Single session must map to exactly 1 point');
assert(singleChartData[0].sessionNumber === 1, 'Single session must be numbered 1');
assert(singleChartData[0].overallIndex === 75, 'Single session index snapshot preserved');

console.log('✓ Suite 3 passed.\n');

// -----------------------------------------------------------------------------
// Suite 4: Two-Column Mastery Partitioning (>=90% vs <90%) & Deltas
// -----------------------------------------------------------------------------
console.log('Suite 4: Two-Column Mastery Partitioning (>=90% vs <90%) & Deltas...');

function partitionSkills(skills: DogSkill[]) {
  const mastered = skills
    .filter((s) => s.mastery >= 90)
    .sort((a, b) => b.mastery - a.mastery || a.name.localeCompare(b.name, 'ru'));

  const needsWork = skills
    .filter((s) => s.mastery < 90)
    .sort((a, b) => a.mastery - b.mastery || a.name.localeCompare(b.name, 'ru'));

  return { mastered, needsWork };
}

// 4.1 Boundary testing at exactly 90%
const testBoundarySkills: DogSkill[] = [
  { id: 's1', name: 'Навык 89', category: 'okd', mastery: 89 },
  { id: 's2', name: 'Навык 90', category: 'okd', mastery: 90 },
  { id: 's3', name: 'Навык 91', category: 'okd', mastery: 91 },
];
const boundaryPartition = partitionSkills(testBoundarySkills);
assert(boundaryPartition.needsWork.length === 1, `89% must be in needsWork, got length ${boundaryPartition.needsWork.length}`);
assert(boundaryPartition.needsWork[0].id === 's1', 's1 must be in needsWork');
assert(boundaryPartition.mastered.length === 2, `90% and 91% must be in mastered, got length ${boundaryPartition.mastered.length}`);
assert(boundaryPartition.mastered.map((s) => s.id).includes('s2'), 's2 (90%) must be in mastered');
assert(boundaryPartition.mastered.map((s) => s.id).includes('s3'), 's3 (91%) must be in mastered');

// 4.2 Invariant: mutual exclusivity and exhaustiveness
assert(
  boundaryPartition.mastered.length + boundaryPartition.needsWork.length === testBoundarySkills.length,
  'Partition must be exhaustive and mutually exclusive'
);

// 4.3 Delta to 100% calculation
const delta1 = 100 - boundaryPartition.needsWork[0].mastery;
assert(delta1 === 11, `Delta for 89% should be +11%, got ${delta1}%`);

// 4.4 Demo dogs partition checks
const rexPartition = partitionSkills(rex.skills);
// Rex has 9 skills all >= 92%
assert(rexPartition.mastered.length === 9, `Rex must have 9 mastered skills, got ${rexPartition.mastered.length}`);
assert(rexPartition.needsWork.length === 0, `Rex must have 0 skills needing work, got ${rexPartition.needsWork.length}`);

const bulochkaPartition = partitionSkills(bulochka.skills);
// Bulochka has 7 skills all between 50% and 85%
assert(bulochkaPartition.mastered.length === 0, `Bulochka must have 0 mastered skills, got ${bulochkaPartition.mastered.length}`);
assert(bulochkaPartition.needsWork.length === 7, `Bulochka must have 7 skills needing work, got ${bulochkaPartition.needsWork.length}`);
// Ascending sort check: weakest skills first in needsWork
for (let i = 0; i < bulochkaPartition.needsWork.length - 1; i++) {
  assert(
    bulochkaPartition.needsWork[i].mastery <= bulochkaPartition.needsWork[i + 1].mastery,
    'needsWork column must be sorted ascending by mastery'
  );
}

const yutaPartition = partitionSkills(yuta.skills);
// Yuta has 9 skills all 100%
assert(yutaPartition.mastered.length === 9, `Yuta must have 9 mastered skills, got ${yutaPartition.mastered.length}`);
assert(yutaPartition.needsWork.length === 0, `Yuta must have 0 skills needing work, got ${yutaPartition.needsWork.length}`);

console.log('✓ Suite 4 passed.\n');

// -----------------------------------------------------------------------------
// Suite 5: Rank Progression & Next Tier Delta Calculations
// -----------------------------------------------------------------------------
console.log('Suite 5: Rank Progression & Next Tier Delta Calculations...');

function calculateTierProgress(overallIndex: number) {
  const currentRank = getDogRank(overallIndex);
  const currentRankIndex = DOG_RANKS.findIndex((r) => r.title === currentRank.title);
  const nextRank: DogRank | null =
    currentRankIndex >= 0 && currentRankIndex < DOG_RANKS.length - 1
      ? DOG_RANKS[currentRankIndex + 1]
      : null;

  const pointsToNext = nextRank ? Math.max(0, nextRank.minPercent - overallIndex) : 0;
  const pointsToHundred = Math.max(0, 100 - overallIndex);

  const tierRange = nextRank
    ? nextRank.minPercent - currentRank.minPercent
    : 100 - currentRank.minPercent;
  const tierProgress =
    tierRange > 0
      ? Math.min(100, Math.max(0, Math.round(((overallIndex - currentRank.minPercent) / tierRange) * 100)))
      : 100;

  return { currentRank, nextRank, pointsToNext, pointsToHundred, tierProgress };
}

// 5.1 Progression for Bulochka (64%, Tier 3: 60-79%, next: Tier 4 min 80%)
const bulochkaProg = calculateTierProgress(64);
assert(bulochkaProg.currentRank.title === 'Воспитанный компаньон', 'Bulochka must be Tier 3');
assert(bulochkaProg.nextRank?.title === 'Без пяти минут спецназ', 'Bulochka next rank must be Tier 4');
assert(bulochkaProg.pointsToNext === 16, `Bulochka points to next should be 80 - 64 = 16%, got ${bulochkaProg.pointsToNext}%`);
// (64 - 60) / (80 - 60) = 4 / 20 = 20%
assert(bulochkaProg.tierProgress === 20, `Bulochka tier progress should be 20%, got ${bulochkaProg.tierProgress}%`);

// 5.2 Progression for Novice at 25% (Tier 1: 0-39%, next: Tier 2 min 40%)
const noviceProg = calculateTierProgress(25);
assert(noviceProg.currentRank.title === 'Новичок на поводке', 'Must be Tier 1');
assert(noviceProg.nextRank?.title === 'Прилежный ученик', 'Next must be Tier 2');
assert(noviceProg.pointsToNext === 15, `Points to next should be 40 - 25 = 15%, got ${noviceProg.pointsToNext}%`);

// 5.3 Progression for Rex (96%, Tier 5: 96-100%, highest rank)
const rexProg = calculateTierProgress(96);
assert(rexProg.currentRank.title === 'Идеальная служебная собака', 'Rex must be Tier 5');
assert(rexProg.nextRank === null, 'Rex has no next rank (max tier reached)');
assert(rexProg.pointsToNext === 0, 'Points to next rank is 0');
assert(rexProg.pointsToHundred === 4, `Rex points to 100% should be 4%, got ${rexProg.pointsToHundred}%`);

// 5.4 Progression for Yuta (100%, Tier 5: 100% perfection)
const yutaProg = calculateTierProgress(100);
assert(yutaProg.nextRank === null, 'Yuta next rank is null');
assert(yutaProg.pointsToHundred === 0, 'Yuta points to 100% is 0');
assert(yutaProg.tierProgress === 100, 'Yuta tier progress is 100%');

console.log('✓ Suite 5 passed.\n');

// -----------------------------------------------------------------------------
// Suite 6: Non-Regression Verification (M2 & M3 Capability Integration)
// -----------------------------------------------------------------------------
console.log('Suite 6: Non-Regression Verification (M2 & M3 Capability Integration)...');

// 6.1 M2 Store CRUD & Invariants
const store = useDogStore.getState();
const initialDogsCount = store.dogs.length;
assert(initialDogsCount >= 3, `Expected at least 3 initial demo dogs, found ${initialDogsCount}`);

// Add a test dog
const testDogId = store.addDog({
  name: 'Шарик',
  gender: 'male',
  birthDate: '2025-01-01',
  breed: 'Двортерьер',
  weight: 15,
  avatar: '',
  dailyTrainingTime: 20,
  motivationType: 'food',
  favoriteTreats: 'Сыр',
  allergies: '',
  triggers: '',
  ownerName: 'Иван',
  ownerPhone: '+79991234567',
  notes: 'Тестовая собака',
  skills: [
    { id: 'sk_sit', name: 'Сидеть', category: 'okd', mastery: 50 },
    { id: 'sk_pull', name: 'Тянет поводок', category: 'behavior', mastery: 40 },
  ],
});
assert(useDogStore.getState().dogs.some((d) => d.id === testDogId), 'Added test dog successfully');
const testDogObj = useDogStore.getState().dogs.find((d) => d.id === testDogId)!;

// 6.2 M3 EMA Recalculation & Homework Generator
assert(SCORE_BASE_PERCENT[5] === 100, 'Score 5 base percent is 100%');
const baseSit = calculateNewMastery(50, 4, 'quiet_yard');
// 50 * 0.6 + round(85 * 1.1) * 0.4 = 30 + 94 * 0.4 = 30 + 37.6 = 67.6 -> 68
assert(baseSit === 68, `Expected EMA mastery 68, got ${baseSit}`);

const hw = generateSmartHomework(
  testDogObj,
  [
    { skillId: 'sk_sit', skillName: 'Сидеть', category: 'okd', score: 3 },
    { skillId: 'sk_pull', skillName: 'Тянет поводок', category: 'behavior', score: 2 },
  ]
);
assert(hw.exercises.length === 2, `Expected 2 homework exercises, got ${hw.exercises.length}`);
assert(hw.dailyPlanSummary.length > 0, 'Daily plan summary must not be empty');
assert(hw.positiveFinisher.skillName.length > 0, 'Positive finisher must not be empty');

const plan = generateNextSessionPlan(
  testDogObj,
  [
    { skillId: 'sk_sit', skillName: 'Сидеть', category: 'okd', score: 3 },
    { skillId: 'sk_pull', skillName: 'Тянет поводок', category: 'behavior', score: 2 },
  ],
  'quiet_yard'
);
assert(plan.prioritySkills.length > 0, 'Next session plan must have priority skills');

// 6.3 Store Session Creation & Cascade Cleanup
const session = store.createSession({
  dogId: testDogId,
  durationMinutes: 20,
  distractionLevel: 'quiet_yard',
  scores: [
    { skillId: 'sk_sit', skillName: 'Сидеть', category: 'okd', score: 4 },
    { skillId: 'sk_pull', skillName: 'Тянет поводок', category: 'behavior', score: 3 },
  ],
  trainerNotes: 'Хороший прогресс',
});
assert(session.dogId === testDogId, 'Created session dogId matches');
assert(session.overallIndexSnapshot > 0, 'Session overall index snapshot recorded');

const reportText = formatReportForClipboard(testDogObj, session);
assert(reportText.includes('ОТЧЕТ О ТРЕНИРОВКЕ'), 'Clipboard report formatted in Russian');
assert(reportText.includes('Шарик'), 'Report mentions test dog name');

const testDogSessions = useDogStore.getState().sessions.filter((s) => s.dogId === testDogId);
assert(testDogSessions.length === 1, 'Test dog has 1 session');

// Delete test dog and verify cascade session deletion
store.deleteDog(testDogId);
assert(!useDogStore.getState().dogs.some((d) => d.id === testDogId), 'Test dog deleted');
assert(
  useDogStore.getState().sessions.filter((s) => s.dogId === testDogId).length === 0,
  'Test dog sessions cascade deleted'
);

// Reset store to pristine demo data
store.resetToDemoData();
assert(useDogStore.getState().dogs.length === 3, 'Demo data restored with 3 dogs');
assert(useDogStore.getState().sessions.length === 16, 'Demo data restored with 16 sessions');

console.log('✓ Suite 6 passed.\n');

console.log('====================================================');
console.log('🎉 ALL MILESTONE 4 VERIFICATION TESTS PASSED (6/6 SUITES)');
console.log('====================================================');

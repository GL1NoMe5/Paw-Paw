import { useDogStore } from '../store/useDogStore';
import { DEMO_DOG_REX, DEMO_DOG_BULOCHKA, DEMO_DOG_YUTA, DEMO_SESSIONS } from '../store/demoData';
import {
  formatDogAgeRussian,
  getDogRank,
  calculateOverallDogIndex,
  filterDogByCategory,
} from '../utils/calculations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Starting Milestone 2 Verification Suite ---');

// 1. M1 Hardening Verification
console.log('Test 1: M1 Hardening checks...');
assert(formatDogAgeRussian('') === '—', 'formatDogAgeRussian empty string should return "—"');
assert(formatDogAgeRussian('not-a-date') === '—', 'formatDogAgeRussian invalid date string should return "—"');
assert(formatDogAgeRussian('2024-11-10').includes('год'), 'formatDogAgeRussian should calculate years');
const rank95_6 = getDogRank(95.6);
assert(
  rank95_6.title === 'Идеальная служебная собака',
  `Expected "Идеальная служебная собака" for 95.6%, got "${rank95_6.title}"`
);
const rank63_8 = getDogRank(63.8);
assert(
  rank63_8.title === 'Воспитанный компаньон',
  `Expected "Воспитанный компаньон" for 63.8%, got "${rank63_8.title}"`
);
console.log('✓ Test 1 passed.');

// 2. Demo Data Integrity
console.log('Test 2: Demo data structure & invariants...');
assert(DEMO_DOG_REX.id === 'dog_rex', 'Rex ID matches');
assert(DEMO_DOG_REX.breed === 'Немецкая овчарка', 'Rex breed matches');
assert(DEMO_DOG_REX.gender === 'male', 'Rex gender matches');
assert(DEMO_DOG_REX.skills.length === 9, 'Rex has 9 OKD skills');

const rexIndex = calculateOverallDogIndex(DEMO_DOG_REX.skills);
assert(rexIndex.overallIndex === 96, `Rex index must be 96%, got ${rexIndex.overallIndex}%`);
assert(DEMO_DOG_REX.certificateIssued === false, 'Rex certificate not issued yet');

assert(DEMO_DOG_BULOCHKA.id === 'dog_bulochka', 'Bulochka ID matches');
assert(DEMO_DOG_BULOCHKA.gender === 'female', 'Bulochka gender matches');
const bulochkaIndex = calculateOverallDogIndex(DEMO_DOG_BULOCHKA.skills);
assert(
  bulochkaIndex.overallIndex === 64,
  `Bulochka index must be 64%, got ${bulochkaIndex.overallIndex}%`
);

assert(DEMO_DOG_YUTA.id === 'dog_yuta', 'Yuta ID matches');
assert(DEMO_DOG_YUTA.certificateIssued === true, 'Yuta certificate is issued');
const yutaIndex = calculateOverallDogIndex(DEMO_DOG_YUTA.skills);
assert(yutaIndex.overallIndex === 100, `Yuta index must be 100%, got ${yutaIndex.overallIndex}%`);

assert(DEMO_SESSIONS.length === 16, `Total demo sessions must be 16, got ${DEMO_SESSIONS.length}`);
console.log('✓ Test 2 passed.');

// 3. Zustand Store Actions
console.log('Test 3: Zustand store CRUD & session operations...');
const store = useDogStore.getState();

// Reset to clean demo state
store.resetToDemoData();
const initialDogs = useDogStore.getState().dogs;
assert(initialDogs.length === 3, `Store initialized with 3 demo dogs, got ${initialDogs.length}`);

// Add Dog
const newDogId = store.addDog({
  name: 'Байкал',
  gender: 'male',
  birthDate: '2025-01-15',
  breed: 'Сибирский хаски',
  weight: 24,
  avatar: '',
  dailyTrainingTime: 30,
  motivationType: 'play',
  favoriteTreats: 'Сушеное мясо',
  allergies: 'Нет',
  triggers: 'Кошки',
  ownerName: 'Максим Петров',
  ownerPhone: '+7 (999) 111-22-33',
  notes: 'Энергичный кобель',
  skills: [
    { id: 'okd_sit', name: 'Сидеть', category: 'okd', mastery: 50 },
    { id: 'okd_come', name: 'Ко мне', category: 'okd', mastery: 40 },
  ],
});
assert(useDogStore.getState().dogs.length === 4, 'Dog count should be 4 after addDog');
const addedDog = useDogStore.getState().dogs.find((d) => d.id === newDogId);
assert(addedDog !== undefined && addedDog.name === 'Байкал', 'Added dog name matches');

// Update Dog
store.updateDog(newDogId, { weight: 25.5 });
const updatedDog = useDogStore.getState().dogs.find((d) => d.id === newDogId);
assert(updatedDog?.weight === 25.5, 'Dog weight updated');

// Add Skill to Dog
store.addSkillToDog(newDogId, {
  name: 'Змейка между ног',
  category: 'okd',
  mastery: 20,
  isCustom: true,
});
const dogWithSkill = useDogStore.getState().dogs.find((d) => d.id === newDogId);
assert(dogWithSkill?.skills.length === 3, 'Dog now has 3 skills');
const customSkill = dogWithSkill?.skills.find((s) => s.name === 'Змейка между ног');
assert(customSkill !== undefined && customSkill.isCustom === true, 'Custom skill exists');

// Update Skill
if (customSkill) {
  store.updateSkill(newDogId, customSkill.id, { mastery: 75, lastScore: 4 });
  const dogWithUpdatedSkill = useDogStore.getState().dogs.find((d) => d.id === newDogId);
  const updatedCustomSkill = dogWithUpdatedSkill?.skills.find((s) => s.id === customSkill.id);
  assert(updatedCustomSkill?.mastery === 75, 'Skill mastery updated');
  assert(updatedCustomSkill?.lastScore === 4, 'Skill lastScore updated');

  // Delete Skill
  store.deleteSkill(newDogId, customSkill.id);
  const dogAfterSkillDelete = useDogStore.getState().dogs.find((d) => d.id === newDogId);
  assert(dogAfterSkillDelete?.skills.length === 2, 'Skill successfully deleted');
}

// Create Session for Rex (trigger transition from 96% to 100% diploma readiness)
const session = store.createSession({
  dogId: 'dog_rex',
  durationMinutes: 45,
  distractionLevel: 'dog_park',
  scores: [
    { skillId: 'okd_stay', skillName: 'Выдержка', category: 'okd', score: 5 },
  ],
  timerStaySeconds: 180,
  trainerNotes: 'Рекс блестяще выполнил выдержку 3 минуты!',
});

assert(session.id.startsWith('session_'), 'Session generated with valid ID');
assert(session.scores[0].score === 5, 'Session score recorded');
assert(session.homework.exercises.length >= 0, 'Homework generated');
assert(session.nextSessionPlan.prioritySkills.length > 0, 'Next session plan generated');

const rexAfterSession = useDogStore.getState().dogs.find((d) => d.id === 'dog_rex')!;
const staySkill = rexAfterSession.skills.find((s) => s.id === 'okd_stay')!;
assert(staySkill.mastery >= 95, `Rex stay mastery upgraded, now ${staySkill.mastery}%`);
assert(rexAfterSession.certificateIssued === true, 'Rex certificateIssued should now be true');

// Delete Dog
store.deleteDog(newDogId);
assert(useDogStore.getState().dogs.length === 3, 'Dog successfully deleted');

// JSON Export & Import
const exportedJson = store.exportDatabaseToJson();
assert(typeof exportedJson === 'string', 'Exported JSON is string');
assert(exportedJson.includes('"app": "DogTeacher Workstation"'), 'JSON header verified');

const importResult = store.importDatabaseFromJson(exportedJson);
assert(importResult.success === true, 'Import successful');
assert(importResult.count === 3, `Imported 3 dogs, got ${importResult.count}`);

// Reset to clean demo data
store.resetToDemoData();
assert(useDogStore.getState().dogs.length === 3, 'Reset to demo dogs confirmed');

console.log('✓ Test 3 passed.');

// 4. Category Filtering Logic
console.log('Test 4: Category filtering across initial demo dogs...');
const initialDemoDogs = [DEMO_DOG_REX, DEMO_DOG_BULOCHKA, DEMO_DOG_YUTA];

// 'all' filter yields all 3 dogs
const allFiltered = initialDemoDogs.filter((d) => filterDogByCategory(d, 'all'));
assert(allFiltered.length === 3, `Expected 3 dogs for 'all', got ${allFiltered.length}`);
assert(
  allFiltered.some((d) => d.id === 'dog_rex') &&
    allFiltered.some((d) => d.id === 'dog_bulochka') &&
    allFiltered.some((d) => d.id === 'dog_yuta'),
  'All 3 dogs present under "all" filter'
);

// 'active_okd' filter yields Rex ('dog_rex') and Bulochka ('dog_bulochka')
const activeOkdFiltered = initialDemoDogs.filter((d) => filterDogByCategory(d, 'active_okd'));
assert(
  activeOkdFiltered.length === 2,
  `Expected 2 dogs for 'active_okd', got ${activeOkdFiltered.length}`
);
assert(activeOkdFiltered.some((d) => d.id === 'dog_rex'), 'Rex must be in active_okd');
assert(activeOkdFiltered.some((d) => d.id === 'dog_bulochka'), 'Bulochka must be in active_okd');
assert(
  !activeOkdFiltered.some((d) => d.id === 'dog_yuta'),
  'Yuta (certified graduate) must NOT be in active_okd'
);

// 'behavior' filter yields Bulochka ('dog_bulochka')
const behaviorFiltered = initialDemoDogs.filter((d) => filterDogByCategory(d, 'behavior'));
assert(
  behaviorFiltered.length === 1,
  `Expected 1 dog for 'behavior', got ${behaviorFiltered.length}`
);
assert(
  behaviorFiltered[0].id === 'dog_bulochka',
  `Expected Bulochka in 'behavior', got ${behaviorFiltered[0]?.id}`
);
assert(!behaviorFiltered.some((d) => d.id === 'dog_rex'), 'Rex must NOT be in behavior filter');
assert(!behaviorFiltered.some((d) => d.id === 'dog_yuta'), 'Yuta must NOT be in behavior filter');

// 'graduates' filter yields only Yuta ('dog_yuta')
const graduatesFiltered = initialDemoDogs.filter((d) => filterDogByCategory(d, 'graduates'));
assert(
  graduatesFiltered.length === 1,
  `Expected 1 dog for 'graduates', got ${graduatesFiltered.length}`
);
assert(
  graduatesFiltered[0].id === 'dog_yuta',
  `Expected only Yuta in 'graduates', got ${graduatesFiltered[0]?.id}`
);
assert(
  !graduatesFiltered.some((d) => d.id === 'dog_rex'),
  'Rex (uncertified) must NOT be in graduates'
);
assert(
  !graduatesFiltered.some((d) => d.id === 'dog_bulochka'),
  'Bulochka must NOT be in graduates'
);

console.log('✓ Test 4 passed.');
console.log('All Milestone 2 tests passed successfully!');

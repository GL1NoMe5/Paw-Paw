import { useDogStore } from '../store/useDogStore';
import {
  ATTENTION_PRESETS,
  DEFAULT_DISCIPLINES,
  TRUST_PRESETS,
  type Dog,
  type DogSkill,
} from '../types';
import {
  calculateOverallDogIndex,
  filterDogByCategory,
} from '../utils/calculations';
import {
  formatReportForClipboard,
  generateSmartHomework,
  SKILL_METHOD_TIPS,
} from '../utils/homeworkGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== Starting Attention & Trust Command Blocks Verification Suite ===\n');

const store = useDogStore.getState();
store.resetToDemoData();

// -----------------------------------------------------------------------------
// Suite 1: Default Disciplines & Presets
// -----------------------------------------------------------------------------
console.log('Suite 1: Default Disciplines & Presets...');

assert(DEFAULT_DISCIPLINES.length === 6, `Expected 6 disciplines, got ${DEFAULT_DISCIPLINES.length}`);
const attentionDisc = DEFAULT_DISCIPLINES.find((d) => d.id === 'attention');
const trustDisc = DEFAULT_DISCIPLINES.find((d) => d.id === 'trust');
assert(Boolean(attentionDisc), 'attention discipline must exist in DEFAULT_DISCIPLINES');
assert(Boolean(trustDisc), 'trust discipline must exist in DEFAULT_DISCIPLINES');
assert(attentionDisc?.title === 'Команды для внимания', `Unexpected attention title: ${attentionDisc?.title}`);
assert(trustDisc?.title === 'Команды для доверия', `Unexpected trust title: ${trustDisc?.title}`);

assert(
  ATTENTION_PRESETS.map((c) => c.name).join('|') === 'Крючок|Восьмерка|Змейка',
  `ATTENTION_PRESETS mismatch: ${ATTENTION_PRESETS.map((c) => c.name).join(', ')}`
);
assert(
  ATTENTION_PRESETS.every((c) => c.category === 'attention'),
  'All ATTENTION_PRESETS must have category "attention"'
);
assert(
  TRUST_PRESETS.map((c) => c.name).join('|') === 'Зубы',
  `TRUST_PRESETS mismatch: ${TRUST_PRESETS.map((c) => c.name).join(', ')}`
);
assert(
  TRUST_PRESETS.every((c) => c.category === 'trust'),
  'All TRUST_PRESETS must have category "trust"'
);

const initialState = useDogStore.getState();
assert(
  initialState.disciplineCommands.attention?.map((c) => c.name).join('|') === 'Крючок|Восьмерка|Змейка',
  'Store disciplineCommands.attention initialized with Крючок, Восьмерка, Змейка'
);
assert(
  initialState.disciplineCommands.trust?.map((c) => c.name).join('|') === 'Зубы',
  'Store disciplineCommands.trust initialized with Зубы'
);

console.log('✓ Suite 1 passed.\n');

// -----------------------------------------------------------------------------
// Suite 2: Discipline Command Builder CRUD & Reset
// -----------------------------------------------------------------------------
console.log('Suite 2: Discipline Command CRUD & Reset...');

const addedAtt = store.addDisciplineCommand('attention', {
  name: 'Глазки',
  description: 'Длительный зрительный контакт по жесту',
});
assert(
  useDogStore.getState().disciplineCommands.attention.length === 4,
  'Attention command count should be 4 after adding'
);
store.updateDisciplineCommand('attention', addedAtt.id, { name: 'Глазки (контакт)' });
assert(
  useDogStore.getState().disciplineCommands.attention.some((c) => c.name === 'Глазки (контакт)'),
  'Updated attention command name persisted'
);
store.deleteDisciplineCommand('attention', addedAtt.id);
assert(
  useDogStore.getState().disciplineCommands.attention.length === 3,
  'Attention command count restored to 3 after deletion'
);

store.addDisciplineCommand('trust', { name: 'Уши', description: 'Осмотр ушей' });
assert(useDogStore.getState().disciplineCommands.trust.length === 2, 'Trust has 2 commands after add');
store.resetDisciplineCommands('trust');
assert(
  useDogStore.getState().disciplineCommands.trust.map((c) => c.name).join('|') === 'Зубы',
  'resetDisciplineCommands("trust") restores Зубы'
);
store.resetDisciplineCommands('attention');
assert(
  useDogStore.getState().disciplineCommands.attention.map((c) => c.name).join('|') === 'Крючок|Восьмерка|Змейка',
  'resetDisciplineCommands("attention") restores Крючок, Восьмерка, Змейка'
);

console.log('✓ Suite 2 passed.\n');

// -----------------------------------------------------------------------------
// Suite 3: Legacy JSON Import Migration & Empty-Array Preservation
// -----------------------------------------------------------------------------
console.log('Suite 3: Legacy JSON Import Migration & Empty-Array Preservation...');

const exportedBase = JSON.parse(store.exportDatabaseToJson());
const legacyV13Payload = {
  ...exportedBase,
  disciplines: exportedBase.disciplines.filter(
    (d: { id: string }) => d.id !== 'attention' && d.id !== 'trust'
  ),
  disciplineCommands: {
    okd: [{ id: 'custom_okd', name: 'Моя команда ОКД', category: 'okd', description: 'Тест', isCustom: true }],
    zks: [],
    sport: exportedBase.disciplineCommands.sport,
    behavior: exportedBase.disciplineCommands.behavior,
  },
};

const legacyImportRes = store.importDatabaseFromJson(JSON.stringify(legacyV13Payload));
assert(legacyImportRes.success === true, 'Legacy v1.3 import succeeded');
const migratedState = useDogStore.getState();
assert(migratedState.disciplines.length === 6, `Migrated disciplines length must be 6, got ${migratedState.disciplines.length}`);
assert(
  migratedState.disciplineCommands.okd.length === 1 &&
    migratedState.disciplineCommands.okd[0].name === 'Моя команда ОКД',
  'Custom OKD commands preserved during legacy import'
);
assert(
  migratedState.disciplineCommands.zks.length === 0,
  'Intentionally empty ZKS command list preserved during legacy import'
);
assert(
  migratedState.disciplineCommands.attention.map((c) => c.name).join('|') === 'Крючок|Восьмерка|Змейка',
  'Missing attention commands populated with defaults during legacy import'
);
assert(
  migratedState.disciplineCommands.trust.map((c) => c.name).join('|') === 'Зубы',
  'Missing trust commands populated with defaults during legacy import'
);

const emptiedPayload = {
  ...exportedBase,
  disciplineCommands: {
    ...exportedBase.disciplineCommands,
    attention: [],
    trust: [],
  },
};
const emptiedRes = store.importDatabaseFromJson(JSON.stringify(emptiedPayload));
assert(emptiedRes.success === true, 'Emptied attention/trust import succeeded');
assert(
  useDogStore.getState().disciplineCommands.attention.length === 0,
  'Explicitly emptied attention array preserved'
);
assert(
  useDogStore.getState().disciplineCommands.trust.length === 0,
  'Explicitly emptied trust array preserved'
);

store.resetToDemoData();
console.log('✓ Suite 3 passed.\n');

// -----------------------------------------------------------------------------
// Suite 4: Calculations, Filtering, Sessions & Homework Generation
// -----------------------------------------------------------------------------
console.log('Suite 4: Calculations, Filtering, Sessions & Homework Generation...');

const emptyIdx = calculateOverallDogIndex([]);
assert(emptyIdx.attentionIndex === 0 && emptyIdx.trustIndex === 0, 'Empty skills give 0 attention/trust index');

const mixedSkills: DogSkill[] = [
  { id: 'att_hook', name: 'Крючок', category: 'attention', mastery: 80 },
  { id: 'att_figure_eight', name: 'Восьмерка', category: 'attention', mastery: 60 },
  { id: 'trust_teeth', name: 'Зубы', category: 'trust', mastery: 90 },
  { id: 'beh_leash_pulling', name: 'Тянет поводок на улице', category: 'behavior', mastery: 50 },
];
const mixedIdx = calculateOverallDogIndex(mixedSkills);
assert(mixedIdx.attentionIndex === 70, `attentionIndex must be 70, got ${mixedIdx.attentionIndex}`);
assert(mixedIdx.trustIndex === 90, `trustIndex must be 90, got ${mixedIdx.trustIndex}`);
assert(mixedIdx.overallIndex === 68, `overallIndex must be 68, got ${mixedIdx.overallIndex}`);

const sampleDog: Dog = {
  ...useDogStore.getState().dogs[0],
  id: 'dog_sample_att_trust',
  name: 'Марсель',
  skills: mixedSkills,
};
assert(filterDogByCategory(sampleDog, 'attention') === true, 'filterDogByCategory attention true');
assert(filterDogByCategory(sampleDog, 'trust') === true, 'filterDogByCategory trust true');
assert(filterDogByCategory(sampleDog, 'zks') === false, 'filterDogByCategory zks false');
assert(filterDogByCategory(sampleDog, 'sport') === false, 'filterDogByCategory sport false');

const newDogId = store.addDog({
  name: 'Марсель',
  gender: 'male',
  birthDate: '2025-03-01',
  breed: 'Бордер-колли',
  weight: 19,
  avatar: '',
  dailyTrainingTime: 30,
  motivationType: 'play',
  favoriteTreats: 'Сыр',
  allergies: 'Нет',
  triggers: 'Нет',
  ownerName: 'Мария',
  ownerPhone: '+79990001122',
  notes: '',
  skills: [],
});

const s1 = store.createSession({
  dogId: newDogId,
  date: '2026-11-01T10:00:00.000Z',
  durationMinutes: 30,
  distractionLevel: 'home',
  scores: [
    { skillId: 'att_hook', skillName: 'Крючок', category: 'attention', score: 3 },
    { skillId: 'att_figure_eight', skillName: 'Восьмерка', category: 'attention', score: 2 },
    { skillId: 'att_snake', skillName: 'Змейка', category: 'attention', score: 4 },
    { skillId: 'trust_teeth', skillName: 'Зубы', category: 'trust', score: 3 },
  ],
  trainerNotes: 'Отработка внимания и команды Зубы',
});

assert(s1.attentionIndexSnapshot === 63, `s1 attentionIndexSnapshot expected 63, got ${s1.attentionIndexSnapshot}`);
assert(s1.trustIndexSnapshot === 65, `s1 trustIndexSnapshot expected 65, got ${s1.trustIndexSnapshot}`);
assert(s1.homework.customSections?.atHome.includes('Восьмерка') === true, 'atHome section includes Восьмерка');
assert(s1.homework.customSections?.atHome.includes('Зубы') === true, 'atHome section includes Зубы');
assert(s1.homework.customSections?.onWalk.includes('Крючок') === true, 'onWalk section includes Крючок');

const hookEx = s1.homework.exercises.find((e) => e.skillId === 'att_hook');
assert(hookEx?.instruction === SKILL_METHOD_TIPS.att_hook, 'att_hook gets its own method tip');
const teethEx = s1.homework.exercises.find((e) => e.skillId === 'trust_teeth');
assert(teethEx?.instruction === SKILL_METHOD_TIPS.trust_teeth, 'trust_teeth gets its own method tip');

const s2 = store.createSession({
  dogId: newDogId,
  date: '2026-11-05T10:00:00.000Z',
  durationMinutes: 30,
  distractionLevel: 'quiet_yard',
  scores: [
    { skillId: 'trust_teeth', skillName: 'Зубы', category: 'trust', score: 5 },
  ],
});
assert((s2.trustIndexSnapshot ?? 0) > 65, 's2 trustIndexSnapshot increases on score 5');

const updatedS1 = store.updateSession(s1.id, {
  scores: [
    { skillId: 'att_hook', skillName: 'Крючок', category: 'attention', score: 5 },
    { skillId: 'att_figure_eight', skillName: 'Восьмерка', category: 'attention', score: 5 },
    { skillId: 'att_snake', skillName: 'Змейка', category: 'attention', score: 5 },
    { skillId: 'trust_teeth', skillName: 'Зубы', category: 'trust', score: 5 },
  ],
});
assert(updatedS1 !== null, 'Historical s1 updated');
assert(
  (updatedS1?.attentionIndexSnapshot ?? 0) > 63 && (updatedS1?.trustIndexSnapshot ?? 0) > 65,
  'Historical session attention/trust snapshots recalculated on update'
);

const updatedS2 = store.updateSession(s2.id, {
  scores: [{ skillId: 'trust_teeth', skillName: 'Зубы', category: 'trust', score: 1 }],
  distractionLevel: 'home',
});
assert(updatedS2 !== null, 'Latest s2 updated');
assert(
  (updatedS2?.trustIndexSnapshot ?? 100) < (s2.trustIndexSnapshot ?? 0),
  'Latest session trustIndexSnapshot recalculated downward on score 1'
);

const hwCheck = generateSmartHomework(sampleDog, [
  { skillId: 'att_snake', skillName: 'Змейка', category: 'attention', score: 2 },
  { skillId: 'trust_teeth', skillName: 'Зубы', category: 'trust', score: 3 },
]);
assert(
  hwCheck.exercises.some((e) => e.skillId === 'att_snake' && e.instruction === SKILL_METHOD_TIPS.att_snake),
  'att_snake uses its specific method tip'
);

const clipboardReport = formatReportForClipboard(sampleDog, s1);
assert(
  clipboardReport.includes('Крючок') &&
    clipboardReport.includes('Восьмерка') &&
    clipboardReport.includes('Змейка') &&
    clipboardReport.includes('Зубы'),
  'Clipboard report includes attention and trust commands'
);

// Verify persist onRehydrateStorage heals missing built-in disciplines even when commands exist
const partialState = {
  ...useDogStore.getState(),
  disciplines: DEFAULT_DISCIPLINES.filter((d) => d.id !== 'attention' && d.id !== 'trust'),
};
const rehydrateCb = useDogStore.persist.getOptions().onRehydrateStorage?.(partialState);
rehydrateCb?.(partialState, undefined);
assert(
  partialState.disciplines.some((d) => d.id === 'attention') &&
    partialState.disciplines.some((d) => d.id === 'trust'),
  'onRehydrateStorage restores missing attention/trust disciplines even if commands existed'
);

store.deleteDog(newDogId);
store.resetToDemoData();
console.log('✓ Suite 4 passed.\n');

console.log('====================================================');
console.log('🎉 ALL ATTENTION & TRUST VERIFICATION TESTS PASSED (4/4 SUITES)');
console.log('====================================================');

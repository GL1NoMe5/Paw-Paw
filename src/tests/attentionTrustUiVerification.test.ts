import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDogStore } from '../store/useDogStore';
import type { Dog, DogSkill } from '../types';
import { HomeDisciplinesView } from '../components/home/HomeDisciplinesView';
import { DisciplineEmblem } from '../components/cozy/DisciplineEmblems';
import { StudentsDirectoryView } from '../components/crm/StudentsDirectoryView';
import { IdealDogIndexCard } from '../components/analytics/IdealDogIndexCard';
import { MasterySummaryColumns } from '../components/analytics/MasterySummaryColumns';
import { RapidScoringGrid } from '../components/training/RapidScoringGrid';
import { TrainingSessionPanel } from '../components/training/TrainingSessionPanel';
import { DogDossier } from '../components/crm/DogDossier';
import { AnalyticsPanel } from '../components/analytics/AnalyticsPanel';
import { DiplomaStudio } from '../components/certificate/CertificateModal';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== Starting Attention & Trust UI SSR Verification Suite ===\n');

const store = useDogStore.getState();
store.resetToDemoData();

const mixedSkills: DogSkill[] = [
  { id: 'att_hook', name: 'Крючок', category: 'attention', mastery: 80 },
  { id: 'att_figure_eight', name: 'Восьмерка', category: 'attention', mastery: 60 },
  { id: 'att_snake', name: 'Змейка', category: 'attention', mastery: 75 },
  { id: 'trust_teeth', name: 'Зубы', category: 'trust', mastery: 92 },
  { id: 'beh_leash_pulling', name: 'Тянет поводок на улице', category: 'behavior', mastery: 50 },
];

const sampleDog: Dog = {
  ...useDogStore.getState().dogs[0],
  id: 'dog_sample_ui',
  name: 'Марсель',
  skills: mixedSkills,
};

// 1. HomeDisciplinesView
const homeHtml = renderToStaticMarkup(
  React.createElement(HomeDisciplinesView, {
    onOpenCommandBuilder: () => {},
    onOpenStudents: () => {},
    onAddDog: () => {},
  })
);
assert(homeHtml.includes('6 направлений'), 'Home view displays "6 направлений"');
assert(homeHtml.includes('34 команды в наборах'), 'Home view displays "34 команды в наборах"');
assert(homeHtml.includes('Команды для внимания'), 'Home view displays "Команды для внимания"');
assert(homeHtml.includes('Крючок'), 'Home view displays "Крючок"');
assert(homeHtml.includes('Восьмерка'), 'Home view displays "Восьмерка"');
assert(homeHtml.includes('Змейка'), 'Home view displays "Змейка"');
assert(homeHtml.includes('Команды для доверия'), 'Home view displays "Команды для доверия"');
assert(homeHtml.includes('Зубы'), 'Home view displays "Зубы"');

// 2. DisciplineEmblem light/dark checks
const attEmblemLight = renderToStaticMarkup(
  React.createElement(DisciplineEmblem, { category: 'attention', isDark: false })
);
const attEmblemDark = renderToStaticMarkup(
  React.createElement(DisciplineEmblem, { category: 'attention', isDark: true })
);
const trustEmblemLight = renderToStaticMarkup(
  React.createElement(DisciplineEmblem, { category: 'trust', isDark: false })
);
const trustEmblemDark = renderToStaticMarkup(
  React.createElement(DisciplineEmblem, { category: 'trust', isDark: true })
);
assert(attEmblemLight !== trustEmblemLight, 'Attention and Trust emblems are distinct SVGs');
assert(attEmblemLight !== attEmblemDark, 'Attention emblem adapts for dark mode');
assert(trustEmblemLight !== trustEmblemDark, 'Trust emblem adapts for dark mode');

// 3. StudentsDirectoryView
const studentsHtml = renderToStaticMarkup(
  React.createElement(StudentsDirectoryView, {
    onSelectDog: () => {},
    onStartTrainingForDog: () => {},
    onAddDog: () => {},
    onEditDog: () => {},
  })
);
assert(
  studentsHtml.includes('Внимание') && studentsHtml.includes('Доверие'),
  'StudentsDirectoryView renders Attention and Trust filter tabs'
);

// 4. RapidScoringGrid
const scoringHtml = renderToStaticMarkup(
  React.createElement(RapidScoringGrid, {
    skills: mixedSkills,
    scores: { att_hook: 4, trust_teeth: 5 },
    practicedSkills: new Set(['att_hook', 'trust_teeth']),
    onScoreChange: () => {},
    onTogglePracticed: () => {},
  })
);
assert(
  scoringHtml.includes('Внимание') && scoringHtml.includes('Доверие'),
  'RapidScoringGrid renders Attention and Trust filter tabs and badges'
);

// 5. TrainingSessionPanel
const trainingHtml = renderToStaticMarkup(
  React.createElement(TrainingSessionPanel, {
    dog: sampleDog,
    onClose: () => {},
  })
);
assert(
  trainingHtml.includes('Крючок') && trainingHtml.includes('Зубы'),
  'TrainingSessionPanel renders attention and trust skills'
);

// 6. DogDossier
const dossierHtml = renderToStaticMarkup(
  React.createElement(DogDossier, {
    dog: sampleDog,
    onEditDog: () => {},
    onAddSkill: () => {},
    onStartTraining: () => {},
  })
);
assert(
  dossierHtml.includes('Команды для внимания') && dossierHtml.includes('Команды для доверия'),
  'DogDossier groups skills under Команды для внимания and Команды для доверия'
);

// 7. AnalyticsPanel, IdealDogIndexCard, MasterySummaryColumns
const analyticsHtml = renderToStaticMarkup(
  React.createElement(AnalyticsPanel, {
    dog: sampleDog,
    onBack: () => {},
  })
);
assert(
  analyticsHtml.includes('Внимание: 72%') && analyticsHtml.includes('Доверие: 92%'),
  'AnalyticsPanel displays Attention and Trust percentages'
);
assert(
  analyticsHtml.indexOf('Внимание: 72%') < analyticsHtml.indexOf('Поведение: 50%') &&
    analyticsHtml.indexOf('Доверие: 92%') < analyticsHtml.indexOf('Поведение: 50%'),
  'AnalyticsPanel orders Attention and Trust before Behavior canonically'
);

const indexCardHtml = renderToStaticMarkup(
  React.createElement(IdealDogIndexCard, { dog: sampleDog })
);
assert(
  indexCardHtml.includes('Внимание (3)') && indexCardHtml.includes('Доверие (1)'),
  'IdealDogIndexCard displays Attention (3) and Trust (1)'
);

const summaryColsHtml = renderToStaticMarkup(
  React.createElement(MasterySummaryColumns, { dog: sampleDog })
);
assert(
  summaryColsHtml.includes('Внимание') && summaryColsHtml.includes('Доверие'),
  'MasterySummaryColumns displays Attention and Trust labels'
);

// 8. DiplomaStudio for attention/trust dog vs OKD dog
const attTrustDiplomaHtml = renderToStaticMarkup(
  React.createElement(DiplomaStudio, { dog: sampleDog, idPrefix: 'ssr-att' })
);
assert(
  attTrustDiplomaHtml.includes('Курс «Контакт, внимание и доверие»') &&
    attTrustDiplomaHtml.includes('Результат аттестации') &&
    attTrustDiplomaHtml.includes('Показывать результат аттестации'),
  'DiplomaStudio uses attention/trust course and non-OKD attestation labels'
);

const okdDog = useDogStore.getState().dogs[0];
const okdDiplomaHtml = renderToStaticMarkup(
  React.createElement(DiplomaStudio, { dog: okdDog, idPrefix: 'ssr-okd' })
);
assert(
  okdDiplomaHtml.includes('Показывать процент сдачи ОКД'),
  'DiplomaStudio preserves OKD label for OKD dogs'
);

console.log('✓ All 8 UI SSR verification checks passed.\n');

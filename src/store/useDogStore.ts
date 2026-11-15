import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppExportData,
  CertificateConfig,
  CustomHomeworkSections,
  DiplomaPaletteId,
  DiplomaTemplateId,
  DisciplineCommandTemplate,
  DisciplineInfo,
  DistractionLevel,
  Dog,
  DogFilter,
  DogSkill,
  SkillCategory,
  SkillScoreRecord,
  ThemeMode,
  TrainerProfile,
  TrainingSession,
} from '../types';
import {
  BEHAVIOR_PRESETS,
  DEFAULT_DISCIPLINES,
  OKD_PRESETS,
  SPORT_PRESETS,
  ZKS_PRESETS,
} from '../types';
import {
  calculateNewMastery,
  calculateOverallDogIndex,
  DISTRACTION_LABELS,
  SCORE_BASE_PERCENT,
} from '../utils/calculations';
import {
  generateSmartHomework,
  generateNextSessionPlan,
} from '../utils/homeworkGenerator';
import { DEMO_DOGS, DEMO_SESSIONS, DEFAULT_TRAINER_PROFILE } from './demoData';

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  templateId: 'archival',
  paletteId: 'sand_gold',
  includeOkdPercent: true,
  includeTrainerName: false,
};

const VALID_THEME_MODES = new Set<ThemeMode>(['light', 'dark']);
const VALID_DIPLOMA_TEMPLATES = new Set<DiplomaTemplateId>([
  'archival',
  'minimal',
  'editorial',
  'warm_card',
]);
const VALID_DIPLOMA_PALETTES = new Set<DiplomaPaletteId>([
  'sand_gold',
  'forest_sage',
  'graphite_ink',
  'terracotta_rose',
  'indigo_slate',
]);

function normalizeTheme(incoming?: unknown, fallback: ThemeMode = 'light'): ThemeMode {
  return typeof incoming === 'string' && VALID_THEME_MODES.has(incoming as ThemeMode)
    ? (incoming as ThemeMode)
    : fallback;
}

function normalizeCozyAnimations(incoming?: unknown, fallback: boolean = true): boolean {
  return typeof incoming === 'boolean' ? incoming : fallback;
}

function normalizeCertificateConfig(
  incoming?: Partial<CertificateConfig> | null,
  fallback: CertificateConfig = DEFAULT_CERTIFICATE_CONFIG
): CertificateConfig {
  if (!incoming || typeof incoming !== 'object') {
    return { ...fallback };
  }
  return {
    templateId:
      typeof incoming.templateId === 'string' &&
      VALID_DIPLOMA_TEMPLATES.has(incoming.templateId as DiplomaTemplateId)
        ? (incoming.templateId as DiplomaTemplateId)
        : fallback.templateId,
    paletteId:
      typeof incoming.paletteId === 'string' &&
      VALID_DIPLOMA_PALETTES.has(incoming.paletteId as DiplomaPaletteId)
        ? (incoming.paletteId as DiplomaPaletteId)
        : fallback.paletteId,
    includeOkdPercent:
      typeof incoming.includeOkdPercent === 'boolean'
        ? incoming.includeOkdPercent
        : fallback.includeOkdPercent,
    includeTrainerName:
      typeof incoming.includeTrainerName === 'boolean'
        ? incoming.includeTrainerName
        : fallback.includeTrainerName,
  };
}

function normalizeDog(dog: Dog): Dog {
  const priorKnownCommands = Array.isArray(dog.priorKnownCommands)
    ? dog.priorKnownCommands.map((cmd) => String(cmd).trim()).filter(Boolean)
    : undefined;

  const customHomework =
    dog.customHomework && typeof dog.customHomework === 'object'
      ? {
          atHome: typeof dog.customHomework.atHome === 'string' ? dog.customHomework.atHome : '',
          beforeWalk:
            typeof dog.customHomework.beforeWalk === 'string'
              ? dog.customHomework.beforeWalk
              : '',
          onWalk: typeof dog.customHomework.onWalk === 'string' ? dog.customHomework.onWalk : '',
        }
      : undefined;

  return {
    ...dog,
    skills: Array.isArray(dog.skills) ? dog.skills.map((s) => ({ ...s })) : [],
    ...(priorKnownCommands !== undefined ? { priorKnownCommands } : {}),
    ...(customHomework !== undefined ? { customHomework } : {}),
  };
}

function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function createDefaultDisciplineCommands(): Record<string, DisciplineCommandTemplate[]> {
  return {
    okd: [...OKD_PRESETS],
    zks: [...ZKS_PRESETS],
    sport: [...SPORT_PRESETS],
    behavior: [...BEHAVIOR_PRESETS],
  };
}

function mergeDisciplines(incoming?: DisciplineInfo[]): DisciplineInfo[] {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return [...DEFAULT_DISCIPLINES];
  }
  const existingIds = new Set(incoming.map((d) => d.id));
  const missing = DEFAULT_DISCIPLINES.filter((d) => !existingIds.has(d.id));
  return [...incoming, ...missing];
}

function mergeDisciplineCommands(
  incoming?: Record<string, DisciplineCommandTemplate[]>
): Record<string, DisciplineCommandTemplate[]> {
  const defaults = createDefaultDisciplineCommands();
  if (!incoming || typeof incoming !== 'object') {
    return defaults;
  }
  const merged: Record<string, DisciplineCommandTemplate[]> = { ...defaults };
  for (const [key, list] of Object.entries(incoming)) {
    if (Array.isArray(list)) {
      merged[key] = list;
    }
  }
  return merged;
}

function computeTargetPercent(score: number, distraction: DistractionLevel): number {
  const base = SCORE_BASE_PERCENT[score] ?? 60;
  const mult = DISTRACTION_LABELS[distraction]?.multiplier ?? 1.0;
  return Math.min(100, Math.round(base * mult));
}

function computeCategoryAverageTarget(
  scores: SkillScoreRecord[],
  category: SkillCategory,
  distraction: DistractionLevel
): number | null {
  const filtered = scores.filter((s) => s.category === category);
  if (filtered.length === 0) return null;
  const total = filtered.reduce(
    (sum, s) => sum + computeTargetPercent(s.score, distraction),
    0
  );
  return Math.round(total / filtered.length);
}

export type SessionUpdateInput = Partial<
  Pick<
    TrainingSession,
    | 'date'
    | 'durationMinutes'
    | 'distractionLevel'
    | 'scores'
    | 'trainerNotes'
    | 'timerData'
    | 'timeEntryMode'
    | 'title'
  >
>;

export interface DogStoreState {
  dogs: Dog[];
  sessions: TrainingSession[];
  activeDogId: string | null;
  filter: DogFilter;
  searchQuery: string;
  trainerProfile: TrainerProfile;
  disciplines: DisciplineInfo[];
  disciplineCommands: Record<string, DisciplineCommandTemplate[]>;
  theme: ThemeMode;
  cozyAnimations: boolean;
  certificateConfig: CertificateConfig;

  // Actions: Theme, Ambience & Certificate Preferences
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCozyAnimations: (enabled: boolean) => void;
  toggleCozyAnimations: () => void;
  updateCertificateConfig: (updates: Partial<CertificateConfig>) => void;

  // Actions: Navigation & Filter
  setActiveDog: (id: string | null) => void;
  setFilter: (filter: DogFilter) => void;
  setSearchQuery: (query: string) => void;

  // Actions: Dogs
  addDog: (
    dogData: Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'skills'> & { skills?: DogSkill[] }
  ) => string;
  updateDog: (id: string, updates: Partial<Dog>) => void;
  updateDogHomework: (dogId: string, customHomework: CustomHomeworkSections) => void;
  deleteDog: (id: string) => void;
  issueCertificate: (dogId: string) => void;

  // Actions: Skills
  addSkillToDog: (dogId: string, skill: Omit<DogSkill, 'id'>) => void;
  updateSkill: (dogId: string, skillId: string, updates: Partial<DogSkill>) => void;
  deleteSkill: (dogId: string, skillId: string) => void;

  // Actions: Discipline Command Dictionaries
  addDisciplineCommand: (
    category: SkillCategory,
    cmd: { name: string; description: string }
  ) => DisciplineCommandTemplate;
  updateDisciplineCommand: (
    category: SkillCategory,
    commandId: string,
    updates: { name?: string; description?: string }
  ) => void;
  deleteDisciplineCommand: (category: SkillCategory, commandId: string) => void;
  resetDisciplineCommands: (category: SkillCategory) => void;

  // Actions: Sessions
  createSession: (params: {
    dogId: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    scores: SkillScoreRecord[];
    timerStaySeconds?: number;
    trainerNotes?: string;
    date?: string;
    timeEntryMode?: 'stopwatch' | 'manual';
    title?: string;
  }) => TrainingSession;
  updateSession: (sessionId: string, updates: SessionUpdateInput) => TrainingSession | null;
  deleteSession: (sessionId: string) => void;

  // Actions: Trainer
  updateTrainerProfile: (profile: Partial<TrainerProfile>) => void;

  // Import / Export
  exportDatabaseToJson: () => string;
  importDatabaseFromJson: (
    jsonString: string
  ) => { success: boolean; message: string; count?: number };
  resetToDemoData: () => void;
}

export const useDogStore = create<DogStoreState>()(
  persist(
    (set, get) => ({
      dogs: DEMO_DOGS.map(normalizeDog),
      sessions: DEMO_SESSIONS,
      activeDogId: 'dog_rex',
      filter: 'all',
      searchQuery: '',
      trainerProfile: DEFAULT_TRAINER_PROFILE,
      disciplines: [...DEFAULT_DISCIPLINES],
      disciplineCommands: createDefaultDisciplineCommands(),
      theme: 'light',
      cozyAnimations: true,
      certificateConfig: { ...DEFAULT_CERTIFICATE_CONFIG },

      setTheme: (theme) => {
        const nextTheme = normalizeTheme(theme);
        applyThemeToDocument(nextTheme);
        set({ theme: nextTheme });
      },

      toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(nextTheme);
        set({ theme: nextTheme });
      },

      setCozyAnimations: (enabled) => {
        set({ cozyAnimations: normalizeCozyAnimations(enabled, true) });
      },

      toggleCozyAnimations: () => {
        set((state) => ({ cozyAnimations: !state.cozyAnimations }));
      },

      updateCertificateConfig: (updates) => {
        set((state) => ({
          certificateConfig: normalizeCertificateConfig(
            { ...state.certificateConfig, ...updates },
            state.certificateConfig
          ),
        }));
      },

      setActiveDog: (id) => set({ activeDogId: id }),
      setFilter: (filter) => set({ filter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      addDog: (dogData) => {
        let newId = `dog_${Date.now()}`;
        if (get().dogs.some((d) => d.id === newId)) {
          newId = `dog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        }
        const now = new Date().toISOString();
        const normalizedPrior = Array.isArray(dogData.priorKnownCommands)
          ? dogData.priorKnownCommands.map((cmd) => String(cmd).trim()).filter(Boolean)
          : undefined;
        const normalizedHomework = dogData.customHomework
          ? {
              atHome: dogData.customHomework.atHome ?? '',
              beforeWalk: dogData.customHomework.beforeWalk ?? '',
              onWalk: dogData.customHomework.onWalk ?? '',
            }
          : undefined;

        const newDog: Dog = {
          ...dogData,
          id: newId,
          createdAt: now,
          updatedAt: now,
          skills: dogData.skills || [],
          certificateIssued: false,
          ...(normalizedPrior !== undefined ? { priorKnownCommands: normalizedPrior } : {}),
          ...(normalizedHomework !== undefined ? { customHomework: normalizedHomework } : {}),
        };
        set((state) => ({ dogs: [newDog, ...state.dogs], activeDogId: newId }));
        return newId;
      },

      updateDog: (id, updates) => {
        const now = new Date().toISOString();
        const normalizedUpdates: Partial<Dog> = {
          ...updates,
          ...(Array.isArray(updates.priorKnownCommands)
            ? {
                priorKnownCommands: updates.priorKnownCommands
                  .map((cmd) => String(cmd).trim())
                  .filter(Boolean),
              }
            : {}),
        };
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === id ? { ...d, ...normalizedUpdates, updatedAt: now } : d
          ),
        }));
      },

      updateDogHomework: (dogId, customHomework) => {
        const now = new Date().toISOString();
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId
              ? {
                  ...d,
                  customHomework: {
                    atHome: customHomework.atHome ?? '',
                    beforeWalk: customHomework.beforeWalk ?? '',
                    onWalk: customHomework.onWalk ?? '',
                  },
                  updatedAt: now,
                }
              : d
          ),
        }));
      },

      deleteDog: (id) => {
        set((state) => {
          const remainingDogs = state.dogs.filter((d) => d.id !== id);
          return {
            dogs: remainingDogs,
            sessions: state.sessions.filter((s) => s.dogId !== id),
            activeDogId: state.activeDogId === id ? (remainingDogs[0]?.id ?? null) : state.activeDogId,
          };
        });
      },

      issueCertificate: (dogId) => {
        const now = new Date().toISOString();
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId ? { ...d, certificateIssued: true, certificateIssuedAt: now } : d
          ),
        }));
      },

      addSkillToDog: (dogId, skill) => {
        const skillId = `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const fullSkill: DogSkill = { ...skill, id: skillId };
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId ? { ...d, skills: [...d.skills, fullSkill] } : d
          ),
        }));
      },

      updateSkill: (dogId, skillId, updates) => {
        set((state) => ({
          dogs: state.dogs.map((d) => {
            if (d.id !== dogId) return d;
            return {
              ...d,
              skills: d.skills.map((s) => (s.id === skillId ? { ...s, ...updates } : s)),
            };
          }),
        }));
      },

      deleteSkill: (dogId, skillId) => {
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId ? { ...d, skills: d.skills.filter((s) => s.id !== skillId) } : d
          ),
        }));
      },

      addDisciplineCommand: (category, cmd) => {
        const key = String(category);
        const newCmd: DisciplineCommandTemplate = {
          id: `cmd_${key}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: cmd.name.trim(),
          category,
          description: cmd.description.trim(),
          isCustom: true,
        };
        set((state) => {
          const existing = state.disciplineCommands[key] ?? [];
          return {
            disciplineCommands: {
              ...state.disciplineCommands,
              [key]: [...existing, newCmd],
            },
          };
        });
        return newCmd;
      },

      updateDisciplineCommand: (category, commandId, updates) => {
        const key = String(category);
        set((state) => {
          const existing = state.disciplineCommands[key] ?? [];
          return {
            disciplineCommands: {
              ...state.disciplineCommands,
              [key]: existing.map((cmd) =>
                cmd.id === commandId
                  ? {
                      ...cmd,
                      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
                      ...(updates.description !== undefined
                        ? { description: updates.description.trim() }
                        : {}),
                    }
                  : cmd
              ),
            },
          };
        });
      },

      deleteDisciplineCommand: (category, commandId) => {
        const key = String(category);
        set((state) => {
          const existing = state.disciplineCommands[key] ?? [];
          return {
            disciplineCommands: {
              ...state.disciplineCommands,
              [key]: existing.filter((cmd) => cmd.id !== commandId),
            },
          };
        });
      },

      resetDisciplineCommands: (category) => {
        const key = String(category);
        const defaults = createDefaultDisciplineCommands();
        set((state) => ({
          disciplineCommands: {
            ...state.disciplineCommands,
            [key]: defaults[key] ? [...defaults[key]] : [],
          },
        }));
      },

      createSession: ({
        dogId,
        durationMinutes,
        distractionLevel,
        scores,
        timerStaySeconds,
        trainerNotes,
        date,
        timeEntryMode,
        title,
      }) => {
        const state = get();
        const dog = state.dogs.find((d) => d.id === dogId);
        if (!dog) throw new Error('Dog not found');

        const now = new Date().toISOString();
        const sessionDate = date?.trim() ? date.trim() : now;

        const allTemplates = Object.values(state.disciplineCommands).flat();

        // 1. Recalculate existing skill masteries
        const existingSkillIds = new Set(dog.skills.map((s) => s.id));
        const mappedSkills = dog.skills.map((skill) => {
          const scoreRecord = scores.find((s) => s.skillId === skill.id);
          if (!scoreRecord) return skill;
          const newMastery = calculateNewMastery(skill.mastery, scoreRecord.score, distractionLevel);
          return {
            ...skill,
            mastery: newMastery,
            lastScore: scoreRecord.score,
            lastUpdated: sessionDate,
          };
        });

        // 1b. Append newly picked commands from scores not yet tracked in dog.skills
        const addedSkillIds = new Set<string>();
        const newSkills: DogSkill[] = [];
        for (const scoreRecord of scores) {
          if (existingSkillIds.has(scoreRecord.skillId) || addedSkillIds.has(scoreRecord.skillId)) {
            continue;
          }
          addedSkillIds.add(scoreRecord.skillId);
          const template =
            state.disciplineCommands[String(scoreRecord.category)]?.find(
              (c) => c.id === scoreRecord.skillId
            ) ?? allTemplates.find((c) => c.id === scoreRecord.skillId);

          newSkills.push({
            id: scoreRecord.skillId,
            name: scoreRecord.skillName,
            category: scoreRecord.category,
            mastery: calculateNewMastery(0, scoreRecord.score, distractionLevel),
            lastScore: scoreRecord.score,
            lastUpdated: sessionDate,
            description: template?.description,
            isCustom: template?.isCustom ?? false,
          });
        }

        const updatedSkills = [...mappedSkills, ...newSkills];

        // 2. Compute snapshots
        const { overallIndex, okdIndex, behaviorIndex, zksIndex, sportIndex } =
          calculateOverallDogIndex(updatedSkills);

        // 3. Generate Smart Homework & Next Session Plan
        const dogWithUpdatedSkills: Dog = { ...dog, skills: updatedSkills };
        const homework = generateSmartHomework(dogWithUpdatedSkills, scores);
        const nextSessionPlan = generateNextSessionPlan(
          dogWithUpdatedSkills,
          scores,
          distractionLevel
        );

        const newSession: TrainingSession = {
          id: `session_${Date.now()}`,
          dogId,
          date: sessionDate,
          durationMinutes,
          timeEntryMode,
          title: title?.trim() ? title.trim() : undefined,
          distractionLevel,
          timerData: timerStaySeconds ? { stayDurationSeconds: timerStaySeconds } : undefined,
          scores,
          overallIndexSnapshot: overallIndex,
          okdIndexSnapshot: okdIndex,
          behaviorIndexSnapshot: behaviorIndex,
          zksIndexSnapshot: zksIndex,
          sportIndexSnapshot: sportIndex,
          homework,
          nextSessionPlan,
          trainerNotes: trainerNotes || '',
        };

        // 4. Update dog in store
        const certificateNowEligible = overallIndex >= 96;
        set((prevState) => ({
          dogs: prevState.dogs.map((d) =>
            d.id === dogId
              ? {
                  ...d,
                  skills: updatedSkills,
                  updatedAt: now,
                  certificateIssued: d.certificateIssued || certificateNowEligible,
                }
              : d
          ),
          sessions: [newSession, ...prevState.sessions],
        }));

        return newSession;
      },

      updateSession: (sessionId, updates) => {
        const state = get();
        const existing = state.sessions.find((s) => s.id === sessionId);
        if (!existing) return null;

        const dog = state.dogs.find((d) => d.id === existing.dogId);
        const nextSession: TrainingSession = {
          ...existing,
          ...updates,
          title:
            updates.title !== undefined
              ? updates.title.trim() || undefined
              : existing.title,
        };

        let updatedDog: Dog | null = null;
        const scoresOrDistractionChanged =
          updates.scores !== undefined || updates.distractionLevel !== undefined;

        if (dog && scoresOrDistractionChanged) {
          nextSession.homework = generateSmartHomework(dog, nextSession.scores);
          nextSession.nextSessionPlan = generateNextSessionPlan(
            dog,
            nextSession.scores,
            nextSession.distractionLevel
          );

          const dogSessions = state.sessions.filter((s) => s.dogId === dog.id);
          const latestSession = dogSessions.reduce<TrainingSession | null>((best, curr) => {
            if (!best) return curr;
            return new Date(curr.date).getTime() > new Date(best.date).getTime() ? curr : best;
          }, null);
          const isMostRecent = latestSession?.id === existing.id;

          if (isMostRecent) {
            const allTemplates = Object.values(state.disciplineCommands).flat();
            const existingSkillIds = new Set(dog.skills.map((s) => s.id));

            const mappedSkills = dog.skills.map((skill) => {
              const newRec = nextSession.scores.find((s) => s.skillId === skill.id);
              if (!newRec) return skill;

              const oldRec = existing.scores.find((s) => s.skillId === skill.id);
              const newTarget = computeTargetPercent(newRec.score, nextSession.distractionLevel);

              let adjustedMastery: number;
              if (oldRec) {
                const oldTarget = computeTargetPercent(oldRec.score, existing.distractionLevel);
                const hadPriorHistory = state.sessions.some(
                  (s) =>
                    s.dogId === dog.id &&
                    s.id !== existing.id &&
                    s.scores.some((r) => r.skillId === skill.id)
                );
                if (!hadPriorHistory && skill.mastery === oldTarget) {
                  adjustedMastery = newTarget;
                } else {
                  adjustedMastery = Math.max(
                    0,
                    Math.min(100, Math.round(skill.mastery + (newTarget - oldTarget) * 0.4))
                  );
                }
              } else {
                adjustedMastery = calculateNewMastery(
                  skill.mastery,
                  newRec.score,
                  nextSession.distractionLevel
                );
              }

              return {
                ...skill,
                mastery: adjustedMastery,
                lastScore: newRec.score,
                lastUpdated: nextSession.date,
              };
            });

            const addedIds = new Set<string>();
            const extraSkills: DogSkill[] = [];
            for (const rec of nextSession.scores) {
              if (existingSkillIds.has(rec.skillId) || addedIds.has(rec.skillId)) continue;
              addedIds.add(rec.skillId);
              const template =
                state.disciplineCommands[String(rec.category)]?.find(
                  (c) => c.id === rec.skillId
                ) ?? allTemplates.find((c) => c.id === rec.skillId);
              extraSkills.push({
                id: rec.skillId,
                name: rec.skillName,
                category: rec.category,
                mastery: calculateNewMastery(0, rec.score, nextSession.distractionLevel),
                lastScore: rec.score,
                lastUpdated: nextSession.date,
                description: template?.description,
                isCustom: template?.isCustom ?? false,
              });
            }

            const updatedSkills = [...mappedSkills, ...extraSkills];
            const { overallIndex, okdIndex, behaviorIndex, zksIndex, sportIndex } =
              calculateOverallDogIndex(updatedSkills);

            nextSession.overallIndexSnapshot = overallIndex;
            nextSession.okdIndexSnapshot = okdIndex;
            nextSession.behaviorIndexSnapshot = behaviorIndex;
            nextSession.zksIndexSnapshot = zksIndex;
            nextSession.sportIndexSnapshot = sportIndex;

            updatedDog = {
              ...dog,
              skills: updatedSkills,
              updatedAt: new Date().toISOString(),
              certificateIssued: dog.certificateIssued || overallIndex >= 96,
            };
          } else {
            const updateCategorySnapshot = (
              prevSnap: number,
              category: SkillCategory
            ): number => {
              const oldAvg = computeCategoryAverageTarget(
                existing.scores,
                category,
                existing.distractionLevel
              );
              const newAvg = computeCategoryAverageTarget(
                nextSession.scores,
                category,
                nextSession.distractionLevel
              );
              if (newAvg !== null && oldAvg !== null) {
                return Math.max(0, Math.min(100, Math.round(prevSnap + (newAvg - oldAvg) * 0.4)));
              }
              if (newAvg !== null) return newAvg;
              return prevSnap;
            };

            const nextOkd = updateCategorySnapshot(existing.okdIndexSnapshot, 'okd');
            const nextBeh = updateCategorySnapshot(existing.behaviorIndexSnapshot, 'behavior');
            const nextZks = updateCategorySnapshot(existing.zksIndexSnapshot ?? 0, 'zks');
            const nextSport = updateCategorySnapshot(existing.sportIndexSnapshot ?? 0, 'sport');

            const activeTraining: number[] = [];
            if (nextOkd > 0 || nextSession.scores.some((s) => s.category === 'okd')) {
              activeTraining.push(nextOkd);
            }
            if (nextZks > 0 || nextSession.scores.some((s) => s.category === 'zks')) {
              activeTraining.push(nextZks);
            }
            if (nextSport > 0 || nextSession.scores.some((s) => s.category === 'sport')) {
              activeTraining.push(nextSport);
            }

            const hasBeh = nextBeh > 0 || nextSession.scores.some((s) => s.category === 'behavior');
            let nextOverall = existing.overallIndexSnapshot;
            if (activeTraining.length > 0 && hasBeh) {
              const trainAvg = activeTraining.reduce((a, b) => a + b, 0) / activeTraining.length;
              nextOverall = Math.round(trainAvg * 0.6 + nextBeh * 0.4);
            } else if (activeTraining.length > 0) {
              const trainAvg = activeTraining.reduce((a, b) => a + b, 0) / activeTraining.length;
              nextOverall = Math.round(trainAvg);
            } else if (hasBeh) {
              nextOverall = nextBeh;
            }

            nextSession.okdIndexSnapshot = nextOkd;
            nextSession.behaviorIndexSnapshot = nextBeh;
            nextSession.zksIndexSnapshot = nextZks;
            nextSession.sportIndexSnapshot = nextSport;
            nextSession.overallIndexSnapshot = nextOverall;
          }
        }

        set((prevState) => ({
          sessions: prevState.sessions.map((s) => (s.id === sessionId ? nextSession : s)),
          dogs: updatedDog
            ? prevState.dogs.map((d) => (d.id === updatedDog.id ? updatedDog : d))
            : prevState.dogs,
        }));

        return nextSession;
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },

      updateTrainerProfile: (profileUpdates) => {
        set((state) => ({
          trainerProfile: { ...state.trainerProfile, ...profileUpdates },
        }));
      },

      exportDatabaseToJson: () => {
        const state = get();
        const data: AppExportData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          app: 'DogTeacher Workstation',
          trainerProfile: state.trainerProfile,
          dogs: state.dogs,
          sessions: state.sessions,
          disciplines: state.disciplines,
          disciplineCommands: state.disciplineCommands,
          certificateConfig: state.certificateConfig,
          theme: state.theme,
          cozyAnimations: state.cozyAnimations,
        };
        return JSON.stringify(data, null, 2);
      },

      importDatabaseFromJson: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString) as Partial<AppExportData>;
          if (!parsed.dogs || !Array.isArray(parsed.dogs)) {
            return { success: false, message: 'Неверный формат файла: отсутствует массив собак' };
          }
          const current = get();
          const nextDogs = parsed.dogs.map(normalizeDog);
          const nextCertificateConfig = parsed.certificateConfig
            ? normalizeCertificateConfig(parsed.certificateConfig, current.certificateConfig)
            : current.certificateConfig;
          const nextTheme = parsed.theme
            ? normalizeTheme(parsed.theme, current.theme)
            : current.theme;
          const nextCozyAnimations = normalizeCozyAnimations(
            parsed.cozyAnimations,
            current.cozyAnimations
          );
          applyThemeToDocument(nextTheme);
          set({
            dogs: nextDogs,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            trainerProfile: parsed.trainerProfile || current.trainerProfile,
            disciplines: mergeDisciplines(parsed.disciplines),
            disciplineCommands: mergeDisciplineCommands(parsed.disciplineCommands),
            certificateConfig: nextCertificateConfig,
            theme: nextTheme,
            cozyAnimations: nextCozyAnimations,
            activeDogId: nextDogs[0]?.id || null,
          });
          return {
            success: true,
            message: 'База успешно импортирована!',
            count: nextDogs.length,
          };
        } catch {
          return { success: false, message: 'Ошибка парсинга JSON файла' };
        }
      },

      resetToDemoData: () => {
        applyThemeToDocument('light');
        set({
          dogs: DEMO_DOGS.map(normalizeDog),
          sessions: DEMO_SESSIONS,
          activeDogId: 'dog_rex',
          filter: 'all',
          searchQuery: '',
          trainerProfile: DEFAULT_TRAINER_PROFILE,
          disciplines: [...DEFAULT_DISCIPLINES],
          disciplineCommands: createDefaultDisciplineCommands(),
          theme: 'light',
          cozyAnimations: true,
          certificateConfig: { ...DEFAULT_CERTIFICATE_CONFIG },
        });
      },
    }),
    {
      name: 'dog-teacher-storage-v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<DogStoreState>;
        return {
          ...currentState,
          ...persisted,
          dogs: Array.isArray(persisted.dogs)
            ? persisted.dogs.map(normalizeDog)
            : currentState.dogs,
          disciplines: mergeDisciplines(persisted.disciplines),
          disciplineCommands: mergeDisciplineCommands(persisted.disciplineCommands),
          theme: normalizeTheme(persisted.theme, currentState.theme),
          cozyAnimations: normalizeCozyAnimations(
            persisted.cozyAnimations,
            currentState.cozyAnimations
          ),
          certificateConfig: normalizeCertificateConfig(
            persisted.certificateConfig,
            currentState.certificateConfig
          ),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const normalizedTheme = normalizeTheme(state.theme);
        state.theme = normalizedTheme;
        state.cozyAnimations = normalizeCozyAnimations(state.cozyAnimations, true);
        state.certificateConfig = normalizeCertificateConfig(state.certificateConfig);
        applyThemeToDocument(normalizedTheme);
        if (!state.dogs || state.dogs.length === 0) {
          state.resetToDemoData();
          return;
        }
        const hasAllBuiltinCmds =
          Boolean(state.disciplineCommands?.okd) &&
          Boolean(state.disciplineCommands?.zks) &&
          Boolean(state.disciplineCommands?.sport) &&
          Boolean(state.disciplineCommands?.behavior);
        if (!state.disciplines || state.disciplines.length === 0 || !hasAllBuiltinCmds) {
          state.disciplines = mergeDisciplines(state.disciplines);
          state.disciplineCommands = mergeDisciplineCommands(state.disciplineCommands);
        }
      },
    }
  )
);

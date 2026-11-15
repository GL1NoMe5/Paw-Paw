import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppExportData,
  DisciplineCommandTemplate,
  DisciplineInfo,
  DistractionLevel,
  Dog,
  DogFilter,
  DogSkill,
  SkillCategory,
  SkillScoreRecord,
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

  // Actions: Navigation & Filter
  setActiveDog: (id: string | null) => void;
  setFilter: (filter: DogFilter) => void;
  setSearchQuery: (query: string) => void;

  // Actions: Dogs
  addDog: (
    dogData: Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'skills'> & { skills?: DogSkill[] }
  ) => string;
  updateDog: (id: string, updates: Partial<Dog>) => void;
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
      dogs: DEMO_DOGS,
      sessions: DEMO_SESSIONS,
      activeDogId: 'dog_rex',
      filter: 'all',
      searchQuery: '',
      trainerProfile: DEFAULT_TRAINER_PROFILE,
      disciplines: [...DEFAULT_DISCIPLINES],
      disciplineCommands: createDefaultDisciplineCommands(),

      setActiveDog: (id) => set({ activeDogId: id }),
      setFilter: (filter) => set({ filter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      addDog: (dogData) => {
        const newId = `dog_${Date.now()}`;
        const now = new Date().toISOString();
        const newDog: Dog = {
          ...dogData,
          id: newId,
          createdAt: now,
          updatedAt: now,
          skills: dogData.skills || [],
          certificateIssued: false,
        };
        set((state) => ({ dogs: [newDog, ...state.dogs], activeDogId: newId }));
        return newId;
      },

      updateDog: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          dogs: state.dogs.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: now } : d)),
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
        const homework = generateSmartHomework(dog, scores);
        const nextSessionPlan = generateNextSessionPlan(dog, scores, distractionLevel);

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
          set({
            dogs: parsed.dogs,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            trainerProfile: parsed.trainerProfile || current.trainerProfile,
            disciplines: mergeDisciplines(parsed.disciplines),
            disciplineCommands: mergeDisciplineCommands(parsed.disciplineCommands),
            activeDogId: parsed.dogs[0]?.id || null,
          });
          return {
            success: true,
            message: 'База успешно импортирована!',
            count: parsed.dogs.length,
          };
        } catch {
          return { success: false, message: 'Ошибка парсинга JSON файла' };
        }
      },

      resetToDemoData: () => {
        set({
          dogs: DEMO_DOGS,
          sessions: DEMO_SESSIONS,
          activeDogId: 'dog_rex',
          filter: 'all',
          searchQuery: '',
          trainerProfile: DEFAULT_TRAINER_PROFILE,
          disciplines: [...DEFAULT_DISCIPLINES],
          disciplineCommands: createDefaultDisciplineCommands(),
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
          disciplines: mergeDisciplines(persisted.disciplines),
          disciplineCommands: mergeDisciplineCommands(persisted.disciplineCommands),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
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

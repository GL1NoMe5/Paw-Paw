import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Dog,
  DogFilter,
  DogSkill,
  SkillScoreRecord,
  TrainerProfile,
  TrainingSession,
  DistractionLevel,
  AppExportData,
} from '../types';
import {
  calculateNewMastery,
  calculateOverallDogIndex,
} from '../utils/calculations';
import {
  generateSmartHomework,
  generateNextSessionPlan,
} from '../utils/homeworkGenerator';
import { DEMO_DOGS, DEMO_SESSIONS, DEFAULT_TRAINER_PROFILE } from './demoData';

export interface DogStoreState {
  dogs: Dog[];
  sessions: TrainingSession[];
  activeDogId: string | null;
  filter: DogFilter;
  searchQuery: string;
  trainerProfile: TrainerProfile;

  // Actions: Navigation & Filter
  setActiveDog: (id: string | null) => void;
  setFilter: (filter: DogFilter) => void;
  setSearchQuery: (query: string) => void;

  // Actions: Dogs
  addDog: (dogData: Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'skills'> & { skills?: DogSkill[] }) => string;
  updateDog: (id: string, updates: Partial<Dog>) => void;
  deleteDog: (id: string) => void;
  issueCertificate: (dogId: string) => void;

  // Actions: Skills
  addSkillToDog: (dogId: string, skill: Omit<DogSkill, 'id'>) => void;
  updateSkill: (dogId: string, skillId: string, updates: Partial<DogSkill>) => void;
  deleteSkill: (dogId: string, skillId: string) => void;

  // Actions: Sessions
  createSession: (params: {
    dogId: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    scores: SkillScoreRecord[];
    timerStaySeconds?: number;
    trainerNotes?: string;
  }) => TrainingSession;

  // Actions: Trainer
  updateTrainerProfile: (profile: Partial<TrainerProfile>) => void;

  // Import / Export
  exportDatabaseToJson: () => string;
  importDatabaseFromJson: (jsonString: string) => { success: boolean; message: string; count?: number };
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

      createSession: ({ dogId, durationMinutes, distractionLevel, scores, timerStaySeconds, trainerNotes }) => {
        const state = get();
        const dog = state.dogs.find((d) => d.id === dogId);
        if (!dog) throw new Error('Dog not found');

        const now = new Date().toISOString();

        // 1. Recalculate skill masteries
        const updatedSkills = dog.skills.map((skill) => {
          const scoreRecord = scores.find((s) => s.skillId === skill.id);
          if (!scoreRecord) return skill;
          const newMastery = calculateNewMastery(skill.mastery, scoreRecord.score, distractionLevel);
          return {
            ...skill,
            mastery: newMastery,
            lastScore: scoreRecord.score,
            lastUpdated: now,
          };
        });

        // 2. Compute snapshots
        const { overallIndex, okdIndex, behaviorIndex } = calculateOverallDogIndex(updatedSkills);

        // 3. Generate Smart Homework & Next Session Plan
        const homework = generateSmartHomework(dog, scores);
        const nextSessionPlan = generateNextSessionPlan(dog, scores, distractionLevel);

        const newSession: TrainingSession = {
          id: `session_${Date.now()}`,
          dogId,
          date: now,
          durationMinutes,
          distractionLevel,
          timerData: timerStaySeconds ? { stayDurationSeconds: timerStaySeconds } : undefined,
          scores,
          overallIndexSnapshot: overallIndex,
          okdIndexSnapshot: okdIndex,
          behaviorIndexSnapshot: behaviorIndex,
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
        };
        return JSON.stringify(data, null, 2);
      },

      importDatabaseFromJson: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString) as Partial<AppExportData>;
          if (!parsed.dogs || !Array.isArray(parsed.dogs)) {
            return { success: false, message: 'Неверный формат файла: отсутствует массив собак' };
          }
          set({
            dogs: parsed.dogs,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            trainerProfile: parsed.trainerProfile || get().trainerProfile,
            activeDogId: parsed.dogs[0]?.id || null,
          });
          return { success: true, message: 'База успешно импортирована!', count: parsed.dogs.length };
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
      onRehydrateStorage: () => (state) => {
        if (state && (!state.dogs || state.dogs.length === 0)) {
          state.resetToDemoData();
        }
      },
    }
  )
);

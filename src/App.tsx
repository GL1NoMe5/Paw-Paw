import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Plus, RotateCcw, FolderOpen } from 'lucide-react';
import { WorkstationLayout } from './components/layout/WorkstationLayout';
import type { AppSection } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { HomeDisciplinesView } from './components/home/HomeDisciplinesView';
import { DisciplineCommandBuilderModal } from './components/home/DisciplineCommandBuilderModal';
import { StudentsDirectoryView } from './components/crm/StudentsDirectoryView';
import { DogDossier } from './components/crm/DogDossier';
import { DogModal } from './components/crm/DogModal';
import { SkillManagerModal } from './components/crm/SkillManagerModal';
import { ImportExportModal } from './components/crm/ImportExportModal';
import { TrainingSessionPanel } from './components/training/TrainingSessionPanel';
import { AnalyticsPanel } from './components/analytics/AnalyticsPanel';
import { AchievementsView } from './components/certificate/AchievementsView';
import { CertificateModal } from './components/certificate/CertificateModal';
import { useDogStore } from './store/useDogStore';
import type { Dog, DogFilter, SkillCategory, TrainingSession } from './types';

type StudentSubView = 'directory' | 'dossier' | 'training' | 'analytics';

export function App() {
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const theme = useDogStore((s) => s.theme);
  const setActiveDog = useDogStore((s) => s.setActiveDog);
  const setFilter = useDogStore((s) => s.setFilter);
  const resetToDemoData = useDogStore((s) => s.resetToDemoData);

  const activeDog = dogs.find((d) => d.id === activeDogId) || dogs[0] || null;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Top-level navigation: 'home' | 'students' | 'achievements'
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [studentSubView, setStudentSubView] = useState<StudentSubView>('directory');
  const [achievementDogId, setAchievementDogId] = useState<string | null>(null);

  // Modal Dialog States
  const [isDogModalOpen, setIsDogModalOpen] = useState(false);
  const [dogToEdit, setDogToEdit] = useState<Dog | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isCommandBuilderOpen, setIsCommandBuilderOpen] = useState(false);
  const [commandBuilderCategory, setCommandBuilderCategory] = useState<SkillCategory>('okd');

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSectionChange = (section: AppSection) => {
    setActiveSection(section);
    if (section === 'students') {
      setStudentSubView('directory');
    }
  };

  const handleOpenAddDog = () => {
    setDogToEdit(null);
    setIsDogModalOpen(true);
  };

  const handleOpenEditDog = () => {
    if (activeDog) {
      setDogToEdit(activeDog);
      setIsDogModalOpen(true);
    }
  };

  const handleOpenAddSkill = () => {
    if (activeDog) {
      setIsSkillModalOpen(true);
    }
  };

  const handleOpenAchievementsForDog = (dogId: string | null) => {
    if (dogId) {
      setActiveDog(dogId);
      setAchievementDogId(dogId);
    }
    setActiveSection('achievements');
  };

  const handleOpenCommandBuilder = (category?: SkillCategory) => {
    setCommandBuilderCategory(category ?? 'okd');
    setIsCommandBuilderOpen(true);
  };

  const handleOpenStudentsWithFilter = (filter: DogFilter) => {
    setFilter(filter);
    setActiveSection('students');
    setStudentSubView('directory');
  };

  const handleSessionCompleted = (session: TrainingSession) => {
    if (session.overallIndexSnapshot >= 96 || session.okdIndexSnapshot >= 96) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Ignore confetti errors in headless environments
      }
      toast.success('Норматив выполнен на диплом с отличием', {
        description: `Индекс подготовки достиг ${session.overallIndexSnapshot}%. Доступно оформление архивного диплома А4`,
        action: {
          label: 'Диплом А4',
          onClick: () => handleOpenAchievementsForDog(session.dogId),
        },
      });
      if (session.overallIndexSnapshot >= 100 || session.okdIndexSnapshot >= 100) {
        setIsCertificateOpen(true);
      }
    }
  };

  const renderStudentsSection = () => {
    if (studentSubView === 'directory') {
      return (
        <StudentsDirectoryView
          onSelectDog={(dogId) => {
            setActiveDog(dogId);
            setStudentSubView('dossier');
          }}
          onStartTrainingForDog={(dogId) => {
            setActiveDog(dogId);
            setStudentSubView('training');
          }}
          onAddDog={handleOpenAddDog}
          onEditDog={(dog) => {
            setActiveDog(dog.id);
            setDogToEdit(dog);
            setIsDogModalOpen(true);
          }}
        />
      );
    }

    if (!activeDog) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sheet)] my-8 max-w-2xl mx-auto">
          <div className="size-12 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-4">
            <FolderOpen className="size-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
          </div>

          <h2 className="font-serif text-lg font-medium text-[var(--text-primary)] mb-1">
            Картотека учеников пуста
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed mb-6">
            Заведите первую карточку собаки с кинологическим паспортом или загрузите три демонстрационных профиля: Рекс (<span className="font-mono tabular-nums">96%</span>), Булочка (<span className="font-mono tabular-nums">64%</span>) и Юта (<span className="font-mono tabular-nums">100%</span>)
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddDog}
              className="h-9 px-4 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="size-4" strokeWidth={1.5} />
              <span>Завести карточку</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetToDemoData();
                setStudentSubView('directory');
                toast.success('Демонстрационные карточки загружены');
              }}
              className="h-9 px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="size-3.5 text-[var(--text-secondary)]" strokeWidth={1.5} />
              <span>Загрузить демо-данные</span>
            </button>
          </div>
        </div>
      );
    }

    if (studentSubView === 'training') {
      return (
        <TrainingSessionPanel
          dog={activeDog}
          onClose={() => setStudentSubView('dossier')}
          onSessionCompleted={handleSessionCompleted}
          className="px-7 sm:px-11 py-8"
        />
      );
    }

    if (studentSubView === 'analytics') {
      return (
        <AnalyticsPanel
          dog={activeDog}
          onBack={() => setStudentSubView('dossier')}
          onStartTraining={() => setStudentSubView('training')}
          className="px-7 sm:px-11 py-8"
        />
      );
    }

    return (
      <DogDossier
        dog={activeDog}
        onBackToStudents={() => setStudentSubView('directory')}
        onStartTraining={() => setStudentSubView('training')}
        onOpenAnalytics={() => setStudentSubView('analytics')}
        onOpenCertificate={() => handleOpenAchievementsForDog(activeDog.id)}
        onEditDog={handleOpenEditDog}
        onAddSkill={handleOpenAddSkill}
      />
    );
  };

  return (
    <>
      <WorkstationLayout
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onAddDogClick={handleOpenAddDog}
        onOpenDatabaseModal={() => setIsImportExportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      >
        <div className="w-full">
          {activeSection === 'home' && (
            <HomeDisciplinesView
              onOpenCommandBuilder={handleOpenCommandBuilder}
              onOpenStudents={handleOpenStudentsWithFilter}
              onAddDog={handleOpenAddDog}
            />
          )}

          {activeSection === 'students' && renderStudentsSection()}

          {activeSection === 'achievements' && (
            <AchievementsView
              initialDogId={achievementDogId ?? activeDog?.id ?? null}
              onOpenStudent={(dogId) => {
                setActiveDog(dogId);
                setActiveSection('students');
                setStudentSubView('dossier');
              }}
              className="px-6 sm:px-10 py-8"
            />
          )}
        </div>
      </WorkstationLayout>

      {/* Modals */}
      <DogModal
        open={isDogModalOpen}
        onOpenChange={setIsDogModalOpen}
        dogToEdit={dogToEdit}
      />

      {activeDog && (
        <SkillManagerModal
          open={isSkillModalOpen}
          onOpenChange={setIsSkillModalOpen}
          dogId={activeDog.id}
        />
      )}

      <DisciplineCommandBuilderModal
        open={isCommandBuilderOpen}
        onOpenChange={setIsCommandBuilderOpen}
        initialCategory={commandBuilderCategory}
      />

      <ImportExportModal
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
      />

      {activeDog && (
        <CertificateModal
          open={isCertificateOpen}
          onOpenChange={setIsCertificateOpen}
          dog={activeDog}
        />
      )}

      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onNavigateSection={handleSectionChange}
        onSelectDog={(dogId) => {
          setActiveDog(dogId);
          setActiveSection('students');
          setStudentSubView('dossier');
        }}
        onOpenDossier={() => {
          setActiveSection('students');
          setStudentSubView('dossier');
        }}
        onStartTraining={() => {
          if (activeDog) {
            setActiveSection('students');
            setStudentSubView('training');
          } else {
            handleOpenAddDog();
          }
        }}
        onOpenAnalytics={() => {
          if (activeDog) {
            setActiveSection('students');
            setStudentSubView('analytics');
          } else {
            setActiveSection('students');
            setStudentSubView('directory');
          }
        }}
        onOpenCertificate={() => handleOpenAchievementsForDog(activeDog?.id ?? null)}
        onAddDog={handleOpenAddDog}
        onOpenDatabase={() => setIsImportExportOpen(true)}
        onOpenCommandBuilder={handleOpenCommandBuilder}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-sheet)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Plus, RotateCcw, FolderOpen } from 'lucide-react';
import { WorkstationLayout } from './components/layout/WorkstationLayout';
import { CommandPalette } from './components/layout/CommandPalette';
import { DogDossier } from './components/crm/DogDossier';
import { DogModal } from './components/crm/DogModal';
import { SkillManagerModal } from './components/crm/SkillManagerModal';
import { ImportExportModal } from './components/crm/ImportExportModal';
import { TrainingSessionPanel } from './components/training/TrainingSessionPanel';
import { AnalyticsPanel } from './components/analytics/AnalyticsPanel';
import { CertificateModal } from './components/certificate/CertificateModal';
import { useDogStore } from './store/useDogStore';
import type { Dog, TrainingSession } from './types';

export function App() {
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const setActiveDog = useDogStore((s) => s.setActiveDog);
  const resetToDemoData = useDogStore((s) => s.resetToDemoData);

  // Active dog resolution
  const activeDog = dogs.find((d) => d.id === activeDogId) || dogs[0] || null;

  // View state: 'dossier' | 'training' | 'analytics'
  const [activeView, setActiveView] = useState<'dossier' | 'training' | 'analytics'>('dossier');

  // Modal Dialog States
  const [isDogModalOpen, setIsDogModalOpen] = useState(false);
  const [dogToEdit, setDogToEdit] = useState<Dog | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

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

  const handleOpenCertificate = () => {
    if (activeDog) {
      setIsCertificateOpen(true);
    } else {
      toast.error('Выберите карточку ученика для оформления диплома');
    }
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
          onClick: () => setIsCertificateOpen(true),
        },
      });
      if (session.overallIndexSnapshot >= 100 || session.okdIndexSnapshot >= 100) {
        setIsCertificateOpen(true);
      }
    }
  };

  return (
    <>
      <WorkstationLayout
        onAddDogClick={handleOpenAddDog}
        onOpenDatabaseModal={() => setIsImportExportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCertificate={handleOpenCertificate}
      >
        <div className="w-full">
          {activeDog ? (
            activeView === 'training' ? (
              <TrainingSessionPanel
                dog={activeDog}
                onClose={() => setActiveView('dossier')}
                onSessionCompleted={handleSessionCompleted}
                className="px-7 sm:px-11 py-8"
              />
            ) : activeView === 'analytics' ? (
              <AnalyticsPanel
                dog={activeDog}
                onBack={() => setActiveView('dossier')}
                onStartTraining={() => setActiveView('training')}
                className="px-7 sm:px-11 py-8"
              />
            ) : (
              <DogDossier
                dog={activeDog}
                onStartTraining={() => setActiveView('training')}
                onOpenAnalytics={() => setActiveView('analytics')}
                onOpenCertificate={handleOpenCertificate}
                onEditDog={handleOpenEditDog}
                onAddSkill={handleOpenAddSkill}
              />
            )
          ) : (
            /* Empty State when no dogs exist — Warm Paper & Graphite unslop aesthetic */
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] my-8 max-w-2xl mx-auto">
              <div className="size-12 rounded-lg bg-[#efe9df] border border-[#1f1b16]/10 flex items-center justify-center text-[#7b7266] mb-4">
                <FolderOpen className="size-5 text-[#5e554a]" strokeWidth={1.5} />
              </div>

              <h2 className="font-serif text-lg font-medium text-[#1f1b16] mb-1">
                Картотека учеников пуста
              </h2>
              <p className="text-xs text-[#5e554a] max-w-md leading-relaxed mb-6">
                Заведите первую карточку собаки с кинологическим паспортом или загрузите три демонстрационных профиля: Рекс (<span className="font-mono tabular-nums">96%</span>), Булочка (<span className="font-mono tabular-nums">64%</span>) и Юта (<span className="font-mono tabular-nums">100%</span>)
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddDog}
                  className="h-9 px-4 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="size-4" strokeWidth={1.5} />
                  <span>Завести карточку</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetToDemoData();
                    setActiveView('dossier');
                    toast.success('Демонстрационные карточки загружены');
                  }}
                  className="h-9 px-4 rounded-lg border border-[#1f1b16]/15 bg-[#efe9df] hover:bg-[#e5dec9] text-[#1f1b16] text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="size-3.5 text-[#5e554a]" strokeWidth={1.5} />
                  <span>Загрузить демо-данные</span>
                </button>
              </div>
            </div>
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
        onSelectDog={(dogId) => {
          setActiveDog(dogId);
          setActiveView('dossier');
        }}
        onOpenDossier={() => setActiveView('dossier')}
        onStartTraining={() => setActiveView('training')}
        onOpenAnalytics={() => setActiveView('analytics')}
        onOpenCertificate={handleOpenCertificate}
        onAddDog={handleOpenAddDog}
        onOpenDatabase={() => setIsImportExportOpen(true)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fdfbf7',
            color: '#1f1b16',
            border: '1px solid rgba(31, 27, 22, 0.12)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  );
}

export default App;

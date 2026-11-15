import type React from 'react';
import { Sidebar } from './Sidebar';
import type { DogFilter } from '../../types';

export interface WorkstationLayoutProps {
  children?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  activeFilter?: DogFilter;
  onFilterChange?: (filter: DogFilter) => void;
  onAddDogClick?: () => void;
  onOpenDatabaseModal?: () => void;
  dogsCount?: number;
  topbarMetrics?: {
    totalDogs: number;
    activeOkdCount: number;
    averageIdealIndex: number;
    issuedCertificatesCount: number;
  };
  onOpenCommandPalette?: () => void;
  onOpenCertificate?: () => void;
}

export const WorkstationLayout: React.FC<WorkstationLayoutProps> = ({
  children,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onAddDogClick,
  onOpenDatabaseModal,
  dogsCount,
  onOpenCommandPalette,
  onOpenCertificate,
}) => {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[#f2ece4] text-[#221c15] p-2.5 sm:p-3.5 gap-3">
      {/* Cozy Craft Sidebar sitting directly on the warm desk surface */}
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        onAddDogClick={onAddDogClick}
        onOpenDatabaseModal={onOpenDatabaseModal}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenCertificate={onOpenCertificate}
        dogsCount={dogsCount}
      />

      {/* Main Craft Document Sheet Viewport */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto craft-sheet">
        <div className="w-full max-w-[1320px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

import type React from 'react';
import { FileCheck2, Search } from 'lucide-react';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex, calculateCategoryProgress } from '../../utils/calculations';

export interface TopbarMetrics {
  totalDogs: number;
  activeOkdCount: number;
  averageIdealIndex: number;
  issuedCertificatesCount: number;
}

export interface TopbarProps {
  metrics?: TopbarMetrics;
  onOpenCommandPalette?: () => void;
  onOpenCertificate?: () => void;
  trainerCenterName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  metrics: propsMetrics,
  onOpenCommandPalette,
  onOpenCertificate,
  trainerCenterName: propsTrainerCenterName,
}) => {
  const dogs = useDogStore((s) => s.dogs);
  const trainerProfile = useDogStore((s) => s.trainerProfile);

  // Compute live metrics if not passed via props
  const totalDogs = propsMetrics?.totalDogs ?? dogs.length;
  const activeOkdCount =
    propsMetrics?.activeOkdCount ??
    dogs.filter((d) => {
      const okdSkills = d.skills.filter((s) => s.category === 'okd');
      const okdProgress = calculateCategoryProgress(d.skills, 'okd');
      return okdSkills.length > 0 && (!d.certificateIssued || okdProgress < 100);
    }).length;

  const averageIdealIndex =
    propsMetrics?.averageIdealIndex ??
    (dogs.length > 0
      ? Math.round(
          dogs.reduce((sum, d) => sum + calculateOverallDogIndex(d.skills).overallIndex, 0) /
            dogs.length
        )
      : 0);

  const issuedCertificatesCount =
    propsMetrics?.issuedCertificatesCount ??
    dogs.filter((d) => d.certificateIssued).length;

  const trainerCenterName =
    propsTrainerCenterName || trainerProfile.centerName || 'Кинологический центр «Альфа-Дог»';

  return (
    <header className="h-14 bg-[var(--bg-sheet)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between select-none z-10 flex-shrink-0">
      {/* Compact Typographic Stats (no pastel icon boxes, no uppercase tracked labels) */}
      <div className="flex items-center gap-6 divide-x divide-[var(--border-subtle)] overflow-x-auto py-1">
        {/* Stat 1: Total Dogs */}
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] leading-4 text-[var(--text-muted)]">
            Учеников в базе
          </span>
          <span className="text-[14px] font-medium text-[var(--text-primary)] font-mono tabular-nums">
            {totalDogs}
          </span>
        </div>

        {/* Stat 2: Active OKD */}
        <div className="flex items-baseline gap-2 pl-6">
          <span className="text-[12px] leading-4 text-[var(--text-muted)]">
            Активный курс ОКД
          </span>
          <span className="text-[14px] font-medium text-[var(--text-primary)] font-mono tabular-nums">
            {activeOkdCount}
          </span>
        </div>

        {/* Stat 3: Average Index (single accent) */}
        <div className="flex items-baseline gap-2 pl-6">
          <span className="text-[12px] leading-4 text-[var(--text-muted)]">
            Средний индекс
          </span>
          <span className="text-[14px] font-medium text-[var(--accent-forest)] font-mono tabular-nums">
            {averageIdealIndex}%
          </span>
        </div>

        {/* Stat 4: Issued Certificates */}
        <div className="flex items-baseline gap-2 pl-6">
          <span className="text-[12px] leading-4 text-[var(--text-muted)]">
            Выдано дипломов
          </span>
          <span className="text-[14px] font-medium text-[var(--text-primary)] font-mono tabular-nums">
            {issuedCertificatesCount}
          </span>
        </div>
      </div>

      {/* Right Actions & Quiet Trainer Tag */}
      <div className="flex items-center gap-3 pl-4 flex-shrink-0">
        <div className="hidden xl:flex items-center gap-2 text-[12px] leading-4 text-[var(--text-secondary)] pr-2 border-r border-[var(--border-subtle)]">
          <span className="text-[var(--text-primary)] font-medium">{trainerCenterName}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--text-muted)]">{trainerProfile.name}</span>
        </div>

        {onOpenCertificate && (
          <button
            type="button"
            onClick={onOpenCertificate}
            className="h-8 px-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <FileCheck2 strokeWidth={1.5} className="size-4 text-[var(--text-muted)]" />
            <span>Диплом А4</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="h-8 px-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Search strokeWidth={1.5} className="size-4 text-[var(--text-muted)]" />
          <span className="hidden sm:inline text-[var(--text-secondary)]">Поиск и команды</span>
          <kbd className="keycap">⌘K</kbd>
        </button>
      </div>
    </header>
  );
};

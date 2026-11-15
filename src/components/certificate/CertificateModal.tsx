import React, { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { X, Download, FileDown, Check } from 'lucide-react';
import type { Dog } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { calculateOverallDogIndex, formatDogAgeRussian } from '../../utils/calculations';

export interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog;
}

const COURSE_OPTIONS = [
  'Общий курс дрессировки (ОКД)',
  'Курс городской управляемости и коррекции поведения',
] as const;

export const CertificateModal: React.FC<CertificateModalProps> = ({
  open,
  onOpenChange,
  dog,
}) => {
  const trainerProfile = useDogStore((s) => s.trainerProfile);
  const updateTrainerProfile = useDogStore((s) => s.updateTrainerProfile);
  const updateDog = useDogStore((s) => s.updateDog);
  const issueCertificate = useDogStore((s) => s.issueCertificate);

  const [selectedCourse, setSelectedCourse] = useState<string>(COURSE_OPTIONS[0]);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [fallbackDate] = useState<Date>(() => new Date());

  const certificateRef = useRef<HTMLDivElement | null>(null);

  if (!dog) return null;

  const imgError = Boolean(dog.avatar && failedAvatar === dog.avatar);

  const { overallIndex, okdIndex } = calculateOverallDogIndex(dog.skills);
  const displayScore = dog.certificateIssued
    ? Math.max(100, overallIndex)
    : Math.max(overallIndex, okdIndex, 100);

  const officialGenderTitle =
    dog.gender === 'female' ? '«Самая хорошая девочка»' : '«Самый хороший мальчик»';

  const registryNumber = `№ РКФ-DT-2026-${dog.id.replace(/\D/g, '').slice(-3).padStart(3, '0') || '001'}`;

  const issueDateObj = dog.certificateIssuedAt ? parseISO(dog.certificateIssuedAt) : fallbackDate;
  const formattedIssueDate = Number.isNaN(issueDateObj.getTime())
    ? format(fallbackDate, 'd MMMM yyyy г.', { locale: ru })
    : format(issueDateObj, 'd MMMM yyyy г.', { locale: ru });

  const formattedBirthDate = (() => {
    try {
      const parsed = parseISO(dog.birthDate);
      if (Number.isNaN(parsed.getTime())) return dog.birthDate || '—';
      return format(parsed, 'dd.MM.yyyy');
    } catch {
      return dog.birthDate || '—';
    }
  })();

  const handleGraduateDemo = () => {
    const now = new Date().toISOString();
    const maxedSkills = dog.skills.map((skill) => ({
      ...skill,
      mastery: 100,
      lastScore: 5,
      lastUpdated: now,
    }));

    updateDog(dog.id, {
      skills: maxedSkills,
      certificateIssued: true,
      certificateIssuedAt: now,
    });
    issueCertificate(dog.id);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // Ignore confetti errors in non-canvas environments
    }

    toast.success(`Курс доведён до 100%, диплом выдан для ${dog.name}`, {
      description: `Присвоено официальное звание ${officialGenderTitle}`,
    });
  };

  const handleDownloadPng = async () => {
    if (!certificateRef.current || isExportingPng) return;
    setIsExportingPng(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#faf6ee',
      });
      const link = document.createElement('a');
      link.download = `DogTeacher_Diploma_${dog.name}_A4.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Диплом сохранён в формате PNG HD');
    } catch {
      toast.error('Не удалось сформировать PNG файл');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#faf6ee',
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      pdf.save(`DogTeacher_Diploma_${dog.name}_A4.pdf`);
      toast.success('Архивный диплом А4 сохранён в формате PDF');
    } catch {
      toast.error('Не удалось сформировать PDF документ');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const showAvatarImg = Boolean(dog.avatar) && !imgError;
  const monogram = dog.name.slice(0, 2).toUpperCase();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1f1b16]/60 backdrop-blur-[1px] transition-opacity" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-[1180px] max-h-[94vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1f1b16]/15 bg-[#f7f4ee] text-[#1f1b16] shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden focus:outline-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#fdfbf7] border-b border-[#1f1b16]/10">
            <div>
              <Dialog.Title className="font-serif text-lg font-medium text-[#1f1b16]">
                Архивный диплом об окончании курса (формат А4)
              </Dialog.Title>
              <p className="text-xs text-[#7b7266] mt-0.5">
                Выпускной документ кинологической картотеки · {dog.name} ({dog.breed})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGraduateDemo}
                className="h-9 px-3.5 rounded-lg border border-[#1f5c3a]/30 bg-[#1f5c3a]/10 hover:bg-[#1f5c3a]/15 text-[#1f5c3a] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="size-3.5 stroke-[1.5]" />
                <span>Демо: Довести курс до 100% и выдать диплом</span>
              </button>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="size-9 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] inline-flex items-center justify-center transition-colors"
                  aria-label="Закрыть окно диплома"
                >
                  <X className="size-4 stroke-[1.5]" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Controls Bar: Trainer Profile, Center Name, Course Selector & Export */}
          <div className="px-6 py-3.5 bg-[#fdfbf7] border-b border-[#1f1b16]/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label
                htmlFor="cert-center-name"
                className="block text-[11px] text-[#7b7266] mb-1"
              >
                Кинологический центр / академия
              </label>
              <input
                id="cert-center-name"
                type="text"
                value={trainerProfile.centerName}
                onChange={(e) => updateTrainerProfile({ centerName: e.target.value })}
                className="h-8 w-full px-2.5 rounded-[6px] border border-[#1f1b16]/15 bg-[#efe9df]/50 text-xs text-[#1f1b16] focus:outline-hidden focus:border-[#1f1b16]"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="cert-trainer-name"
                className="block text-[11px] text-[#7b7266] mb-1"
              >
                Инструктор-кинолог (ФИО)
              </label>
              <input
                id="cert-trainer-name"
                type="text"
                value={trainerProfile.name}
                onChange={(e) => updateTrainerProfile({ name: e.target.value })}
                className="h-8 w-full px-2.5 rounded-[6px] border border-[#1f1b16]/15 bg-[#efe9df]/50 text-xs text-[#1f1b16] focus:outline-hidden focus:border-[#1f1b16]"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="cert-course-select"
                className="block text-[11px] text-[#7b7266] mb-1"
              >
                Наименование программы
              </label>
              <select
                id="cert-course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="h-8 w-full px-2.5 rounded-[6px] border border-[#1f1b16]/15 bg-[#efe9df]/50 text-xs text-[#1f1b16] focus:outline-hidden focus:border-[#1f1b16]"
              >
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isExportingPng}
                className="h-8 px-3 rounded-[6px] border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="size-3.5 stroke-[1.5]" />
                <span>{isExportingPng ? 'Экспорт...' : 'Скачать PNG HD'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="h-8 px-3.5 rounded-[6px] bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <FileDown className="size-3.5 stroke-[1.5]" />
                <span>{isExportingPdf ? 'Экспорт...' : 'Скачать PDF А4'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Preview Viewport for the A4 Sheet */}
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-[#efe9df]/60">
            {/* A4 Landscape Archival Sheet (1000 x 707 px = exact 1.4142 A4 ratio) */}
            <div
              ref={certificateRef}
              className="relative w-[1000px] min-w-[1000px] h-[707px] bg-[#faf6ee] text-[#1f1b16] p-11 select-none shadow-[0_8px_24px_rgba(31,27,22,0.08)] overflow-hidden flex flex-col justify-between"
            >
              {/* Intricate Double-Line Archival & Guilloche SVG Frame */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1000 707"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="guillocheGrid"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0 12 Q 6 6 12 12 T 24 12"
                      stroke="#8c6d3f"
                      strokeWidth="0.4"
                      strokeOpacity="0.16"
                      fill="none"
                    />
                    <path
                      d="M 12 0 Q 6 6 12 12 T 12 24"
                      stroke="#8c6d3f"
                      strokeWidth="0.4"
                      strokeOpacity="0.16"
                      fill="none"
                    />
                  </pattern>
                </defs>

                {/* Subtle Guilloche Border Band */}
                <rect
                  x="24"
                  y="24"
                  width="952"
                  height="659"
                  fill="url(#guillocheGrid)"
                />
                <rect
                  x="34"
                  y="34"
                  width="932"
                  height="639"
                  fill="#faf6ee"
                />

                {/* Outer Fine Graphite Frame */}
                <rect
                  x="22"
                  y="22"
                  width="956"
                  height="663"
                  stroke="#1f1b16"
                  strokeWidth="1.5"
                />
                {/* Middle Bronze Frame */}
                <rect
                  x="28"
                  y="28"
                  width="944"
                  height="651"
                  stroke="#8c6d3f"
                  strokeWidth="0.75"
                />
                {/* Inner Hairline Frame */}
                <rect
                  x="34"
                  y="34"
                  width="932"
                  height="639"
                  stroke="#1f1b16"
                  strokeWidth="0.75"
                  strokeOpacity="0.6"
                />

                {/* Corner Registration Marks */}
                {/* Top-Left */}
                <path d="M 16 38 L 38 38 L 38 16" stroke="#8c6d3f" strokeWidth="1" />
                <circle cx="38" cy="38" r="2.5" fill="#8c6d3f" />
                {/* Top-Right */}
                <path d="M 984 38 L 962 38 L 962 16" stroke="#8c6d3f" strokeWidth="1" />
                <circle cx="962" cy="38" r="2.5" fill="#8c6d3f" />
                {/* Bottom-Left */}
                <path d="M 16 669 L 38 669 L 38 691" stroke="#8c6d3f" strokeWidth="1" />
                <circle cx="38" cy="669" r="2.5" fill="#8c6d3f" />
                {/* Bottom-Right */}
                <path d="M 984 669 L 962 669 L 962 691" stroke="#8c6d3f" strokeWidth="1" />
                <circle cx="962" cy="669" r="2.5" fill="#8c6d3f" />
              </svg>

              {/* Top Section: Academy Name, Registry Serial & Main Diploma Heading */}
              <div className="relative z-10 text-center space-y-2 pt-2">
                <div className="flex items-center justify-between px-6 text-xs text-[#5e554a] border-b border-[#1f1b16]/15 pb-3">
                  <span className="font-medium text-[#1f1b16]">
                    {trainerProfile.centerName || 'Кинологический центр «Альфа-Дог»'}
                  </span>
                  <span className="text-[#8c6d3f]">
                    Аттестационная коллегия прикладного собаководства
                  </span>
                  <span className="font-mono tabular-nums text-[#1f1b16] font-medium">
                    Реестр {registryNumber}
                  </span>
                </div>

                <div className="pt-3">
                  <div className="text-xs text-[#8c6d3f] font-medium mb-1">
                    Официальное свидетельство о прохождении аттестации
                  </div>
                  <h1 className="font-serif text-[34px] leading-tight font-medium text-[#1f1b16] tracking-[-0.02em]">
                    СЕРТИФИКАТ ОБ ОКОНЧАНИИ КУРСА
                  </h1>
                </div>
              </div>

              {/* Center Section: Archival Medallion + Dog Dossier & Official Title */}
              <div className="relative z-10 px-6 grid grid-cols-12 gap-8 items-center my-auto">
                {/* Left Column: Circular Archival Medallion */}
                <div className="col-span-4 flex flex-col items-center">
                  <div className="relative size-40 rounded-full p-2 border border-[#8c6d3f] bg-[#fdfbf7] shadow-[0_2px_10px_rgba(31,27,22,0.06)] flex items-center justify-center">
                    <div className="size-full rounded-full overflow-hidden border border-[#1f1b16]/20 bg-[#efe9df] flex items-center justify-center">
                      {showAvatarImg ? (
                        <img
                          src={dog.avatar}
                          alt={dog.name}
                          crossOrigin="anonymous"
                          className="size-full object-cover"
                          onError={() => setFailedAvatar(dog.avatar)}
                        />
                      ) : (
                        <span className="font-serif text-4xl font-medium text-[#5e554a]">
                          {monogram}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <div className="text-[11px] text-[#7b7266]">Карточка выпускника</div>
                    <div className="font-mono tabular-nums text-xs text-[#1f1b16] font-medium mt-0.5">
                      ID: {dog.id}
                    </div>
                  </div>
                </div>

                {/* Right Column: Graduate Particulars, Course, Score & Official Title */}
                <div className="col-span-8 space-y-4 text-left border-l border-[#1f1b16]/15 pl-8">
                  <div>
                    <div className="text-xs text-[#7b7266]">Настоящим удостоверяется, что собака по кличке</div>
                    <div className="flex items-baseline justify-between gap-4 mt-0.5 border-b border-[#1f1b16]/15 pb-2">
                      <h2 className="font-serif text-4xl font-medium text-[#1f1b16]">
                        {dog.name}
                      </h2>
                      <span className="text-sm text-[#5e554a]">
                        {dog.breed} · {dog.gender === 'female' ? 'Сука' : 'Кобель'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-4 text-xs py-1">
                    <div>
                      <div className="text-[#7b7266]">Дата рождения и возраст</div>
                      <div className="font-mono tabular-nums text-[#1f1b16] font-medium mt-0.5">
                        {formattedBirthDate} ({formatDogAgeRussian(dog.birthDate)})
                      </div>
                    </div>
                    <div>
                      <div className="text-[#7b7266]">Масса тела</div>
                      <div className="font-mono tabular-nums text-[#1f1b16] font-medium mt-0.5">
                        {dog.weight} кг
                      </div>
                    </div>
                    <div>
                      <div className="text-[#7b7266]">Владелец (проводник)</div>
                      <div className="text-[#1f1b16] font-medium mt-0.5">
                        {dog.ownerName}
                      </div>
                    </div>
                  </div>

                  {/* Course & Final Score */}
                  <div className="p-3.5 rounded-lg bg-[#fdfbf7] border border-[#1f1b16]/15 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] text-[#7b7266]">Успешно освоила программу испытаний</div>
                      <div className="text-sm font-medium text-[#1f1b16] mt-0.5">
                        {selectedCourse}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] text-[#7b7266]">Итоговая оценка</div>
                      <div className="font-mono tabular-nums text-sm font-medium text-[#1f5c3a] mt-0.5">
                        {displayScore}% (Отлично)
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Gender-Aware Official Title */}
                  <div className="p-3.5 rounded-lg bg-[#efe9df]/70 border border-[#8c6d3f]/40 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] text-[#5e554a]">
                        Решением аттестационной комиссии присвоено почётное квалификационное звание
                      </div>
                      <div
                        data-testid="certificate-gender-title"
                        className="font-serif text-2xl font-medium text-[#1f1b16] mt-0.5"
                      >
                        {officialGenderTitle}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums text-xs text-[#8c6d3f] font-medium">
                      Класс I · Эталон
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer: Date, Engraved Academy Seal & Signature Block */}
              <div className="relative z-10 px-6 pt-4 border-t border-[#1f1b16]/15 flex items-end justify-between gap-6">
                {/* Issue Date & Location */}
                <div className="space-y-1 text-xs">
                  <div className="text-[#7b7266]">Дата выдачи документа</div>
                  <div className="font-mono tabular-nums text-sm font-medium text-[#1f1b16]">
                    {formattedIssueDate}
                  </div>
                  <div className="text-[11px] text-[#7b7266]">
                    Зарегистрировано в архивном журнале учёта
                  </div>
                </div>

                {/* Intricate Vector SVG Engraved Bronze/Gold Seal of the Cynological Academy */}
                <div className="flex items-center gap-3">
                  <svg
                    width="88"
                    height="88"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Гербовая печать кинологической академии"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      stroke="#8c6d3f"
                      strokeWidth="1.5"
                      strokeDasharray="2 1.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#1f1b16"
                      strokeWidth="1"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="33"
                      stroke="#8c6d3f"
                      strokeWidth="0.75"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="29"
                      stroke="#8c6d3f"
                      strokeWidth="0.5"
                      strokeDasharray="1.5 1.5"
                    />
                    {/* 8-Pointed Compass Star in Center */}
                    <path
                      d="M50 23 L54 44 L75 50 L54 56 L50 77 L46 56 L25 50 L46 44 Z"
                      stroke="#8c6d3f"
                      strokeWidth="0.9"
                      fill="#8c6d3f"
                      fillOpacity="0.08"
                    />
                    <circle cx="50" cy="50" r="8" fill="#faf6ee" stroke="#1f1b16" strokeWidth="1" />
                    <text
                      x="50"
                      y="53"
                      textAnchor="middle"
                      fill="#1f1b16"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      ОКД
                    </text>
                    <text
                      x="50"
                      y="17"
                      textAnchor="middle"
                      fill="#5e554a"
                      fontSize="5.5"
                      fontFamily="serif"
                    >
                      КИНОЛОГИЧЕСКАЯ КОЛЛЕГИЯ
                    </text>
                    <text
                      x="50"
                      y="88"
                      textAnchor="middle"
                      fill="#8c6d3f"
                      fontSize="5.5"
                      fontFamily="monospace"
                    >
                      ДОПУСК · 100%
                    </text>
                  </svg>
                </div>

                {/* Trainer Signature Block */}
                <div className="text-right space-y-1 min-w-[240px]">
                  <div className="text-xs text-[#7b7266]">Ведущий инструктор-кинолог</div>
                  <div className="flex items-center justify-end gap-4 border-b border-[#1f1b16]/30 pb-1">
                    {/* Engraved Vector Calligraphic Signature */}
                    <svg
                      width="96"
                      height="28"
                      viewBox="0 0 120 36"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 26 C 18 10, 28 8, 32 22 C 35 30, 44 12, 54 16 C 62 19, 68 27, 78 14 C 86 5, 92 24, 112 18"
                        stroke="#1f1b16"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M22 29 Q 60 24 104 27"
                        stroke="#8c6d3f"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-sm font-medium text-[#1f1b16]">
                      {trainerProfile.name || 'Иванов А. В.'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7b7266]">
                    Подпись и личный штамп аттестатора
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

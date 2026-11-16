import type React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  SlidersHorizontal,
  ArrowRight,
  Users,
  Plus,
} from 'lucide-react';
import type { DogFilter, SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { getRussianPlural } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { DisciplineEmblem } from '../cozy/DisciplineEmblems';
import { AutumnPuppyVignette } from '../cozy/CozyAmbience';

export interface HomeDisciplinesViewProps {
  onOpenCommandBuilder: (category: SkillCategory) => void;
  onOpenStudents: (filter: DogFilter) => void;
  onAddDog: () => void;
}

function mapDisciplineToStudentFilter(disciplineId: SkillCategory): DogFilter {
  if (disciplineId === 'okd') return 'active_okd';
  if (disciplineId === 'zks') return 'zks';
  if (disciplineId === 'sport') return 'sport';
  if (disciplineId === 'behavior') return 'behavior';
  if (disciplineId === 'attention') return 'attention';
  if (disciplineId === 'trust') return 'trust';
  return 'all';
}

function getDisciplineDotTone(disciplineId: SkillCategory): string {
  if (disciplineId === 'okd' || disciplineId === 'behavior') {
    return 'bg-[var(--accent-forest)]';
  }
  if (disciplineId === 'sport' || disciplineId === 'trust') {
    return 'bg-[var(--accent-terracotta)]';
  }
  return 'bg-[var(--accent-ochre)]';
}

export const HomeDisciplinesView: React.FC<HomeDisciplinesViewProps> = ({
  onOpenCommandBuilder,
  onOpenStudents,
  onAddDog,
}) => {
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);
  const dogs = useDogStore((s) => s.dogs);
  const theme = useDogStore((s) => s.theme);
  const cozyAnimations = useDogStore((s) => s.cozyAnimations);
  const shouldReduceMotion = useReducedMotion();

  const isDark = theme === 'dark';
  const shouldAnimate = cozyAnimations && !shouldReduceMotion;

  const totalCommandsCount = disciplines.reduce(
    (sum, disc) => sum + (disciplineCommands[String(disc.id)]?.length ?? 0),
    0
  );

  const cardClassName =
    'group relative flex flex-col rounded-[18px] bg-[var(--bg-sheet)] border border-[var(--border-subtle)] p-5 xl:p-6 shadow-[0_6px_22px_-10px_rgba(36,28,18,0.08),0_1px_3px_rgba(36,28,18,0.04),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.5),0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(242,235,225,0.05)] hover:border-[var(--border-strong)] hover:shadow-[0_12px_28px_-10px_rgba(36,28,18,0.12)] dark:hover:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.62)] transition-[border-color,box-shadow] duration-300';

  return (
    <div className="text-[var(--text-primary)] pb-14">
      {/* Paper Header */}
      <div className="px-5 sm:px-8 xl:px-10 pt-7 pb-6 bg-gradient-to-b from-[#f6efe3]/75 to-transparent dark:from-[#231f1a]/80 dark:to-transparent border-b border-[var(--border-hairline)]">
        <div className="text-[12px] text-[var(--text-muted)] font-mono tabular-nums mb-2">
          {disciplines.length}{' '}
          {getRussianPlural(disciplines.length, 'направление', 'направления', 'направлений')}
          {' · '}
          {totalCommandsCount}{' '}
          {getRussianPlural(totalCommandsCount, 'команда', 'команды', 'команд')} в наборах
          {' · '}
          {dogs.length}{' '}
          {getRussianPlural(dogs.length, 'ученик', 'ученика', 'учеников')} в картотеке
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
          <div className="min-w-0">
            <h1 className="font-serif text-[30px] sm:text-[34px] xl:text-[36px] font-medium text-[var(--text-primary)] leading-[1.08] tracking-[-0.02em]">
              Направления дрессировки
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] mt-2 max-w-2xl">
              Курсы, нормативы и ваши наборы команд
            </p>
          </div>

          <div className="flex flex-wrap xl:flex-nowrap items-end justify-between xl:justify-end gap-3 sm:gap-5 flex-shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap order-1 xl:order-2 flex-1 min-w-[168px] xl:flex-initial xl:min-w-0">
              <button
                type="button"
                onClick={() => onOpenStudents('all')}
                className="h-9 px-3.5 rounded-[10px] bg-[var(--bg-note)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Users strokeWidth={1.5} className="size-4 text-[var(--text-secondary)]" />
                <span>Перейти к ученикам</span>
              </button>

              <button
                type="button"
                onClick={onAddDog}
                className="h-9 px-4 rounded-[10px] bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-[0_2px_6px_rgba(34,28,21,0.12)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.45)] whitespace-nowrap"
              >
                <Plus strokeWidth={1.6} className="size-4" />
                <span>Добавить собаку</span>
              </button>
            </div>

            <div className="relative order-2 xl:order-1 ml-auto xl:ml-0 flex-shrink-0 -mb-1">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 bottom-1 top-4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(230,175,92,0.18)_0%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(226,163,82,0.10)_0%,transparent_72%)]"
              />
              <AutumnPuppyVignette
                enabled={cozyAnimations}
                isDark={isDark}
                className="relative w-[112px] sm:w-[140px] xl:w-[148px] h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Tactile Paper Discipline Squares */}
      <div className="px-5 sm:px-8 xl:px-10 pt-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {disciplines.map((disc, index) => {
            const commands = disciplineCommands[String(disc.id)] ?? [];
            const previewCommands = commands.slice(0, 6);
            const remainingCommands = Math.max(0, commands.length - 6);
            const studentsInDiscipline = dogs.filter((dog) =>
              dog.skills.some((skill) => skill.category === disc.id)
            ).length;
            const studentFilter = mapDisciplineToStudentFilter(disc.id);

            const cardContent = (
              <>
                {/* Card Header: Medallion Emblem + Meta + Title */}
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div
                    className={cn(
                      'flex-shrink-0 drop-shadow-[0_3px_8px_rgba(36,28,18,0.08)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]',
                      shouldAnimate &&
                        'group-hover:scale-[1.04] group-hover:-rotate-2 transition-transform duration-300'
                    )}
                  >
                    <DisciplineEmblem
                      category={disc.id}
                      size={84}
                      isDark={isDark}
                      className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[7px] bg-[var(--bg-note)] border border-[var(--border-subtle)] font-mono text-[11.5px] font-medium text-[var(--text-primary)]">
                        <span
                          className={cn(
                            'size-1.5 rounded-full flex-shrink-0',
                            getDisciplineDotTone(disc.id)
                          )}
                          aria-hidden="true"
                        />
                        {disc.shortTitle}
                      </span>

                      <div className="font-mono text-[12px] text-[var(--text-muted)] tabular-nums flex items-center gap-1.5 flex-wrap">
                        <span className="text-[var(--text-primary)] font-medium">
                          {commands.length}{' '}
                          {getRussianPlural(commands.length, 'команда', 'команды', 'команд')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {studentsInDiscipline}{' '}
                          {getRussianPlural(
                            studentsInDiscipline,
                            'ученик',
                            'ученика',
                            'учеников'
                          )}
                        </span>
                      </div>
                    </div>

                    <h2 className="font-serif text-[20px] sm:text-[22px] font-medium text-[var(--text-primary)] leading-[1.16] tracking-[-0.01em] mt-2.5 break-words">
                      {disc.title}
                    </h2>
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-[13px] font-medium text-[var(--accent-forest)] mt-3.5">
                  {disc.subtitle}
                </p>

                {/* Methodology Description */}
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mt-2">
                  {disc.description}
                </p>

                {/* Norms Summary Field Note */}
                <div className="mt-3.5 px-3.5 py-2.5 rounded-[12px] bg-[var(--bg-note)] border border-[var(--border-hairline)] text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {disc.normsSummary}
                </div>

                {/* Command Preview Chips */}
                <div className="mt-4 pt-1 flex-1">
                  <div className="text-[11.5px] font-medium text-[var(--text-muted)] mb-2">
                    Команды в наборе
                  </div>

                  {commands.length === 0 ? (
                    <div className="text-[12.5px] text-[var(--text-muted)] py-1">
                      В этом наборе пока нет команд — добавьте их в конструкторе
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {previewCommands.map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => onOpenCommandBuilder(disc.id)}
                          title={cmd.description || cmd.name}
                          className="px-2.5 py-1 rounded-[8px] bg-[var(--bg-sheet)] hover:bg-[var(--bg-note)] border border-[var(--border-subtle)] text-[12px] text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors text-left"
                        >
                          {cmd.isCustom && (
                            <span
                              className="size-1.5 rounded-full bg-[var(--accent-forest)] flex-shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span>{cmd.name}</span>
                        </button>
                      ))}

                      {remainingCommands > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenCommandBuilder(disc.id)}
                          className="px-2.5 py-1 rounded-[8px] bg-[var(--bg-note)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] font-mono text-[11.5px] tabular-nums text-[var(--text-secondary)] transition-colors"
                        >
                          + ещё {remainingCommands}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenCommandBuilder(disc.id)}
                    className="h-9 px-3.5 rounded-[10px] bg-[var(--bg-note)] hover:bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
                  >
                    <SlidersHorizontal strokeWidth={1.5} className="size-4 text-[var(--text-secondary)]" />
                    <span>Настроить набор команд</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenStudents(studentFilter)}
                    className="h-9 px-3 rounded-[10px] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ученики</span>
                    <ArrowRight strokeWidth={1.5} className="size-4 text-[var(--accent-forest)]" />
                  </button>
                </div>
              </>
            );

            if (shouldAnimate) {
              return (
                <motion.section
                  key={String(disc.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.42,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cardClassName}
                >
                  {cardContent}
                </motion.section>
              );
            }

            return (
              <section key={String(disc.id)} className={cardClassName}>
                {cardContent}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

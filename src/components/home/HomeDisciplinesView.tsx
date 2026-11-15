import type React from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  Users,
  Plus,
} from 'lucide-react';
import type { DogFilter, SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { getRussianPlural } from '../../utils/calculations';

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
  return 'all';
}

export const HomeDisciplinesView: React.FC<HomeDisciplinesViewProps> = ({
  onOpenCommandBuilder,
  onOpenStudents,
  onAddDog,
}) => {
  const disciplines = useDogStore((s) => s.disciplines);
  const disciplineCommands = useDogStore((s) => s.disciplineCommands);
  const dogs = useDogStore((s) => s.dogs);

  const totalCommandsCount = disciplines.reduce(
    (sum, disc) => sum + (disciplineCommands[String(disc.id)]?.length ?? 0),
    0
  );

  return (
    <div className="text-[#221c15] pb-14">
      {/* Craft Paper Header */}
      <div className="px-6 sm:px-10 pt-8 pb-6 bg-gradient-to-b from-[#f6efe3]/75 to-transparent border-b border-[#221c15]/[0.07]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="text-[12px] text-[#94897a] font-mono tabular-nums mb-2">
              {disciplines.length}{' '}
              {getRussianPlural(disciplines.length, 'направление', 'направления', 'направлений')}
              {' · '}
              {totalCommandsCount}{' '}
              {getRussianPlural(totalCommandsCount, 'команда', 'команды', 'команд')} в наборах
              {' · '}
              {dogs.length}{' '}
              {getRussianPlural(dogs.length, 'ученик', 'ученика', 'учеников')} в картотеке
            </div>

            <h1 className="font-serif text-[34px] sm:text-[38px] font-medium text-[#221c15] leading-[1.08] tracking-[-0.02em]">
              Направления дрессировки
            </h1>
            <p className="text-[14px] text-[#655b4e] mt-2 max-w-2xl">
              Курсы, нормативы и ваши наборы команд
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenStudents('all')}
              className="h-9 px-3.5 rounded-[10px] bg-[#f8f3eb] hover:bg-[#ebe3d6] border border-[#221c15]/10 text-[#221c15] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Users strokeWidth={1.5} className="size-4 text-[#655b4e]" />
              <span>Перейти к ученикам</span>
            </button>

            <button
              type="button"
              onClick={onAddDog}
              className="h-9 px-4 rounded-[10px] bg-[#221c15] hover:bg-[#362d23] text-[#fffcf8] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-[0_2px_6px_rgba(34,28,21,0.12)]"
            >
              <Plus strokeWidth={1.6} className="size-4" />
              <span>Добавить собаку</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2x2 Tactile Paper Discipline Squares */}
      <div className="px-6 sm:px-10 pt-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {disciplines.map((disc) => {
            const commands = disciplineCommands[String(disc.id)] ?? [];
            const previewCommands = commands.slice(0, 6);
            const remainingCommands = Math.max(0, commands.length - 6);
            const studentsInDiscipline = dogs.filter((dog) =>
              dog.skills.some((skill) => skill.category === disc.id)
            ).length;
            const studentFilter = mapDisciplineToStudentFilter(disc.id);

            return (
              <section
                key={String(disc.id)}
                className="flex flex-col rounded-[16px] bg-[#fffcf8] border border-[#221c15]/[0.11] p-6 shadow-[0_4px_18px_-8px_rgba(36,28,18,0.08)] hover:border-[#221c15]/20 transition-colors"
              >
                {/* Card Top Meta Row */}
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[7px] bg-[#f8f3eb] border border-[#221c15]/10 font-mono text-[11.5px] font-medium text-[#221c15]">
                    {disc.shortTitle}
                  </span>

                  <div className="font-mono text-[12px] text-[#94897a] tabular-nums flex items-center gap-2">
                    <span className="text-[#221c15] font-medium">
                      {commands.length}{' '}
                      {getRussianPlural(commands.length, 'команда', 'команды', 'команд')}
                    </span>
                    <span>·</span>
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

                {/* Title & Subtitle */}
                <h2 className="font-serif text-[23px] font-medium text-[#221c15] leading-[1.18] tracking-[-0.01em] mt-3.5">
                  {disc.title}
                </h2>
                <p className="text-[13px] font-medium text-[#286144] mt-1">
                  {disc.subtitle}
                </p>

                {/* Methodology Description */}
                <p className="text-[13px] text-[#655b4e] leading-relaxed mt-3">
                  {disc.description}
                </p>

                {/* Norms Summary Field Note */}
                <div className="mt-3.5 px-3.5 py-2.5 rounded-[12px] bg-[#f8f3eb] border border-[#221c15]/[0.06] text-[12px] text-[#5c5245] leading-relaxed">
                  {disc.normsSummary}
                </div>

                {/* Command Preview Chips */}
                <div className="mt-4 pt-1 flex-1">
                  <div className="text-[11.5px] font-medium text-[#94897a] mb-2">
                    Команды в наборе
                  </div>

                  {commands.length === 0 ? (
                    <div className="text-[12.5px] text-[#94897a] py-1">
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
                          className="px-2.5 py-1 rounded-[8px] bg-[#fffcf8] hover:bg-[#f8f3eb] border border-[#221c15]/10 text-[12px] text-[#221c15] inline-flex items-center gap-1.5 transition-colors text-left"
                        >
                          {cmd.isCustom && (
                            <span
                              className="size-1.5 rounded-full bg-[#286144] flex-shrink-0"
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
                          className="px-2.5 py-1 rounded-[8px] bg-[#f8f3eb] hover:bg-[#ebe3d6] border border-[#221c15]/[0.08] font-mono text-[11.5px] tabular-nums text-[#655b4e] transition-colors"
                        >
                          + ещё {remainingCommands}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-[#221c15]/[0.07] flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenCommandBuilder(disc.id)}
                    className="h-9 px-3.5 rounded-[10px] bg-[#f8f3eb] hover:bg-[#ebe3d6] border border-[#221c15]/10 text-[#221c15] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
                  >
                    <SlidersHorizontal strokeWidth={1.5} className="size-4 text-[#655b4e]" />
                    <span>Настроить набор команд</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenStudents(studentFilter)}
                    className="h-9 px-3 rounded-[10px] hover:bg-[#f3ede3] text-[#221c15] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ученики</span>
                    <ArrowRight strokeWidth={1.5} className="size-4 text-[#286144]" />
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

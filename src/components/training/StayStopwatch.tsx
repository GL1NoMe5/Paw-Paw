import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StayStopwatchProps {
  initialSeconds?: number;
  onSecondsChange?: (seconds: number) => void;
  className?: string;
}

const PRESET_DURATIONS = [
  { label: '15с', seconds: 15 },
  { label: '30с', seconds: 30 },
  { label: '1м', seconds: 60 },
  { label: '2м', seconds: 120 },
  { label: '3м', seconds: 180 },
] as const;

const RULER_TICKS = [20, 40, 60, 80] as const;

export const StayStopwatch: React.FC<StayStopwatchProps> = ({
  initialSeconds = 0,
  onSecondsChange,
  className,
}) => {
  const [elapsedMs, setElapsedMs] = useState(initialSeconds * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState<number | null>(60);

  const intervalRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const onSecondsChangeRef = useRef(onSecondsChange);

  useEffect(() => {
    onSecondsChangeRef.current = onSecondsChange;
  }, [onSecondsChange]);

  const currentTotalSeconds = Math.floor(elapsedMs / 1000);
  const prevSecondsRef = useRef(currentTotalSeconds);

  useEffect(() => {
    if (prevSecondsRef.current !== currentTotalSeconds) {
      prevSecondsRef.current = currentTotalSeconds;
      onSecondsChangeRef.current?.(currentTotalSeconds);
    }
  }, [currentTotalSeconds]);

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        setElapsedMs((prev) => prev + delta);
      }, 100);
    } else if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleTogglePlayPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    prevSecondsRef.current = 0;
    onSecondsChangeRef.current?.(0);
  }, []);

  const handleSelectPreset = (seconds: number) => {
    setTargetSeconds((prev) => (prev === seconds ? null : seconds));
  };

  const handleAdjustSeconds = (deltaSeconds: number) => {
    setElapsedMs((prev) => Math.max(0, prev + deltaSeconds * 1000));
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Space' && e.target === e.currentTarget) {
      e.preventDefault();
      handleTogglePlayPause();
    }
  };

  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;
  const deciseconds = Math.floor((elapsedMs % 1000) / 100);

  const formattedMins = String(minutes).padStart(2, '0');
  const formattedSecs = String(seconds).padStart(2, '0');

  const progressPercent = targetSeconds
    ? Math.min(100, Math.round((currentTotalSeconds / targetSeconds) * 100))
    : 0;

  const isTargetAchieved = targetSeconds !== null && currentTotalSeconds >= targetSeconds;

  return (
    <div
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      aria-label="Секундомер выдержки"
      className={cn(
        'rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] p-5 transition-colors focus:outline-hidden focus:border-[#1f1b16]/30',
        className
      )}
    >
      {/* Top Row: Label, Presets, Fine Adjustment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-medium text-[#1f1b16]">Секундомер выдержки</h3>
            {isTargetAchieved && (
              <span className="text-xs font-mono tabular-nums text-[#1f5c3a] font-medium">
                Норматив выполнен
              </span>
            )}
          </div>
          <p className="text-xs text-[#7b7266] mt-0.5">
            Фиксация времени сохранения позиции при отходе кинолога
          </p>
        </div>

        {/* Preset Target Buttons + Fine Adjust */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#7b7266] mr-1">Ориентир:</span>
          {PRESET_DURATIONS.map((preset) => {
            const isSelected = targetSeconds === preset.seconds;
            return (
              <button
                key={preset.seconds}
                type="button"
                onClick={() => handleSelectPreset(preset.seconds)}
                className={cn(
                  'h-7 px-2.5 rounded-[6px] text-xs font-mono tabular-nums transition-colors border',
                  isSelected
                    ? 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7] font-medium'
                    : 'bg-[#fdfbf7] border-[#1f1b16]/10 hover:bg-[#efe9df] text-[#5e554a]'
                )}
              >
                {preset.label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-[#1f1b16]/10 mx-1" />

          <button
            type="button"
            onClick={() => handleAdjustSeconds(-5)}
            disabled={currentTotalSeconds < 5}
            className="size-7 rounded-[6px] border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] disabled:opacity-40 disabled:cursor-not-allowed text-[#5e554a] inline-flex items-center justify-center transition-colors"
            title="Отнять 5 секунд"
            aria-label="Отнять 5 секунд"
          >
            <Minus className="size-3.5 stroke-[1.5]" />
          </button>
          <span className="text-[11px] font-mono tabular-nums text-[#7b7266] px-0.5">5с</span>
          <button
            type="button"
            onClick={() => handleAdjustSeconds(5)}
            className="size-7 rounded-[6px] border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] inline-flex items-center justify-center transition-colors"
            title="Добавить 5 секунд"
            aria-label="Добавить 5 секунд"
          >
            <Plus className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Instrument Readout & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-4 rounded-lg bg-[#efe9df]/60 border border-[#1f1b16]/10">
        <div className="flex items-baseline gap-2 select-none">
          <div className="font-mono tabular-nums text-3xl sm:text-4xl font-medium text-[#1f1b16] tracking-normal">
            {formattedMins}:{formattedSecs}
            <span className="text-xl sm:text-2xl text-[#5e554a]">.{deciseconds}</span>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#7b7266]">
            ({currentTotalSeconds} с)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className={cn(
              'h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition-colors border',
              isRunning
                ? 'bg-[#efe9df] border-[#1f1b16]/20 text-[#1f1b16] hover:bg-[#e5dec8]'
                : 'bg-[#1f1b16] border-[#1f1b16] text-[#fdfbf7] hover:bg-[#332d26]'
            )}
            aria-label={isRunning ? 'Пауза' : 'Старт'}
          >
            {isRunning ? (
              <>
                <Pause className="size-3.5 stroke-[1.5]" />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 stroke-[1.5]" />
                <span>{currentTotalSeconds > 0 ? 'Продолжить' : 'Старт'}</span>
              </>
            )}
            <kbd
              className={cn(
                'keycap ml-1 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] leading-none',
                isRunning
                  ? 'border-[#1f1b16]/15 bg-[#fdfbf7] text-[#5e554a]'
                  : 'border-[#fdfbf7]/20 bg-[#fdfbf7]/10 text-[#fdfbf7]/80'
              )}
            >
              Пробел
            </kbd>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={currentTotalSeconds === 0 && !isRunning}
            className="h-9 px-3 rounded-lg border border-[#1f1b16]/10 bg-[#fdfbf7] hover:bg-[#efe9df] disabled:opacity-40 disabled:cursor-not-allowed text-[#5e554a] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            title="Сбросить секундомер"
            aria-label="Сбросить секундомер"
          >
            <RotateCcw className="size-3.5 stroke-[1.5]" />
            <span>Сброс</span>
          </button>
        </div>
      </div>

      {/* Precision Ruler Progress (when target is set) */}
      {targetSeconds !== null && (
        <div className="mt-3 pt-3 border-t border-[#1f1b16]/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#5e554a]">
              Целевая выдержка:{' '}
              <span className="font-mono tabular-nums text-[#1f1b16] font-medium">
                {targetSeconds} с
              </span>
            </span>
            <span
              className={cn(
                'font-mono tabular-nums font-medium',
                isTargetAchieved ? 'text-[#1f5c3a]' : 'text-[#1f1b16]'
              )}
            >
              {progressPercent}%
            </span>
          </div>

          <div className="relative h-2 w-full rounded-[4px] bg-[#efe9df] border border-[#1f1b16]/10 overflow-hidden">
            <div
              className={cn(
                'h-full transition-colors',
                isTargetAchieved ? 'bg-[#1f5c3a]' : 'bg-[#1f1b16]'
              )}
              style={{ width: `${progressPercent}%` }}
            />
            {RULER_TICKS.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-[#1f1b16]/15 pointer-events-none"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

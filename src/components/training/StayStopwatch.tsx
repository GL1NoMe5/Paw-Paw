import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Timer, Keyboard } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StayStopwatchProps {
  initialSeconds?: number;
  onSecondsChange?: (seconds: number) => void;
  mode?: 'stopwatch' | 'manual';
  onModeChange?: (mode: 'stopwatch' | 'manual') => void;
  className?: string;
}

const TARGET_PRESETS = [
  { label: '15с', seconds: 15 },
  { label: '30с', seconds: 30 },
  { label: '1м', seconds: 60 },
  { label: '2м', seconds: 120 },
  { label: '3м', seconds: 180 },
] as const;

const MANUAL_STAY_PRESETS = [
  { label: '15с', seconds: 15 },
  { label: '30с', seconds: 30 },
  { label: '60с', seconds: 60 },
  { label: '90с', seconds: 90 },
  { label: '120с', seconds: 120 },
] as const;

const RULER_TICKS = [20, 40, 60, 80] as const;

export const StayStopwatch: React.FC<StayStopwatchProps> = ({
  initialSeconds = 0,
  onSecondsChange,
  mode,
  onModeChange,
  className,
}) => {
  const safeInitial = Math.max(0, Math.round(initialSeconds));
  const [internalMode, setInternalMode] = useState<'stopwatch' | 'manual'>(mode ?? 'stopwatch');
  const [prevModeProp, setPrevModeProp] = useState<'stopwatch' | 'manual' | undefined>(mode);
  const [elapsedMs, setElapsedMs] = useState(safeInitial * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState<number | null>(60);

  // Ephemeral input drafts while focused so typing multi-digit seconds never jumps mid-keystroke
  const [editingMins, setEditingMins] = useState<string | null>(null);
  const [editingSecs, setEditingSecs] = useState<string | null>(null);

  if (mode !== prevModeProp) {
    setPrevModeProp(mode);
    if (mode !== undefined) {
      setInternalMode(mode);
      if (mode === 'manual') {
        setIsRunning(false);
      }
    }
  }

  const activeMode = onModeChange && mode !== undefined ? mode : internalMode;
  const effectiveIsRunning = isRunning && activeMode === 'stopwatch';

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
    if (effectiveIsRunning) {
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
  }, [effectiveIsRunning]);

  const handleModeSwitch = (nextMode: 'stopwatch' | 'manual') => {
    if (nextMode === activeMode) return;
    if (nextMode === 'manual') {
      setIsRunning(false);
    }
    setEditingMins(null);
    setEditingSecs(null);
    setInternalMode(nextMode);
    onModeChange?.(nextMode);
  };

  const handleTogglePlayPause = useCallback(() => {
    if (activeMode !== 'stopwatch') return;
    setIsRunning((prev) => !prev);
  }, [activeMode]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    setEditingMins(null);
    setEditingSecs(null);
    prevSecondsRef.current = 0;
    onSecondsChangeRef.current?.(0);
  }, []);

  const handleSelectTargetPreset = (seconds: number) => {
    setTargetSeconds((prev) => (prev === seconds ? null : seconds));
  };

  const handleAdjustSeconds = (deltaSeconds: number) => {
    setEditingMins(null);
    setEditingSecs(null);
    setElapsedMs((prev) => Math.max(0, prev + deltaSeconds * 1000));
  };

  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;
  const deciseconds = Math.floor((elapsedMs % 1000) / 100);

  const displayedMinsValue = editingMins ?? String(minutes);
  const displayedSecsValue = editingSecs ?? String(seconds).padStart(2, '0');

  const handleManualMinsChange = (rawValue: string) => {
    setEditingMins(rawValue);
    const parsedMins = Math.max(0, Math.min(180, parseInt(rawValue, 10) || 0));
    const currentSecs =
      editingSecs !== null
        ? Math.max(0, Math.min(599, parseInt(editingSecs, 10) || 0))
        : seconds;
    setElapsedMs((parsedMins * 60 + currentSecs) * 1000);
  };

  const handleManualSecsChange = (rawValue: string) => {
    setEditingSecs(rawValue);
    const currentMins =
      editingMins !== null
        ? Math.max(0, Math.min(180, parseInt(editingMins, 10) || 0))
        : minutes;
    const parsedSecs = Math.max(0, Math.min(599, parseInt(rawValue, 10) || 0));
    setElapsedMs((currentMins * 60 + parsedSecs) * 1000);
  };

  const handleSelectManualPreset = (presetSeconds: number) => {
    setIsRunning(false);
    setEditingMins(null);
    setEditingSecs(null);
    setElapsedMs(presetSeconds * 1000);
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (activeMode === 'stopwatch' && e.code === 'Space' && e.target === e.currentTarget) {
      e.preventDefault();
      handleTogglePlayPause();
    }
  };

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
        'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sheet)] p-5 transition-colors focus:outline-none focus:border-[var(--border-strong)]',
        className
      )}
    >
      {/* Top Row: Label, Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Фиксация выдержки</h3>
            {isTargetAchieved && (
              <span className="text-xs font-mono tabular-nums text-[var(--accent-forest)] font-medium">
                Норматив выполнен
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {activeMode === 'stopwatch'
              ? 'Живой замер времени сохранения позиции при отходе кинолога'
              : 'Быстрый ввод уже достигнутого времени выдержки без запуска таймера'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Секундомер vs Вбить вручную */}
          <div
            role="group"
            aria-label="Режим фиксации выдержки"
            className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-note)] p-0.5"
          >
            <button
              type="button"
              onClick={() => handleModeSwitch('stopwatch')}
              className={cn(
                'h-7 px-2.5 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                activeMode === 'stopwatch'
                  ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[0_1px_2px_rgba(31,27,22,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Timer className="size-3.5 stroke-[1.6]" />
              <span>Секундомер</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('manual')}
              className={cn(
                'h-7 px-2.5 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                activeMode === 'manual'
                  ? 'bg-[var(--bg-sheet)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[0_1px_2px_rgba(31,27,22,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Keyboard className="size-3.5 stroke-[1.6]" />
              <span>Вбить вручную</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Goal Selector + Fine Adjust */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--text-muted)] mr-1">Ориентир:</span>
          {TARGET_PRESETS.map((preset) => {
            const isSelected = targetSeconds === preset.seconds;
            return (
              <button
                key={preset.seconds}
                type="button"
                onClick={() => handleSelectTargetPreset(preset.seconds)}
                className={cn(
                  'h-7 px-2.5 rounded-[6px] text-xs font-mono tabular-nums transition-colors border',
                  isSelected
                    ? 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                    : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAdjustSeconds(-5)}
            disabled={currentTotalSeconds < 5}
            className="size-7 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] inline-flex items-center justify-center transition-colors"
            title="Отнять 5 секунд"
            aria-label="Отнять 5 секунд"
          >
            <Minus className="size-3.5 stroke-[1.5]" />
          </button>
          <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] px-0.5">5с</span>
          <button
            type="button"
            onClick={() => handleAdjustSeconds(5)}
            className="size-7 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] inline-flex items-center justify-center transition-colors"
            title="Добавить 5 секунд"
            aria-label="Добавить 5 секунд"
          >
            <Plus className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Mode Content */}
      {activeMode === 'stopwatch' ? (
        /* Live Stopwatch Readout & Controls */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-4 rounded-lg bg-[var(--bg-note)] border border-[var(--border-subtle)]">
          <div className="flex items-baseline gap-2 select-none">
            <div className="font-mono tabular-nums text-3xl sm:text-4xl font-medium text-[var(--text-primary)] tracking-normal">
              {formattedMins}:{formattedSecs}
              <span className="text-xl sm:text-2xl text-[var(--text-secondary)]">.{deciseconds}</span>
            </div>
            <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
              ({currentTotalSeconds} с)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className={cn(
                'h-9 px-3.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition-colors border',
                effectiveIsRunning
                  ? 'bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-active)]'
                  : 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] hover:bg-[var(--btn-dark-hover)]'
              )}
              aria-label={effectiveIsRunning ? 'Пауза' : 'Старт'}
            >
              {effectiveIsRunning ? (
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
                  'ml-1 inline-flex items-center justify-center rounded-[5px] border px-1.5 py-0.5 font-mono text-[10px] leading-none select-none',
                  effectiveIsRunning
                    ? 'border-[var(--border-strong)] bg-[var(--bg-sheet)] text-[var(--text-primary)]'
                    : 'border-[#fffcf8]/30 bg-[#fffcf8]/15 text-[#fffcf8] dark:border-[#1b1814]/25 dark:bg-[#1b1814]/10 dark:text-[#1b1814]'
                )}
              >
                Пробел
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={currentTotalSeconds === 0 && !effectiveIsRunning}
              className="h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              title="Сбросить секундомер"
              aria-label="Сбросить секундомер"
            >
              <RotateCcw className="size-3.5 stroke-[1.5]" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      ) : (
        /* Manual Entry Panel */
        <div className="space-y-3 py-3.5 px-4 rounded-lg bg-[var(--bg-note)] border border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Numeric Inputs: Минуты + Секунды */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>Минуты</span>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={displayedMinsValue}
                  onFocus={() => setEditingMins(String(minutes))}
                  onChange={(e) => handleManualMinsChange(e.target.value)}
                  onBlur={() => setEditingMins(null)}
                  aria-label="Минуты выдержки"
                  className="h-9 w-16 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] text-sm font-mono tabular-nums font-medium text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--border-strong)]"
                />
              </label>

              <span className="font-mono text-sm text-[var(--text-muted)] select-none">:</span>

              <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>Секунды</span>
                <input
                  type="number"
                  min={0}
                  max={599}
                  value={displayedSecsValue}
                  onFocus={() => setEditingSecs(String(seconds))}
                  onChange={(e) => handleManualSecsChange(e.target.value)}
                  onBlur={() => setEditingSecs(null)}
                  aria-label="Секунды выдержки"
                  className="h-9 w-16 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] text-sm font-mono tabular-nums font-medium text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--border-strong)]"
                />
              </label>

              <span className="text-xs font-mono tabular-nums text-[var(--text-secondary)] ml-1">
                = {formattedMins}:{formattedSecs} ({currentTotalSeconds} с)
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={currentTotalSeconds === 0}
              className="h-8 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              title="Очистить время выдержки"
            >
              <RotateCcw className="size-3.5 stroke-[1.5]" />
              <span>Сброс</span>
            </button>
          </div>

          {/* Quick Presets: 15с, 30с, 60с, 90с, 120с */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] mr-1">Быстрый выбор:</span>
            {MANUAL_STAY_PRESETS.map((preset) => {
              const isSelected = currentTotalSeconds === preset.seconds;
              return (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => handleSelectManualPreset(preset.seconds)}
                  className={cn(
                    'h-7 px-2.5 rounded-[6px] text-xs font-mono tabular-nums transition-colors border',
                    isSelected
                      ? 'bg-[var(--btn-dark-bg)] border-[var(--btn-dark-bg)] text-[var(--btn-dark-text)] font-medium'
                      : 'bg-[var(--bg-sheet)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Precision Ruler Progress (when target is set) */}
      {targetSeconds !== null && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--text-secondary)]">
              Целевая выдержка:{' '}
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-medium">
                {targetSeconds} с
              </span>
            </span>
            <span
              className={cn(
                'font-mono tabular-nums font-medium',
                isTargetAchieved ? 'text-[var(--accent-forest)]' : 'text-[var(--text-primary)]'
              )}
            >
              {progressPercent}%
            </span>
          </div>

          <div className="relative h-2 w-full rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
            <div
              className={cn(
                'h-full transition-colors',
                isTargetAchieved ? 'bg-[var(--accent-forest)]' : 'bg-[var(--btn-dark-bg)]'
              )}
              style={{ width: `${progressPercent}%` }}
            />
            {RULER_TICKS.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-[#221c15]/15 dark:bg-[#f2ebe1]/15 pointer-events-none"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

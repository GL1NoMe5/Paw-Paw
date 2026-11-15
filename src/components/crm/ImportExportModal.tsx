import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useDogStore } from '../../store/useDogStore';

interface ImportExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  open,
  onOpenChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportDatabaseToJson = useDogStore((s) => s.exportDatabaseToJson);
  const importDatabaseFromJson = useDogStore((s) => s.importDatabaseFromJson);
  const resetToDemoData = useDogStore((s) => s.resetToDemoData);

  const handleExport = () => {
    try {
      const jsonStr = exportDatabaseToJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `dogteacher_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Резервная копия картотеки сохранена');
    } catch {
      toast.error('Не удалось экспортировать базу данных');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = importDatabaseFromJson(reader.result);
        if (res.success) {
          toast.success('Картотека восстановлена из файла', {
            description: `Загружено карточек: ${res.count ?? 0}`,
          });
          onOpenChange(false);
        } else {
          toast.error(res.message);
        }
      }
    };
    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'Сбросить базу данных? Все добавленные карточки и занятия будут заменены демонстрационными профилями (Рекс, Булочка, Юта).'
      )
    ) {
      resetToDemoData();
      toast.info('База данных возвращена к демонстрационному набору', {
        description: 'Загружены карточки: Рекс (96%), Булочка (64%) и Юта (100%).',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 dark:bg-black/65 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--bg-sheet)] rounded-2xl border border-[var(--border-strong)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.65)] z-50 text-xs text-[var(--text-primary)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <Dialog.Title className="font-serif text-base font-medium text-[var(--text-primary)]">
                Резервное копирование и база данных
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[var(--text-muted)] mt-0.5">
                Экспорт картотеки в JSON, импорт из архива и сброс демо-данных
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="size-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3 pt-4">
            {/* 1. Export */}
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)] flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[var(--text-primary)] text-xs mb-0.5">
                  Экспорт всей картотеки
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Сохранить файл .json со всеми карточками собак и журналом занятий
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3.5 rounded-lg bg-[var(--btn-dark-bg)] hover:bg-[var(--btn-dark-hover)] text-[var(--btn-dark-text)] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Download className="size-3.5" strokeWidth={1.5} />
                <span>Скачать JSON</span>
              </button>
            </div>

            {/* 2. Import */}
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)] flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[var(--text-primary)] text-xs mb-0.5">
                  Импорт из файла JSON
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Восстановить картотеку из ранее сохранённой резервной копии
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Upload className="size-3.5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                <span>Выбрать файл</span>
              </button>
            </div>

            {/* 3. Reset to Demo Data */}
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-note)] flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[var(--text-primary)] text-xs mb-0.5">
                  Демонстрационный набор карточек
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Восстановить исходные профили: Рекс (<span className="font-mono tabular-nums">96%</span>), Булочка (<span className="font-mono tabular-nums">64%</span>), Юта (<span className="font-mono tabular-nums">100%</span>)
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDemo}
                className="h-9 px-3.5 rounded-lg border border-[#b84233]/30 dark:border-[#e37163]/35 bg-[var(--bg-sheet)] hover:bg-[#b84233]/10 dark:hover:bg-[#e37163]/15 text-[var(--accent-terracotta)] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.5} />
                <span>Сбросить</span>
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

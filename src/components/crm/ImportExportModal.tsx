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
        <Dialog.Overlay className="fixed inset-0 bg-[#1f1b16]/40 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#fdfbf7] rounded-2xl border border-[#1f1b16]/15 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-50 text-xs text-[#1f1b16]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1b16]/10">
            <div>
              <Dialog.Title className="font-serif text-base font-medium text-[#1f1b16]">
                Резервное копирование и база данных
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#7b7266] mt-0.5">
                Экспорт картотеки в JSON, импорт из архива и сброс демо-данных
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="size-8 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] flex items-center justify-center text-[#7b7266] hover:text-[#1f1b16] transition-colors"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3 pt-4">
            {/* 1. Export */}
            <div className="p-4 rounded-xl border border-[#1f1b16]/10 bg-[#efe9df]/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[#1f1b16] text-xs mb-0.5">
                  Экспорт всей картотеки
                </div>
                <div className="text-xs text-[#5e554a] leading-relaxed">
                  Сохранить файл .json со всеми карточками собак и журналом занятий
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3.5 rounded-lg bg-[#1f1b16] hover:bg-[#332d26] text-[#fdfbf7] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Download className="size-3.5" strokeWidth={1.5} />
                <span>Скачать JSON</span>
              </button>
            </div>

            {/* 2. Import */}
            <div className="p-4 rounded-xl border border-[#1f1b16]/10 bg-[#efe9df]/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[#1f1b16] text-xs mb-0.5">
                  Импорт из файла JSON
                </div>
                <div className="text-xs text-[#5e554a] leading-relaxed">
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
                className="h-9 px-3.5 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#1f1b16] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Upload className="size-3.5 text-[#5e554a]" strokeWidth={1.5} />
                <span>Выбрать файл</span>
              </button>
            </div>

            {/* 3. Reset to Demo Data */}
            <div className="p-4 rounded-xl border border-[#1f1b16]/10 bg-[#efe9df]/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[#1f1b16] text-xs mb-0.5">
                  Демонстрационный набор карточек
                </div>
                <div className="text-xs text-[#5e554a] leading-relaxed">
                  Восстановить исходные профили: Рекс (<span className="font-mono tabular-nums">96%</span>), Булочка (<span className="font-mono tabular-nums">64%</span>), Юта (<span className="font-mono tabular-nums">100%</span>)
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDemo}
                className="h-9 px-3.5 rounded-lg border border-[#b93829]/30 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#b93829] font-medium inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.5} />
                <span>Сбросить</span>
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#1f1b16]/10 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-lg border border-[#1f1b16]/15 bg-[#fdfbf7] hover:bg-[#efe9df] text-[#5e554a] font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

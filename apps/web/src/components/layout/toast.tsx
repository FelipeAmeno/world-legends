'use client';
import { useUiStore } from '@/stores';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 md:bottom-4">
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg min-w-[240px]',
          t.type === 'success' && 'bg-green-500 text-white',
          t.type === 'error'   && 'bg-destructive text-destructive-foreground',
          t.type === 'info'    && 'bg-card border border-border text-foreground',
        )}>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)}><X className="h-3 w-3" /></button>
        </div>
      ))}
    </div>
  );
}

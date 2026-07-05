'use client';

/**
 * lib/wl-toast.ts — Sprint 3
 *
 * Sistema de toasts premium de UI — separado do sistema de notificações.
 * Para feedback imediato de ações: sucesso, erro, recompensa, informação.
 *
 * Uso:
 *   import { toast } from '@/lib/wl-toast';
 *   toast.success('Squad salvo!');
 *   toast.reward('🏆 +150c conquistado!');
 *   toast.error('Créditos insuficientes');
 */

export type ToastType = 'success' | 'error' | 'reward' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  icon?: string;
  duration: number;
};

type Listener = (items: ToastItem[]) => void;

class ToastStore {
  private items: ToastItem[] = [];
  private listeners = new Set<Listener>();
  private counter = 0;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): ToastItem[] {
    return this.items;
  }

  private emit() {
    for (const l of this.listeners) l(this.items);
  }

  add(item: Omit<ToastItem, 'id'>): string {
    const id = `toast-${++this.counter}`;
    this.items = [{ ...item, id }, ...this.items].slice(0, 4);
    this.emit();

    setTimeout(() => this.remove(id), item.duration + 600); // +600 exit anim
    return id;
  }

  remove(id: string): void {
    this.items = this.items.filter((t) => t.id !== id);
    this.emit();
  }
}

export const toastStore = new ToastStore();

// ─── API pública ──────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  reward: '🏆',
  info: 'ℹ',
  warning: '⚠',
};

function push(type: ToastType, message: string, icon?: string, duration = 3200): string {
  return toastStore.add({
    type,
    message,
    icon: icon ?? ICONS[type],
    duration,
  });
}

export const toast = {
  success: (message: string, icon?: string, duration?: number) =>
    push('success', message, icon, duration),
  error: (message: string, icon?: string, duration?: number) =>
    push('error', message, icon, duration),
  reward: (message: string, icon?: string, duration?: number) =>
    push('reward', message, icon, duration ?? 4000),
  info: (message: string, icon?: string, duration?: number) =>
    push('info', message, icon, duration),
  warning: (message: string, icon?: string, duration?: number) =>
    push('warning', message, icon, duration),
  dismiss: (id: string) => toastStore.remove(id),
};

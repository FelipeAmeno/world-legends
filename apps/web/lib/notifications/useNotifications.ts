'use client';

/**
 * lib/notifications/useNotifications.ts — T066
 *
 * Hook React que se conecta ao NotificationStore.
 * Pode ser usado em qualquer componente.
 */

import { useCallback, useEffect, useState } from 'react';
import { getNotificationStore, notify } from './store';
import type { Notification } from './types';

export type UseNotificationsReturn = {
  notifications: Notification[];
  unread: Notification[];
  unreadCount: number;
  hasUnread: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  clearAll: () => void;
  notify: typeof notify;
};

export function useNotifications(): UseNotificationsReturn {
  const store = getNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>(() => store.getAll());

  useEffect(() => {
    const unsub = store.subscribe(setNotifications);
    return unsub;
  }, [store]);

  const unread = notifications.filter((n) => !n.read && !n.dismissed);

  const markRead = useCallback((id: string) => store.markRead(id), [store]);
  const markAllRead = useCallback(() => store.markAllRead(), [store]);
  const dismiss = useCallback((id: string) => store.dismiss(id), [store]);
  const dismissAll = useCallback(() => store.dismissAll(), [store]);
  const clearAll = useCallback(() => store.clearAll(), [store]);

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    hasUnread: unread.length > 0,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
    clearAll,
    notify,
  };
}

/** Hook simplificado só para o badge de contador */
export function useNotificationCount(): number {
  const store = getNotificationStore();
  const [count, setCount] = useState(() => store.getUnreadCount());

  useEffect(() => {
    return store.subscribe((notifs) => {
      setCount(notifs.filter((n) => !n.read && !n.dismissed).length);
    });
  }, [store]);

  return count;
}

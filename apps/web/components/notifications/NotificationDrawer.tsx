'use client';

import { KIND_CONFIG } from '@/lib/notifications/types';
import type { Notification } from '@/lib/notifications/types';
import { useNotifications } from '@/lib/notifications/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

type Props = { onClose: () => void };

type Filter = 'all' | 'unread';

export function NotificationDrawer({ onClose }: Props) {
  const { notifications, unreadCount, markAllRead, markRead, dismiss, dismissAll, clearAll } =
    useNotifications();

  const [filter, setFilter] = useState<Filter>('all');

  const displayed =
    filter === 'unread'
      ? notifications.filter((n) => !n.read && !n.dismissed)
      : notifications.filter((n) => !n.dismissed);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[70] bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer (slides from right on desktop, from top on mobile) */}
      <motion.div
        className={[
          'fixed z-[71] flex flex-col bg-midnight border-border',
          // Mobile: full-width, top (below header)
          'inset-x-0 top-0 bottom-0',
          // Desktop: right sidebar
          'sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 sm:border-l',
        ].join(' ')}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-parchment tracking-wider">NOTIFICAÇÕES</h2>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-parchment text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sub-header: filtros + ações */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
          <div className="flex gap-1">
            {(['all', 'unread'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1 rounded-lg text-[10px] font-bold transition-all',
                  filter === f ? 'bg-surface text-parchment' : 'text-muted hover:text-parchment',
                ].join(' ')}
              >
                {f === 'all' ? 'Todas' : `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Marcar todas
              </button>
            )}
            {displayed.length > 0 && (
              <button
                onClick={dismissAll}
                className="text-[9px] text-muted hover:text-red-400 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
              <span className="text-4xl">🔔</span>
              <p className="text-muted text-sm font-medium">
                {filter === 'unread' ? 'Nenhuma não-lida' : 'Nenhuma notificação'}
              </p>
              <p className="text-muted/50 text-xs">
                {filter === 'unread' ? 'Você está em dia!' : 'As novidades aparecem aqui.'}
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence initial={false}>
                {displayed.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationItem
                      notif={notif}
                      onRead={() => markRead(notif.id)}
                      onDismiss={() => dismiss(notif.id)}
                      onClose={onClose}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.filter((n) => n.dismissed).length > 0 && (
          <div className="shrink-0 px-4 py-3 border-t border-border/50 text-center">
            <button
              onClick={clearAll}
              className="text-[10px] text-muted hover:text-red-400 transition-colors"
            >
              Limpar histórico completo
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onRead,
  onDismiss,
  onClose,
}: {
  notif: Notification;
  onRead: () => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const cfg = KIND_CONFIG[notif.kind];

  function handleClick() {
    onRead();
    if (notif.action) onClose();
  }

  function relativeTime(iso: string): string {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  return (
    <div
      className={[
        'relative border-b border-border/40 px-4 py-3 transition-colors group',
        !notif.read ? 'bg-white/[0.025]' : 'hover:bg-white/[0.015]',
      ].join(' ')}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notif.read && (
        <div
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color }}
        />
      )}

      <div className="flex items-start gap-3 ml-1">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 border"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          {notif.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-xs font-bold leading-tight ${notif.read ? 'text-parchment/70' : 'text-parchment'}`}
            >
              {notif.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 shrink-0"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-muted/70 leading-snug mt-0.5">{notif.body}</p>

          {/* Actions */}
          {(notif.action || notif.action2) && (
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {notif.action && (
                <Link
                  href={notif.action.href}
                  onClick={() => {
                    onRead();
                    onClose();
                  }}
                  className={[
                    'px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all',
                    notif.action.style === 'primary'
                      ? 'text-obsidian'
                      : 'border border-white/15 text-parchment hover:bg-white/5',
                  ].join(' ')}
                  style={
                    notif.action.style === 'primary'
                      ? {
                          background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})`,
                        }
                      : {}
                  }
                >
                  {notif.action.label}
                </Link>
              )}
              {notif.action2 && (
                <Link
                  href={notif.action2.href}
                  onClick={() => {
                    onRead();
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg border border-white/15 text-parchment/70
                             text-[9px] font-bold hover:bg-white/5 transition-colors"
                >
                  {notif.action2.label}
                </Link>
              )}
            </div>
          )}

          {/* Time */}
          <p className="text-[8px] text-muted/40 mt-1">{relativeTime(notif.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

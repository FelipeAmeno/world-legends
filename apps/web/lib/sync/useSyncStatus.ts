'use client';

/**
 * lib/sync/useSyncStatus.ts — T062
 *
 * Hook que expõe o status do SyncEngine para a UI.
 * Usado pelo SyncIndicator para mostrar o estado de sync.
 */

import { useState, useEffect } from 'react';
import { getSyncEngine }       from './SyncEngine';
import type { SyncStatus }     from './types';

export type SyncState = {
  status:     SyncStatus;
  queueSize:  number;
  isOnline:   boolean;
  lastSaved:  number | null;  // timestamp
};

export function useSyncStatus(): SyncState {
  const engine = getSyncEngine();

  const [state, setState] = useState<SyncState>({
    status:    engine.getStatus(),
    queueSize: engine.getQueueSize(),
    isOnline:  engine.getIsOnline(),
    lastSaved: null,
  });

  useEffect(() => {
    const off = engine.on(event => {
      switch (event.kind) {
        case 'status_changed':
          setState(prev => ({ ...prev, status: event.status }));
          break;
        case 'change_saved':
        case 'queue_flushed':
          setState(prev => ({
            ...prev,
            queueSize: engine.getQueueSize(),
            lastSaved: Date.now(),
          }));
          break;
        case 'change_queued':
          setState(prev => ({ ...prev, queueSize: engine.getQueueSize() }));
          break;
        default: break;
      }
    });

    // Atualizar isOnline via listeners nativos
    const handleOnline  = () => setState(prev => ({ ...prev, isOnline:true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline:false }));
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      off();
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [engine]);

  return state;
}

// ─── Formatação amigável para UI ─────────────────────────────────────────────

export type SyncDisplay = {
  icon:     string;
  label:    string;
  color:    string;
  spinning: boolean;
};

export function syncStatusDisplay(s: SyncState): SyncDisplay {
  const relativeTime = (ts: number | null) => {
    if (!ts) return '';
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 5)  return 'agora mesmo';
    if (diff < 60) return `há ${diff}s`;
    return `há ${Math.floor(diff/60)}min`;
  };

  switch (s.status) {
    case 'idle':
      return {
        icon:     '✓',
        label:    s.lastSaved ? `Salvo ${relativeTime(s.lastSaved)}` : 'Salvo',
        color:    'text-emerald-400',
        spinning: false,
      };
    case 'queued':
      return {
        icon:     '○',
        label:    'Aguardando…',
        color:    'text-white/40',
        spinning: false,
      };
    case 'syncing':
      return {
        icon:     '↻',
        label:    'Salvando…',
        color:    'text-blue-400',
        spinning: true,
      };
    case 'retrying':
      return {
        icon:     '↻',
        label:    `Tentando novamente… (${s.queueSize})`,
        color:    'text-yellow-400',
        spinning: true,
      };
    case 'offline':
      return {
        icon:     '📶',
        label:    `Offline · ${s.queueSize} pendente${s.queueSize !== 1 ? 's' : ''}`,
        color:    'text-orange-400',
        spinning: false,
      };
    case 'error':
      return {
        icon:     '⚠',
        label:    'Erro ao salvar',
        color:    'text-red-400',
        spinning: false,
      };
  }
}

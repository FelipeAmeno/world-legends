/**
 * lib/sync/Reconciler.ts — T062
 *
 * Reconcilia estado local (otimista) com estado do servidor
 * após voltar online ou ao detectar divergência.
 *
 * Estratégias por campo:
 *   server_wins   → XP, level, créditos (evitar exploits offline)
 *   local_wins    → squad (última interação local é mais recente)
 *   additive      → wins/draws/losses (somar deltas)
 *   union         → conquistas, coleção (nunca remover)
 *   max           → packs_opened, total_cards (usar o maior)
 */

import type { UserRecord } from '@world-legends/persistence';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ReconcileResult<T> = {
  merged:  T;
  changed: string[];   // campos que foram alterados pela reconciliação
};

export type LocalUserSnapshot = {
  level:       number;
  current_xp:  number;
  xp_for_next: number;
  credits:     number;
  fragments:   number;
  wins:        number;
  draws:       number;
  losses:      number;
  total_cards: number;
  packs_opened:number;
};

// ─── User reconciliation ──────────────────────────────────────────────────────

/**
 * Reconcilia o perfil do usuário entre local e servidor.
 *
 * Regras:
 *   - level/xp/credits/fragments → server_wins (autoridade no banco)
 *   - wins/draws/losses          → max (não perder vitórias já contadas)
 *   - total_cards/packs_opened   → max
 *
 * Chamado ao voltar online após período offline.
 */
export function reconcileUser(
  local:  LocalUserSnapshot,
  server: UserRecord,
): ReconcileResult<Partial<UserRecord>> {
  const merged:  Partial<UserRecord> = {};
  const changed: string[]            = [];

  // server_wins: XP, level, créditos (protege contra exploits)
  for (const field of ['level', 'current_xp', 'xp_for_next', 'credits', 'fragments'] as const) {
    merged[field] = server[field];
    if (local[field] !== server[field]) changed.push(field);
  }

  // max: wins/draws/losses (nunca perder placar já gravado)
  for (const field of ['wins', 'draws', 'losses', 'total_cards', 'packs_opened'] as const) {
    const winner = Math.max(local[field], server[field]);
    merged[field] = winner;
    if (winner !== server[field]) changed.push(field);
  }

  return { merged, changed };
}

// ─── Achievement reconciliation ───────────────────────────────────────────────

/**
 * Reconcilia conquistas: union (nunca remover).
 * summary: Record<achievementId, maxStage>
 */
export function reconcileAchievements(
  local:  Record<string, number>,
  server: Record<string, number>,
): ReconcileResult<Record<string, number>> {
  const merged:  Record<string, number> = { ...server };
  const changed: string[]               = [];

  for (const [id, stage] of Object.entries(local)) {
    if ((merged[id] ?? 0) < stage) {
      merged[id] = stage;
      changed.push(id);
    }
  }

  return { merged, changed };
}

// ─── Squad reconciliation ─────────────────────────────────────────────────────

/**
 * Squad: local_wins (última interação do usuário é mais recente)
 * Retorna sempre o estado local — mas registra se são diferentes.
 */
export function reconcileSquad<T extends { updated_at?: string }>(
  local:  T,
  server: T | null,
): ReconcileResult<T> {
  if (!server) return { merged: local, changed: [] };

  // Comparar timestamps se disponíveis
  const localTs  = local.updated_at  ? new Date(local.updated_at).getTime()  : Date.now();
  const serverTs = server.updated_at ? new Date(server.updated_at).getTime() : 0;

  if (localTs >= serverTs) {
    // Local é mais recente → local_wins
    return { merged: local, changed: [] };
  }

  // Servidor é mais recente (ex: outro dispositivo) → server_wins
  return { merged: server, changed: ['squad'] };
}

// ─── Delta tracker ────────────────────────────────────────────────────────────

/**
 * Rastreia deltas de stats durante período offline.
 * Usado para enviar incrementos (não valores absolutos) ao voltar online.
 */
export class OfflineDeltaTracker {
  private deltas: {
    wins:   number;
    draws:  number;
    losses: number;
    xp:     number;
    credits:number;
  } = { wins:0, draws:0, losses:0, xp:0, credits:0 };

  addMatch(outcome: 'win' | 'draw' | 'loss', xp: number, credits: number): void {
    this.deltas[outcome]++;
    this.deltas.xp      += xp;
    this.deltas.credits += credits;
  }

  addReward(xp: number, credits: number): void {
    this.deltas.xp      += xp;
    this.deltas.credits += credits;
  }

  get snapshot() { return { ...this.deltas }; }

  hasChanges(): boolean {
    return Object.values(this.deltas).some(v => v > 0);
  }

  reset(): void {
    this.deltas = { wins:0, draws:0, losses:0, xp:0, credits:0 };
  }
}

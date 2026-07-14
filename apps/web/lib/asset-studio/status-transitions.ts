/**
 * lib/asset-studio/status-transitions.ts — Sprint 43A (Asset Studio Foundation)
 *
 * ÚNICO mapa de transição de status de job — nenhuma outra parte do
 * código (service layer, server actions, UI) decide isso sozinha. Espelha
 * o contrato do brief da sprint, com uma adaptação: `needs_review` pode
 * voltar direto pra `queued` (pedir nova geração) além de
 * `approved`/`rejected`, e `approved`/`rejected`/`failed` podem voltar
 * pra `queued` (reprocessar) — igual ao exemplo do brief.
 */

import type { JobStatus } from './domain-types';

export const JOB_STATUS_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  draft: ['queued', 'cancelled'],
  queued: ['generating', 'cancelled', 'failed'],
  generating: ['generated', 'failed'],
  generated: ['validating', 'failed'],
  validating: ['needs_review', 'failed'],
  needs_review: ['approved', 'rejected', 'queued'],
  approved: ['published', 'queued'],
  rejected: ['queued', 'cancelled'],
  failed: ['queued', 'cancelled'],
  published: [],
  cancelled: [],
};

export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = ['published', 'cancelled'];

export function isTerminalJobStatus(status: JobStatus): boolean {
  return TERMINAL_JOB_STATUSES.includes(status);
}

export function canTransitionJobStatus(from: JobStatus, to: JobStatus): boolean {
  return JOB_STATUS_TRANSITIONS[from].includes(to);
}

export type TransitionResult = { ok: true } | { ok: false; error: string };

/** Valida uma transição — nunca lança exceção, sempre retorna um resultado tipado. */
export function assertJobStatusTransition(from: JobStatus, to: JobStatus): TransitionResult {
  if (from === to) {
    return { ok: false, error: `transição inválida: "${from}" → "${to}" (mesmo status)` };
  }
  if (!canTransitionJobStatus(from, to)) {
    return {
      ok: false,
      error: `transição inválida: "${from}" → "${to}" (permitidas a partir de "${from}": ${JOB_STATUS_TRANSITIONS[from].join(', ') || 'nenhuma — status terminal'})`,
    };
  }
  return { ok: true };
}

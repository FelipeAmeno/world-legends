/**
 * lib/asset-studio/ui-eligibility.ts — Sprint 43B fix (post-smoke-test)
 *
 * Elegibilidade de ações da UI do Asset Studio, extraída como funções puras
 * (sem React) pra serem testáveis isoladamente. Antes desta correção,
 * `JobDetailView.tsx` renderizava os botões Aprovar/Rejeitar/Pedir
 * revisão/Publicar incondicionalmente, e o cabeçalho da seção de
 * candidates era um texto fixo ("staging, não aprovado") que nunca
 * refletia o estado real — o que permitiu, num smoke test real, aprovar e
 * publicar um candidate sem nenhum aviso de estado inconsistente na tela.
 * Estas funções são a fonte única de verdade pra quando cada ação é
 * elegível — nunca reimplementadas inline no componente.
 */

import type { AssetCandidate, AssetGenerationJob } from './domain-types';

/** Publicar só é válido a partir de `approved` com um candidate já aprovado (mesma regra de `service.markJobPublished`/`status-transitions.ts`). */
export function canPublishJob(
  job: Pick<AssetGenerationJob, 'status' | 'approvedCandidateId'>,
): boolean {
  return job.status === 'approved' && Boolean(job.approvedCandidateId);
}

/**
 * Aprovar/rejeitar/pedir revisão só é válido com o job em `needs_review`
 * e o candidate `pending` OU `needs_revision` (Sprint 43C — um candidate
 * que voltou de um pedido de revisão anterior continua revisável se o
 * job voltar a `needs_review`; só `approved`/`rejected` — decisões já
 * tomadas — ficam definitivamente fora). Mesma regra usada por
 * `service.approveCandidate`/`rejectCandidate`/`requestRevision` no
 * servidor — nunca reimplementada separadamente.
 */
export function canReviewCandidate(
  job: Pick<AssetGenerationJob, 'status'>,
  candidate: Pick<AssetCandidate, 'reviewStatus'>,
): boolean {
  return (
    job.status === 'needs_review' &&
    (candidate.reviewStatus === 'pending' || candidate.reviewStatus === 'needs_revision')
  );
}

/** Rótulo seguro da seção de candidates — sempre reflete `job.status`/`approvedCandidateId` reais, nunca um texto fixo. */
export function candidateSectionLabel(
  job: Pick<AssetGenerationJob, 'status' | 'approvedCandidateId'>,
): string {
  if (job.status === 'published') return 'publicado';
  if (job.approvedCandidateId) return 'aprovado, aguardando publicação';
  return 'staging, não aprovado';
}

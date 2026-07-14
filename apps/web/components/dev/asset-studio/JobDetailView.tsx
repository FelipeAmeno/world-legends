'use client';

/**
 * components/dev/asset-studio/JobDetailView.tsx — Sprint 43A (Asset Studio Foundation)
 *
 * Inspeciona um job: template/reference-set usados, attempts, candidates,
 * reviews — e permite mover jobs de FIXTURE por estados seguros de teste
 * (queue/cancel/approve/reject/request-revision/publish). Nenhum botão
 * aqui chama um provedor de geração de imagem real.
 */

import {
  approveCandidateAction,
  cancelJobAction,
  markJobPublishedAction,
  queueJobAction,
  rejectCandidateAction,
  requestRevisionAction,
} from '@/lib/actions/asset-studio';
import type { JobDetails } from '@/lib/asset-studio/domain-types';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function JobDetailView({ details }: { details: JobDetails }) {
  const { job, promptTemplate, referenceSet, attempts, candidates, reviewsByCandidateId } = details;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setActionError(result.error ?? 'ação falhou');
      router.refresh();
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
          Ferramenta interna — incompleta
        </span>
        <h1 className="font-display text-2xl text-parchment mt-1">
          {job.artworkPresetId} · {job.playerId}
        </h1>
        <p className="text-muted text-xs mt-1">
          {job.rarity} · schema v{job.artworkSchemaVersion} · status atual:{' '}
          <strong className="text-parchment">{job.status}</strong>
        </p>
      </div>

      {actionError && (
        <p className="text-red-400 text-xs glass rounded-lg p-3 border border-red-900/40">
          {actionError}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => queueJobAction(job.id))}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
        >
          Mover pra "queued"
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => cancelJobAction(job.id))}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
        >
          Cancelar job
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => markJobPublishedAction(job.id))}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
        >
          Marcar publicado (exige candidate aprovado)
        </button>
      </div>

      <Section title="Auditoria">
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="text-muted">Criado por</dt>
          <dd className="text-parchment">{job.createdBy ?? '—'}</dd>
          <dt className="text-muted">Prompt template</dt>
          <dd className="text-parchment">
            {promptTemplate ? `${promptTemplate.name} v${promptTemplate.templateVersion}` : '—'}
          </dd>
          <dt className="text-muted">Reference set</dt>
          <dd className="text-parchment">
            {referenceSet ? `${referenceSet.name} v${referenceSet.version}` : '—'}
          </dd>
          <dt className="text-muted">Candidate aprovado</dt>
          <dd className="text-parchment">{job.approvedCandidateId ?? '—'}</dd>
          <dt className="text-muted">Publicado em</dt>
          <dd className="text-parchment">{job.completedAt ?? '—'}</dd>
        </dl>
      </Section>

      <Section title={`Attempts (${attempts.length})`}>
        {attempts.length === 0 && <p className="text-muted text-xs">Nenhum attempt ainda.</p>}
        {attempts.map((a) => (
          <div key={a.id} className="glass rounded-lg p-3 text-xs mb-2 border border-border">
            <p className="text-parchment font-bold">
              #{a.attemptNumber} · {a.status} · provider: {a.provider}
            </p>
            <p className="text-muted mt-1">
              {a.startedAt ?? '—'} → {a.completedAt ?? a.failedAt ?? 'em andamento'}
            </p>
          </div>
        ))}
      </Section>

      <Section title={`Candidates (${candidates.length})`}>
        {candidates.length === 0 && <p className="text-muted text-xs">Nenhum candidate ainda.</p>}
        {candidates.map((c) => (
          <div key={c.id} className="glass rounded-lg p-3 text-xs mb-2 border border-border">
            <p className="text-parchment font-bold">
              variante {c.variantIndex} · {c.reviewStatus} · {c.storagePath}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => approveCandidateAction(job.id, c.id, null))}
                className="px-2 py-1 rounded bg-emerald-800/60 text-emerald-200"
              >
                Aprovar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => rejectCandidateAction(job.id, c.id, null, []))}
                className="px-2 py-1 rounded bg-red-900/60 text-red-200"
              >
                Rejeitar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => requestRevisionAction(job.id, c.id, null, []))}
                className="px-2 py-1 rounded bg-amber-900/60 text-amber-200"
              >
                Pedir revisão
              </button>
            </div>
            {(reviewsByCandidateId[c.id]?.length ?? 0) > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2 space-y-1">
                {reviewsByCandidateId[c.id]?.map((r) => (
                  <p key={r.id} className="text-muted">
                    {r.decision} · {r.notes ?? 'sem notas'} · {r.createdAt}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-muted mb-2">{title}</p>
      {children}
    </section>
  );
}

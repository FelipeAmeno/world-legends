'use client';

/**
 * components/dev/asset-studio/AssetStudioExperience.tsx — Sprint 43A
 * (Asset Studio Foundation) + Sprint 43B (Gemini Nano Banana Image Provider)
 *
 * Lista de jobs + filtro de status + formulário de criação de draft job +
 * indicador seguro de status do provedor. Ferramenta interna,
 * claramente incompleta — nenhum botão NESTE arquivo chama um provedor
 * de geração de imagem (o Generate real fica em `JobDetailView.tsx`,
 * por job).
 */

import {
  createDraftJobAction,
  getProviderStatusAction,
  listJobsAction,
} from '@/lib/actions/asset-studio';
import type { AssetGenerationJob, JobStatus } from '@/lib/asset-studio/domain-types';
import { MAX_REQUESTED_VARIANTS, MIN_REQUESTED_VARIANTS } from '@/lib/asset-studio/job-validation';
import type { ProviderStatusInfo } from '@/lib/asset-studio/provider-config';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

const STATUS_OPTIONS: Array<JobStatus | 'all'> = [
  'all',
  'draft',
  'queued',
  'generating',
  'generated',
  'validating',
  'needs_review',
  'approved',
  'rejected',
  'failed',
  'published',
  'cancelled',
];

type Props = { initialJobs: AssetGenerationJob[] };

export function AssetStudioExperience({ initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusInfo | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getProviderStatusAction().then(setProviderStatus);
  }, []);

  const filtered = statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

  function refresh(status?: JobStatus) {
    startTransition(async () => {
      const result = await listJobsAction(status ? { status } : undefined);
      if (result.ok) setJobs(result.data);
    });
  }

  async function handleCreate(formData: FormData) {
    setFormError(null);
    const input = {
      artworkPresetId: String(formData.get('artworkPresetId') ?? ''),
      playerId: String(formData.get('playerId') ?? ''),
      rarity: String(formData.get('rarity') ?? ''),
      promptTemplateId: String(formData.get('promptTemplateId') ?? ''),
      referenceSetId: String(formData.get('referenceSetId') ?? ''),
      requestedVariants: Number(formData.get('requestedVariants') ?? 1),
      identityNotes: String(formData.get('identityNotes') ?? ''),
    };
    const result = await createDraftJobAction(input);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormOpen(false);
    refresh();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
          Ferramenta interna — incompleta
        </span>
        <h1 className="font-display text-2xl text-parchment mt-1">Asset Studio</h1>
        <p className="text-muted text-xs mt-1">
          Geração real acontece por job (abra um job em "queued" pra ver o botão Generate). Nenhum
          candidate é aprovado ou publicado automaticamente.
        </p>
        {providerStatus && (
          <p className="text-[10px] mt-1.5">
            Provedor de imagem:{' '}
            <span
              className={
                providerStatus.status === 'configured'
                  ? 'text-emerald-400 font-bold'
                  : providerStatus.status === 'disabled'
                    ? 'text-muted'
                    : 'text-red-400 font-bold'
              }
            >
              {providerStatus.status === 'configured'
                ? `Provider configured (${providerStatus.providerName})`
                : providerStatus.status === 'disabled'
                  ? 'Provider disabled'
                  : 'Provider unavailable'}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value as JobStatus | 'all';
            setStatusFilter(value);
            refresh(value === 'all' ? undefined : value);
          }}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-parchment"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'Todos os status' : s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="px-3 py-2 rounded-lg bg-gold-dim text-obsidian text-xs font-bold"
        >
          {formOpen ? 'Cancelar' : '+ Criar draft job'}
        </button>
        {isPending && <span className="text-muted text-xs">atualizando…</span>}
      </div>

      {formOpen && (
        <form action={handleCreate} className="glass rounded-xl p-4 space-y-3 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted">Novo draft job</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="artworkPresetId"
              placeholder="artwork preset id"
              required
              className="field"
            />
            <input name="playerId" placeholder="player id" required className="field" />
            <input name="rarity" placeholder="rarity" required className="field" />
            <input
              name="requestedVariants"
              type="number"
              min={MIN_REQUESTED_VARIANTS}
              max={MAX_REQUESTED_VARIANTS}
              defaultValue={1}
              className="field"
            />
            <input
              name="promptTemplateId"
              placeholder="prompt template id"
              required
              className="field"
            />
            <input
              name="referenceSetId"
              placeholder="reference set id"
              required
              className="field"
            />
          </div>
          <textarea
            name="identityNotes"
            placeholder="identity notes (opcional)"
            className="field w-full"
            rows={2}
          />
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold"
          >
            Criar (status: draft)
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-muted text-sm py-8 text-center">Nenhum job encontrado.</p>
        )}
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/dev/asset-studio/${job.id}`}
            className="flex items-center justify-between glass rounded-xl px-4 py-3 border border-border hover:border-gold-dim/50 transition-colors"
          >
            <div>
              <p className="text-parchment text-sm font-semibold">
                {job.artworkPresetId} · {job.playerId}
              </p>
              <p className="text-muted text-[10px]">
                {job.rarity} · schema v{job.artworkSchemaVersion} · {job.requestedVariants}{' '}
                variante(s)
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-white/5 text-parchment">
              {job.status}
            </span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .field {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          color: #f1e9d8;
        }
      `}</style>
    </div>
  );
}

'use client';

/**
 * components/dev/asset-studio/JobDetailView.tsx — Sprint 43A (Asset Studio Foundation)
 * + Sprint 43B (Gemini Nano Banana Image Provider)
 *
 * Inspeciona um job: template/reference-set usados, attempts, candidates,
 * reviews — e permite mover jobs de FIXTURE por estados seguros de teste
 * (queue/cancel/approve/reject/request-revision/publish), MAIS agora um
 * botão real de Generate (fake provider em dev/test, Gemini em produção
 * configurada) com confirmação, estado "gerando", miniaturas dos
 * candidates, e retry pra jobs falhos. Nenhum candidate é aprovado ou
 * publicado automaticamente — sempre exige ação humana explícita.
 */

import {
  approveCandidateAction,
  cancelJobAction,
  generateAttemptAction,
  getCandidateImageDataUrlAction,
  getProviderStatusAction,
  markJobPublishedAction,
  queueJobAction,
  rejectCandidateAction,
  requestRevisionAction,
  runTechnicalValidationAction,
} from '@/lib/actions/asset-studio';
import type { JobDetails } from '@/lib/asset-studio/domain-types';
import type { ProviderStatusInfo } from '@/lib/asset-studio/provider-config';
import {
  canPublishJob,
  canReviewCandidate,
  candidateSectionLabel,
} from '@/lib/asset-studio/ui-eligibility';
import { HUMAN_ISSUE_CODES, type HumanIssueCode } from '@/lib/asset-studio/visual-validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export function JobDetailView({ details }: { details: JobDetails }) {
  const { job, promptTemplate, referenceSet, attempts, candidates, reviewsByCandidateId } = details;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusInfo | null>(null);
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getProviderStatusAction().then(setProviderStatus);
  }, []);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setActionError(result.error ?? 'ação falhou');
      router.refresh();
    });
  }

  function handleGenerate() {
    setConfirmingGenerate(false);
    setActionError(null);
    setGenerating(true);
    startTransition(async () => {
      const result = await generateAttemptAction(job.id);
      setGenerating(false);
      if (!result.ok) setActionError(result.error ?? 'geração falhou');
      router.refresh();
    });
  }

  const canGenerate =
    job.status === 'queued' &&
    providerStatus?.status === 'configured' &&
    Boolean(promptTemplate?.active) &&
    Boolean(referenceSet?.active);

  const canRetry = job.status === 'failed';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <JobHeader job={job} providerStatus={providerStatus} />

      {actionError && (
        <p className="text-red-400 text-xs glass rounded-lg p-3 border border-red-900/40">
          {actionError}
        </p>
      )}

      <GenerateControls
        job={job}
        providerStatus={providerStatus}
        isPending={isPending}
        generating={generating}
        canGenerate={canGenerate}
        canRetry={canRetry}
        canPublish={canPublishJob(job)}
        confirmingGenerate={confirmingGenerate}
        onQueue={() => run(() => queueJobAction(job.id))}
        onCancel={() => run(() => cancelJobAction(job.id))}
        onPublish={() => run(() => markJobPublishedAction(job.id))}
        onRequestGenerate={() => setConfirmingGenerate(true)}
        onConfirmGenerate={handleGenerate}
        onCancelGenerate={() => setConfirmingGenerate(false)}
      />

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
              {a.model ? ` · model: ${a.model}` : ''}
            </p>
            <p className="text-muted mt-1">
              {a.startedAt ?? '—'} → {a.completedAt ?? a.failedAt ?? 'em andamento'}
            </p>
            {a.status === 'failed' && a.errorCode && (
              <p className="text-red-400 mt-1">
                {a.errorCode}: {a.errorMessage}
              </p>
            )}
            {a.status === 'failed' && <SafeAttemptDiagnostics usageMetadata={a.usageMetadata} />}
          </div>
        ))}
      </Section>

      <Section title={`Candidates (${candidates.length}) — ${candidateSectionLabel(job)}`}>
        <p className="text-[10px] text-muted mb-2">
          "Tecnicamente válido" (validação automática), "aprovado" (decisão humana) e "publicado"
          (só status de auditoria — nunca move arquivo, nunca roda cards:build) são estados
          separados. Múltiplas variantes ficam lado a lado abaixo pra comparação visual.
        </p>
        {candidates.length === 0 && <p className="text-muted text-xs">Nenhum candidate ainda.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              reviews={reviewsByCandidateId[c.id] ?? []}
              isPending={isPending}
              canReview={canReviewCandidate(job, c)}
              onApprove={() => run(() => approveCandidateAction(job.id, c.id, null))}
              onReject={(notes, issueCodes) =>
                run(() => rejectCandidateAction(job.id, c.id, notes, issueCodes))
              }
              onRequestRevision={(notes, issueCodes) =>
                run(() => requestRevisionAction(job.id, c.id, notes, issueCodes))
              }
              onRunValidation={() => run(() => runTechnicalValidationAction(c.id))}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

/**
 * Diagnóstico de falha de provedor — SÓ campos individualmente
 * allowlisted do metadata de uso (Sprint 43B.1, pós-smoke-test real de
 * rate limit sem diagnóstico nenhum). Nunca serializa ou espalha o
 * objeto inteiro na tela — cada campo é lido e validado por nome, então
 * um campo inesperado (chave, header, corpo bruto) nunca teria como
 * chegar na tela mesmo que acidentalmente persistido.
 */
function SafeAttemptDiagnostics({ usageMetadata }: { usageMetadata: Record<string, unknown> }) {
  const httpStatus = typeof usageMetadata.httpStatus === 'number' ? usageMetadata.httpStatus : null;
  const googleErrorStatus =
    typeof usageMetadata.googleErrorStatus === 'string' ? usageMetadata.googleErrorStatus : null;
  const rateLimitCategory =
    typeof usageMetadata.rateLimitCategory === 'string' ? usageMetadata.rateLimitCategory : null;
  const retryAfterSeconds =
    typeof usageMetadata.retryAfterSeconds === 'number' ? usageMetadata.retryAfterSeconds : null;
  const model = typeof usageMetadata.model === 'string' ? usageMetadata.model : null;

  const rows: Array<[string, string]> = [];
  if (httpStatus !== null) rows.push(['HTTP status', String(httpStatus)]);
  if (googleErrorStatus) rows.push(['Google status', googleErrorStatus]);
  if (rateLimitCategory) rows.push(['Quota type', rateLimitCategory]);
  if (retryAfterSeconds !== null) rows.push(['Retry after', `${retryAfterSeconds}s`]);
  if (model) rows.push(['Model', model]);

  if (rows.length === 0) return null;

  return (
    <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd className="text-parchment">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function providerStatusLabel(providerStatus: ProviderStatusInfo): {
  text: string;
  className: string;
} {
  if (providerStatus.status === 'configured') {
    return {
      text: `configurado (${providerStatus.providerName}${providerStatus.modelLabel ? ` · ${providerStatus.modelLabel}` : ''})`,
      className: 'text-emerald-400',
    };
  }
  if (providerStatus.status === 'disabled') {
    return { text: 'desabilitado', className: 'text-muted' };
  }
  return { text: 'indisponível', className: 'text-red-400' };
}

function JobHeader({
  job,
  providerStatus,
}: {
  job: JobDetails['job'];
  providerStatus: ProviderStatusInfo | null;
}) {
  const label = providerStatus ? providerStatusLabel(providerStatus) : null;
  return (
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
      {label && (
        <p className="text-[10px] mt-1">
          Provedor: <span className={label.className}>{label.text}</span>
        </p>
      )}
    </div>
  );
}

function GenerateControls({
  job,
  providerStatus,
  isPending,
  generating,
  canGenerate,
  canRetry,
  canPublish,
  confirmingGenerate,
  onQueue,
  onCancel,
  onPublish,
  onRequestGenerate,
  onConfirmGenerate,
  onCancelGenerate,
}: {
  job: JobDetails['job'];
  providerStatus: ProviderStatusInfo | null;
  isPending: boolean;
  generating: boolean;
  canGenerate: boolean;
  canRetry: boolean;
  canPublish: boolean;
  confirmingGenerate: boolean;
  onQueue: () => void;
  onCancel: () => void;
  onPublish: () => void;
  onRequestGenerate: () => void;
  onConfirmGenerate: () => void;
  onCancelGenerate: () => void;
}) {
  return (
    <>
      <div className="flex gap-2 flex-wrap items-center">
        <button
          type="button"
          disabled={isPending}
          onClick={onQueue}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
        >
          Mover pra "queued"
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
        >
          Cancelar job
        </button>
        {canPublish && (
          <button
            type="button"
            disabled={isPending}
            onClick={onPublish}
            title="Só marca um status de auditoria no banco — nunca copia arquivo pra source/artworks, nunca roda cards:build, nunca faz deploy. O jogo não vê nenhuma mudança."
            className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
          >
            Marcar publicado (placeholder de status — não publica de verdade)
          </button>
        )}

        {canGenerate && (
          <button
            type="button"
            disabled={isPending || generating}
            onClick={onRequestGenerate}
            className="px-3 py-1.5 rounded-lg bg-gold-dim text-obsidian text-xs font-bold"
          >
            {generating ? 'Gerando…' : '✨ Generate'}
          </button>
        )}
        {canRetry && (
          <button
            type="button"
            disabled={isPending}
            onClick={onQueue}
            className="px-3 py-1.5 rounded-lg bg-amber-800/60 text-amber-100 text-xs font-bold"
          >
            🔁 Retry (volta pra queued)
          </button>
        )}
      </div>

      {confirmingGenerate && (
        <div className="glass rounded-xl p-4 border border-gold-dim/40 space-y-3">
          <p className="text-parchment text-xs">
            Confirmar geração via <strong>{providerStatus?.providerName}</strong>
            {providerStatus?.modelLabel ? ` (${providerStatus.modelLabel})` : ''}? Isso cria um novo
            attempt e {job.requestedVariants} variante(s) em <strong>staging</strong> — nenhum
            candidate é aprovado ou publicado automaticamente.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirmGenerate}
              className="px-3 py-1.5 rounded-lg bg-gold-dim text-obsidian text-xs font-bold"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={onCancelGenerate}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-parchment text-xs font-bold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type ValidationStatus = 'not-run' | 'passed' | 'passed-with-warnings' | 'failed';

const VALIDATION_STATUS_LABEL: Record<ValidationStatus, { text: string; className: string }> = {
  'not-run': { text: 'validação técnica não rodada', className: 'text-muted' },
  passed: { text: 'tecnicamente válido', className: 'text-emerald-400' },
  'passed-with-warnings': { text: 'tecnicamente válido (com avisos)', className: 'text-amber-400' },
  failed: { text: 'validação técnica falhou', className: 'text-red-400' },
};

/** Nunca confia cegamente no shape — `technicalValidation` é `Record<string, unknown>` até ser lido aqui campo a campo. */
function readValidationStatus(technicalValidation: Record<string, unknown>): {
  status: ValidationStatus;
  warnings: string[];
  errors: string[];
} {
  const passed = technicalValidation.passed;
  const warnings = Array.isArray(technicalValidation.warnings)
    ? (technicalValidation.warnings as string[])
    : [];
  const errors = Array.isArray(technicalValidation.errors)
    ? (technicalValidation.errors as string[])
    : [];
  if (typeof passed !== 'boolean') return { status: 'not-run', warnings, errors };
  if (!passed) return { status: 'failed', warnings, errors };
  return { status: warnings.length > 0 ? 'passed-with-warnings' : 'passed', warnings, errors };
}

function CandidateCard({
  candidate,
  reviews,
  isPending,
  canReview,
  onApprove,
  onReject,
  onRequestRevision,
  onRunValidation,
}: {
  candidate: JobDetails['candidates'][number];
  reviews: JobDetails['reviewsByCandidateId'][string];
  isPending: boolean;
  canReview: boolean;
  onApprove: () => void;
  onReject: (notes: string | null, issueCodes: HumanIssueCode[]) => void;
  onRequestRevision: (notes: string | null, issueCodes: HumanIssueCode[]) => void;
  onRunValidation: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<'reject' | 'revision' | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedIssueCodes, setSelectedIssueCodes] = useState<HumanIssueCode[]>([]);

  useEffect(() => {
    getCandidateImageDataUrlAction(candidate.id).then((result) => {
      if (result.ok) setDataUrl(result.dataUrl);
    });
  }, [candidate.id]);

  function toggleIssueCode(code: HumanIssueCode) {
    setSelectedIssueCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function resetReviewForm() {
    setReviewForm(null);
    setNotes('');
    setSelectedIssueCodes([]);
  }

  function submitReviewForm() {
    const trimmedNotes = notes.trim() ? notes.trim() : null;
    if (reviewForm === 'reject') onReject(trimmedNotes, selectedIssueCodes);
    if (reviewForm === 'revision') onRequestRevision(trimmedNotes, selectedIssueCodes);
    resetReviewForm();
  }

  const {
    status: validationStatus,
    warnings,
    errors,
  } = readValidationStatus(candidate.technicalValidation);
  const validationLabel = VALIDATION_STATUS_LABEL[validationStatus];

  return (
    <div className="glass rounded-lg p-2 text-xs border border-border space-y-2">
      <div className="relative rounded overflow-hidden" style={{ aspectRatio: '2/3' }}>
        {dataUrl ? (
          // Data URL de staging, não asset de produção — <img> simples é
          // intencional aqui (next/image exige um domínio/loader configurado).
          <img
            src={dataUrl}
            alt={`variante ${candidate.variantIndex} — staging, não aprovado`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        )}
        <span className="absolute top-1 left-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/70 text-amber-300">
          staging
        </span>
      </div>

      <p className="text-parchment font-bold">
        variante {candidate.variantIndex} · {candidate.reviewStatus}
      </p>

      <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted">
        <dt>Dimensões</dt>
        <dd className="text-parchment">
          {candidate.width && candidate.height ? `${candidate.width}×${candidate.height}` : '—'}
        </dd>
        <dt>Formato</dt>
        <dd className="text-parchment">{candidate.mimeType}</dd>
        <dt>Tamanho</dt>
        <dd className="text-parchment">
          {candidate.fileSize ? `${Math.round(candidate.fileSize / 1024)} KB` : '—'}
        </dd>
        <dt>Checksum</dt>
        <dd className="text-parchment font-mono">
          {candidate.checksum ? `${candidate.checksum.slice(0, 10)}…` : '—'}
        </dd>
      </dl>

      <p className={`text-[10px] font-bold ${validationLabel.className}`}>{validationLabel.text}</p>
      {errors.length > 0 && (
        <ul className="text-[10px] text-red-400 list-disc list-inside space-y-0.5">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="text-[10px] text-amber-400 list-disc list-inside space-y-0.5">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={onRunValidation}
        className="px-2 py-1 rounded bg-white/10 text-parchment text-[10px]"
      >
        Rodar validação técnica
      </button>

      {canReview && !reviewForm && (
        <div className="flex gap-1 mt-2 flex-wrap">
          <button
            type="button"
            disabled={isPending}
            onClick={onApprove}
            className="px-2 py-1 rounded bg-emerald-800/60 text-emerald-200"
          >
            Aprovar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setReviewForm('reject')}
            className="px-2 py-1 rounded bg-red-900/60 text-red-200"
          >
            Rejeitar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setReviewForm('revision')}
            className="px-2 py-1 rounded bg-amber-900/60 text-amber-200"
          >
            Revisão
          </button>
        </div>
      )}

      {canReview && reviewForm && (
        <div className="mt-2 border border-white/10 rounded-lg p-2 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted">
            {reviewForm === 'reject' ? 'Rejeitar' : 'Pedir revisão — exige notas ou issue code'}
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="notas (opcional pra rejeitar; obrigatório pra revisão se nenhum issue code for marcado)"
            className="w-full text-[10px] bg-white/5 border border-white/10 rounded p-1"
            rows={2}
          />
          <div className="flex flex-wrap gap-1">
            {HUMAN_ISSUE_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleIssueCode(code)}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${
                  selectedIssueCodes.includes(code)
                    ? 'bg-gold-dim text-obsidian border-gold-dim'
                    : 'border-white/10 text-muted'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={submitReviewForm}
              className="px-2 py-1 rounded bg-white/10 text-parchment"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={resetReviewForm}
              className="px-2 py-1 rounded bg-white/5 text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-2 border-t border-white/5 pt-2 space-y-1">
          {reviews.map((r) => (
            <p key={r.id} className="text-muted">
              {r.decision} · {r.notes ?? 'sem notas'}
              {r.issueCodes.length > 0 ? ` · [${r.issueCodes.join(', ')}]` : ''}
            </p>
          ))}
        </div>
      )}
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

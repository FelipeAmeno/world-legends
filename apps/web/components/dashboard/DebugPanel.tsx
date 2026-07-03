/**
 * DebugPanel — wrapper reutilizável para painéis do dashboard de debug.
 * Tema: terminal escuro, fonte mono, bordas sutis.
 */

type Props = {
  title: string;
  status?: string;
  statusOk?: boolean;
  tag?: string;
  children: React.ReactNode;
  mono?: boolean;
};

export function DebugPanel({ title, status, statusOk, tag, children, mono }: Props) {
  return (
    <div className="bg-[#080d0b] border border-[#1a2620] rounded-xl overflow-hidden">
      {/* Header barra */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a2620] bg-[#0a110e]">
        {/* Dots estilo terminal */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-700/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-700/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-700/80" />
        </div>

        <span className="font-mono text-[10px] text-emerald-400/80 ml-2 font-bold tracking-wider">
          {title}
        </span>

        {tag && (
          <span className="text-[8px] font-mono text-muted border border-border/30 rounded px-1 py-px">
            {tag}
          </span>
        )}

        {status && (
          <span
            className={[
              'ml-auto text-[9px] font-mono font-bold',
              statusOk ? 'text-emerald-400' : 'text-red-400',
            ].join(' ')}
          >
            {status}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className={`p-4 ${mono ? 'font-mono' : ''}`}>{children}</div>
    </div>
  );
}

// ─── MonoRow — linha de dados formato key: value ──────────────────────────────

export function MonoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className="text-muted text-[10px] font-mono w-28 shrink-0">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${color ?? 'text-emerald-400'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── InlineBar — barra compacta para métricas ─────────────────────────────────

export function InlineBar({
  pct,
  color = 'bg-emerald-500',
  label,
  value,
}: {
  pct: number;
  color?: string;
  label?: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[9px] font-mono text-muted w-20 shrink-0">{label}</span>}
      <div className="flex-1 h-1.5 bg-[#0d1a14] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {value !== undefined && (
        <span className="text-[9px] font-mono text-emerald-400 w-10 text-right shrink-0">
          {value}
        </span>
      )}
    </div>
  );
}

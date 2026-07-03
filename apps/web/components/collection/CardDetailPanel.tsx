import { AttributeBar } from '@/components/ui/AttributeBar';
import { OvrDisplay } from '@/components/ui/OvrDisplay';
import { RarityBadge } from '@/components/ui/RarityBadge';
/**
 * CardDetailPanel — painel lateral com todos os detalhes de uma carta.
 *
 * Puro componente de apresentação. Recebe `CollectionCard` (DTO do domínio).
 * Usa RarityBadge, OvrDisplay, AttributeBar — todos reutilizáveis.
 */
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';

type Props = {
  card: CollectionCard | null;
  onClose: () => void;
};

export function CardDetailPanel({ card, onClose }: Props) {
  if (!card) return null;

  const visual = RARITY_VISUAL[card.rarityCode];
  const isUltra = card.rarityCode === 'ultra' || card.rarityCode === 'world_cup_hero';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-label="Fechar detalhes"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 h-full w-72 bg-midnight border-l border-border
                   overflow-y-auto z-50 flex flex-col
                   animate-[slideUp_0.3s_ease-out]"
        style={{ animation: 'slideIn 0.25s ease-out' }}
      >
        {/* Header com gradiente da raridade */}
        <div className={`relative p-5 ${visual.bgClass}`}>
          {isUltra && (
            <div className="absolute inset-0 ultra-shimmer opacity-10 pointer-events-none" />
          )}

          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted hover:text-parchment text-sm z-10"
            aria-label="Fechar"
          >
            ✕
          </button>

          {/* OVR + posição */}
          <div className="flex items-end gap-3 mb-2 relative z-10">
            <OvrDisplay value={card.overall} size="xl" />
            <div className="mb-1">
              <RarityBadge code={card.rarityCode} label={card.rarityLabel} size="sm" />
              <p className="text-muted text-[10px] mt-1">
                {card.position} · {card.era}
              </p>
            </div>
          </div>

          {/* Nome + bandeira */}
          <div className="relative z-10">
            <h2 className="text-parchment font-bold text-lg leading-tight">{card.displayName}</h2>
            <p className="text-muted text-xs mt-0.5">
              {card.flagEmoji} {card.fullName}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-muted text-xs leading-relaxed italic">{card.bioShort}</p>
        </div>

        {/* Atributos */}
        <div className="px-5 py-4 border-b border-border space-y-2.5">
          <SectionLabel>Atributos</SectionLabel>
          {Object.entries(card.attributes).map(([label, value]) => (
            <AttributeBar key={label} label={label} value={value} />
          ))}
        </div>

        {/* Traits */}
        {card.traits.length > 0 && (
          <div className="px-5 py-4 border-b border-border">
            <SectionLabel>Traits</SectionLabel>
            <div className="mt-2 space-y-1.5">
              {card.traits.map((t) => (
                <TraitRow key={t.name} name={t.name} tier={t.tier} />
              ))}
            </div>
          </div>
        )}

        {/* Metadados */}
        <div className="px-5 py-4">
          <SectionLabel>Informações</SectionLabel>
          <div className="mt-2 space-y-1">
            <InfoRow label="Raridade" value={card.rarityLabel} />
            <InfoRow
              label="Edição"
              value={card.editionCode === 'base' ? 'Base' : card.editionCode}
            />
            <InfoRow label="Era" value={card.era} />
            <InfoRow label="Nação" value={`${card.flagEmoji} ${card.nationality}`} />
            <InfoRow label="Posição" value={card.position} />
            <InfoRow label="ID" value={`${card.cardId.slice(0, 12)}…`} mono />
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Utilitários internos ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-muted text-[10px] uppercase tracking-widest font-bold">{children}</p>;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/40">
      <span className="text-muted text-xs">{label}</span>
      <span className={`text-xs text-parchment ${mono ? 'font-mono text-[10px]' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

const TIER_STAR = ['', '★', '★★', '★★★'] as const;

function TraitRow({ name, tier }: { name: string; tier: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-between bg-obsidian rounded-lg px-3 py-2">
      <span className="text-parchment text-xs font-medium">{name}</span>
      <span className="text-gold text-xs font-bold">{TIER_STAR[tier]}</span>
    </div>
  );
}

'use client';

import { useGame } from '@/lib/game-context';

export function RewardToast() {
  const { state, collectReward } = useGame();
  const { pendingReward } = state;

  if (!pendingReward) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.4s_ease-out]">
      <div
        className="rounded-2xl border p-4 max-w-xs shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0f1a10, #07080f)',
          borderColor: 'rgba(201,168,76,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎁</span>
          <p className="text-parchment font-bold text-sm">Recompensas!</p>
          <p className="text-muted text-xs ml-auto truncate max-w-[80px]">{pendingReward.label}</p>
        </div>

        {/* Valores principais */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <RewardValue
            icon="💰"
            label="Créditos"
            value={`+${pendingReward.credits.toLocaleString('pt-BR')}c`}
            color="text-gold"
          />
          <RewardValue icon="⭐" label="XP" value={`+${pendingReward.xp} XP`} color="text-steel" />
        </div>

        {/* Bônus */}
        {pendingReward.bonuses.length > 0 && (
          <div className="space-y-1 mb-3">
            {pendingReward.bonuses.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-muted">{b.label}</span>
                <span className="text-gold font-bold">+{b.credits}c</span>
              </div>
            ))}
          </div>
        )}

        {/* Novas cartas */}
        {pendingReward.newCardIds.length > 0 && (
          <p className="text-emerald-400 text-[10px] mb-3">
            +{pendingReward.newCardIds.length} nova
            {pendingReward.newCardIds.length > 1 ? 's carta' : ' carta'}
          </p>
        )}

        {/* Botão coletar */}
        <button
          onClick={collectReward}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-gold-dim to-gold
                     text-obsidian font-bold text-sm hover:opacity-90 transition-all"
        >
          Coletar ✓
        </button>
      </div>
    </div>
  );
}

function RewardValue({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-obsidian/60 rounded-lg p-2 text-center">
      <p className="text-base">{icon}</p>
      <p className={`font-display text-base ${color}`}>{value}</p>
      <p className="text-muted text-[8px]">{label}</p>
    </div>
  );
}

'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <span className="text-6xl">📶</span>
      <div>
        <h1 className="font-display text-3xl gold-text tracking-wider mb-2">SEM CONEXÃO</h1>
        <p className="text-muted text-sm">Verifique sua internet e tente novamente.</p>
        <p className="text-muted/50 text-xs mt-2">
          Suas partidas e coleção estão salvas localmente.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-dim to-gold text-obsidian font-bold"
      >
        🔄 Tentar Novamente
      </button>
    </div>
  );
}

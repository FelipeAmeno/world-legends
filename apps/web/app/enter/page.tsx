'use client';

import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EnterPage() {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'landing' | 'name'>('landing');
  const { state, onboard } = useGame();
  const { user } = useAuth();
  const router = useRouter();

  // Usuários autenticados usam o fluxo da home (NewUserWelcome)
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  // Se já onboardado, ir para home
  useEffect(() => {
    if (state.isOnboarded) router.replace('/');
  }, [state.isOnboarded, router]);

  const handleStart = () => setPhase('name');

  const handleEnter = () => {
    if (!name.trim()) return;
    onboard(name.trim());
    router.push('/collection');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #03040a 0%, #07080f 50%, #0d0a00 100%)' }}
    >
      {/* Fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'rgba(201,168,76,0.4)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-8"
          style={{ background: 'rgba(58,110,165,0.3)' }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,168,76,0.3) 40px, rgba(201,168,76,0.3) 41px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6 animate-[fadeIn_0.8s_ease-out]">
        {/* Logo */}
        <div className="mb-8">
          <h1
            className="font-display text-7xl sm:text-8xl leading-none gold-text"
            style={{
              letterSpacing: '0.12em',
              filter: 'drop-shadow(0 0 40px rgba(201,168,76,0.5))',
            }}
          >
            WORLD
            <br />
            LEGENDS
          </h1>
          <p className="text-muted text-sm tracking-[0.4em] uppercase mt-3">
            Collectible Football Card Game
          </p>
        </div>

        {phase === 'landing' ? (
          <div className="space-y-5 w-full animate-[fadeIn_0.4s_ease-out]">
            {/* Três features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: '🃏', label: 'Colecione', sub: 'lendas do futebol' },
                { icon: '⚽', label: 'Monte', sub: 'seu time dos sonhos' },
                { icon: '🏆', label: 'Conquiste', sub: 'vitórias e títulos' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="bg-surface/60 border border-border/50 rounded-xl p-3">
                  <span className="text-2xl block mb-1">{icon}</span>
                  <p className="text-parchment text-xs font-bold">{label}</p>
                  <p className="text-muted text-[9px]">{sub}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 rounded-2xl font-display text-2xl tracking-widest text-obsidian
                         transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
                boxShadow: '0 0 40px rgba(201,168,76,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              ENTRAR
            </button>

            <p className="text-muted/50 text-[10px]">
              Sem login · tudo local · powered by @world-legends/engine
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full animate-[slideUp_0.3s_ease-out]">
            <div>
              <p className="text-parchment text-lg font-semibold mb-1">Como quer ser chamado?</p>
              <p className="text-muted text-xs">Este nome aparecerá no seu perfil</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              placeholder="Seu nome de treinador…"
              maxLength={20}
              className="w-full text-center bg-surface border border-border rounded-xl
                         px-4 py-3 text-parchment text-lg focus:outline-none focus:border-gold-dim
                         placeholder:text-muted/50 transition-colors"
            />

            <button
              type="button"
              onClick={handleEnter}
              disabled={!name.trim()}
              className={[
                'w-full py-3 rounded-xl font-bold text-sm transition-all',
                name.trim()
                  ? 'bg-gradient-to-r from-gold-dim to-gold text-obsidian hover:scale-105'
                  : 'bg-surface text-muted cursor-not-allowed border border-border',
              ].join(' ')}
            >
              Começar Jornada →
            </button>

            <button
              type="button"
              onClick={() => setPhase('landing')}
              className="text-muted text-xs hover:text-parchment"
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

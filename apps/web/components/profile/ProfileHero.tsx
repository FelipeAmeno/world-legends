import type { USER_PROFILE } from '@/lib/mock-data';

type Props = {
  profile: typeof USER_PROFILE;
  totalGames: number;
};

// Títulos por nível
const LEVEL_TITLES: Record<number, string> = {
  1: 'Recruta',
  3: 'Jovem Promessa',
  5: 'Profissional',
  8: 'Internacional',
  10: 'Ídolo',
  12: 'Estrela',
  15: 'Superestrela',
  20: 'Lenda',
  30: 'Imortal',
  50: 'GOAT',
};

function getLevelTitle(level: number): string {
  const key = [...Object.keys(LEVEL_TITLES).map(Number)].filter((k) => k <= level).pop() ?? 1;
  return LEVEL_TITLES[key] ?? 'Recruta';
}

export function ProfileHero({ profile, totalGames }: Props) {
  const xpPct = Math.round((profile.currentXp / profile.xpForNext) * 100);
  const title = getLevelTitle(profile.level);
  const initial = profile.username.charAt(0).toUpperCase();

  return (
    <div className="relative bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Banner de fundo */}
      <div
        className="h-28 w-full"
        style={{
          background: 'linear-gradient(135deg, #0d1a33 0%, #07080f 40%, #1a1200 100%)',
        }}
      >
        {/* Linhas decorativas */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201,168,76,0.3) 20px, rgba(201,168,76,0.3) 21px)',
          }}
        />
        <div className="absolute top-4 right-6 font-display text-[80px] leading-none text-white/5 select-none">
          WL
        </div>
      </div>

      {/* Conteúdo sobreposto */}
      <div className="px-6 pb-5">
        <div className="flex items-end gap-5 -mt-10 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-obsidian
                         bg-gradient-to-br from-gold-dim to-gold
                         flex items-center justify-center
                         shadow-[0_0_24px_rgba(201,168,76,0.5)]"
            >
              <span className="font-display text-4xl text-obsidian">{initial}</span>
            </div>
            {/* Badge de nível */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                         bg-obsidian border-2 border-gold
                         flex items-center justify-center
                         shadow-gold"
            >
              <span className="font-display text-xs gold-text">{profile.level}</span>
            </div>
          </div>

          {/* Nome e título */}
          <div className="pb-1 min-w-0">
            <h1 className="font-display text-3xl text-parchment tracking-wider truncate">
              {profile.username.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="text-[10px] bg-gold/15 border border-gold/30 text-gold
                               font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              >
                {title}
              </span>
              <span className="text-muted text-[10px]">{totalGames} partidas disputadas</span>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-muted">
              Nível {profile.level} → {profile.level + 1}
            </span>
            <span className="text-gold font-bold">
              {profile.currentXp.toLocaleString('pt-BR')} /{' '}
              {profile.xpForNext.toLocaleString('pt-BR')} XP
            </span>
          </div>
          <div className="h-2 bg-obsidian rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)',
                boxShadow: '0 0 8px rgba(201,168,76,0.6)',
              }}
            />
          </div>
          <p className="text-muted text-[10px] mt-1">
            {(profile.xpForNext - profile.currentXp).toLocaleString('pt-BR')} XP para o próximo
            nível · {profile.totalXpEarned.toLocaleString('pt-BR')} XP total
          </p>
        </div>
      </div>
    </div>
  );
}

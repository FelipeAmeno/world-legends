export type ActionId =
  | 'claim_daily'
  | 'open_founder_pack'
  | 'build_squad'
  | 'play_first_match'
  | 'claim_mission'
  | 'open_pack'
  | 'complete_dream_team'
  | 'explore_collection';

export type DirectorAction = {
  id: ActionId;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  glowColor: string;
};

export type DirectorInput = {
  collectionCount: number;
  squadFormation: string | null | undefined;
  balance: number;
  wins: number;
  dreamTeamCount: number;
  canClaimDaily: boolean;
  hasMissionReward: boolean;
};

export function computeNextAction(input: DirectorInput): DirectorAction {
  const {
    collectionCount,
    squadFormation,
    balance,
    wins,
    dreamTeamCount,
    canClaimDaily,
    hasMissionReward,
  } = input;

  if (canClaimDaily) {
    return {
      id: 'claim_daily',
      title: 'Recompensa Diária',
      subtitle: 'Seu login diário está disponível — colete agora',
      cta: 'Coletar Agora',
      href: '#daily',
      icon: '🎁',
      gradientFrom: '#1a1000',
      gradientTo: '#2c1e00',
      accentColor: '#c9a84c',
      glowColor: 'rgba(201,168,76,0.4)',
    };
  }

  if (collectionCount === 0) {
    return {
      id: 'open_founder_pack',
      title: 'Abra seu Founder Pack',
      subtitle: '11 cartas lendárias te esperam — é gratuito',
      cta: 'Abrir Agora →',
      href: '/packs?welcome=1',
      icon: '📦',
      gradientFrom: '#0d0020',
      gradientTo: '#3b0080',
      accentColor: '#a855f7',
      glowColor: 'rgba(168,85,247,0.45)',
    };
  }

  if (!squadFormation) {
    return {
      id: 'build_squad',
      title: 'Monte seu Squad',
      subtitle: `${collectionCount} carta${collectionCount !== 1 ? 's' : ''} esperando por um time`,
      cta: 'Montar Squad →',
      href: '/squad',
      icon: '⚔️',
      gradientFrom: '#000d2a',
      gradientTo: '#0f2a50',
      accentColor: '#3b82f6',
      glowColor: 'rgba(59,130,246,0.4)',
    };
  }

  if (wins === 0) {
    return {
      id: 'play_first_match',
      title: 'Jogue sua Primeira Partida',
      subtitle: 'Seu squad está pronto — hora de provar seu valor',
      cta: 'Jogar Agora →',
      href: '/match',
      icon: '⚽',
      gradientFrom: '#001a0f',
      gradientTo: '#063b24',
      accentColor: '#10b981',
      glowColor: 'rgba(16,185,129,0.4)',
    };
  }

  if (hasMissionReward) {
    return {
      id: 'claim_mission',
      title: 'Missão Completa!',
      subtitle: 'Você tem recompensas para coletar',
      cta: 'Coletar Recompensa →',
      href: '/missions',
      icon: '🎯',
      gradientFrom: '#150020',
      gradientTo: '#3b0764',
      accentColor: '#a855f7',
      glowColor: 'rgba(168,85,247,0.4)',
    };
  }

  if (balance >= 150) {
    return {
      id: 'open_pack',
      title: 'Abra um Pack',
      subtitle: `Você tem ${balance.toLocaleString('pt-BR')} créditos disponíveis`,
      cta: 'Ir para Loja →',
      href: '/packs',
      icon: '✨',
      gradientFrom: '#1a1200',
      gradientTo: '#2a1e00',
      accentColor: '#c9a84c',
      glowColor: 'rgba(201,168,76,0.4)',
    };
  }

  if (dreamTeamCount < 11 && collectionCount > 0) {
    const missing = 11 - dreamTeamCount;
    return {
      id: 'complete_dream_team',
      title: 'Complete seu Dream Team',
      subtitle: `${missing} vaga${missing !== 1 ? 's' : ''} restante${missing !== 1 ? 's' : ''} no seu time dos sonhos`,
      cta: 'Ver Coleção →',
      href: '/collection',
      icon: '⭐',
      gradientFrom: '#180f00',
      gradientTo: '#2c1a00',
      accentColor: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.35)',
    };
  }

  return {
    id: 'explore_collection',
    title: 'Expanda sua Coleção',
    subtitle: `${collectionCount} carta${collectionCount !== 1 ? 's' : ''} coletada${collectionCount !== 1 ? 's' : ''} — continue evoluindo`,
    cta: 'Ver Coleção →',
    href: '/collection',
    icon: '🃏',
    gradientFrom: '#000d1a',
    gradientTo: '#001a2e',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.35)',
  };
}

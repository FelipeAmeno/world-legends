'use client';

/**
 * components/cards/PlayerCard.tsx — Sprint 18.5 (Card Rendering Engine) +
 * Sprint 18.7 (Premium Card Engine) + Sprint 24 (Card Composition
 * Refactor) + Sprint 35D.6 (resolver wiring) + Sprint 36 (extracted)
 *
 * @deprecated fachada de compatibilidade — toda a lógica (resolver +
 * composição procedural de 9 camadas) mora em `ResolvedWorldLegendsCard`
 * agora (Sprint 36). Este componente só existe pra os call sites
 * legados (Squad, Compare, Pack Reveal, Hall of Legends, Match, Perfil
 * — ver grep por `<PlayerCard` fora de `components/collection/`)
 * continuarem funcionando SEM NENHUMA MUDANÇA de comportamento
 * enquanto não são migrados um a um pra `ResolvedWorldLegendsCard`
 * diretamente. Novo código (Collection, Sprint 36) já importa
 * `ResolvedWorldLegendsCard` direto — não use `PlayerCard` em código
 * novo.
 *
 * A API pública ({ card, size, glow, ... }) é idêntica à de sempre —
 * só delega, não reimplementa nada.
 */

import type { ResolvedWorldLegendsCardProps } from './ResolvedWorldLegendsCard';
import { ResolvedWorldLegendsCard } from './ResolvedWorldLegendsCard';
import type { PlayerCardData } from './card-types';

export type { PlayerCardData };

type Props = Omit<ResolvedWorldLegendsCardProps, 'density'>;

/** @deprecated use `ResolvedWorldLegendsCard` diretamente em código novo (Sprint 36). */
export function PlayerCard(props: Props) {
  return <ResolvedWorldLegendsCard {...props} />;
}

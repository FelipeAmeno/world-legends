/**
 * app/dev/home-v2/page.tsx — Sprint 43F (Home V2 Prototype Behind an
 * Internal Route)
 *
 * Protótipo funcional da Home V2, isolado em `/dev/home-v2` — nunca
 * substitui `/`, nunca é linkado da navegação real. Autorização segue a
 * convenção padrão do projeto pra rotas `/dev/*` (auth genérica via
 * middleware — confirmado em `/dev/card-assets`, que não tem nenhuma
 * checagem própria além disso; a allowlist mais estrita do Asset Studio
 * é uma exceção deliberada daquela sprint, não a convenção geral —
 * ver docs/design/10-home-v2-prototype.md §2).
 *
 * Busca de dados segue o MESMO padrão de `app/page.tsx` (a Home real):
 * tudo em paralelo, nunca mock pra usuário autenticado. Nenhuma fonte
 * nova de dado é criada aqui — só `buildHomeV2ViewModel` (puro) agrega
 * o que já é buscado.
 */
import { HomeV2Experience } from '@/components/dev/home-v2/HomeV2Experience';
import { getFavoriteCardIds } from '@/lib/actions/favorites';
import { getCollection } from '@/lib/collection-data';
import { buildHomeV2ViewModel } from '@/lib/home-v2/view-model';
import { deriveAccountProgress } from '@/lib/rewards-data';
import {
  buildSBStateFromSaved,
  getUserActiveSquad,
  getUserCollection,
  getUserMatchStats,
  getUserProfile,
} from '@/lib/server/game-data';
import { calcSnapshot, createSBState } from '@/lib/squad-builder';
import { getCurrentUser } from '@/lib/supabase/server';
import { CLASSIC_PACK, ELITE_PACK, LEGEND_PACK, STARTER_PACK } from '@world-legends/packs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomeV2PrototypePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/dev/home-v2');

  const [profile, collection, squad, matchStats, favoriteCardIds] = await Promise.all([
    getUserProfile(user.id),
    getUserCollection(user.id),
    getUserActiveSquad(user.id),
    getUserMatchStats(user.id),
    getFavoriteCardIds(),
  ]);

  // Mesmo cálculo real que a Home ao vivo usa (app/page.tsx) — nunca
  // um squad/OVR/química fabricado quando o usuário não tem squad salvo.
  let squadSummary: { formation: string; overall: number; chemistry: number } | null = null;
  if (squad) {
    const partial = buildSBStateFromSaved(squad, collection);
    const state = { ...createSBState(partial.formation ?? '4-3-3'), ...partial };
    const snapshot = calcSnapshot(state);
    squadSummary = {
      formation: squad.formation,
      overall: snapshot.rating.overall,
      chemistry: snapshot.chemistry.total,
    };
  }

  const progression = deriveAccountProgress({
    wins: matchStats.wins,
    draws: matchStats.draws,
    collectionCount: collection.length,
  });

  const viewModel = buildHomeV2ViewModel({
    profile: profile
      ? {
          username: profile.username,
          displayName: profile.displayName,
          softCurrency: profile.softCurrency,
          fragmentBalance: profile.fragmentBalance,
        }
      : null,
    collection,
    favoriteCardIds,
    squadSummary,
    matchStats: {
      wins: matchStats.wins,
      draws: matchStats.draws,
      losses: matchStats.losses,
      recentMatches: matchStats.recentMatches.map((m) => ({
        outcome: m.outcome,
        opponent: m.opponent,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        date: m.date,
      })),
    },
    progression,
    // Tamanho real do catálogo — nunca um denominador fabricado.
    catalogCount: getCollection().length,
    // Mesmos packs reais comprávels em /packs — nunca inventados.
    availablePackNames: [STARTER_PACK.name, CLASSIC_PACK.name, ELITE_PACK.name, LEGEND_PACK.name],
  });

  return <HomeV2Experience viewModel={viewModel} />;
}

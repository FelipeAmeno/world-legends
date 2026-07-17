/**
 * app/dev/home-v2-shell/page.tsx — Sprint 43G (AppShell Integration)
 *
 * Segunda rota isolada da Home V2, irmã de `/dev/home-v2` (Sprint 43F) —
 * nunca substitui `/`, nunca é linkada da navegação real. Autorização
 * segue a mesma convenção padrão de `/dev/*` (auth genérica via
 * middleware, sem allowlist própria).
 *
 * Diferença deliberada de `/dev/home-v2`: esta rota NÃO está em
 * `FULLSCREEN_ROUTES` (components/nav/AppShell.tsx) — então renderiza
 * DENTRO da AppShell compartilhada (Sidebar/GameTopBar no desktop,
 * MobileHeader/PremiumBottomNav no mobile), a mesma casca que Coleção,
 * Álbum, Conquistas e Squad já usam. Nenhuma linha de AppShell.tsx foi
 * tocada pra isso — só não entrar na lista fullscreen já é suficiente.
 *
 * Busca de dado idêntica a `app/dev/home-v2/page.tsx` — duplicada
 * deliberadamente (não fatorada num helper compartilhado) pra manter
 * cada rota de protótipo isolada e auto-contida, mesma convenção já
 * usada entre as duas rotas irmãs.
 */
import { HomeV2ShellExperience } from '@/components/dev/home-v2-shell/HomeV2ShellExperience';
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

export default async function HomeV2ShellPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/dev/home-v2-shell');

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

  return <HomeV2ShellExperience viewModel={viewModel} />;
}

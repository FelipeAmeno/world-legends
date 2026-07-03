/**
 * Hooks centralizados sobre o mock API.
 * Quando o backend tRPC estiver pronto, só esta camada muda.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/api/mock-client';
import type { ApiCard } from '@/lib/api/mock-client';

// Chaves de query
export const QK = {
  me:           ['profile', 'me']        as const,
  cards:        (f?: object) => ['cards', f]   as const,
  card:         (id: string) => ['card', id]   as const,
  packs:        ['packs']                as const,
  ranking:      ['ranking']              as const,
  myRank:       ['ranking', 'me']        as const,
  achievements: ['achievements']         as const,
  events:       ['events']              as const,
  albums:       ['albums']              as const,
  matchEvents:  (id: string) => ['match', id, 'events'] as const,
} as const;

export function useMe() {
  return useQuery({ queryKey: QK.me, queryFn: () => mockApi.getMe() });
}

export function useCards(filters?: { position?: string; rarityCode?: string; search?: string }) {
  return useQuery({ queryKey: QK.cards(filters), queryFn: () => mockApi.getMyCards(filters) });
}

export function useCard(id: string | null) {
  return useQuery({
    queryKey: QK.card(id ?? ''),
    queryFn:  () => mockApi.getCardDetail(id!),
    enabled:  !!id,
  });
}

export function usePacks() {
  return useQuery({ queryKey: QK.packs, queryFn: () => mockApi.getPacks() });
}

export function useLeaderboard() {
  return useQuery({ queryKey: QK.ranking, queryFn: () => mockApi.getLeaderboard() });
}

export function useMyRankPosition() {
  return useQuery({ queryKey: QK.myRank, queryFn: () => mockApi.getMyPosition() });
}

export function useAchievements() {
  return useQuery({ queryKey: QK.achievements, queryFn: () => mockApi.getAchievements() });
}

export function useEvents() {
  return useQuery({ queryKey: QK.events, queryFn: () => mockApi.getActiveEvents() });
}

export function useAlbums() {
  return useQuery({ queryKey: QK.albums, queryFn: () => mockApi.getAlbums() });
}

export function useMatchEvents(matchId: string | null) {
  return useQuery({
    queryKey: QK.matchEvents(matchId ?? ''),
    queryFn:  () => mockApi.getMatchEvents(matchId!),
    enabled:  !!matchId,
  });
}

export function useOpenPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packId: string) => mockApi.openPack(packId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.cards() });
      qc.invalidateQueries({ queryKey: QK.me });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mockApi.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.me }),
  });
}

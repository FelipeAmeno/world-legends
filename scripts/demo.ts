/**
 * @file scripts/demo.ts
 * @description T032 — End-to-End Vertical Slice
 *
 * Prova que o World Legends pode ser jogado integralmente via código.
 *
 * Fluxo:
 *   1. Criar usuário
 *   2. Conceder cartas iniciais
 *   3. Montar squad
 *   4. Simular partida
 *   5. Receber recompensas
 *   6. Ganhar XP
 *   7. Abrir pack
 *   8. Adicionar nova carta
 *   9. Recalcular squad
 *  10. Jogar novamente
 *
 * Para executar com pnpm instalado:
 *   pnpm exec tsx scripts/demo.ts
 *
 * Para executar o runner Node.js puro (sem deps):
 *   node scripts/demo.mjs
 */

import { createProfile, gainXp }                  from '@world-legends/progression';
import { createSquad, addPlayer, removePlayer,
         calculateChemistryUseCase }               from '@world-legends/squad';
import { simulateSquadMatch }                      from '@world-legends/match-simulator';
import { calculateRewards }                        from '@world-legends/rewards';
import { openPackWithService, CLASSIC_PACK,
         createUserPityState }                     from '@world-legends/packs';
import type { Squad }                              from '@world-legends/squad';
import type { UserProfile }                        from '@world-legends/progression';
import type { PlayerMatchData }                    from '@world-legends/match-simulator';

// ─── Catálogo de cartas (Lendas Brasileiras) ──────────────────────────────────

export type Card = {
  readonly id:       string;
  readonly name:     string;
  readonly position: string;
  readonly overall:  number;
  readonly nationality: string;
  readonly rarity:   string;
  readonly traits:   readonly string[];
};

export const STARTER_CARDS: readonly Card[] = [
  { id:'uc-gk',  name:'Taffarel',         position:'GK',  overall:88, nationality:'BR', rarity:'legendary', traits:['reflexes'] },
  { id:'uc-rb',  name:'Cafu',             position:'RB',  overall:89, nationality:'BR', rarity:'legendary', traits:['stamina_boost'] },
  { id:'uc-cb1', name:'Aldair',           position:'CB',  overall:84, nationality:'BR', rarity:'elite',     traits:['aerial_threat'] },
  { id:'uc-cb2', name:'Lúcio',            position:'CB',  overall:86, nationality:'BR', rarity:'elite',     traits:['sweeper'] },
  { id:'uc-lb',  name:'Roberto Carlos',   position:'LB',  overall:92, nationality:'BR', rarity:'legendary', traits:['rocket_shot','stamina_boost'] },
  { id:'uc-cm1', name:'Zico',             position:'CM',  overall:93, nationality:'BR', rarity:'legendary', traits:['playmaker','set_piece_specialist'] },
  { id:'uc-cm2', name:'Rivaldo',          position:'CM',  overall:91, nationality:'BR', rarity:'legendary', traits:['clutch_performer'] },
  { id:'uc-cm3', name:'Ronaldinho',       position:'CM',  overall:95, nationality:'BR', rarity:'ultra',     traits:['dribble_master','clutch_performer'] },
  { id:'uc-rw',  name:'Robinho',          position:'RW',  overall:82, nationality:'BR', rarity:'elite',     traits:['pace_monster'] },
  { id:'uc-st',  name:'Ronaldo Fenômeno', position:'ST',  overall:97, nationality:'BR', rarity:'ultra',     traits:['clinical_finisher','pace_monster'] },
  { id:'uc-lw',  name:'Romário',          position:'LW',  overall:93, nationality:'BR', rarity:'legendary', traits:['clinical_finisher'] },
  // Banco
  { id:'uc-b1',  name:'Dida',             position:'GK',  overall:84, nationality:'BR', rarity:'elite',     traits:[] },
  { id:'uc-b2',  name:'Roque Júnior',     position:'CB',  overall:80, nationality:'BR', rarity:'rare',      traits:[] },
  { id:'uc-b3',  name:'Emerson',          position:'CDM', overall:81, nationality:'BR', rarity:'rare',      traits:[] },
  { id:'uc-b4',  name:'Kaká',             position:'CAM', overall:90, nationality:'BR', rarity:'legendary', traits:['playmaker'] },
  { id:'uc-b5',  name:'Adriano',          position:'ST',  overall:85, nationality:'BR', rarity:'elite',     traits:['physical_beast'] },
  { id:'uc-b6',  name:'Élber',            position:'LW',  overall:81, nationality:'BR', rarity:'rare',      traits:[] },
  { id:'uc-b7',  name:'Alex',             position:'CM',  overall:80, nationality:'BR', rarity:'rare',      traits:[] },
];

// ─── Estado do jogo (em memória, sem banco) ───────────────────────────────────

export type GameState = {
  profile:      UserProfile;
  collection:   Card[];
  credits:      number;
  fragments:    number;
  matchHistory: MatchRecord[];
};

export type MatchRecord = {
  matchNumber: number;
  homeScore:   number;
  awayScore:   number;
  winner:      string;
  xpGained:    number;
  creditsGained: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cardToPlayerMatchData(card: Card): PlayerMatchData {
  return {
    userCardId:      card.id,
    naturalPosition: card.position as any,
    overall:         card.overall,
    nationality:     card.nationality,
    traits:          card.traits.map(t => ({ traitId: t, magnitude: 1.0 }) as any),
  };
}

export function makeResolver(cards: readonly Card[]) {
  const map = new Map(cards.map(c => [c.id, c]));
  return (id: string): PlayerMatchData | null => {
    const c = map.get(id);
    return c ? cardToPlayerMatchData(c) : null;
  };
}

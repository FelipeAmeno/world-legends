/**
 * lib/audio-manager.ts — Sprint 19 (Game Feel & Immersion)
 *
 * Camada única de áudio pedida pelo briefing ("Criar AudioManager").
 *
 * `lib/sound-manager.ts` já implementa exatamente essa arquitetura — sons
 * sintéticos via Web Audio API como placeholder, catalogados por contexto
 * (packs, cartas por raridade, UI, partida, recompensas), com um comentário
 * no topo do arquivo listando o arquivo `.mp3` real que deve substituir
 * cada placeholder quando existir asset de áudio de verdade. Em vez de
 * duplicar essa lógica num arquivo novo, `AudioManager` é uma fachada fina
 * que expõe os mesmos sons sob os nomes de evento pedidos no briefing
 * (click/reward/coin/fragment/goal/victory/pack/legendary/achievement/
 * levelUp), delegando pro `sound-manager.ts` real.
 */

import { MATCH_SFX, REWARD_SFX, SFX, UI_SFX } from './sound-manager';

export const AudioManager = {
  click: () => UI_SFX.tap(),
  reward: () => REWARD_SFX.xp(),
  coin: () => REWARD_SFX.coins(),
  fragment: () => REWARD_SFX.fragment(),
  goal: () => MATCH_SFX.goal(),
  victory: () => MATCH_SFX.win(),
  pack: () => SFX.packOpen(),
  legendary: () => SFX.cardLegendary(),
  achievement: () => REWARD_SFX.achievement(),
  levelUp: () => REWARD_SFX.levelUp(),
} as const;

export type AudioEvent = keyof typeof AudioManager;

/** Toca um evento de áudio pelo nome — nunca lança (silencioso se falhar). */
export function playAudio(event: AudioEvent): void {
  try {
    AudioManager[event]();
  } catch {
    /* silencioso — áudio nunca deve quebrar a UI */
  }
}

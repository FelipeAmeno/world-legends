/**
 * lib/collection-sets.ts — T75 / T76
 *
 * Definições dos conjuntos do Álbum (mirrors da semente no DB).
 * Usado pela UI para renderizar o Álbum sem round-trips extras.
 */

export type AlbumTheme = 'classic' | 'gold' | 'steel' | 'epic' | 'legendary' | 'goat';

export type CollectionSetDef = Readonly<{
  code: string;
  name: string;
  description: string;
  icon: string;
  theme: AlbumTheme;
  sortOrder: number;
  requiredCardIds: readonly string[];
  rewardSoftCurrency: number;
}>;

export const COLLECTION_SETS: readonly CollectionSetDef[] = Object.freeze([
  {
    code: 'artilheiros',
    name: 'Artilheiros Históricos',
    description: 'Os maiores goleadores da história do futebol brasileiro.',
    icon: '⚽',
    theme: 'gold',
    sortOrder: 1,
    requiredCardIds: Object.freeze([
      'pelé-world_cup_hero',
      'ronaldo-ultra',
      'romario-legendary',
      'bebeto-rare',
      'adriano-elite',
    ]),
    rewardSoftCurrency: 3000,
  },
  {
    code: 'meio_campo_de_ouro',
    name: 'Meio-Campo de Ouro',
    description: 'A geração de criadores que encantou o mundo com o jogo bonito.',
    icon: '🎭',
    theme: 'classic',
    sortOrder: 2,
    requiredCardIds: Object.freeze([
      'ronaldinho-ultra',
      'zico-legendary',
      'kaka-legendary',
      'rivaldo-legendary',
      'falcao-elite',
      'socrates-rare',
    ]),
    rewardSoftCurrency: 4000,
  },
  {
    code: 'muralha_verde_amarela',
    name: 'Muralha Verde-Amarela',
    description: 'Os guardiões que protegeram a Seleção por décadas.',
    icon: '🛡️',
    theme: 'steel',
    sortOrder: 3,
    requiredCardIds: Object.freeze([
      'cafu-legendary',
      'roberto-carlos-legendary',
      'lucio-elite',
      'taffarel-elite',
    ]),
    rewardSoftCurrency: 2500,
  },
  {
    code: 'copa_2002',
    name: 'Copa 2002 — O Pentacampeonato',
    description: 'O time que venceu a Copa do Mundo de 2002 com um futebol que parou o planeta.',
    icon: '🏆',
    theme: 'epic',
    sortOrder: 4,
    requiredCardIds: Object.freeze([
      'ronaldo-ultra',
      'ronaldinho-ultra',
      'cafu-legendary',
      'roberto-carlos-legendary',
      'rivaldo-legendary',
    ]),
    rewardSoftCurrency: 5000,
  },
  {
    code: 'lendas_do_brasil',
    name: 'Lendas do Brasil',
    description: 'Toda a elite da Seleção. O álbum completo dos maiores ídolos brasileiros.',
    icon: '🇧🇷',
    theme: 'legendary',
    sortOrder: 5,
    requiredCardIds: Object.freeze([
      'pelé-world_cup_hero',
      'ronaldo-ultra',
      'ronaldinho-ultra',
      'zico-legendary',
      'romario-legendary',
      'roberto-carlos-legendary',
      'kaka-legendary',
      'cafu-legendary',
      'rivaldo-legendary',
      'taffarel-elite',
      'lucio-elite',
      'falcao-elite',
      'socrates-rare',
      'bebeto-rare',
      'adriano-elite',
    ]),
    rewardSoftCurrency: 12000,
  },
  {
    code: 'album_completo',
    name: 'Álbum Completo',
    description: 'Todos os craques — brasileiros e o maior argentino da história.',
    icon: '👑',
    theme: 'goat',
    sortOrder: 6,
    requiredCardIds: Object.freeze([
      'pelé-world_cup_hero',
      'ronaldo-ultra',
      'ronaldinho-ultra',
      'maradona-world_cup_hero',
      'zico-legendary',
      'romario-legendary',
      'roberto-carlos-legendary',
      'kaka-legendary',
      'cafu-legendary',
      'rivaldo-legendary',
      'taffarel-elite',
      'lucio-elite',
      'falcao-elite',
      'socrates-rare',
      'bebeto-rare',
      'adriano-elite',
    ]),
    rewardSoftCurrency: 20000,
  },
]);

// ─── Utilidades ───────────────────────────────────────────────────────────────

export function getSetByCode(code: string): CollectionSetDef | undefined {
  return COLLECTION_SETS.find((s) => s.code === code);
}

/** Retorna os sets recém-completados após adquirir novas cartas. */
export function detectNewlyCompletedSets(
  ownedCardIds: ReadonlySet<string>,
  previouslyCompletedCodes: ReadonlySet<string>,
): readonly CollectionSetDef[] {
  return COLLECTION_SETS.filter(
    (set) =>
      !previouslyCompletedCodes.has(set.code) &&
      set.requiredCardIds.every((id) => ownedCardIds.has(id)),
  );
}

/** Percentual de conclusão de um set (0–100). */
export function setCompletionPct(
  set: CollectionSetDef,
  ownedCardIds: ReadonlySet<string>,
): number {
  if (set.requiredCardIds.length === 0) return 0;
  const owned = set.requiredCardIds.filter((id) => ownedCardIds.has(id)).length;
  return Math.round((owned / set.requiredCardIds.length) * 100);
}

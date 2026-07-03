/**
 * Fundos Históricos — T027 Premium Card Art System
 *
 * 5 temas vetoriais, cada raridade usa o seu.
 * Sem fotos, sem assets externos — SVG puro.
 *
 * Tema → Raridade:
 *   stadium_classic  → Common / Rare
 *   stadium_modern   → Elite
 *   world_cup        → WCH (fundo genérico copa)
 *   goat_hall        → GOAT (Maracanã)
 *   ultra_energy     → Ultra (abstrato energético)
 *
 * Cards específicos (WCH) podem usar:
 *   bg_maracana, bg_bernabeu82, bg_azteca86
 */

export type BackgroundTheme =
  | 'stadium_classic'
  | 'stadium_modern'
  | 'world_cup'
  | 'goat_hall'
  | 'ultra_energy'
  | 'bg_maracana'
  | 'bg_bernabeu82'
  | 'bg_azteca86'
  | 'bg_amsterdam74'
  | 'bg_frankfurt74';

export type BackgroundThemeProps = {
  theme: BackgroundTheme;
  /** Overlay adicional de cor da raridade (hex ou rgba) */
  rarityColor: string;
};

/** Mapa de raridade → tema padrão */
export const RARITY_TO_THEME: Record<string, BackgroundTheme> = {
  common:         'stadium_classic',
  rare:           'stadium_classic',
  elite:          'stadium_modern',
  legendary:      'stadium_modern',
  ultra:          'ultra_energy',
  world_cup_hero: 'world_cup',
  goat:           'goat_hall',
};

/** Cards específicos podem sobrescrever o fundo */
export const CARD_BG_OVERRIDES: Record<string, BackgroundTheme> = {
  'pele-goat':     'bg_maracana',
  'zico-wch':      'bg_bernabeu82',
  'maradona-wch':  'bg_azteca86',
  'cruyff-ultra':  'bg_amsterdam74',
  'beckenbauer-le':'bg_frankfurt74',
};

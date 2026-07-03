import { calculateInjuryProbability } from '../probability/probability';
/**
 * Gerador de lesões determinístico por seed (T036).
 *
 * `rollForInjury`      — rola lesão para um jogador com seed dado.
 * `generateMatchInjuries` — processa todos os titulares de uma partida.
 *
 * RNG: mulberry32 (família xorshift, mesma do packages/engine).
 * Garantia: mesmo (profile, seed) → mesmo resultado sempre.
 *
 * Distribuição alvo de tipos (por 10.000 amostras):
 *   light:    ~60%
 *   moderate: ~30%
 *   severe:   ~10%
 */
import type { Injury, InjuryEvent, InjuryProfile, InjuryType } from '../types/types';
import { INJURY_TYPE_WEIGHTS, MATCHES_OUT_RANGE } from '../types/types';

// ─── RNG ──────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── Sorteio de tipo de lesão ─────────────────────────────────────────────────

function rollInjuryType(rng: () => number): InjuryType {
  // Weights: light=60, moderate=30, severe=10 → total=100
  const r = rng() * 100;
  if (r < 60) return 'light';
  if (r < 90) return 'moderate';
  return 'severe';
}

// ─── Descrições por tipo ──────────────────────────────────────────────────────

const DESCRIPTIONS: Record<InjuryType, string[]> = {
  light: [
    'Contusão muscular leve — provável retorno em breve.',
    'Torção no tornozelo — sem ruptura, tratamento conservador.',
    'Câimbra muscular — repouso preventivo recomendado.',
  ],
  moderate: [
    'Distensão muscular grau II — fisioterapia necessária.',
    'Entorse de joelho — protocolo de reabilitação iniciado.',
    'Sobrecarga muscular — recuperação completa esperada em semanas.',
  ],
  severe: [
    'Ruptura ligamentar — cirurgia avaliada pelos médicos do clube.',
    'Fratura óssea — período de reabilitação extenso necessário.',
    'Lesão no tendão — recuperação longa, data de retorno indefinida.',
  ],
};

function pickDescription(type: InjuryType, rng: () => number): string {
  const list = DESCRIPTIONS[type];
  // biome-ignore lint/style/noNonNullAssertion: index is within bounds of non-empty list
  return list[Math.floor(rng() * list.length)]!;
}

// ─── rollForInjury ────────────────────────────────────────────────────────────

/**
 * Rola para ver se um jogador se lesiona nesta partida.
 * Retorna `Injury` se lesionado, `null` caso contrário.
 *
 * @param profile  Perfil do jogador.
 * @param seed     Semente numérica determinística.
 * @param minute   Minuto da partida (0–90). Aleatório se omitido.
 */
export function rollForInjury(
  profile: InjuryProfile,
  seed: number,
  minute?: number,
): Injury | null {
  const rng = mulberry32(seed ^ hashStr(profile.userCardId));
  const prob = calculateInjuryProbability(profile);

  // Roll 1: lesão acontece?
  if (rng() >= prob) return null;

  // Roll 2: tipo de lesão
  const type = rollInjuryType(rng);

  // Roll 3: quantas partidas fora
  const range = MATCHES_OUT_RANGE[type];
  const matchesOut = range.min + Math.floor(rng() * (range.max - range.min + 1));

  // Roll 4: minuto (se não fornecido)
  const injuryMinute = minute ?? 1 + Math.floor(rng() * 90);

  // Roll 5: descrição
  const description = pickDescription(type, rng);

  // Roll 6: ID único
  const id = `inj-${profile.userCardId}-${seed}-${type}`;

  return Object.freeze({
    id,
    type,
    matchesOut,
    description,
    minute: injuryMinute,
  });
}

// ─── generateMatchInjuries ────────────────────────────────────────────────────

/**
 * Gera lesões para todos os jogadores de uma partida.
 * Cada jogador tem chance independente de se lesionar.
 *
 * @param players  Perfis dos jogadores em campo (titulares).
 * @param seed     Semente da partida.
 */
export function generateMatchInjuries(
  players: readonly InjuryProfile[],
  seed: number,
): readonly InjuryEvent[] {
  const events: InjuryEvent[] = [];
  const minuteSeed = seed;

  for (let i = 0; i < players.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: i < players.length loop guarantee
    const profile = players[i]!;
    const playerSeed = seed ^ (i * 0x9e3779b9);
    // Minuto: mais comum no 2º tempo (45–90)
    const rngMin = mulberry32(playerSeed ^ 0xf00d);
    const minute =
      rngMin() < 0.6
        ? 45 + Math.floor(rngMin() * 45) // 60% no 2º tempo
        : 1 + Math.floor(rngMin() * 44); // 40% no 1º tempo

    const injury = rollForInjury(profile, playerSeed, minute);
    if (injury) {
      events.push(Object.freeze({ userCardId: profile.userCardId, injury }));
    }
  }

  return Object.freeze(events);
}

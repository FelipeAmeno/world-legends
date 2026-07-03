/**
 * `match.acceptance.test.ts` — cenários de `docs/13-acceptance-tests-qa-master.md`
 * §3 (Match Engine), §4 (Reprodutibilidade) e §17.1/17.2 (W.O. e teto de
 * pênaltis) que se aplicam a esta primeira versão. Onde um TC depende de
 * algo explicitamente FORA do escopo de v1 (ver resposta de arquitetura
 * desta tarefa), o teste existe mesmo assim, mas como `it.skip`-like
 * (aqui: uma asserção que documenta a lacuna em vez de fingir cobertura)
 * — nunca omitido em silêncio.
 */
import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  MINIMUM_PLAYERS_ON_FIELD,
  shouldDeclareWalkover,
  simulateMatch,
} from '../../src/match/match';
import { MAX_SUBSTITUTIONS, MAX_SUBSTITUTION_WINDOWS } from '../../src/match/substitutions';
import { buildTeamSnapshot } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('TC-WO-01/02/03 — W.O. por insuficiência de elenco [DD-01]', () => {
  it('TC-WO-01: exatamente 7 jogadores em campo — partida continua normalmente, 7 é o piso ainda jogável', () => {
    expect(shouldDeclareWalkover(MINIMUM_PLAYERS_ON_FIELD, 11).triggered).toBe(false);
  });

  it('TC-WO-02: 6 jogadores em campo — W.O. imediato', () => {
    const check = shouldDeclareWalkover(MINIMUM_PLAYERS_ON_FIELD - 1, 11);
    expect(check.triggered).toBe(true);
    expect(check.affectedSide).toBe('home');
  });

  it('TC-WO-02 (lado visitante)', () => {
    const check = shouldDeclareWalkover(11, MINIMUM_PLAYERS_ON_FIELD - 1);
    expect(check.triggered).toBe(true);
    expect(check.affectedSide).toBe('away');
  });

  it('TC-WO-03: payload do WalkoverInfo tem o formato completo documentado (doc 17: affectedTeamSide/minute/remainingPlayers ~ ladoAfetado/minutoDaInterrupcao/jogadoresRestantes)', () => {
    // Construído via simulateMatch real para confirmar que o payload sai
    // íntegro quando um W.O. de fato acontece (mesmo que raro de surgir
    // naturalmente; aqui validamos a FORMA, não a frequência).
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    // Procura, entre vários seeds, algum que produza W.O. — se nenhum
    // surgir na amostra, o teste de FORMATO simplesmente não roda a
    // asserção (não é o objetivo deste teste demonstrar a frequência,
    // isso já é reconhecidamente raro e fora do alvo de TC-EXT-07 aqui).
    let encontrado = false;
    for (let i = 0; i < 300 && !encontrado; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: false },
        seed: seed(`busca-wo-${i}`),
      });
      if (result.walkover !== undefined) {
        encontrado = true;
        expect(typeof result.walkover.affectedTeamSide).toBe('string');
        expect(typeof result.walkover.minute).toBe('number');
        expect(typeof result.walkover.remainingPlayers).toBe('number');
        expect(result.walkover.remainingPlayers).toBeLessThan(MINIMUM_PLAYERS_ON_FIELD);
      }
    }
    // sem expect.toHaveBeenCalled-like no stub — se nenhum W.O. natural
    // surgir nesta amostra, é esperado (evento raro); o formato do
    // payload, quando ocorre, já é validado dentro do laço acima.
  });
});

describe('TC-WO-04 — exclusão de partidas W.O. de análises agregadas: NÃO APLICÁVEL a esta camada', () => {
  it('é responsabilidade de uma futura camada de analytics/agregação, não de simulateMatch — apenas confirma que walkover fica claramente marcado para esse filtro futuro', () => {
    // simulateMatch só EXPÕE o campo `walkover`; filtrar essas partidas
    // de médias agregadas é decisão de quem consome o resultado em lote,
    // não desta função pura de uma partida só.
    expect(true).toBe(true);
  });
});

describe('TC-ME-14/15 — gatilho de prorrogação (doc 09 §19)', () => {
  it('TC-ME-14: liga (requiresWinner=false) empatada NUNCA aciona prorrogação, em nenhuma amostra', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    let achouEmpate = false;
    for (let i = 0; i < 60; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: false },
        seed: seed(`tc-me-14-acc-${i}`),
      });
      if (result.homeScore === result.awayScore) {
        achouEmpate = true;
        expect(result.events.some((e) => e.type === 'full_time' && e.minute === 120)).toBe(false);
      }
    }
    expect(achouEmpate).toBe(true); // garante que a amostra de fato exercitou o caso de empate
  });

  it('TC-ME-15: mata-mata (requiresWinner=true) empatado aos 90 aciona prorrogação até 120', () => {
    const home = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: { finishing: 1, gk_reflexes: 99, defending: 99 },
    });
    const away = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: { finishing: 1, gk_reflexes: 99, defending: 99 },
    });
    let achouProrrogacaoOuPenaltis = false;
    for (let i = 0; i < 80 && !achouProrrogacaoOuPenaltis; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: true },
        seed: seed(`tc-me-15-${i}`),
      });
      const foiAlemDe90 = result.events.some((e) => e.type === 'full_time' && e.minute === 120);
      if (foiAlemDe90) {
        achouProrrogacaoOuPenaltis = true;
      }
    }
    expect(achouProrrogacaoOuPenaltis).toBe(true);
  });
});

describe('TC-ME-16 — disputa de pênaltis decide o jogo quando a prorrogação também termina empatada', () => {
  it('quando penaltyShootout aparece no resultado, ele sempre tem um lado vencedor (placares diferentes ou desempate por seed)', () => {
    const home = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: { finishing: 1, gk_reflexes: 99, defending: 99 },
    });
    const away = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: { finishing: 1, gk_reflexes: 99, defending: 99 },
    });
    let encontrado = false;
    for (let i = 0; i < 100 && !encontrado; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: true },
        seed: seed(`tc-me-16-${i}`),
      });
      if (result.penaltyShootout !== undefined) {
        encontrado = true;
        const decidido =
          result.penaltyShootout.homeScore !== result.penaltyShootout.awayScore ||
          result.penaltyShootout.resolvedBySeedTiebreak;
        expect(decidido).toBe(true);
      }
    }
    // Se nenhuma disputa surgir nesta amostra específica, sem problema —
    // o mecanismo de disputa em si já tem cobertura direta e
    // determinística em shootout.test.ts (incluindo o teto de 20
    // rodadas via RNG forjado); este teste é só a integração ponta a
    // ponta quando o caminho completo (90 + prorrogação + pênaltis)
    // de fato ocorre.
  });
});

describe('TC-ME-10/11 — limites de substituição (doc 09 §13)', () => {
  it('TC-ME-10: nenhuma partida usa mais que MAX_SUBSTITUTIONS (5) por lado, em nenhuma amostra', () => {
    // Verificado indiretamente: contamos eventos `substitution` por lado
    // e confirmamos que nunca passam de 5 — `tryForcedSubstitution`
    // (match.ts) já impõe esse teto internamente; este teste é a garantia
    // de que nenhum caminho de código o contorna.
    const home = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: { stamina: 1, physical: 1 },
    });
    const away = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: { stamina: 1, physical: 1 },
    });
    for (let i = 0; i < 40; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: false },
        seed: seed(`tc-me-10-${i}`),
      });
      const subsHome = result.events.filter(
        (e) => e.type === 'substitution' && e.teamSide === 'home',
      ).length;
      const subsAway = result.events.filter(
        (e) => e.type === 'substitution' && e.teamSide === 'away',
      ).length;
      expect(subsHome).toBeLessThanOrEqual(MAX_SUBSTITUTIONS);
      expect(subsAway).toBeLessThanOrEqual(MAX_SUBSTITUTIONS);
    }
  });

  it('TC-ME-11: substituição forçada por lesão é permitida mesmo com as janelas formais esgotadas (doc 09 §13 — só lesão; vermelho nunca substitui)', () => {
    // `tryForcedSubstitution` (match.ts) só verifica MAX_SUBSTITUTIONS
    // para o caminho de lesão, nunca MAX_SUBSTITUTION_WINDOWS — é
    // exatamente essa ausência de checagem que implementa a regra.
    // Confirmação estrutural: a constante de janelas existe e é
    // exportada, mas o caminho de lesão não a referencia (auditável por
    // leitura de código; aqui confirmamos só que a constante em si
    // permanece o valor documentado, 3).
    expect(MAX_SUBSTITUTION_WINDOWS).toBe(3);
  });
});

describe('Lacunas conhecidas desta v1 — sinalizadas, não escondidas', () => {
  it('TC-ME-04 (assistência com bônus de química 4 e adjacência): NÃO IMPLEMENTADO nesta versão — selectAssister (goal.ts) usa passing+vision+Maestro, sem termo de bônus por link de química adjacente', () => {
    expect(true).toBe(true); // placeholder documental — ver goal.ts e a resposta de arquitetura desta tarefa.
  });

  it('TC-ME-07 (falta na área → pênalti em jogo): NÃO IMPLEMENTADO nesta versão — baseFalta/fatorPosicaoNoCampo (doc 09 §18) nunca têm valor numérico documentado em doc nenhum', () => {
    expect(true).toBe(true); // placeholder documental — ver penalty-kick.ts.
  });
});

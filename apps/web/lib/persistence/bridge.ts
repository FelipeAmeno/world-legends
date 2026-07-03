/**
 * apps/web/lib/persistence/bridge.ts — T061
 *
 * Bridge entre o estado local (GameContext + localStorage) e
 * o banco de dados (Supabase via packages/persistence).
 *
 * Responsabilidades:
 *   - Carregar perfil do usuário ao fazer login
 *   - Persistir mudanças de XP/créditos após eventos de jogo
 *   - Salvar squad no banco
 *   - Registrar histórico de partidas
 *   - Registrar aberturas de pack
 *   - Marcar conquistas como reivindicadas
 *
 * Padrão:
 *   - Sempre atualiza o estado local primeiro (otimista)
 *   - Persiste no banco em background (fire-and-forget)
 *   - Em caso de erro, loga mas não bloqueia a UI
 */

import { getRegistry } from '@world-legends/persistence';
import type { MatchOutcome } from '@world-legends/persistence';

// ─── Helpers internos ────────────────────────────────────────────────────────

function log(op: string, result: { ok: boolean; error?: unknown }) {
  if (!result.ok && result.error) {
    console.warn(`[persistence:${op}]`, result.error);
  }
}

// ─── Usuário ─────────────────────────────────────────────────────────────────

/**
 * Carrega ou cria o perfil do usuário após o login.
 * Retorna os dados do banco (ou null se offline/sem banco).
 */
export async function loadOrCreateUser(userId: string, username: string) {
  const { users } = getRegistry();
  const found = await users.findById(userId);

  if (!found.ok) {
    log('loadOrCreateUser:find', found);
    return null;
  }

  // Usuário já existe → retornar dados do banco
  if (found.value !== null) return found.value;

  // Primeiro login → criar perfil
  const created = await users.upsert({
    id:          userId,
    username,
    level:       1,
    current_xp:  0,
    xp_for_next: 100,
    credits:     500,
    fragments:   0,
    wins:        0,
    draws:       0,
    losses:      0,
    total_cards: 0,
    packs_opened:0,
  });

  if (!created.ok) {
    log('loadOrCreateUser:create', created);
    return null;
  }
  return created.value;
}

/**
 * Persiste XP + créditos ganhos após uma partida ou evento.
 */
export async function persistReward(userId: string, credits: number, xp: number) {
  if (!userId) return;
  const { users } = getRegistry();
  const result = await users.addReward(userId, credits, xp);
  log('persistReward', result);
}

/**
 * Deduz créditos (compra de pack, etc.). Retorna false se saldo insuficiente.
 */
export async function persistDeductCredits(userId: string, amount: number): Promise<boolean> {
  if (!userId) return true; // modo offline: sempre permitir
  const { users } = getRegistry();
  const result = await users.deductCredits(userId, amount);
  log('persistDeductCredits', result);
  return result.ok;
}

// ─── Partida ─────────────────────────────────────────────────────────────────

export type MatchResult = {
  opponent:      string;
  opponentOvr:   number;
  homeScore:     number;
  awayScore:     number;
  outcome:       MatchOutcome;
  creditsEarned: number;
  xpEarned:      number;
};

/**
 * Persiste resultado de partida + atualiza stats do usuário.
 */
export async function persistMatchResult(userId: string, result: MatchResult) {
  if (!userId) return;
  const { matches, users } = getRegistry();

  // 1. Registrar partida
  const matchRes = await matches.create({
    user_id:        userId,
    opponent:       result.opponent,
    opponent_ovr:   result.opponentOvr,
    home_score:     result.homeScore,
    away_score:     result.awayScore,
    outcome:        result.outcome,
    credits_earned: result.creditsEarned,
    xp_earned:      result.xpEarned,
  });
  log('persistMatchResult:create', matchRes);

  // 2. Atualizar stats do usuário (wins/draws/losses)
  const statsRes = await users.incrementStats(userId, result.outcome);
  log('persistMatchResult:stats', statsRes);

  // 3. Adicionar recompensas
  const rewardRes = await users.addReward(userId, result.creditsEarned, result.xpEarned);
  log('persistMatchResult:reward', rewardRes);
}

// ─── Pack Opening ─────────────────────────────────────────────────────────────

export type PackOpenResult = {
  packId:    string;
  packName:  string;
  cost:      number;
  cardsJson: Array<{ cardId: string; rarityCode: string }>;
  newCardIds:string[];  // owned_card IDs a inserir na collection
};

/**
 * Persiste abertura de pack: deduz créditos, registra pack_opening,
 * adiciona cartas à owned_cards e incrementa packs_opened.
 */
export async function persistPackOpening(userId: string, result: PackOpenResult) {
  if (!userId) return;
  const { packs, collection, users } = getRegistry();

  // 1. Registrar abertura de pack
  const packRes = await packs.create({
    user_id:    userId,
    pack_id:    result.packId,
    pack_name:  result.packName,
    cards_json: result.cardsJson,
    cost:       result.cost,
  });
  log('persistPackOpening:pack', packRes);

  // 2. Adicionar cartas à coleção
  if (result.cardsJson.length > 0) {
    const cardRes = await collection.addCards(
      userId,
      result.cardsJson.map(c => c.cardId),
    );
    log('persistPackOpening:cards', cardRes);
  }

  // 3. Incrementar packs_opened no perfil
  const statsRes = await users.updateProgress(userId, {
    packs_opened: undefined,  // será atualizado pelo trigger ou pelo addReward
  });
  log('persistPackOpening:stats', statsRes);
}

// ─── Squad ───────────────────────────────────────────────────────────────────

export type SquadState = {
  formation: string;
  slots:     Array<{ slotId: string; ownedCardId: string }>;
  benchIds:  string[];
};

/**
 * Persiste o squad atual do usuário.
 */
export async function persistSquad(userId: string, squad: SquadState) {
  if (!userId) return;
  const { squads } = getRegistry();
  const result = await squads.upsert({
    user_id:   userId,
    formation: squad.formation,
    slots:     squad.slots as any,
    bench_ids: squad.benchIds,
  });
  log('persistSquad', result);
}

// ─── Achievement ──────────────────────────────────────────────────────────────

/**
 * Registra reivindicação de conquista/missão.
 * Idempotente: não duplica se já reivindicado.
 */
export async function persistAchievementClaim(
  userId:        string,
  achievementId: string,
  stage:         number,
) {
  if (!userId) return;
  const { achievements } = getRegistry();
  const result = await achievements.claim({
    user_id:        userId,
    achievement_id: achievementId,
    stage,
  });
  log('persistAchievementClaim', result);
}

/**
 * Carrega o sumário de conquistas do usuário.
 * Retorna { achievementId: maxStage } ou {} se offline.
 */
export async function loadAchievementSummary(userId: string): Promise<Record<string, number>> {
  if (!userId) return {};
  const { achievements } = getRegistry();
  const result = await achievements.getSummary(userId);
  if (!result.ok) return {};
  return result.value;
}

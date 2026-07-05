/**
 * lib/crash/sentry.ts — T068
 *
 * Helpers tipados para uso do Sentry no World Legends.
 *
 * Uso:
 *   import { crash, breadcrumb, setGameContext } from '@/lib/crash/sentry'
 *
 *   crash.captureError(error, { context:'pack_opening', packId:'classic' })
 *   breadcrumb.packStep('open_started', { packId:'classic' })
 *   setGameContext({ level:12, credits:4250 })
 */

import * as Sentry from '@sentry/nextjs';

// ─── Contexto do jogo ─────────────────────────────────────────────────────────

export type GameContext = {
  userId?: string;
  username?: string;
  level?: number;
  squadOvr?: number;
  credits?: number;
  totalCards?: number;
  wins?: number;
};

/** Define o contexto do jogo para aparecer em todos os erros subsequentes */
export function setGameContext(ctx: GameContext): void {
  if (ctx.userId) {
    Sentry.setUser({
      id: ctx.userId,
      ...(ctx.username !== undefined ? { username: ctx.username } : {}),
    });
  }

  Sentry.setContext('game', {
    level: ctx.level,
    squad_ovr: ctx.squadOvr,
    credits: ctx.credits,
    total_cards: ctx.totalCards,
    wins: ctx.wins,
  });
}

export function clearGameContext(): void {
  Sentry.setUser(null);
  Sentry.setContext('game', null);
}

// ─── Release / deploy ────────────────────────────────────────────────────────

export function setRelease(release: string): void {
  // O release é definido em sentry.client.config.ts
  // Esta função permite atualizar dinamicamente se necessário
  Sentry.setTag('release', release);
}

// ─── Captura de erros ─────────────────────────────────────────────────────────

type CrashContext = {
  context: string; // onde aconteceu (ex: 'pack_opening', 'match')
  userId?: string;
  extras?: Record<string, unknown>;
  tags?: Record<string, string>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
};

export const crash = {
  /** Capturar uma exceção com contexto adicional */
  captureError(error: unknown, ctx: CrashContext): string {
    return Sentry.withScope((scope) => {
      scope.setTag('context', ctx.context);
      if (ctx.userId) scope.setUser({ id: ctx.userId });
      if (ctx.tags) Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v));
      if (ctx.extras) Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v));
      if (ctx.level) scope.setLevel(ctx.level);
      return Sentry.captureException(error);
    });
  },

  /** Capturar mensagem (não-erro) */
  captureMessage(message: string, ctx?: Partial<CrashContext>): string {
    return Sentry.withScope((scope) => {
      if (ctx?.context) scope.setTag('context', ctx.context);
      if (ctx?.tags) Object.entries(ctx.tags).forEach(([k, v]) => scope.setTag(k, v));
      if (ctx?.level) scope.setLevel(ctx.level);
      return Sentry.captureMessage(message);
    });
  },
};

// ─── Breadcrumbs manuais ──────────────────────────────────────────────────────
//
// Sentry já captura automaticamente:
//   - Navegações de rota (history API)
//   - Cliques no DOM
//   - Requests fetch/XHR
//   - console.warn / console.error
//
// Os breadcrumbs abaixo adicionam contexto de negócio específico do jogo.

type BreadcrumbData = Record<string, string | number | boolean | undefined | null>;

function addBreadcrumb(
  category: string,
  message: string,
  data?: BreadcrumbData,
  level: Sentry.SeverityLevel = 'info',
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    timestamp: Date.now() / 1000,
    ...(data !== undefined ? { data } : {}),
  });
}

export const breadcrumb = {
  // ── Onboarding ─────────────────────────────────────────────────────────────
  onboarding: {
    started: () => addBreadcrumb('onboarding', 'Onboarding iniciado'),
    step: (step: number, name: string) =>
      addBreadcrumb('onboarding', `Etapa ${step}: ${name}`, { step, name }),
    completed: (username: string) =>
      addBreadcrumb('onboarding', 'Onboarding concluído', { username }),
    abandoned: (atStep: number) =>
      addBreadcrumb('onboarding', 'Onboarding abandonado', { at_step: atStep }, 'warning'),
  },

  // ── Pack Opening ───────────────────────────────────────────────────────────
  pack: {
    selected: (packId: string, cost: number) =>
      addBreadcrumb('pack', 'Pack selecionado', { pack_id: packId, cost }),
    tapStarted: (packId: string) => addBreadcrumb('pack', 'Abrindo pack...', { pack_id: packId }),
    exploded: (packId: string) => addBreadcrumb('pack', 'Pack explodiu!', { pack_id: packId }),
    cardRevealed: (rarityCode: string, ovr: number) =>
      addBreadcrumb('pack', `Carta revelada: ${rarityCode}`, { rarity: rarityCode, ovr }),
    goatRevealed: (cardId: string, ovr: number) =>
      addBreadcrumb('pack', '🐐 GOAT revelado!', { card_id: cardId, ovr }, 'warning'),
    completed: (packId: string, count: number) =>
      addBreadcrumb('pack', 'Pack completamente revelado', { pack_id: packId, cards: count }),
  },

  // ── Match ──────────────────────────────────────────────────────────────────
  match: {
    opponentSelected: (opponentId: string, difficulty: string) =>
      addBreadcrumb('match', 'Adversário selecionado', { opponent_id: opponentId, difficulty }),
    started: (userOvr: number, opponentOvr: number) =>
      addBreadcrumb('match', 'Partida iniciada', { user_ovr: userOvr, opponent_ovr: opponentOvr }),
    halfTime: (homeScore: number, awayScore: number) =>
      addBreadcrumb('match', 'Intervalo', { home: homeScore, away: awayScore }),
    goal: (scorer: string, side: 'home' | 'away', minute: number) =>
      addBreadcrumb('match', `GOL! ${scorer}`, { side, minute }),
    completed: (outcome: string, homeScore: number, awayScore: number) =>
      addBreadcrumb('match', `Partida encerrada: ${outcome}`, {
        outcome,
        home: homeScore,
        away: awayScore,
      }),
    abandoned: (atMinute: number) =>
      addBreadcrumb('match', 'Partida abandonada', { at_minute: atMinute }, 'warning'),
  },

  // ── Squad Builder ──────────────────────────────────────────────────────────
  squad: {
    opened: (formation: string, ovr: number) =>
      addBreadcrumb('squad', 'Squad Builder aberto', { formation, ovr }),
    cardPlaced: (position: string, rarity: string) =>
      addBreadcrumb('squad', 'Carta posicionada', { position, rarity }),
    formationChanged: (from: string, to: string) =>
      addBreadcrumb('squad', `Formação: ${from} → ${to}`, { from, to }),
    saved: (ovr: number, chemistry: number) =>
      addBreadcrumb('squad', 'Squad salvo', { ovr, chemistry }),
  },

  // ── Autenticação ──────────────────────────────────────────────────────────
  auth: {
    loginAttempted: (method: string) =>
      addBreadcrumb('auth', `Login tentado: ${method}`, { method }),
    loginSuccess: (method: string) =>
      addBreadcrumb('auth', `Login bem-sucedido: ${method}`, { method }),
    loginFailed: (method: string, reason: string) =>
      addBreadcrumb('auth', `Login falhou: ${method}`, { method, reason }, 'error'),
    logout: () => addBreadcrumb('auth', 'Logout realizado'),
  },

  // ── Persistência ─────────────────────────────────────────────────────────
  sync: {
    queued: (type: string) => addBreadcrumb('sync', `Mudança enfileirada: ${type}`, { type }),
    saved: (type: string) => addBreadcrumb('sync', `Salvo: ${type}`, { type }),
    failed: (type: string, error: string) =>
      addBreadcrumb('sync', `Falha ao salvar: ${type}`, { type, error }, 'error'),
    offline: () => addBreadcrumb('sync', 'Ficou offline', undefined, 'warning'),
    online: () => addBreadcrumb('sync', 'Voltou online'),
    retried: (type: string, attempt: number) =>
      addBreadcrumb('sync', `Retentando: ${type} (${attempt}ª vez)`, { type, attempt }),
  },

  // ── Genérico ──────────────────────────────────────────────────────────────
  nav: (from: string, to: string) => addBreadcrumb('navigation', `${from} → ${to}`, { from, to }),

  info: (msg: string, data?: BreadcrumbData) => addBreadcrumb('app', msg, data),
};

// ─── Error Boundary helper ────────────────────────────────────────────────────

/** Para usar em componentes que capturam erros React */
export function sentryOnError(
  error: Error,
  info: { componentStack?: string },
  context: string,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('context', context);
    scope.setExtra('componentStack', info.componentStack);
    Sentry.captureException(error);
  });
}

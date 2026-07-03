/**
 * tRPC router: match
 * Tela: Tela de Partida + Resultado (doc 03 §2)
 */
import { z } from 'zod';
import { router, protectedProc } from '../trpc/init';

export const matchRouter = router({
  /** Timeline de uma partida para reprodução (doc 03 §3.4). */
  timeline: protectedProc
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.repos.match.findById(input.matchId);
      if (!match.ok) throw new Error(match.error.message);
      if (!match.value) throw new Error('Partida não encontrada.');

      // Validação: só participantes podem ver (RLS garante no DB, mas validamos aqui tb)
      const m = match.value;
      const isParticipant = m.homeProfileId === ctx.userId || m.awayProfileId === ctx.userId;
      if (!isParticipant) throw new Error('Acesso negado.');

      const events = await ctx.repos.match.getEvents(input.matchId);
      if (!events.ok) throw new Error(events.error.message);

      return {
        match: m,
        events: events.value,
      };
    }),

  /** Partidas de uma rodada de liga. */
  byLeagueRound: protectedProc
    .input(z.object({ leagueRoundId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.repos.match.findByLeagueRound(input.leagueRoundId);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    }),
});

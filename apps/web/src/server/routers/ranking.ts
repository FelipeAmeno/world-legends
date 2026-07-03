/**
 * tRPC router: ranking
 * Tela: Ranking Global (doc 03 §2)
 */
import { z } from 'zod';
import { router, protectedProc, publicProc } from '../trpc/init';

export const rankingRouter = router({
  /** Leaderboard da temporada ativa. */
  leaderboard: publicProc
    .input(z.object({ limit: z.number().min(1).max(200).default(100) }))
    .query(async ({ ctx, input }) => {
      const seasonResult = await ctx.repos.season.findActive();
      if (!seasonResult.ok || !seasonResult.value) {
        return { rows: [], seasonCode: null };
      }
      const season = seasonResult.value;
      const rows = await ctx.repos.ranking.findLeaderboard(season.id, input.limit);
      if (!rows.ok) throw new Error(rows.error.message);
      return { rows: rows.value, seasonCode: season.code };
    }),

  /** Posição do usuário na temporada ativa. */
  myPosition: protectedProc.query(async ({ ctx }) => {
    const seasonResult = await ctx.repos.season.findActive();
    if (!seasonResult.ok || !seasonResult.value) return null;
    const result = await ctx.repos.ranking.findBySeasonAndProfile(
      seasonResult.value.id, ctx.userId,
    );
    if (!result.ok) return null;
    return result.value;
  }),
});

/**
 * tRPC router: packs
 * Tela: Loja de Packs (doc 03 §2)
 * A abertura de packs é uma Server Action (escrita transacional), não um query.
 */
import { z } from 'zod';
import { router, publicProc, protectedProc } from '../trpc/init';

export const packsRouter = router({
  /** Packs disponíveis para compra agora (doc 10 §14). */
  available: publicProc.query(async ({ ctx }) => {
    const result = await ctx.repos.pack.findAvailable();
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }),

  /** Pity counter atual do usuário (doc 10 §15). */
  pityStatus: protectedProc.query(async ({ ctx }) => {
    const [legendary, ultra] = await Promise.all([
      ctx.repos.pack.getPityCounter(ctx.userId, 'legendary_plus'),
      ctx.repos.pack.getPityCounter(ctx.userId, 'ultra_plus'),
    ]);
    return {
      legendaryPlus: legendary.ok ? legendary.value : 0,
      ultraPlus:     ultra.ok     ? ultra.value     : 0,
    };
  }),
});

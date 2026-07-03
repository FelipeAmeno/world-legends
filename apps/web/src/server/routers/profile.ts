/**
 * tRPC router: profile
 * Tela: Perfil / Amigos (doc 03 §2)
 */
import { z } from 'zod';
import { router, protectedProc, publicProc } from '../trpc/init';

export const profileRouter = router({
  /** Perfil público de um usuário. */
  byId: publicProc
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.repos.profile.findById(input.profileId);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    }),

  /** Perfil do usuário autenticado. */
  me: protectedProc.query(async ({ ctx }) => {
    const result = await ctx.repos.profile.findById(ctx.userId);
    if (!result.ok) throw new Error(result.error.message);
    if (!result.value) throw new Error('Perfil não encontrado.');
    return result.value;
  }),

  /** Atualizar display_name ou avatar. */
  update: protectedProc
    .input(z.object({
      displayName: z.string().min(1).max(32).optional(),
      avatarUrl:   z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.repos.profile.update(ctx.userId, {
        displayName: input.displayName,
        avatarUrl:   input.avatarUrl,
      });
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    }),
});

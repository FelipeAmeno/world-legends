/**
 * tRPC router: collection
 * Tela: Coleção de Cartas (doc 03 §2)
 * Dados: user_cards + cards + players
 */
import { z } from 'zod';
import { router, protectedProc } from '../trpc/init';

export const collectionRouter = router({
  /** Todas as cartas do usuário autenticado. */
  myCards: protectedProc
    .input(z.object({
      position:    z.string().optional(),
      rarityCode:  z.string().optional(),
      search:      z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const result = await ctx.repos.userCard.findByProfile(ctx.userId);
      if (!result.ok) throw new Error(result.error.message);
      let cards = [...result.value];

      // Filtros client-side sobre a lista (filtros DB seriam adicionados no adapter)
      if (input?.search) {
        const q = input.search.toLowerCase();
        cards = cards.filter((c) =>
          c.cardId.toLowerCase().includes(q)
        );
      }
      return cards;
    }),

  /** Detalhe de uma carta específica. */
  cardDetail: protectedProc
    .input(z.object({ userCardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.repos.userCard.findById(input.userCardId);
      if (!result.ok) throw new Error(result.error.message);
      if (!result.value) throw new Error('Carta não encontrada.');
      // Validação de posse: só o dono pode ver
      if (result.value.profileId !== ctx.userId) {
        throw new Error('Acesso negado.');
      }
      return result.value;
    }),
});

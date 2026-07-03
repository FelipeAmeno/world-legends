/**
 * Root router tRPC — compõe todos os sub-routers (T025).
 */
import { router } from '../trpc/init';
import { profileRouter    } from './profile';
import { collectionRouter } from './collection';
import { matchRouter      } from './match';
import { rankingRouter    } from './ranking';
import { packsRouter      } from './packs';

export const appRouter = router({
  profile:    profileRouter,
  collection: collectionRouter,
  match:      matchRouter,
  ranking:    rankingRouter,
  packs:      packsRouter,
});

export type AppRouter = typeof appRouter;

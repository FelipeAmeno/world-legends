/**
 * tRPC client para o browser.
 * Importado em componentes Client para fazer queries e mutations.
 */
'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

/**
 * Tipos do fluxo de Squad — separados de squad.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { FormationKey } from '@/lib/squad-data';

export type SquadSlotInput = {
  slotId: string;
  userCardId: string;
  isStarter: boolean;
  benchOrder?: number;
};

export type SaveSquadInput = {
  formation: FormationKey;
  slots: SquadSlotInput[];
};

export type SaveSquadResult = { ok: true; squadId: string } | { ok: false; error: string };

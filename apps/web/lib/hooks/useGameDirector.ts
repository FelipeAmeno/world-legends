'use client';

import { type DirectorAction, type DirectorInput, computeNextAction } from '@/lib/game-director';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDailyLogin } from './useDailyLogin';

const DREAM_KEY = 'wl:dream-team';

function readDreamTeamCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(DREAM_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as string[]).length;
  } catch {
    return 0;
  }
}

type UseGameDirectorInput = Omit<
  DirectorInput,
  'dreamTeamCount' | 'canClaimDaily' | 'hasMissionReward'
> & {
  hasMissionReward?: boolean;
};

type UseGameDirectorReturn = {
  action: DirectorAction;
  openDaily: () => void;
};

export function useGameDirector(input: UseGameDirectorInput): UseGameDirectorReturn {
  const { view, open: openDaily } = useDailyLogin();
  const [dreamTeamCount, setDreamTeamCount] = useState(0);

  useEffect(() => {
    setDreamTeamCount(readDreamTeamCount());
    const onStorage = (e: StorageEvent) => {
      if (e.key === DREAM_KEY) setDreamTeamCount(readDreamTeamCount());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const action = useMemo<DirectorAction>(() => {
    const fullInput: DirectorInput = {
      ...input,
      dreamTeamCount,
      canClaimDaily: view?.state.canClaimToday ?? false,
      hasMissionReward: input.hasMissionReward ?? false,
    };
    return computeNextAction(fullInput);
  }, [input, dreamTeamCount, view?.state.canClaimToday, input.hasMissionReward]);

  const stableOpenDaily = useCallback(() => openDaily(), [openDaily]);

  return { action, openDaily: stableOpenDaily };
}

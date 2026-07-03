'use client';

import {
  claimDailyLoginAction,
  getDailyLoginAction,
  type ClaimDailyLoginResult,
  type ClaimDayPayload,
  type DailyLoginView,
} from '@/lib/actions/daily-login';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

export type UseDailyLoginReturn = {
  view: DailyLoginView | null;
  loading: boolean;
  claiming: boolean;
  lastClaim: ClaimDayPayload | null;
  claim: () => void;
  open: () => void;
  dismiss: () => void;
  isOpen: boolean;
};

export function useDailyLogin(): UseDailyLoginReturn {
  const [view, setView] = useState<DailyLoginView | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastClaim, setLastClaim] = useState<ClaimDayPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startT] = useTransition();
  const hasFetched = useRef(false);

  // Fetch on mount — show modal if can claim
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;
    getDailyLoginAction().then((v) => {
      if (cancelled) return;
      setView(v);
      setLoading(false);
      // Auto-open if there's a reward waiting
      if (v.state.canClaimToday) setIsOpen(true);
    });
    return () => { cancelled = true; };
  }, []);

  const claim = useCallback(() => {
    startT(async () => {
      const result: ClaimDailyLoginResult = await claimDailyLoginAction();
      if (!result.ok) return;

      setLastClaim(result.payload);
      // Optimistically update state
      setView((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: {
            ...prev.state,
            canClaimToday: false,
            alreadyClaimedToday: true,
            currentDay: result.payload.nextState.nextDay,
            streakDays: result.payload.nextState.nextStreak,
          },
        };
      });
    });
  }, []);

  const open = useCallback(() => setIsOpen(true), []);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setLastClaim(null);
  }, []);

  return {
    view,
    loading,
    claiming: isPending,
    lastClaim,
    claim,
    open,
    dismiss,
    isOpen,
  };
}

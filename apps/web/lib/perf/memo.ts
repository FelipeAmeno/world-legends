/**
 * lib/perf/memo.ts — T069
 *
 * Utilitários de memoização e performance para React.
 *
 * Padrões usados no World Legends:
 *   - useStableCallback → callback sem referência nova a cada render
 *   - useDeepMemo       → useMemo com comparação profunda
 *   - useDebounced      → valor debounced para inputs de busca
 *   - useThrottled      → valor throttled para scroll/resize
 *   - usePrevious       → valor anterior para detectar mudanças
 *   - createSelector    → selector memoizado (inspirado em Reselect)
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { DependencyList } from 'react';

// ─── useStableCallback ────────────────────────────────────────────────────────

/**
 * Retorna uma função estável que sempre chama a versão mais recente do callback.
 * Evita re-renders causados por callbacks em useEffect/useMemo.
 *
 * Uso:
 *   const onSave = useStableCallback((id: string) => { ... });
 *   // onSave tem sempre a mesma referência
 */
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

// ─── useDebounced ─────────────────────────────────────────────────────────────

/**
 * Retorna o valor após um delay.
 * Ideal para busca instantânea sem sobrecarregar o filtro.
 *
 * Uso:
 *   const debouncedSearch = useDebounced(search, 300);
 *   // debouncedSearch só atualiza 300ms após parar de digitar
 */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// ─── useThrottled ─────────────────────────────────────────────────────────────

/**
 * Throttle: garante que o valor só atualiza a cada N ms.
 * Ideal para scroll position e resize.
 */
export function useThrottled<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now   = Date.now();
    const delta = now - lastUpdate.current;

    if (delta >= intervalMs) {
      setThrottled(value);
      lastUpdate.current = now;
    } else {
      const t = setTimeout(() => {
        setThrottled(value);
        lastUpdate.current = Date.now();
      }, intervalMs - delta);
      return () => clearTimeout(t);
    }
  }, [value, intervalMs]);

  return throttled;
}

// ─── usePrevious ──────────────────────────────────────────────────────────────

/** Captura o valor anterior para detectar mudanças. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ─── createSelector ───────────────────────────────────────────────────────────

/**
 * Cria um selector memoizado (similar ao Reselect).
 * Só recomputa quando as entradas mudam.
 *
 * Uso:
 *   const selectFilteredCards = createSelector(
 *     (state: State) => state.cards,
 *     (state: State) => state.filters,
 *     (cards, filters) => filterAndSort(cards, filters),
 *   );
 *
 *   // No componente:
 *   const cards = selectFilteredCards(state);
 */
type Selector<TInput, TResult> = (input: TInput) => TResult;
type SelectorCreator<TInput, TDeps extends unknown[], TResult> = {
  (...extractors: [...{ [K in keyof TDeps]: Selector<TInput, TDeps[K]> }, (...deps: TDeps) => TResult]): Selector<TInput, TResult>;
};

export function createSelector<TInput, TA, TR>(
  extA:   Selector<TInput, TA>,
  compute:(a: TA) => TR,
): Selector<TInput, TR>;

export function createSelector<TInput, TA, TB, TR>(
  extA:   Selector<TInput, TA>,
  extB:   Selector<TInput, TB>,
  compute:(a: TA, b: TB) => TR,
): Selector<TInput, TR>;

export function createSelector<TInput, TA, TB, TC, TR>(
  extA:   Selector<TInput, TA>,
  extB:   Selector<TInput, TB>,
  extC:   Selector<TInput, TC>,
  compute:(a: TA, b: TB, c: TC) => TR,
): Selector<TInput, TR>;

export function createSelector(...args: (Selector<any,any> | ((...a:any[])=>any))[]) {
  const extractors = args.slice(0, -1) as Selector<any,any>[];
  const compute    = args[args.length - 1] as (...deps:any[]) => any;

  let lastDeps:    any[] | null = null;
  let lastResult:  any          = undefined;

  return (input: any) => {
    const deps = extractors.map(e => e(input));
    const same = lastDeps !== null && deps.every((d, i) => d === lastDeps![i]);

    if (!same) {
      lastResult = compute(...deps);
      lastDeps   = deps;
    }

    return lastResult;
  };
}

// ─── useIsVisible ─────────────────────────────────────────────────────────────

/**
 * Lazy loading baseado em IntersectionObserver.
 * Componente só renderiza quando entra na viewport.
 *
 * Uso:
 *   const { ref, isVisible } = useIsVisible({ threshold:0.1 });
 *   return <div ref={ref}>{isVisible ? <Heavy /> : <Skeleton />}</div>
 */
export function useIsVisible(options?: IntersectionObserverInit) {
  const ref                     = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        obs.disconnect(); // só precisa observar uma vez
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, isVisible };
}

// ─── useIdleCallback ─────────────────────────────────────────────────────────

/**
 * Adia execução para quando o browser estiver ocioso.
 * Ideal para prefetch e analytics não críticos.
 */
export function useIdleCallback(fn: () => void, deps: DependencyList) {
  useEffect(() => {
    if (typeof requestIdleCallback === 'undefined') {
      const t = setTimeout(fn, 1000);
      return () => clearTimeout(t);
    }
    const id = requestIdleCallback(fn, { timeout:2000 });
    return () => cancelIdleCallback(id);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── measureRender ───────────────────────────────────────────────────────────

/**
 * Mede o tempo de render de um componente (dev only).
 * Usa a Performance API.
 */
export function measureRender(name: string) {
  if (process.env.NODE_ENV !== 'development') return;
  const start = `${name}_start`;
  const end   = `${name}_end`;
  performance.mark(start);
  return () => {
    performance.mark(end);
    performance.measure(name, start, end);
    const [measure] = performance.getEntriesByName(name);
    if (measure && measure.duration > 16) {
      console.warn(`[perf] ${name}: ${measure.duration.toFixed(1)}ms (>16ms = jank)`);
    }
    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(name);
  };
}

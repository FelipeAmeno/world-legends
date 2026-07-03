'use client';

import { useCallback, useState } from 'react';
import { DebugPanel, MonoRow } from './DebugPanel';

// RNG inline (mulberry32) — sem importar pacotes para isolamento
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function chiSquare(vals: number[], buckets = 10): number {
  const counts = new Array(buckets).fill(0);
  for (const v of vals) counts[Math.min(buckets - 1, Math.floor(v * buckets))]++;
  const expected = vals.length / buckets;
  return counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
}

export function RngInspector() {
  const [seed, setSeed] = useState(42);
  const [count, setCount] = useState(20);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [chi, setChi] = useState<number | null>(null);

  const generate = useCallback(() => {
    const rng = mulberry32(seed);
    const vals = Array.from({ length: Math.min(1000, count) }, () =>
      Number.parseFloat(rng().toFixed(8)),
    );
    setNumbers(vals.slice(0, 20)); // mostrar apenas os primeiros 20
    setChi(chiSquare(vals));
  }, [seed, count]);

  // Histograma (10 buckets)
  const histogram = (() => {
    if (numbers.length === 0) return [];
    const buckets = new Array(10).fill(0);
    for (const v of numbers) buckets[Math.min(9, Math.floor(v * 10))]++;
    return buckets;
  })();
  const maxBucket = Math.max(1, ...histogram);

  const chiStatus = chi === null ? null : chi < 16.9 ? 'ok' : 'fail'; // α=0.05, df=9

  return (
    <DebugPanel
      title="RNG INSPECTOR"
      tag="mulberry32"
      status={chiStatus === null ? '' : chiStatus === 'ok' ? 'χ² PASS' : 'χ² FAIL'}
      statusOk={chiStatus === 'ok'}
      mono
    >
      {/* Controles */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <p className="text-[9px] text-muted mb-1">SEED</p>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-full bg-[#060c08] border border-[#1a2620] rounded px-2 py-1
                       text-emerald-400 text-xs font-mono focus:outline-none focus:border-emerald-700"
          />
        </div>
        <div className="w-20">
          <p className="text-[9px] text-muted mb-1">AMOSTRAS</p>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={10}
            max={1000}
            className="w-full bg-[#060c08] border border-[#1a2620] rounded px-2 py-1
                       text-emerald-400 text-xs font-mono focus:outline-none focus:border-emerald-700"
          />
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={generate}
            className="px-3 py-1 rounded bg-emerald-900/60 border border-emerald-700/50
                       text-emerald-400 text-[10px] font-mono font-bold hover:bg-emerald-900
                       transition-colors"
          >
            RUN
          </button>
        </div>
      </div>

      {numbers.length > 0 && (
        <>
          {/* Histograma */}
          <p className="text-[9px] text-muted mb-1.5">DISTRIBUIÇÃO (10 buckets)</p>
          <div className="flex items-end gap-0.5 h-16 mb-3">
            {histogram.map((c, i) => {
              const h = Math.round((c / maxBucket) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-emerald-600/80 min-h-[2px] transition-all"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[7px] text-muted">{(i * 0.1).toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          {/* Primeiros 20 números */}
          <p className="text-[9px] text-muted mb-1">SEQUÊNCIA (primeiros {numbers.length})</p>
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 mb-3">
            {numbers.map((n, i) => (
              <span key={i} className="text-[9px] font-mono text-emerald-400/80">
                <span className="text-muted">{String(i).padStart(2, '0')} </span>
                {n.toFixed(6)}
              </span>
            ))}
          </div>

          {/* Chi-square */}
          {chi !== null && (
            <div className="border-t border-[#1a2620] pt-2">
              <MonoRow
                label="χ² statistic"
                value={chi.toFixed(4)}
                color={chiStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}
              />
              <MonoRow label="critical (α.05)" value="16.9190" color="text-muted" />
              <MonoRow
                label="resultado"
                value={chiStatus === 'ok' ? 'UNIFORME ✓' : 'NÃO UNIFORME ✗'}
                color={chiStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
          )}
        </>
      )}

      {numbers.length === 0 && (
        <p className="text-muted text-[10px] text-center py-4 font-mono">
          pressione RUN para gerar números
        </p>
      )}
    </DebugPanel>
  );
}

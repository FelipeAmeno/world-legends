'use client';

import { MATCH_OPPONENTS, runMatch } from '@/lib/match-data';
import { useCallback, useState } from 'react';
import { DebugPanel } from './DebugPanel';

type LogLine = {
  ts: string;
  level: 'INFO' | 'GOAL' | 'CARD' | 'HALF' | 'END' | 'STAT' | 'ERR';
  text: string;
};

const LEVEL_COLOR: Record<LogLine['level'], string> = {
  INFO: 'text-emerald-400/80',
  GOAL: 'text-amber-400 font-bold',
  CARD: 'text-yellow-400',
  HALF: 'text-blue-400',
  END: 'text-parchment font-bold',
  STAT: 'text-cyan-400/80',
  ERR: 'text-red-400 font-bold',
};

export function LogPanel() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(42);

  const run = useCallback(() => {
    setRunning(true);
    setLines([]);

    const opp = MATCH_OPPONENTS[Math.floor(Math.random() * MATCH_OPPONENTS.length)]!;

    const startTs = Date.now();
    const log: LogLine[] = [];

    const push = (level: LogLine['level'], text: string) => {
      const elapsed = Date.now() - startTs;
      log.push({ ts: `+${elapsed}ms`.padStart(7), level, text });
    };

    push('INFO', `simulateSquadMatch() — seed=${seed}`);
    push('INFO', `home=Seleção BR · away=${opp.name}`);
    push('INFO', `formation=4-3-3 · opp_ovr=${opp.avgOvr}`);

    setTimeout(() => {
      try {
        const result = runMatch(opp, seed);
        setSeed((s) => s + 1);

        push('INFO', 'engine started');
        push('HALF', '--- KICK OFF ---');

        // Processar eventos
        for (const ev of result.events) {
          if (ev.type === 'kickoff') {
            push('INFO', `${ev.text}`);
          } else if (ev.type === 'goal') {
            push('GOAL', `${ev.minute}' ⚽ ${ev.text}`);
          } else if (ev.type === 'card') {
            push('CARD', `${ev.minute}' ${ev.text}`);
          } else if (ev.type === 'half_time') {
            push('HALF', '--- INTERVAL ---');
          } else if (ev.type === 'full_time') {
            push('END', '--- FULL TIME ---');
          } else {
            push('INFO', `${ev.minute ?? 0}' ${ev.text}`);
          }
        }

        push(
          'END',
          `RESULT: ${result.homeScore} × ${result.awayScore} (${result.winner.toUpperCase()})`,
        );
        push('STAT', `possession: ${result.stats.possession[0]}% / ${result.stats.possession[1]}%`);
        push('STAT', `shots: ${result.stats.shots[0]} / ${result.stats.shots[1]}`);
        push('STAT', `xG: ${result.stats.xg[0]} / ${result.stats.xg[1]}`);
        push('STAT', `credits: +${result.rewards.credits}c · xp: +${result.rewards.xp}`);
        if (result.mvp) push('INFO', `MVP: ${result.mvp.displayName} (${result.mvp.overall} OVR)`);

        push('INFO', 'simulation complete');
      } catch (e: any) {
        push('ERR', `ERROR: ${e?.message ?? String(e)}`);
      }

      setLines([...log]);
      setRunning(false);
    }, 120);
  }, [seed]);

  const clear = () => setLines([]);

  return (
    <DebugPanel
      title="SIMULATION LOG"
      tag="match-simulator"
      status={running ? 'RUNNING…' : lines.length > 0 ? `${lines.length} lines` : 'IDLE'}
      statusOk={!running}
      mono
    >
      {/* Controles */}
      <div className="flex gap-2 mb-3">
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
        <div className="flex flex-col justify-end gap-1">
          <button
            onClick={run}
            disabled={running}
            className={[
              'px-3 py-1 rounded border text-[10px] font-mono font-bold transition-colors',
              running
                ? 'bg-transparent border-muted text-muted cursor-wait'
                : 'bg-emerald-900/60 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900',
            ].join(' ')}
          >
            {running ? 'RUN…' : 'RUN'}
          </button>
          {lines.length > 0 && (
            <button
              onClick={clear}
              className="px-3 py-1 rounded border border-[#1a2620] text-muted
                         text-[9px] font-mono hover:text-parchment transition-colors"
            >
              CLR
            </button>
          )}
        </div>
      </div>

      {/* Output terminal */}
      <div className="bg-[#03050a] rounded border border-[#0d1520] p-3 h-64 overflow-y-auto font-mono">
        {lines.length === 0 && !running ? (
          <p className="text-muted/50 text-[10px]">$ aguardando RUN…</p>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 text-[9px] leading-relaxed">
                <span className="text-muted/50 shrink-0 w-12">{line.ts}</span>
                <span className={`text-[8px] font-bold w-8 shrink-0 ${LEVEL_COLOR[line.level]}`}>
                  [{line.level}]
                </span>
                <span className={`flex-1 ${LEVEL_COLOR[line.level]}`}>{line.text}</span>
              </div>
            ))}
            {running && (
              <div className="flex gap-2 text-[9px]">
                <span className="text-muted/50 w-12">……</span>
                <span className="text-emerald-400 animate-pulse">█</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DebugPanel>
  );
}

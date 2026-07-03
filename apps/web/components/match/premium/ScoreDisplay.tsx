'use client';
// ScoreDisplay.tsx
import { AnimatePresence, motion } from 'framer-motion';

type ScoreProps = {
  homeScore: number;
  awayScore: number;
  minute: number;
  homeName: string;
  awayName: string;
  isGoalAnim: boolean;
  winner: 'home' | 'away' | 'draw' | null;
};

export function ScoreDisplay({
  homeScore,
  awayScore,
  minute,
  homeName,
  awayName,
  isGoalAnim,
  winner,
}: ScoreProps) {
  const min = Math.min(90, minute);
  const isHT = minute >= 45 && minute < 47;
  const isFT = minute >= 90;
  const timeLabel = isFT ? 'FT' : isHT ? 'HT' : `${min}'`;

  return (
    <div
      className="relative px-4 py-4 text-center"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)' }}
    >
      {/* Teams + score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex-1 text-right">
          <p className="text-white/50 text-[10px] font-medium truncate">{homeName}</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={homeScore}
              className="font-display text-5xl text-white"
              initial={{ scale: 1.6, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textShadow: isGoalAnim ? '0 0 20px rgba(16,185,129,0.9)' : undefined }}
            >
              {homeScore}
            </motion.span>
          </AnimatePresence>

          <div className="text-center">
            <div
              className="px-2 py-0.5 rounded font-mono text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              {timeLabel}
            </div>
            {winner && (
              <p
                className={`text-[9px] font-bold mt-0.5 ${
                  winner === 'home'
                    ? 'text-emerald-400'
                    : winner === 'away'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`}
              >
                {winner === 'home' ? 'VITÓRIA' : winner === 'away' ? 'DERROTA' : 'EMPATE'}
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.span
              key={awayScore}
              className="font-display text-5xl text-white"
              initial={{ scale: 1.6, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {awayScore}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Away */}
        <div className="flex-1 text-left">
          <p className="text-white/50 text-[10px] font-medium truncate">{awayName}</p>
        </div>
      </div>
    </div>
  );
}

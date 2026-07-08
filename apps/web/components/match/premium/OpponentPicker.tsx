import type { MatchOpponent } from '@/lib/match-data';
import { computeWinProbability } from '@/lib/match-data';
import { motion } from 'framer-motion';

type Props = {
  opponents: readonly MatchOpponent[];
  userOvr: number;
  onSelect: (id: string) => void;
};

const DIFF_PILL: Record<string, string> = {
  easy: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400',
  medium: 'bg-yellow-900/30  border-yellow-700/40  text-yellow-400',
  hard: 'bg-red-900/30     border-red-700/40     text-red-400',
};
const DIFF_LABEL: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export function OpponentPicker({ opponents, userOvr, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {opponents.map((opp, i) => {
        const prob = computeWinProbability(userOvr, opp.avgOvr);
        return (
          <motion.button
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(opp.id)}
            className="relative text-left p-4 rounded-2xl border border-white/10 bg-white/[0.03]
                       hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden"
          >
            {/* Glow hover */}
            <div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${opp.color?.replace('text-', '').replace('-400', '') === 'gold' ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)'}, transparent 70%)`,
              }}
            />

            {/* Flag + name */}
            <div className="text-2xl mb-2">{opp.flag}</div>
            <p className={`font-bold text-sm leading-tight mb-2 ${opp.color}`}>{opp.name}</p>

            {/* OVR + diff */}
            <div className="flex items-end gap-2 mb-3">
              <span className="font-display text-3xl gold-text">{opp.avgOvr}</span>
              <div className="mb-1">
                <p className="text-[8px] text-white/30 leading-none">OVR</p>
                <p className="text-[8px] text-white/30">{opp.formation}</p>
              </div>
            </div>

            {/* Win probability */}
            <div className="mb-2">
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                <div className="rounded-l-full bg-emerald-600" style={{ width: `${prob.home}%` }} />
                <div className="bg-yellow-600/70" style={{ width: `${prob.draw}%` }} />
                <div className="rounded-r-full bg-red-700" style={{ width: `${prob.away}%` }} />
              </div>
              <p className="text-emerald-400 text-[8px] mt-1 font-bold">{prob.home}% vitória</p>
            </div>

            {/* Difficulty */}
            <span
              className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFF_PILL[opp.difficulty]}`}
            >
              {DIFF_LABEL[opp.difficulty]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

'use client';

/**
 * SquadRequiredScreen — Sprint 26 (Gameplay Foundation), Prioridade 0.
 *
 * "Se não houver squad salvo, bloquear partida e mandar montar time."
 * Substitui o antigo comportamento silencioso de cair pra um XI fixo
 * hardcoded — agora a partida simplesmente não roda sem um squad válido.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

type Props = {
  code: 'NO_SQUAD' | 'INVALID_SQUAD';
  errors?: string[];
  onBack: () => void;
};

export function SquadRequiredScreen({ code, errors, onBack }: Props) {
  const title = code === 'NO_SQUAD' ? 'Você ainda não tem um time' : 'Seu time não está pronto';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-screen px-6 text-center gap-5"
    >
      <div className="text-5xl">🛡️</div>
      <div>
        <h1 className="font-display text-2xl text-parchment tracking-wider">{title}</h1>
        <p className="text-muted text-sm mt-2 max-w-xs mx-auto">
          {code === 'NO_SQUAD'
            ? 'Monte seu Squad no Squad Builder antes de entrar em campo — a partida usa exatamente o time que você escalar lá.'
            : 'Seu squad salvo tem pendências que impedem a partida:'}
        </p>
        {errors && errors.length > 0 && (
          <ul className="text-red-400/80 text-xs mt-3 space-y-1 max-w-xs mx-auto text-left list-disc list-inside">
            {errors.slice(0, 5).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
        <Link
          href="/squad"
          className="w-full py-3 rounded-xl font-bold text-sm text-center"
          style={{
            background: 'linear-gradient(135deg,#8c6f27,#c9a84c,#e6c85a)',
            color: '#07080f',
            boxShadow: '0 0 16px rgba(201,168,76,0.3)',
          }}
        >
          🛠️ Montar Time
        </Link>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2.5 rounded-xl text-xs text-white/50 border border-white/10"
        >
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
}

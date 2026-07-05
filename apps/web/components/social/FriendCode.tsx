'use client';

import { toast } from '@/lib/wl-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
  code: string;
  showLabel?: boolean;
};

export function FriendCode({ code, showLabel = true }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <p
          className="text-[8px] font-black uppercase tracking-[0.25em]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Seu código de amigo
        </p>
      )}
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full max-w-xs"
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        <span
          className="font-display tracking-widest flex-1 text-left"
          style={{
            fontSize: 18,
            background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.15em',
          }}
        >
          {code}
        </span>
        <span
          className="text-[10px] font-bold shrink-0 transition-colors"
          style={{ color: copied ? '#10b981' : 'rgba(201,168,76,0.6)' }}
        >
          {copied ? '✓' : '📋'}
        </span>
      </motion.button>
    </div>
  );
}

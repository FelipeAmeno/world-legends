'use client';

import { toast } from '@/lib/wl-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
  title: string;
  text: string;
  url?: string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'gold' | 'ghost';
};

export function ShareButton({
  title,
  text,
  url,
  label = 'Compartilhar',
  size = 'md',
  variant = 'ghost',
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData: ShareData = { title, text, ...(url ? { url } : {}) };

    if (navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      const content = url ? `${text}\n${url}` : text;
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível compartilhar');
    }
  };

  const isGold = variant === 'gold';
  const isSm = size === 'sm';

  return (
    <motion.button
      onClick={handleShare}
      whileTap={{ scale: 0.94 }}
      className="flex items-center gap-1.5 rounded-xl font-bold transition-all"
      style={{
        padding: isSm ? '5px 10px' : '8px 16px',
        fontSize: isSm ? 10 : 12,
        background: isGold ? 'linear-gradient(135deg, #8c6f27, #c9a84c)' : 'rgba(255,255,255,0.06)',
        border: isGold ? 'none' : '1px solid rgba(255,255,255,0.1)',
        color: isGold ? '#07080f' : 'rgba(255,255,255,0.65)',
        boxShadow: isGold ? '0 0 16px rgba(201,168,76,0.25)' : 'none',
      }}
    >
      <span style={{ fontSize: isSm ? 11 : 13 }}>{copied ? '✓' : '↗'}</span>
      {copied ? 'Copiado!' : label}
    </motion.button>
  );
}

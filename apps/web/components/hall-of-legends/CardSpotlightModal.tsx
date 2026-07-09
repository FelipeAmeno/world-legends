'use client';

/**
 * components/hall-of-legends/CardSpotlightModal.tsx — Sprint 23 (Museum Collection)
 *
 * "Modo Spotlight" — visualização em tela cheia de uma única carta, fundo
 * escurecido/borrado, com Zoom (botões +/-) e Rotação deliberada (arrastar
 * horizontalmente gira a carta de verdade, além do tilt sutil que o
 * `PlayerCard` já tem embutido reagindo ao mouse desde a Sprint 18.7 —
 * aqui é um gesto explícito do usuário, não uma reação passiva). Aberta
 * via toque longo (450ms) num card do Álbum — não substitui o toque curto
 * normal (que continua navegando/selecionando pra comparar).
 *
 * Zero mudança de economia/gameplay — só uma forma nova de olhar pra carta
 * que você já tem.
 */

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

const ZOOM_MIN = 1.2;
const ZOOM_MAX = 3;
const ZOOM_DEFAULT = 1.8;
const ZOOM_STEP = 0.2;
const ROTATE_PERSPECTIVE_PX = 1200;
const ROTATE_DRAG_SENSITIVITY = 0.4; // graus por pixel arrastado

type Props = {
  card: CollectionCard;
  onClose: () => void;
};

export function CardSpotlightModal({ card, onClose }: Props) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [rotateY, setRotateY] = useState(0);
  const dragStart = useRef<{ x: number; rotateY: number } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStart.current = { x: e.clientX, rotateY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [rotateY],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const delta = e.clientX - dragStart.current.x;
    setRotateY(dragStart.current.rotateY + delta * ROTATE_DRAG_SENSITIVITY);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  return (
    <>
      {/* Backdrop — "Modo Spotlight": escurece/borra tudo em volta */}
      <motion.div
        className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Tela cheia */}
      <motion.div
        className="fixed inset-0 z-[71] flex flex-col items-center justify-center gap-6 px-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
        >
          ✕
        </button>

        <div
          className="relative touch-none select-none"
          style={{ perspective: ROTATE_PERSPECTIVE_PX }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <motion.div
            style={{
              transform: `scale(${zoom}) rotateY(${rotateY}deg)`,
              transformStyle: 'preserve-3d',
              cursor: 'grab',
            }}
            transition={{ type: 'tween', duration: 0 }}
          >
            <PlayerCard card={card} size="lg" glow />
          </motion.div>
        </div>

        <p className="text-white/30 text-[10px] uppercase tracking-widest text-center">
          arraste pra girar · use os botões pra zoom
        </p>

        {/* Zoom */}
        <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
          >
            −
          </button>
          <span className="text-white/70 text-xs font-mono w-10 text-center">
            {Math.round((zoom / ZOOM_DEFAULT) * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
          >
            +
          </button>
          {rotateY !== 0 && (
            <button
              type="button"
              onClick={() => setRotateY(0)}
              className="text-white/50 hover:text-white text-[10px] uppercase tracking-wider ml-1"
            >
              resetar giro
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

export function CardSpotlightPresence({
  card,
  onClose,
}: {
  card: CollectionCard | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {card && <CardSpotlightModal card={card} onClose={onClose} />}
    </AnimatePresence>
  );
}

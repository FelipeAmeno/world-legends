'use client';

/**
 * PackOpeningScreen — máquina de estados da tela de abertura de packs.
 *
 * Estados:
 *   selecting  → PackSelector: grade de packs com visual caprichado
 *   sealed     → SealedPackView: pack flutuando com glow pulsante
 *   opening    → SealedPackView: animação de explosão do pack (0.55s)
 *   revealing  → RevealGrid: 5 cartas face-down, clique uma a uma para virar
 *   summary    → RevealSummary: resumo final com melhor carta em destaque
 *
 * Transições:
 *   selecting → sealed:    click em "Abrir pack"
 *   sealed    → opening:   click no pack fechado
 *   opening   → revealing: após 0.6s (duração da animação)
 *   revealing → summary:   após última carta revelada
 *   summary   → sealed:    click em "Abrir Outro"
 *   summary   → selecting: click em "← Loja"
 */

import { type DrawnCard, PACK_DEFS, type PackDefinitionUI, drawPack } from '@/lib/pack-logic';
import { useCallback, useState } from 'react';
import { PackSelector } from './PackSelector';
import { RevealGrid } from './RevealGrid';
import { RevealSummary } from './RevealSummary';
import { SealedPackView } from './SealedPackView';

type Phase = 'selecting' | 'sealed' | 'opening' | 'revealing' | 'summary';

const INITIAL_BALANCE = 4250;

export function PackOpeningScreen() {
  const [phase, setPhase] = useState<Phase>('selecting');
  const [selected, setSelected] = useState<PackDefinitionUI | null>(null);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [seed, setSeed] = useState(Date.now());

  // selecting → sealed
  const handleOpenInit = useCallback(() => {
    if (!selected || balance < selected.price) return;
    setBalance((b) => b - selected.price);
    setPhase('sealed');
  }, [selected, balance]);

  // sealed → opening → revealing
  const handlePackClick = useCallback(() => {
    if (!selected) return;
    setPhase('opening');

    // Desenhar cartas sincronicamente (domínio puro)
    const drawn = drawPack(selected, seed);
    setSeed((s) => s + 1);

    // Aguardar animação de explosão (0.6s) antes de mostrar cartas
    setTimeout(() => {
      setCards(drawn);
      setPhase('revealing');
    }, 620);
  }, [selected, seed]);

  // revealing → summary
  const handleAllRevealed = useCallback(() => {
    setPhase('summary');
  }, []);

  // summary → sealed (abrir outro do mesmo pack)
  const handleOpenAnother = useCallback(() => {
    if (!selected || balance < selected.price) {
      setPhase('selecting');
      return;
    }
    setBalance((b) => b - selected.price);
    setCards([]);
    setPhase('sealed');
  }, [selected, balance]);

  // summary / sealed → selecting
  const handleBack = useCallback(() => {
    setCards([]);
    setPhase('selecting');
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── selecting ─────────────────────────────────────────────────────────── */}
      {phase === 'selecting' && (
        <div className="animate-[fadeIn_0.35s_ease-out]">
          <PackSelector
            packs={PACK_DEFS}
            selected={selected}
            balance={balance}
            onSelect={setSelected}
            onOpen={handleOpenInit}
          />
        </div>
      )}

      {/* ── sealed / opening ──────────────────────────────────────────────────── */}
      {(phase === 'sealed' || phase === 'opening') && selected && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          {/* Back link */}
          <button
            onClick={handleBack}
            className="text-muted text-xs hover:text-parchment transition-colors mb-4 inline-flex items-center gap-1"
          >
            ← Trocar pack
          </button>

          <SealedPackView pack={selected} opening={phase === 'opening'} onOpen={handlePackClick} />
        </div>
      )}

      {/* ── revealing ─────────────────────────────────────────────────────────── */}
      {phase === 'revealing' && selected && cards.length > 0 && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center mb-5">
            <p className="font-display text-2xl text-parchment tracking-wider">
              {selected.name.toUpperCase()}
            </p>
            <p className="text-muted text-xs mt-0.5">
              {selected.cardCount} cartas · {selected.guarantee}
            </p>
          </div>
          <RevealGrid cards={cards} onComplete={handleAllRevealed} />
        </div>
      )}

      {/* ── summary ───────────────────────────────────────────────────────────── */}
      {phase === 'summary' && selected && cards.length > 0 && (
        <RevealSummary
          cards={cards}
          pack={selected}
          onOpenAnother={handleOpenAnother}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

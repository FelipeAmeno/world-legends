'use client';

import { useState } from 'react';
import { ShoppingBag, Star, Check, Loader2 } from 'lucide-react';
import { usePacks, useOpenPack } from '@/hooks/use-query';
import { useMe } from '@/hooks/use-query';
import { Card, CardContent, Badge, Button, Skeleton } from '@/components/ui';
import { usePackStore, useUiStore } from '@/stores';
import { cn } from '@/lib/utils';
import type { ApiCard } from '@/lib/api/mock-client';

export function PacksPage() {
  const { data: packs, isLoading } = usePacks();
  const { data: me } = useMe();
  const openPack = useOpenPack();
  const { isRevealing, drawnCards, revealedIdx, startReveal, nextCard, finishReveal } = usePackStore();
  const { addToast } = useUiStore();

  async function handleOpen(packId: string, priceSoft: number | null) {
    if (priceSoft && me && me.softCurrency < priceSoft) {
      addToast({ message: 'Créditos insuficientes.', type: 'error' });
      return;
    }
    try {
      const cards = await openPack.mutateAsync(packId);
      startReveal(cards);
    } catch {
      addToast({ message: 'Erro ao abrir pack.', type: 'error' });
    }
  }

  // Tela de reveal
  if (isRevealing) {
    return <PackReveal cards={drawnCards} revealedIdx={revealedIdx} onNext={nextCard} onClose={finishReveal} />;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Loja de Packs</h1>
        <span className="flex items-center gap-1 text-sm text-yellow-400">
          💰 {me?.softCurrency.toLocaleString('pt-BR')}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Drop rates transparentes — probabilidades exatas exibidas em cada pack.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(packs ?? []).map((pack) => (
            <Card key={pack.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Ícone do pack */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-4xl border border-primary/20">
                    📦
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold">{pack.name}</h3>
                      <p className="text-xs text-muted-foreground">{pack.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pack.guarantees.map((g) => (
                        <Badge key={g} variant="secondary" className="text-[9px]">
                          <Check className="mr-0.5 h-2.5 w-2.5" />{g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
                  <span className="text-sm text-muted-foreground">{pack.cardsPerPack} cartas</span>
                  <Button
                    size="sm"
                    onClick={() => handleOpen(pack.id, pack.priceSoft)}
                    disabled={openPack.isPending || (!!pack.priceSoft && !!me && me.softCurrency < pack.priceSoft)}
                  >
                    {openPack.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {pack.priceSoft
                      ? <>💰 {pack.priceSoft.toLocaleString('pt-BR')}</>
                      : 'Grátis'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pack Reveal Overlay ──────────────────────────────────────────────────────

function PackReveal({ cards, revealedIdx, onNext, onClose }: {
  cards: ApiCard[]; revealedIdx: number; onNext: () => void; onClose: () => void;
}) {
  const allRevealed = revealedIdx >= cards.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur">
      <h2 className="mb-6 text-xl font-black tracking-wide">Cartas Obtidas</h2>

      {/* Grid de cartas reveladas */}
      <div className="flex flex-wrap justify-center gap-3 px-4 mb-8">
        {cards.map((card, i) => {
          const revealed = i <= revealedIdx;
          return (
            <div
              key={card.id}
              className={cn(
                'relative flex h-36 w-24 flex-col overflow-hidden rounded-xl border-2 transition-all duration-500',
                revealed
                  ? `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`
                  : 'border-border bg-card/50',
                revealed && i === revealedIdx && 'animate-card-reveal scale-110 z-10',
              )}
            >
              {revealed ? (
                <>
                  <div className="flex flex-1 items-center justify-center bg-black/20 text-4xl">⚽</div>
                  <div className="bg-black/70 px-1.5 py-1 text-center">
                    <p className="text-[9px] font-bold text-white truncate">{card.knownAs}</p>
                    <p className="text-base font-black text-white">{card.overall}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-3xl opacity-20">?</div>
              )}
            </div>
          );
        })}
      </div>

      {allRevealed ? (
        <Button onClick={onClose} size="lg" className="px-8">
          Ir para Coleção
        </Button>
      ) : (
        <Button onClick={onNext} size="lg" variant="outline" className="px-8">
          {revealedIdx < 0 ? 'Revelar Cartas ✨' : 'Próxima Carta →'}
        </Button>
      )}
    </div>
  );
}

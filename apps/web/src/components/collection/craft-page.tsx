'use client';

import { useState } from 'react';
import { Hammer, Search, Loader2 } from 'lucide-react';
import { useCards, useMe } from '@/hooks/use-query';
import { Card, CardContent, Button, Input, Badge, Skeleton, EmptyState } from '@/components/ui';
import { RarityBadge } from '@/components/cards/rarity-badge';
import { useUiStore } from '@/stores';
import { mockApi } from '@/lib/api/mock-client';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'crypto';

const CRAFT_COSTS: Record<string, number> = {
  common: 100, rare: 300, elite: 600, legendary: 1500, ultra: 5000, world_cup_hero: 0,
};

export function CraftPage() {
  const { data: me }    = useMe();
  const { data: cards } = useCards();
  const { addToast }    = useUiStore();
  const [search, setSearch]   = useState('');
  const [crafting, setCrafting] = useState<string | null>(null);

  // Cartas que o usuário NÃO possui (para mostrar o catálogo de craft)
  const ownedCardIds = new Set(cards?.map((c) => c.cardId) ?? []);

  // Filtrar cartas que podem ser craftadas (excluindo WCH e GOAT)
  const craftable = (cards ?? []).filter((c) =>
    !['world_cup_hero', 'goat'].includes(c.rarityCode) &&
    (search === '' || c.knownAs.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleCraft(cardId: string, cost: number) {
    if (!me || me.fragmentBalance < cost) {
      addToast({ message: 'Fragmentos insuficientes.', type: 'error' });
      return;
    }
    setCrafting(cardId);
    try {
      const result = await mockApi.craftCard(cardId, String(Date.now()));
      if (result.ok) {
        addToast({ message: 'Carta craftada com sucesso!', type: 'success' });
      } else {
        addToast({ message: result.error ?? 'Erro ao craftar.', type: 'error' });
      }
    } finally {
      setCrafting(null);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Craft de Cartas</h1>
        <span className="flex items-center gap-1 text-sm text-blue-400">
          💎 {me?.fragmentBalance.toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300">
        <strong>Como funciona:</strong> troque fragmentos por cartas específicas. World Cup Hero e GOAT não podem ser craftados — são exclusivos de conquistas e eventos.
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input placeholder="Buscar carta para craftar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {craftable.length === 0 ? (
        <EmptyState icon="🔨" title="Nada para craftar" description="Tente buscar uma carta específica." />
      ) : (
        <div className="space-y-2">
          {craftable.map((card) => {
            const cost = CRAFT_COSTS[card.rarityCode] ?? 999;
            const canCraft = (me?.fragmentBalance ?? 0) >= cost;
            return (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn(
                    'flex h-14 w-10 items-center justify-center rounded-lg border-2 text-2xl',
                    `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`,
                  )}>⚽</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{card.knownAs}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RarityBadge rarityCode={card.rarityCode} />
                      <span className="text-xs text-muted-foreground">{card.position} · OVR {card.overall}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn('text-xs font-mono font-bold', canCraft ? 'text-blue-400' : 'text-red-400')}>
                      💎 {cost.toLocaleString('pt-BR')}
                    </span>
                    <Button
                      size="sm"
                      variant={canCraft ? 'default' : 'outline'}
                      disabled={!canCraft || crafting === card.cardId}
                      onClick={() => handleCraft(card.cardId, cost)}
                    >
                      {crafting === card.cardId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hammer className="h-3 w-3" />}
                      Craftar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Users, Zap, Star } from 'lucide-react';
import { useCards } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ApiCard } from '@/lib/api/mock-client';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'];

const POSITIONS_4_3_3 = [
  { slot: 'GK',  label: 'GK',  x: 50, y: 85 },
  { slot: 'LB',  label: 'LE',  x: 12, y: 67 },
  { slot: 'CB1', label: 'ZAG', x: 35, y: 67 },
  { slot: 'CB2', label: 'ZAG', x: 65, y: 67 },
  { slot: 'RB',  label: 'LD',  x: 88, y: 67 },
  { slot: 'CDM', label: 'VOL', x: 25, y: 48 },
  { slot: 'CM',  label: 'MC',  x: 50, y: 48 },
  { slot: 'CAM', label: 'MC',  x: 75, y: 48 },
  { slot: 'LW',  label: 'PE',  x: 15, y: 25 },
  { slot: 'ST',  label: 'CA',  x: 50, y: 20 },
  { slot: 'RW',  label: 'PD',  x: 85, y: 25 },
];

export function TeamPage() {
  const { data: cards, isLoading } = useCards();
  const [formation, setFormation] = useState('4-3-3');
  const [slots, setSlots]         = useState<Record<string, ApiCard | null>>({});
  const [picking, setPicking]     = useState<string | null>(null);

  const availableCards = cards?.filter((c) => !c.isInjured && c.suspendedMatches === 0) ?? [];

  const chemistry = Object.values(slots).filter(Boolean).length >= 8 ? 76 : 0;
  const totalOvr  = Object.values(slots)
    .filter(Boolean)
    .reduce((s, c) => s + (c?.overall ?? 0), 0) / (Object.keys(slots).length || 1);

  function assignCard(card: ApiCard) {
    if (!picking) return;
    setSlots((prev) => ({ ...prev, [picking]: card }));
    setPicking(null);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Meu Elenco</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span>Química {chemistry}</span>
          <span>·</span>
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          <span>OVR {Math.round(totalOvr) || '—'}</span>
        </div>
      </div>

      {/* Seletor de formação */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FORMATIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFormation(f)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-mono font-bold transition-colors',
              formation === f
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Campo */}
      <div className="relative mx-auto w-full max-w-sm aspect-[2/3] rounded-xl bg-gradient-to-b from-green-900/80 via-green-800/60 to-green-900/80 border border-green-700/40 overflow-hidden">
        {/* Linhas do campo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-white/10" style={{ position: 'absolute', top: '50%' }} />
          <div className="rounded-full border border-white/10" style={{ width: '30%', aspectRatio: '1', position: 'absolute', top: '35%' }} />
          <div className="border border-white/10" style={{ position: 'absolute', bottom: '8%', width: '50%', height: '12%' }} />
          <div className="border border-white/10" style={{ position: 'absolute', top: '8%', width: '50%', height: '12%' }} />
        </div>

        {POSITIONS_4_3_3.map(({ slot, label, x, y }) => {
          const card = slots[slot];
          return (
            <button
              key={slot}
              onClick={() => setPicking(slot)}
              style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              className={cn(
                'flex flex-col items-center gap-0.5 transition-transform hover:scale-110',
                picking === slot && 'scale-110',
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-black',
                card
                  ? `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')} text-white`
                  : 'border-dashed border-white/30 bg-black/30 text-white/40',
                picking === slot && 'border-primary',
              )}>
                {card ? card.overall : <span className="text-[10px]">{label}</span>}
              </div>
              {card && (
                <span className="rounded bg-black/70 px-1 text-[8px] text-white">{card.knownAs.split(' ').slice(-1)[0]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Picker de carta */}
      {picking && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Escolher para {picking}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-20" /> : (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => { setSlots((p) => ({ ...p, [picking]: null })); setPicking(null); }}
                  className="shrink-0 flex h-16 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border text-[9px] text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  ✕ Vazio
                </button>
                {availableCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => assignCard(card)}
                    className={cn(
                      'shrink-0 flex flex-col overflow-hidden rounded-lg border-2 transition-transform hover:scale-105',
                      `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`,
                      'w-12',
                    )}
                  >
                    <div className="flex h-8 items-center justify-center bg-black/20 text-lg">⚽</div>
                    <div className="bg-black/70 px-0.5 py-0.5 text-center">
                      <p className="text-[8px] font-bold text-white truncate">{card.knownAs.split(' ')[0]}</p>
                      <p className="text-xs font-black text-white">{card.overall}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Banco */}
      <div>
        <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Banco de Reservas</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableCards.slice(0, 7).map((card) => (
            <div
              key={card.id}
              className={cn(
                'shrink-0 flex flex-col overflow-hidden rounded-lg border-2 w-14',
                `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`,
              )}
            >
              <div className="flex h-10 items-center justify-center bg-black/20 text-2xl">⚽</div>
              <div className="bg-black/70 px-0.5 py-0.5 text-center">
                <p className="text-[8px] font-bold text-white truncate">{card.knownAs.split(' ')[0]}</p>
                <p className="text-xs font-black text-white">{card.overall}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

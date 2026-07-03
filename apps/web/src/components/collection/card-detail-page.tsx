'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Shield, Wind, Target, Dumbbell, Brain } from 'lucide-react';
import { useCard } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton, Progress, Separator } from '@/components/ui';
import { RarityBadge } from '@/components/cards/rarity-badge';
import { cn } from '@/lib/utils';

const ATTR_ICONS = [
  { key: 'pace',      label: 'Velocidade', icon: Wind,    color: 'text-green-400'  },
  { key: 'shooting',  label: 'Finalização',icon: Target,  color: 'text-red-400'    },
  { key: 'passing',   label: 'Passe',      icon: Brain,   color: 'text-blue-400'   },
  { key: 'dribbling', label: 'Drible',     icon: Zap,     color: 'text-yellow-400' },
  { key: 'defending', label: 'Defesa',     icon: Shield,  color: 'text-purple-400' },
  { key: 'physical',  label: 'Físico',     icon: Dumbbell,color: 'text-orange-400' },
] as const;

const NATIONALITY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', DE: '🇩🇪', NL: '🇳🇱', FR: '🇫🇷',
  PT: '🇵🇹', IT: '🇮🇹', ES: '🇪🇸', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', RU: '🇷🇺',
};

export function CardDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: card, isLoading } = useCard(id);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-4xl">🃏</span>
        <p className="font-semibold">Carta não encontrada</p>
        <button onClick={() => router.back()} className="text-sm text-primary">← Voltar</button>
      </div>
    );
  }

  const avgAttr = Math.round(
    Object.values(card.attributes).reduce((s, v) => s + v, 0) / 6
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Coleção
      </button>

      {/* Hero — apresentação da carta */}
      <div className={cn(
        'relative flex flex-col items-center rounded-2xl border-2 p-6 text-center overflow-hidden',
        `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`,
      )}>
        <div className="text-8xl mb-4">⚽</div>
        <div className="absolute inset-0 card-shimmer pointer-events-none opacity-50" />
        <span className="relative z-10 text-xs font-bold text-muted-foreground tracking-widest uppercase">
          {NATIONALITY_FLAGS[card.nationality] ?? '🌍'} {card.nationality}
        </span>
        <h1 className="relative z-10 mt-1 text-3xl font-black">{card.knownAs}</h1>
        <div className="relative z-10 mt-2 flex items-center gap-3">
          <span className="rounded-lg bg-black/40 px-3 py-1 text-3xl font-black">{card.overall}</span>
          <RarityBadge rarityCode={card.rarityCode} />
          <Badge variant="secondary">{card.position}</Badge>
        </div>
        {card.form !== 0 && (
          <div className={cn(
            'absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-bold',
            card.form > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
          )}>
            Forma {card.form > 0 ? `+${card.form}` : card.form}
          </div>
        )}
      </div>

      {/* Atributos */}
      <Card>
        <CardHeader><CardTitle>Atributos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ATTR_ICONS.map(({ key, label, icon: Icon, color }) => {
            const val = card.attributes[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className={cn('h-4 w-4 shrink-0', color)} />
                <span className="w-20 text-xs text-muted-foreground">{label}</span>
                <Progress value={val} className="flex-1" />
                <span className={cn('w-8 text-right text-xs font-mono font-bold', color)}>{val}</span>
              </div>
            );
          })}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Média</span>
            <span className="font-mono font-black text-primary">{avgAttr}</span>
          </div>
        </CardContent>
      </Card>

      {/* Traits */}
      {card.traits.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Traits</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {card.traits.map((t) => (
                <div key={t} className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Zap className="h-3 w-3" />
                  {t}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contexto histórico */}
      <Card>
        <CardHeader><CardTitle>Contexto</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between text-xs">
            <span>Adquirida via</span>
            <span className="font-medium capitalize text-foreground">{card.acquiredVia}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Edição</span>
            <span className="font-medium capitalize text-foreground">{card.editionCode}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Adquirida em</span>
            <span className="font-medium text-foreground">
              {new Date(card.acquiredAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {card.isInjured && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              🩹 Este jogador está lesionado e não pode ser escalado.
            </div>
          )}
          {card.suspendedMatches > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
              🟨 Suspenso por {card.suspendedMatches} partida(s).
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

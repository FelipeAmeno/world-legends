'use client';

import { useState } from 'react';
import { User, Edit2, Check, Loader2 } from 'lucide-react';
import { useMe, useMyRankPosition, useAchievements, useCards, useUpdateProfile } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Stat, Badge, Separator, Skeleton } from '@/components/ui';
import { RarityBadge } from '@/components/cards/rarity-badge';
import { cn } from '@/lib/utils';

export function ProfilePage() {
  const { data: me,      isLoading: mlod } = useMe();
  const { data: myRank,  isLoading: rlod } = useMyRankPosition();
  const { data: achs    } = useAchievements();
  const { data: cards   } = useCards();
  const updateProfile = useUpdateProfile();

  const [editing,     setEditing]     = useState(false);
  const [displayName, setDisplayName] = useState('');

  const unlockedCount = achs?.filter((a) => a.unlockedAt).length ?? 0;
  const legendCount   = cards?.filter((c) => ['legendary', 'ultra', 'world_cup_hero'].includes(c.rarityCode)).length ?? 0;

  async function saveProfile() {
    await updateProfile.mutateAsync({ displayName: displayName || undefined });
    setEditing(false);
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Perfil</h1>
      </div>

      {/* Avatar + info */}
      {mlod ? <Skeleton className="h-32" /> : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-black text-primary border-2 border-primary/30">
                {(me?.displayName ?? me?.username ?? 'WL').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={me?.displayName ?? me?.username}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="icon" className="h-8 w-8" onClick={saveProfile} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold truncate">{me?.displayName ?? me?.username}</p>
                    <button onClick={() => { setEditing(true); setDisplayName(me?.displayName ?? ''); }}>
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">@{me?.username}</p>
                {myRank && (
                  <Badge variant="secondary" className="mt-1 text-[9px]">{myRank.division}</Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <Separator className="my-4" />
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Elo"     value={me?.eloRating ?? 0}      accent="text-primary"    />
              <Stat label="Cartas"  value={cards?.length ?? 0}       accent="text-blue-400"   />
              <Stat label="Lendas"  value={legendCount}              accent="text-yellow-400" />
              <Stat label="Conquistas" value={`${unlockedCount}/${achs?.length ?? 0}`} accent="text-green-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saldos */}
      {me && (
        <Card>
          <CardHeader><CardTitle>Carteira</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="font-mono font-bold text-yellow-400">{me.softCurrency.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3">
              <span className="text-xl">💎</span>
              <div>
                <p className="text-xs text-muted-foreground">Fragmentos</p>
                <p className="font-mono font-bold text-blue-400">{me.fragmentBalance.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas de jogo */}
      {rlod ? <Skeleton className="h-32" /> : myRank && (
        <Card>
          <CardHeader><CardTitle>Estatísticas</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: 'Partidas Jogadas', value: myRank.matchesPlayed },
              { label: 'Vitórias',  value: myRank.wins,   accent: 'text-green-400'  },
              { label: 'Empates',   value: myRank.draws,  accent: 'text-yellow-400' },
              { label: 'Derrotas',  value: myRank.losses, accent: 'text-red-400'    },
              { label: 'Aproveitamento', value: `${Math.round((myRank.wins / (myRank.matchesPlayed || 1)) * 100)}%`, accent: 'text-primary' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={cn('font-mono font-bold text-sm', accent)}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conquistas recentes */}
      {unlockedCount > 0 && (
        <Card>
          <CardHeader><CardTitle>Conquistas Recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {achs?.filter((a) => a.unlockedAt).slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

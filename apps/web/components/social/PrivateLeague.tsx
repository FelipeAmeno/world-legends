'use client';

import { createLeagueAction, joinLeagueAction } from '@/lib/actions/social';
import type { LeagueMember, PrivateLeague as PrivateLeagueType } from '@/lib/social-data';
import { toast } from '@/lib/wl-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
  leagues: PrivateLeagueType[];
  currentUserId: string;
};

type View = 'list' | 'create' | 'join' | 'detail';

function daysLeft(isoDate?: string): string {
  if (!isoDate) return '—';
  const diff = new Date(isoDate).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 0) return 'Encerrada';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

export function PrivateLeague({ leagues: initialLeagues, currentUserId }: Props) {
  const [leagues, setLeagues] = useState(initialLeagues);
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<PrivateLeagueType | null>(null);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await createLeagueAction(newName.trim());
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Liga criada! Código: ${res.code}`);
    setNewName('');
    setView('list');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    const res = await joinLeagueAction(joinCode.trim());
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Entrou em "${res.leagueName}"!`);
    setJoinCode('');
    setView('list');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('create')}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,#8c6f27,#c9a84c)', color: '#07080f' }}
        >
          + Criar Liga
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('join')}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold border"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          Entrar por Código
        </motion.button>
      </div>

      {/* Create / Join forms */}
      <AnimatePresence mode="wait">
        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            <p className="text-gold text-xs font-bold">Nova Liga</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da liga (ex: Liga dos Amigos BR)"
              className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-parchment placeholder:text-muted outline-none focus:border-gold/40"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="flex-1 py-2 rounded-xl text-xs text-muted border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !newName.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#8c6f27,#c9a84c)', color: '#07080f' }}
              >
                {loading ? 'Criando…' : 'Criar'}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            <p className="text-parchment text-xs font-bold">Entrar por Código</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABCD-1234"
              className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-parchment placeholder:text-muted outline-none focus:border-gold/40 font-display tracking-widest"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className="flex-1 py-2 rounded-xl text-xs text-muted border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleJoin}
                disabled={loading || !joinCode.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  color: '#c9a84c',
                  border: '1px solid rgba(201,168,76,0.3)',
                }}
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* League detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-parchment font-bold text-sm">{selected.name}</p>
                  <p className="text-muted text-[9px] mt-0.5">
                    Código:{' '}
                    <span className="font-display tracking-widest text-gold">{selected.code}</span>
                    {' · '}Termina em {daysLeft(selected.endsAt)}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted text-xs">
                  ✕
                </button>
              </div>
            </div>

            {/* Standings */}
            <div className="px-4 py-3 space-y-2">
              {selected.members.map((m) => (
                <LeagueMemberRow key={m.userId} member={m} isMe={m.userId === currentUserId} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* League list */}
      {leagues.length === 0 && view === 'list' && (
        <div className="text-center py-12">
          <span className="text-4xl">🏆</span>
          <p className="text-muted text-sm mt-3">Nenhuma liga ainda</p>
          <p className="text-muted/50 text-xs mt-1">Crie uma liga ou entre com um código</p>
        </div>
      )}

      <div className="space-y-2">
        {leagues.map((league, i) => (
          <motion.button
            key={league.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(league)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <span className="text-xl">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-parchment font-bold text-sm truncate">{league.name}</p>
              <p className="text-muted text-[9px]">
                {league.members.length} membros · Termina em {daysLeft(league.endsAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              {(() => {
                const me = league.members.find((m) => m.userId === currentUserId);
                return me ? (
                  <>
                    <p className="text-gold font-display text-sm">#{me.rank}</p>
                    <p className="text-muted text-[9px]">{me.points}pts</p>
                  </>
                ) : (
                  <span className="text-muted text-xs">›</span>
                );
              })()}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function LeagueMemberRow({ member, isMe }: { member: LeagueMember; isMe: boolean }) {
  const rankColor =
    member.rank === 1
      ? '#c9a84c'
      : member.rank === 2
        ? '#94a3b8'
        : member.rank === 3
          ? '#b45309'
          : 'rgba(255,255,255,0.3)';
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: isMe ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isMe ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <span className="font-display text-sm w-6 text-center" style={{ color: rankColor }}>
        {member.rank}
      </span>
      <p className={`flex-1 text-xs font-semibold ${isMe ? 'text-gold' : 'text-parchment'}`}>
        {member.displayName}
        {isMe ? ' (você)' : ''}
      </p>
      <div className="flex gap-2 text-[9px] text-muted">
        <span className="text-emerald-400">{member.wins}V</span>
        <span>{member.draws}E</span>
        <span className="text-red-400">{member.losses}D</span>
      </div>
      <span className="font-display text-sm ml-1" style={{ color: rankColor }}>
        {member.points}
      </span>
    </div>
  );
}

'use client';

import { sendFriendRequestAction } from '@/lib/actions/social';
import type { FriendProfile, PrivateLeague, SocialActivity } from '@/lib/social-data';
import { generateFriendCode, normalizeFriendCode } from '@/lib/social-data';
import { toast } from '@/lib/wl-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ActivityFeed } from './ActivityFeed';
import { FriendCode } from './FriendCode';
import { PrivateLeague as PrivateLeagueView } from './PrivateLeague';

type Tab = 'amigos' | 'atividade' | 'ligas';

type Props = {
  userId: string;
  friends: FriendProfile[];
  activities: SocialActivity[];
  leagues: PrivateLeague[];
};

export function SocialHub({ userId, friends, activities, leagues }: Props) {
  const [tab, setTab] = useState<Tab>('amigos');
  const [addCode, setAddCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const myCode = generateFriendCode(userId);

  const handleAdd = async () => {
    const code = normalizeFriendCode(addCode);
    if (code.length < 8) {
      toast.error('Código inválido — insira os 8 caracteres');
      return;
    }
    setAddLoading(true);
    const res = await sendFriendRequestAction(code);
    setAddLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Pedido enviado para ${res.displayName}!`);
    setAddCode('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-[0.25em] mb-1"
          style={{ color: 'rgba(201,168,76,0.55)' }}
        >
          World Legends
        </p>
        <h1
          className="font-display text-3xl tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c9a84c 55%, #8c6f27 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SOCIAL
        </h1>
      </div>

      {/* Tabs */}
      <div
        className="flex px-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['amigos', 'atividade', 'ligas'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all capitalize"
            style={{ color: tab === t ? '#c9a84c' : 'rgba(255,255,255,0.3)' }}
          >
            {t === 'amigos'
              ? `👥 AMIGOS${friends.length > 0 ? ` (${friends.length})` : ''}`
              : t === 'atividade'
                ? '📡 ATIVIDADE'
                : '🏆 LIGAS'}
            {tab === t && (
              <motion.div
                layoutId="social-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#c9a84c' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <AnimatePresence mode="wait">
          {/* ── AMIGOS ── */}
          {tab === 'amigos' && (
            <motion.div
              key="amigos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4 space-y-5"
            >
              {/* Friend code */}
              <FriendCode code={myCode} />

              {/* Add friend */}
              <div className="space-y-2">
                <p
                  className="text-[8px] font-black uppercase tracking-[0.25em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Adicionar amigo
                </p>
                <div className="flex gap-2">
                  <input
                    value={addCode}
                    onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    className="flex-1 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-parchment placeholder:text-muted outline-none focus:border-gold/40 font-display tracking-widest"
                  />
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleAdd}
                    disabled={addLoading || addCode.replace(/[^A-Za-z0-9]/g, '').length < 8}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg,#8c6f27,#c9a84c)',
                      color: '#07080f',
                    }}
                  >
                    {addLoading ? '…' : 'Adicionar'}
                  </motion.button>
                </div>
              </div>

              {/* Friends list */}
              <div className="space-y-2">
                <p
                  className="text-[8px] font-black uppercase tracking-[0.25em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Seus amigos
                </p>
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">👥</span>
                    <p className="text-muted text-sm mt-3">Nenhum amigo ainda</p>
                    <p className="text-muted/50 text-xs mt-1">
                      Compartilhe seu código e adicione amigos!
                    </p>
                  </div>
                ) : (
                  friends.map((f, i) => <FriendRow key={f.userId} friend={f} index={i} />)
                )}
              </div>
            </motion.div>
          )}

          {/* ── ATIVIDADE ── */}
          {tab === 'atividade' && (
            <motion.div
              key="atividade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              <ActivityFeed
                activities={activities}
                emptyLabel="Nenhuma atividade dos seus amigos"
              />
            </motion.div>
          )}

          {/* ── LIGAS ── */}
          {tab === 'ligas' && (
            <motion.div
              key="ligas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              <PrivateLeagueView leagues={leagues} currentUserId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FriendRow({ friend, index }: { friend: FriendProfile; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display text-lg"
        style={{
          background: 'rgba(201,168,76,0.15)',
          color: '#c9a84c',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        {friend.displayName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-parchment font-bold text-xs truncate">{friend.displayName}</p>
        <p className="text-muted text-[9px]">
          {friend.collectionCount} cartas · {friend.wins} vitórias
        </p>
      </div>

      {/* OVR */}
      <div className="text-right shrink-0">
        <p className="font-display text-base text-gold">{friend.topOvr}</p>
        <p className="text-[8px] text-muted">OVR</p>
      </div>
    </motion.div>
  );
}

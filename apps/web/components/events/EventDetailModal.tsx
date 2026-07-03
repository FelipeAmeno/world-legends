'use client';

import {
  type UserContext,
  checkRequirements,
  formatParticipants,
  getEventStatus,
  getStatusStyle,
  getTimeLeft,
} from '@/lib/events/event-utils';
import type { GameEvent } from '@/lib/events/types';
import { CATEGORY_META, DIFFICULTY_CONFIG } from '@/lib/events/types';
import { SQUAD_RATING, USER_PROFILE } from '@/lib/mock-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  event: GameEvent;
  onClose: () => void;
};

const USER_CTX: UserContext = {
  level: USER_PROFILE.level,
  squadOvr: SQUAD_RATING.overall,
  wins: USER_PROFILE.wins,
  totalCards: USER_PROFILE.totalCards,
  squadSize: 11,
  nationalities: ['BR'],
  season: 4,
};

type Tab = 'overview' | 'rewards' | 'requirements';

export function EventDetailModal({ event, onClose }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = getEventStatus(event, now);
  const isEnded = status === 'ended';
  const isUpcoming = status === 'upcoming';
  const timeLeft = getTimeLeft(isUpcoming ? event.startsAt : event.endsAt, isUpcoming, now);
  const catMeta = CATEGORY_META[event.category];
  const difficulty = DIFFICULTY_CONFIG[event.difficulty];
  const reqCheck = checkRequirements(event.requirements, USER_CTX);
  const { from, via, to, icon, accent } = event.banner;
  const statusStyle = getStatusStyle(status);

  const FORMAT_LABELS: Record<string, string> = {
    single_match: '1 Partida',
    best_of_3: 'Melhor de 3',
    tournament: 'Torneio',
    accumulate: 'Acumular Pontos',
    challenge: 'Desafio',
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[61] sm:p-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <div
          className="relative w-full sm:max-w-lg bg-midnight rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col border border-white/8"
          style={{ boxShadow: `0 0 60px ${accent}30` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Hero banner */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${from}, ${via}, ${to})` }}
          >
            <div className="absolute inset-0 noise opacity-50 pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 60% 100% at 15% 50%, ${accent}15, transparent)`,
              }}
            />

            <div className="relative z-10 flex items-center gap-4 px-5 py-4">
              <motion.div
                className="text-5xl shrink-0"
                style={{ filter: `drop-shadow(0 0 20px ${accent}90)` }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                {icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.color}`}
                  >
                    {statusStyle.label}
                  </span>
                  <span
                    className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${difficulty.bg} ${difficulty.color}`}
                  >
                    {difficulty.label}
                  </span>
                  <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-black/30 text-white/50">
                    {catMeta.icon} {catMeta.label}
                  </span>
                </div>
                <h2 className="font-display text-2xl text-white leading-tight tracking-wider">
                  {event.title}
                </h2>
                <p className="text-white/50 text-[10px] mt-0.5">{event.subtitle}</p>
              </div>

              <button onClick={onClose} className="shrink-0 text-white/40 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {/* Countdown bar */}
            {!isEnded && (
              <div className="px-5 pb-4 relative z-10">
                <div className="flex items-center justify-between text-[9px] mb-1.5">
                  <span className="text-white/40">{isUpcoming ? 'Começa em' : 'Encerra em'}</span>
                  <span
                    className={`font-mono font-bold ${timeLeft.urgent ? 'text-red-400' : 'text-white/70'}`}
                  >
                    {timeLeft.days > 0 && `${timeLeft.days}d `}
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
                <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${accent}80, ${accent})` }}
                    animate={{
                      width: `${Math.min(100, 100 - (timeLeft.total / (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime())) * 100)}%`,
                    }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(['overview', 'rewards', 'requirements'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t ? 'text-gold border-b-2 border-gold' : 'text-muted hover:text-parchment'
                }`}
              >
                {t === 'overview' ? 'Visão Geral' : t === 'rewards' ? 'Recompensas' : 'Requisitos'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-5 py-4 space-y-4"
              >
                {/* OVERVIEW */}
                {tab === 'overview' && (
                  <>
                    <p className="text-white/60 text-sm leading-relaxed">{event.description}</p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatBox
                        label="Formato"
                        value={FORMAT_LABELS[event.format] ?? event.format}
                      />
                      <StatBox label="Entradas" value={`${event.maxEntries}×`} />
                      <StatBox
                        label="Participantes"
                        value={formatParticipants(event.participants) || '—'}
                      />
                    </div>

                    {/* Datas */}
                    <div className="glass rounded-xl p-3 space-y-1.5">
                      <DateRow label="Início" date={event.startsAt} />
                      <DateRow label="Término" date={event.endsAt} accent={timeLeft.urgent} />
                    </div>

                    {/* Participação rápida */}
                    {!isEnded && (
                      <motion.button
                        disabled={!reqCheck.canEnter}
                        className={[
                          'w-full py-3.5 rounded-2xl font-display text-lg tracking-wider transition-all',
                          reqCheck.canEnter
                            ? 'text-obsidian hover:opacity-90 active:scale-98'
                            : 'bg-surface border border-border text-muted cursor-not-allowed',
                        ].join(' ')}
                        style={
                          reqCheck.canEnter
                            ? {
                                background: `linear-gradient(135deg, ${accent}cc, ${accent})`,
                                boxShadow: `0 0 20px ${accent}50`,
                              }
                            : {}
                        }
                      >
                        {isUpcoming
                          ? '🔔 Lembrar quando começar'
                          : reqCheck.canEnter
                            ? '▶ Participar agora'
                            : `🔒 ${reqCheck.failReason}`}
                      </motion.button>
                    )}
                  </>
                )}

                {/* REWARDS */}
                {tab === 'rewards' && (
                  <>
                    <p className="text-muted text-[10px]">
                      Recompensas por posição no ranking do evento.
                    </p>
                    <div className="space-y-2">
                      {event.rewardTiers.map((tier, i) => (
                        <div
                          key={tier.tier}
                          className="flex items-start gap-3 p-3 rounded-xl border"
                          style={{
                            borderColor: `rgba(255,255,255,${i === 0 ? 0.12 : 0.06})`,
                            background: `rgba(255,255,255,${i === 0 ? 0.04 : 0.02})`,
                          }}
                        >
                          <span className="text-2xl shrink-0">{tier.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-bold ${tier.color}`}>{tier.tier}</p>
                              {tier.maxRank && (
                                <p className="text-[8px] text-muted">
                                  {tier.minRank
                                    ? `Top ${tier.minRank}-${tier.maxRank}`
                                    : `Top ${tier.maxRank}`}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {tier.items.map((item, j) => (
                                <span
                                  key={j}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-parchment"
                                >
                                  {item.icon} {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* REQUIREMENTS */}
                {tab === 'requirements' && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-muted text-[10px]">Requisitos para participar</p>
                      <span
                        className={`text-xs font-bold ${reqCheck.canEnter ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {reqCheck.canEnter ? '✓ Elegível' : '✗ Não elegível'}
                      </span>
                    </div>

                    {event.requirements.length === 0 ? (
                      <div className="glass rounded-xl p-4 text-center">
                        <p className="text-emerald-400 font-bold text-sm">✓ Aberto para todos</p>
                        <p className="text-muted text-xs mt-1">Sem requisitos de entrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reqCheck.checks.map((check, i) => (
                          <div
                            key={i}
                            className={[
                              'flex items-center justify-between p-3 rounded-xl border',
                              check.met
                                ? 'border-emerald-800/50 bg-emerald-900/15'
                                : 'border-red-800/50 bg-red-900/15',
                            ].join(' ')}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-base ${check.met ? 'text-emerald-400' : 'text-red-400'}`}
                              >
                                {check.met ? '✓' : '✗'}
                              </span>
                              <p className="text-sm text-parchment">{check.requirement.label}</p>
                            </div>
                            {check.userValue !== undefined && (
                              <span
                                className={`text-xs font-bold ${check.met ? 'text-emerald-400' : 'text-red-400'}`}
                              >
                                {check.userValue}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!reqCheck.canEnter && (
                      <div className="glass rounded-xl p-3 border border-amber-800/30">
                        <p className="text-amber-400 text-xs font-bold">Como desbloquear:</p>
                        <p className="text-white/50 text-[10px] mt-1">
                          {reqCheck.failReason} — melhore seu squad e volte para participar.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-2.5 text-center">
      <p className="text-parchment font-bold text-sm">{value}</p>
      <p className="text-muted text-[9px] mt-0.5">{label}</p>
    </div>
  );
}

function DateRow({
  label,
  date,
  accent = false,
}: { label: string; date: string; accent?: boolean }) {
  const d = new Date(date);
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-red-400 font-bold' : 'text-parchment'}>
        {d.toLocaleDateString('pt-BR')} às{' '}
        {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

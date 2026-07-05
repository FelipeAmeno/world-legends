'use client';

/**
 * app/login/page.tsx — T060
 *
 * Tela de login World Legends com:
 *   - Google OAuth
 *   - Apple OAuth
 *   - Email / Senha
 *   - Magic Link (apenas email)
 *   - Modo guest (sem Supabase configurado)
 *
 * Estados:
 *   'choose'     → métodos de login disponíveis
 *   'email'      → formulário email/senha
 *   'magic'      → magic link enviado
 *   'loading'    → aguardando resposta
 */

import { useAuth } from '@/lib/auth-context';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Suspense } from 'react';

type LoginPhase = 'choose' | 'email' | 'signup' | 'magic_sent' | 'loading';

function LoginContent() {
  const { signInGoogle, signInApple, signInEmail, signInMagicLink, signUp, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const errorParam = searchParams.get('error');

  const [phase, setPhase] = useState<LoginPhase>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(errorParam);
  const [magicMode, setMagicMode] = useState(false);

  const handleGoogle = async () => {
    setPhase('loading');
    setError(null);
    const { error } = await signInGoogle(redirect);
    if (error) {
      setError(error.message);
      setPhase('choose');
    }
    // Redirect é feito pelo OAuth callback
  };

  const handleApple = async () => {
    setPhase('loading');
    setError(null);
    const { error } = await signInApple(redirect);
    if (error) {
      setError(error.message);
      setPhase('choose');
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase('loading');
    setError(null);

    if (magicMode) {
      const { error } = await signInMagicLink(email);
      if (error) {
        setError(error.message);
        setPhase('email');
      } else setPhase('magic_sent');
      return;
    }

    const { error } = await signInEmail(email, password);
    if (error) {
      setError(error.message);
      setPhase('email');
    } else {
      router.push(redirect);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setPhase('loading');
    setError(null);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      setPhase('signup');
    } else setPhase('magic_sent');
  };

  const handleGuest = () => {
    router.push('/enter');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.12), transparent 60%), #050508',
      }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,168,76,0.4) 40px, rgba(201,168,76,0.4) 41px)',
        }}
      />

      {/* Logo */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="font-display text-6xl sm:text-7xl gold-text tracking-widest"
          style={{ textShadow: '0 0 40px rgba(201,168,76,0.4)' }}
        >
          WORLD
          <br />
          LEGENDS
        </h1>
        <p className="text-white/30 text-xs tracking-[0.4em] uppercase mt-2">
          Collectible Football Card Game
        </p>
      </motion.div>

      {/* Card de login */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
      >
        <div
          className="glass rounded-3xl border border-white/8 overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
        >
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-950/60 border-b border-red-800/50 px-4 py-2.5"
              >
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* ── CHOOSE ─────────────────────────────────────── */}
              {phase === 'choose' && (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {/* Value promise */}
                  {configured && (
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
                      style={{
                        background: 'rgba(201,168,76,0.06)',
                        border: '1px solid rgba(201,168,76,0.15)',
                      }}
                    >
                      <span className="text-2xl shrink-0">📦</span>
                      <div>
                        <p className="text-[11px] font-bold text-parchment leading-tight">Founder Pack — grátis ao entrar</p>
                        <p className="text-[10px] text-white/35 leading-tight mt-0.5">11 lendas históricas · ao menos 1 Legendary</p>
                      </div>
                    </div>
                  )}

                  <p className="text-white/40 text-[11px] text-center">
                    {configured ? 'Entrar com' : 'Modo demonstração ativo'}
                  </p>

                  {/* Google */}
                  {configured && (
                    <OAuthButton
                      icon={<GoogleIcon />}
                      label="Continuar com Google"
                      onClick={handleGoogle}
                    />
                  )}

                  {/* Apple */}
                  {configured && (
                    <OAuthButton
                      icon={<AppleIcon />}
                      label="Continuar com Apple"
                      onClick={handleApple}
                      dark
                    />
                  )}

                  {/* Email */}
                  {configured && (
                    <>
                      <Divider />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPhase('email');
                            setError(null);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                     border border-white/10 bg-white/4 text-parchment text-sm
                                     hover:bg-white/8 transition-all"
                        >
                          <span>✉️</span>
                          <span>Entrar</span>
                        </button>
                        <button
                          onClick={() => {
                            setPhase('signup');
                            setError(null);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                     border border-white/10 bg-white/4 text-parchment text-sm
                                     hover:bg-white/8 transition-all"
                        >
                          <span>✨</span>
                          <span>Criar Conta</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Guest */}
                  <button
                    onClick={handleGuest}
                    className="w-full py-2.5 rounded-xl border border-white/8 text-white/45 text-xs hover:text-white/70 hover:border-white/14 transition-all text-center"
                  >
                    {configured ? '👤 Continuar sem conta' : '▶ Entrar como Visitante'}
                  </button>

                  {!configured && (
                    <div className="mt-4 p-3 rounded-xl border border-amber-800/30 bg-amber-900/15">
                      <p className="text-amber-400 text-[10px] text-center font-bold uppercase tracking-wider mb-1">
                        Supabase não configurado
                      </p>
                      <p className="text-amber-400/70 text-[9px] text-center">
                        Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar
                        auth.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── EMAIL FORM ──────────────────────────────────── */}
              {(phase === 'email' || phase === 'signup') && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    onClick={() => {
                      setPhase('choose');
                      setError(null);
                    }}
                    className="text-white/30 text-xs mb-4 hover:text-white/60 transition-colors"
                  >
                    ← Voltar
                  </button>

                  <form
                    onSubmit={phase === 'signup' ? handleSignUp : handleEmail}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                                   text-parchment text-sm placeholder:text-white/20
                                   focus:outline-none focus:border-gold/40 transition-colors"
                      />
                    </div>

                    {!magicMode && (
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">
                          Senha
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                          required={!magicMode}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                                     text-parchment text-sm placeholder:text-white/20
                                     focus:outline-none focus:border-gold/40 transition-colors"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-display text-base tracking-wider text-obsidian
                                 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #8c6f27, #c9a84c)' }}
                    >
                      {magicMode
                        ? 'Enviar Magic Link'
                        : phase === 'signup'
                          ? 'Criar Conta'
                          : 'Entrar'}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setMagicMode((m) => !m)}
                        className="text-white/30 hover:text-white/60 transition-colors"
                      >
                        {magicMode ? 'Usar senha' : 'Magic Link (sem senha)'}
                      </button>
                      {phase === 'email' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPhase('signup');
                            setError(null);
                          }}
                          className="text-white/30 hover:text-white/60 transition-colors"
                        >
                          Criar conta →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPhase('email');
                            setError(null);
                          }}
                          className="text-white/30 hover:text-white/60 transition-colors"
                        >
                          Já tenho conta
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── LOADING ────────────────────────────────────── */}
              {phase === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 text-center space-y-3"
                >
                  <motion.div
                    className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                  />
                  <p className="text-white/40 text-sm">Conectando…</p>
                </motion.div>
              )}

              {/* ── MAGIC SENT ─────────────────────────────────── */}
              {phase === 'magic_sent' && (
                <motion.div
                  key="magic_sent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center space-y-3"
                >
                  <motion.span
                    className="text-5xl block"
                    animate={{ rotate: [0, 10, -8, 5, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    ✉️
                  </motion.span>
                  <p className="text-parchment font-bold">Verifique seu email!</p>
                  <p className="text-white/40 text-xs">
                    Enviamos um link para <strong className="text-white/70">{email}</strong>. Clique
                    para entrar.
                  </p>
                  <button
                    onClick={() => setPhase('choose')}
                    className="text-white/30 text-xs hover:text-white/60 transition-colors mt-2"
                  >
                    ← Voltar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-white/15 text-[9px] mt-8 text-center">
        Ao entrar você concorda com os Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian" />}>
      <LoginContent />
    </Suspense>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function OAuthButton({
  icon,
  label,
  onClick,
  dark = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]',
        dark
          ? 'bg-black border-white/10 text-white hover:bg-white/5'
          : 'bg-white border-white/20 text-[#1a1a1a] hover:bg-white/90',
      ].join(' ')}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-white/20 text-[10px] uppercase tracking-widest">ou</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18L4.5 10.52Z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="white">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-45.3-150.7-111.1c-53-76.7-98.2-196.4-98.2-310.4 0-192.2 125.4-293.6 248.6-293.6 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46.3 168.3-46.3zm-107.8-230c31.4-37.6 53.4-89.7 53.4-141.9 0-7.1-.6-14.3-1.9-20.1-50.7 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 84.5-55.1 137.4 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.2-70.6z" />
    </svg>
  );
}

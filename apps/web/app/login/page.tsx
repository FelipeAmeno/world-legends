'use client';

import { useAuth } from '@/lib/auth-context';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

type LoginPhase =
  | 'choose'
  | 'email'
  | 'signup'
  | 'forgot'
  | 'reset_sent'
  | 'verify_sent'
  | 'loading';

// Deterministic positions — avoids hydration mismatch entre server/client
const SPARKS = [
  { x: 12, y: 18, size: 2, dur: 4.2, delay: 0, color: 0 },
  { x: 78, y: 8, size: 1.5, dur: 5.8, delay: 1.1, color: 1 },
  { x: 34, y: 72, size: 2.5, dur: 3.9, delay: 0.7, color: 2 },
  { x: 91, y: 45, size: 1.5, dur: 6.1, delay: 2.3, color: 0 },
  { x: 55, y: 22, size: 2, dur: 4.5, delay: 0.4, color: 1 },
  { x: 23, y: 60, size: 1, dur: 5.2, delay: 1.8, color: 2 },
  { x: 67, y: 83, size: 2, dur: 4.0, delay: 0.9, color: 0 },
  { x: 8, y: 88, size: 1.5, dur: 6.5, delay: 3.1, color: 1 },
  { x: 86, y: 15, size: 2, dur: 3.7, delay: 0.2, color: 2 },
  { x: 45, y: 92, size: 1, dur: 5.0, delay: 2.6, color: 0 },
  { x: 19, y: 35, size: 2.5, dur: 4.8, delay: 1.5, color: 1 },
  { x: 73, y: 58, size: 1.5, dur: 5.5, delay: 0.6, color: 2 },
  { x: 38, y: 12, size: 2, dur: 4.3, delay: 2.0, color: 0 },
  { x: 94, y: 70, size: 1, dur: 6.2, delay: 1.3, color: 1 },
  { x: 62, y: 48, size: 2, dur: 3.8, delay: 0.8, color: 2 },
  { x: 5, y: 55, size: 1.5, dur: 5.7, delay: 2.9, color: 0 },
  { x: 83, y: 32, size: 2, dur: 4.1, delay: 0.3, color: 1 },
  { x: 28, y: 78, size: 1, dur: 5.3, delay: 1.7, color: 2 },
  { x: 50, y: 65, size: 2.5, dur: 4.6, delay: 2.4, color: 0 },
  { x: 15, y: 95, size: 1.5, dur: 6.0, delay: 0.5, color: 1 },
] as const;

const SPARK_COLORS = [
  'rgba(201,168,76,0.65)', // gold
  'rgba(255,255,255,0.45)', // white floodlight
  'rgba(22,163,74,0.55)', // pitch green
];

function LoginContent() {
  const { signInGoogle, signInApple, signInEmail, signUp, resetPassword, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const errorParam = searchParams.get('error');

  const [phase, setPhase] = useState<LoginPhase>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(errorParam);

  const handleGoogle = async () => {
    setPhase('loading');
    setError(null);
    const { error } = await signInGoogle(redirect);
    if (error) {
      setError(error.message);
      setPhase('choose');
    }
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
    if (!email.trim() || !password.trim()) return;
    setPhase('loading');
    setError(null);
    const { error } = await signInEmail(email, password);
    if (error) {
      setError(error.message);
      setPhase('email');
    } else router.push(redirect);
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
    } else setPhase('verify_sent');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase('loading');
    setError(null);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
      setPhase('forgot');
    } else setPhase('reset_sent');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{
        background: [
          /* pitch glow from bottom */
          'radial-gradient(ellipse 90% 60% at 50% 120%, rgba(22,101,52,0.55) 0%, transparent 62%)',
          /* floodlight — left corner */
          'radial-gradient(ellipse 42% 76% at -8% -8%, rgba(255,243,210,0.22) 0%, transparent 55%)',
          /* floodlight — right corner */
          'radial-gradient(ellipse 42% 76% at 108% -8%, rgba(255,243,210,0.22) 0%, transparent 55%)',
          /* golden center haze */
          'radial-gradient(ellipse 70% 45% at 50% 18%, rgba(201,168,76,0.11) 0%, transparent 65%)',
          '#050508',
        ].join(', '),
      }}
    >
      {/* ── Stadium silhouette ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 400 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 left-0 w-full"
          style={{ opacity: 0.055 }}
          preserveAspectRatio="xMidYMax slice"
        >
          {/* Upper tier stands */}
          <path
            d="M0 280 L0 120 Q80 30 200 60 Q320 30 400 120 L400 280 Z"
            fill="rgba(200,200,220,0.9)"
          />
          {/* Inner bowl */}
          <path
            d="M20 280 L20 140 Q90 65 200 90 Q310 65 380 140 L380 280 Z"
            fill="rgba(5,5,8,0.95)"
          />
          {/* Pitch surface */}
          <rect x="35" y="200" width="330" height="80" rx="4" fill="rgba(22,101,52,0.7)" />
          {/* Pitch markings */}
          <rect
            x="35"
            y="200"
            width="330"
            height="80"
            rx="4"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="280"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="240"
            r="22"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
          />
          {/* Floodlight towers */}
          <rect x="8" y="30" width="6" height="90" fill="rgba(220,220,240,0.8)" />
          <rect x="386" y="30" width="6" height="90" fill="rgba(220,220,240,0.8)" />
          {/* Floodlight heads */}
          <rect x="0" y="24" width="22" height="9" rx="2" fill="rgba(255,243,210,0.9)" />
          <rect x="378" y="24" width="22" height="9" rx="2" fill="rgba(255,243,210,0.9)" />
          {/* Light beams */}
          <polygon points="0,33 22,33 80,200 0,200" fill="rgba(255,243,210,0.04)" />
          <polygon points="378,33 400,33 400,200 320,200" fill="rgba(255,243,210,0.04)" />
        </svg>
      </div>

      {/* ── Grass strip ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 pointer-events-none h-14"
        style={{
          background:
            'linear-gradient(to top, rgba(22,101,52,0.55) 0%, rgba(22,101,52,0.25) 50%, transparent 100%)',
          backdropFilter: 'none',
        }}
      />

      {/* ── Spark particles ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {SPARKS.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: SPARK_COLORS[s.color],
            }}
            animate={{ y: [-8, 8, -8], opacity: [0.25, 0.85, 0.25], scale: [0.7, 1.4, 0.7] }}
            transition={{
              duration: s.dur,
              delay: s.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 20 }}
      >
        <motion.div
          className="text-5xl mb-3 select-none"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          🏆
        </motion.div>

        <h1
          className="font-display text-6xl sm:text-7xl tracking-widest"
          style={{
            background:
              'linear-gradient(140deg, #f7e794 0%, #c9a84c 38%, #f5e08a 68%, #9a6f20 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 28px rgba(201,168,76,0.55))',
          }}
        >
          WORLD
          <br />
          LEGENDS
        </h1>

        <p
          className="text-[10px] tracking-[0.48em] uppercase mt-2"
          style={{ color: 'rgba(201,168,76,0.45)' }}
        >
          Collectible Football Card Game
        </p>
      </motion.div>

      {/* ── Login card ─────────────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 18 }}
      >
        <div
          className="glass rounded-3xl border border-white/8 overflow-hidden"
          style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.65), 0 0 80px rgba(201,168,76,0.06)' }}
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
              {/* ── CHOOSE ──────────────────────────────────────── */}
              {phase === 'choose' && (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  <p className="text-white/30 text-[11px] text-center tracking-[0.35em] uppercase mb-4">
                    {configured ? 'Entre na arena' : 'Modo demonstração'}
                  </p>

                  {configured ? (
                    <>
                      <OAuthButton
                        icon={<GoogleIcon />}
                        label="Continuar com Google"
                        onClick={handleGoogle}
                      />
                      <OAuthButton
                        icon={<AppleIcon />}
                        label="Continuar com Apple"
                        onClick={handleApple}
                        dark
                      />

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
                  ) : (
                    <div className="mt-2 p-3 rounded-xl border border-amber-800/30 bg-amber-900/15">
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

              {/* ── EMAIL LOGIN ──────────────────────────────────── */}
              {phase === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <BackButton
                    onClick={() => {
                      setPhase('choose');
                      setError(null);
                    }}
                  />

                  <form onSubmit={handleEmail} className="space-y-3">
                    <EmailField value={email} onChange={setEmail} />
                    <PasswordField value={password} onChange={setPassword} />

                    <GoldButton label="Entrar" />

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPhase('forgot');
                          setError(null);
                        }}
                        className="text-white/30 hover:text-white/60 transition-colors"
                      >
                        Esqueci a senha
                      </button>
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
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── SIGNUP ──────────────────────────────────────── */}
              {phase === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <BackButton
                    onClick={() => {
                      setPhase('choose');
                      setError(null);
                    }}
                  />

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <EmailField value={email} onChange={setEmail} />
                    <PasswordField value={password} onChange={setPassword} />

                    <GoldButton label="Criar Conta" />

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPhase('email');
                          setError(null);
                        }}
                        className="text-white/30 text-xs hover:text-white/60 transition-colors"
                      >
                        Já tenho conta
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD ──────────────────────────────── */}
              {phase === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <BackButton
                    onClick={() => {
                      setPhase('email');
                      setError(null);
                    }}
                  />

                  <p className="text-parchment text-sm font-bold mb-1">Recuperar senha</p>
                  <p className="text-white/35 text-xs mb-4">
                    Enviaremos um link para redefinir sua senha.
                  </p>

                  <form onSubmit={handleForgot} className="space-y-3">
                    <EmailField value={email} onChange={setEmail} />
                    <GoldButton label="Enviar Link de Recuperação" />
                  </form>
                </motion.div>
              )}

              {/* ── LOADING ──────────────────────────────────────── */}
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

              {/* ── RESET SENT ────────────────────────────────────── */}
              {phase === 'reset_sent' && (
                <ConfirmationScreen
                  emoji="🔑"
                  title="Email enviado!"
                  body={
                    <>
                      Link de recuperação enviado para{' '}
                      <strong className="text-white/70">{email}</strong>.
                    </>
                  }
                  onBack={() => setPhase('choose')}
                />
              )}

              {/* ── VERIFY SENT ───────────────────────────────────── */}
              {phase === 'verify_sent' && (
                <ConfirmationScreen
                  emoji="✉️"
                  title="Verifique seu email!"
                  body={
                    <>
                      Link de verificação enviado para{' '}
                      <strong className="text-white/70">{email}</strong>. Clique para ativar sua
                      conta.
                    </>
                  }
                  onBack={() => setPhase('choose')}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <p className="text-white/12 text-[9px] mt-8 text-center">
        Ao entrar você concorda com os Termos de Uso e Política de Privacidade.
      </p>
      <p className="text-white/15 text-[8px] mt-2 text-center tracking-wide">
        © Felipe Ameno · Todos os direitos reservados.
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-white/30 text-xs mb-4 hover:text-white/60 transition-colors"
    >
      ← Voltar
    </button>
  );
}

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Email</label>
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="seu@email.com"
        required
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                   text-parchment text-sm placeholder:text-white/20
                   focus:outline-none focus:border-gold/40 transition-colors"
      />
    </div>
  );
}

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Senha</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        minLength={6}
        required
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                   text-parchment text-sm placeholder:text-white/20
                   focus:outline-none focus:border-gold/40 transition-colors"
      />
    </div>
  );
}

function GoldButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full py-3 rounded-xl font-display text-base tracking-wider text-obsidian
                 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, #8c6f27, #c9a84c 55%, #8c6f27)' }}
    >
      {label}
    </button>
  );
}

function ConfirmationScreen({
  emoji,
  title,
  body,
  onBack,
}: {
  emoji: string;
  title: string;
  body: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-6 text-center space-y-3"
    >
      <motion.span
        className="text-5xl block"
        animate={{ rotate: [0, 10, -8, 5, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6 }}
      >
        {emoji}
      </motion.span>
      <p className="text-parchment font-bold">{title}</p>
      <p className="text-white/40 text-xs">{body}</p>
      <button
        onClick={onBack}
        className="text-white/30 text-xs hover:text-white/60 transition-colors mt-2"
      >
        ← Voltar ao início
      </button>
    </motion.div>
  );
}

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

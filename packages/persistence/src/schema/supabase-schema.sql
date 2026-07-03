-- ═══════════════════════════════════════════════════════════════
-- World Legends — Supabase Schema (T061)
-- ═══════════════════════════════════════════════════════════════
-- Executar em: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensões ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT NOT NULL DEFAULT '',
  level        INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  current_xp   INTEGER NOT NULL DEFAULT 0 CHECK (current_xp >= 0),
  xp_for_next  INTEGER NOT NULL DEFAULT 100,
  credits      INTEGER NOT NULL DEFAULT 500 CHECK (credits >= 0),
  fragments    INTEGER NOT NULL DEFAULT 0  CHECK (fragments >= 0),
  wins         INTEGER NOT NULL DEFAULT 0  CHECK (wins >= 0),
  draws        INTEGER NOT NULL DEFAULT 0  CHECK (draws >= 0),
  losses       INTEGER NOT NULL DEFAULT 0  CHECK (losses >= 0),
  total_cards  INTEGER NOT NULL DEFAULT 0  CHECK (total_cards >= 0),
  packs_opened INTEGER NOT NULL DEFAULT 0  CHECK (packs_opened >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── owned_cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.owned_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id     TEXT NOT NULL,           -- ID da carta do catálogo (ex: 'uc-1')
  evolution   INTEGER NOT NULL DEFAULT 0 CHECK (evolution >= 0 AND evolution <= 5),
  contracts   INTEGER NOT NULL DEFAULT 7 CHECK (contracts >= 0),
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owned_cards_user ON public.owned_cards(user_id);

-- ─── squads ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  formation  TEXT NOT NULL DEFAULT '4-3-3',
  slots      JSONB NOT NULL DEFAULT '[]',  -- [{slotId, ownedCardId}]
  bench_ids  TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── match_history ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opponent        TEXT NOT NULL,
  opponent_ovr    INTEGER NOT NULL DEFAULT 80,
  home_score      INTEGER NOT NULL DEFAULT 0 CHECK (home_score >= 0),
  away_score      INTEGER NOT NULL DEFAULT 0 CHECK (away_score >= 0),
  outcome         TEXT NOT NULL CHECK (outcome IN ('win','draw','loss')),
  credits_earned  INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  played_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user ON public.match_history(user_id, played_at DESC);

-- ─── pack_openings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pack_openings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pack_id     TEXT NOT NULL,              -- 'classic', 'elite', 'legend'
  pack_name   TEXT NOT NULL DEFAULT '',
  cards_json  JSONB NOT NULL DEFAULT '[]', -- [{cardId, rarityCode}]
  cost        INTEGER NOT NULL DEFAULT 0,
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pack_openings_user ON public.pack_openings(user_id);

-- ─── achievements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,   -- ex: 'wins50', 'level10', 'life_matches'
  stage          INTEGER NOT NULL DEFAULT 1 CHECK (stage >= 1),
  claimed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owned_cards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements  ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só vê/edita seus próprios dados
DO $$ BEGIN
  -- users
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_self') THEN
    CREATE POLICY users_self ON public.users
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  -- owned_cards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owned_cards' AND policyname='owned_cards_owner') THEN
    CREATE POLICY owned_cards_owner ON public.owned_cards
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  -- squads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='squads' AND policyname='squads_owner') THEN
    CREATE POLICY squads_owner ON public.squads
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  -- match_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_history' AND policyname='match_history_owner') THEN
    CREATE POLICY match_history_owner ON public.match_history
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  -- pack_openings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pack_openings' AND policyname='pack_openings_owner') THEN
    CREATE POLICY pack_openings_owner ON public.pack_openings
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  -- achievements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='achievements' AND policyname='achievements_owner') THEN
    CREATE POLICY achievements_owner ON public.achievements
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- RPCs (Funções Atômicas)
-- ═══════════════════════════════════════════════════════════════

-- RPC: deduzir créditos com validação de saldo
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount  INTEGER
) RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user public.users;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;

  UPDATE public.users
  SET
    credits    = credits - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
    AND credits >= p_amount
  RETURNING * INTO v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo insuficiente ou usuário não encontrado';
  END IF;

  RETURN v_user;
END;
$$;

-- RPC: adicionar XP + créditos (e subir de nível se necessário)
CREATE OR REPLACE FUNCTION public.add_reward(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 0,
  p_xp      INTEGER DEFAULT 0
) RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user    public.users;
  v_new_xp  INTEGER;
  v_level   INTEGER;
  v_xp_next INTEGER;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;

  v_new_xp  := v_user.current_xp + p_xp;
  v_level   := v_user.level;
  v_xp_next := v_user.xp_for_next;

  -- Level up loop
  WHILE v_new_xp >= v_xp_next LOOP
    v_new_xp  := v_new_xp - v_xp_next;
    v_level   := v_level + 1;
    v_xp_next := v_level * 100 + (v_level * v_level * 5);
  END LOOP;

  UPDATE public.users
  SET
    credits    = credits + p_credits,
    current_xp = v_new_xp,
    level      = v_level,
    xp_for_next= v_xp_next,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

-- RPC: incrementar stats de partida (wins/draws/losses)
CREATE OR REPLACE FUNCTION public.increment_match_stats(
  p_user_id UUID,
  p_outcome TEXT  -- 'win' | 'draw' | 'loss'
) RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user public.users;
BEGIN
  UPDATE public.users
  SET
    wins       = wins   + CASE WHEN p_outcome = 'win'  THEN 1 ELSE 0 END,
    draws      = draws  + CASE WHEN p_outcome = 'draw' THEN 1 ELSE 0 END,
    losses     = losses + CASE WHEN p_outcome = 'loss' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;

  RETURN v_user;
END;
$$;

-- Trigger: criar perfil de usuário automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Jogador')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

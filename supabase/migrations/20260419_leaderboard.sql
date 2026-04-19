-- ============================================================
-- Leaderboard feature migration
-- ============================================================

-- ── 1. New columns on profiles ───────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS top3_weekly_count          integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_rank                integer      NULL,
  ADD COLUMN IF NOT EXISTS last_week_recorded         integer      NULL,
  ADD COLUMN IF NOT EXISTS search_cooldown_bonus_at   timestamptz  NULL,
  ADD COLUMN IF NOT EXISTS search_cooldown_bonus_hours integer     NOT NULL DEFAULT 0;

-- top3_weekly_count        : cumulative top-3 weekly finishes
-- weekly_rank              : NULL = no rank yet this week; 1/2/3 = frame tier; 4+ = ranked but no frame
-- last_week_recorded       : ISO week number last processed (prevents duplicate recording)
-- search_cooldown_bonus_at : if set and in the future, the bonus is still claimable
-- search_cooldown_bonus_hours : 12 for 1st, 8 for 2nd, 6 for 3rd, 0 = no bonus

-- ── 2. RLS policy — allow all authenticated users to read any profile ──

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Authenticated users can view all profiles for leaderboard'
  ) THEN
    CREATE POLICY "Authenticated users can view all profiles for leaderboard"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- ── 3. Search leaderboard RPC ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_search_leaderboard(period text, lim integer DEFAULT 50)
RETURNS TABLE (
  rank         bigint,
  user_id      uuid,
  nickname     text,
  avatar_url   text,
  search_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE since_ts timestamptz;
BEGIN
  since_ts := CASE period
    WHEN 'week'  THEN date_trunc('week',  now() AT TIME ZONE 'UTC')
    WHEN 'month' THEN date_trunc('month', now() AT TIME ZONE 'UTC')
    WHEN 'year'  THEN date_trunc('year',  now() AT TIME ZONE 'UTC')
    ELSE              date_trunc('week',  now() AT TIME ZONE 'UTC')
  END;

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC) AS rank,
    p.user_id,
    p.nickname,
    p.avatar_url,
    COUNT(a.id) AS search_count
  FROM ai_usage a
  JOIN profiles p ON p.user_id = a.user_id
  WHERE a.created_at >= since_ts
  GROUP BY p.user_id, p.nickname, p.avatar_url
  ORDER BY search_count DESC
  LIMIT lim;
END;
$$;

-- ── 4. Savings leaderboard RPC ────────────────────────────────

CREATE OR REPLACE FUNCTION get_savings_leaderboard(period text, lim integer DEFAULT 50)
RETURNS TABLE (
  rank         bigint,
  user_id      uuid,
  nickname     text,
  avatar_url   text,
  amount_saved numeric,
  currency     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE since_ts timestamptz;
BEGIN
  IF period = 'week' THEN
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.weekly_saved DESC) AS rank,
      p.user_id, p.nickname, p.avatar_url,
      p.weekly_saved AS amount_saved, p.currency
    FROM profiles p
    WHERE p.weekly_saved > 0
    ORDER BY p.weekly_saved DESC
    LIMIT lim;

  ELSIF period = 'month' THEN
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.monthly_saved DESC) AS rank,
      p.user_id, p.nickname, p.avatar_url,
      p.monthly_saved AS amount_saved, p.currency
    FROM profiles p
    WHERE p.monthly_saved > 0
    ORDER BY p.monthly_saved DESC
    LIMIT lim;

  ELSE
    -- year: aggregate from savings_entries
    since_ts := date_trunc('year', now() AT TIME ZONE 'UTC');
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY SUM(se.amount_saved) DESC) AS rank,
      p.user_id, p.nickname, p.avatar_url,
      SUM(se.amount_saved) AS amount_saved, p.currency
    FROM savings_entries se
    JOIN profiles p ON p.user_id = se.user_id
    WHERE se.created_at >= since_ts
    GROUP BY p.user_id, p.nickname, p.avatar_url, p.currency
    ORDER BY amount_saved DESC
    LIMIT lim;
  END IF;
END;
$$;

-- ── 5. Last-week savings leaderboard (for weekly finish recording) ──

CREATE OR REPLACE FUNCTION get_last_week_savings_leaderboard(lim integer DEFAULT 100)
RETURNS TABLE (
  rank         bigint,
  user_id      uuid,
  nickname     text,
  avatar_url   text,
  amount_saved numeric,
  currency     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start  timestamptz;
  week_end    timestamptz;
BEGIN
  week_start := date_trunc('week', now() AT TIME ZONE 'UTC') - interval '7 days';
  week_end   := date_trunc('week', now() AT TIME ZONE 'UTC');

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(se.amount_saved) DESC) AS rank,
    p.user_id, p.nickname, p.avatar_url,
    SUM(se.amount_saved) AS amount_saved, p.currency
  FROM savings_entries se
  JOIN profiles p ON p.user_id = se.user_id
  WHERE se.created_at >= week_start
    AND se.created_at < week_end
  GROUP BY p.user_id, p.nickname, p.avatar_url, p.currency
  ORDER BY amount_saved DESC
  LIMIT lim;
END;
$$;

-- ── 6. Record weekly finish RPC ───────────────────────────────

CREATE OR REPLACE FUNCTION record_weekly_finish(p_user_id uuid, p_rank integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always store the rank
  UPDATE profiles SET weekly_rank = p_rank WHERE user_id = p_user_id;

  -- Increment top3 count if top 3
  IF p_rank <= 3 THEN
    UPDATE profiles
    SET top3_weekly_count = top3_weekly_count + 1
    WHERE user_id = p_user_id;
  END IF;

  -- Grant tiered cooldown bonus (valid 7 days so user doesn't miss it)
  IF p_rank = 1 THEN
    UPDATE profiles
    SET search_cooldown_bonus_hours = 12,
        search_cooldown_bonus_at    = now() + interval '7 days'
    WHERE user_id = p_user_id;
  ELSIF p_rank = 2 THEN
    UPDATE profiles
    SET search_cooldown_bonus_hours = 8,
        search_cooldown_bonus_at    = now() + interval '7 days'
    WHERE user_id = p_user_id;
  ELSIF p_rank = 3 THEN
    UPDATE profiles
    SET search_cooldown_bonus_hours = 6,
        search_cooldown_bonus_at    = now() + interval '7 days'
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- ── 7. Consume cooldown bonus RPC ────────────────────────────

CREATE OR REPLACE FUNCTION consume_cooldown_bonus(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET search_cooldown_bonus_at    = NULL,
      search_cooldown_bonus_hours = 0
  WHERE user_id = p_user_id;
END;
$$;

-- ── 8. Reset weekly ranks (called at start of each week) ─────

CREATE OR REPLACE FUNCTION reset_weekly_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET weekly_rank = NULL;
END;
$$;

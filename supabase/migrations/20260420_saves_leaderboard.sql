-- ============================================================
-- Saves leaderboard — ranks users by number of saves logged
-- ============================================================

CREATE OR REPLACE FUNCTION get_saves_leaderboard(period text, lim integer DEFAULT 50)
RETURNS TABLE (
  rank       bigint,
  user_id    uuid,
  nickname   text,
  avatar_url text,
  save_count bigint
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
    ROW_NUMBER() OVER (ORDER BY COUNT(se.id) DESC) AS rank,
    p.user_id,
    p.nickname,
    p.avatar_url,
    COUNT(se.id) AS save_count
  FROM savings_entries se
  JOIN profiles p ON p.user_id = se.user_id
  WHERE se.created_at >= since_ts
  GROUP BY p.user_id, p.nickname, p.avatar_url
  ORDER BY save_count DESC
  LIMIT lim;
END;
$$;

-- ── Last-week saves leaderboard (for weekly finish recording) ──

CREATE OR REPLACE FUNCTION get_last_week_saves_leaderboard(lim integer DEFAULT 100)
RETURNS TABLE (
  rank       bigint,
  user_id    uuid,
  nickname   text,
  avatar_url text,
  save_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start timestamptz;
  week_end   timestamptz;
BEGIN
  week_start := date_trunc('week', now() AT TIME ZONE 'UTC') - interval '7 days';
  week_end   := date_trunc('week', now() AT TIME ZONE 'UTC');

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(se.id) DESC) AS rank,
    p.user_id,
    p.nickname,
    p.avatar_url,
    COUNT(se.id) AS save_count
  FROM savings_entries se
  JOIN profiles p ON p.user_id = se.user_id
  WHERE se.created_at >= week_start
    AND se.created_at < week_end
  GROUP BY p.user_id, p.nickname, p.avatar_url
  ORDER BY save_count DESC
  LIMIT lim;
END;
$$;

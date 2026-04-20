-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  emoji text NOT NULL DEFAULT '🎯',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_goals" ON savings_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link savings entries to goals (nullable)
ALTER TABLE savings_entries 
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES savings_goals(id) ON DELETE SET NULL;

-- XP column on profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

-- XP increment function
CREATE OR REPLACE FUNCTION increment_profile_xp(user_id_in uuid, amount_in int)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles 
  SET xp = xp + amount_in 
  WHERE user_id = user_id_in 
  RETURNING xp;
$$;
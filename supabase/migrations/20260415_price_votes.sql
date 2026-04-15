-- Price accuracy voting table
CREATE TABLE IF NOT EXISTS price_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES savings_entries(id) ON DELETE CASCADE NOT NULL,
  vote text NOT NULL CHECK (vote IN ('accurate', 'inaccurate')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, entry_id)
);

ALTER TABLE price_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own votes" ON price_votes
  FOR ALL USING (auth.uid() = user_id);

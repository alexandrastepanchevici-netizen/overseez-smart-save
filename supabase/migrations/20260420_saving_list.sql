-- Saving list: places a user wants to visit/buy from later
CREATE TABLE saving_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  average_price NUMERIC,
  displayed_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  search_query TEXT,
  city TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  notified_expiry BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saving_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saving list"
  ON saving_list_items
  FOR ALL
  USING (auth.uid() = user_id);

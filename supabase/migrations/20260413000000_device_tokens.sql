-- Device tokens table for Firebase Cloud Messaging push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens"
  ON device_tokens
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);

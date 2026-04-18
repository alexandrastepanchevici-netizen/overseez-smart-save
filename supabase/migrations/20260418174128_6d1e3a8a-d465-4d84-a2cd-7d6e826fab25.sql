ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload their avatar') THEN
    CREATE POLICY "Users can upload their avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their avatar') THEN
    CREATE POLICY "Users can update their avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND name = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can read avatars') THEN
    CREATE POLICY "Public can read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
  END IF;
END $$;
-- Fix avatar storage RLS policies.
-- The previous policies checked `name = auth.uid()::text` but the upload
-- path is `<uuid>.<ext>` (e.g. "abc-123.jpg"), so the extension caused a
-- mismatch and every upload threw "new row violates row-level security policy".

-- Drop the old policies
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;

-- Allow upload of files whose name STARTS WITH the user's UUID
-- (covers "uuid", "uuid.jpg", "uuid.png", etc.)
CREATE POLICY "Users can upload their avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (name = auth.uid()::text OR name LIKE auth.uid()::text || '.%')
  );

CREATE POLICY "Users can update their avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (name = auth.uid()::text OR name LIKE auth.uid()::text || '.%')
  );

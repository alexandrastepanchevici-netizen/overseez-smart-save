DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;

CREATE POLICY "Users can upload their avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (name = auth.uid()::text OR name LIKE auth.uid()::text || '.%')
);

CREATE POLICY "Users can update their avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (name = auth.uid()::text OR name LIKE auth.uid()::text || '.%')
);
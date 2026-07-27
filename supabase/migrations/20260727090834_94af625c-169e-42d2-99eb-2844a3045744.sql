DROP POLICY IF EXISTS "Anyone can upload story images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update story images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete story images" ON storage.objects;

CREATE POLICY "Service role manages story images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'story-images')
WITH CHECK (bucket_id = 'story-images');
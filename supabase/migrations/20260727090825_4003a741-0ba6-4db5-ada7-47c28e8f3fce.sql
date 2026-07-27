CREATE POLICY "Anyone can read story images"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can upload story images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-images');

CREATE POLICY "Anyone can update story images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can delete story images"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-images');
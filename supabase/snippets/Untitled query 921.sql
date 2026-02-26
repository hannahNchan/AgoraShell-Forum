INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid() IS NOT NULL);

CREATE POLICY "images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);
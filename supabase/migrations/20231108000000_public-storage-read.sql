-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "allow select 176g1iq_0" ON storage.objects;

-- Create public read policy for menus-files bucket
CREATE POLICY "allow public read menus-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menus-files');

-- Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'menus-files';

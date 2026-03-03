-- thought_images with url (for Supabase Storage public URLs)
-- If you already have thought_images with path/sort, run: DROP TABLE IF EXISTS public.thought_images; first, then this.

CREATE TABLE IF NOT EXISTS public.thought_images (
  id bigserial PRIMARY KEY,
  thought_id bigint NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.thought_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read thought_images"
ON public.thought_images
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated insert thought_images"
ON public.thought_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated delete thought_images"
ON public.thought_images
FOR DELETE
TO authenticated
USING (true);

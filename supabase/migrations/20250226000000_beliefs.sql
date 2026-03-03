-- Beliefs table
CREATE TABLE IF NOT EXISTS public.beliefs (
  id bigserial PRIMARY KEY,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beliefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read beliefs"
ON public.beliefs FOR SELECT
TO anon, authenticated USING (true);

CREATE POLICY "Authenticated insert beliefs"
ON public.beliefs FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update beliefs"
ON public.beliefs FOR UPDATE
TO authenticated USING (true);

CREATE POLICY "Authenticated delete beliefs"
ON public.beliefs FOR DELETE
TO authenticated USING (true);

-- Belief images table (storage path per image)
CREATE TABLE IF NOT EXISTS public.belief_images (
  id bigserial PRIMARY KEY,
  belief_id bigint NOT NULL REFERENCES public.beliefs(id) ON DELETE CASCADE,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.belief_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read belief_images"
ON public.belief_images FOR SELECT
TO anon, authenticated USING (true);

CREATE POLICY "Authenticated insert belief_images"
ON public.belief_images FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated delete belief_images"
ON public.belief_images FOR DELETE
TO authenticated USING (true);

-- Add bg_index for /public/beliefs/belief01.jpg, belief02.jpg, etc. (assigned once on insert)
-- Add title for admin form (required)
-- created_at already exists on public.beliefs

ALTER TABLE public.beliefs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.beliefs ADD COLUMN IF NOT EXISTS bg_index smallint NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.beliefs.bg_index IS '1-based index into /public/beliefs/beliefNN.jpg; assigned on insert, never changed';

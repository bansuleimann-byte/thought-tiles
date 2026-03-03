-- Add permanent tile_number to thoughts (int4).
-- Run this in the Supabase SQL editor or via: supabase db push
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS tile_number int4;

-- Optional: backfill existing rows by id order (so tile_number matches current id-based display).
-- Uncomment and run once if you have existing rows and want tile_number 1,2,3,... by id.
-- WITH ordered AS (
--   SELECT id, row_number() OVER (ORDER BY id) AS rn
--   FROM thoughts
-- )
-- UPDATE thoughts t
-- SET tile_number = ordered.rn
-- FROM ordered
-- WHERE t.id = ordered.id;

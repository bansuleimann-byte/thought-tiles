-- Add sort_order to thought_images (only if column does not exist)
ALTER TABLE public.thought_images
ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

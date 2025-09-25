-- Add external_url column to player table for external site links
ALTER TABLE public.player
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.player.external_url IS 'External website URL for player information (e.g., Macour profile)';

-- RLS policies remain unchanged - select is public, updates are admin only
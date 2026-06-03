-- Add new BGG fields to games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS bgg_rank integer,
  ADD COLUMN IF NOT EXISTS min_playtime integer,
  ADD COLUMN IF NOT EXISTS max_playtime integer,
  ADD COLUMN IF NOT EXISTS best_players integer;

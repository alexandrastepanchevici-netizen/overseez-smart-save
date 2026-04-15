-- Add city and country tracking to ai_usage for globe_trotter / world_explorer badges
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS country_code text;

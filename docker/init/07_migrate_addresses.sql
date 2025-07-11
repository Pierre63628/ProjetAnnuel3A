-- Migration script to populate detailed_address from lieu for existing events
-- This ensures backward compatibility while transitioning to detailed_address

-- Update events where detailed_address is null or empty but lieu has a value
UPDATE "Evenement" 
SET detailed_address = lieu 
WHERE (detailed_address IS NULL OR detailed_address = '') 
  AND lieu IS NOT NULL 
  AND lieu != '';

-- For events that have both fields populated, keep detailed_address as the primary field
-- but ensure lieu is also populated for backward compatibility
UPDATE "Evenement" 
SET lieu = detailed_address 
WHERE detailed_address IS NOT NULL 
  AND detailed_address != '' 
  AND (lieu IS NULL OR lieu = '');

-- Add a comment to document the migration
COMMENT ON COLUMN "Evenement".detailed_address IS 'Primary address field - populated from French government API with full address details';
COMMENT ON COLUMN "Evenement".lieu IS 'Legacy address field - kept for backward compatibility, should mirror detailed_address';

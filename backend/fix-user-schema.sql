-- Emergency fix for missing columns in Utilisateur table
-- Run this script to fix the current database schema issue

-- Check current schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Utilisateur' 
ORDER BY ordinal_position;

-- Add missing columns
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;

-- Add comments for documentation
COMMENT ON COLUMN "Utilisateur".profile_picture IS 'URL path to user profile picture';
COMMENT ON COLUMN "Utilisateur".email_verified IS 'Whether the user email has been verified';
COMMENT ON COLUMN "Utilisateur".email_verified_at IS 'Timestamp when email was verified';

-- Update existing users to be email verified (backward compatibility)
UPDATE "Utilisateur" 
SET email_verified = TRUE, email_verified_at = COALESCE(updated_at, created_at, NOW())
WHERE email_verified IS NULL OR email_verified = FALSE;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_utilisateur_email_verified ON "Utilisateur"(email_verified);
CREATE INDEX IF NOT EXISTS idx_utilisateur_profile_picture ON "Utilisateur"(profile_picture) WHERE profile_picture IS NOT NULL;

-- Verify the fix
SELECT 
    'After migration:' as status,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Utilisateur' 
ORDER BY ordinal_position;

-- Test the query that was failing
SELECT
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.adresse,
    u.telephone,
    u.date_naissance,
    u.profile_picture,
    u.role,
    u.email_verified,
    u.email_verified_at,
    u.created_at,
    u.updated_at,
    u.quartier_id,
    q.nom_quartier,
    q.ville,
    q.code_postal
FROM "Utilisateur" u
LEFT JOIN "Quartier" q ON u.quartier_id = q.id
LIMIT 1;

SELECT 'Schema fix completed successfully!' as result;

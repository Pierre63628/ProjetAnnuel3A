-- Migration to add missing columns to Utilisateur table
-- This fixes the database schema to match the application expectations

-- Add profile_picture column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Utilisateur' 
        AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE "Utilisateur" ADD COLUMN profile_picture TEXT NULL;
        COMMENT ON COLUMN "Utilisateur".profile_picture IS 'URL path to user profile picture stored in uploads/images/';
    END IF;
END $$;

-- Add email_verified column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Utilisateur' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE "Utilisateur" ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN "Utilisateur".email_verified IS 'Whether the user email has been verified';
    END IF;
END $$;

-- Add email_verified_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Utilisateur' 
        AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE "Utilisateur" ADD COLUMN email_verified_at TIMESTAMP NULL;
        COMMENT ON COLUMN "Utilisateur".email_verified_at IS 'Timestamp when the email was verified';
    END IF;
END $$;

-- Update existing users to have email_verified = true if they don't have a verification record
-- This ensures backward compatibility for existing users
UPDATE "Utilisateur" 
SET email_verified = TRUE, email_verified_at = created_at 
WHERE email_verified IS NULL OR email_verified = FALSE;

-- Create index on email_verified for performance
CREATE INDEX IF NOT EXISTS idx_utilisateur_email_verified ON "Utilisateur"(email_verified);

-- Display confirmation message
DO $$ 
BEGIN 
    RAISE NOTICE 'Migration completed: Added missing columns to Utilisateur table';
    RAISE NOTICE '- profile_picture: TEXT (nullable)';
    RAISE NOTICE '- email_verified: BOOLEAN (default FALSE)';
    RAISE NOTICE '- email_verified_at: TIMESTAMP (nullable)';
    RAISE NOTICE 'Existing users have been marked as email verified for backward compatibility';
END $$;

-- Email Verification System Migration
-- Add email verification fields to User table and create EmailVerification table

-- Add email verification fields to Utilisateur table
ALTER TABLE "Utilisateur" 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;

-- Create EmailVerification table for managing verification codes
CREATE TABLE IF NOT EXISTS "EmailVerification" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON "EmailVerification"(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON "EmailVerification"(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON "EmailVerification"(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_used ON "EmailVerification"(is_used);

-- Create function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM "EmailVerification" 
    WHERE expires_at < NOW() AND is_used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up old verification codes when new ones are created
CREATE OR REPLACE FUNCTION cleanup_old_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete old unused verification codes for this user
    DELETE FROM "EmailVerification" 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_used = FALSE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_old_verification_codes
    AFTER INSERT ON "EmailVerification"
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_verification_codes();

-- Update existing users to have email_verified = true (for backward compatibility)
-- This ensures existing users don't get locked out
UPDATE "Utilisateur" 
SET email_verified = TRUE, email_verified_at = created_at 
WHERE email_verified IS NULL OR email_verified = FALSE;

COMMENT ON TABLE "EmailVerification" IS 'Stores email verification codes for user registration';
COMMENT ON COLUMN "EmailVerification".verification_code IS '6-digit verification code sent to user email';
COMMENT ON COLUMN "EmailVerification".expires_at IS 'Expiration timestamp for the verification code (15 minutes from creation)';
COMMENT ON COLUMN "EmailVerification".attempts IS 'Number of failed verification attempts for this code';
COMMENT ON COLUMN "EmailVerification".is_used IS 'Whether this verification code has been successfully used';

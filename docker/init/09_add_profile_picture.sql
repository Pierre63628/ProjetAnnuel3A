-- Add profile picture support to User table
-- Migration to add profile_picture field to Utilisateur table

-- Add profile_picture column to Utilisateur table
ALTER TABLE "Utilisateur" 
ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL;

-- Add comment to document the column
COMMENT ON COLUMN "Utilisateur".profile_picture IS 'URL path to user profile picture stored in uploads/images/';

-- Update the findAllWithQuartier query to include profile_picture
-- This is handled in the backend code, no SQL changes needed for that

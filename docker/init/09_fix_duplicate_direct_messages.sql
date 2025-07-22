-- Fix Duplicate Direct Message Rooms Migration
-- This migration prevents duplicate direct message rooms between the same pair of users

-- First, let's clean up any existing duplicate direct message rooms
-- We'll keep the oldest room for each pair of users and remove the duplicates

-- Create a temporary function to clean up duplicates
CREATE OR REPLACE FUNCTION cleanup_duplicate_direct_rooms() RETURNS void AS $$
DECLARE
    room_record RECORD;
    duplicate_room_record RECORD;
    user_pair_record RECORD;
BEGIN
    -- Find all pairs of users that have multiple direct message rooms
    FOR user_pair_record IN
        SELECT 
            LEAST(crm1.user_id, crm2.user_id) as user1_id,
            GREATEST(crm1.user_id, crm2.user_id) as user2_id,
            COUNT(DISTINCT cr.id) as room_count
        FROM "ChatRoom" cr
        JOIN "ChatRoomMember" crm1 ON cr.id = crm1.chat_room_id
        JOIN "ChatRoomMember" crm2 ON cr.id = crm2.chat_room_id
        WHERE cr.room_type = 'direct' 
        AND cr.is_active = true
        AND crm1.user_id != crm2.user_id
        AND (
            SELECT COUNT(*) FROM "ChatRoomMember" crm 
            WHERE crm.chat_room_id = cr.id
        ) = 2
        GROUP BY LEAST(crm1.user_id, crm2.user_id), GREATEST(crm1.user_id, crm2.user_id)
        HAVING COUNT(DISTINCT cr.id) > 1
    LOOP
        -- For each pair with duplicates, keep the oldest room and deactivate the others
        FOR duplicate_room_record IN
            SELECT cr.id, cr.created_at
            FROM "ChatRoom" cr
            WHERE cr.room_type = 'direct' 
            AND cr.is_active = true
            AND EXISTS (
                SELECT 1 FROM "ChatRoomMember" crm1
                WHERE crm1.chat_room_id = cr.id AND crm1.user_id = user_pair_record.user1_id
            )
            AND EXISTS (
                SELECT 1 FROM "ChatRoomMember" crm2
                WHERE crm2.chat_room_id = cr.id AND crm2.user_id = user_pair_record.user2_id
            )
            AND (
                SELECT COUNT(*) FROM "ChatRoomMember" crm
                WHERE crm.chat_room_id = cr.id
            ) = 2
            ORDER BY cr.created_at ASC
            OFFSET 1  -- Skip the first (oldest) room
        LOOP
            -- Deactivate duplicate rooms instead of deleting them to preserve message history
            UPDATE "ChatRoom" 
            SET is_active = false, 
                name = name || ' (DUPLICATE - DEACTIVATED)',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = duplicate_room_record.id;
            
            RAISE NOTICE 'Deactivated duplicate direct message room with ID: %', duplicate_room_record.id;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the cleanup function
SELECT cleanup_duplicate_direct_rooms();

-- Drop the temporary function
DROP FUNCTION cleanup_duplicate_direct_rooms();

-- Create a computed column approach using a function
-- This is the reliable solution for preventing duplicates

-- Create a function to generate a normalized room identifier for direct messages
CREATE OR REPLACE FUNCTION get_direct_room_identifier(room_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    user_ids INTEGER[];
    normalized_id TEXT;
BEGIN
    -- Get the two user IDs for this direct message room
    SELECT ARRAY(
        SELECT user_id
        FROM "ChatRoomMember"
        WHERE chat_room_id = room_id
        ORDER BY user_id
    ) INTO user_ids;

    -- Return null if not exactly 2 users (not a valid direct message room)
    IF array_length(user_ids, 1) != 2 THEN
        RETURN NULL;
    END IF;

    -- Create normalized identifier: "user1_id:user2_id" where user1_id < user2_id
    normalized_id := user_ids[1] || ':' || user_ids[2];

    RETURN normalized_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add a computed column for the normalized room identifier
ALTER TABLE "ChatRoom" ADD COLUMN IF NOT EXISTS direct_room_identifier TEXT;

-- Update existing direct message rooms with their normalized identifiers
UPDATE "ChatRoom" 
SET direct_room_identifier = get_direct_room_identifier(id)
WHERE room_type = 'direct';

-- Create a unique constraint on the normalized identifier for active direct rooms
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_direct_room_identifier
ON "ChatRoom" (direct_room_identifier)
WHERE room_type = 'direct' AND is_active = true AND direct_room_identifier IS NOT NULL;

-- Note: The direct_room_identifier will be set by the application code
-- after creating the room and adding members to ensure proper normalization

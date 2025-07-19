-- Messaging System Database Schema

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS "ChatRoom" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quartier_id INTEGER NOT NULL,
    room_type VARCHAR(50) DEFAULT 'group', -- 'group', 'direct'
    created_by INTEGER REFERENCES "Utilisateur"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Chat Room Members table
CREATE TABLE IF NOT EXISTS "ChatRoomMember" (
    id SERIAL PRIMARY KEY,
    chat_room_id INTEGER REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(chat_room_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS "Message" (
    id SERIAL PRIMARY KEY,
    chat_room_id INTEGER REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    reply_to_id INTEGER REFERENCES "Message"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP NULL
);

-- Message Reactions table
CREATE TABLE IF NOT EXISTS "MessageReaction" (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES "Message"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    reaction VARCHAR(50) NOT NULL, -- emoji or reaction type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction)
);

-- User Presence table
CREATE TABLE IF NOT EXISTS "UserPresence" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(50) DEFAULT 'offline', -- 'online', 'away', 'busy', 'offline'
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    socket_id VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Typing Indicators table
CREATE TABLE IF NOT EXISTS "TypingIndicator" (
    id SERIAL PRIMARY KEY,
    chat_room_id INTEGER REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_room_id, user_id)
);

-- Message Delivery Status table
CREATE TABLE IF NOT EXISTS "MessageDelivery" (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES "Message"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Blocked Users table
CREATE TABLE IF NOT EXISTS "BlockedUser" (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    blocked_id INTEGER REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatroom_quartier ON "ChatRoom"(quartier_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_member_room ON "ChatRoomMember"(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_member_user ON "ChatRoomMember"(user_id);
CREATE INDEX IF NOT EXISTS idx_message_room ON "Message"(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_created ON "Message"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON "UserPresence"(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_room ON "TypingIndicator"(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_message ON "MessageDelivery"(message_id);
CREATE INDEX IF NOT EXISTS idx_blocked_user_blocker ON "BlockedUser"(blocker_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chatroom_updated_at BEFORE UPDATE ON "ChatRoom" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_message_updated_at BEFORE UPDATE ON "Message" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON "UserPresence" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default general chat room for each quartier
INSERT INTO "ChatRoom" (name, description, quartier_id, room_type, created_by)
SELECT 
    CONCAT('Général - ', q.nom_quartier) as name,
    CONCAT('Chat général pour le quartier ', q.nom_quartier) as description,
    q.id as quartier_id,
    'group' as room_type,
    NULL as created_by
FROM "Quartier" q
WHERE NOT EXISTS (
    SELECT 1 FROM "ChatRoom" cr 
    WHERE cr.quartier_id = q.id AND cr.name = CONCAT('Général - ', q.nom_quartier)
);

-- Grant permissions
ALTER TABLE "ChatRoom" OWNER TO "user";
ALTER TABLE "ChatRoomMember" OWNER TO "user";
ALTER TABLE "Message" OWNER TO "user";
ALTER TABLE "MessageReaction" OWNER TO "user";
ALTER TABLE "UserPresence" OWNER TO "user";
ALTER TABLE "TypingIndicator" OWNER TO "user";
ALTER TABLE "MessageDelivery" OWNER TO "user";
ALTER TABLE "BlockedUser" OWNER TO "user";

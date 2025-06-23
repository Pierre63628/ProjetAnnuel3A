import pool from '../config/db.js';
import { UserPresence, TypingIndicator } from '../types/messaging.types.js';

export class UserPresenceModel {
    // Update user presence
    static async updatePresence(
        userId: number, 
        status: 'online' | 'away' | 'busy' | 'offline', 
        socketId?: string
    ): Promise<UserPresence | null> {
        const query = `
            INSERT INTO "UserPresence" (user_id, status, socket_id, last_seen, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                status = EXCLUDED.status,
                socket_id = EXCLUDED.socket_id,
                last_seen = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        
        const result = await pool.query(query, [userId, status, socketId]);
        return result.rows[0] || null;
    }

    // Get user presence
    static async getPresence(userId: number): Promise<UserPresence | null> {
        const query = 'SELECT * FROM "UserPresence" WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    }

    // Get presence for multiple users
    static async getMultiplePresence(userIds: number[]): Promise<UserPresence[]> {
        if (userIds.length === 0) return [];
        
        const query = `
            SELECT 
                up.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom
                ) as user
            FROM "UserPresence" up
            INNER JOIN "Utilisateur" u ON up.user_id = u.id
            WHERE up.user_id = ANY($1)
        `;
        
        const result = await pool.query(query, [userIds]);
        return result.rows;
    }

    // Get online users in a quartier
    static async getOnlineUsersInQuartier(quartierId: number): Promise<UserPresence[]> {
        const query = `
            SELECT 
                up.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom
                ) as user
            FROM "UserPresence" up
            INNER JOIN "Utilisateur" u ON up.user_id = u.id
            WHERE u.quartier_id = $1 
            AND up.status IN ('online', 'away', 'busy')
            AND up.last_seen > NOW() - INTERVAL '5 minutes'
            ORDER BY up.last_seen DESC
        `;
        
        const result = await pool.query(query, [quartierId]);
        return result.rows;
    }

    // Set user offline
    static async setOffline(userId: number): Promise<void> {
        const query = `
            UPDATE "UserPresence" 
            SET status = 'offline', socket_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
        `;
        
        await pool.query(query, [userId]);
    }

    // Clean up old presence records (users offline for more than 24 hours)
    static async cleanupOldPresence(): Promise<void> {
        const query = `
            UPDATE "UserPresence" 
            SET status = 'offline', socket_id = NULL
            WHERE last_seen < NOW() - INTERVAL '24 hours' 
            AND status != 'offline'
        `;
        
        await pool.query(query);
    }

    // Typing indicators
    static async startTyping(chatRoomId: number, userId: number): Promise<TypingIndicator | null> {
        const query = `
            INSERT INTO "TypingIndicator" (chat_room_id, user_id, started_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (chat_room_id, user_id) DO UPDATE SET
                started_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        
        const result = await pool.query(query, [chatRoomId, userId]);
        if (result.rows.length === 0) return null;

        // Get typing indicator with user info
        const typingQuery = `
            SELECT 
                ti.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom
                ) as user
            FROM "TypingIndicator" ti
            INNER JOIN "Utilisateur" u ON ti.user_id = u.id
            WHERE ti.id = $1
        `;
        
        const typingResult = await pool.query(typingQuery, [result.rows[0].id]);
        return typingResult.rows[0];
    }

    // Stop typing
    static async stopTyping(chatRoomId: number, userId: number): Promise<boolean> {
        const query = 'DELETE FROM "TypingIndicator" WHERE chat_room_id = $1 AND user_id = $2';
        const result = await pool.query(query, [chatRoomId, userId]);
        return result.rowCount > 0;
    }

    // Get typing users in a room
    static async getTypingUsers(chatRoomId: number): Promise<TypingIndicator[]> {
        const query = `
            SELECT 
                ti.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom
                ) as user
            FROM "TypingIndicator" ti
            INNER JOIN "Utilisateur" u ON ti.user_id = u.id
            WHERE ti.chat_room_id = $1 
            AND ti.started_at > NOW() - INTERVAL '10 seconds'
            ORDER BY ti.started_at DESC
        `;
        
        const result = await pool.query(query, [chatRoomId]);
        return result.rows;
    }

    // Clean up old typing indicators (older than 10 seconds)
    static async cleanupOldTyping(): Promise<void> {
        const query = 'DELETE FROM "TypingIndicator" WHERE started_at < NOW() - INTERVAL \'10 seconds\'';
        await pool.query(query);
    }

    // Get users by socket ID
    static async getUserBySocketId(socketId: string): Promise<{ userId: number; quartierId: number } | null> {
        const query = `
            SELECT up.user_id, u.quartier_id
            FROM "UserPresence" up
            INNER JOIN "Utilisateur" u ON up.user_id = u.id
            WHERE up.socket_id = $1
        `;
        
        const result = await pool.query(query, [socketId]);
        if (result.rows.length === 0) return null;
        
        return {
            userId: result.rows[0].user_id,
            quartierId: result.rows[0].quartier_id
        };
    }

    // Update socket ID for user
    static async updateSocketId(userId: number, socketId: string): Promise<void> {
        const query = `
            UPDATE "UserPresence" 
            SET socket_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
        `;
        
        await pool.query(query, [socketId, userId]);
    }

    // Remove socket ID (on disconnect)
    static async removeSocketId(socketId: string): Promise<void> {
        const query = `
            UPDATE "UserPresence" 
            SET socket_id = NULL, status = 'offline', updated_at = CURRENT_TIMESTAMP
            WHERE socket_id = $1
        `;
        
        await pool.query(query, [socketId]);
    }
}

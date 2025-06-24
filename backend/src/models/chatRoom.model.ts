import pool from '../config/db.js';
import { ChatRoom, ChatRoomMember, CreateChatRoomRequest, ChatRoomWithDetails } from '../types/messaging.types.js';

export class ChatRoomModel {
    // Get all chat rooms for a quartier
    static async getChatRoomsByQuartier(quartierId: number): Promise<ChatRoom[]> {
        const query = `
            SELECT 
                cr.*,
                COUNT(crm.id) as member_count,
                (
                    SELECT COUNT(m.id) 
                    FROM "Message" m 
                    WHERE m.chat_room_id = cr.id 
                    AND m.created_at > COALESCE(
                        (SELECT last_read_at FROM "ChatRoomMember" WHERE chat_room_id = cr.id AND user_id = $2), 
                        '1970-01-01'
                    )
                ) as unread_count
            FROM "ChatRoom" cr
            LEFT JOIN "ChatRoomMember" crm ON cr.id = crm.chat_room_id
            WHERE cr.quartier_id = $1 AND cr.is_active = true
            GROUP BY cr.id
            ORDER BY cr.updated_at DESC
        `;
        
        const result = await pool.query(query, [quartierId, 0]); // 0 as placeholder for user_id
        return result.rows;
    }

    // Get chat rooms for a specific user
    static async getChatRoomsForUser(userId: number): Promise<ChatRoom[]> {
        const query = `
            SELECT 
                cr.*,
                COUNT(DISTINCT crm2.id) as member_count,
                (
                    SELECT COUNT(m.id) 
                    FROM "Message" m 
                    WHERE m.chat_room_id = cr.id 
                    AND m.created_at > crm.last_read_at
                    AND m.sender_id != $1
                ) as unread_count,
                (
                    SELECT json_build_object(
                        'id', m.id,
                        'content', m.content,
                        'created_at', m.created_at,
                        'sender', json_build_object(
                            'id', u.id,
                            'nom', u.nom,
                            'prenom', u.prenom
                        )
                    )
                    FROM "Message" m
                    LEFT JOIN "Utilisateur" u ON m.sender_id = u.id
                    WHERE m.chat_room_id = cr.id AND m.is_deleted = false
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as last_message
            FROM "ChatRoom" cr
            INNER JOIN "ChatRoomMember" crm ON cr.id = crm.chat_room_id
            LEFT JOIN "ChatRoomMember" crm2 ON cr.id = crm2.chat_room_id
            WHERE crm.user_id = $1 AND cr.is_active = true
            GROUP BY cr.id, crm.last_read_at
            ORDER BY cr.updated_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    // Get chat room by ID with details
    static async getChatRoomById(roomId: number, userId?: number): Promise<ChatRoomWithDetails | null> {
        const query = `
            SELECT 
                cr.*,
                COUNT(DISTINCT crm.id) as member_count,
                CASE WHEN $2 IS NOT NULL THEN
                    (SELECT role FROM "ChatRoomMember" WHERE chat_room_id = cr.id AND user_id = $2)
                END as user_role
            FROM "ChatRoom" cr
            LEFT JOIN "ChatRoomMember" crm ON cr.id = crm.chat_room_id
            WHERE cr.id = $1 AND cr.is_active = true
            GROUP BY cr.id
        `;
        
        const result = await pool.query(query, [roomId, userId]);
        if (result.rows.length === 0) return null;

        const room = result.rows[0];

        // Get members
        const membersQuery = `
            SELECT 
                crm.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom,
                    'email', u.email
                ) as user
            FROM "ChatRoomMember" crm
            INNER JOIN "Utilisateur" u ON crm.user_id = u.id
            WHERE crm.chat_room_id = $1
            ORDER BY crm.joined_at ASC
        `;
        
        const membersResult = await pool.query(membersQuery, [roomId]);

        // Get recent messages
        const messagesQuery = `
            SELECT 
                m.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom,
                    'email', u.email
                ) as sender
            FROM "Message" m
            LEFT JOIN "Utilisateur" u ON m.sender_id = u.id
            WHERE m.chat_room_id = $1 AND m.is_deleted = false
            ORDER BY m.created_at DESC
            LIMIT 50
        `;
        
        const messagesResult = await pool.query(messagesQuery, [roomId]);

        return {
            ...room,
            members: membersResult.rows,
            recent_messages: messagesResult.rows.reverse() // Reverse to get chronological order
        };
    }

    // Create a new chat room
    static async createChatRoom(data: CreateChatRoomRequest, createdBy: number, quartierId: number): Promise<ChatRoom | null> {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Create the chat room
            const roomQuery = `
                INSERT INTO "ChatRoom" (name, description, quartier_id, room_type, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            
            const roomResult = await client.query(roomQuery, [
                data.name,
                data.description,
                quartierId,
                data.room_type,
                createdBy
            ]);

            const room = roomResult.rows[0];

            // Add creator as admin
            await client.query(
                'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role) VALUES ($1, $2, $3)',
                [room.id, createdBy, 'admin']
            );

            // Add other members if specified
            if (data.member_ids && data.member_ids.length > 0) {
                for (const memberId of data.member_ids) {
                    if (memberId !== createdBy) {
                        await client.query(
                            'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role) VALUES ($1, $2, $3)',
                            [room.id, memberId, 'member']
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return room;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Add member to chat room
    static async addMember(roomId: number, userId: number, role: string = 'member'): Promise<ChatRoomMember | null> {
        const query = `
            INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (chat_room_id, user_id) DO UPDATE SET
                role = EXCLUDED.role,
                joined_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        
        const result = await pool.query(query, [roomId, userId, role]);
        return result.rows[0] || null;
    }

    // Remove member from chat room
    static async removeMember(roomId: number, userId: number): Promise<boolean> {
        const query = 'DELETE FROM "ChatRoomMember" WHERE chat_room_id = $1 AND user_id = $2';
        const result = await pool.query(query, [roomId, userId]);
        return result.rowCount > 0;
    }

    // Check if user is member of chat room
    static async isMember(roomId: number, userId: number): Promise<boolean> {
        const query = 'SELECT 1 FROM "ChatRoomMember" WHERE chat_room_id = $1 AND user_id = $2';
        const result = await pool.query(query, [roomId, userId]);
        return result.rows.length > 0;
    }

    // Update last read timestamp
    static async updateLastRead(roomId: number, userId: number): Promise<void> {
        const query = `
            UPDATE "ChatRoomMember" 
            SET last_read_at = CURRENT_TIMESTAMP 
            WHERE chat_room_id = $1 AND user_id = $2
        `;
        await pool.query(query, [roomId, userId]);
    }

    // Get members of a chat room
    static async getMembers(roomId: number): Promise<ChatRoomMember[]> {
        const query = `
            SELECT 
                crm.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom,
                    'email', u.email
                ) as user
            FROM "ChatRoomMember" crm
            INNER JOIN "Utilisateur" u ON crm.user_id = u.id
            WHERE crm.chat_room_id = $1
            ORDER BY crm.joined_at ASC
        `;
        
        const result = await pool.query(query, [roomId]);
        return result.rows;
    }

    // Delete chat room (soft delete)
    static async deleteChatRoom(roomId: number): Promise<boolean> {
        const query = 'UPDATE "ChatRoom" SET is_active = false WHERE id = $1';
        const result = await pool.query(query, [roomId]);
        return result.rowCount > 0;
    }
}

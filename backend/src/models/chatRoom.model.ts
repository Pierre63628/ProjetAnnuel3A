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

            // Add creator as admin with initialized last_read_at
            await client.query(
                'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role, last_read_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [room.id, createdBy, 'admin']
            );

            // Add other members if specified
            if (data.member_ids && data.member_ids.length > 0) {
                for (const memberId of data.member_ids) {
                    if (memberId !== createdBy) {
                        await client.query(
                            'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role, last_read_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
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
            INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role, last_read_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (chat_room_id, user_id) DO UPDATE SET
                role = EXCLUDED.role,
                joined_at = CURRENT_TIMESTAMP,
                last_read_at = COALESCE(EXCLUDED.last_read_at, CURRENT_TIMESTAMP)
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

    // Find existing direct message room between two users
    static async findDirectMessageRoom(userId1: number, userId2: number): Promise<ChatRoom | null> {
        // Normalize user IDs to ensure consistent ordering
        const [minUserId, maxUserId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
        const normalizedId = `${minUserId}:${maxUserId}`;

        // First try to find using the normalized identifier (faster)
        let query = `
            SELECT cr.*
            FROM "ChatRoom" cr
            WHERE cr.room_type = 'direct'
            AND cr.is_active = true
            AND cr.direct_room_identifier = $1
            LIMIT 1
        `;

        let result = await pool.query(query, [normalizedId]);

        // If not found with identifier, fall back to the member-based search
        // (for rooms created before the identifier was implemented)
        if (result.rows.length === 0) {
            query = `
                SELECT cr.*
                FROM "ChatRoom" cr
                WHERE cr.room_type = 'direct'
                AND cr.is_active = true
                AND EXISTS (
                    SELECT 1 FROM "ChatRoomMember" crm1
                    WHERE crm1.chat_room_id = cr.id AND crm1.user_id = $1
                )
                AND EXISTS (
                    SELECT 1 FROM "ChatRoomMember" crm2
                    WHERE crm2.chat_room_id = cr.id AND crm2.user_id = $2
                )
                AND (
                    SELECT COUNT(*) FROM "ChatRoomMember" crm
                    WHERE crm.chat_room_id = cr.id
                ) = 2
                ORDER BY cr.id ASC
                LIMIT 1
            `;

            result = await pool.query(query, [minUserId, maxUserId]);

            // If found, update it with the normalized identifier for future lookups
            if (result.rows.length > 0) {
                await pool.query(
                    'UPDATE "ChatRoom" SET direct_room_identifier = $1 WHERE id = $2',
                    [normalizedId, result.rows[0].id]
                );
            }
        }

        return result.rows[0] || null;
    }

    // Create a direct message room between two users with atomic operation
    static async createDirectMessageRoom(
        userId1: number,
        userId2: number,
        quartierId: number,
        user1Name: string,
        user2Name: string
    ): Promise<ChatRoom | null> {
        // Normalize user IDs to ensure consistent ordering
        const [minUserId, maxUserId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
        const [minUserName, maxUserName] = userId1 < userId2 ? [user1Name, user2Name] : [user2Name, user1Name];

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Double-check if room already exists (race condition protection)
            const existingRoom = await this.findDirectMessageRoom(minUserId, maxUserId);
            if (existingRoom) {
                await client.query('ROLLBACK');
                return existingRoom;
            }

            // Create normalized room name (always in alphabetical order by user ID)
            const roomName = `${minUserName} & ${maxUserName}`;
            const description = `Conversation privée entre ${minUserName} et ${maxUserName}`;

            // Create the chat room
            const roomQuery = `
                INSERT INTO "ChatRoom" (name, description, quartier_id, room_type, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const roomResult = await client.query(roomQuery, [
                roomName,
                description,
                quartierId,
                'direct',
                minUserId
            ]);

            const room = roomResult.rows[0];

            // Add both users as members
            await client.query(
                'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role, last_read_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [room.id, minUserId, 'admin']
            );

            await client.query(
                'INSERT INTO "ChatRoomMember" (chat_room_id, user_id, role, last_read_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [room.id, maxUserId, 'member']
            );

            // Set the normalized room identifier for duplicate prevention
            const normalizedId = `${minUserId}:${maxUserId}`;
            await client.query(
                'UPDATE "ChatRoom" SET direct_room_identifier = $1 WHERE id = $2',
                [normalizedId, room.id]
            );

            await client.query('COMMIT');
            return room;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

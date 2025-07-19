import pool from '../config/db.js';
import { Message, SendMessageRequest, GetMessagesQuery, MessageReaction } from '../types/messaging.types.js';

export class MessageModel {
    // Get messages for a chat room with pagination
    static async getMessages(chatRoomId: number, query: GetMessagesQuery = {}): Promise<Message[]> {
        const { page = 1, limit = 50, before, after } = query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE m.chat_room_id = $1 AND m.is_deleted = false';
        const params: any[] = [chatRoomId];
        let paramIndex = 2;

        if (before) {
            whereClause += ` AND m.created_at < $${paramIndex}`;
            params.push(before);
            paramIndex++;
        }

        if (after) {
            whereClause += ` AND m.created_at > $${paramIndex}`;
            params.push(after);
            paramIndex++;
        }

        const messagesQuery = `
            SELECT 
                m.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom,
                    'email', u.email
                ) as sender,
                CASE WHEN m.reply_to_id IS NOT NULL THEN
                    json_build_object(
                        'id', rm.id,
                        'content', rm.content,
                        'sender', json_build_object(
                            'id', ru.id,
                            'nom', ru.nom,
                            'prenom', ru.prenom
                        )
                    )
                END as reply_to,
                COALESCE(
                    json_agg(
                        CASE WHEN mr.id IS NOT NULL THEN
                            json_build_object(
                                'id', mr.id,
                                'reaction', mr.reaction,
                                'user', json_build_object(
                                    'id', mru.id,
                                    'nom', mru.nom,
                                    'prenom', mru.prenom
                                )
                            )
                        END
                    ) FILTER (WHERE mr.id IS NOT NULL),
                    '[]'
                ) as reactions
            FROM "Message" m
            LEFT JOIN "Utilisateur" u ON m.sender_id = u.id
            LEFT JOIN "Message" rm ON m.reply_to_id = rm.id
            LEFT JOIN "Utilisateur" ru ON rm.sender_id = ru.id
            LEFT JOIN "MessageReaction" mr ON m.id = mr.message_id
            LEFT JOIN "Utilisateur" mru ON mr.user_id = mru.id
            ${whereClause}
            GROUP BY m.id, u.id, rm.id, ru.id
            ORDER BY m.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const result = await pool.query(messagesQuery, params);
        return result.rows.reverse(); // Return in chronological order
    }

    // Send a new message
    static async sendMessage(
        chatRoomId: number, 
        senderId: number, 
        data: SendMessageRequest
    ): Promise<Message | null> {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert the message
            const messageQuery = `
                INSERT INTO "Message" (chat_room_id, sender_id, content, message_type, reply_to_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            
            const messageResult = await client.query(messageQuery, [
                chatRoomId,
                senderId,
                data.content,
                data.message_type || 'text',
                data.reply_to_id || null
            ]);

            const message = messageResult.rows[0];

            // Update chat room's updated_at timestamp
            await client.query(
                'UPDATE "ChatRoom" SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [chatRoomId]
            );

            // Create delivery records for all room members except sender
            const membersQuery = `
                INSERT INTO "MessageDelivery" (message_id, user_id, status)
                SELECT $1, user_id, 'sent'
                FROM "ChatRoomMember"
                WHERE chat_room_id = $2 AND user_id != $3
            `;
            
            await client.query(membersQuery, [message.id, chatRoomId, senderId]);

            await client.query('COMMIT');

            // Get the complete message with sender info
            return await this.getMessageById(message.id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Get a message by ID
    static async getMessageById(messageId: number): Promise<Message | null> {
        const query = `
            SELECT 
                m.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom,
                    'email', u.email
                ) as sender,
                CASE WHEN m.reply_to_id IS NOT NULL THEN
                    json_build_object(
                        'id', rm.id,
                        'content', rm.content,
                        'sender', json_build_object(
                            'id', ru.id,
                            'nom', ru.nom,
                            'prenom', ru.prenom
                        )
                    )
                END as reply_to,
                COALESCE(
                    json_agg(
                        CASE WHEN mr.id IS NOT NULL THEN
                            json_build_object(
                                'id', mr.id,
                                'reaction', mr.reaction,
                                'user', json_build_object(
                                    'id', mru.id,
                                    'nom', mru.nom,
                                    'prenom', mru.prenom
                                )
                            )
                        END
                    ) FILTER (WHERE mr.id IS NOT NULL),
                    '[]'
                ) as reactions
            FROM "Message" m
            LEFT JOIN "Utilisateur" u ON m.sender_id = u.id
            LEFT JOIN "Message" rm ON m.reply_to_id = rm.id
            LEFT JOIN "Utilisateur" ru ON rm.sender_id = ru.id
            LEFT JOIN "MessageReaction" mr ON m.id = mr.message_id
            LEFT JOIN "Utilisateur" mru ON mr.user_id = mru.id
            WHERE m.id = $1 AND m.is_deleted = false
            GROUP BY m.id, u.id, rm.id, ru.id
        `;
        
        const result = await pool.query(query, [messageId]);
        return result.rows[0] || null;
    }

    // Edit a message
    static async editMessage(messageId: number, senderId: number, content: string): Promise<Message | null> {
        const query = `
            UPDATE "Message" 
            SET content = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND sender_id = $3 AND is_deleted = false
            RETURNING *
        `;
        
        const result = await pool.query(query, [content, messageId, senderId]);
        if (result.rows.length === 0) return null;

        return await this.getMessageById(messageId);
    }

    // Delete a message (soft delete)
    static async deleteMessage(messageId: number, userId: number): Promise<boolean> {
        const query = `
            UPDATE "Message" 
            SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND (sender_id = $2 OR EXISTS (
                SELECT 1 FROM "ChatRoomMember" crm
                INNER JOIN "ChatRoom" cr ON crm.chat_room_id = cr.id
                INNER JOIN "Message" m ON m.chat_room_id = cr.id
                WHERE m.id = $1 AND crm.user_id = $2 AND crm.role IN ('admin', 'moderator')
            ))
        `;
        
        const result = await pool.query(query, [messageId, userId]);
        return result.rowCount > 0;
    }

    // Add reaction to message
    static async addReaction(messageId: number, userId: number, reaction: string): Promise<MessageReaction | null> {
        const query = `
            INSERT INTO "MessageReaction" (message_id, user_id, reaction)
            VALUES ($1, $2, $3)
            ON CONFLICT (message_id, user_id, reaction) DO NOTHING
            RETURNING *
        `;
        
        const result = await pool.query(query, [messageId, userId, reaction]);
        if (result.rows.length === 0) return null;

        // Get reaction with user info
        const reactionQuery = `
            SELECT 
                mr.*,
                json_build_object(
                    'id', u.id,
                    'nom', u.nom,
                    'prenom', u.prenom
                ) as user
            FROM "MessageReaction" mr
            INNER JOIN "Utilisateur" u ON mr.user_id = u.id
            WHERE mr.id = $1
        `;
        
        const reactionResult = await pool.query(reactionQuery, [result.rows[0].id]);
        return reactionResult.rows[0];
    }

    // Remove reaction from message
    static async removeReaction(messageId: number, userId: number, reaction: string): Promise<boolean> {
        const query = `
            DELETE FROM "MessageReaction" 
            WHERE message_id = $1 AND user_id = $2 AND reaction = $3
        `;
        
        const result = await pool.query(query, [messageId, userId, reaction]);
        return result.rowCount > 0;
    }

    // Mark messages as read
    static async markMessagesAsRead(messageIds: number[], userId: number): Promise<void> {
        if (messageIds.length === 0) return;

        const query = `
            UPDATE "MessageDelivery" 
            SET status = 'read', timestamp = CURRENT_TIMESTAMP
            WHERE message_id = ANY($1) AND user_id = $2 AND status != 'read'
        `;
        
        await pool.query(query, [messageIds, userId]);
    }

    // Get unread message count for user in a room
    static async getUnreadCount(chatRoomId: number, userId: number): Promise<number> {
        const query = `
            SELECT COUNT(m.id) as count
            FROM "Message" m
            INNER JOIN "ChatRoomMember" crm ON m.chat_room_id = crm.chat_room_id
            WHERE m.chat_room_id = $1 
            AND crm.user_id = $2
            AND m.created_at > crm.last_read_at
            AND m.sender_id != $2
            AND m.is_deleted = false
        `;
        
        const result = await pool.query(query, [chatRoomId, userId]);
        return parseInt(result.rows[0].count) || 0;
    }
}

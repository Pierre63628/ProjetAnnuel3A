import { Request, Response } from 'express';
import { ChatRoomModel } from '../models/chatRoom.model.js';
import { MessageModel } from '../models/message.model.js';
import { UserPresenceModel } from '../models/userPresence.model.js';
import { CreateChatRoomRequest, GetMessagesQuery } from '../types/messaging.types.js';
import pool from '../config/db.js';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        quartier_id: number;
        nom: string;
        prenom: string;
        email: string;
    };
}

export class MessagingController {
    // Get chat rooms for the authenticated user
    static async getChatRooms(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const rooms = await ChatRoomModel.getChatRoomsForUser(userId);
            
            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error('Error getting chat rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat rooms'
            });
        }
    }

    // Get available chat rooms in user's quartier
    static async getAvailableRooms(req: AuthenticatedRequest, res: Response) {
        try {
            const quartierId = req.user!.quartier_id!;
            const rooms = await ChatRoomModel.getChatRoomsByQuartier(quartierId);
            
            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error('Error getting available rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get available rooms'
            });
        }
    }

    // Get chat room details
    static async getChatRoom(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId)
            const userId = req.user!.id!
            console.log("USerId", userId)
            // Check if user is member of the room
            const isMember = await ChatRoomModel.isMember(roomId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this room'
                });
            }

            const room = await ChatRoomModel.getChatRoomById(roomId, userId);
            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room not found'
                });
            }

            res.json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error('Error getting chat room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat room'
            });
        }
    }

    // Create a new chat room
    static async createChatRoom(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const quartierId = req.user!.quartier_id!;
            const data: CreateChatRoomRequest = req.body;

            // Validate input
            if (!data.name || data.name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Room name is required'
                });
            }

            const room = await ChatRoomModel.createChatRoom(data, userId, quartierId);

            res.status(201).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error('Error creating chat room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create chat room'
            });
        }
    }

    // Join a chat room
    static async joinChatRoom(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;
            const quartierId = req.user!.quartier_id!;

            // Check if room exists and is in user's quartier
            const room = await ChatRoomModel.getChatRoomById(roomId);
            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat room not found'
                });
            }

            if (room.quartier_id !== quartierId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to join this room'
                });
            }

            const member = await ChatRoomModel.addMember(roomId, userId);
            
            res.json({
                success: true,
                data: member
            });
        } catch (error) {
            console.error('Error joining chat room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to join chat room'
            });
        }
    }

    // Leave a chat room
    static async leaveChatRoom(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;

            const success = await ChatRoomModel.removeMember(roomId, userId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Not a member of this room'
                });
            }

            res.json({
                success: true,
                message: 'Left chat room successfully'
            });
        } catch (error) {
            console.error('Error leaving chat room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to leave chat room'
            });
        }
    }

    // Get messages for a chat room
    static async getMessages(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;
            
            // Check if user is member of the room
            const isMember = await ChatRoomModel.isMember(roomId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access messages in this room'
                });
            }

            const query: GetMessagesQuery = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 50,
                before: req.query.before as string,
                after: req.query.after as string
            };

            const messages = await MessageModel.getMessages(roomId, query);
            
            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error('Error getting messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages'
            });
        }
    }

    // Get room members
    static async getRoomMembers(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;
            
            // Check if user is member of the room
            const isMember = await ChatRoomModel.isMember(roomId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this room'
                });
            }

            const members = await ChatRoomModel.getMembers(roomId);
            
            res.json({
                success: true,
                data: members
            });
        } catch (error) {
            console.error('Error getting room members:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get room members'
            });
        }
    }

    // Get online users in quartier
    static async getOnlineUsers(req: AuthenticatedRequest, res: Response) {
        try {
            const quartierId = req.user!.quartier_id!;
            const onlineUsers = await UserPresenceModel.getOnlineUsersInQuartier(quartierId);

            res.json({
                success: true,
                data: onlineUsers
            });
        } catch (error) {
            console.error('Error getting online users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get online users'
            });
        }
    }

    // Get all users in the same neighborhood (quartier) for offline messaging
    static async getNeighborhoodUsers(req: AuthenticatedRequest, res: Response) {
        try {
            const quartierId = req.user!.quartier_id!;
            const currentUserId = req.user!.id!;

            // Get all users in the same neighborhood with their presence status
            const neighborhoodUsers = await UserPresenceModel.getAllUsersInQuartier(quartierId, currentUserId);

            res.json({
                success: true,
                data: neighborhoodUsers
            });
        } catch (error) {
            console.error('Error getting neighborhood users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get neighborhood users'
            });
        }
    }

    // Get unread message count
    static async getUnreadCount(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;
            
            // Check if user is member of the room
            const isMember = await ChatRoomModel.isMember(roomId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this room'
                });
            }

            const count = await MessageModel.getUnreadCount(roomId, userId);
            
            res.json({
                success: true,
                data: { unread_count: count }
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count'
            });
        }
    }

    // Update last read timestamp
    static async markAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const roomId = parseInt(req.params.roomId);
            const userId = req.user!.id!;
            
            // Check if user is member of the room
            const isMember = await ChatRoomModel.isMember(roomId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this room'
                });
            }

            await ChatRoomModel.updateLastRead(roomId, userId);
            
            res.json({
                success: true,
                message: 'Marked as read'
            });
        } catch (error) {
            console.error('Error marking as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark as read'
            });
        }
    }

    // Create or get direct message room between two users
    static async createOrGetDirectMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const targetUserId = parseInt(req.body.target_user_id);
            const quartierId = req.user!.quartier_id!;

            if (!targetUserId || targetUserId === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid target user ID is required'
                });
            }

            // Check if direct message room already exists
            const existingRoom = await ChatRoomModel.findDirectMessageRoom(userId, targetUserId);

            if (existingRoom) {
                return res.json({
                    success: true,
                    data: existingRoom
                });
            }

            // Get target user info for room name
            const targetUserQuery = 'SELECT nom, prenom FROM "Utilisateur" WHERE id = $1 AND quartier_id = $2';
            const targetUserResult = await pool.query(targetUserQuery, [targetUserId, quartierId]);

            if (targetUserResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found in your quartier'
                });
            }

            const targetUser = targetUserResult.rows[0];
            const currentUser = req.user!;

            // Create new direct message room using the atomic method
            const room = await ChatRoomModel.createDirectMessageRoom(
                userId,
                targetUserId,
                quartierId,
                currentUser.prenom,
                targetUser.prenom
            );

            res.status(201).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error('Error creating direct message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create direct message'
            });
        }
    }

    // Create or get direct message room for offline messaging (same as above but more explicit)
    static async createOfflineDirectMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const targetUserId = parseInt(req.body.target_user_id);
            const quartierId = req.user!.quartier_id!;

            if (!targetUserId || targetUserId === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid target user ID is required'
                });
            }

            // Check if target user exists and is in the same neighborhood
            const targetUserQuery = 'SELECT nom, prenom FROM "Utilisateur" WHERE id = $1 AND quartier_id = $2';
            const targetUserResult = await pool.query(targetUserQuery, [targetUserId, quartierId]);

            if (targetUserResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found in your neighborhood'
                });
            }

            // Check if direct message room already exists
            const existingRoom = await ChatRoomModel.findDirectMessageRoom(userId, targetUserId);

            if (existingRoom) {
                return res.json({
                    success: true,
                    data: existingRoom,
                    message: 'Existing conversation found'
                });
            }

            const targetUser = targetUserResult.rows[0];
            const currentUser = req.user!;

            // Create new direct message room using the atomic method
            const room = await ChatRoomModel.createDirectMessageRoom(
                userId,
                targetUserId,
                quartierId,
                currentUser.prenom,
                targetUser.prenom
            );

            res.status(201).json({
                success: true,
                data: room,
                message: 'Direct message conversation created for offline user'
            });
        } catch (error) {
            console.error('Error creating offline direct message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create offline direct message'
            });
        }
    }

    // Get undelivered messages for the current user
    static async getUndeliveredMessages(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const undeliveredMessages = await MessageModel.getUndeliveredMessages(userId);

            // Mark messages as delivered now that they've been retrieved
            if (undeliveredMessages.length > 0) {
                const messageIds = undeliveredMessages.map(msg => msg.id);
                await MessageModel.markMessagesAsDelivered(userId, messageIds);
            }

            res.json({
                success: true,
                data: undeliveredMessages,
                count: undeliveredMessages.length
            });
        } catch (error) {
            console.error('Error getting undelivered messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get undelivered messages'
            });
        }
    }

    // Get undelivered message count for the current user
    static async getUndeliveredMessageCount(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id!;
            const count = await MessageModel.getUndeliveredMessageCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Error getting undelivered message count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get undelivered message count'
            });
        }
    }

    // Mark a specific message as read
    static async markMessageAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const messageId = parseInt(req.params.messageId);
            const userId = req.user!.id!;

            await MessageModel.markMessageAsRead(messageId, userId);

            res.json({
                success: true,
                message: 'Message marked as read'
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark message as read'
            });
        }
    }
}

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
} from '../types/messaging.types.js';
import { ChatRoomModel } from '../models/chatRoom.model.js';
import { MessageModel } from '../models/message.model.js';
import { UserPresenceModel } from '../models/userPresence.model.js';

export class WebSocketService {
    private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        this.startCleanupTasks();
    }

    private setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                // Extract token
                const authHeader = socket.handshake.headers.authorization;
                const token = socket.handshake.auth.token || authHeader?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT
                let decoded: any;
                try {
                    decoded = jwt.verify(token, jwtConfig.accessToken.secret);
                } catch (verifyError: any) {
                    console.error('❌ Invalid JWT:', verifyError.message);
                    return next(new Error('Invalid authentication token'));
                }

                // Fetch user
                const pool = (await import('../config/db.js')).default;
                const result = await pool.query(
                    `SELECT id, nom, prenom, email, quartier_id
                 FROM "Utilisateur"
                 WHERE id = $1`,
                    [decoded.userId]
                );

                if (result.rows.length === 0) {
                    return next(new Error('User not found'));
                }

                const user = result.rows[0];
                socket.data = {
                    userId: user.id,
                    quartier_id: user.quartier_id,
                    user,
                };

                next(); // ✅ Auth OK
            } catch (error: any) {
                console.error('❌ Auth middleware failed:', error.message);
                next(new Error('Authentication failed'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', async (socket) => {
            const { userId, quartier_id, user } = socket.data;
            
            console.log(`User ${user.prenom} ${user.nom} connected (ID: ${userId})`);

            // Update user presence
            await UserPresenceModel.updatePresence(userId, 'online', socket.id);

            // Join user to their quartier room for presence updates
            socket.join(`quartier_${quartier_id}`);

            // Broadcast user online status to quartier
            socket.to(`quartier_${quartier_id}`).emit('user_presence_updated', {
                id: 0,
                user_id: userId,
                status: 'online',
                last_seen: new Date(),
                socket_id: socket.id,
                updated_at: new Date(),
                user: { nom: user.nom, prenom: user.prenom }
            });

            // Join user's chat rooms
            const userRooms = await ChatRoomModel.getChatRoomsForUser(userId);
            for (const room of userRooms) {
                socket.join(`room_${room.id}`);
            }

            // Handle joining a specific room
            socket.on('join_room', async (chatRoomId) => {
                try {
                    const isMember = await ChatRoomModel.isMember(chatRoomId, userId);
                    if (!isMember) {
                        socket.emit('error', { message: 'Not authorized to join this room' });
                        return;
                    }

                    socket.join(`room_${chatRoomId}`);
                    
                    // Notify other room members
                    const member = await ChatRoomModel.getMembers(chatRoomId);
                    const userMember = member.find(m => m.user_id === userId);
                    
                    if (userMember) {
                        socket.to(`room_${chatRoomId}`).emit('user_joined_room', userMember);
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to join room' });
                }
            });

            // Handle leaving a room
            socket.on('leave_room', (chatRoomId) => {
                socket.leave(`room_${chatRoomId}`);
                socket.to(`room_${chatRoomId}`).emit('user_left_room', userId, chatRoomId);
            });

            // Handle sending messages
            socket.on('send_message', async (data) => {
                try {
                    const { chatRoomId, content, messageType, replyToId } = data;
                    
                    // Verify user is member of the room
                    const isMember = await ChatRoomModel.isMember(chatRoomId, userId);
                    if (!isMember) {
                        socket.emit('error', { message: 'Not authorized to send messages to this room' });
                        return;
                    }

                    // Send the message
                    const message = await MessageModel.sendMessage(chatRoomId, userId, {
                        content,
                        message_type: messageType,
                        reply_to_id: replyToId
                    });

                    if (message) {
                        // Broadcast to all room members
                        this.io.to(`room_${chatRoomId}`).emit('message_received', message);
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle message editing
            socket.on('edit_message', async (data) => {
                try {
                    const { messageId, content } = data;
                    const message = await MessageModel.editMessage(messageId, userId, content);
                    
                    if (message) {
                        this.io.to(`room_${message.chat_room_id}`).emit('message_updated', message);
                    } else {
                        socket.emit('error', { message: 'Failed to edit message' });
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to edit message' });
                }
            });

            // Handle message deletion
            socket.on('delete_message', async (messageId) => {
                try {
                    const message = await MessageModel.getMessageById(messageId);
                    if (!message) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    const deleted = await MessageModel.deleteMessage(messageId, userId);
                    if (deleted) {
                        this.io.to(`room_${message.chat_room_id}`).emit('message_deleted', messageId, message.chat_room_id);
                    } else {
                        socket.emit('error', { message: 'Not authorized to delete this message' });
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to delete message' });
                }
            });

            // Handle typing indicators
            socket.on('start_typing', async (chatRoomId) => {
                try {
                    const isMember = await ChatRoomModel.isMember(chatRoomId, userId);
                    if (!isMember) return;

                    await UserPresenceModel.startTyping(chatRoomId, userId);
                    socket.to(`room_${chatRoomId}`).emit('typing_start', {
                        userId,
                        chatRoomId,
                        user: { nom: user.nom, prenom: user.prenom }
                    });
                } catch (error) {
                    // Silently fail for typing indicators
                }
            });

            socket.on('stop_typing', async (chatRoomId) => {
                try {
                    await UserPresenceModel.stopTyping(chatRoomId, userId);
                    socket.to(`room_${chatRoomId}`).emit('typing_stop', { userId, chatRoomId });
                } catch (error) {
                    // Silently fail for typing indicators
                }
            });

            // Handle marking messages as read
            socket.on('mark_messages_read', async (data) => {
                try {
                    const { chatRoomId, messageIds } = data;
                    await MessageModel.markMessagesAsRead(messageIds, userId);
                    await ChatRoomModel.updateLastRead(chatRoomId, userId);
                } catch (error) {
                    // Silently fail for read receipts
                }
            });

            // Handle reactions
            socket.on('add_reaction', async (data) => {
                try {
                    const { messageId, reaction } = data;
                    const reactionObj = await MessageModel.addReaction(messageId, userId, reaction);
                    
                    if (reactionObj) {
                        const message = await MessageModel.getMessageById(messageId);
                        if (message) {
                            this.io.to(`room_${message.chat_room_id}`).emit('message_reaction_added', reactionObj);
                        }
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to add reaction' });
                }
            });

            socket.on('remove_reaction', async (data) => {
                try {
                    const { messageId, reaction } = data;
                    const removed = await MessageModel.removeReaction(messageId, userId, reaction);
                    
                    if (removed) {
                        const message = await MessageModel.getMessageById(messageId);
                        if (message) {
                            this.io.to(`room_${message.chat_room_id}`).emit('message_reaction_removed', {
                                messageId,
                                userId,
                                reaction
                            });
                        }
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to remove reaction' });
                }
            });

            // Handle presence updates
            socket.on('update_presence', async (status) => {
                try {
                    await UserPresenceModel.updatePresence(userId, status, socket.id);
                    
                    // Broadcast to quartier
                    socket.to(`quartier_${quartier_id}`).emit('user_presence_updated', {
                        id: 0,
                        user_id: userId,
                        status,
                        last_seen: new Date(),
                        socket_id: socket.id,
                        updated_at: new Date(),
                        user: { nom: user.nom, prenom: user.prenom }
                    });
                } catch (error) {
                    // Silently fail for presence updates
                }
            });

            // Handle disconnect
            socket.on('disconnect', async () => {
                console.log(`User ${user.prenom} ${user.nom} disconnected`);
                
                // Update presence to offline
                await UserPresenceModel.setOffline(userId);
                
                // Clean up typing indicators
                await UserPresenceModel.stopTyping(0, userId); // This will clean all typing for user
                
                // Broadcast offline status
                socket.to(`quartier_${quartier_id}`).emit('user_presence_updated', {
                    id: 0,
                    user_id: userId,
                    status: 'offline',
                    last_seen: new Date(),
                    updated_at: new Date(),
                    user: { nom: user.nom, prenom: user.prenom }
                });
            });
        });
    }

    private startCleanupTasks() {
        // Clean up old presence and typing indicators every minute
        setInterval(async () => {
            try {
                await UserPresenceModel.cleanupOldPresence();
                await UserPresenceModel.cleanupOldTyping();
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        }, 60000); // 1 minute
    }

    public getIO() {
        return this.io;
    }
}

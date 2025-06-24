import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

import { 
    ServerToClientEvents, 
    ClientToServerEvents, 
    Message, 
    UserPresence, 
    TypingIndicator,
    MessageReaction 
} from '../types/messaging.types';

class WebSocketService {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    // Event listeners
    private messageListeners: ((message: Message) => void)[] = [];
    private messageUpdateListeners: ((message: Message) => void)[] = [];
    private messageDeleteListeners: ((messageId: number, chatRoomId: number) => void)[] = [];
    private typingListeners: ((data: TypingIndicator) => void)[] = [];
    private typingStopListeners: ((data: { userId: number; chatRoomId: number }) => void)[] = [];
    private presenceListeners: ((presence: UserPresence) => void)[] = [];
    private reactionListeners: ((reaction: MessageReaction) => void)[] = [];
    private errorListeners: ((error: { message: string; code?: string }) => void)[] = [];

    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.token = token;
            
            this.socket = io('http://localhost:3000', {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.reconnectAttempts = 0;
                this.setupEventListeners();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.handleReconnect();
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from WebSocket server:', reason);
                if (reason === 'io server disconnect') {
                    // Server disconnected, try to reconnect
                    this.handleReconnect();
                }
            });
        });
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('message_received', (message) => {
            this.messageListeners.forEach(listener => listener(message));
        });

        this.socket.on('message_updated', (message) => {
            this.messageUpdateListeners.forEach(listener => listener(message));
        });

        this.socket.on('message_deleted', (messageId, chatRoomId) => {
            this.messageDeleteListeners.forEach(listener => listener(messageId, chatRoomId));
        });

        this.socket.on('typing_start', (data) => {
            this.typingListeners.forEach(listener => listener(data));
        });

        this.socket.on('typing_stop', (data) => {
            this.typingStopListeners.forEach(listener => listener(data));
        });

        this.socket.on('user_presence_updated', (presence) => {
            this.presenceListeners.forEach(listener => listener(presence));
        });

        this.socket.on('message_reaction_added', (reaction) => {
            this.reactionListeners.forEach(listener => listener(reaction));
        });

        this.socket.on('error', (error) => {
            this.errorListeners.forEach(listener => listener(error));
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            if (this.token) {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect(this.token).catch(() => {
                    // Reconnection failed, will try again
                });
            }
        }, delay);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.token = null;
        this.reconnectAttempts = 0;
    }

    // Room management
    joinRoom(chatRoomId: number) {
        this.socket?.emit('join_room', chatRoomId);
    }

    leaveRoom(chatRoomId: number) {
        this.socket?.emit('leave_room', chatRoomId);
    }

    // Message operations
    sendMessage(chatRoomId: number, content: string, messageType?: string, replyToId?: number) {
        this.socket?.emit('send_message', { chatRoomId, content, messageType, replyToId });
    }

    editMessage(messageId: number, content: string) {
        this.socket?.emit('edit_message', { messageId, content });
    }

    deleteMessage(messageId: number) {
        this.socket?.emit('delete_message', messageId);
    }

    // Typing indicators
    startTyping(chatRoomId: number) {
        this.socket?.emit('start_typing', chatRoomId);
    }

    stopTyping(chatRoomId: number) {
        this.socket?.emit('stop_typing', chatRoomId);
    }

    // Message status
    markMessagesRead(chatRoomId: number, messageIds: number[]) {
        this.socket?.emit('mark_messages_read', { chatRoomId, messageIds });
    }

    // Reactions
    addReaction(messageId: number, reaction: string) {
        this.socket?.emit('add_reaction', { messageId, reaction });
    }

    removeReaction(messageId: number, reaction: string) {
        this.socket?.emit('remove_reaction', { messageId, reaction });
    }

    // Presence
    updatePresence(status: 'online' | 'away' | 'busy' | 'offline') {
        this.socket?.emit('update_presence', status);
    }

    // Event listeners management
    onMessage(listener: (message: Message) => void) {
        this.messageListeners.push(listener);
        return () => {
            const index = this.messageListeners.indexOf(listener);
            if (index > -1) {
                this.messageListeners.splice(index, 1);
            }
        };
    }

    onMessageUpdate(listener: (message: Message) => void) {
        this.messageUpdateListeners.push(listener);
        return () => {
            const index = this.messageUpdateListeners.indexOf(listener);
            if (index > -1) {
                this.messageUpdateListeners.splice(index, 1);
            }
        };
    }

    onMessageDelete(listener: (messageId: number, chatRoomId: number) => void) {
        this.messageDeleteListeners.push(listener);
        return () => {
            const index = this.messageDeleteListeners.indexOf(listener);
            if (index > -1) {
                this.messageDeleteListeners.splice(index, 1);
            }
        };
    }

    onTyping(listener: (data: TypingIndicator) => void) {
        this.typingListeners.push(listener);
        return () => {
            const index = this.typingListeners.indexOf(listener);
            if (index > -1) {
                this.typingListeners.splice(index, 1);
            }
        };
    }

    onTypingStop(listener: (data: { userId: number; chatRoomId: number }) => void) {
        this.typingStopListeners.push(listener);
        return () => {
            const index = this.typingStopListeners.indexOf(listener);
            if (index > -1) {
                this.typingStopListeners.splice(index, 1);
            }
        };
    }

    onPresenceUpdate(listener: (presence: UserPresence) => void) {
        this.presenceListeners.push(listener);
        return () => {
            const index = this.presenceListeners.indexOf(listener);
            if (index > -1) {
                this.presenceListeners.splice(index, 1);
            }
        };
    }

    onReaction(listener: (reaction: MessageReaction) => void) {
        this.reactionListeners.push(listener);
        return () => {
            const index = this.reactionListeners.indexOf(listener);
            if (index > -1) {
                this.reactionListeners.splice(index, 1);
            }
        };
    }

    onError(listener: (error: { message: string; code?: string }) => void) {
        this.errorListeners.push(listener);
        return () => {
            const index = this.errorListeners.indexOf(listener);
            if (index > -1) {
                this.errorListeners.splice(index, 1);
            }
        };
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const webSocketService = new WebSocketService();
export default webSocketService;

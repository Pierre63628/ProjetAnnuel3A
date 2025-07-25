import io  from "socket.io-client";

import type {
    Message,
    UserPresence,
    TypingIndicator,
    MessageReaction
} from '../types/messaging.types';


class WebSocketService {
    private socket: ReturnType<typeof io> | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private tokenRefreshCallback: (() => Promise<string | null>) | null = null;

    // Event listeners
    private messageListeners: ((message: Message) => void)[] = [];
    private messageUpdateListeners: ((message: Message) => void)[] = [];
    private messageDeleteListeners: ((messageId: number, chatRoomId: number) => void)[] = [];
    private messagesLoadedListeners: ((data: { chatRoomId: number; messages: Message[]; page?: number }) => void)[] = [];
    private typingListeners: ((data: TypingIndicator) => void)[] = [];
    private typingStopListeners: ((data: { userId: number; chatRoomId: number }) => void)[] = [];
    private presenceListeners: ((presence: UserPresence) => void)[] = [];
    private reactionListeners: ((reaction: MessageReaction) => void)[] = [];
    private undeliveredMessagesListeners: ((data: { count: number; messages: Message[] }) => void)[] = [];
    private errorListeners: ((error: { message: string; code?: string }) => void)[] = [];

    connect(token: string, tokenRefreshCallback?: () => Promise<string | null>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.token = token;
            this.tokenRefreshCallback = tokenRefreshCallback || null;

            this.socket = io('https://doorbudy.cloud', {
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

            this.socket.on('connect_error', (error: any) => {
                console.error('WebSocket connection error:', error);
                // Check if it's an authentication error
                if (error.message && error.message.includes('authentication')) {
                    this.handleAuthenticationError();
                } else {
                    this.handleReconnect();
                }
                reject(error);
            });

            this.socket.on('disconnect', (reason: string) => {
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

        this.socket.on('message_received', (message: Message) => {
            this.messageListeners.forEach(listener => listener(message));
        });

        this.socket.on('message_updated', (message: Message) => {
            this.messageUpdateListeners.forEach(listener => listener(message));
        });

        this.socket.on('message_deleted', (messageId: number, chatRoomId: number) => {
            this.messageDeleteListeners.forEach(listener => listener(messageId, chatRoomId));
        });

        this.socket.on('messages_loaded', (data: { chatRoomId: number; messages: Message[]; page?: number; }) => {
            this.messagesLoadedListeners.forEach(listener => listener(data));
        });

        this.socket.on('typing_start', (data: TypingIndicator) => {
            this.typingListeners.forEach(listener => listener(data));
        });

        this.socket.on('typing_stop', (data: { userId: number; chatRoomId: number; }) => {
            this.typingStopListeners.forEach(listener => listener(data));
        });

        this.socket.on('user_presence_updated', (presence: UserPresence) => {
            this.presenceListeners.forEach(listener => listener(presence));
        });

        this.socket.on('message_reaction_added', (reaction: MessageReaction) => {
            this.reactionListeners.forEach(listener => listener(reaction));
        });

        this.socket.on('undelivered_messages_notification', (data: { count: number; messages: Message[] }) => {
            this.undeliveredMessagesListeners.forEach(listener => listener(data));
        });

        this.socket.on('error', (error: { message: string; code?: string; }) => {
            this.errorListeners.forEach(listener => listener(error));
        });
    }

    private async handleAuthenticationError() {
        console.log('Authentication error detected, attempting token refresh...');

        if (this.tokenRefreshCallback) {
            try {
                const newToken = await this.tokenRefreshCallback();
                if (newToken) {
                    console.log('Token refreshed, reconnecting...');
                    this.token = newToken;
                    this.reconnectAttempts = 0;
                    await this.connect(newToken, this.tokenRefreshCallback);
                } else {
                    console.error('Failed to refresh token');
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        } else {
            console.error('No token refresh callback available');
        }
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
                this.connect(this.token, this.tokenRefreshCallback || undefined).catch(() => {
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

    getMessages(chatRoomId: number, page?: number, limit?: number) {
        this.socket?.emit('get_messages', { chatRoomId, page, limit });
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

    onMessagesLoaded(listener: (data: { chatRoomId: number; messages: Message[]; page?: number }) => void) {
        this.messagesLoadedListeners.push(listener);
        return () => {
            const index = this.messagesLoadedListeners.indexOf(listener);
            if (index > -1) {
                this.messagesLoadedListeners.splice(index, 1);
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

    onUndeliveredMessages(listener: (data: { count: number; messages: Message[] }) => void) {
        this.undeliveredMessagesListeners.push(listener);
        return () => {
            const index = this.undeliveredMessagesListeners.indexOf(listener);
            if (index > -1) {
                this.undeliveredMessagesListeners.splice(index, 1);
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

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../services/websocket.service';
import messagingService from '../services/messaging.service';
import { 
    ChatRoom, 
    Message, 
    UserPresence, 
    TypingIndicator
} from '../types/messaging.types';

interface ChatContextType {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    
    // Chat rooms
    chatRooms: ChatRoom[];
    currentRoom: ChatRoom | null;
    
    // Messages
    messages: { [roomId: number]: Message[] };
    
    // Typing indicators
    typingUsers: { [roomId: number]: TypingIndicator[] };
    
    // Online users
    onlineUsers: UserPresence[];
    
    // Actions
    connectToChat: () => Promise<void>;
    disconnectFromChat: () => void;
    selectRoom: (room: ChatRoom | null) => void;
    sendMessage: (roomId: number, content: string, replyToId?: number) => void;
    loadMessages: (roomId: number, page?: number) => Promise<void>;
    startTyping: (roomId: number) => void;
    stopTyping: (roomId: number) => void;
    markAsRead: (roomId: number) => void;
    addReaction: (messageId: number, reaction: string) => void;
    removeReaction: (messageId: number, reaction: string) => void;
    refreshChatRooms: () => Promise<void>;

    // Error handling
    error: string | null;
    clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { user, accessToken } = useAuth();
    console.log(user, accessToken);
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    // Data state
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<{ [roomId: number]: Message[] }>({});
    const [typingUsers, setTypingUsers] = useState<{ [roomId: number]: TypingIndicator[] }>({});
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    
    // Error state
    const [error, setError] = useState<string | null>(null);


    // Connect to chat
    const connectToChat = useCallback(async () => {
        if (!accessToken || !user || isConnecting || isConnected) return;

        try {
            setIsConnecting(true);
            setError(null);
            
            await webSocketService.connect(accessToken);
            setIsConnected(true);
            
            // Load initial data
            const rooms = await messagingService.getChatRooms();
            setChatRooms(rooms);
            
            const online = await messagingService.getOnlineUsers();
            setOnlineUsers(online);
            
        } catch (err) {
            console.error('Failed to connect to chat:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to chat');
        } finally {
            setIsConnecting(false);
        }
    }, [accessToken, user, isConnecting, isConnected]);

    // Disconnect from chat
    const disconnectFromChat = useCallback(() => {
        webSocketService.disconnect();
        setIsConnected(false);
        setCurrentRoom(null);
        setMessages({});
        setTypingUsers({});
        setOnlineUsers([]);
    }, []);

    // Select room
    const selectRoom = useCallback((room: ChatRoom | null) => {
        if (currentRoom) {
            webSocketService.leaveRoom(currentRoom.id);
        }
        
        setCurrentRoom(room);
        
        if (room) {
            webSocketService.joinRoom(room.id);
            // Load messages if not already loaded
            if (!messages[room.id]) {
                loadMessages(room.id);
            }
        }
    }, [currentRoom, messages]);

    // Send message
    const sendMessage = useCallback((roomId: number, content: string, replyToId?: number) => {
        webSocketService.sendMessage(roomId, content, 'text', replyToId);
    }, []);

    // Load messages
    const loadMessages = useCallback(async (roomId: number, page = 1) => {
        try {
            const roomMessages = await messagingService.getMessages(roomId, { page, limit: 50 });
            setMessages(prev => ({
                ...prev,
                [roomId]: page === 1 ? roomMessages : [...(prev[roomId] || []), ...roomMessages]
            }));
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
    }, []);

    const startTyping = useCallback((roomId: number) => {
        webSocketService.startTyping(roomId);
    }, []);

    const stopTyping = useCallback((roomId: number) => {
        webSocketService.stopTyping(roomId);
    }, []);

    const markAsRead = useCallback((roomId: number) => {
        const roomMessages = messages[roomId] || [];
        const unreadMessageIds = roomMessages
            .filter(msg => msg.sender_id !== user?.id)
            .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
            webSocketService.markMessagesRead(roomId, unreadMessageIds);
        }
    }, [messages, user]);

    const addReaction = useCallback((messageId: number, reaction: string) => {
        webSocketService.addReaction(messageId, reaction);
    }, []);

    const removeReaction = useCallback((messageId: number, reaction: string) => {
        webSocketService.removeReaction(messageId, reaction);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Refresh chat rooms
    const refreshChatRooms = useCallback(async () => {
        try {
            const rooms = await messagingService.getChatRooms();
            setChatRooms(rooms);
        } catch (err) {
            console.error('Failed to refresh chat rooms:', err);
        }
    }, []);

    // Set up WebSocket event listeners
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribers = [
            // Message events
            webSocketService.onMessage((message) => {
                setMessages(prev => ({
                    ...prev,
                    [message.chat_room_id]: [...(prev[message.chat_room_id] || []), message]
                }));
                
                // Update room's last message
                setChatRooms(prev => prev.map(room => 
                    room.id === message.chat_room_id 
                        ? { ...room, last_message: message, updated_at: message.created_at }
                        : room
                ));
            }),

            webSocketService.onMessageUpdate((message) => {
                setMessages(prev => ({
                    ...prev,
                    [message.chat_room_id]: (prev[message.chat_room_id] || []).map(msg =>
                        msg.id === message.id ? message : msg
                    )
                }));
            }),

            webSocketService.onMessageDelete((messageId, chatRoomId) => {
                setMessages(prev => ({
                    ...prev,
                    [chatRoomId]: (prev[chatRoomId] || []).filter(msg => msg.id !== messageId)
                }));
            }),

            // Typing events
            webSocketService.onTyping((data) => {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.chatRoomId]: [
                        ...(prev[data.chatRoomId] || []).filter(t => t.userId !== data.userId),
                        data
                    ]
                }));
            }),

            webSocketService.onTypingStop((data) => {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.chatRoomId]: (prev[data.chatRoomId] || []).filter(t => t.userId !== data.userId)
                }));
            }),

            // Presence events
            webSocketService.onPresenceUpdate((presence) => {
                setOnlineUsers(prev => {
                    const filtered = prev.filter(u => u.user_id !== presence.user_id);
                    return presence.status === 'offline' ? filtered : [...filtered, presence];
                });
            }),

            // Error events
            webSocketService.onError((error) => {
                setError(error.message);
            })
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [isConnected]);

    // Auto-connect when user is authenticated
    useEffect(() => {
        if (user && accessToken && !isConnected && !isConnecting) {
            connectToChat().then(r => console.log(r));
        }
    }, [user, accessToken, isConnected, isConnecting, connectToChat]);

    // Disconnect when user logs out
    useEffect(() => {
        if (!user || !accessToken) {
            disconnectFromChat();
        }
    }, [user, accessToken, disconnectFromChat]);

    const value: ChatContextType = {
        isConnected,
        isConnecting,
        chatRooms,
        currentRoom,
        messages,
        typingUsers,
        onlineUsers,
        connectToChat,
        disconnectFromChat,
        selectRoom,
        sendMessage,
        loadMessages,
        startTyping,
        stopTyping,
        markAsRead,
        addReaction,
        removeReaction,
        refreshChatRooms,
        error,
        clearError
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export interface ChatRoom {
    id: number;
    name: string;
    description?: string;
    quartier_id: number;
    room_type: 'group' | 'direct';
    created_by?: number;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
    member_count?: number;
    last_message?: Message;
    unread_count?: number;
}

export interface ChatRoomMember {
    id: number;
    chat_room_id: number;
    user_id: number;
    role: 'admin' | 'moderator' | 'member';
    joined_at: Date;
    last_read_at: Date;
    is_muted: boolean;
    user?: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
    };
}

export interface Message {
    id: number;
    chat_room_id: number;
    sender_id?: number;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    reply_to_id?: number;
    created_at: Date;
    updated_at: Date;
    is_edited: boolean;
    is_deleted: boolean;
    deleted_at?: Date;
    sender?: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
    };
    reply_to?: Message;
    reactions?: MessageReaction[];
    delivery_status?: 'sent' | 'delivered' | 'read';
}

export interface MessageReaction {
    id: number;
    message_id: number;
    user_id: number;
    reaction: string;
    created_at: Date;
    user?: {
        id: number;
        nom: string;
        prenom: string;
    };
}

export interface UserPresence {
    id: number;
    user_id: number;
    status: 'online' | 'away' | 'busy' | 'offline';
    last_seen: Date;
    socket_id?: string;
    updated_at: Date;
}

export interface TypingIndicator {
    id: number;
    chat_room_id: number;
    user_id: number;
    started_at: Date;
    user?: {
        id: number;
        nom: string;
        prenom: string;
    };
}

export interface MessageDelivery {
    id: number;
    message_id: number;
    user_id: number;
    status: 'sent' | 'delivered' | 'read';
    timestamp: Date;
}

export interface BlockedUser {
    id: number;
    blocker_id: number;
    blocked_id: number;
    reason?: string;
    created_at: Date;
}

// Socket.io event types
export interface ServerToClientEvents {
    message_received: (message: Message) => void;
    message_updated: (message: Message) => void;
    message_deleted: (messageId: number, chatRoomId: number) => void;
    messages_loaded: (data: { chatRoomId: number; messages: Message[]; page?: number }) => void;
    user_joined_room: (user: ChatRoomMember) => void;
    user_left_room: (userId: number, chatRoomId: number) => void;
    typing_start: (data: { userId: number; chatRoomId: number; user: { nom: string; prenom: string } }) => void;
    typing_stop: (data: { userId: number; chatRoomId: number }) => void;
    user_presence_updated: (presence: UserPresence & { user: { nom: string; prenom: string } }) => void;
    message_reaction_added: (reaction: MessageReaction) => void;
    message_reaction_removed: (data: { messageId: number; userId: number; reaction: string }) => void;
    room_created: (room: ChatRoom) => void;
    room_updated: (room: ChatRoom) => void;
    undelivered_messages_notification: (data: { count: number; messages: Message[] }) => void;
    error: (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
    join_room: (chatRoomId: number) => void;
    leave_room: (chatRoomId: number) => void;
    send_message: (data: { chatRoomId: number; content: string; messageType?: string; replyToId?: number }) => void;
    edit_message: (data: { messageId: number; content: string }) => void;
    delete_message: (messageId: number) => void;
    start_typing: (chatRoomId: number) => void;
    stop_typing: (chatRoomId: number) => void;
    mark_messages_read: (data: { chatRoomId: number; messageIds: number[] }) => void;
    add_reaction: (data: { messageId: number; reaction: string }) => void;
    remove_reaction: (data: { messageId: number; reaction: string }) => void;
    get_room_members: (chatRoomId: number) => void;
    get_messages: (data: { chatRoomId: number; page?: number; limit?: number }) => void;
    update_presence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: number;
    quartier_id: number;
    user: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        quartier_id: number;
    };
}

// API Request/Response types
export interface CreateChatRoomRequest {
    name: string;
    description?: string;
    room_type: 'group' | 'direct';
    member_ids?: number[];
}

export interface SendMessageRequest {
    content: string;
    message_type?: 'text' | 'image' | 'file';
    reply_to_id?: number;
}

export interface GetMessagesQuery {
    page?: number;
    limit?: number;
    before?: string; // ISO date string
    after?: string; // ISO date string
}

export interface ChatRoomWithDetails extends ChatRoom {
    members: ChatRoomMember[];
    recent_messages: Message[];
    user_role?: 'admin' | 'moderator' | 'member';
}

import { 
    ChatRoom, 
    ChatRoomWithDetails, 
    Message, 
    ChatRoomMember, 
    UserPresence,
    CreateChatRoomRequest,
    GetMessagesQuery,
    ApiResponse 
} from '../types/messaging.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class MessagingService {
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse<T> = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data.data!;
    }

    // Chat Rooms
    async getChatRooms(): Promise<ChatRoom[]> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<ChatRoom[]>(response);
    }

    async getAvailableRooms(): Promise<ChatRoom[]> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/available`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<ChatRoom[]>(response);
    }

    async getChatRoom(roomId: number): Promise<ChatRoomWithDetails> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<ChatRoomWithDetails>(response);
    }

    async createChatRoom(data: CreateChatRoomRequest): Promise<ChatRoom> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse<ChatRoom>(response);
    }

    async joinChatRoom(roomId: number): Promise<ChatRoomMember> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}/join`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<ChatRoomMember>(response);
    }

    async leaveChatRoom(roomId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
        await this.handleResponse<void>(response);
    }

    // Messages
    async getMessages(roomId: number, query: GetMessagesQuery = {}): Promise<Message[]> {
        const params = new URLSearchParams();
        if (query.page) params.append('page', query.page.toString());
        if (query.limit) params.append('limit', query.limit.toString());
        if (query.before) params.append('before', query.before);
        if (query.after) params.append('after', query.after);

        const response = await fetch(
            `${API_BASE_URL}/api/messaging/rooms/${roomId}/messages?${params.toString()}`,
            {
                headers: this.getAuthHeaders()
            }
        );
        return this.handleResponse<Message[]>(response);
    }

    async getUnreadCount(roomId: number): Promise<{ unread_count: number }> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}/unread-count`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ unread_count: number }>(response);
    }

    async markAsRead(roomId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}/mark-read`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
        await this.handleResponse<void>(response);
    }

    // Members
    async getRoomMembers(roomId: number): Promise<ChatRoomMember[]> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/rooms/${roomId}/members`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<ChatRoomMember[]>(response);
    }

    // Presence
    async getOnlineUsers(): Promise<UserPresence[]> {
        const response = await fetch(`${API_BASE_URL}/api/messaging/users/online`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<UserPresence[]>(response);
    }
}

export const messagingService = new MessagingService();
export default messagingService;

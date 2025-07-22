import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import messagingService from '../services/messaging.service';
import webSocketService from '../services/websocket.service';

export const useUnreadMessageCount = () => {
    const { user } = useAuth();
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [unreadCountByRoom, setUnreadCountByRoom] = useState<{ [roomId: number]: number }>({});
    const [isLoading, setIsLoading] = useState(false);

    // Fetch unread count for all rooms
    const fetchUnreadCounts = useCallback(async () => {
        if (!user) {
            setTotalUnreadCount(0);
            setUnreadCountByRoom({});
            return;
        }

        setIsLoading(true);
        try {
            // Get all chat rooms first
            const rooms = await messagingService.getChatRooms();
            const unreadCounts: { [roomId: number]: number } = {};
            let total = 0;

            // Fetch unread count for each room
            await Promise.all(
                rooms.map(async (room) => {
                    try {
                        const { unread_count } = await messagingService.getUnreadCount(room.id);
                        unreadCounts[room.id] = unread_count;
                        total += unread_count;
                    } catch (error) {
                        console.error(`Failed to get unread count for room ${room.id}:`, error);
                        unreadCounts[room.id] = 0;
                    }
                })
            );

            setUnreadCountByRoom(unreadCounts);
            setTotalUnreadCount(total);
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Update unread count when a new message is received
    const handleNewMessage = useCallback((message: any) => {
        // Only count messages from other users
        if (message.sender_id !== user?.id) {
            setUnreadCountByRoom(prev => ({
                ...prev,
                [message.chat_room_id]: (prev[message.chat_room_id] || 0) + 1
            }));
            setTotalUnreadCount(prev => prev + 1);
        }
    }, [user?.id]);

    // Update unread count when messages are marked as read
    const handleMessagesRead = useCallback((roomId: number) => {
        setUnreadCountByRoom(prev => {
            const currentCount = prev[roomId] || 0;
            if (currentCount > 0) {
                setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - currentCount));
                return {
                    ...prev,
                    [roomId]: 0
                };
            }
            return prev;
        });
    }, []);

    // Mark room as read
    const markRoomAsRead = useCallback(async (roomId: number) => {
        try {
            await messagingService.markAsRead(roomId);
            handleMessagesRead(roomId);
        } catch (error) {
            console.error('Failed to mark room as read:', error);
        }
    }, [handleMessagesRead]);

    // Set up WebSocket listeners
    useEffect(() => {
        if (!user) return;

        const unsubscribers = [
            // Listen for new messages
            webSocketService.onMessage(handleNewMessage)
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
        };
    }, [user, handleNewMessage]);

    // Initial fetch when user changes
    useEffect(() => {
        fetchUnreadCounts();
    }, [fetchUnreadCounts]);

    // Refresh counts periodically (every 30 seconds)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            fetchUnreadCounts();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user, fetchUnreadCounts]);

    return {
        totalUnreadCount,
        unreadCountByRoom,
        isLoading,
        refreshUnreadCounts: fetchUnreadCounts,
        markRoomAsRead
    };
};

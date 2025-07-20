import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPresence, ChatRoom } from '../../types/messaging.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMobileChat } from '../../contexts/MobileChatContext';
import messagingService from '../../services/messaging.service';
import {
    Users,
    Circle,
    MessageCircle,
    ArrowLeft,
    Wifi,
    WifiOff
} from 'lucide-react';

interface NeighborhoodUsersProps {
    currentRoom: ChatRoom | null;
    onToggleView?: () => void;
    showToggle?: boolean;
}

const NeighborhoodUsers: React.FC<NeighborhoodUsersProps> = ({onToggleView, showToggle = false }) => {
    const { selectRoom, chatRooms, refreshChatRooms } = useChat();
    const { user: currentUser } = useAuth();
    const { isMobile, navigateToView } = useMobileChat();
    const [neighborhoodUsers, setNeighborhoodUsers] = useState<UserPresence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNeighborhoodUsers();
    }, []);

    const loadNeighborhoodUsers = async () => {
        try {
            setLoading(true);
            const users = await messagingService.getNeighborhoodUsers();
            setNeighborhoodUsers(users);
        } catch (error) {
            console.error('Failed to load neighborhood users:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'text-green-500';
            case 'away':
                return 'text-yellow-500';
            case 'busy':
                return 'text-red-500';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online':
                return 'En ligne';
            case 'away':
                return 'Absent';
            case 'busy':
                return 'Occupé';
            default:
                return 'Hors ligne';
        }
    };

    const isUserOnline = (status: string, lastSeen: string) => {
        if (status === 'offline') return false;
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
        return diffInMinutes <= 5; // Consider online if seen within 5 minutes
    };

    const getInitials = (nom: string, prenom: string) => {
        return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
    };

    const formatLastSeen = (lastSeen: string) => {
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'À l\'instant';
        } else if (diffInMinutes < 60) {
            return `Il y a ${diffInMinutes}m`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `Il y a ${hours}h`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `Il y a ${days}j`;
        }
    };

    const handleStartDirectMessage = async (targetUser: UserPresence) => {
        if (!currentUser || !targetUser.user) return;

        try {
            // Check if a direct message room already exists between these users
            const existingRoom = chatRooms.find(room =>
                room.room_type === 'direct' &&
                room.name.includes(targetUser.user!.prenom) &&
                room.name.includes(currentUser.prenom)
            );

            if (existingRoom) {
                // Select the existing room
                selectRoom(existingRoom);
            } else {
                // Use the offline direct message endpoint for offline users
                const isOnline = isUserOnline(targetUser.status, targetUser.last_seen);
                
                let newRoom;
                if (isOnline) {
                    // Use regular direct message creation for online users
                    const roomName = `${currentUser.prenom} & ${targetUser.user.prenom}`;
                    newRoom = await messagingService.createChatRoom({
                        name: roomName,
                        description: `Conversation privée entre ${currentUser.prenom} et ${targetUser.user.prenom}`,
                        room_type: 'direct',
                        member_ids: [targetUser.user_id]
                    });
                } else {
                    // Use offline direct message creation for offline users
                    newRoom = await messagingService.createOfflineDirectMessage(targetUser.user_id);
                }

                // Refresh the chat rooms list to include the new room
                await refreshChatRooms();

                // Select the new room
                selectRoom(newRoom);
            }

            // Navigate to chat on mobile
            if (isMobile) {
                navigateToView('chat');
            }
        } catch (error) {
            console.error('Failed to start direct message:', error);
            // You could add a toast notification here
        }
    };

    // Separate online and offline users
    const onlineUsers = neighborhoodUsers.filter(user => isUserOnline(user.status, user.last_seen));
    const offlineUsers = neighborhoodUsers.filter(user => !isUserOnline(user.status, user.last_seen));

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`border-b border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                    <h2 className={`font-semibold text-gray-900 flex items-center ${
                        isMobile ? 'text-base' : 'text-lg'
                    }`}>
                        {isMobile && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateToView('rooms')}
                                className="mr-2 p-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
                        Voisins
                    </h2>
                    <div className="flex items-center gap-2">
                        {showToggle && onToggleView && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleView}
                                className="text-xs"
                            >
                                <Wifi className="h-3 w-3 mr-1" />
                                En ligne
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadNeighborhoodUsers}
                            disabled={loading}
                            className="text-xs"
                        >
                            {loading ? 'Actualisation...' : 'Actualiser'}
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    {neighborhoodUsers.length} voisin{neighborhoodUsers.length !== 1 ? 's' : ''} dans votre quartier
                </p>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-sm text-gray-500">Chargement...</div>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {/* Online Users Section */}
                        {onlineUsers.length > 0 && (
                            <>
                                <div className="flex items-center px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <Wifi className="h-3 w-3 mr-1" />
                                    En ligne ({onlineUsers.length})
                                </div>
                                {onlineUsers.map((user) => (
                                    <UserItem
                                        key={user.user_id}
                                        user={user}
                                        isOnline={true}
                                        onStartDirectMessage={handleStartDirectMessage}
                                        getStatusColor={getStatusColor}
                                        getStatusText={getStatusText}
                                        getInitials={getInitials}
                                        formatLastSeen={formatLastSeen}
                                        isMobile={isMobile}
                                    />
                                ))}
                            </>
                        )}

                        {/* Offline Users Section */}
                        {offlineUsers.length > 0 && (
                            <>
                                <div className="flex items-center px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider mt-4">
                                    <WifiOff className="h-3 w-3 mr-1" />
                                    Hors ligne ({offlineUsers.length})
                                </div>
                                {offlineUsers.map((user) => (
                                    <UserItem
                                        key={user.user_id}
                                        user={user}
                                        isOnline={false}
                                        onStartDirectMessage={handleStartDirectMessage}
                                        getStatusColor={getStatusColor}
                                        getStatusText={getStatusText}
                                        getInitials={getInitials}
                                        formatLastSeen={formatLastSeen}
                                        isMobile={isMobile}
                                    />
                                ))}
                            </>
                        )}

                        {neighborhoodUsers.length === 0 && (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">
                                    Aucun voisin trouvé dans votre quartier
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Separate UserItem component for reusability
interface UserItemProps {
    user: UserPresence;
    isOnline: boolean;
    onStartDirectMessage: (user: UserPresence) => void;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
    getInitials: (nom: string, prenom: string) => string;
    formatLastSeen: (lastSeen: string) => string;
    isMobile: boolean;
}

const UserItem: React.FC<UserItemProps> = ({
    user,
    isOnline,
    onStartDirectMessage,
    getStatusColor,
    getStatusText,
    getInitials,
    formatLastSeen,
    isMobile
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="hover:shadow-sm transition-shadow cursor-pointer border-gray-100">
                <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="relative">
                                <div className={`${
                                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                                } bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium ${
                                    isMobile ? 'text-xs' : 'text-sm'
                                }`}>
                                    {getInitials(user.user?.nom || '', user.user?.prenom || '')}
                                </div>
                                {/* Status indicator */}
                                <div className={`absolute -bottom-0.5 -right-0.5 ${
                                    isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                                } rounded-full border-2 border-white ${
                                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                            </div>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <p className={`font-medium text-gray-900 truncate ${
                                        isMobile ? 'text-sm' : 'text-base'
                                    }`}>
                                        {user.user?.prenom} {user.user?.nom}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Circle className={`h-2 w-2 ${getStatusColor(user.status)} fill-current`} />
                                    <span className={`text-gray-500 ${
                                        isMobile ? 'text-xs' : 'text-sm'
                                    }`}>
                                        {getStatusText(user.status)}
                                        {!isOnline && ` • ${formatLastSeen(user.last_seen)}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Message button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStartDirectMessage(user)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default NeighborhoodUsers;

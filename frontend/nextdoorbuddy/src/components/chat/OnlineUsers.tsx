import React from 'react';
import { motion } from 'framer-motion';
import { UserPresence, ChatRoom } from '../../types/messaging.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMobileChat } from '../../contexts/MobileChatContext';
import UserAvatar from '../UserAvatar';
import messagingService from '../../services/messaging.service';
import {
    Users,
    MessageCircle,
    Crown,
    User,
    Hash,
    ArrowLeft
} from 'lucide-react';

interface OnlineUsersProps {
    users: UserPresence[];
    currentRoom: ChatRoom | null;
    onToggleView?: () => void;
    showToggle?: boolean;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentRoom, onToggleView, showToggle = false }) => {
    const { selectRoom, chatRooms, refreshChatRooms } = useChat();
    const { user: currentUser } = useAuth();
    const { isMobile, navigateToView } = useMobileChat();

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
                // Create a new direct message room
                const roomName = `${currentUser.prenom} & ${targetUser.user.prenom}`;
                const newRoom = await messagingService.createChatRoom({
                    name: roomName,
                    description: `Conversation privée entre ${currentUser.prenom} et ${targetUser.user.prenom}`,
                    room_type: 'direct',
                    member_ids: [targetUser.user_id]
                });

                // Refresh the chat rooms list to include the new room
                await refreshChatRooms();

                // Select the new room
                selectRoom(newRoom);
            }
        } catch (error) {
            console.error('Failed to start direct message:', error);
            // You could add a toast notification here
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`border-b border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                    <h2 className={`font-semibold text-gray-900 flex items-center ${
                        isMobile ? 'text-base' : 'text-lg'
                    }`}>
                        <Users className={`mr-2 text-blue-600 ${
                            isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        }`} />
                        {isMobile
                            ? (currentRoom ? 'Membres' : 'En ligne')
                            : (currentRoom ? 'Membres du salon' : 'Utilisateurs en ligne')
                        }
                    </h2>
                    <div className="flex items-center gap-2">
                        {showToggle && onToggleView && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleView}
                                className="text-xs"
                            >
                                <Users className="h-3 w-3 mr-1" />
                                Voisins
                            </Button>
                        )}
                        {isMobile && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateToView('chat')}
                                className="p-2 min-h-[44px] min-w-[44px]"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {currentRoom && (
                    <div className={`flex items-center mt-2 text-gray-600 ${
                        isMobile ? 'text-sm' : 'text-sm'
                    }`}>
                        {currentRoom.room_type === 'group' ? (
                            <Hash className="w-4 h-4 mr-2" />
                        ) : (
                            <User className="w-4 h-4 mr-2" />
                        )}
                        <span className="truncate">{currentRoom.name}</span>
                    </div>
                )}
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {users.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'p-4' : 'p-6'}`}>
                        <Users className={`text-gray-400 mx-auto mb-3 ${
                            isMobile ? 'w-10 h-10' : 'w-12 h-12'
                        }`} />
                        <p className={`text-gray-600 ${
                            isMobile ? 'text-sm' : 'text-sm'
                        }`}>
                            Aucun utilisateur en ligne
                        </p>
                    </div>
                ) : (
                    <div className={isMobile ? 'p-1' : 'p-2'}>
                        {users.map((userPresence, index) => (
                            <motion.div
                                key={userPresence.user_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
                                    isMobile ? 'mb-1' : 'mb-2'
                                }`}>
                                    <CardContent className={isMobile ? 'p-4' : 'p-3'}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className={`relative flex-shrink-0 ${
                                                    isMobile ? 'mr-3' : 'mr-3'
                                                }`}>
                                                    <UserAvatar
                                                        user={userPresence.user}
                                                        size={isMobile ? 'lg' : 'md'}
                                                        showOnlineStatus={true}
                                                        isOnline={userPresence.status === 'online'}
                                                    />
                                                </div>

                                                {/* User info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <h3 className="font-medium text-gray-900 truncate">
                                                            {userPresence.user ? 
                                                                `${userPresence.user.prenom} ${userPresence.user.nom}` : 
                                                                'Utilisateur inconnu'
                                                            }
                                                        </h3>
                                                        {/* Role badges for room members */}
                                                        {currentRoom && (
                                                            <div className="ml-2 flex items-center">
                                                                <Crown className="w-3 h-3 text-yellow-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <span className={getStatusColor(userPresence.status)}>
                                                            {getStatusText(userPresence.status)}
                                                        </span>
                                                        {userPresence.status !== 'online' && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <span>{formatLastSeen(userPresence.last_seen)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`ml-2 ${
                                                    isMobile ? 'p-3 min-h-[44px] min-w-[44px]' : 'p-2'
                                                }`}
                                                onClick={() => handleStartDirectMessage(userPresence)}
                                                disabled={!userPresence.user || userPresence.user_id === currentUser?.id}
                                                title={userPresence.user_id === currentUser?.id ?
                                                    "Vous ne pouvez pas vous envoyer un message" :
                                                    `Envoyer un message à ${userPresence.user?.prenom}`
                                                }
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                    {users.length} utilisateur{users.length > 1 ? 's' : ''} 
                    {currentRoom ? ' dans ce salon' : ' en ligne'}
                </div>
            </div>
        </div>
    );
};

export default OnlineUsers;

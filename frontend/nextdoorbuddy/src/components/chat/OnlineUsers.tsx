import React from 'react';
import { motion } from 'framer-motion';
import { UserPresence, ChatRoom } from '../../types/messaging.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../services/messaging.service';
import {
    Users,
    Circle,
    MessageCircle,
    Crown,
    Shield,
    User,
    Hash
} from 'lucide-react';

interface OnlineUsersProps {
    users: UserPresence[];
    currentRoom: ChatRoom | null;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentRoom }) => {
    const { selectRoom, chatRooms, refreshChatRooms } = useChat();
    const { user: currentUser } = useAuth();

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
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    {currentRoom ? 'Membres du salon' : 'Utilisateurs en ligne'}
                </h2>
                {currentRoom && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                        {currentRoom.room_type === 'group' ? (
                            <Hash className="w-4 h-4 mr-2" />
                        ) : (
                            <User className="w-4 h-4 mr-2" />
                        )}
                        {currentRoom.name}
                    </div>
                )}
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
                {users.length === 0 ? (
                    <div className="p-6 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">
                            Aucun utilisateur en ligne
                        </p>
                    </div>
                ) : (
                    <div className="p-2">
                        {users.map((userPresence, index) => (
                            <motion.div
                                key={userPresence.user_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <Card className="mb-2 hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0 mr-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                                        {userPresence.user ? 
                                                            getInitials(userPresence.user.nom, userPresence.user.prenom) : 
                                                            '?'
                                                        }
                                                    </div>
                                                    {/* Status indicator */}
                                                    <div className="absolute -bottom-1 -right-1">
                                                        <Circle 
                                                            className={`w-4 h-4 ${getStatusColor(userPresence.status)} fill-current`}
                                                        />
                                                    </div>
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
                                                className="ml-2 p-2"
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

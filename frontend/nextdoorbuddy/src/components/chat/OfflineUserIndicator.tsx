import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatRoom, UserPresence } from '../../types/messaging.types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import messagingService from '../../services/messaging.service';
import {
    WifiOff,
    Clock,
    Info
} from 'lucide-react';

interface OfflineUserIndicatorProps {
    room: ChatRoom;
    className?: string;
}

const OfflineUserIndicator: React.FC<OfflineUserIndicatorProps> = ({ room, className = '' }) => {
    const { user: currentUser } = useAuth();
    const { onlineUsers } = useChat();
    const [roomMembers, setRoomMembers] = useState<UserPresence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (room && room.room_type === 'direct') {
            loadRoomMembers();
        }
    }, [room]);

    const loadRoomMembers = async () => {
        if (!room) return;

        try {
            setLoading(true);
            // Get neighborhood users to check status of room members
            const neighborhoodUsers = await messagingService.getNeighborhoodUsers();
            
            // For direct message rooms, find the other user
            const otherUser = neighborhoodUsers.find(user => 
                user.user_id !== currentUser?.id && 
                room.name.includes(user.user?.prenom || '') &&
                room.name.includes(user.user?.nom || '')
            );

            if (otherUser) {
                setRoomMembers([otherUser]);
            }
        } catch (error) {
            console.error('Error loading room members:', error);
        } finally {
            setLoading(false);
        }
    };

    const isUserOnline = (userId: number) => {
        return onlineUsers.some(user => user.user_id === userId);
    };

    const getOfflineUsers = () => {
        return roomMembers.filter(member => !isUserOnline(member.user_id));
    };

    const getLastSeenText = (lastSeen: string) => {
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'vu à l\'instant';
        } else if (diffInMinutes < 60) {
            return `vu il y a ${diffInMinutes}m`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `vu il y a ${hours}h`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `vu il y a ${days}j`;
        }
    };

    if (loading || !room || room.room_type !== 'direct') {
        return null;
    }

    const offlineUsers = getOfflineUsers();

    if (offlineUsers.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}
        >
            <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-amber-800">
                            Utilisateur hors ligne
                        </h4>
                        <Info className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="mt-1 space-y-1">
                        {offlineUsers.map((user) => (
                            <div key={user.user_id} className="text-sm text-amber-700">
                                <span className="font-medium">
                                    {user.user?.prenom} {user.user?.nom}
                                </span>
                                <span className="text-amber-600 ml-2">
                                    {getLastSeenText(user.last_seen)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-amber-600">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Vos messages seront livrés quand {offlineUsers.length > 1 ? 'ils' : 'il/elle'} reviendra{offlineUsers.length > 1 ? 'ont' : ''} en ligne.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default OfflineUserIndicator;

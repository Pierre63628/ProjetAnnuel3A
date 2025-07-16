import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useChat } from '../../contexts/ChatContext';
import webSocketService from '../../services/websocket.service';
import { Message } from '../../types/messaging.types';
import {
    Mail,
    X,
    MessageCircle,
    Clock,
    User
} from 'lucide-react';

interface UndeliveredMessagesNotificationProps {
    className?: string;
}

const UndeliveredMessagesNotification: React.FC<UndeliveredMessagesNotificationProps> = ({ className = '' }) => {
    const { selectRoom, chatRooms, refreshChatRooms } = useChat();
    const [undeliveredMessages, setUndeliveredMessages] = useState<Message[]>([]);
    const [showNotification, setShowNotification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Listen for undelivered messages notification from WebSocket
        const unsubscribe = webSocketService.onUndeliveredMessages((data) => {
            console.log('📬 Received undelivered messages notification:', data);
            setUndeliveredMessages(data.messages);
            setShowNotification(data.count > 0);
        });

        return unsubscribe;
    }, []);

    const handleViewMessages = async () => {
        if (undeliveredMessages.length === 0) return;

        setIsLoading(true);
        try {
            // Group messages by room
            const messagesByRoom = undeliveredMessages.reduce((acc, message) => {
                const roomId = message.chat_room_id;
                if (!acc[roomId]) {
                    acc[roomId] = [];
                }
                acc[roomId].push(message);
                return acc;
            }, {} as { [roomId: number]: Message[] });

            // Find the room with the most recent message
            let mostRecentRoom = null;
            let mostRecentTime = 0;

            for (const [roomIdStr, roomMessages] of Object.entries(messagesByRoom)) {
                const roomId = parseInt(roomIdStr);
                const room = chatRooms.find(r => r.id === roomId);
                if (room) {
                    const latestMessage = roomMessages.sort((a, b) => 
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    const messageTime = new Date(latestMessage.created_at).getTime();
                    
                    if (messageTime > mostRecentTime) {
                        mostRecentTime = messageTime;
                        mostRecentRoom = room;
                    }
                }
            }

            // Refresh chat rooms to ensure we have the latest data
            await refreshChatRooms();

            // Select the room with the most recent undelivered message
            if (mostRecentRoom) {
                selectRoom(mostRecentRoom);
            }

            // Hide the notification
            setShowNotification(false);
            setUndeliveredMessages([]);
        } catch (error) {
            console.error('Error viewing undelivered messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        setShowNotification(false);
        setUndeliveredMessages([]);
    };

    const formatMessagePreview = (message: Message) => {
        const maxLength = 50;
        if (message.content.length <= maxLength) {
            return message.content;
        }
        return message.content.substring(0, maxLength) + '...';
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
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

    if (!showNotification || undeliveredMessages.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}
            >
                <Card className="shadow-lg border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        Messages non lus
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {undeliveredMessages.length} nouveau{undeliveredMessages.length > 1 ? 'x' : ''} message{undeliveredMessages.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDismiss}
                                className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Show preview of recent messages */}
                        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                            {undeliveredMessages.slice(0, 3).map((message) => (
                                <div key={message.id} className="bg-gray-50 rounded-lg p-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center text-xs text-gray-600">
                                            <User className="h-3 w-3 mr-1" />
                                            <span className="font-medium">
                                                {message.sender?.prenom} {message.sender?.nom}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {getTimeAgo(message.created_at)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-700">
                                        {formatMessagePreview(message)}
                                    </p>
                                </div>
                            ))}
                            {undeliveredMessages.length > 3 && (
                                <p className="text-xs text-gray-500 text-center">
                                    +{undeliveredMessages.length - 3} autre{undeliveredMessages.length - 3 > 1 ? 's' : ''} message{undeliveredMessages.length - 3 > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleViewMessages}
                                disabled={isLoading}
                                size="sm"
                                className="flex-1 text-xs"
                            >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {isLoading ? 'Chargement...' : 'Voir'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDismiss}
                                size="sm"
                                className="text-xs"
                            >
                                Plus tard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

export default UndeliveredMessagesNotification;

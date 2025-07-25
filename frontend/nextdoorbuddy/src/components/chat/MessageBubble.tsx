import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useMobileChat } from '../../contexts/MobileChatContext';
import { Message } from '../../types/messaging.types';
import { Button } from '../ui/button';
import {
    MoreVertical,
    Reply,
    Edit,
    Trash2,
    Smile,
    CheckCheck,
    Clock,
    WifiOff
} from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    showTimestamp: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwn,
    showAvatar,
    showTimestamp
}) => {
    const { addReaction, removeReaction } = useChat();
    const { isMobile } = useMobileChat();
    const [showActions, setShowActions] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Aujourd\'hui';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hier';
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });
        }
    };

    const renderDeliveryStatus = () => {
        const status = message.delivery_status || 'sent';
        const iconClass = `w-3 h-3 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`;

        switch (status) {
            case 'read':
                return (
                    <div className="flex items-center" title="Lu">
                        <CheckCheck className={iconClass} />
                    </div>
                );
            case 'delivered':
                return (
                    <div className="flex items-center" title="Livré">
                        <CheckCheck className={`${iconClass} opacity-60`} />
                    </div>
                );
            case 'sent':
            default:
                // Check if message is recent (less than 5 minutes) to show pending status
                const messageTime = new Date(message.created_at).getTime();
                const now = new Date().getTime();
                const diffInMinutes = (now - messageTime) / (1000 * 60);

                if (diffInMinutes < 5) {
                    return (
                        <div className="flex items-center" title="En attente de livraison">
                            <Clock className={`${iconClass} opacity-60`} />
                        </div>
                    );
                } else {
                    // Older message that's still only "sent" - might be to offline user
                    return (
                        <div className="flex items-center" title="Envoyé (destinataire hors ligne)">
                            <WifiOff className={`${iconClass} opacity-60`} />
                        </div>
                    );
                }
        }
    };

    const handleReaction = (reaction: string) => {
        const existingReaction = message.reactions?.find(
            r => r.reaction === reaction && r.user_id === message.sender_id
        );

        if (existingReaction) {
            removeReaction(message.id, reaction);
        } else {
            addReaction(message.id, reaction);
        }
        setShowReactions(false);
    };

    const getInitials = (nom: string, prenom: string) => {
        return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
    };

    const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${
            isMobile ? 'mb-3' : 'mb-2'
        }`}>
            <div className={`flex ${
                isMobile
                    ? 'max-w-[85%]' // More space on mobile
                    : 'max-w-xs lg:max-w-md'
            } ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isOwn && (
                    <div className={`flex-shrink-0 ${isMobile ? 'mr-2' : 'mr-3'}`}>
                        {showAvatar ? (
                            <div className={`rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium ${
                                isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
                            }`}>
                                {message.sender ?
                                    getInitials(message.sender.nom, message.sender.prenom) :
                                    '?'
                                }
                            </div>
                        ) : (
                            <div className={isMobile ? 'w-7 h-7' : 'w-8 h-8'} />
                        )}
                    </div>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Timestamp */}
                    {showTimestamp && (
                        <div className="text-xs text-gray-500 mb-2 px-2">
                            {formatDate(message.created_at)} à {formatTime(message.created_at)}
                        </div>
                    )}

                    {/* Sender name for group messages */}
                    {!isOwn && showAvatar && (
                        <div className={`text-gray-600 mb-1 px-2 font-medium ${
                            isMobile ? 'text-sm' : 'text-xs'
                        }`}>
                            {message.sender?.prenom} {message.sender?.nom}
                        </div>
                    )}

                    {/* Reply to message */}
                    {message.reply_to && (
                        <div className={`text-xs p-2 mb-1 rounded-lg bg-gray-100 border-l-2 border-gray-400 ${
                            isOwn ? 'mr-2' : 'ml-2'
                        }`}>
                            <div className="font-medium text-gray-600">
                                {message.reply_to.sender?.prenom}
                            </div>
                            <div className="text-gray-500 truncate">
                                {message.reply_to.content}
                            </div>
                        </div>
                    )}

                    {/* Message bubble */}
                    <motion.div
                        className={`relative rounded-2xl shadow-sm ${
                            isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                        } ${
                            isMobile ? 'px-3 py-3' : 'px-4 py-2'
                        }`}
                        whileHover={!isMobile ? { scale: 1.02 } : {}}
                        onMouseEnter={() => !isMobile && setShowActions(true)}
                        onMouseLeave={() => !isMobile && setShowActions(false)}
                        onTouchStart={() => isMobile && setShowActions(true)}
                        onTouchEnd={() => isMobile && setTimeout(() => setShowActions(false), 3000)}
                    >
                        {/* Message content */}
                        <div className={`break-words ${
                            isMobile ? 'text-base leading-relaxed' : 'text-sm'
                        }`}>
                            {message.content}
                        </div>

                        {/* Message status */}
                        {isOwn && (
                            <div className={`flex items-center justify-end mt-1 text-xs ${
                                isOwn ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                                <span className="mr-1">{formatTime(message.created_at)}</span>
                                {renderDeliveryStatus()}
                                {message.is_edited && (
                                    <span className="ml-1 text-xs opacity-75">modifié</span>
                                )}
                            </div>
                        )}

                        {/* Quick actions */}
                        {showActions && (
                            <motion.div
                                className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} transform ${
                                    isOwn ? '-translate-x-full' : 'translate-x-full'
                                } -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1 z-10`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowReactions(!showReactions)}
                                    className={isMobile ? 'min-w-[44px] min-h-[44px] p-2' : 'w-8 h-8 p-0'}
                                >
                                    <Smile className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={isMobile ? 'min-w-[44px] min-h-[44px] p-2' : 'w-8 h-8 p-0'}
                                >
                                    <Reply className="w-4 h-4" />
                                </Button>
                                {isOwn && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-8 h-8 p-0"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Reaction picker */}
                        {showReactions && (
                            <motion.div
                                className={`absolute top-0 ${isOwn ? 'right-0' : 'left-0'} transform ${
                                    isOwn ? 'translate-x-full' : '-translate-x-full'
                                } -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg border p-2`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                {reactionEmojis.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {message.reactions.map((reaction) => (
                                <motion.button
                                    key={`${reaction.reaction}-${reaction.user_id}`}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleReaction(reaction.reaction)}
                                >
                                    <span>{reaction.reaction}</span>
                                    <span className="text-gray-600">1</span>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Time for non-own messages */}
                    {!isOwn && !showTimestamp && (
                        <div className="text-xs text-gray-500 mt-1 px-2">
                            {formatTime(message.created_at)}
                            {message.is_edited && (
                                <span className="ml-1 opacity-75">modifié</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;

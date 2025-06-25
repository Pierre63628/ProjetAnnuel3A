import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { Button } from '../ui/button';
import {
    MessageCircle,
    Users,
    Hash,
    Settings,
    Phone,
    Video,
    Info
} from 'lucide-react';

const ChatWindow: React.FC = () => {
    const { user } = useAuth();
    const {
        currentRoom,
        messages,
        typingUsers,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const currentMessages = currentRoom ? messages[currentRoom.id] || [] : [];
    const currentTypingUsers = currentRoom ? typingUsers[currentRoom.id] || [] : [];

    React.useEffect(() => {
        if (currentRoom) {
            console.log(`💬 ChatWindow: Room ${currentRoom.id} selected, ${currentMessages.length} messages available`);
            console.log(`💬 ChatWindow: Room details:`, currentRoom);
        } else {
            console.log(`💬 ChatWindow: No room selected`);
        }
    }, [currentRoom, currentMessages.length]);

    useEffect(() => {
        if (isAtBottom && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentMessages, isAtBottom]);

    useEffect(() => {
        if (currentRoom && currentMessages.length > 0) {
            markAsRead(currentRoom.id);
        }
    }, [currentRoom, currentMessages.length, markAsRead]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const atBottom = scrollHeight - scrollTop - clientHeight < 100;
            setIsAtBottom(atBottom);
        }
    };

    const handleSendMessage = (content: string, replyToId?: number) => {
        if (currentRoom && content.trim()) {
            sendMessage(currentRoom.id, content.trim(), replyToId);
        }
    };

    const handleTypingStart = () => {
        if (currentRoom) {
            startTyping(currentRoom.id);
        }
    };

    const handleTypingStop = () => {
        if (currentRoom) {
            stopTyping(currentRoom.id);
        }
    };

    if (!currentRoom) {
        return (
            <div
                className="flex items-center justify-center w-full"
                style={{ height: '100%' }}
            >
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Sélectionnez un salon
                    </h3>
                    <p className="text-gray-500">
                        Choisissez un salon de discussion pour commencer à chatter avec vos voisins.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col w-full relative"
            style={{
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden'
            }}
        >
            {/* Chat Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {currentRoom.room_type === 'group' ? (
                            <Hash className="w-6 h-6 text-blue-600 mr-3" />
                        ) : (
                            <Users className="w-6 h-6 text-blue-600 mr-3" />
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {currentRoom.name}
                            </h2>
                            {currentRoom.description && (
                                <p className="text-sm text-gray-600">
                                    {currentRoom.description}
                                </p>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Users className="w-3 h-3 mr-1" />
                                {currentRoom.member_count || 0} membre{(currentRoom.member_count || 0) > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            <Info className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="relative p-4"
                style={{
                    flex: '1 1 0%',
                    overflow: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    maxHeight: '100%'
                }}
                onScroll={handleScroll}
            >
                <div className="space-y-4">
                    <AnimatePresence>
                        {currentMessages.map((message, index) => {
                            const isOwn = message.sender_id === user?.id;
                            const showAvatar = !isOwn && (
                                index === 0 ||
                                currentMessages[index - 1].sender_id !== message.sender_id
                            );
                            const showTimestamp = index === 0 ||
                                new Date(message.created_at).getTime() -
                                new Date(currentMessages[index - 1].created_at).getTime() > 300000;

                            return (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <MessageBubble
                                        message={message}
                                        isOwn={isOwn}
                                        showAvatar={showAvatar}
                                        showTimestamp={showTimestamp}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {currentTypingUsers.length > 0 && (
                        <TypingIndicator users={currentTypingUsers} />
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to Bottom Button */}
                {!isAtBottom && (
                    <div className="absolute bottom-4 right-4 z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Button
                                size="sm"
                                className="rounded-full shadow-lg"
                                onClick={() => {
                                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                    setIsAtBottom(true);
                                }}
                            >
                                ↓
                            </Button>
                        </motion.div>
                    </div>
                )}
            </div>
            {/* Message Input */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    onTypingStart={handleTypingStart}
                    onTypingStop={handleTypingStop}
                    disabled={!currentRoom}
                />
            </div>
        </div>
    );
};

export default ChatWindow;

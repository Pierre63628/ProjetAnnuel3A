import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMobileChat } from '../../contexts/MobileChatContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import PullToRefresh from './PullToRefresh';
import { Button } from '../ui/button';
import {
    MessageCircle,
    Users,
    Hash,
    Settings,
    Phone,
    ArrowLeft
} from 'lucide-react';

const ChatWindow: React.FC = () => {
    const { user } = useAuth();
    const { isMobile, navigateToView, isKeyboardVisible } = useMobileChat();
    const {
        currentRoom,
        messages,
        typingUsers,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
        loadMessages
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

    const handleRefresh = async () => {
        if (currentRoom) {
            await loadMessages(currentRoom.id, 1);
        }
    };

    if (!currentRoom) {
        return (
            <div
                className="flex items-center justify-center w-full"
                style={{ height: '100%' }}
            >
                <motion.div
                    className="text-center px-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <MessageCircle className={`text-gray-400 mx-auto mb-4 ${
                        isMobile ? 'w-12 h-12' : 'w-16 h-16'
                    }`} />
                    <h3 className={`font-semibold text-gray-600 mb-2 ${
                        isMobile ? 'text-lg' : 'text-xl'
                    }`}>
                        {isMobile ? 'Aucun salon sélectionné' : 'Sélectionnez un salon'}
                    </h3>
                    <p className={`text-gray-500 ${
                        isMobile ? 'text-sm' : 'text-base'
                    }`}>
                        {isMobile
                            ? 'Retournez à la liste des salons pour commencer'
                            : 'Choisissez un salon de discussion pour commencer à chatter avec vos voisins.'
                        }
                    </p>
                    {isMobile && (
                        <Button
                            onClick={() => navigateToView('rooms')}
                            className="mt-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voir les salons
                        </Button>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col w-full relative ${
                isMobile && isKeyboardVisible ? 'pb-safe' : ''
            }`}
            style={{
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden'
            }}
        >
            {/* Chat Header - Hidden on mobile (handled by MobileNavigation) */}
            {!isMobile && (
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
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 min-h-0 max-h-full"
                style={{
                    flex: '1 1 0%',
                    minHeight: 0,
                    maxHeight: '100%'
                }}
            >
                {isMobile ? (
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        className={`relative ${isMobile ? 'p-3' : 'p-4'} h-full`}
                    >
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="space-y-4"
                        style={{
                            height: '100%',
                            overflow: 'auto',
                            overflowX: 'hidden',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
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
                </PullToRefresh>
            ) : (
                <div
                    ref={messagesContainerRef}
                    className={`relative ${isMobile ? 'p-3' : 'p-4'} h-full`}
                    style={{
                        overflow: 'auto',
                        overflowX: 'hidden',
                        // Better scrolling on mobile
                        WebkitOverflowScrolling: 'touch'
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

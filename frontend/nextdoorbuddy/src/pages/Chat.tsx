import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useChat } from '../contexts/ChatContext';
import { MobileChatProvider, useMobileChat } from '../contexts/MobileChatContext';
import ChatRoomList from '../components/chat/ChatRoomList';
import ChatWindow from '../components/chat/ChatWindow';
import OnlineUsers from '../components/chat/OnlineUsers';
import NeighborhoodUsers from '../components/chat/NeighborhoodUsers';
import CreateRoomModal from '../components/chat/CreateRoomModal';
import MobileNavigation from '../components/chat/MobileNavigation';
import SwipeGestureHandler from '../components/chat/SwipeGestureHandler';
import UndeliveredMessagesNotification from '../components/chat/UndeliveredMessagesNotification';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    MessageCircle,
    Users,
    Plus,
    Wifi,
    WifiOff,
    AlertCircle
} from 'lucide-react';

// Create a separate component for the chat content to use mobile context
const ChatContent: React.FC = () => {
    const {
        isConnected,
        isConnecting,
        currentRoom,
        chatRooms,
        onlineUsers,
        error,
        clearError,
        connectToChat,
        selectRoom
    } = useChat();

    const {
        currentView,
        isMobile
    } = useMobileChat();

    const [searchParams, setSearchParams] = useSearchParams();
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [userViewMode, setUserViewMode] = useState<'online' | 'neighborhood'>('online');

    // Handle room selection from URL parameter
    useEffect(() => {
        const roomIdParam = searchParams.get('room');
        if (roomIdParam && chatRooms.length > 0) {
            const roomId = parseInt(roomIdParam);
            const targetRoom = chatRooms.find(room => room.id === roomId);

            if (targetRoom && (!currentRoom || currentRoom.id !== roomId)) {
                selectRoom(targetRoom);
                // Clear the URL parameter after selecting the room
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.delete('room');
                    return newParams;
                });
            }
        }
    }, [searchParams, chatRooms, currentRoom, selectRoom, setSearchParams]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={clearError} variant="outline">
                                Ignorer
                            </Button>
                            <Button onClick={connectToChat}>
                                Réessayer
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion au chat...</h2>
                        <p className="text-gray-600">Veuillez patienter pendant que nous établissons la connexion.</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Render mobile view based on current view state
    const renderMobileView = () => {
        switch (currentView) {
            case 'rooms':
                return (
                    <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col">
                        <ChatRoomList
                            rooms={chatRooms}
                            currentRoom={currentRoom}
                            onShowCreateRoom={() => setShowCreateRoom(true)}
                        />
                    </Card>
                );
            case 'chat':
                return (
                    <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col overflow-hidden">
                        <ChatWindow />
                    </Card>
                );
            case 'users':
                return (
                    <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col">
                        {userViewMode === 'online' ? (
                            <OnlineUsers
                                users={onlineUsers}
                                currentRoom={currentRoom}
                                onToggleView={() => setUserViewMode('neighborhood')}
                                showToggle={isMobile}
                            />
                        ) : (
                            <NeighborhoodUsers
                                currentRoom={currentRoom}
                                onToggleView={() => setUserViewMode('online')}
                                showToggle={isMobile}
                            />
                        )}
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />

            {/* Mobile Navigation */}
            {isMobile && <MobileNavigation />}

            <div className={`container mx-auto px-4 max-w-7xl flex flex-col ${
                isMobile
                    ? 'h-[calc(100vh-80px)] py-0' // Account for mobile nav only (no bottom tabs)
                    : 'h-[calc(100vh-60px)] py-6'
            }`}>
                {/* Desktop Header - Hidden on mobile */}
                {!isMobile && (
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Chat du quartier</h1>
                                <div className="flex items-center mt-1">
                                    {isConnected ? (
                                        <>
                                            <Wifi className="w-4 h-4 text-green-500 mr-2" />
                                            <span className="text-green-600 text-sm font-medium">Connecté</span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="w-4 h-4 text-red-500 mr-2" />
                                            <span className="text-red-600 text-sm font-medium">
                                                {isConnecting ? 'Connexion...' : 'Déconnecté'}
                                            </span>
                                        </>
                                    )}
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="text-gray-600 text-sm">
                                        {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} en ligne
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2">
                                <Button
                                    variant={userViewMode === 'online' ? 'solid' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setUserViewMode('online');
                                        setShowOnlineUsers(true);
                                    }}
                                >
                                    <Wifi className="w-4 h-4 mr-2" />
                                    En ligne ({onlineUsers.length})
                                </Button>
                                <Button
                                    variant={userViewMode === 'neighborhood' ? 'solid' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setUserViewMode('neighborhood');
                                        setShowOnlineUsers(true);
                                    }}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Voisins
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCreateRoom(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau salon
                            </Button>

                        </div>
                    </div>
                    </motion.div>
                )}
                <div className="flex-1 min-h-0">
                    {isMobile ? (
                        /* Mobile Single-Column Layout with Swipe Gestures */
                        <SwipeGestureHandler className="h-full">
                            <motion.div
                                className="h-full"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                key={currentView} // Re-animate on view change
                            >
                                {renderMobileView()}
                            </motion.div>
                        </SwipeGestureHandler>
                    ) : (
                        /* Desktop Multi-Column Layout */
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
                            <motion.div
                                className="lg:col-span-1 h-full min-h-0"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col">
                                    <ChatRoomList
                                        rooms={chatRooms}
                                        currentRoom={currentRoom}
                                        onShowCreateRoom={() => setShowCreateRoom(true)}
                                    />
                                </Card>
                            </motion.div>
                            <motion.div
                                className="lg:col-span-2 h-full min-h-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col overflow-hidden">
                                    <ChatWindow />
                                </Card>
                            </motion.div>
                            <motion.div
                                className={`lg:col-span-1 h-full min-h-0 ${showOnlineUsers || currentRoom ? 'block' : 'hidden lg:block'}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card className="h-full min-h-0 shadow-lg border-0 bg-white/90 backdrop-blur-sm flex flex-col">
                                    {userViewMode === 'online' ? (
                                        <OnlineUsers
                                            users={onlineUsers}
                                            currentRoom={currentRoom}
                                            onToggleView={() => setUserViewMode('neighborhood')}
                                            showToggle={false}
                                        />
                                    ) : (
                                        <NeighborhoodUsers
                                            currentRoom={currentRoom}
                                            onToggleView={() => setUserViewMode('online')}
                                            showToggle={false}
                                        />
                                    )}
                                </Card>
                            </motion.div>
                        </div>
                    )}
                </div>
                {/* Desktop floating button - hidden on mobile since navigation is via hamburger menu */}
                {!isMobile && (
                    <div className="lg:hidden fixed bottom-4 right-4">
                        <Button
                            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                            className="rounded-full w-14 h-14 shadow-lg"
                            size="lg"
                        >
                            <Users className="w-6 h-6" />
                        </Button>
                    </div>
                )}

                <CreateRoomModal
                    isOpen={showCreateRoom}
                    onClose={() => setShowCreateRoom(false)}
                />

                {/* Undelivered Messages Notification */}
                <UndeliveredMessagesNotification />
            </div>
        </div>
    );
};

// Main Chat component wrapped with MobileChatProvider
const Chat: React.FC = () => {
    return (
        <MobileChatProvider>
            <ChatContent />
        </MobileChatProvider>
    );
};

export default Chat;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useChat } from '../contexts/ChatContext';
import ChatRoomList from '../components/chat/ChatRoomList';
import ChatWindow from '../components/chat/ChatWindow';
import OnlineUsers from '../components/chat/OnlineUsers';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
    MessageCircle, 
    Users, 
    Settings, 
    Plus,
    Wifi,
    WifiOff,
    AlertCircle
} from 'lucide-react';

const Chat: React.FC = () => {
    const { 
        isConnected, 
        isConnecting, 
        currentRoom, 
        chatRooms, 
        onlineUsers,
        error,
        clearError,
        connectToChat
    } = useChat();
    
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Header */}
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
                                            <span className="text-red-600 text-sm font-medium">Déconnecté</span>
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                                className="hidden md:flex"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                En ligne ({onlineUsers.length})
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCreateRoom(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau salon
                            </Button>
                            
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Main Chat Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                    {/* Chat Rooms List */}
                    <motion.div 
                        className="lg:col-span-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="h-full shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <ChatRoomList 
                                rooms={chatRooms}
                                currentRoom={currentRoom}
                                onShowCreateRoom={() => setShowCreateRoom(true)}
                            />
                        </Card>
                    </motion.div>

                    {/* Chat Window */}
                    <motion.div 
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="h-full shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <ChatWindow />
                        </Card>
                    </motion.div>

                    {/* Online Users / Room Info */}
                    <motion.div 
                        className={`lg:col-span-1 ${showOnlineUsers || currentRoom ? 'block' : 'hidden lg:block'}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="h-full shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <OnlineUsers 
                                users={onlineUsers}
                                currentRoom={currentRoom}
                            />
                        </Card>
                    </motion.div>
                </div>

                {/* Mobile Online Users Toggle */}
                <div className="lg:hidden fixed bottom-4 right-4">
                    <Button
                        onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                        className="rounded-full w-14 h-14 shadow-lg"
                        size="lg"
                    >
                        <Users className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Chat;

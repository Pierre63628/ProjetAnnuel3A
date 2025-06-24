import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { ChatRoom } from '../../types/messaging.types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
    Hash, 
    Users, 
    Plus, 
    Search, 
    MessageCircle,
    Clock,
    User
} from 'lucide-react';

interface ChatRoomListProps {
    rooms: ChatRoom[];
    currentRoom: ChatRoom | null;
    onShowCreateRoom: () => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({ 
    rooms, 
    currentRoom, 
    onShowCreateRoom 
}) => {
    const { selectRoom } = useChat();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatLastMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return diffInMinutes < 1 ? 'À l\'instant' : `${diffInMinutes}m`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}j`;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Salons de discussion
                    </h2>
                    <Button
                        size="sm"
                        onClick={onShowCreateRoom}
                        className="shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher un salon..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Rooms List */}
            <div className="flex-1 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                    <div className="p-6 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">
                            {searchTerm ? 'Aucun salon trouvé' : 'Aucun salon disponible'}
                        </p>
                        {!searchTerm && (
                            <Button
                                size="sm"
                                onClick={onShowCreateRoom}
                                className="mt-3"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un salon
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        {filteredRooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <Card
                                    className={`mb-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        currentRoom?.id === room.id
                                            ? 'bg-blue-50 border-blue-200 shadow-md'
                                            : 'bg-white hover:bg-gray-50 border-gray-200'
                                    }`}
                                    onClick={() => selectRoom(room)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-1">
                                                    {room.room_type === 'group' ? (
                                                        <Hash className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                                                    )}
                                                    <h3 className={`font-medium truncate ${
                                                        currentRoom?.id === room.id
                                                            ? 'text-blue-900'
                                                            : 'text-gray-900'
                                                    }`}>
                                                        {room.name}
                                                    </h3>
                                                </div>

                                                {room.last_message && (
                                                    <div className="flex items-center text-xs text-gray-600 mb-1">
                                                        <span className="font-medium mr-1">
                                                            {room.last_message.sender?.prenom}:
                                                        </span>
                                                        <span className="truncate flex-1">
                                                            {room.last_message.content}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {room.member_count || 0}
                                                    </div>
                                                    {room.last_message && (
                                                        <div className="flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {formatLastMessageTime(room.last_message.created_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unread count */}
                                            {room.unread_count && room.unread_count > 0 && (
                                                <div className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                                    {room.unread_count > 99 ? '99+' : room.unread_count}
                                                </div>
                                            )}
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
                    {filteredRooms.length} salon{filteredRooms.length > 1 ? 's' : ''} disponible{filteredRooms.length > 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
};

export default ChatRoomList;

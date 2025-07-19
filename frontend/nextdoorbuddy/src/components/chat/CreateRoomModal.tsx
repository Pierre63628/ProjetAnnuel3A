import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useChat } from '../../contexts/ChatContext';
import messagingService from '../../services/messaging.service';
import { 
    X, 
    Hash, 
    Users, 
    MessageCircle,
    Plus
} from 'lucide-react';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const { selectRoom, refreshChatRooms } = useChat();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        room_type: 'group' as 'group' | 'direct'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('Le nom du salon est requis');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const newRoom = await messagingService.createChatRoom({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                room_type: formData.room_type,
                member_ids: []
            });

            // Refresh the chat rooms list to include the new room
            await refreshChatRooms();

            // Select the new room
            selectRoom(newRoom);

            // Reset form and close modal
            setFormData({ name: '', description: '', room_type: 'group' });
            onClose();
        } catch (err) {
            console.error('Failed to create room:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la création du salon');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setFormData({ name: '', description: '', room_type: 'group' });
            setError('');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Card className="shadow-xl">
                            <CardContent className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <MessageCircle className="w-6 h-6 text-blue-600 mr-3" />
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Créer un nouveau salon
                                        </h2>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="p-1"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Room Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type de salon
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, room_type: 'group' }))}
                                                className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${
                                                    formData.room_type === 'group'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                                disabled={isLoading}
                                            >
                                                <Hash className="w-4 h-4 mr-2" />
                                                Groupe
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, room_type: 'direct' }))}
                                                className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${
                                                    formData.room_type === 'direct'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                                disabled={isLoading}
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                Privé
                                            </button>
                                        </div>
                                    </div>

                                    {/* Room Name */}
                                    <div>
                                        <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom du salon *
                                        </label>
                                        <input
                                            id="roomName"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Entrez le nom du salon"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={isLoading}
                                            maxLength={255}
                                            required
                                        />
                                    </div>

                                    {/* Room Description */}
                                    <div>
                                        <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (optionnel)
                                        </label>
                                        <textarea
                                            id="roomDescription"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Décrivez le sujet du salon"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            disabled={isLoading}
                                            maxLength={1000}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClose}
                                            disabled={isLoading}
                                            className="flex-1"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !formData.name.trim()}
                                            className="flex-1"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Création...
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Créer
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateRoomModal;

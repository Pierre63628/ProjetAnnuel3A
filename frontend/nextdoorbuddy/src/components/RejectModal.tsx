import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, X } from 'lucide-react';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    articleTitle: string;
}

const RejectModal: React.FC<RejectModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    articleTitle
}) => {
    const [comment, setComment] = useState('');

    const handleConfirm = () => {
        if (comment.trim()) {
            onConfirm(comment.trim());
            setComment('');
            onClose();
        }
    };

    const handleClose = () => {
        setComment('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={handleClose}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Rejeter l'article
                                    </h3>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Vous êtes sur le point de rejeter l'article <strong>"{articleTitle}"</strong>.
                                </p>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Veuillez fournir un commentaire expliquant les raisons du rejet :
                                </p>
                                
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Commentaire de rejet (obligatoire)..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    rows={4}
                                    autoFocus
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-6 border-t border-gray-200">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!comment.trim()}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        comment.trim() 
                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Rejeter
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RejectModal; 
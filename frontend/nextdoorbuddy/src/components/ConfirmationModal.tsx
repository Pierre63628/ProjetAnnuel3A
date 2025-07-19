import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'danger'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
                    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
                    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                };
            case 'info':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
                    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                };
            default:
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
                    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                };
        }
    };

    const styles = getTypeStyles();

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
                        onClick={onClose}
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
                                    {styles.icon}
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-gray-600 leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-6 border-t border-gray-200">
                                <button
                                    onClick={onClose}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${styles.cancelButton}`}
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${styles.confirmButton}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal; 
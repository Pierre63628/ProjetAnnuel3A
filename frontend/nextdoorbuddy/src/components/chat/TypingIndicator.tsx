import React from 'react';
import { motion } from 'framer-motion';
import { TypingIndicator as TypingIndicatorType } from '../../types/messaging.types';

interface TypingIndicatorProps {
    users: TypingIndicatorType[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
    if (users.length === 0) return null;

    const getTypingText = () => {
        if (users.length === 1) {
            return `${users[0].user.prenom} est en train d'écrire...`;
        } else if (users.length === 2) {
            return `${users[0].user.prenom} et ${users[1].user.prenom} sont en train d'écrire...`;
        } else {
            return `${users[0].user.prenom} et ${users.length - 1} autres sont en train d'écrire...`;
        }
    };

    return (
        <motion.div
            className="flex items-center space-x-2 text-sm text-gray-600 px-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex space-x-1">
                <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
            </div>
            <span className="italic">{getTypingText()}</span>
        </motion.div>
    );
};

export default TypingIndicator;

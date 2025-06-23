import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
    Send, 
    Paperclip, 
    Smile, 
    Image, 
    Mic,
    X
} from 'lucide-react';

interface MessageInputProps {
    onSendMessage: (content: string, replyToId?: number) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    disabled?: boolean;
    replyTo?: {
        id: number;
        content: string;
        sender: string;
    } | null;
    onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onTypingStart,
    onTypingStop,
    disabled = false,
    replyTo,
    onCancelReply
}) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    // Handle typing indicators
    useEffect(() => {
        if (message.trim() && !isTyping) {
            setIsTyping(true);
            onTypingStart();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                onTypingStop();
            }
        }, 1000);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [message, isTyping, onTypingStart, onTypingStop]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (message.trim() && !disabled) {
            onSendMessage(message.trim(), replyTo?.id);
            setMessage('');
            
            // Stop typing indicator
            if (isTyping) {
                setIsTyping(false);
                onTypingStop();
            }
            
            // Clear reply
            if (onCancelReply) {
                onCancelReply();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    };

    return (
        <div className="p-4">
            {/* Reply indicator */}
            {replyTo && (
                <div className="mb-3 p-3 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                                Répondre à {replyTo.sender}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                                {replyTo.content}
                            </div>
                        </div>
                        {onCancelReply && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onCancelReply}
                                className="ml-2 p-1 h-auto"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Message input form */}
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
                {/* Attachment button */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 mb-1"
                    disabled={disabled}
                >
                    <Paperclip className="w-4 h-4" />
                </Button>

                {/* Message input container */}
                <div className="flex-1 relative">
                    <div className="relative bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={disabled ? "Connexion en cours..." : "Tapez votre message..."}
                            disabled={disabled}
                            className="w-full px-4 py-3 pr-12 resize-none border-0 rounded-lg focus:outline-none focus:ring-0 placeholder-gray-500"
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        
                        {/* Emoji button */}
                        <div className="absolute right-3 bottom-3 flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto text-gray-500 hover:text-gray-700"
                                disabled={disabled}
                            >
                                <Smile className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Additional action buttons */}
                <div className="flex items-center gap-2 mb-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                    >
                        <Image className="w-4 h-4" />
                    </Button>
                    
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                    >
                        <Mic className="w-4 h-4" />
                    </Button>
                </div>

                {/* Send button */}
                <Button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="flex-shrink-0 mb-1"
                    size="sm"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>

            {/* Character count or other info */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div>
                    {isTyping && <span className="text-blue-600">En train d'écrire...</span>}
                </div>
                <div>
                    {message.length > 0 && (
                        <span className={message.length > 1000 ? 'text-red-500' : ''}>
                            {message.length}/1000
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageInput;

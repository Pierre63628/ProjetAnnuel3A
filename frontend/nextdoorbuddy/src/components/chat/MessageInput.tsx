import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useMobileChat } from '../../contexts/MobileChatContext';
import {
    Send,
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
    const { isMobile, isKeyboardVisible, setKeyboardVisible } = useMobileChat();
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const maxHeight = isMobile ? 100 : 120; // Smaller max height on mobile
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
        }
    }, [message, isMobile]);

    // Handle virtual keyboard visibility on mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleFocus = () => {
            setKeyboardVisible(true);
            // Scroll to input on mobile when keyboard appears
            setTimeout(() => {
                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        };

        const handleBlur = () => {
            setKeyboardVisible(false);
        };

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('focus', handleFocus);
            textarea.addEventListener('blur', handleBlur);

            return () => {
                textarea.removeEventListener('focus', handleFocus);
                textarea.removeEventListener('blur', handleBlur);
            };
        }
    }, [isMobile, setKeyboardVisible]);

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
        <div className={`${isMobile ? 'p-3' : 'p-4'} ${
            isMobile && isKeyboardVisible ? 'pb-safe' : ''
        }`}>
            {/* Reply indicator */}
            {replyTo && (
                <div className={`mb-3 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg ${
                    isMobile ? 'p-2' : 'p-3'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className={`font-medium text-gray-700 mb-1 ${
                                isMobile ? 'text-base' : 'text-sm'
                            }`}>
                                Répondre à {replyTo.sender}
                            </div>
                            <div className={`text-gray-600 truncate ${
                                isMobile ? 'text-sm' : 'text-sm'
                            }`}>
                                {replyTo.content}
                            </div>
                        </div>
                        {onCancelReply && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onCancelReply}
                                className={`ml-2 ${
                                    isMobile ? 'p-2 min-h-[44px] min-w-[44px]' : 'p-1 h-auto'
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Message input form */}
            <form onSubmit={handleSubmit} className={`flex items-end ${
                isMobile ? 'gap-2' : 'gap-3'
            }`}>


                {/* Message input container */}
                <div className="flex-1 relative">
                    <div className="relative bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={disabled ? "Connexion en cours..." : (isMobile ? "Message..." : "Tapez votre message...")}
                            disabled={disabled}
                            className={`w-full pr-12 resize-none border-0 rounded-lg focus:outline-none focus:ring-0 placeholder-gray-500 ${
                                isMobile
                                    ? 'px-3 py-3 text-base' // Larger touch target and text on mobile
                                    : 'px-4 py-3 text-sm'
                            }`}
                            rows={1}
                            style={{
                                minHeight: '44px',
                                maxHeight: isMobile ? '100px' : '120px',
                                fontSize: isMobile ? '16px' : '14px' // Prevent zoom on iOS
                            }}
                        />

                    </div>
                </div>



                {/* Send button */}
                <Button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className={`flex-shrink-0 mb-1 ${
                        isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                    }`}
                    size={isMobile ? "lg" : "sm"}
                >
                    <Send className="w-4 h-4" />
                    {!isMobile && <span className="ml-2">Envoyer</span>}
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messagingService } from '../services/messaging.service';
import { Button } from './ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';

interface ContactButtonProps {
    targetUserId: number;
    targetUserName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'outline' | 'destructive' | 'accent';
    disabled?: boolean;
    showIcon?: boolean;
    children?: React.ReactNode;
}

const ContactButton: React.FC<ContactButtonProps> = ({
    targetUserId,
    targetUserName,
    className = '',
    size = 'sm',
    variant = 'solid',
    disabled = false,
    showIcon = true,
    children
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Don't show contact button for user's own posts
    if (!user || user.id === targetUserId) {
        return null;
    }

    const handleContact = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault(); // Prevent any parent link navigation
            e.stopPropagation(); // Stop event bubbling
        }

        if (isLoading || disabled) return;

        setIsLoading(true);
        setError(null);

        try {
            // Create or get existing direct message room
            const room = await messagingService.createOrGetDirectMessage(targetUserId);

            // Navigate to chat page with the room selected
            // We'll pass the room ID as a URL parameter
            navigate(`/chat?room=${room.id}`);
        } catch (err) {
            console.error('Failed to create direct message:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la création de la conversation');

            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <Button
                onClick={handleContact}
                disabled={isLoading || disabled}
                size={size}
                variant={variant}
                className={`transition-colors ${className}`}
                title={targetUserName ? `Contacter ${targetUserName}` : 'Contacter'}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    showIcon && <MessageCircle className="w-4 h-4" />
                )}
                {!isLoading && (
                    <span className={showIcon ? 'ml-2' : ''}>
                        {children || 'Contacter'}
                    </span>
                )}
            </Button>
            
            {/* Error message */}
            {error && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ContactButton;

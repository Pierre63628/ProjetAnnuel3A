import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface UserAvatarProps {
    user?: {
        nom: string;
        prenom: string;
        profile_picture?: string;
    } | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    showOnlineStatus?: boolean;
    isOnline?: boolean;
    onClick?: () => void;
    fallbackIcon?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    user,
    size = 'md',
    className = '',
    showOnlineStatus = false,
    isOnline = false,
    onClick,
    fallbackIcon = false
}) => {
    const [imageError, setImageError] = useState(false);

    // Size configurations
    const sizeConfig = {
        xs: { 
            container: 'w-6 h-6', 
            text: 'text-xs', 
            icon: 'w-3 h-3',
            status: 'w-2 h-2 -bottom-0.5 -right-0.5'
        },
        sm: { 
            container: 'w-8 h-8', 
            text: 'text-xs', 
            icon: 'w-4 h-4',
            status: 'w-3 h-3 -bottom-0.5 -right-0.5'
        },
        md: { 
            container: 'w-10 h-10', 
            text: 'text-sm', 
            icon: 'w-5 h-5',
            status: 'w-3 h-3 -bottom-0.5 -right-0.5'
        },
        lg: { 
            container: 'w-12 h-12', 
            text: 'text-base', 
            icon: 'w-6 h-6',
            status: 'w-4 h-4 -bottom-1 -right-1'
        },
        xl: { 
            container: 'w-16 h-16', 
            text: 'text-lg', 
            icon: 'w-8 h-8',
            status: 'w-4 h-4 -bottom-1 -right-1'
        },
        '2xl': { 
            container: 'w-20 h-20', 
            text: 'text-xl', 
            icon: 'w-10 h-10',
            status: 'w-5 h-5 -bottom-1 -right-1'
        }
    };

    const config = sizeConfig[size];

    // Get user initials for fallback
    const getInitials = (nom: string, prenom: string) => {
        if (!nom && !prenom) return '?';

        // Safely get initials with proper string checking
        const firstInitial = (prenom && typeof prenom === 'string' && prenom.length > 0) ? prenom.charAt(0) : '';
        const lastInitial = (nom && typeof nom === 'string' && nom.length > 0) ? nom.charAt(0) : '';

        const initials = firstInitial + lastInitial;
        return initials.length > 0 ? initials.toUpperCase() : '?';
    };

    // Get profile picture URL
    const getProfilePictureUrl = () => {
        if (!user?.profile_picture || imageError) return null;
        return getImageUrl(user.profile_picture);
    };

    const profilePictureUrl = getProfilePictureUrl();
    const userInitials = user ? getInitials(user.nom || '', user.prenom || '') : '?';

    // Handle image load error
    const handleImageError = () => {
        setImageError(true);
    };

    // Generate gradient colors based on user name
    const getGradientColors = () => {
        if (!user) return 'from-gray-400 to-gray-500';

        const name = `${user.prenom || ''}${user.nom || ''}`.toLowerCase();
        if (!name || name.length === 0) return 'from-gray-400 to-gray-500';

        const hash = name.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        const gradients = [
            'from-blue-500 to-purple-600',
            'from-green-500 to-blue-600',
            'from-purple-500 to-pink-600',
            'from-yellow-500 to-orange-600',
            'from-red-500 to-pink-600',
            'from-indigo-500 to-purple-600',
            'from-teal-500 to-cyan-600',
            'from-orange-500 to-red-600',
            'from-cyan-500 to-blue-600',
            'from-pink-500 to-rose-600'
        ];
        
        return gradients[Math.abs(hash) % gradients.length];
    };

    const gradientColors = getGradientColors();

    return (
        <div className={`relative inline-block ${className}`}>
            <div 
                className={`
                    ${config.container} 
                    rounded-full 
                    overflow-hidden 
                    bg-gradient-to-br ${gradientColors}
                    flex items-center justify-center 
                    text-white font-medium
                    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                    border-2 border-white shadow-sm
                `}
                onClick={onClick}
            >
                {profilePictureUrl ? (
                    <img
                        src={profilePictureUrl}
                        alt={user ? `${user.prenom} ${user.nom}` : 'Avatar'}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : fallbackIcon ? (
                    <User className={`${config.icon} text-white`} />
                ) : (
                    <span className={`${config.text} font-bold`}>
                        {userInitials}
                    </span>
                )}
            </div>

            {/* Online status indicator */}
            {showOnlineStatus && (
                <div className={`absolute ${config.status} rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
            )}
        </div>
    );
};

export default UserAvatar;

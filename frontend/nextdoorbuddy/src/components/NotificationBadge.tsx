import React from 'react';

interface NotificationBadgeProps {
    count: number;
    className?: string;
    maxCount?: number;
    showZero?: boolean;
    size?: 'sm' | 'md' | 'lg';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    count,
    className = '',
    maxCount = 99,
    showZero = false,
    size = 'sm',
    position = 'top-right'
}) => {
    // Don't render if count is 0 and showZero is false
    if (count === 0 && !showZero) {
        return null;
    }

    // Format count display
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

    // Size classes
    const sizeClasses = {
        sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
        md: 'min-w-[20px] h-[20px] text-xs px-1.5',
        lg: 'min-w-[24px] h-[24px] text-sm px-2'
    };

    // Position classes
    const positionClasses = {
        'top-right': '-top-1 -right-1',
        'top-left': '-top-1 -left-1',
        'bottom-right': '-bottom-1 -right-1',
        'bottom-left': '-bottom-1 -left-1'
    };

    return (
        <span
            className={`
                absolute
                ${positionClasses[position]}
                ${sizeClasses[size]}
                bg-red-500
                text-white
                font-bold
                rounded-full
                flex
                items-center
                justify-center
                border-2
                border-white
                shadow-sm
                z-10
                ${className}
            `}
            aria-label={`${count} unread notifications`}
        >
            {displayCount}
        </span>
    );
};

export default NotificationBadge;

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useMobileChat } from '../../contexts/MobileChatContext';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
    className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
    children, 
    onRefresh, 
    className = '' 
}) => {
    const { isMobile } = useMobileChat();
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    
    const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const maxPullDistance = 80;
    const triggerDistance = 60;

    useEffect(() => {
        if (!isMobile) return;

        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            const scrollTop = container.scrollTop;
            
            // Only start pull-to-refresh if we're at the top
            if (scrollTop === 0) {
                touchStartRef.current = {
                    y: touch.clientY,
                    scrollTop
                };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const deltaY = touch.clientY - touchStartRef.current.y;
            
            // Only handle downward pulls when at the top
            if (deltaY > 0 && container.scrollTop === 0) {
                e.preventDefault();
                
                const distance = Math.min(deltaY * 0.5, maxPullDistance);
                setPullDistance(distance);
                setIsPulling(distance > 10);
            }
        };

        const handleTouchEnd = async () => {
            if (!touchStartRef.current) return;

            if (pullDistance >= triggerDistance && !isRefreshing) {
                setIsRefreshing(true);
                try {
                    await onRefresh();
                } catch (error) {
                    console.error('Refresh failed:', error);
                } finally {
                    setIsRefreshing(false);
                }
            }

            // Reset state
            touchStartRef.current = null;
            setIsPulling(false);
            setPullDistance(0);
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, onRefresh, pullDistance, isRefreshing]);

    if (!isMobile) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            style={{
                WebkitOverflowScrolling: 'touch',
                transform: `translateY(${pullDistance}px)`,
                transition: isPulling ? 'none' : 'transform 0.3s ease-out'
            }}
        >
            {/* Pull to refresh indicator */}
            <AnimatePresence>
                {(isPulling || isRefreshing) && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-blue-50 border-b border-blue-100"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: -pullDistance }}
                        exit={{ opacity: 0, y: -50 }}
                        style={{
                            transform: `translateY(-100%)`,
                        }}
                    >
                        <div className="flex items-center space-x-2 text-blue-600">
                            <RefreshCw 
                                className={`w-5 h-5 ${
                                    isRefreshing ? 'animate-spin' : ''
                                } ${
                                    pullDistance >= triggerDistance ? 'text-blue-600' : 'text-gray-400'
                                }`}
                            />
                            <span className={`text-sm font-medium ${
                                pullDistance >= triggerDistance ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                                {isRefreshing 
                                    ? 'Actualisation...' 
                                    : pullDistance >= triggerDistance 
                                        ? 'Relâchez pour actualiser'
                                        : 'Tirez pour actualiser'
                                }
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}
        </div>
    );
};

export default PullToRefresh;

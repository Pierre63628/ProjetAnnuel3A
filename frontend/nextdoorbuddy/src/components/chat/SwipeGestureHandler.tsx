import React, { useRef, useEffect } from 'react';
import { useMobileChat, MobileChatView } from '../../contexts/MobileChatContext';

interface SwipeGestureHandlerProps {
    children: React.ReactNode;
    className?: string;
}

const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = ({ 
    children, 
    className = '' 
}) => {
    const { 
        currentView, 
        navigateToView, 
        isSwipeEnabled, 
        isMobile 
    } = useMobileChat();
    
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isMobile || !isSwipeEnabled) return;

        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;

            // Reset touch start
            touchStartRef.current = null;

            // Check if it's a valid swipe (not too slow, not too vertical)
            const minSwipeDistance = 50;
            const maxSwipeTime = 300;
            const maxVerticalDistance = 100;

            if (
                Math.abs(deltaX) < minSwipeDistance ||
                deltaTime > maxSwipeTime ||
                Math.abs(deltaY) > maxVerticalDistance
            ) {
                return;
            }

            // Determine swipe direction and navigate accordingly
            const isSwipeRight = deltaX > 0;
            
            // Define navigation flow: rooms -> chat -> users
            const viewOrder: MobileChatView[] = ['rooms', 'chat', 'users'];
            const currentIndex = viewOrder.indexOf(currentView);

            if (isSwipeRight && currentIndex > 0) {
                // Swipe right: go to previous view
                navigateToView(viewOrder[currentIndex - 1]);
            } else if (!isSwipeRight && currentIndex < viewOrder.length - 1) {
                // Swipe left: go to next view
                navigateToView(viewOrder[currentIndex + 1]);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // Prevent default scrolling during horizontal swipes
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

            // If horizontal movement is greater than vertical, prevent default
            if (deltaX > deltaY && deltaX > 10) {
                e.preventDefault();
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [currentView, navigateToView, isSwipeEnabled, isMobile]);

    if (!isMobile) {
        return <>{children}</>;
    }

    return (
        <div 
            ref={containerRef}
            className={`touch-pan-y ${className}`}
            style={{
                touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal gestures
            }}
        >
            {children}
        </div>
    );
};

export default SwipeGestureHandler;

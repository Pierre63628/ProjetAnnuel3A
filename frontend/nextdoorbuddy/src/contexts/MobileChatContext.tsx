import React, { createContext, useContext, useState, useCallback } from 'react';

export type MobileChatView = 'rooms' | 'chat' | 'users';

interface MobileChatContextType {
    // Current mobile view state
    currentView: MobileChatView;
    
    // Navigation history for back button functionality
    viewHistory: MobileChatView[];
    
    // Navigation actions
    navigateToView: (view: MobileChatView) => void;
    goBack: () => void;
    canGoBack: boolean;
    
    // Mobile-specific UI state
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    
    // Touch gesture state
    isSwipeEnabled: boolean;
    setSwipeEnabled: (enabled: boolean) => void;
    
    // Virtual keyboard handling
    isKeyboardVisible: boolean;
    setKeyboardVisible: (visible: boolean) => void;
    
    // Mobile breakpoint detection
    isMobile: boolean;
    isTablet: boolean;
}

const MobileChatContext = createContext<MobileChatContextType | undefined>(undefined);

export const useMobileChat = () => {
    const context = useContext(MobileChatContext);
    if (context === undefined) {
        throw new Error('useMobileChat must be used within a MobileChatProvider');
    }
    return context;
};

interface MobileChatProviderProps {
    children: React.ReactNode;
}

export const MobileChatProvider: React.FC<MobileChatProviderProps> = ({ children }) => {
    const [currentView, setCurrentView] = useState<MobileChatView>('rooms');
    const [viewHistory, setViewHistory] = useState<MobileChatView[]>(['rooms']);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Detect mobile and tablet breakpoints
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

    // Handle window resize for responsive breakpoints
    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle virtual keyboard visibility (iOS Safari and Android)
    React.useEffect(() => {
        const handleViewportChange = () => {
            const viewport = window.visualViewport;
            if (viewport) {
                const isKeyboard = viewport.height < window.innerHeight * 0.75;
                setIsKeyboardVisible(isKeyboard);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            return () => {
                window.visualViewport?.removeEventListener('resize', handleViewportChange);
            };
        }
    }, []);

    const navigateToView = useCallback((view: MobileChatView) => {
        if (view === currentView) return;

        setViewHistory(prev => {
            // Remove any existing instances of this view from history
            const filteredHistory = prev.filter(v => v !== view);
            // Add current view to history if it's not already there
            if (currentView && !filteredHistory.includes(currentView)) {
                filteredHistory.push(currentView);
            }
            return filteredHistory;
        });

        setCurrentView(view);
        setIsMobileMenuOpen(false); // Close mobile menu when navigating
    }, [currentView]);

    const goBack = useCallback(() => {
        if (viewHistory.length > 0) {
            const previousView = viewHistory[viewHistory.length - 1];
            setViewHistory(prev => prev.slice(0, -1));
            setCurrentView(previousView);
        } else {
            // Default fallback to rooms view
            setCurrentView('rooms');
        }
    }, [viewHistory]);

    const canGoBack = viewHistory.length > 0;

    const setMobileMenuOpen = useCallback((open: boolean) => {
        setIsMobileMenuOpen(open);
    }, []);

    const setSwipeEnabled = useCallback((enabled: boolean) => {
        setIsSwipeEnabled(enabled);
    }, []);

    const setKeyboardVisible = useCallback((visible: boolean) => {
        setIsKeyboardVisible(visible);
    }, []);

    const value: MobileChatContextType = {
        currentView,
        viewHistory,
        navigateToView,
        goBack,
        canGoBack,
        isMobileMenuOpen,
        setMobileMenuOpen,
        isSwipeEnabled,
        setSwipeEnabled,
        isKeyboardVisible,
        setKeyboardVisible,
        isMobile,
        isTablet
    };

    return (
        <MobileChatContext.Provider value={value}>
            {children}
        </MobileChatContext.Provider>
    );
};

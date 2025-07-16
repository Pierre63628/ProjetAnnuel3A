import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { useMobileChat, MobileChatView } from '../../contexts/MobileChatContext';
import { useChat } from '../../contexts/ChatContext';
import {
    ArrowLeft,
    MessageSquare,
    Users,
    Hash,
    Menu,
    X,
    ChevronRight
} from 'lucide-react';

interface MobileNavigationProps {
    className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ className = '' }) => {
    const {
        currentView,
        navigateToView,
        goBack,
        canGoBack,
        isMobileMenuOpen,
        setMobileMenuOpen,
        isMobile
    } = useMobileChat();
    
    const { currentRoom, onlineUsers } = useChat();

    if (!isMobile) return null;

    const getViewTitle = () => {
        switch (currentView) {
            case 'rooms':
                return 'Salons de discussion';
            case 'chat':
                return currentRoom?.name || 'Chat';
            case 'users':
                return 'Utilisateurs';
            default:
                return 'Chat';
        }
    };

    const getViewIcon = () => {
        switch (currentView) {
            case 'rooms':
                return <Hash className="w-5 h-5" />;
            case 'chat':
                return <MessageSquare className="w-5 h-5" />;
            case 'users':
                return <Users className="w-5 h-5" />;
            default:
                return <MessageSquare className="w-5 h-5" />;
        }
    };

    const navigationItems: { view: MobileChatView; label: string; icon: React.ReactNode; badge?: number }[] = [
        {
            view: 'rooms',
            label: 'Salons',
            icon: <Hash className="w-5 h-5" />
        },
        {
            view: 'chat',
            label: 'Messages',
            icon: <MessageSquare className="w-5 h-5" />
        },
        {
            view: 'users',
            label: 'En ligne',
            icon: <Users className="w-5 h-5" />,
            badge: onlineUsers.length
        }
    ];

    return (
        <>
            {/* Top Navigation Bar */}
            <div className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left side - Back button or Menu */}
                    <div className="flex items-center">
                        {canGoBack ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goBack}
                                className="mr-3 p-2 border-0 hover:bg-gray-100"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                                className="mr-3 p-2 border-0 hover:bg-gray-100"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        )}
                    </div>

                    {/* Center - Current view title */}
                    <div className="flex items-center flex-1 min-w-0">
                        {getViewIcon()}
                        <h1 className="ml-2 text-lg font-semibold text-gray-900 truncate">
                            {getViewTitle()}
                        </h1>
                    </div>

                    {/* Right side - View-specific actions */}
                    <div className="flex items-center">
                        {currentView === 'chat' && currentRoom && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateToView('users')}
                                className="p-2 border-0 hover:bg-gray-100"
                            >
                                <Users className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Breadcrumb for chat view */}
                {currentView === 'chat' && currentRoom && (
                    <div className="px-4 pb-2">
                        <div className="flex items-center text-sm text-gray-600">
                            <button
                                onClick={() => navigateToView('rooms')}
                                className="hover:text-blue-600 transition-colors"
                            >
                                Salons
                            </button>
                            <ChevronRight className="w-4 h-4 mx-1" />
                            <span className="text-gray-900 font-medium truncate">
                                {currentRoom.name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black bg-opacity-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <motion.div
                        className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl"
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 border-0 hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4">
                            <nav className="space-y-2">
                                {navigationItems.map((item) => (
                                    <button
                                        key={item.view}
                                        onClick={() => {
                                            navigateToView(item.view);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                            currentView === item.view
                                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            {item.icon}
                                            <span className="ml-3 font-medium">{item.label}</span>
                                        </div>
                                        {item.badge !== undefined && (
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                currentView === item.view
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Bottom Tab Navigation (Alternative) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
                <div className="flex">
                    {navigationItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => navigateToView(item.view)}
                            className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                                currentView === item.view
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            <div className="relative">
                                {item.icon}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MobileNavigation;

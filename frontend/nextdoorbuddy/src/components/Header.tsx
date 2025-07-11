import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import {
    Home,
    Calendar,
    ArrowRightLeft,
    Briefcase,
    Heart,
    MessageCircle,
    User,
    LogOut,
    Sparkles,
    Menu,
    X
} from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const navigationItems = [
        { to: '/', label: t('navigation.home'), icon: Home },
        { to: '/events', label: t('navigation.events'), icon: Calendar },
        { to: '/trocs', label: t('navigation.trocs'), icon: ArrowRightLeft },
        { to: '/services', label: 'Services', icon: Briefcase },
        { to: '/events/my-events', label: t('navigation.myEvents'), icon: Heart },
        { to: '/chat', label: t('navigation.chat'), icon: MessageCircle },
        { to: '/profile', label: t('navigation.profile'), icon: User },
    ];

    const adminNavigationItems = [
        { to: '/admin/dashboard', label: t('navigation.adminDashboard'), icon: Sparkles },
    ];

    return (
        <header className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border-b border-blue-100/50 shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <Link
                            to="/"
                            className="flex items-center space-x-3 group"
                        >
                            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16">
                                <img src="/vite.svg" alt="NextDoor" className="w-16 h-10 sm:w-20 sm:h-12" />
                            </div>
                            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-colors duration-200">
                                Les copains du Quartier
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    {user && (
                        <nav className="hidden lg:flex items-center space-x-1">
                            {navigationItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition-colors duration-200 font-medium group"
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Admin Navigation */}
                            {user.role === 'admin' && (
                                <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-200">
                                    {adminNavigationItems.map((item) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50/80 transition-colors duration-200 text-sm font-medium"
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span className="hidden xl:inline">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </nav>
                    )}

                    {/* Mobile menu button */}
                    {user && (
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    )}

                    {/* User Section */}
                    {user && (
                        <motion.div
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-gray-700 font-medium">
                                    {t('home.greeting')}, <span className="text-blue-600 font-semibold">{user.prenom}</span>
                                </span>
                            </div>

                            <LanguageSelector />

                            <motion.button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="hidden sm:inline">{t('navigation.logout')}</span>
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

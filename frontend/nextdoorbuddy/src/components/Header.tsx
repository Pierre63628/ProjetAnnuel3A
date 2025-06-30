import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    Home,
    Calendar,
    ArrowRightLeft,
    Heart,
    MessageCircle,
    User,
    Users,
    MapPin,
    Settings,
    LogOut,
    Sparkles
} from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigationItems = [
        { to: '/', label: 'Accueil', icon: Home },
        { to: '/events', label: 'Événements', icon: Calendar },
        { to: '/trocs', label: 'Trocs', icon: ArrowRightLeft },
        { to: '/events/my-events', label: 'Mes événements', icon: Heart },
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        { to: '/profile', label: 'Mon Profil', icon: User },
    ];

    const adminNavigationItems = [
        { to: '/admin/dashboard', label: 'Tableau de bord', icon: Sparkles },
    ];

    return (
        <motion.header
            className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border-b border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-6 py-4 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Logo and Brand */}
                    <motion.div
                        className="flex items-center space-x-8"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Link
                            to="/"
                            className="flex items-center space-x-3 group"
                        >
                            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br">
                                <img src="/vite.svg" alt="NextDoor" className="w-28 h-15" />
                            </div>

                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                                Les copains du Quartier
                            </span>
                        </Link>

                        {/* Navigation */}
                        {user && (
                            <nav className="hidden lg:flex items-center space-x-1">
                                {navigationItems.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <motion.div
                                            key={item.to}
                                            whileHover={{ y: -2 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <Link
                                                to={item.to}
                                                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition-all duration-300 font-medium group"
                                            >
                                                <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </motion.div>
                                    );
                                })}

                                {/* Admin Navigation */}
                                {user.role === 'admin' && (
                                    <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-200">
                                        {adminNavigationItems.map((item) => {
                                            const IconComponent = item.icon;
                                            return (
                                                <motion.div
                                                    key={item.to}
                                                    whileHover={{ y: -2 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                >
                                                    <Link
                                                        to={item.to}
                                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50/80 transition-all duration-300 text-sm font-medium group"
                                                    >
                                                        <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="hidden xl:inline">{item.label}</span>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </nav>
                        )}
                    </motion.div>

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
                                    Bonjour, <span className="text-blue-600 font-semibold">{user.prenom}</span>
                                </span>
                            </div>

                            <motion.button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.header>
    );
};

export default Header;

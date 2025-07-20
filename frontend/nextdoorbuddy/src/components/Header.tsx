import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import NotificationBadge from './NotificationBadge';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import logoSvg from '../assets/logo.svg';
import {
<<<<<<< HEAD
    Home,
    Calendar,
    ArrowRightLeft,
    Briefcase,
    Heart,
    MessageCircle,
    User,
    LogOut,
    Sparkles,
    BookOpen,
    Menu,
    X
=======
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
>>>>>>> prod
} from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalUnreadCount } = useUnreadMessageCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

<<<<<<< HEAD
    const navigationItems = [
        { to: '/', label: t('navigation.home'), icon: Home },
        { to: '/events', label: t('navigation.events'), icon: Calendar },
        { to: '/trocs', label: t('navigation.trocs'), icon: ArrowRightLeft },
        { to: '/services', label: 'Services', icon: Briefcase },
        { to: '/events/my-events', label: t('navigation.myEvents'), icon: Heart },
        { to: '/chat', label: t('navigation.chat'), icon: MessageCircle },
        { to: '/journal', label: t('navigation.journal'), icon: BookOpen },
        { to: '/profile', label: t('navigation.profile'), icon: User },
    ];
=======
  const navigationItems = [
    { to: '/', label: t('navigation.home'), icon: Home },
    { to: '/events', label: t('navigation.events'), icon: Calendar },
    { to: '/trocs', label: t('navigation.trocs'), icon: ArrowRightLeft },
    { to: '/services', label: 'Services', icon: Briefcase },
    { to: '/events/my-events', label: t('navigation.myEvents'), icon: Heart },
    { to: '/chat', label: t('navigation.chat'), icon: MessageCircle },
    { to: '/profile', label: t('navigation.profile'), icon: User },
  ];
>>>>>>> prod

  const adminNavigationItems = [
    { to: '/admin/dashboard', label: t('navigation.adminDashboard'), icon: Sparkles },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4 lg:py-5 max-w-9xl">
        <div className="flex items-center justify-between min-h-[50px] lg:min-h-[70px]">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link to="/" className="flex items-center group">
              <img src={logoSvg} alt="Logo" className="w-10 h-10 lg:w-14 lg:h-14" />
              <div className="ml-3 lg:ml-4 flex flex-col"></div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-3 xl:space-x-4">
              {navigationItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition relative"
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {to === '/chat' && totalUnreadCount > 0 && (
                      <NotificationBadge
                        count={totalUnreadCount}
                        size="sm"
                        position="top-right"
                      />
                    )}
                  </div>
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              ))}

              {user.role === 'admin' &&
                adminNavigationItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{label}</span>
                  </Link>
                ))}
            </nav>
          )}

          {/* Right Section */}
          {user && (
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Mobile menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md hover:bg-blue-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* User Greeting */}
              <div className="hidden md:flex items-center px-3 py-1 lg:px-4 lg:py-2 bg-white/60 rounded-lg border border-blue-100 text-sm text-gray-700">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span>
                  {t('home.greeting')},{' '}
                  <span className="font-semibold text-blue-600">{user.prenom}</span>
                </span>
              </div>

              <LanguageSelector />

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium shadow hover:shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-300 group text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline">{t('navigation.logout')}</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden mt-4 border-t border-blue-100 pt-4">
            <nav className="space-y-2">
              {navigationItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg text-base text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition relative"
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {to === '/chat' && totalUnreadCount > 0 && (
                      <NotificationBadge
                        count={totalUnreadCount}
                        size="sm"
                        position="top-right"
                      />
                    )}
                  </div>
                  <span>{label}</span>
                </Link>
              ))}
              {user.role === 'admin' &&
                adminNavigationItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg text-base text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

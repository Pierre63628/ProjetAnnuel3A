import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import logoSvg from '../assets/logo.svg';
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
    BookOpen,
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
        { to: '/journal', label: t('navigation.journal'), icon: BookOpen },
        { to: '/profile', label: t('navigation.profile'), icon: User },
    ];

  const adminNavigationItems = [
    { to: '/admin/dashboard', label: t('navigation.adminDashboard'), icon: Sparkles },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center group">
              <img src={logoSvg} alt="Logo" className="w-10 h-10" />
              <span className="ml-2 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Les copains du Quartier
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-2">
              {navigationItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              ))}

              {user.role === 'admin' && adminNavigationItems.map(({ to, label, icon: Icon }) => (
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

          {/* Right section */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Mobile menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md hover:bg-blue-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* User greeting */}
              <div className="hidden md:flex items-center px-3 py-1 bg-white/60 rounded-md border border-blue-100 text-sm">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span>
                  {t('home.greeting')},{' '}
                  <span className="font-semibold text-blue-600">{user.prenom}</span>
                </span>
              </div>

              <LanguageSelector />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navigation.logout')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden mt-3 border-t border-blue-100 pt-4">
            <nav className="space-y-2">
              {navigationItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              {user.role === 'admin' &&
                adminNavigationItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-md text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition"
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

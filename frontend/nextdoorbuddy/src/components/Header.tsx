import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white p-4 shadow">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        NextDoorBuddy
                    </Link>
                    {user && (
                        <nav className="hidden md:flex space-x-4">
                            <Link to="/" className="text-gray-600 hover:text-blue-600">
                                Accueil
                            </Link>
                            <Link to="/events" className="text-gray-600 hover:text-blue-600">
                                Événements
                            </Link>
                            <Link to="/trocs" className="text-gray-600 hover:text-blue-600">
                                Trocs
                            </Link>
                            <Link to="/events/my-events" className="text-gray-600 hover:text-blue-600">
                                Mes événements
                            </Link>
                            <Link to="/chat" className="text-gray-600 hover:text-blue-600">
                                Chat
                            </Link>
                            <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                                Mon Profil
                            </Link>
                            {user.role === 'admin' && (
                                <>
                                    <Link to="/admin/users" className="text-gray-600 hover:text-blue-600">
                                        Gestion Utilisateurs
                                    </Link>
                                    <Link to="/admin/quartiers" className="text-gray-600 hover:text-blue-600">
                                        Gestion Quartiers
                                    </Link>
                                    <Link to="/admin/trocs" className="text-gray-600 hover:text-blue-600">
                                        Gestion Trocs
                                    </Link>
                                </>
                            )}
                        </nav>
                    )}
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <span className="hidden md:inline text-gray-700">
                            Bonjour, {user.prenom} {user.nom}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                            Déconnexion
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

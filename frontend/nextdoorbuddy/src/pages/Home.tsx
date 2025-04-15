import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            {/* Main content */}
            <main className="container mx-auto p-6">
                <div className="mb-8 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800">
                        Bienvenue sur NextDoorBuddy !
                    </h2>
                    <p className="text-gray-600">
                        Vous êtes maintenant connecté à votre compte. Vous pouvez commencer à explorer votre quartier
                        et à interagir avec vos voisins.
                    </p>
                </div>

                {/* User information */}
                <div className="mb-8 rounded-lg bg-white p-6 shadow">
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">Vos informations</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nom</p>
                            <p className="text-gray-700">{user?.nom}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Prénom</p>
                            <p className="text-gray-700">{user?.prenom}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-gray-700">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Rôle</p>
                            <p className="text-gray-700">{user?.role || 'Utilisateur'}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link to="/profile" className="text-blue-600 hover:text-blue-800 hover:underline">
                            Gérer mon profil
                        </Link>
                    </div>
                </div>

                {/* Admin section */}
                {user?.role === 'admin' && (
                    <div className="rounded-lg bg-blue-50 p-6 shadow">
                        <h3 className="mb-4 text-xl font-semibold text-blue-800">Section Admin</h3>
                        <p className="text-blue-600">
                            Vous avez accès à des fonctionnalités d'administration supplémentaires.
                        </p>
                        <div className="mt-4 flex space-x-4">
                            <Link to="/admin/users" className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Gérer les utilisateurs
                            </Link>
                            <button className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Gérer les quartiers
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;

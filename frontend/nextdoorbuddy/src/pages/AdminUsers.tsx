import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    adresse?: string;
    telephone?: string;
    date_naissance?: string;
    quartier_id?: number;
    role: string;
    created_at: string;
    updated_at: string;
}

const AdminUsers = () => {
    const { user, accessToken, refreshAccessToken } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        adresse: '',
        telephone: '',
        date_naissance: '',
        quartier_id: '',
        role: '',
        password: ''
    });
    const [quartiers, setQuartiers] = useState<any[]>([]);

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Charger les utilisateurs
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError('');

                // Rafraîchir le token d'accès si nécessaire
                const token = await refreshAccessToken() || accessToken;

                if (!token) {
                    throw new Error('Vous devez être connecté pour accéder à cette page');
                }

                const response = await fetch('https://doorbudy.cloud/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs');
                }

                const data = await response.json();
                setUsers(data);
            } catch (error: any) {
                setError(error.message || 'Erreur lors de la récupération des utilisateurs');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [accessToken, refreshAccessToken]);

    // Charger les quartiers
    useEffect(() => {
        const fetchQuartiers = async () => {
            try {
                const response = await fetch('https://doorbudy.cloud/api/quartiers');
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des quartiers');
                }
                const data = await response.json();
                setQuartiers(data);
            } catch (error) {
                console.error('Erreur:', error);
            }
        };

        fetchQuartiers();
    }, []);

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            adresse: user.adresse || '',
            telephone: user.telephone || '',
            date_naissance: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
            quartier_id: user.quartier_id ? user.quartier_id.toString() : '',
            role: user.role,
            password: ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            setError('');
            setSuccess('');

            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour modifier un utilisateur');
            }

            // Préparer les données à envoyer
            const dataToSend: any = {
                nom: formData.nom,
                prenom: formData.prenom,
                adresse: formData.adresse,
                telephone: formData.telephone || undefined,
                quartier_id: formData.quartier_id ? parseInt(formData.quartier_id) : undefined,
                role: formData.role
            };

            // Ajouter la date de naissance si fournie
            if (formData.date_naissance) {
                dataToSend.date_naissance = formData.date_naissance;
            }

            // Ajouter le mot de passe si fourni
            if (formData.password) {
                dataToSend.password = formData.password;
            }

            // Envoyer la requête de mise à jour
            const response = await fetch(`https://doorbudy.cloud/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'utilisateur');
            }

            const data = await response.json();

            // Mettre à jour la liste des utilisateurs
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data.user } : u));

            setSuccess('Utilisateur mis à jour avec succès');
            setEditingUser(null);
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour supprimer un utilisateur');
            }

            // Envoyer la requête de suppression
            const response = await fetch(`https://doorbudy.cloud/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression de l\'utilisateur');
            }

            // Mettre à jour la liste des utilisateurs
            setUsers(users.filter(u => u.id !== userId));

            setSuccess('Utilisateur supprimé avec succès');
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
    };

    if (loading) {
        return <div className="container mx-auto p-6">Chargement...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <h1 className="mb-6 text-2xl font-bold">Gestion des Utilisateurs</h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-md bg-green-100 p-4 text-green-700">
                        {success}
                    </div>
                )}

                {editingUser ? (
                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Modifier l'utilisateur</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        id="nom"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        id="prenom"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                        disabled
                                    />
                                    <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                                </div>

                                <div>
                                    <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                                        Adresse
                                    </label>
                                    <input
                                        type="text"
                                        id="adresse"
                                        name="adresse"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                                        Téléphone
                                    </label>
                                    <input
                                        type="text"
                                        id="telephone"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                                        Date de naissance
                                    </label>
                                    <input
                                        type="date"
                                        id="date_naissance"
                                        name="date_naissance"
                                        value={formData.date_naissance}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="quartier_id" className="block text-sm font-medium text-gray-700">
                                        Quartier
                                    </label>
                                    <select
                                        id="quartier_id"
                                        name="quartier_id"
                                        value={formData.quartier_id}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionnez un quartier</option>
                                        {quartiers.map((quartier) => (
                                            <option key={quartier.id} value={quartier.id}>
                                                {quartier.nom_quartier} ({quartier.ville})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                        Rôle
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    >
                                        <option value="user">Utilisateur</option>
                                        <option value="admin">Administrateur</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Laissez vide pour ne pas changer le mot de passe</p>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Enregistrer
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Adresse
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Rôle
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{user.nom} {user.prenom}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm text-gray-500">{user.adresse || '-'}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="mr-2 text-blue-600 hover:text-blue-900"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;

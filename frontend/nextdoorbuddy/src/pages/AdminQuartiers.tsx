import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Quartier {
    id: number;
    nom_quartier: string;
    ville?: string;
    code_postal?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

const AdminQuartiers = () => {
    const { user, accessToken, refreshAccessToken } = useAuth();
    const navigate = useNavigate();

    const [quartiers, setQuartiers] = useState<Quartier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingQuartier, setEditingQuartier] = useState<Quartier | null>(null);
    const [formData, setFormData] = useState({
        nom_quartier: '',
        ville: '',
        code_postal: '',
        description: ''
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredQuartiers, setFilteredQuartiers] = useState<Quartier[]>([]);

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Charger les quartiers
    useEffect(() => {
        const fetchQuartiers = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/quartiers', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (response.status === 401) {
                    // Token expiré, essayer de le rafraîchir
                    const refreshed = await refreshAccessToken();
                    if (!refreshed) {
                        throw new Error('Session expirée. Veuillez vous reconnecter.');
                    }
                    return; // Le useEffect sera relancé avec le nouveau token
                }

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des quartiers');
                }

                const data = await response.json();
                console.log('Frontend AdminQuartiers: Received quartiers data:', data);
                console.log('Frontend AdminQuartiers: Number of quartiers:', data.length);
                setQuartiers(data);
                setFilteredQuartiers(data);
            } catch (error) {
                console.error('Erreur:', error);
                setError(error instanceof Error ? error.message : 'Une erreur est survenue');
            } finally {
                setLoading(false);
            }
        };

        fetchQuartiers();
    }, [accessToken, refreshAccessToken]);

    // Filtrer les quartiers en fonction du terme de recherche
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredQuartiers(quartiers);
        } else {
            const filtered = quartiers.filter(quartier =>
                quartier.nom_quartier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (quartier.ville && quartier.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (quartier.code_postal && quartier.code_postal.includes(searchTerm))
            );
            setFilteredQuartiers(filtered);
        }
    }, [searchTerm, quartiers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleEdit = (quartier: Quartier) => {
        setEditingQuartier(quartier);
        setFormData({
            nom_quartier: quartier.nom_quartier,
            ville: quartier.ville || '',
            code_postal: quartier.code_postal || '',
            description: quartier.description || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingQuartier(null);
        setFormData({
            nom_quartier: '',
            ville: '',
            code_postal: '',
            description: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            let url = '/api/quartiers';
            let method = 'POST';

            if (editingQuartier) {
                url = `${url}/${editingQuartier.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (response.status === 401) {
                // Token expiré, essayer de le rafraîchir
                const refreshed = await refreshAccessToken();
                if (!refreshed) {
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }
                return; // On réessaiera avec le nouveau token
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Une erreur est survenue');
            }

            const data = await response.json();

            // Mettre à jour la liste des quartiers
            if (editingQuartier) {
                setQuartiers(quartiers.map(q => q.id === editingQuartier.id ? data : q));
                setSuccess('Quartier mis à jour avec succès');
            } else {
                setQuartiers([...quartiers, data]);
                setSuccess('Quartier créé avec succès');
            }

            // Réinitialiser le formulaire
            setFormData({
                nom_quartier: '',
                ville: '',
                code_postal: '',
                description: ''
            });
            setEditingQuartier(null);
            setShowAddForm(false);
        } catch (error) {
            console.error('Erreur:', error);
            setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce quartier ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/quartiers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 401) {
                // Token expiré, essayer de le rafraîchir
                const refreshed = await refreshAccessToken();
                if (!refreshed) {
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }
                return; // On réessaiera avec le nouveau token
            }

            if (response.status === 400) {
                // Le quartier ne peut pas être supprimé car des utilisateurs y sont rattachés
                const errorData = await response.json();
                if (errorData.suggestion) {
                    window.alert(`${errorData.message}\n${errorData.suggestion}`);
                }
                throw new Error(errorData.message);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Une erreur est survenue');
            }

            // Mettre à jour la liste des quartiers
            setQuartiers(quartiers.filter(q => q.id !== id));
            setSuccess('Quartier supprimé avec succès');
        } catch (error) {
            console.error('Erreur:', error);
            setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };



    if (!user) {
        return <div className="container mx-auto p-6">Chargement...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <h1 className="mb-6 text-2xl font-bold">Gestion des Quartiers</h1>

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

                <div className="mb-6 flex items-center justify-between">
                    <div className="w-1/2">
                        <input
                            type="text"
                            placeholder="Rechercher un quartier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                        {showAddForm ? 'Annuler' : 'Ajouter un quartier'}
                    </button>
                </div>

                {showAddForm && !editingQuartier && (
                    <div className="mb-6 rounded-md bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Ajouter un nouveau quartier</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="nom_quartier" className="block text-sm font-medium text-gray-700">
                                        Nom du quartier *
                                    </label>
                                    <input
                                        type="text"
                                        id="nom_quartier"
                                        name="nom_quartier"
                                        value={formData.nom_quartier}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ville" className="block text-sm font-medium text-gray-700">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        id="ville"
                                        name="ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="code_postal" className="block text-sm font-medium text-gray-700">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        id="code_postal"
                                        name="code_postal"
                                        value={formData.code_postal}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {editingQuartier && (
                    <div className="mb-6 rounded-md bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Modifier le quartier</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="nom_quartier" className="block text-sm font-medium text-gray-700">
                                        Nom du quartier *
                                    </label>
                                    <input
                                        type="text"
                                        id="nom_quartier"
                                        name="nom_quartier"
                                        value={formData.nom_quartier}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ville" className="block text-sm font-medium text-gray-700">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        id="ville"
                                        name="ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="code_postal" className="block text-sm font-medium text-gray-700">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        id="code_postal"
                                        name="code_postal"
                                        value={formData.code_postal}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                >
                                    Mettre à jour
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="text-center">
                        <p>Chargement des quartiers...</p>
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
                                        Ville
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Code postal
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Description
                                    </th>

                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredQuartiers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Aucun quartier trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQuartiers.map((quartier) => (
                                        <tr key={quartier.id}>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {quartier.nom_quartier}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {quartier.ville || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {quartier.code_postal || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {quartier.description || '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(quartier)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Modifier
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(quartier.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminQuartiers;

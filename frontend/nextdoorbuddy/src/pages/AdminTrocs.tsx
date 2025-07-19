import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import trocService from '../services/troc.service';
import { AnnonceTroc } from '../services/troc.service';
import ImageCarousel from '../components/ImageCarousel';

const AdminTrocs: React.FC = () => {
    const [trocs, setTrocs] = useState<AnnonceTroc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadTrocs();
    }, []);

    const loadTrocs = async () => {
        try {
            setLoading(true);
            const data = await trocService.adminGetAllTrocs();
            setTrocs(data);
        } catch (err) {
            setError('Erreur lors du chargement des annonces');
            console.error('Error loading trocs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number | undefined, newStatus: "active" | "inactive") => {
        try {
            await trocService.updateTrocStatus(id, newStatus);
            setTrocs(trocs.map(troc =>
                troc.id === id ? { ...troc, statut: newStatus } : troc
            ));
        } catch (err) {
            setError('Erreur lors de la mise à jour du statut');
            console.error('Error updating status:', err);
        }
    };

    const handleDelete = async (id: number | undefined) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
            try {
                await trocService.deleteTroc(id);
                setTrocs(trocs.filter(troc => troc.id !== id));
            } catch (err) {
                setError('Erreur lors de la suppression');
                console.error('Error deleting troc:', err);
            }
        }
    };

    const filteredTrocs = trocs.filter(troc => {
        const matchesFilter = filter === 'all' || troc.statut === filter;
        const matchesSearch = troc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            troc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            troc.objet_propose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            troc.objet_recherche?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">Chargement...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Administration des Trocs
                    </h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Filtres et recherche */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                    Rechercher
                                </label>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Titre, description, objet..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Statut
                                </label>
                                <select
                                    id="filter"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                    className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">Tous</option>
                                    <option value="active">Actifs</option>
                                    <option value="inactive">Inactifs</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold text-gray-800">Total</h3>
                            <p className="text-2xl font-bold text-blue-600">{trocs.length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold text-gray-800">Actifs</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {trocs.filter(t => t.statut === 'active').length}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold text-gray-800">Inactifs</h3>
                            <p className="text-2xl font-bold text-red-600">
                                {trocs.filter(t => t.statut === 'inactive').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Liste des trocs */}
                <div className="space-y-4">
                    {filteredTrocs.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500">Aucune annonce trouvée</p>
                        </div>
                    ) : (
                        filteredTrocs.map((troc) => (
                            <div key={troc.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    {/* Images avec carousel */}
                                    {(troc.images && troc.images.length > 0) && (
                                        <div className="lg:w-48 flex-shrink-0">
                                            <ImageCarousel
                                                images={troc.images}
                                                alt={troc.titre}
                                                className="w-full h-32 lg:h-24 object-cover rounded-lg"
                                                showThumbnails={false}
                                            />
                                        </div>
                                    )}

                                    {/* Contenu principal */}
                                    <div className="flex-1">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                    {troc.titre}
                                                </h3>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${troc.type_annonce === 'offre'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {troc.type_annonce === 'offre' ? 'Offre' : 'Demande'}
                                                    </span>

                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${troc.statut === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {troc.statut === 'active' ? 'Actif' : 'Inactif'}
                                                    </span>

                                                    {troc.categorie && (
                                                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {troc.categorie}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-600 mb-3 line-clamp-2">
                                                    {troc.description}
                                                </p>

                                                <div className="text-sm text-gray-500">
                                                    <p>
                                                        Publié le: {
                                                        troc.date_publication
                                                            ? new Date(troc.date_publication).toLocaleDateString()
                                                            : 'Date inconnue'
                                                    }
                                                    </p>
                                                    <p>ID: {troc.id} | Utilisateur: {troc.utilisateur_id}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 lg:ml-4">
                                                <select
                                                    value={troc.statut}
                                                    onChange={(e) => handleStatusChange(troc.id, e.target.value as 'active' | 'inactive')}
                                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="active">Actif</option>
                                                    <option value="inactive">Inactif</option>
                                                </select>

                                                <Link
                                                    to={`/trocs/${troc.id}`}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 text-center"
                                                >
                                                    Voir
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(troc.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminTrocs;

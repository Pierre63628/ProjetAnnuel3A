import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { trocService, AnnonceTroc } from '../services/troc.service';
import ImageCarousel from '../components/ImageCarousel';

function MyTrocs() {
    const [annonces, setAnnonces] = useState<AnnonceTroc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    const loadMyTrocs = async () => {
        try {
            setLoading(true);
            const data = await trocService.getMyTrocs();
            setAnnonces(data);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement de vos annonces');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyTrocs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
            return;
        }

        try {
            setDeleteLoading(id);
            await trocService.deleteTroc(id);
            setAnnonces(annonces.filter(a => a.id !== id));
        } catch (err) {
            setError('Erreur lors de la suppression');
            console.error('Erreur:', err);
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">Chargement de vos annonces...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Mes annonces de troc</h1>
                    <div className="flex space-x-4">
                        <Link
                            to="/trocs"
                            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                        >
                            Voir toutes les annonces
                        </Link>
                        <Link
                            to="/trocs/create"
                            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            Créer une annonce
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {annonces.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow">
                        <h3 className="mb-4 text-lg font-semibold text-gray-600">
                            Vous n'avez pas encore d'annonces
                        </h3>
                        <p className="mb-6 text-gray-500">
                            Créez votre première annonce de troc pour commencer à échanger avec vos voisins !
                        </p>
                        <Link
                            to="/trocs/create"
                            className="rounded-md bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                        >
                            Créer ma première annonce
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {annonces.map((annonce) => (
                            <div key={annonce.id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        {annonce.titre}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">
                                        Publié le {formatDate(annonce.date_publication!)}
                                    </p>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${annonce.statut === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {annonce.statut === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Images avec carousel */}
                                {(annonce.images && annonce.images.length > 0) && (
                                    <div className="mb-4">
                                        <ImageCarousel
                                            images={annonce.images}
                                            alt={annonce.titre}
                                            className="w-full h-48 object-cover rounded-lg"
                                            showThumbnails={true}
                                        />
                                    </div>
                                )}

                                <div className="mb-4">
                                    <p className="text-gray-700 mb-3">{annonce.description}</p>

                                    <div className="space-y-2">
                                        {/* Catégorie */}
                                        {annonce.categorie && (
                                            <div className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                                {annonce.categorie}
                                            </div>
                                        )}

                                        {/* Type d'annonce et détails */}
                                        {annonce.type_annonce === 'offre' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                    <span className="text-sm">
                                                        <strong>Propose:</strong> {annonce.objet_propose}
                                                    </span>
                                                </div>
                                                {annonce.prix && (
                                                    <div className="text-lg font-bold text-green-600">
                                                        {annonce.prix}€
                                                        {annonce.mode_echange && annonce.mode_echange !== 'vente' && (
                                                            <span className="ml-2 text-sm text-gray-500">
                                                                ({annonce.mode_echange})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {annonce.etat_produit && (
                                                    <div className="text-sm text-gray-600">
                                                        État: {annonce.etat_produit}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                                    <span className="text-sm">
                                                        <strong>Recherche:</strong> {annonce.objet_recherche}
                                                    </span>
                                                </div>
                                                {annonce.budget_max && (
                                                    <div className="text-lg font-bold text-blue-600">
                                                        Budget max: {annonce.budget_max}€
                                                    </div>
                                                )}
                                                {annonce.urgence && (
                                                    <div className="text-sm text-gray-600">
                                                        Urgence: {annonce.urgence}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between space-x-2">
                                    <Link
                                        to={`/trocs/edit/${annonce.id}`}
                                        className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-center text-sm text-white hover:bg-blue-600"
                                    >
                                        Modifier
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(annonce.id!)}
                                        disabled={deleteLoading === annonce.id}
                                        className="flex-1 rounded-md bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {deleteLoading === annonce.id ? 'Suppression...' : 'Supprimer'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyTrocs;

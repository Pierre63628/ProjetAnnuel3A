import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { trocService, AnnonceTroc } from '../services/troc.service';
import ImageCarousel from '../components/ImageCarousel';

function Troc() {
    const [annonces, setAnnonces] = useState<AnnonceTroc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAnnonces = async () => {
        try {
            setLoading(true);
            const data = await trocService.getAllTrocs();
            setAnnonces(data);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des annonces');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnonces();
    }, []);

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
                    <div className="text-center">Chargement des annonces...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Trocs du quartier</h1>
                    <div className="flex space-x-4">
                        <Link
                            to="/trocs/my-trocs"
                            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                        >
                            Mes annonces
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
                            Aucune annonce de troc dans votre quartier
                        </h3>
                        <p className="mb-6 text-gray-500">
                            Soyez le premier à proposer un échange !
                        </p>
                        <Link
                            to="/trocs/create"
                            className="rounded-md bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                        >
                            Créer la première annonce
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
                                        Par {annonce.prenom} {annonce.nom} • {formatDate(annonce.date_publication!)}
                                    </p>
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
                                                    <div className="flex items-center">
                                                        <span className="text-lg font-bold text-green-600">
                                                            {annonce.prix}€
                                                        </span>
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
                                                {annonce.disponibilite && (
                                                    <div className="text-sm text-gray-600">
                                                        Disponible: {annonce.disponibilite}
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
                                                    <div className="flex items-center">
                                                        <span className="text-lg font-bold text-blue-600">
                                                            Budget max: {annonce.budget_max}€
                                                        </span>
                                                    </div>
                                                )}
                                                {annonce.urgence && (
                                                    <div className="text-sm text-gray-600">
                                                        Urgence: {annonce.urgence}
                                                    </div>
                                                )}
                                                {annonce.criteres_specifiques && (
                                                    <div className="text-sm text-gray-600">
                                                        Critères: {annonce.criteres_specifiques}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
                                        Contacter
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

export default Troc;

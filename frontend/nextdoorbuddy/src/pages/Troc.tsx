import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { trocService, AnnonceTroc } from '../services/troc.service';
import ImageCarousel from '../components/ImageCarousel';
import ErrorBoundary from '../components/ErrorBoundary';
import { getImageUrl } from '../utils/imageUtils';

function Troc() {
    const [annonces, setAnnonces] = useState<AnnonceTroc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);

    // Function to safely process image data
    const processImageData = (images: any): string[] => {
        try {
            if (!images) return [];

            // If it's already an array, return it
            if (Array.isArray(images)) {
                return images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }

            // If it's a string that looks like an array (e.g., "{image1,image2}")
            if (typeof images === 'string') {
                // Handle PostgreSQL array format
                if (images.startsWith('{') && images.endsWith('}')) {
                    const cleanString = images.slice(1, -1); // Remove { and }
                    if (cleanString.trim() === '') return [];
                    return cleanString.split(',')
                        .map(img => img.trim().replace(/^"(.*)"$/, '$1')) // Remove surrounding quotes
                        .filter(img => img !== '');
                }
                // Handle single image as string
                return images.trim() !== '' ? [images] : [];
            }

            return [];
        } catch (error) {
            console.error('Error processing image data:', error, 'Original data:', images);
            return [];
        }
    };

    const loadAnnonces = async () => {
        try {
            setLoading(true);
            setError(null);
            setRenderError(null);
            console.log('Loading trocs...');

            const data = await trocService.getAllTrocs();
            console.log('Raw trocs data:', data);

            // Process the data to ensure images are properly formatted
            const processedData = data.map(annonce => {
                const processedImages = processImageData(annonce.images);
                // Debug logging for image processing
                if (processedImages.length > 0) {
                    console.log(`Troc ${annonce.id} has ${processedImages.length} image(s)`);
                }
                return {
                    ...annonce,
                    images: processedImages
                };
            });

            console.log(`Loaded ${processedData.length} trocs successfully`);
            setAnnonces(processedData);

        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors du chargement des annonces';
            setError(errorMessage);
            console.error('Erreur lors du chargement des trocs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnonces();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date invalide';
        }
    };

    // Safe image rendering component
    const SafeImageCarousel = ({ images, alt }: { images: string[], alt: string }) => {
        try {
            if (!images || images.length === 0) {
                console.log('No images to render for:', alt);
                return null;
            }

            // Debug logging (can be removed in production)
            console.log('Rendering images for:', alt, 'Count:', images.length);

            return (
                <div className="mb-4">
                    <ImageCarousel
                        images={images}
                        alt={alt}
                        className="w-full h-48 object-cover rounded-lg"
                        showThumbnails={true}
                    />
                </div>
            );
        } catch (error) {
            console.error('Error rendering image carousel:', error);
            return (
                <div className="mb-4 p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                    <p>Impossible d'afficher les images</p>
                    <p className="text-xs mt-1">Erreur: {error.message}</p>
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2">Chargement des annonces...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Add error boundary for render errors
    if (renderError) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                        <h3 className="font-semibold">Erreur de rendu</h3>
                        <p>{renderError}</p>
                        <button
                            onClick={() => {
                                setRenderError(null);
                                loadAnnonces();
                            }}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <ErrorBoundary>
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
                        <h3 className="font-semibold">Erreur de chargement</h3>
                        <p>{error}</p>
                        <button
                            onClick={loadAnnonces}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Réessayer
                        </button>
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
                        {annonces.map((annonce) => {
                            try {
                                return (
                                    <div key={annonce.id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                                {annonce.titre || 'Titre non disponible'}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Par {annonce.prenom || 'Inconnu'} {annonce.nom || ''} • {annonce.date_publication ? formatDate(annonce.date_publication) : 'Date inconnue'}
                                            </p>
                                        </div>

                                        {/* Images avec carousel - Safe rendering */}
                                        <SafeImageCarousel
                                            images={annonce.images || []}
                                            alt={annonce.titre || 'Image de troc'}
                                        />

                                        <div className="mb-4">
                                            <p className="text-gray-700 mb-3">{annonce.description || 'Aucune description disponible'}</p>

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
                                );
                            } catch (error) {
                                console.error('Error rendering troc card:', error, 'Troc data:', annonce);
                                return (
                                    <div key={annonce.id || Math.random()} className="rounded-lg bg-red-50 p-6 shadow">
                                        <div className="text-red-700">
                                            <h3 className="font-semibold">Erreur d'affichage</h3>
                                            <p>Impossible d'afficher cette annonce</p>
                                            <p className="text-sm mt-1">ID: {annonce.id}</p>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default Troc;

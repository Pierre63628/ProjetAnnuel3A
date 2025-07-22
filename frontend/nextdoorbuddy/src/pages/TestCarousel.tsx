import { useState, useEffect } from 'react';
import ImageCarousel from '../components/ImageCarousel';

function TestCarousel() {
    const [trocs, setTrocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrocs();
    }, []);

    const fetchTrocs = async () => {
        try {
            const response = await fetch('/api/troc');
            if (response.ok) {
                const data = await response.json();
                setTrocs(data);
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6">Chargement...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold mb-6">Test du Carousel d'Images</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trocs.map((troc) => (
                    <div key={troc.id} className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-bold text-lg mb-2">{troc.titre}</h3>
                        
                        {/* Test du carousel avec les images existantes */}
                        {((troc.images && troc.images.length > 0) || troc.image_url) && (
                            <div className="mb-4">
                                <ImageCarousel
                                    images={troc.images && troc.images.length > 0 
                                        ? troc.images 
                                        : troc.image_url ? [troc.image_url] : []
                                    }
                                    alt={troc.titre}
                                    className="w-full h-48 object-cover rounded-lg"
                                    showThumbnails={true}
                                />
                            </div>
                        )}
                        
                        <p className="text-gray-600 text-sm mb-2">{troc.description}</p>
                        <p className="text-blue-600 font-medium">
                            {troc.type_annonce === 'offre' ? 'Propose: ' : 'Recherche: '}
                            {troc.objet_propose || troc.objet_recherche}
                        </p>
                        
                        {/* Afficher les informations sur les images */}
                        <div className="mt-2 text-xs text-gray-500">
                            {troc.images && troc.images.length > 0 && (
                                <p>Images array: {troc.images.length} image(s)</p>
                            )}
                            {troc.image_url && (
                                <p>Image URL: {troc.image_url}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {trocs.length === 0 && (
                <div className="text-center text-gray-500">
                    Aucune annonce trouvée
                </div>
            )}
        </div>
    );
}

export default TestCarousel;

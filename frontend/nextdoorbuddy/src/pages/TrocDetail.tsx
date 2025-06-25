import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { trocService, AnnonceTroc } from '../services/troc.service';
import { getImageUrl } from '../utils/imageUtils';
import Header from '../components/Header';
import ImageCarousel from '../components/ImageCarousel';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { canEditTroc, canDeleteTroc } from '../utils/permissions';
import {
    ArrowLeft,
    Package,
    ArrowRightLeft,
    User,
    MapPin,
    Calendar,
    Tag,
    Euro,
    Edit,
    Trash2,
    Mail,
    Phone,
    Clock,
    AlertCircle,
    CheckCircle,
    Image as ImageIcon
} from 'lucide-react';

const TrocDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [troc, setTroc] = useState<AnnonceTroc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [deleting, setDeleting] = useState(false);

    // Image processing function
    const processImageData = (images: any): string[] => {
        try {
            if (!images) return [];
            
            if (Array.isArray(images)) {
                return images.map(img => getImageUrl(img)).filter(img => img !== null) as string[];
            }
            
            if (typeof images === 'string') {
                if (images.startsWith('{') && images.endsWith('}')) {
                    const cleanString = images.slice(1, -1);
                    if (cleanString.trim() === '') return [];
                    return cleanString.split(',')
                        .map(img => img.trim().replace(/^"(.*)"$/, '$1'))
                        .filter(img => img !== '')
                        .map(img => getImageUrl(img))
                        .filter(img => img !== null) as string[];
                }
                return images.trim() !== '' ? [getImageUrl(images)].filter(img => img !== null) as string[] : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error processing image data:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchTroc = async () => {
            try {
                setLoading(true);
                setError('');
                if (id) {
                    const data = await trocService.getTrocById(parseInt(id));
                    // Process images
                    const processedData = {
                        ...data,
                        images: processImageData(data.images)
                    };
                    setTroc(processedData);
                }
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 404) {
                    setError("Cette annonce de troc n'existe pas ou n'est plus disponible.");
                } else {
                    setError("Échec du chargement de l'annonce de troc.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTroc();
    }, [id]);

    const handleDelete = async () => {
        if (!troc || !window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
            return;
        }

        try {
            setDeleting(true);
            await trocService.deleteTroc(troc.id!);
            navigate('/trocs', { replace: true });
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError('Erreur lors de la suppression de l\'annonce.');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canEdit = canEditTroc(user, troc);
    const canDelete = canDeleteTroc(user, troc);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="ml-4 text-gray-600 text-lg">Chargement de l'annonce...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !troc) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center py-20">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Annonce introuvable</h2>
                        <p className="text-gray-600 mb-8">{error}</p>
                        <Button asChild>
                            <Link to="/trocs">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour aux trocs
                            </Link>
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Back button */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button asChild variant="outline" size="sm">
                        <Link to="/trocs">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour aux trocs
                        </Link>
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Header card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                                    troc.type_annonce === 'offre' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {troc.type_annonce === 'offre' ? 'Offre' : 'Demande'}
                                                </span>
                                                {troc.statut === 'active' && (
                                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Disponible
                                                    </span>
                                                )}
                                            </div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{troc.titre}</h1>
                                            <p className="text-gray-600 text-lg leading-relaxed">{troc.description}</p>
                                        </div>
                                        
                                        {(canEdit || canDelete) && (
                                            <div className="flex gap-2 ml-6">
                                                {canEdit && (
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link to={`/trocs/edit/${troc.id}`}>
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Modifier
                                                        </Link>
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={handleDelete}
                                                        disabled={deleting}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        {deleting ? 'Suppression...' : 'Supprimer'}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Images section */}
                        {troc.images && troc.images.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                            <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
                                            Photos
                                        </h3>
                                        <div className="rounded-lg overflow-hidden">
                                            <ImageCarousel
                                                images={troc.images}
                                                alt={troc.titre}
                                                className="w-full h-96"
                                                showThumbnails={true}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-1 space-y-8">
                        {/* Exchange details card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 sticky top-8">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-2 h-6 bg-purple-600 rounded-full mr-3"></div>
                                        Détails de l'échange
                                    </h3>

                                    <div className="space-y-6">
                                        {/* Objects */}
                                        <div>
                                            <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                <Package className="w-4 h-4 mr-2" />
                                                {troc.type_annonce === 'offre' ? 'Objet proposé' : 'Objet recherché'}
                                            </div>
                                            <p className="text-gray-900 font-medium">{troc.objet_propose}</p>
                                        </div>

                                        {troc.objet_recherche && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                    Contre
                                                </div>
                                                <p className="text-gray-900 font-medium">{troc.objet_recherche}</p>
                                            </div>
                                        )}

                                        {/* Price */}
                                        {troc.prix && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <Euro className="w-4 h-4 mr-2" />
                                                    Prix
                                                </div>
                                                <p className="text-2xl font-bold text-green-600">{troc.prix}€</p>
                                            </div>
                                        )}

                                        {/* Category */}
                                        {troc.categorie && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <Tag className="w-4 h-4 mr-2" />
                                                    Catégorie
                                                </div>
                                                <p className="text-gray-900">{troc.categorie}</p>
                                            </div>
                                        )}

                                        {/* Exchange mode */}
                                        {troc.mode_echange && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                    Mode d'échange
                                                </div>
                                                <p className="text-gray-900 capitalize">{troc.mode_echange}</p>
                                            </div>
                                        )}

                                        {/* Product condition */}
                                        {troc.etat_produit && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    État du produit
                                                </div>
                                                <p className="text-gray-900">{troc.etat_produit}</p>
                                            </div>
                                        )}

                                        {/* Publication date */}
                                        <div>
                                            <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Publié le
                                            </div>
                                            <p className="text-gray-900">{formatDate(troc.date_publication!)}</p>
                                        </div>

                                        {/* Availability */}
                                        {troc.disponibilite && (
                                            <div>
                                                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    Disponibilité
                                                </div>
                                                <p className="text-gray-900">{troc.disponibilite}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* User info card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-2 h-6 bg-blue-600 rounded-full mr-3"></div>
                                        Informations du vendeur
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <User className="w-5 h-5 text-gray-400 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">{troc.prenom} {troc.nom}</p>
                                                <p className="text-sm text-gray-500">Membre</p>
                                            </div>
                                        </div>

                                        {(troc as any).nom_quartier && (
                                            <div className="flex items-center">
                                                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-gray-900">{(troc as any).nom_quartier}</p>
                                                    <p className="text-sm text-gray-500">Quartier</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Contact button - only show if not owner */}
                                        {user && user.id !== troc.utilisateur_id && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <Button className="w-full" size="lg">
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Contacter le vendeur
                                                </Button>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    Cliquez pour envoyer un message
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Additional info card */}
                        {(troc.criteres_specifiques || troc.urgence) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                            <div className="w-2 h-6 bg-orange-600 rounded-full mr-3"></div>
                                            Informations supplémentaires
                                        </h3>

                                        <div className="space-y-4">
                                            {troc.criteres_specifiques && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 mb-1">Critères spécifiques</p>
                                                    <p className="text-gray-900">{troc.criteres_specifiques}</p>
                                                </div>
                                            )}

                                            {troc.urgence && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 mb-1">Urgence</p>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                        troc.urgence === 'haute' ? 'bg-red-100 text-red-800' :
                                                        troc.urgence === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {troc.urgence}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrocDetail;

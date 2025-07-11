import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import serviceService, { Service } from '../services/service.service';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft,
    Briefcase,
    User,
    MapPin,
    Calendar,
    Clock,
    Euro,
    Edit,
    Trash2,
    Mail,
    Phone,
    AlertCircle,
    Award,
    MessageCircle,
    Wrench
} from 'lucide-react';

function ServiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                setError('');
                if (id) {
                    const data = await serviceService.getServiceById(parseInt(id));
                    setService(data);
                }
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 404) {
                    setError("Ce service n'existe pas ou n'est plus disponible.");
                } else {
                    setError("Échec du chargement du service.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id]);

    const handleDelete = async () => {
        if (!service || !window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            return;
        }

        try {
            setDeleteLoading(true);
            await serviceService.deleteService(service.id!);
            navigate('/services');
        } catch (err: any) {
            console.error('Error deleting service:', err);
            alert('Erreur lors de la suppression du service');
        } finally {
            setDeleteLoading(false);
        }
    };

    const canEdit = user && service && user.id === service.utilisateur_id;
    const canDelete = user && service && user.id === service.utilisateur_id;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price: number | undefined) => {
        if (!price) return 'À négocier';
        return `${price}€`;
    };

    const getUrgenceColor = (urgence: string | undefined) => {
        switch (urgence) {
            case 'elevee': return 'text-red-600 bg-red-100';
            case 'normale': return 'text-yellow-600 bg-yellow-100';
            case 'faible': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getUrgenceText = (urgence: string | undefined) => {
        switch (urgence) {
            case 'elevee': return 'Urgent';
            case 'normale': return 'Normal';
            case 'faible': return 'Pas pressé';
            default: return 'Non spécifié';
        }
    };

    const getRecurrenceText = (recurrence: string | undefined) => {
        switch (recurrence) {
            case 'ponctuel': return 'Ponctuel';
            case 'hebdomadaire': return 'Hebdomadaire';
            case 'mensuel': return 'Mensuel';
            case 'permanent': return 'Permanent';
            default: return 'Non spécifié';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600 text-lg">Chargement du service...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center py-20">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Service introuvable</h2>
                        <p className="text-gray-600 mb-8">{error}</p>
                        <Button asChild>
                            <Link to="/services">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour aux services
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
                {/* Navigation */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Button variant="outline" asChild className="mb-4">
                        <Link to="/services">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour aux services
                        </Link>
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contenu principal */}
                    <motion.div
                        className="lg:col-span-2 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {/* En-tête du service */}
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium mr-3 ${service.type_service === 'offre'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {service.type_service === 'offre' ? 'Offre de service' : 'Demande de service'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(service.urgence)}`}>
                                                {getUrgenceText(service.urgence)}
                                            </span>
                                        </div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.titre}</h1>
                                        <div className="flex items-center text-gray-600 mb-4">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            <span className="capitalize">{service.categorie}</span>
                                        </div>
                                    </div>

                                    {/* Actions pour le propriétaire */}
                                    {(canEdit || canDelete) && (
                                        <div className="flex space-x-2">
                                            {canEdit && (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link to={`/services/edit/${service.id}`}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Modifier
                                                    </Link>
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                    disabled={deleteLoading}
                                                >
                                                    {deleteLoading ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                    )}
                                                    Supprimer
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="prose max-w-none">
                                    <p className="text-gray-700 text-lg leading-relaxed">{service.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Détails du service */}
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails du service</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Dates et horaires */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-gray-800 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Dates et horaires
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            {service.date_debut && (
                                                <div>
                                                    <span className="font-medium">Début :</span> {formatDate(service.date_debut)}
                                                </div>
                                            )}
                                            {service.date_fin && (
                                                <div>
                                                    <span className="font-medium">Fin :</span> {formatDate(service.date_fin)}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-medium">Récurrence :</span> {getRecurrenceText(service.recurrence)}
                                            </div>
                                            {service.horaires && (
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    <span>{service.horaires}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Prix et localisation */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-gray-800 flex items-center">
                                            <Euro className="w-4 h-4 mr-2" />
                                            Prix et localisation
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">
                                                    {service.type_service === 'offre' ? 'Prix :' : 'Budget max :'}
                                                </span>{' '}
                                                {service.type_service === 'offre'
                                                    ? formatPrice(service.prix)
                                                    : formatPrice(service.budget_max)
                                                }
                                            </div>
                                            {service.lieu && (
                                                <div className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    <span>{service.lieu}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Critères et exigences */}
                        {(service.competences_requises || service.experience_requise || service.age_min || service.age_max || service.materiel_fourni) && (
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                        <Award className="w-5 h-5 mr-2" />
                                        Critères et exigences
                                    </h2>
                                    <div className="space-y-4">
                                        {service.competences_requises && (
                                            <div>
                                                <h3 className="font-medium text-gray-800 mb-2">Compétences requises</h3>
                                                <p className="text-gray-600">{service.competences_requises}</p>
                                            </div>
                                        )}

                                        {service.experience_requise && (
                                            <div>
                                                <h3 className="font-medium text-gray-800 mb-2">Expérience requise</h3>
                                                <p className="text-gray-600">{service.experience_requise}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            {(service.age_min || service.age_max) && (
                                                <div>
                                                    <span className="font-medium text-gray-800">Âge :</span>
                                                    <span className="text-gray-600 ml-1">
                                                        {service.age_min && service.age_max
                                                            ? `${service.age_min} - ${service.age_max} ans`
                                                            : service.age_min
                                                                ? `À partir de ${service.age_min} ans`
                                                                : `Jusqu'à ${service.age_max} ans`
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            <div>
                                                <span className="font-medium text-gray-800">Personnes :</span>
                                                <span className="text-gray-600 ml-1">{service.nombre_personnes || 1}</span>
                                            </div>

                                            {service.materiel_fourni && (
                                                <div className="flex items-center text-green-600">
                                                    <Wrench className="w-4 h-4 mr-1" />
                                                    <span>Matériel fourni</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Informations du prestataire */}
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    {service.type_service === 'offre' ? 'Prestataire' : 'Demandeur'}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{service.nom} {service.prenom}</p>
                                        <p className="text-sm text-gray-600">{service.nom_quartier}</p>
                                    </div>

                                    {service.contact_info && (
                                        <div>
                                            <p className="text-sm text-gray-600">{service.contact_info}</p>
                                        </div>
                                    )}

                                    {/* Actions de contact */}
                                    {!canEdit && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <Button className="w-full" size="sm">
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Contacter
                                            </Button>
                                            {service.email && (
                                                <Button variant="outline" className="w-full" size="sm" asChild>
                                                    <a href={`mailto:${service.email}`}>
                                                        <Mail className="w-4 h-4 mr-2" />
                                                        Envoyer un email
                                                    </a>
                                                </Button>
                                            )}
                                            {service.telephone && (
                                                <Button variant="outline" className="w-full" size="sm" asChild>
                                                    <a href={`tel:${service.telephone}`}>
                                                        <Phone className="w-4 h-4 mr-2" />
                                                        Appeler
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informations de publication */}
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">Publié le :</span> {formatDate(service.date_publication)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Statut :</span>
                                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${service.statut === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : service.statut === 'complete'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {service.statut === 'active' ? 'Actif' :
                                                service.statut === 'complete' ? 'Terminé' : 'Inactif'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

export default ServiceDetail;

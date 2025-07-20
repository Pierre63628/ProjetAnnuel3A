import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import serviceService, { Service } from '../services/service.service';
import Header from '../components/Header';
import ContactButton from '../components/ContactButton';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft,
    User,
    MapPin,
    Calendar,
    Clock,
    Euro,
    Edit,
    Trash2,
    Mail,
    AlertCircle,
    Award,
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

                {/* Single Comprehensive Card Layout */}
                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="shadow-2xl border border-gray-100 bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-0">
                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-100">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        {/* Service Type and Urgency Badges */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${service.type_service === 'offre'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                {service.type_service === 'offre' ? '🟢 Offre de service' : '🔵 Demande de service'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgenceColor(service.urgence)}`}>
                                                {getUrgenceText(service.urgence)}
                                            </span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                                                {service.categorie.charAt(0).toUpperCase() + service.categorie.slice(1)}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{service.titre}</h1>
                                    </div>

                                    {/* Actions for Owner */}
                                    {(canEdit || canDelete) && (
                                        <div className="flex space-x-3 ml-6">
                                            {canEdit && (
                                                <Button asChild size="sm" variant="outline" className="bg-white hover:bg-gray-50">
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
                                                    className="bg-red-600 hover:bg-red-700"
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
                            </div>

                            {/* Main Content Section */}
                            <div className="p-8">
                                {/* Description */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                                    <p className="text-gray-700 text-lg leading-relaxed">{service.description}</p>
                                </div>

                                {/* Service Information Grid */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations détaillées</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Location */}
                                        {service.lieu && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="bg-gray-100 p-3 rounded-lg mr-4">
                                                    <MapPin className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Localisation</p>
                                                    <p className="text-gray-900 font-medium">{service.lieu}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Price */}
                                        {(service.prix || service.budget_max) && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-green-200">
                                                <div className="bg-green-100 p-3 rounded-lg mr-4">
                                                    <Euro className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {service.type_service === 'offre' ? 'Prix' : 'Budget maximum'}
                                                    </p>
                                                    <p className="text-green-700 font-bold text-lg">
                                                        {service.type_service === 'offre'
                                                            ? formatPrice(service.prix)
                                                            : formatPrice(service.budget_max)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Start Date */}
                                        {service.date_debut && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-blue-200">
                                                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Date de début</p>
                                                    <p className="text-blue-700 font-medium">{formatDate(service.date_debut)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* End Date */}
                                        {service.date_fin && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-purple-200">
                                                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                                                    <Calendar className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Date de fin</p>
                                                    <p className="text-purple-700 font-medium">{formatDate(service.date_fin)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Schedule */}
                                        {service.horaires && (
                                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-indigo-200">
                                                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                                                    <Clock className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Horaires</p>
                                                    <p className="text-indigo-700 font-medium">{service.horaires}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recurrence */}
                                        <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-orange-200">
                                            <div className="bg-orange-100 p-3 rounded-lg mr-4">
                                                <Calendar className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Récurrence</p>
                                                <p className="text-orange-700 font-medium">{getRecurrenceText(service.recurrence)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements and Criteria Section */}
                                {(service.competences_requises || service.experience_requise || service.age_min || service.age_max || service.materiel_fourni || service.nombre_personnes) && (
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                            <Award className="w-6 h-6 mr-3 text-yellow-600" />
                                            Critères et exigences
                                        </h2>

                                        <div className="space-y-6">
                                            {/* Text Requirements */}
                                            {(service.competences_requises || service.experience_requise) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {service.competences_requises && (
                                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                                            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                                <Award className="w-4 h-4 mr-2 text-yellow-600" />
                                                                Compétences requises
                                                            </h3>
                                                            <p className="text-gray-700">{service.competences_requises}</p>
                                                        </div>
                                                    )}

                                                    {service.experience_requise && (
                                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                                                Expérience requise
                                                            </h3>
                                                            <p className="text-gray-700">{service.experience_requise}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Numeric Requirements */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {(service.age_min || service.age_max) && (
                                                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-purple-200">
                                                        <div className="bg-purple-100 p-3 rounded-lg mr-4">
                                                            <User className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">Âge requis</p>
                                                            <p className="text-purple-700 font-medium">
                                                                {service.age_min && service.age_max
                                                                    ? `${service.age_min} - ${service.age_max} ans`
                                                                    : service.age_min
                                                                        ? `À partir de ${service.age_min} ans`
                                                                        : `Jusqu'à ${service.age_max} ans`
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center p-4 bg-teal-50 rounded-xl border border-teal-200">
                                                    <div className="bg-teal-100 p-3 rounded-lg mr-4">
                                                        <User className="w-5 h-5 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Nombre de personnes</p>
                                                        <p className="text-teal-700 font-medium">{service.nombre_personnes || 1}</p>
                                                    </div>
                                                </div>

                                                {service.materiel_fourni && (
                                                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-green-200">
                                                        <div className="bg-green-100 p-3 rounded-lg mr-4">
                                                            <Wrench className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">Matériel</p>
                                                            <p className="text-green-700 font-medium">Fourni</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* User Information and Contact Section */}
                                <div className="border-t border-gray-200 pt-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* User Information */}
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                                <User className="w-6 h-6 mr-3 text-indigo-600" />
                                                {service.type_service === 'offre' ? 'Prestataire' : 'Demandeur'}
                                            </h2>

                                            <div className="space-y-4">
                                                {/* User Details */}
                                                <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-indigo-200">
                                                    <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                                                        <User className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Nom</p>
                                                        <p className="text-indigo-700 font-bold text-lg">{service.nom} {service.prenom}</p>
                                                        <p className="text-sm text-gray-600">{service.nom_quartier}</p>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                {service.contact_info && (
                                                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                        <div className="bg-gray-100 p-3 rounded-lg mr-4">
                                                            <Mail className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">Informations de contact</p>
                                                            <p className="text-gray-700 font-medium">{service.contact_info}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Publication Info */}
                                                <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                                    <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                                                        <Calendar className="w-5 h-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Publié le</p>
                                                        <p className="text-yellow-700 font-medium">{formatDate(service.date_publication)}</p>
                                                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${service.statut === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : service.statut === 'complete'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {service.statut === 'active' ? 'Actif' :
                                                                service.statut === 'complete' ? 'Terminé' : 'Inactif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Actions */}
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact</h2>

                                            {!canEdit && service.utilisateur_id ? (
                                                <div className="space-y-4">
                                                    {/* Primary Contact Button */}
                                                    <ContactButton
                                                        targetUserId={service.utilisateur_id}
                                                        targetUserName={`${service.prenom} ${service.nom}`}
                                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                                                        size="lg"
                                                    />

                                                    {/* Email Button */}
                                                    {service.email && (
                                                        <Button variant="outline" className="w-full py-4 px-6 rounded-xl border-2 hover:bg-gray-50 text-lg font-medium" asChild>
                                                            <a href={`mailto:${service.email}`}>
                                                                <Mail className="w-5 h-5 mr-3" />
                                                                Envoyer un email
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                                                    <p className="text-gray-600">
                                                        {canEdit ? "C'est votre service" : "Connexion requise pour contacter"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}

export default ServiceDetail;

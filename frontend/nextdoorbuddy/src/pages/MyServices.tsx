import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import serviceService, { Service } from '../services/service.service';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Euro, 
    Plus,
    Edit,
    Trash2,
    Eye,
    Briefcase,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

function MyServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    useEffect(() => {
        loadMyServices();
    }, []);

    const loadMyServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading my services...');

            const data = await serviceService.getMyServices();
            console.log(`Loaded ${data.length} services successfully`);
            setServices(data);
        } catch (err: any) {
            console.error('Error loading my services:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement de vos services');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (serviceId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            return;
        }

        try {
            setDeleteLoading(serviceId);
            await serviceService.deleteService(serviceId);
            setServices(services.filter(service => service.id !== serviceId));
        } catch (err: any) {
            console.error('Error deleting service:', err);
            alert('Erreur lors de la suppression du service');
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatPrice = (price: number | undefined) => {
        if (!price) return 'À négocier';
        return `${price}€`;
    };

    const getStatusColor = (statut: string | undefined) => {
        switch (statut) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'complete': return 'text-blue-600 bg-blue-100';
            case 'inactive': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (statut: string | undefined) => {
        switch (statut) {
            case 'active': return 'Actif';
            case 'complete': return 'Terminé';
            case 'inactive': return 'Inactif';
            default: return 'Inconnu';
        }
    };

    const getStatusIcon = (statut: string | undefined) => {
        switch (statut) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'complete': return <CheckCircle className="w-4 h-4" />;
            case 'inactive': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2">Chargement de vos services...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            <ErrorBoundary>
                <div className="container mx-auto p-6">
                    {/* En-tête */}
                    <motion.div 
                        className="mb-6 flex items-center justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center">
                            <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-800">Mes services</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/services"
                                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 transition-colors flex items-center"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir tous les services
                            </Link>
                            <Link
                                to="/services/create"
                                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un service
                            </Link>
                        </div>
                    </motion.div>

                    {/* Message d'erreur */}
                    {error && (
                        <motion.div 
                            className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={loadMyServices}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                Réessayer
                            </button>
                        </motion.div>
                    )}

                    {/* Liste des services */}
                    {services.length === 0 ? (
                        <motion.div 
                            className="rounded-lg bg-white p-8 text-center shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="mb-4 text-lg font-semibold text-gray-600">
                                Vous n'avez pas encore créé de service
                            </h3>
                            <p className="mb-6 text-gray-500">
                                Créez votre premier service pour proposer vos compétences ou demander de l'aide !
                            </p>
                            <Link
                                to="/services/create"
                                className="rounded-md bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors inline-flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer mon premier service
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {services.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="mb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
                                                {service.titre}
                                            </h3>
                                            <div className="flex items-center ml-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(service.statut)}`}>
                                                    {getStatusIcon(service.statut)}
                                                    <span className="ml-1">{getStatusText(service.statut)}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                                service.type_service === 'offre' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {service.type_service === 'offre' ? 'Offre' : 'Demande'}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium mr-2">
                                                {service.categorie}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(service.urgence)}`}>
                                                {getUrgenceText(service.urgence)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {service.description}
                                    </p>

                                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                                        {service.lieu && (
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                <span>{service.lieu}</span>
                                            </div>
                                        )}
                                        
                                        {(service.prix || service.budget_max) && (
                                            <div className="flex items-center">
                                                <Euro className="w-4 h-4 mr-2" />
                                                <span>
                                                    {service.type_service === 'offre' 
                                                        ? formatPrice(service.prix)
                                                        : `Budget max: ${formatPrice(service.budget_max)}`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {service.date_debut && (
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <span>À partir du {formatDate(service.date_debut)}</span>
                                            </div>
                                        )}

                                        {service.horaires && (
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-2" />
                                                <span>{service.horaires}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-400">
                                            Publié le {formatDate(service.date_publication)}
                                        </div>
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/services/${service.id}`}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Voir les détails"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                to={`/services/edit/${service.id}`}
                                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(service.id!)}
                                                disabled={deleteLoading === service.id}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                title="Supprimer"
                                            >
                                                {deleteLoading === service.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default MyServices;

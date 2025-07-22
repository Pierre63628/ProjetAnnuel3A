import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ContactButton from '../components/ContactButton';
import { useAuth } from '../contexts/AuthContext';
import serviceService, { Service, ServiceSearchFilters } from '../services/service.service';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    Euro, 
    Search,
    Filter,
    Plus,
    Briefcase,
    Users,
    AlertCircle
} from 'lucide-react';

function Services() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<ServiceSearchFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    // Catégories de services disponibles
    const categories = [
        'baby-sitting',
        'jardinage',
        'bricolage',
        'ménage',
        'cours',
        'informatique',
        'cuisine',
        'transport',
        'animaux',
        'autre'
    ];

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [services, searchTerm, filters]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading services...');

            const data = await serviceService.getServices();
            console.log(`Loaded ${data.length} services successfully`);
            setServices(data);
        } catch (err: any) {
            console.error('Error loading services:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des services');
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = [...services];

        // Filtre par terme de recherche
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(service =>
                service.titre.toLowerCase().includes(term) ||
                service.description.toLowerCase().includes(term) ||
                service.categorie.toLowerCase().includes(term) ||
                service.lieu?.toLowerCase().includes(term)
            );
        }

        // Filtres avancés
        if (filters.type_service) {
            filtered = filtered.filter(service => service.type_service === filters.type_service);
        }

        if (filters.categorie) {
            filtered = filtered.filter(service => service.categorie === filters.categorie);
        }

        if (filters.urgence) {
            filtered = filtered.filter(service => service.urgence === filters.urgence);
        }

        if (filters.prix_max) {
            filtered = filtered.filter(service => 
                !service.prix || service.prix <= filters.prix_max!
            );
        }

        setFilteredServices(filtered);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2">Chargement des services...</p>
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
                            <h1 className="text-3xl font-bold text-gray-800">Services du quartier</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/services/my-services"
                                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 transition-colors flex items-center"
                            >
                                <User className="w-4 h-4 mr-2" />
                                Mes services
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

                    {/* Barre de recherche et filtres */}
                    <motion.div 
                        className="bg-white rounded-lg shadow-md p-4 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Rechercher un service..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filtres
                            </button>
                        </div>

                        {/* Filtres avancés */}
                        {showFilters && (
                            <motion.div 
                                className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.3 }}
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={filters.type_service || ''}
                                        onChange={(e) => setFilters({...filters, type_service: e.target.value as 'offre' | 'demande' || undefined})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Tous</option>
                                        <option value="offre">Offres</option>
                                        <option value="demande">Demandes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                    <select
                                        value={filters.categorie || ''}
                                        onChange={(e) => setFilters({...filters, categorie: e.target.value || undefined})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Toutes</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                                    <select
                                        value={filters.urgence || ''}
                                        onChange={(e) => setFilters({...filters, urgence: e.target.value || undefined})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Toutes</option>
                                        <option value="elevee">Urgent</option>
                                        <option value="normale">Normal</option>
                                        <option value="faible">Pas pressé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix max (€)</label>
                                    <input
                                        type="number"
                                        value={filters.prix_max || ''}
                                        onChange={(e) => setFilters({...filters, prix_max: e.target.value ? parseFloat(e.target.value) : undefined})}
                                        placeholder="Prix maximum"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </motion.div>
                        )}
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
                                onClick={loadServices}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                Réessayer
                            </button>
                        </motion.div>
                    )}

                    {/* Liste des services */}
                    {filteredServices.length === 0 ? (
                        <motion.div 
                            className="rounded-lg bg-white p-8 text-center shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="mb-4 text-lg font-semibold text-gray-600">
                                {searchTerm || Object.keys(filters).length > 0 
                                    ? 'Aucun service trouvé' 
                                    : 'Aucun service dans votre quartier'
                                }
                            </h3>
                            <p className="mb-6 text-gray-500">
                                {searchTerm || Object.keys(filters).length > 0
                                    ? 'Essayez de modifier vos critères de recherche'
                                    : 'Soyez le premier à proposer ou demander un service !'
                                }
                            </p>
                            <Link
                                to="/services/create"
                                className="rounded-md bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors inline-flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer le premier service
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {filteredServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ y: -2 }}
                                >
                                    <Link to={`/services/${service.id}`} className="block">
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                                                    {service.titre}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenceColor(service.urgence)}`}>
                                                    {getUrgenceText(service.urgence)}
                                                </span>
                                            </div>
                                            <div className="flex items-center mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                                    service.type_service === 'offre'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {service.type_service === 'offre' ? 'Offre' : 'Demande'}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                                    {service.categorie}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {service.description}
                                        </p>

                                        <div className="space-y-2 text-sm text-gray-500">
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

                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2" />
                                                <span>{service.nom} {service.prenom}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-400">
                                                Publié le {formatDate(service.date_publication)}
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Contact Button - Only show for other users' services */}
                                    {user && service.utilisateur_id && service.utilisateur_id !== user.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <ContactButton
                                                targetUserId={service.utilisateur_id}
                                                targetUserName={`${service.prenom} ${service.nom}`}
                                                className="w-full"
                                                size="sm"
                                                variant="outline"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default Services;

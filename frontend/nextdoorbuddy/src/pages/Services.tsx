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
    Search,
    Filter,
    Plus,
    Briefcase,
    Users,
    AlertCircle,
    Euro
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
                    {/* En-tête amélioré */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Briefcase className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Services du quartier</h1>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Découvrez les services proposés par vos voisins ou partagez vos compétences avec la communauté
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/services/my-services"
                                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm"
                            >
                                <User className="w-5 h-5 mr-2" />
                                Mes services
                            </Link>
                            <Link
                                to="/services/create"
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Proposer un service
                            </Link>
                        </div>
                    </motion.div>

                    {/* Barre de recherche et filtres améliorée */}
                    <motion.div
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Rechercher un service (ex: jardinage, baby-sitting...)"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center justify-center px-6 py-3 border rounded-xl transition-all duration-200 font-medium ${
                                    showFilters
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                <Filter className="w-5 h-5 mr-2" />
                                Filtres
                                {Object.keys(filters).length > 0 && (
                                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {Object.keys(filters).length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Filtres avancés améliorés */}
                        {showFilters && (
                            <motion.div
                                className="mt-6 pt-6 border-t border-gray-100"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type de service</label>
                                        <select
                                            value={filters.type_service || ''}
                                            onChange={(e) => setFilters({...filters, type_service: e.target.value as 'offre' | 'demande' || undefined})}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">Tous les types</option>
                                            <option value="offre">🟢 Offres de service</option>
                                            <option value="demande">🔵 Demandes de service</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                                        <select
                                            value={filters.categorie || ''}
                                            onChange={(e) => setFilters({...filters, categorie: e.target.value || undefined})}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">Toutes les catégories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Urgence</label>
                                        <select
                                            value={filters.urgence || ''}
                                            onChange={(e) => setFilters({...filters, urgence: e.target.value || undefined})}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">Toutes les urgences</option>
                                            <option value="elevee">🔴 Urgent</option>
                                            <option value="normale">🟡 Normal</option>
                                            <option value="faible">🟢 Pas pressé</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prix maximum</label>
                                        <div className="relative">
                                            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number"
                                                value={filters.prix_max || ''}
                                                onChange={(e) => setFilters({...filters, prix_max: e.target.value ? parseFloat(e.target.value) : undefined})}
                                                placeholder="Ex: 50"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton pour effacer les filtres */}
                                {Object.keys(filters).length > 0 && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => setFilters({})}
                                            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors duration-200"
                                        >
                                            Effacer tous les filtres
                                        </button>
                                    </div>
                                )}
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

                    {/* Liste des services améliorée */}
                    {filteredServices.length === 0 ? (
                        <motion.div
                            className="rounded-2xl bg-white p-12 text-center shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="mb-4 text-2xl font-bold text-gray-800">
                                {searchTerm || Object.keys(filters).length > 0
                                    ? 'Aucun service trouvé'
                                    : 'Aucun service dans votre quartier'
                                }
                            </h3>
                            <p className="mb-8 text-gray-600 text-lg max-w-md mx-auto">
                                {searchTerm || Object.keys(filters).length > 0
                                    ? 'Essayez de modifier vos critères de recherche ou explorez d\'autres catégories'
                                    : 'Soyez le premier à proposer ou demander un service dans votre quartier !'
                                }
                            </p>
                            <Link
                                to="/services/create"
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Créer le premier service
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {filteredServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    className="group rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                >
                                    <Link to={`/services/${service.id}`} className="block p-6">
                                        {/* En-tête de la carte */}
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                                                    {service.titre}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getUrgenceColor(service.urgence)}`}>
                                                    {getUrgenceText(service.urgence)}
                                                </span>
                                            </div>

                                            {/* Tags de type et catégorie */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    service.type_service === 'offre'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {service.type_service === 'offre' ? '🟢 Offre' : '🔵 Demande'}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                                                    {service.categorie.charAt(0).toUpperCase() + service.categorie.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                                            {service.description}
                                        </p>

                                        {/* Informations détaillées */}
                                        <div className="space-y-3 mb-6">
                                            {service.lieu && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="bg-gray-100 p-1.5 rounded-lg mr-3">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <span className="font-medium">{service.lieu}</span>
                                                </div>
                                            )}

                                            {(service.prix || service.budget_max) && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="bg-green-100 p-1.5 rounded-lg mr-3">
                                                        <Euro className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <span className="font-semibold text-green-700">
                                                        {service.type_service === 'offre'
                                                            ? formatPrice(service.prix)
                                                            : `Budget max: ${formatPrice(service.budget_max)}`
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {service.date_debut && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="bg-blue-100 p-1.5 rounded-lg mr-3">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span>À partir du {formatDate(service.date_debut)}</span>
                                                </div>
                                            )}

                                            {service.horaires && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                                                        <Clock className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <span>{service.horaires}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Informations utilisateur et date */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="bg-indigo-100 p-1.5 rounded-lg mr-3">
                                                        <User className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <span className="font-medium">{service.nom} {service.prenom}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {formatDate(service.date_publication)}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Contact Button - Only show for other users' services */}
                                    {user && service.utilisateur_id && service.utilisateur_id !== user.id && (
                                        <div className="p-6 pt-0">
                                            <ContactButton
                                                targetUserId={service.utilisateur_id}
                                                targetUserName={`${service.prenom} ${service.nom}`}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                                size="md"
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

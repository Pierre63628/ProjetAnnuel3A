import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import serviceService, { Service } from '../services/service.service';
import { motion } from 'framer-motion';
import {
    Search,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    Briefcase,
    Users,
    TrendingUp,
    Calendar,
    Euro,
    MapPin
} from 'lucide-react';

function AdminServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'complete'>('all');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadServices();
        loadStats();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await serviceService.getAllServicesAdmin();
            setServices(data);
        } catch (err: any) {
            console.error('Error loading services:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des services');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await serviceService.getServiceStats();
            setStats(data);
        } catch (err: any) {
            console.error('Error loading stats:', err);
        }
    };

    const handleStatusChange = async (serviceId: number, newStatus: 'active' | 'inactive' | 'complete') => {
        try {
            await serviceService.updateServiceStatus(serviceId, newStatus);
            setServices(services.map(service =>
                service.id === serviceId ? { ...service, statut: newStatus } : service
            ));
            // Reload stats after status change
            loadStats();
        } catch (err: any) {
            console.error('Error updating status:', err);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    const filteredServices = services.filter(service => {
        const matchesFilter = filter === 'all' || service.statut === filter;
        const matchesSearch = service.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.categorie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2">Chargement...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                {/* En-tête */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-800">Administration des services</h1>
                        </div>
                        <Link
                            to="/admin/dashboard"
                            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                        >
                            Retour au dashboard
                        </Link>
                    </div>

                    {/* Statistiques */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Actifs</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <XCircle className="w-8 h-8 text-gray-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Inactifs</p>
                                        <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Terminés</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.complete}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filtres et recherche */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                    Rechercher
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        id="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Titre, description, catégorie, utilisateur..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Statut
                                </label>
                                <select
                                    id="filter"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive' | 'complete')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">Tous</option>
                                    <option value="active">Actifs</option>
                                    <option value="inactive">Inactifs</option>
                                    <option value="complete">Terminés</option>
                                </select>
                            </div>
                        </div>
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
                            onClick={loadServices}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Réessayer
                        </button>
                    </motion.div>
                )}

                {/* Liste des services */}
                <motion.div
                    className="bg-white rounded-lg shadow overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Services ({filteredServices.length})
                        </h2>
                    </div>

                    {filteredServices.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                Aucun service trouvé
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || filter !== 'all'
                                    ? 'Essayez de modifier vos critères de recherche'
                                    : 'Aucun service n\'a été créé pour le moment'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Prix
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredServices.map((service) => (
                                        <tr key={service.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {service.titre}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {service.categorie}
                                                    </div>
                                                    {service.lieu && (
                                                        <div className="text-xs text-gray-400 flex items-center mt-1">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {service.lieu}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {service.nom} {service.prenom}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {service.nom_quartier}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.type_service === 'offre'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {service.type_service === 'offre' ? 'Offre' : 'Demande'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <Euro className="w-4 h-4 mr-1" />
                                                    {service.type_service === 'offre'
                                                        ? formatPrice(service.prix)
                                                        : formatPrice(service.budget_max)
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={service.statut}
                                                    onChange={(e) => handleStatusChange(service.id!, e.target.value as 'active' | 'inactive' | 'complete')}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(service.statut)}`}
                                                >
                                                    <option value="active">Actif</option>
                                                    <option value="inactive">Inactif</option>
                                                    <option value="complete">Terminé</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {formatDate(service.date_publication)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        to={`/services/${service.id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="Voir"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default AdminServices;

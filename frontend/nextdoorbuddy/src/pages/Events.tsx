import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
    getPastEvenementsByQuartier,
    getAllEvenementsByQuartier,
    getAllUpcomingEvenements,
    getAllPastEvenements,
    getAllEvenements,
    deleteEvenement,
    checkParticipation,
    Evenement
} from '../services/evenement.service';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { canDeleteEvent } from '../utils/permissions';
import {
    ExternalLink,
    Users,
    Calendar,
    MapPin,
    Clock,
    Search,
    Filter,
    Plus,
    UserCheck,
    Sparkles
} from 'lucide-react';

const Events = () => {
    const { user } = useAuth();

    const [evenements, setEvenements] = useState<Evenement[]>([]);
    const [filteredEvenements, setFilteredEvenements] = useState<Evenement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [participationStatus, setParticipationStatus] = useState<{[key: number]: {isParticipant: boolean, participantCount: number}}>({});

    useEffect(() => {
        const fetchEvenements = async () => {
            try {
                setLoading(true);
                setError('');

                let data = [];
                const isAdmin = user?.role === 'admin';
                const qId = user?.quartier_id || 0;

                if (isAdmin) {
                    if (filter === 'upcoming') data = await getAllUpcomingEvenements();
                    else if (filter === 'past') data = await getAllPastEvenements();
                    else data = await getAllEvenements();
                } else {
                    if (filter === 'upcoming') data = await getPastEvenementsByQuartier(qId);
                    else if (filter === 'past') data = await getPastEvenementsByQuartier(qId);
                    else data = await getAllEvenementsByQuartier(qId);
                }

                setEvenements(data);
                setFilteredEvenements(data);

                // Fetch participation status for each event if user is logged in
                if (user && data.length > 0) {
                    const statusPromises = data.map(async (event: Evenement) => {
                        try {
                            const status = await checkParticipation(event.id);
                            return { eventId: event.id, status };
                        } catch (error) {
                            console.error(`Error checking participation for event ${event.id}:`, error);
                            return { eventId: event.id, status: { isParticipant: false, participantCount: 0 } };
                        }
                    });

                    const statuses = await Promise.all(statusPromises);
                    const statusMap = statuses.reduce((acc, { eventId, status }) => {
                        acc[eventId] = status;
                        return acc;
                    }, {} as {[key: number]: {isParticipant: boolean, participantCount: number}});

                    setParticipationStatus(statusMap);
                }
            } catch (err) {
                console.error(err);
                setError('Erreur lors du chargement des événements');
            } finally {
                setLoading(false);
            }
        };
        fetchEvenements();
    }, [filter, user]);

    useEffect(() => {
        if (!searchTerm.trim()) return setFilteredEvenements(evenements);
        setFilteredEvenements(
            evenements.filter((e) =>
                [e.nom, e.description, e.detailed_address || e.lieu, e.type_evenement]
                    .filter(Boolean)
                    .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, evenements]);

    const handleDeleteEvenement = async (id: number) => {
        try {
            await deleteEvenement(id);
            setEvenements((prev) => prev.filter((e) => e.id !== id));
            setFilteredEvenements((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error(err);
            alert("Impossible de supprimer l'événement.");
        }
    };

    const formatDateShort = (dateString: string) =>
        new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });

    const isEventPast = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const isEventToday = (dateString: string) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Enhanced Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                                <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
                                Événements
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Découvrez et participez aux événements de votre quartier
                            </p>
                        </div>
                        <Button asChild variant="solid" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                            <Link to="/events/create">
                                <Plus className="w-5 h-5 mr-2" />
                                Créer un événement
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Enhanced Filters and Search */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            {/* Filter Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center text-gray-700 font-medium mr-4">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filtrer par:
                                </div>
                                {[
                                    { key: 'all', label: 'Tous les événements', icon: Sparkles },
                                    { key: 'upcoming', label: 'À venir', icon: Calendar },
                                    { key: 'past', label: 'Passés', icon: Clock }
                                ].map(({ key, label, icon: Icon }) => (
                                    <Button
                                        key={key}
                                        variant={filter === key ? 'accent' : 'outline'}
                                        size="md"
                                        onClick={() => setFilter(key)}
                                        className={`transition-all duration-200 ${
                                            filter === key
                                                ? 'shadow-md scale-105'
                                                : 'hover:shadow-sm hover:scale-102'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un événement..."
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Enhanced Loading State */}
                {loading && (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Chargement des événements...</p>
                        </div>
                    </div>
                )}

                {/* Enhanced Error State */}
                {error && (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()}>
                            Réessayer
                        </Button>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredEvenements.length === 0 && (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-gray-400 text-8xl mb-6">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            {searchTerm ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            {searchTerm
                                ? `Aucun événement ne correspond à votre recherche "${searchTerm}".`
                                : 'Il n\'y a pas encore d\'événements dans cette catégorie. Soyez le premier à en créer un !'
                            }
                        </p>
                        {!searchTerm && (
                            <Button asChild size="lg" className="shadow-lg">
                                <Link to="/events/create">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Créer le premier événement
                                </Link>
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Enhanced Events Grid */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {!loading && filteredEvenements.map((evenement, index) => {
                        const eventStatus = participationStatus[evenement.id];
                        const isPast = isEventPast(evenement.date_evenement);
                        const isToday = isEventToday(evenement.date_evenement);

                        return (
                            <motion.div
                                key={evenement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group"
                            >
                                <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
                                    {/* Event Image */}
                                    <div className="relative">
                                        {evenement.photo_url ? (
                                            <div className="h-48 w-full overflow-hidden">
                                                <img
                                                    src={evenement.photo_url}
                                                    alt={evenement.nom}
                                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-48 w-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                                <Calendar className="w-16 h-16 text-blue-400" />
                                            </div>
                                        )}

                                        {/* Status Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {isPast && (
                                                <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
                                                    Terminé
                                                </span>
                                            )}
                                            {isToday && !isPast && (
                                                <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
                                                    Aujourd'hui
                                                </span>
                                            )}
                                            {eventStatus?.isParticipant && (
                                                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center">
                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                    Inscrit
                                                </span>
                                            )}
                                        </div>

                                        {/* External Link */}
                                        {evenement.url && (
                                            <div className="absolute top-3 right-3">
                                                <a
                                                    href={evenement.url.startsWith('http') ? evenement.url : `https://${evenement.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-blue-600 hover:text-blue-800 hover:bg-white transition-all duration-200 shadow-md"
                                                    title="Visiter le site de l'événement"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-6 flex-1 flex flex-col">
                                        {/* Event Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                                            {evenement.nom}
                                        </h3>

                                        {/* Event Details */}
                                        <div className="space-y-3 mb-4 flex-1">
                                            <div className="flex items-center text-gray-600">
                                                <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                                                <div>
                                                    <p className="font-medium">{formatDateShort(evenement.date_evenement)}</p>
                                                    <p className="text-sm text-gray-500">{formatTime(evenement.date_evenement)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start text-gray-600">
                                                <MapPin className="w-4 h-4 mr-3 text-red-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm line-clamp-2">{evenement.detailed_address || evenement.lieu}</p>
                                            </div>

                                            {eventStatus && (
                                                <div className="flex items-center text-gray-600">
                                                    <Users className="w-4 h-4 mr-3 text-green-500" />
                                                    <p className="text-sm">
                                                        {eventStatus.participantCount} participant{eventStatus.participantCount > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            )}

                                            {evenement.description && (
                                                <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                                                    {evenement.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-auto">
                                            <Button asChild size="md" className="flex-1 shadow-md hover:shadow-lg transition-shadow">
                                                <Link to={`/events/${evenement.id}`}>
                                                    Voir détails
                                                </Link>
                                            </Button>
                                            {canDeleteEvent(user, evenement) && (
                                                <Button
                                                    size="md"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteEvenement(evenement.id)}
                                                    className="shadow-md hover:shadow-lg transition-shadow"
                                                >
                                                    Supprimer
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Results Summary */}
                {!loading && !error && filteredEvenements.length > 0 && (
                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <p className="text-gray-600">
                            {filteredEvenements.length} événement{filteredEvenements.length > 1 ? 's' : ''}
                            {searchTerm && ` trouvé${filteredEvenements.length > 1 ? 's' : ''} pour "${searchTerm}"`}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Events;

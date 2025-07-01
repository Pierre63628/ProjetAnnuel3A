import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import CalendarWidget from '../components/CalendarWidget';
import DashboardStats from '../components/DashboardStats';
import {
    getAllEvenementsByQuartier,
    getUserParticipations,
    checkParticipation,
    Evenement
} from '../services/evenement.service';
import { trocService, AnnonceTroc } from '../services/troc.service';
import { getImageUrl } from '../utils/imageUtils';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Sparkles,
    Heart,
    ExternalLink,
    ChevronRight,
    CalendarDays,
    UserCheck,
    Plus,
    Package,
    ArrowRightLeft,
    Eye,
    Image as ImageIcon
} from 'lucide-react';

const Home = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [todaysEvents, setTodaysEvents] = useState<Evenement[]>([]);
    const [userEvents, setUserEvents] = useState<Evenement[]>([]);
    const [trocs, setTrocs] = useState<AnnonceTroc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [participationStatus, setParticipationStatus] = useState<{[key: number]: {isParticipant: boolean, participantCount: number}}>({});

    // Image processing function for trocs
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
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError('');

                // Fetch all events for user's quartier
                const allEvents = await getAllEvenementsByQuartier(user.quartier_id || 0);

                // Filter today's events
                const today = new Date();
                const todayStr = today.toDateString();
                const todayEvents = allEvents.filter(event => {
                    const eventDate = new Date(event.date_evenement);
                    return eventDate.toDateString() === todayStr;
                });

                // Fetch user's participated events
                const userParticipatedEvents = await getUserParticipations();

                // Filter upcoming user events
                const upcomingUserEvents = userParticipatedEvents.filter(event => {
                    const eventDate = new Date(event.date_evenement);
                    return eventDate >= today;
                });

                setTodaysEvents(todayEvents);
                setUserEvents(upcomingUserEvents.slice(0, 3)); // Show only first 3

                // Fetch available trocs
                const availableTrocs = await trocService.getAllTrocs();
                // Process troc images
                const processedTrocs = availableTrocs.map(troc => ({
                    ...troc,
                    images: processImageData(troc.images)
                }));
                setTrocs(processedTrocs.slice(0, 6)); // Show only first 6

                // Fetch participation status for today's events
                if (todayEvents.length > 0) {
                    const statusPromises = todayEvents.map(async (event: Evenement) => {
                        try {
                            const status = await checkParticipation(event.id!);
                            return { eventId: event.id!, status };
                        } catch (error) {
                            console.error(`Error checking participation for event ${event.id}:`, error);
                            return { eventId: event.id!, status: { isParticipant: false, participantCount: 0 } };
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
                console.error('Error fetching dashboard data:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const isEventToday = (dateString: string) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />

            {/* Main content */}
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Welcome Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
                            {t('home.welcome', { name: user?.prenom })}
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            {t('home.subtitle')}
                        </p>
                    </div>
                </motion.div>

                {/* Available Trocs Section */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <ArrowRightLeft className="w-6 h-6 text-purple-600 mr-3" />
                                    Trocs disponibles
                                </h2>
                                <Button asChild variant="outline" size="sm">
                                    <Link to="/trocs">
                                        Voir tous les trocs
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    <p className="ml-3 text-gray-600">Chargement...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-600 mb-4">{error}</p>
                                    <Button onClick={() => window.location.reload()}>
                                        Réessayer
                                    </Button>
                                </div>
                            ) : trocs.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun troc disponible</h3>
                                    <p className="text-gray-500 mb-6">Soyez le premier à proposer un échange dans votre quartier !</p>
                                    <Button asChild>
                                        <Link to="/trocs/create">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Créer une annonce
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {trocs.map((troc, index) => (
                                        <motion.div
                                            key={troc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            whileHover={{ y: -4 }}
                                            className="group"
                                        >
                                            <Card className="h-full shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white">
                                                <CardContent className="p-4">
                                                    {/* Image section */}
                                                    <div className="mb-3 relative">
                                                        {troc.images && troc.images.length > 0 ? (
                                                            <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                                                                <img
                                                                    src={troc.images[0]}
                                                                    alt={troc.titre}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                                                                <ImageIcon className="w-8 h-8 text-purple-400" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                troc.type_annonce === 'offre'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {troc.type_annonce === 'offre' ? 'Offre' : 'Demande'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start justify-between mb-3">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                                            {troc.titre}
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Package className="w-4 h-4 mr-2 text-purple-500" />
                                                            <span className="line-clamp-1">{troc.objet_propose}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <ArrowRightLeft className="w-4 h-4 mr-2 text-orange-500" />
                                                            <span className="line-clamp-1">{troc.objet_recherche}</span>
                                                        </div>
                                                        {troc.prix && (
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <span className="font-medium text-green-600">{troc.prix}€</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <Button asChild size="sm" className="flex-1 mr-2">
                                                            <Link to={`/trocs/${troc.id}`}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Voir détails
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Quick Actions for Trocs */}
                            {trocs.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button asChild variant="outline" className="flex-1">
                                            <Link to="/trocs">
                                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                Parcourir tous les trocs
                                            </Link>
                                        </Button>
                                        <Button asChild className="flex-1">
                                            <Link to="/trocs/create">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Créer une annonce
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
                {/* Quick Stats */}
                <DashboardStats
                    todaysEventsCount={todaysEvents.length}
                    userEventsCount={userEvents.length}
                    loading={loading}
                />

                {/* Today's Events Section */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <CalendarDays className="w-6 h-6 text-blue-600 mr-3" />
                                    Événements d'aujourd'hui
                                </h2>
                                <Button asChild variant="outline" size="sm">
                                    <Link to="/events">
                                        Voir tous les événements
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="ml-3 text-gray-600">Chargement...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-600 mb-4">{error}</p>
                                    <Button onClick={() => window.location.reload()}>
                                        Réessayer
                                    </Button>
                                </div>
                            ) : todaysEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun événement aujourd'hui</h3>
                                    <p className="text-gray-500 mb-6">Il n'y a pas d'événements prévus dans votre quartier aujourd'hui.</p>
                                    <Button asChild>
                                        <Link to="/events/create">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Créer un événement
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {todaysEvents.map((event, index) => {
                                        const eventStatus = participationStatus[event.id!];
                                        return (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                whileHover={{ y: -4 }}
                                                className="group"
                                            >
                                                <Card className="h-full shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                                {event.nom}
                                                            </h3>
                                                            {event.url && (
                                                                <a
                                                                    href={event.url.startsWith('http') ? event.url : `https://${event.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                                {formatTime(event.date_evenement)}
                                                            </div>
                                                            <div className="flex items-start text-sm text-gray-600">
                                                                <MapPin className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-2">{event.detailed_address || event.lieu}</span>
                                                            </div>
                                                            {eventStatus && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Users className="w-4 h-4 mr-2 text-green-500" />
                                                                    {eventStatus.participantCount} participant{eventStatus.participantCount > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <Button asChild size="sm" className="flex-1 mr-2">
                                                                <Link to={`/events/${event.id}`}>
                                                                    Voir détails
                                                                </Link>
                                                            </Button>
                                                            {eventStatus?.isParticipant && (
                                                                <div className="flex items-center text-blue-600 text-sm font-medium">
                                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                                    Inscrit
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* User's Personal Events Section */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Heart className="w-6 h-6 text-green-600 mr-3" />
                                    Mes événements à venir
                                </h2>
                                <Button asChild variant="outline" size="sm">
                                    <Link to="/events/my-events">
                                        Voir tous mes événements
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    <p className="ml-3 text-gray-600">Chargement...</p>
                                </div>
                            ) : userEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun événement à venir</h3>
                                    <p className="text-gray-500 mb-6">Vous ne participez à aucun événement pour le moment.</p>
                                    <Button asChild>
                                        <Link to="/events">
                                            Découvrir les événements
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userEvents.map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            whileHover={{ x: 4 }}
                                        >
                                            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                                    {event.nom}
                                                                </h3>
                                                                {isEventToday(event.date_evenement) && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full ml-2">
                                                                        Aujourd'hui
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-600 mb-1">
                                                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                                                {formatDate(event.date_evenement)} à {formatTime(event.date_evenement)}
                                                            </div>
                                                            <div className="flex items-start text-sm text-gray-600">
                                                                <MapPin className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-1">{event.detailed_address || event.lieu}</span>
                                                            </div>
                                                        </div>
                                                        <Button asChild size="sm" variant="outline" className="ml-4">
                                                            <Link to={`/events/${event.id}`}>
                                                                Détails
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Calendar Widget and Quick Actions */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* Calendar Widget */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CalendarDays className="w-5 h-5 text-blue-600 mr-2" />
                                Calendrier personnel
                            </h3>
                            <CalendarWidget
                                events={userEvents}
                                onDateClick={(date) => {
                                    // Navigate to events page with date filter
                                    console.log('Date clicked:', date);
                                }}
                                className="border border-gray-200 rounded-lg"
                            />
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                                Actions rapides
                            </h3>
                            <div className="space-y-3">
                                <Button asChild className="w-full justify-start" size="lg">
                                    <Link to="/events/create">
                                        <Plus className="w-5 h-5 mr-3" />
                                        Créer un événement
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                                    <Link to="/trocs/create">
                                        <ArrowRightLeft className="w-5 h-5 mr-3" />
                                        Créer un troc
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                                    <Link to="/events">
                                        <Calendar className="w-5 h-5 mr-3" />
                                        Parcourir les événements
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                                    <Link to="/profile">
                                        <Users className="w-5 h-5 mr-3" />
                                        Gérer mon profil
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Admin section */}
                {user?.role === 'admin' && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center">
                                    <Users className="w-6 h-6 mr-3" />
                                    Administration
                                </h3>
                                <p className="text-blue-100 mb-6">
                                    Vous avez accès à des fonctionnalités d'administration supplémentaires.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        <Link to="/admin/dashboard">
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            Tableau de bord
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        <Link to="/admin/users">
                                            <Users className="w-5 h-5 mr-3" />
                                            Gérer les utilisateurs
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        <Link to="/admin/quartiers">
                                            <MapPin className="w-5 h-5 mr-3" />
                                            Gérer les quartiers
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Home;

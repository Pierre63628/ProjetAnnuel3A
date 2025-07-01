import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserParticipations, cancelParticipation, Evenement } from '../services/evenement.service';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, Users, ExternalLink, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const MyEvents = () => {
    const { user } = useAuth();
    const [evenements, setEvenements] = useState<Evenement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingEventId, setCancellingEventId] = useState<number | null>(null);

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getUserParticipations();
                setEvenements(data);
            } catch (err) {
                console.error(err);
                setError('Erreur lors du chargement de vos événements.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMyEvents();
        }
    }, [user]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCancelParticipation = async (eventId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler votre participation à cet événement ?')) {
            return;
        }

        try {
            setCancellingEventId(eventId);
            await cancelParticipation(eventId);
            // Remove the event from the list
            setEvenements(prev => prev.filter(event => event.id !== eventId));
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erreur lors de l\'annulation de la participation.');
        } finally {
            setCancellingEventId(null);
        }
    };

    const isEventPast = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const upcomingEvents = evenements.filter(event => !isEventPast(event.date_evenement));
    const pastEvents = evenements.filter(event => isEventPast(event.date_evenement));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Chargement de vos événements...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes événements</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {evenements.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Aucun événement</h2>
                            <p className="text-gray-500 mb-6">Vous ne participez à aucun événement pour le moment.</p>
                            <Button asChild>
                                <Link to="/events">Découvrir les événements</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Upcoming Events */}
                            {upcomingEvents.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                                        Événements à venir ({upcomingEvents.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {upcomingEvents.map((evenement, index) => (
                                            <motion.div
                                                key={evenement.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                            >
                                                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-lg font-semibold text-blue-800 flex-1">
                                                                {evenement.nom}
                                                            </h3>
                                                            {evenement.url && (
                                                                <a
                                                                    href={evenement.url.startsWith('http') ? evenement.url : `https://${evenement.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                                    title="Visiter le site de l'événement"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-sm text-gray-600 flex items-center">
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {formatDate(evenement.date_evenement)}
                                                            </p>
                                                            <p className="text-sm text-gray-600 flex items-center">
                                                                <MapPin className="w-4 h-4 mr-2" />
                                                                {evenement.detailed_address}
                                                            </p>
                                                        </div>

                                                        {evenement.description && (
                                                            <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                                                                {evenement.description}
                                                            </p>
                                                        )}

                                                        <div className="flex gap-2">
                                                            <Button asChild size="sm" className="flex-1">
                                                                <Link to={`/events/${evenement.id}`}>Détails</Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCancelParticipation(evenement.id)}
                                                                disabled={cancellingEventId === evenement.id}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                {cancellingEventId === evenement.id ? (
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                                ) : (
                                                                    <UserMinus className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Past Events */}
                            {pastEvents.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                                        Événements passés ({pastEvents.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pastEvents.map((evenement, index) => (
                                            <motion.div
                                                key={evenement.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                            >
                                                <Card className="h-full opacity-75">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-600 flex-1">
                                                                {evenement.nom}
                                                            </h3>
                                                            {evenement.url && (
                                                                <a
                                                                    href={evenement.url.startsWith('http') ? evenement.url : `https://${evenement.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                                                    title="Visiter le site de l'événement"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-sm text-gray-500 flex items-center">
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {formatDate(evenement.date_evenement)}
                                                            </p>
                                                            <p className="text-sm text-gray-500 flex items-center">
                                                                <MapPin className="w-4 h-4 mr-2" />
                                                                {evenement.detailed_address}
                                                            </p>
                                                        </div>

                                                        <Button asChild size="sm" variant="outline" className="w-full">
                                                            <Link to={`/events/${evenement.id}`}>Voir les détails</Link>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default MyEvents;

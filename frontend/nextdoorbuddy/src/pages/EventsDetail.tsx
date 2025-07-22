import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getEvenementById,
    deleteEvenement,
    checkParticipation,
    participateToEvenement,
    cancelParticipation,
    Evenement
} from '../services/evenement.service';
import Header from '../components/Header';
import EventMap from '../components/EventMap';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, User, Tag, ArrowLeft, Clock, Trash2, Edit, ExternalLink, Users, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { canDeleteEvent, canEditEvent } from '../utils/permissions';
import { getImageUrl } from '../utils/imageUtils';

const EventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [participantCount, setParticipantCount] = useState(0);
    const [participationLoading, setParticipationLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchEvenement = async () => {
            try {
                setLoading(true);
                setError('');
                if (id) {
                    const data = await getEvenementById(id);
                    setEvenement(data);

                    // Check participation status if user is logged in
                    if (user) {
                        const participationData = await checkParticipation(parseInt(id));
                        setIsParticipant(participationData.isParticipant);
                        setParticipantCount(participationData.participantCount);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Échec du chargement de l'événement.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvenement();
    }, [id, user]);

    const formatDateLong = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteEvent = async () => {
        if (!evenement || !window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const success = await deleteEvenement(evenement.id);
            if (success) {
                navigate('/events', {
                    state: { message: 'Événement supprimé avec succès' }
                });
            } else {
                setError('Erreur lors de la suppression de l\'événement');
            }
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError('Erreur lors de la suppression de l\'événement');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleParticipation = async () => {
        if (!evenement || !user) return;

        try {
            setParticipationLoading(true);
            setError('');
            setSuccessMessage('');

            if (isParticipant) {
                // Cancel participation
                const result = await cancelParticipation(evenement.id);
                setIsParticipant(false);
                if (result.participantCount !== undefined) {
                    setParticipantCount(result.participantCount);
                } else {
                    setParticipantCount(prev => prev - 1);
                }
                setSuccessMessage('Votre participation a été annulée avec succès.');
            } else {
                // Join event
                const result = await participateToEvenement(evenement.id);
                setIsParticipant(true);
                if (result.participantCount !== undefined) {
                    setParticipantCount(result.participantCount);
                } else {
                    setParticipantCount(prev => prev + 1);
                }
                setSuccessMessage('Votre participation a été enregistrée avec succès !');
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erreur lors de la gestion de la participation.');
        } finally {
            setParticipationLoading(false);
        }
    };

    const isEventPast = evenement ? new Date(evenement.date_evenement) < new Date() : false;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[500px]">
                        <div className="text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-400 animate-ping mx-auto"></div>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de l'événement</h2>
                            <p className="text-gray-600">Veuillez patienter...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !evenement) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[500px]">
                        <motion.div
                            className="text-center max-w-md"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <div className="text-red-500 text-4xl">⚠️</div>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Événement non trouvé</h2>
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{error || "L'événement que vous recherchez n'existe pas ou a été supprimé."}</p>
                            <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow" asChild>
                                <Link to="/events">
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Retour aux événements
                                </Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Back button */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow" asChild>
                        <Link to="/events">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Retour aux événements
                        </Link>
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Main content */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Event header card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                {evenement.photo_url && (
                                    <div className="h-80 w-full overflow-hidden relative">
                                        <img
                                            src={getImageUrl(evenement.photo_url) || evenement.photo_url}
                                            alt={evenement.nom}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                console.error('Failed to load event image:', evenement.photo_url);
                                                // Hide the image container if it fails to load
                                                const container = e.currentTarget.closest('.h-80') as HTMLElement;
                                                if (container) container.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    </div>
                                )}
                                <CardContent className="p-8">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        <div className="flex-1">
                                            {/* Event status badge */}
                                            <div className="flex items-center gap-3 mb-4">
                                                {isEventPast ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                        Événement terminé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                        Événement à venir
                                                    </span>
                                                )}
                                                {isParticipant && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                        <Users className="w-4 h-4 mr-1" />
                                                        Vous participez
                                                    </span>
                                                )}
                                            </div>

                                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">{evenement.nom}</h1>

                                            {/* Date and time - Enhanced */}
                                            <div className="flex items-center mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mr-4">
                                                    <Calendar className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-blue-900">{formatDateLong(evenement.date_evenement)}</p>
                                                    <p className="text-blue-700 flex items-center mt-1 text-base">
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        {formatTime(evenement.date_evenement)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {evenement.description && (
                                                <div className="mb-8">
                                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                                                    <div className="prose prose-lg max-w-none">
                                                        <p className="text-gray-700 leading-relaxed text-lg">{evenement.description}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Map card - Enhanced */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="p-8">
                                    <div className="flex items-center mb-6">
                                        <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                                            <MapPin className="w-5 h-5 text-red-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900">Localisation</h3>
                                    </div>
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-800 font-medium text-lg">{evenement.detailed_address }</p>
                                    </div>
                                    <div className="rounded-xl overflow-hidden shadow-md">
                                        <EventMap
                                            address={evenement.detailed_address}
                                            eventName={evenement.nom}
                                            className="h-64"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-1 space-y-8">
                        {/* Event details card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 sticky top-8">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-2 h-6 bg-blue-600 rounded-full mr-3"></div>
                                        Détails de l'événement
                                    </h3>

                                    <div className="space-y-6">
                                        {/* Event type */}
                                        {evenement.type_evenement && (
                                            <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mr-4">
                                                    <Tag className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-purple-600 font-medium">Type d'événement</p>
                                                    <p className="font-semibold text-purple-900 text-lg">{evenement.type_evenement}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Organizer */}
                                        {evenement.organisateur_nom && (
                                            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-4">
                                                    <User className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-green-600 font-medium">Organisateur</p>
                                                    <p className="font-semibold text-green-900 text-lg">
                                                        {evenement.organisateur_prenom} {evenement.organisateur_nom}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-100">
                                            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-4 mt-1">
                                                <MapPin className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-red-600 font-medium">Lieu</p>
                                                <p className="font-semibold text-red-900 text-base leading-relaxed">{evenement.detailed_address }</p>
                                            </div>
                                        </div>

                                        {/* Event URL */}
                                        {evenement.url && (
                                            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-4 mt-1">
                                                    <ExternalLink className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-blue-600 font-medium">Site web</p>
                                                    <a
                                                        href={evenement.url.startsWith('http') ? evenement.url : `https://${evenement.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-blue-900 hover:text-blue-700 hover:underline break-all text-base"
                                                    >
                                                        {evenement.url}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Participant count */}
                                        <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mr-4">
                                                <Users className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-orange-600 font-medium">Participants</p>
                                                <p className="font-semibold text-orange-900 text-lg">
                                                    {participantCount} {participantCount === 1 ? 'personne' : 'personnes'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick actions card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-2 h-6 bg-green-600 rounded-full mr-3"></div>
                                        Actions
                                    </h3>

                                    {/* Error message */}
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Participation button */}
                                        {user && !isEventPast && (
                                            <Button
                                                className="w-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                                variant={isParticipant ? "outline" : "solid"}
                                                onClick={handleParticipation}
                                                disabled={participationLoading}
                                                size="lg"
                                            >
                                                {participationLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                                                        {isParticipant ? 'Annulation...' : 'Inscription...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Users className="w-5 h-5 mr-3" />
                                                        {isParticipant ? 'Se désinscrire' : 'Participer à l\'événement'}
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {/* Success message */}
                                        {successMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="p-4 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <p className="text-green-700 font-medium text-center flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    {successMessage}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Error message */}
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="p-4 bg-red-50 border border-red-200 rounded-lg"
                                            >
                                                <p className="text-red-700 font-medium text-center flex items-center justify-center">
                                                    <XCircle className="w-5 h-5 mr-2" />
                                                    {error}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Message for past events */}
                                        {isEventPast && (
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                <p className="text-gray-600 font-medium text-center">
                                                    Cet événement est terminé
                                                </p>
                                            </div>
                                        )}

                                        {/* Message for non-logged users */}
                                        {!user && (
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-blue-600 font-medium text-center">
                                                    <Link to="/login" className="underline hover:text-blue-800">Connectez-vous</Link> pour participer à cet événement
                                                </p>
                                            </div>
                                        )}

                                        {/* Event URL button */}
                                        {evenement.url && (
                                            <Button className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200" variant="outline" size="lg" asChild>
                                                <a
                                                    href={evenement.url.startsWith('http') ? evenement.url : `https://${evenement.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="w-5 h-5 mr-3" />
                                                    Visiter le site de l'événement
                                                </a>
                                            </Button>
                                        )}

                                        <Button className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200" variant="outline" size="lg">
                                            Partager l'événement
                                        </Button>

                                        {/* Actions pour l'organisateur et admin */}
                                        {(canEditEvent(user, evenement) || canDeleteEvent(user, evenement)) && (
                                            <div className="pt-6 border-t border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Actions d'administration</h4>
                                                <div className="space-y-3">
                                                    {canEditEvent(user, evenement) && (
                                                        <Button
                                                            className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200"
                                                            variant="outline"
                                                            size="lg"
                                                            asChild
                                                        >
                                                            <Link to={`/events/edit/${evenement.id}`}>
                                                                <Edit className="w-5 h-5 mr-3" />
                                                                Modifier l'événement
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {canDeleteEvent(user, evenement) && (
                                                        <Button
                                                            className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200"
                                                            variant="destructive"
                                                            size="lg"
                                                            onClick={handleDeleteEvent}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="w-5 h-5 mr-3" />
                                                            {isDeleting ? 'Suppression...' : 'Supprimer l\'événement'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;

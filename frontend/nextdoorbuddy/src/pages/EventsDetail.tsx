import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvenementById, deleteEvenement, Evenement } from '../services/evenement.service';
import Header from '../components/Header';
import EventMap from '../components/EventMap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, Tag, ArrowLeft, Clock, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { canDeleteEvent, canEditEvent } from '../utils/permissions';

const EventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchEvenement = async () => {
            try {
                setLoading(true);
                setError('');
                if (id) {
                    const data = await getEvenementById(id);
                    setEvenement(data);
                    console.log(data);
                }
            } catch (err) {
                console.error(err);
                setError("Échec du chargement de l'événement.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvenement();
    }, [id]);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Chargement de l'événement...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !evenement) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="text-red-500 text-6xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Événement non trouvé</h2>
                            <p className="text-gray-600 mb-6">{error || "L'événement que vous recherchez n'existe pas."}</p>
                            <Button asChild>
                                <Link to="/events">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour aux événements
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Back button */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="outline" asChild>
                        <Link to="/events">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour aux événements
                        </Link>
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event header card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="overflow-hidden">
                                {evenement.photo_url && (
                                    <div className="h-64 w-full overflow-hidden">
                                        <img
                                            src={evenement.photo_url}
                                            alt={evenement.nom}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{evenement.nom}</h1>

                                    {/* Date and time */}
                                    <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                                        <div>
                                            <p className="font-semibold text-blue-900">{formatDateLong(evenement.date_evenement)}</p>
                                            <p className="text-blue-700 flex items-center mt-1">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatTime(evenement.date_evenement)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {evenement.description && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                            <p className="text-gray-700 leading-relaxed">{evenement.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Map card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <MapPin className="w-5 h-5 text-red-500 mr-2" />
                                        Localisation
                                    </h3>
                                    <p className="text-gray-700 mb-4">{evenement.detailed_address}</p>
                                    <EventMap
                                        address={evenement.detailed_address || evenement.lieu}
                                        eventName={evenement.nom}
                                        className="shadow-sm"
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Event details card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'événement</h3>

                                    <div className="space-y-4">
                                        {/* Event type */}
                                        {evenement.type_evenement && (
                                            <div className="flex items-center">
                                                <Tag className="w-4 h-4 text-purple-600 mr-3" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Type</p>
                                                    <p className="font-medium text-gray-900">{evenement.type_evenement}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Organizer */}
                                        {evenement.organisateur_nom && (
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 text-green-600 mr-3" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Organisateur</p>
                                                    <p className="font-medium text-gray-900">
                                                        {evenement.organisateur_prenom} {evenement.organisateur_nom}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 text-red-500 mr-3 mt-1" />
                                            <div>
                                                <p className="text-sm text-gray-600">Lieu</p>
                                                <p className="font-medium text-gray-900">{evenement.detailed_address || evenement.lieu}</p>
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
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                                    <div className="space-y-3">
                                        <Button className="w-full" variant="solid">
                                            Participer à l'événement
                                        </Button>
                                        <Button className="w-full" variant="outline">
                                            Partager l'événement
                                        </Button>

                                        {/* Actions pour l'organisateur et admin */}
                                        {canEditEvent(user, evenement) && (
                                            <div className="pt-3 border-t border-gray-200">
                                                <Button
                                                    className="w-full mb-2"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link to={`/events/edit/${evenement.id}`}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Modifier l'événement
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}

                                        {canDeleteEvent(user, evenement) && (
                                            <Button
                                                className="w-full"
                                                variant="destructive"
                                                onClick={handleDeleteEvent}
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {isDeleting ? 'Suppression...' : 'Supprimer l\'événement'}
                                            </Button>
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

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
    getPastEvenementsByQuartier,
    getAllEvenementsByQuartier,
    getAllUpcomingEvenements,
    getAllPastEvenements,
    getAllEvenements,
    deleteEvenement,
} from '../services/evenement.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { canDeleteEvent } from '../utils/permissions';

const Events = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [evenements, setEvenements] = useState([]);
    const [filteredEvenements, setFilteredEvenements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

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
                [e.nom, e.description, e.lieu, e.type_evenement]
                    .filter(Boolean)
                    .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, evenements]);

    const handleDeleteEvenement = async (id) => {
        try {
            await deleteEvenement(id);
            setEvenements((prev) => prev.filter((e) => e.id !== id));
            setFilteredEvenements((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error(err);
            alert("Impossible de supprimer l'événement.");
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
            <Header />
            <div className="container mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold text-blue-700">Événements</h1>
                    <Button asChild variant="solid">
                        <Link to="/events/create">Créer un événement</Link>
                    </Button>
                </div>

                {/* Filtres et recherche */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex space-x-2">
                        {['all', 'upcoming', 'past'].map((key) => (
                            <Button
                                key={key}
                                variant={filter === key ? 'accent' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(key)}
                            >
                                {key === 'all'
                                    ? 'Tous'
                                    : key === 'upcoming'
                                        ? 'À venir'
                                        : 'Passés'}
                            </Button>
                        ))}
                    </div>
                    <div className="relative w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* État chargement et erreurs */}
                {loading && <p className="text-center text-gray-500">Chargement...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {!loading &&
                        filteredEvenements.map((evenement) => (
                            <motion.div
                                key={evenement.id}
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <Card className="overflow-hidden">
                                    {evenement.photo_url && (
                                        <div className="h-48 w-full overflow-hidden">
                                            <img
                                                src={evenement.photo_url}
                                                alt={evenement.nom}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <CardContent className="p-4">
                                        <h3 className="text-xl font-semibold text-blue-800 mb-2">
                                            {evenement.nom}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            <strong>Date:</strong> {formatDate(evenement.date_evenement)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Lieu:</strong> {evenement.detailed_address}
                                        </p>
                                        {evenement.description && (
                                            <p className="mt-2 text-gray-700 line-clamp-3">
                                                {evenement.description}
                                            </p>
                                        )}
                                        <div className="mt-4 flex justify-between">
                                            <Button asChild size="sm">
                                                <Link to={`/events/${evenement.id}`}>Détails</Link>
                                            </Button>
                                            {canDeleteEvent(user, evenement) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteEvenement(evenement.id)}
                                                >
                                                    Supprimer
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Events;

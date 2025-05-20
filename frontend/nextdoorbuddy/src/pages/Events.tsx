import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
    getAllEvenements,
    getUpcomingEvenements,
    getPastEvenements,
    Evenement,
    deleteEvenement
} from '../services/evenement.service';

const Events = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [evenements, setEvenements] = useState<Evenement[]>([]);
    const [filteredEvenements, setFilteredEvenements] = useState<Evenement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'

    // Charger les événements
    useEffect(() => {
        const fetchEvenements = async () => {
            try {
                setLoading(true);
                setError('');

                let data: Evenement[] = [];
                
                if (filter === 'upcoming') {
                    data = await getUpcomingEvenements();
                } else if (filter === 'past') {
                    data = await getPastEvenements();
                } else {
                    data = await getAllEvenements();
                }

                setEvenements(data);
                setFilteredEvenements(data);
            } catch (error) {
                setError('Erreur lors du chargement des événements');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvenements();
    }, [filter]);

    // Filtrer les événements en fonction du terme de recherche
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredEvenements(evenements);
        } else {
            const filtered = evenements.filter(evenement =>
                evenement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (evenement.description && evenement.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (evenement.lieu && evenement.lieu.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (evenement.type_evenement && evenement.type_evenement.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredEvenements(filtered);
        }
    }, [searchTerm, evenements]);

    const handleDeleteEvenement = async (id: number) => {
        try {
            await deleteEvenement(id);
            setEvenements((prev) => prev.filter((e) => e.id !== id));
            setFilteredEvenements((prev) => prev.filter((e) => e.id !== id));
        } catch (error) {
            console.error("Erreur lors de la suppression de l'événement :", error);
            alert("Une erreur est survenue lors de la suppression.");
        }
    };


    // Formater la date
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

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Événements</h1>
                    <Link
                        to="/events/create"
                        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                        Créer un événement
                    </Link>
                </div>

                {/* Filtres et recherche */}
                <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setFilter('all')}
                            className={`rounded-md px-4 py-2 ${
                                filter === 'all'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`rounded-md px-4 py-2 ${
                                filter === 'upcoming'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            À venir
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`rounded-md px-4 py-2 ${
                                filter === 'past'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Passés
                        </button>
                    </div>
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Rechercher un événement..."
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>
                </div>

                {/* Messages d'erreur ou de chargement */}
                {loading && (
                    <div className="my-8 text-center">
                        <p className="text-gray-600">Chargement des événements...</p>
                    </div>
                )}

                {error && (
                    <div className="my-8 rounded-md bg-red-100 p-4 text-red-700">
                        <p>{error}</p>
                    </div>
                )}

                {/* Liste des événements */}
                {!loading && !error && filteredEvenements.length === 0 && (
                    <div className="my-8 text-center">
                        <p className="text-gray-600">Aucun événement trouvé.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvenements.map((evenement) => (
                        <div
                            key={evenement.id}
                            className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md"
                        >
                            {evenement.photo_url && (
                                <div className="h-48 w-full overflow-hidden">
                                    <img
                                        src={evenement.photo_url}
                                        alt={evenement.nom}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="mb-2 text-xl font-semibold">{evenement.nom}</h3>
                                <p className="mb-2 text-sm text-gray-600">
                                    {formatDate(evenement.date_evenement)}
                                </p>
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-medium">Lieu:</span> {evenement.lieu}
                                </p>
                                {evenement.organisateur_nom && (
                                    <p className="mb-2 text-sm text-gray-600">
                                        <span className="font-medium">Organisé par:</span>{' '}
                                        {evenement.organisateur_prenom} {evenement.organisateur_nom}
                                    </p>
                                )}
                                {evenement.description && (
                                    <p className="mb-4 text-gray-700">
                                        {evenement.description.length > 100
                                            ? `${evenement.description.substring(0, 100)}...`
                                            : evenement.description}
                                    </p>
                                )}
                                <div className="mt-4 flex gap-20">
                                    <Link
                                        to={`/events/${evenement.id}`}
                                        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                    >
                                        Voir les détails
                                    </Link>

                                    <button
                                        onClick={() =>handleDeleteEvenement(evenement.id)}
                                        className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-900-600"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Events;

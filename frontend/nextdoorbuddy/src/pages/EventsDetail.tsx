import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvenementById, Evenement } from '../services/evenement.service';
import Header from '../components/Header';

const EventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvenement = async () => {
            try {
                setLoading(true);
                setError('');
                if (id) {
                    const data = await getEvenementById(id);
                    setEvenement(data);
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

    if (loading) {
        return <div className="text-center mt-10">Chargement...</div>;
    }

    if (error || !evenement) {
        return <div className="text-center text-red-600 mt-10">{error || "Événement non trouvé."}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto px-4 py-6">
                <div className="mb-4">
                    <Link to="/events" className="text-blue-600 hover:underline">
                        ← Retour à la liste
                    </Link>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-md">
                    {evenement.photo_url && (
                        <div className="mb-4">
                            <img src={evenement.photo_url} alt={evenement.nom} className="w-full rounded-lg" />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold mb-2">{evenement.nom}</h1>
                    <p className="text-sm text-gray-600 mb-4">
                        {formatDate(evenement.date_evenement)}
                    </p>
                    <p className="mb-2">
                        <strong>Lieu:</strong> {evenement.lieu}
                    </p>
                    {evenement.organisateur_nom && (
                        <p className="mb-2">
                            <strong>Organisateur:</strong> {evenement.organisateur_prenom} {evenement.organisateur_nom}
                        </p>
                    )}
                    {evenement.type_evenement && (
                        <p className="mb-2">
                            <strong>Type:</strong> {evenement.type_evenement}
                        </p>
                    )}
                    <p className="mt-4">{evenement.description}</p>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;

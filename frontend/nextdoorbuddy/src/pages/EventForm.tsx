import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { createEvenement, getEvenementById, updateEvenement } from '../services/evenement.service';

const EventForm = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        date_evenement: '',
        detailed_address: '',
        type_evenement: '',
        photo_url: '',
        url: '',
        latitude: 0,
        longitude: 0,
        quartier_id: null as number | null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    useEffect(() => {
        const fetchEvenement = async () => {
            if (isEditMode && id) {
                try {
                    setInitialLoading(true);
                    const evenement = await getEvenementById(parseInt(id));

                    if (!evenement) {
                        setError('Événement non trouvé');
                        return;
                    }

                    if (evenement.organisateur_id !== user?.id && user?.role !== 'admin') {
                        setError('Vous n\'êtes pas autorisé à modifier cet événement');
                        navigate('/events');
                        return;
                    }

                    const dateObj = new Date(evenement.date_evenement);
                    const formattedDate = dateObj.toISOString().slice(0, 16);

                    setFormData({
                        nom: evenement.nom,
                        description: evenement.description || '',
                        date_evenement: formattedDate,
                        detailed_address: evenement.detailed_address || evenement.lieu || '',
                        type_evenement: evenement.type_evenement || '',
                        photo_url: evenement.photo_url || '',
                        url: evenement.url || '',
                        latitude: evenement.latitude || 0,
                        longitude: evenement.longitude || 0,
                        quartier_id: evenement.quartier_id || null
                    });
                } catch (error) {
                    setError('Erreur lors du chargement de l\'événement');
                    console.error(error);
                } finally {
                    setInitialLoading(false);
                }
            }
        };

        fetchEvenement();
    }, [id, isEditMode, user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleAddressSelect = (address: {
        adresse: string
        latitude: number
        longitude: number
        postcode: string
        city: string
        quartier_id?: number
        quartier_nom?: string
        quartierFound?: boolean
    }) => {
        setFormData({
            ...formData,
            detailed_address: address.adresse,
            latitude: address.latitude,
            longitude: address.longitude,
            quartier_id: address.quartier_id || null
        });
    };

    const validateForm = () => {
        if (!formData.nom.trim()) {
            setError(t('events.errors.nameRequired'));
            return false;
        }

        if (!formData.date_evenement) {
            setError(t('events.errors.dateRequired'));
            return false;
        }

        if (!formData.detailed_address.trim()) {
            setError(t('events.errors.addressRequired'));
            return false;
        }

        // Validate URL if provided
        if (formData.url && formData.url.trim()) {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(formData.url.trim())) {
                setError(t('events.errors.invalidUrl'));
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            if (isEditMode && id) {
                const result = await updateEvenement(parseInt(id), formData);

                if (result) {
                    setSuccess('Événement mis à jour avec succès');
                    setTimeout(() => {
                        navigate(`/events/${id}`);
                    }, 1500);
                } else {
                    setError('Erreur lors de la mise à jour de l\'événement');
                }
            } else {
                const result = await createEvenement(formData);

                if (result) {
                    setSuccess('Événement créé avec succès');
                    setTimeout(() => {
                        navigate(`/events/${result.id}`);
                    }, 1500);
                } else {
                    setError('Erreur lors de la création de l\'événement');
                }
            }
        } catch (error) {
            setError('Une erreur est survenue');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="my-8 text-center">
                        <p className="text-gray-600">Chargement de l'événement...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <h1 className="mb-6 text-2xl font-bold">
                    {isEditMode ? 'Modifier l\'événement' : 'Créer un nouvel événement'}
                </h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-md bg-green-100 p-4 text-green-700">
                        <p>{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4">
                        <label htmlFor="nom" className="mb-2 block font-medium text-gray-700">
                            Nom de l'événement *
                        </label>
                        <input
                            type="text"
                            id="nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="mb-2 block font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="date_evenement" className="mb-2 block font-medium text-gray-700">
                            Date et heure *
                        </label>
                        <input
                            type="datetime-local"
                            id="date_evenement"
                            name="date_evenement"
                            value={formData.date_evenement}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="detailed_address" className="mb-2 block font-medium text-gray-700">
                            Adresse *
                        </label>
                        <AddressAutocomplete
                            onAddressSelect={handleAddressSelect}
                            initialValue={formData.detailed_address}
                            required={true}
                            showQuartierInfo={true}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="type_evenement" className="mb-2 block font-medium text-gray-700">
                            Type d'événement
                        </label>
                        <input
                            type="text"
                            id="type_evenement"
                            name="type_evenement"
                            value={formData.type_evenement}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="Ex: fête, atelier, réunion..."
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="url" className="mb-2 block font-medium text-gray-700">
                            Site web de l'événement
                        </label>
                        <input
                            type="url"
                            id="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="https://example.com"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Lien vers la page web de l'événement (optionnel)
                        </p>
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate('/events')}
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                            disabled={loading}
                        >
                            {loading ? 'Chargement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventForm;

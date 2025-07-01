import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { getQuartiers, getUserQuartiers, addQuartierToUser, setQuartierAsPrincipal, removeQuartierFromUser, Quartier, UserQuartier } from '../services/quartier.service';
import AddressAutocomplete from '../components/AddressAutocomplete';

const Profile = () => {
    const { user, accessToken, refreshAccessToken, logout, updateUserInfo } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        adresse: '',
        latitude: null as number | null,
        longitude: null as number | null,
        telephone: '',
        date_naissance: '',
        quartier_id: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quartiers, setQuartiers] = useState<Quartier[]>([]);
    const [userQuartiers, setUserQuartiers] = useState<UserQuartier[]>([]);
    const [selectedQuartier, setSelectedQuartier] = useState<string>('');

    // Charger les données de l'utilisateur
    useEffect(() => {
        if (user) {
            setFormData({
                ...formData,
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || '',
                adresse: user.adresse || '',
                latitude: user.latitude || null,
                longitude: user.longitude || null,
                telephone: user.telephone || '',
                date_naissance: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
                quartier_id: user.quartier_id ? user.quartier_id.toString() : '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    // Charger les quartiers de l'utilisateur
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Charger tous les quartiers
                const quartiersData = await getQuartiers();
                setQuartiers(quartiersData);

                // Charger les quartiers de l'utilisateur si l'utilisateur est connecté
                if (user && user.id) {
                    try {
                        const userQuartiersData = await getUserQuartiers(user.id);
                        setUserQuartiers(userQuartiersData);

                        // Synchroniser le quartier principal entre Utilisateur et UtilisateurQuartier
                        if (user.quartier_id && userQuartiersData.length > 0) {
                            const quartierPrincipalExiste = userQuartiersData.some(q =>
                                q.quartier_id === user.quartier_id && q.est_principal);

                            if (!quartierPrincipalExiste) {
                                const quartierPrincipal = quartiersData.find(q => q.id === user.quartier_id);

                                if (quartierPrincipal) {
                                    const quartierExisteDeja = userQuartiersData.some(q => q.quartier_id === user.quartier_id);

                                    if (quartierExisteDeja) {
                                        await setQuartierAsPrincipal(user.id, user.quartier_id);
                                    } else {
                                        await addQuartierToUser(user.id, user.quartier_id, true);
                                    }

                                    const updatedUserQuartiers = await getUserQuartiers(user.id);
                                    setUserQuartiers(updatedUserQuartiers);
                                }
                            }
                        }
                    } catch (quartierError) {
                        if (quartierError instanceof Error) {
                            setError(`Erreur lors du chargement des quartiers de l'utilisateur: ${quartierError.message}`);
                        } else {
                            setError('Erreur lors du chargement des quartiers de l\'utilisateur');
                        }
                    }
                }
            } catch (error) {
                setError('Erreur lors du chargement des quartiers');
            }
        };

        fetchData();
    }, [user, accessToken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Si c'est le sélecteur de quartier à ajouter
        if (name === 'selectedQuartier') {
            setSelectedQuartier(value);
        }
    };

    const validateForm = () => {
        // Réinitialiser les messages
        setError('');
        setSuccess('');

        // Vérifier que les mots de passe correspondent si un mot de passe est fourni
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }

        // Vérifier la complexité du mot de passe si un mot de passe est fourni
        if (formData.password) {
            if (formData.password.length < 8) {
                setError('Le mot de passe doit contenir au moins 8 caractères');
                return false;
            }

            // Vérifier les critères du mot de passe
            const hasUpperCase = /[A-Z]/.test(formData.password);
            const hasLowerCase = /[a-z]/.test(formData.password);
            const hasNumbers = /[0-9]/.test(formData.password);
            const hasSpecialChar = /[\W_]/.test(formData.password);

            if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                setError('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial');
                return false;
            }
        }

        // Vérifier l'adresse (obligatoire pour une application de quartier)
        if (!formData.adresse) {
            setError('L\'adresse est requise pour une application de quartier');
            return false;
        }

        // Vérifier le format du téléphone si fourni
        if (formData.telephone && !/^[0-9]{10}$/.test(formData.telephone)) {
            setError('Le numéro de téléphone doit contenir 10 chiffres');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour modifier votre profil');
            }

            // Préparer les données à envoyer
            const dataToSend: any = {
                nom: formData.nom,
                prenom: formData.prenom,
                adresse: formData.adresse,
                latitude: formData.latitude || undefined,
                longitude: formData.longitude || undefined,
                telephone: formData.telephone || undefined,
                quartier_id: formData.quartier_id ? parseInt(formData.quartier_id) : undefined
            };

            // Ajouter la date de naissance si fournie
            if (formData.date_naissance) {
                dataToSend.date_naissance = formData.date_naissance;
            }

            // Ajouter le mot de passe si fourni
            if (formData.password) {
                dataToSend.password = formData.password;
            }

            // Envoyer la requête de mise à jour
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
            }

            const data = await response.json();
            setSuccess('Profil mis à jour avec succès');

            // Mettre à jour les données du formulaire avec les nouvelles données
            setFormData({
                ...formData,
                password: '',
                confirmPassword: ''
            });

            // Mettre à jour les informations de l'utilisateur dans le contexte
            updateUserInfo(data.user);

            // Synchroniser le quartier principal entre Utilisateur et UtilisateurQuartier
            if (user && formData.quartier_id && parseInt(formData.quartier_id) !== user.quartier_id) {
                try {
                    const quartierIdInt = parseInt(formData.quartier_id);
                    const quartierExisteDeja = userQuartiers.some(q => q.quartier_id === quartierIdInt);

                    let success = false;

                    if (quartierExisteDeja) {
                        success = await setQuartierAsPrincipal(user.id, quartierIdInt);
                    } else {
                        success = await addQuartierToUser(user.id, quartierIdInt, true);
                    }

                    if (success) {
                        const userQuartiersData = await getUserQuartiers(user.id);
                        setUserQuartiers(userQuartiersData);
                    }
                } catch (quartierError) {
                    // Erreur silencieuse - déjà gérée par les fonctions appelées
                }
            }
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            return;
        }

        setIsLoading(true);

        try {
            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour supprimer votre compte');
            }

            // Envoyer la requête de suppression
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression du compte');
            }

            // Déconnecter l'utilisateur
            logout();

            // Rediriger vers la page de connexion
            navigate('/login');
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la suppression du compte');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <div className="container mx-auto p-6">Chargement...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto p-6">
                <h1 className="mb-6 text-2xl font-bold">Mon Profil</h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-md bg-green-100 p-4 text-green-700">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                                Nom
                            </label>
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                                Prénom
                            </label>
                            <input
                                type="text"
                                id="prenom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                disabled
                            />
                            <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                        </div>

                        <div>
                            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                                Adresse
                            </label>
                            <AddressAutocomplete
                                initialValue={formData.adresse}
                                required={true}
                                onAddressSelect={(selectedAddress) => {
                                    setFormData({
                                        ...formData,
                                        adresse: selectedAddress.adresse,
                                        latitude: selectedAddress.latitude,
                                        longitude: selectedAddress.longitude
                                    });

                                    // Si un quartier a été trouvé par l'API, l'utiliser
                                    if (selectedAddress.quartierFound && selectedAddress.quartier_id) {
                                        setFormData(prev => ({
                                            ...prev,
                                            quartier_id: String(selectedAddress.quartier_id)
                                        }));
                                    }
                                    // Sinon, essayer de trouver un quartier par code postal
                                    else if (selectedAddress.postcode && quartiers.length > 0) {
                                        const matchingQuartier = quartiers.find(
                                            q => q.code_postal === selectedAddress.postcode
                                        );
                                        if (matchingQuartier) {
                                            setFormData(prev => ({
                                                ...prev,
                                                quartier_id: String(matchingQuartier.id)
                                            }));
                                        } else {
                                            // Réinitialiser le quartier si aucun n'est trouvé
                                            setFormData(prev => ({
                                                ...prev,
                                                quartier_id: ''
                                            }));
                                        }
                                    } else {
                                        // Réinitialiser le quartier si aucun n'est trouvé
                                        setFormData(prev => ({
                                            ...prev,
                                            quartier_id: ''
                                        }));
                                    }
                                }}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Commencez à saisir votre adresse pour voir les suggestions
                            </p>
                        </div>

                        <div>
                            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                                Téléphone
                            </label>
                            <input
                                type="text"
                                id="telephone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                                Date de naissance
                            </label>
                            <input
                                type="date"
                                id="date_naissance"
                                name="date_naissance"
                                value={formData.date_naissance}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="quartier_id" className="block text-sm font-medium text-gray-700">
                                Quartier
                            </label>
                            <select
                                id="quartier_id"
                                name="quartier_id"
                                value={formData.quartier_id}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            >
                                <option value="">Sélectionnez un quartier</option>
                                {quartiers.map((quartier) => (
                                    <option key={quartier.id} value={quartier.id}>
                                        {quartier.nom_quartier} ({quartier.ville})
                                    </option>
                                ))}
                            </select>
                            {!formData.quartier_id && formData.latitude && formData.longitude && (
                                <p className="mt-1 text-xs text-amber-600">
                                    ⚠️ Aucun quartier n'a été trouvé pour cette adresse. Veuillez en sélectionner un manuellement.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="mb-4 text-lg font-semibold">Mes quartiers</h2>

                        {/* Liste des quartiers de l'utilisateur */}
                        <div className="mb-6">
                            <h3 className="mb-2 text-md font-medium">Quartiers auxquels vous êtes rattaché</h3>

                            {userQuartiers.length === 0 ? (
                                <p className="text-gray-500">Vous n'êtes rattaché à aucun quartier pour le moment.</p>
                            ) : (
                                <div className="mt-2 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quartier</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ville</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {userQuartiers.map((quartier) => (
                                                <tr key={quartier.id}>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                        {quartier.nom_quartier}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {quartier.ville || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {quartier.est_principal ? (
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                                Principal
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                                                                Secondaire
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="mb-4 text-lg font-semibold">Changer de mot de passe</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            Supprimer mon compte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;

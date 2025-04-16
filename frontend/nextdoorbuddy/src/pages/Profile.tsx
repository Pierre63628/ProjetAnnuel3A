import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getQuartiers, getUserQuartiers, addQuartierToUser, setQuartierAsPrincipal, removeQuartierFromUser, Quartier, UserQuartier } from '../services/quartier.service';

const Profile = () => {
    const { user, accessToken, refreshAccessToken, logout, updateUserInfo } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        adresse: '',
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
                telephone: user.telephone || '',
                date_naissance: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
                quartier_id: user.quartier_id ? user.quartier_id.toString() : '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    // Charger les quartiers et les quartiers de l'utilisateur
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Charger tous les quartiers
                console.log('Fetching all quartiers');
                const quartiersData = await getQuartiers();
                console.log('All quartiers data received:', quartiersData);
                setQuartiers(quartiersData);

                // Charger les quartiers de l'utilisateur si l'utilisateur est connecté
                if (user && user.id) {
                    console.log('Fetching quartiers for user with ID:', user.id);
                    console.log('User info:', user);
                    console.log('Access token available:', !!accessToken);

                    try {
                        const userQuartiersData = await getUserQuartiers(user.id);
                        console.log('User quartiers data received:', userQuartiersData);
                        setUserQuartiers(userQuartiersData);

                        // Vérifier si le quartier principal de l'utilisateur est dans la liste des quartiers
                        if (user.quartier_id && userQuartiersData.length > 0) {
                            const quartierPrincipalExiste = userQuartiersData.some(q =>
                                q.quartier_id === user.quartier_id && q.est_principal);

                            if (!quartierPrincipalExiste) {
                                console.log('Le quartier principal n\'est pas dans la liste des quartiers de l\'utilisateur ou n\'est pas marqué comme principal');

                                // Trouver le quartier principal dans la liste des quartiers disponibles
                                const quartierPrincipal = quartiersData.find(q => q.id === user.quartier_id);

                                if (quartierPrincipal) {
                                    console.log(`Ajout du quartier principal ${quartierPrincipal.nom_quartier} à l'utilisateur`);

                                    // Vérifier si le quartier existe déjà dans la liste des quartiers de l'utilisateur
                                    const quartierExisteDeja = userQuartiersData.some(q => q.quartier_id === user.quartier_id);

                                    if (quartierExisteDeja) {
                                        // Si le quartier existe déjà, le définir comme principal
                                        await setQuartierAsPrincipal(user.id, user.quartier_id);
                                    } else {
                                        // Si le quartier n'existe pas encore, l'ajouter comme principal
                                        await addQuartierToUser(user.id, user.quartier_id, true);
                                    }

                                    // Recharger les quartiers de l'utilisateur
                                    const updatedUserQuartiers = await getUserQuartiers(user.id);
                                    setUserQuartiers(updatedUserQuartiers);
                                }
                            }
                        }
                    } catch (quartierError) {
                        console.error('Error fetching user quartiers:', quartierError);
                        if (quartierError instanceof Error) {
                            setError(`Erreur lors du chargement des quartiers de l'utilisateur: ${quartierError.message}`);
                        } else {
                            setError('Erreur lors du chargement des quartiers de l\'utilisateur');
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
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

    // Ajouter un quartier à l'utilisateur
    const handleAddQuartier = async () => {
        if (!selectedQuartier || !user?.id) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Vérifier si le quartier est déjà dans la liste des quartiers de l'utilisateur
            const isAlreadyAdded = userQuartiers.some(q => q.quartier_id === parseInt(selectedQuartier));
            if (isAlreadyAdded) {
                setError('Ce quartier est déjà dans votre liste de quartiers');
                return;
            }

            // Ajouter le quartier à l'utilisateur (non principal par défaut)
            const success = await addQuartierToUser(user.id, parseInt(selectedQuartier), false);

            if (success) {
                setSuccess('Quartier ajouté avec succès');

                // Recharger les quartiers de l'utilisateur
                const userQuartiersData = await getUserQuartiers(user.id);
                setUserQuartiers(userQuartiersData);

                // Réinitialiser le sélecteur
                setSelectedQuartier('');
            } else {
                setError('Erreur lors de l\'ajout du quartier');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du quartier:', error);
            setError('Erreur lors de l\'ajout du quartier');
        } finally {
            setIsLoading(false);
        }
    };

    // Définir un quartier comme principal
    const handleSetAsPrincipal = async (quartierId: number) => {
        if (!user?.id) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const success = await setQuartierAsPrincipal(user.id, quartierId);

            if (success) {
                setSuccess('Quartier défini comme principal avec succès');

                // Mettre à jour le quartier_id dans le formulaire
                setFormData({
                    ...formData,
                    quartier_id: quartierId.toString()
                });

                // Recharger les quartiers de l'utilisateur
                const userQuartiersData = await getUserQuartiers(user.id);
                setUserQuartiers(userQuartiersData);

                // Mettre à jour les informations de l'utilisateur dans le contexte
                if (user) {
                    updateUserInfo({
                        ...user,
                        quartier_id: quartierId
                    });
                }
            } else {
                setError('Erreur lors de la définition du quartier comme principal');
            }
        } catch (error) {
            console.error('Erreur lors de la définition du quartier comme principal:', error);
            setError('Erreur lors de la définition du quartier comme principal');
        } finally {
            setIsLoading(false);
        }
    };

    // Supprimer un quartier de l'utilisateur
    const handleRemoveQuartier = async (relationId: number, isPrincipal: boolean) => {
        if (!user?.id) return;

        // Si c'est le quartier principal, empêcher la suppression
        if (isPrincipal) {
            setError('Vous ne pouvez pas supprimer votre quartier principal. Définissez d\'abord un autre quartier comme principal.');
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce quartier de votre liste ?')) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const success = await removeQuartierFromUser(user.id, relationId);

            if (success) {
                setSuccess('Quartier supprimé avec succès');

                // Recharger les quartiers de l'utilisateur
                const userQuartiersData = await getUserQuartiers(user.id);
                setUserQuartiers(userQuartiersData);
            } else {
                setError('Erreur lors de la suppression du quartier');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du quartier:', error);
            setError('Erreur lors de la suppression du quartier');
        } finally {
            setIsLoading(false);
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

            // Si le quartier principal a été modifié, mettre à jour également la table UtilisateurQuartier
            if (user && formData.quartier_id && parseInt(formData.quartier_id) !== user.quartier_id) {
                try {
                    console.log(`Mise à jour du quartier principal dans UtilisateurQuartier: ${formData.quartier_id}`);
                    const quartierIdInt = parseInt(formData.quartier_id);

                    // Vérifier si le quartier existe déjà dans la liste des quartiers de l'utilisateur
                    const quartierExisteDeja = userQuartiers.some(q => q.quartier_id === quartierIdInt);

                    let success = false;

                    if (quartierExisteDeja) {
                        // Si le quartier existe déjà, le définir comme principal
                        success = await setQuartierAsPrincipal(user.id, quartierIdInt);
                    } else {
                        // Si le quartier n'existe pas encore, l'ajouter comme principal
                        success = await addQuartierToUser(user.id, quartierIdInt, true);
                    }

                    if (success) {
                        // Recharger les quartiers de l'utilisateur pour mettre à jour l'affichage
                        const userQuartiersData = await getUserQuartiers(user.id);
                        setUserQuartiers(userQuartiersData);
                    } else {
                        console.error('Erreur lors de la mise à jour du quartier principal dans UtilisateurQuartier');
                    }
                } catch (quartierError) {
                    console.error('Erreur lors de la mise à jour du quartier principal:', quartierError);
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
                            <input
                                type="text"
                                id="adresse"
                                name="adresse"
                                value={formData.adresse}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
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
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                        {!quartier.est_principal && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetAsPrincipal(quartier.quartier_id)}
                                                                className="mr-2 text-blue-600 hover:text-blue-900"
                                                                disabled={isLoading}
                                                            >
                                                                Définir comme principal
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveQuartier(quartier.id, quartier.est_principal)}
                                                            className="text-red-600 hover:text-red-900"
                                                            disabled={isLoading}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Ajouter un nouveau quartier */}
                        <div className="mb-6">
                            <h3 className="mb-2 text-md font-medium">Ajouter un quartier</h3>
                            <div className="flex items-end space-x-2">
                                <div className="flex-grow">
                                    <label htmlFor="selectedQuartier" className="block text-sm font-medium text-gray-700">
                                        Sélectionnez un quartier
                                    </label>
                                    <select
                                        id="selectedQuartier"
                                        name="selectedQuartier"
                                        value={selectedQuartier}
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
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddQuartier}
                                    disabled={!selectedQuartier || isLoading}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    Ajouter
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Vous pouvez ajouter des quartiers secondaires pour accéder aux informations de plusieurs quartiers.
                            </p>
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

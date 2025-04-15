import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

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
    const [quartiers, setQuartiers] = useState<any[]>([]);

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

    // Charger les quartiers
    useEffect(() => {
        const fetchQuartiers = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/quartiers');
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des quartiers');
                }
                const data = await response.json();
                setQuartiers(data);
            } catch (error) {
                console.error('Erreur:', error);
            }
        };

        fetchQuartiers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
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
            const response = await fetch(`http://localhost:3000/api/users/${user?.id}`, {
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
            const response = await fetch(`http://localhost:3000/api/users/${user?.id}`, {
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

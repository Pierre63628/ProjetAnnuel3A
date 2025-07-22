import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getQuartiers, getUserQuartiers, addQuartierToUser, setQuartierAsPrincipal, Quartier, UserQuartier } from '../services/quartier.service';
import AddressAutocomplete from '../components/AddressAutocomplete';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Lock,
    Save,
    Trash2,
    AlertCircle,
    CheckCircle,
    Info,
    Shield
} from 'lucide-react';

const Profile = () => {
    const { user, accessToken, refreshAccessToken, logout, updateUserInfo } = useAuth();
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
        profile_picture: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quartiers, setQuartiers] = useState<Quartier[]>([]);
    const [userQuartiers, setUserQuartiers] = useState<UserQuartier[]>([]);

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
                profile_picture: user.profile_picture || '',
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
    };

    const handleProfilePictureChange = (imageUrl: string | null) => {
        setFormData({
            ...formData,
            profile_picture: imageUrl || ''
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
                latitude: formData.latitude || undefined,
                longitude: formData.longitude || undefined,
                telephone: formData.telephone || undefined,
                quartier_id: formData.quartier_id ? parseInt(formData.quartier_id) : undefined,
                profile_picture: formData.profile_picture || undefined
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Mon Profil
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Gérez vos informations personnelles et vos préférences
                    </p>
                </motion.div>

                {/* Alert Messages */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-red-700">{error}</span>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
                    >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-green-700">{success}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Picture Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardContent className="p-8">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Photo de profil
                                    </h2>
                                    <ProfilePictureUpload
                                        currentPicture={formData.profile_picture}
                                        onPictureChange={handleProfilePictureChange}
                                        userName={`${formData.prenom || ''} ${formData.nom || ''}`.trim()}
                                        size="xl"
                                        disabled={isLoading}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Personal Information Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardContent className="p-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Informations personnelles
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            placeholder="Votre nom de famille"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            id="prenom"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            placeholder="Votre prénom"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Adresse email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed transition-all duration-200"
                                        />
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                            <Info className="w-4 h-4 mr-1" />
                                            L'adresse email ne peut pas être modifiée
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Contact & Location Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardContent className="p-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Contact et localisation
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            Adresse *
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
                                            <p className="mt-2 text-sm text-gray-500">
                                                Commencez à saisir votre adresse pour voir les suggestions
                                            </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                                                <Phone className="w-4 h-4 inline mr-1" />
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                id="telephone"
                                                name="telephone"
                                                value={formData.telephone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                placeholder="0123456789"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                Date de naissance
                                            </label>
                                            <input
                                                type="date"
                                                id="date_naissance"
                                                name="date_naissance"
                                                value={formData.date_naissance}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="quartier_id" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Shield className="w-4 h-4 inline mr-1" />
                                            Quartier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="quartier_display"
                                                value={
                                                    formData.quartier_id && quartiers.length > 0
                                                        ? (() => {
                                                            const quartier = quartiers.find(q => q.id === parseInt(formData.quartier_id));
                                                            return quartier ? `${quartier.nom_quartier} (${quartier.ville})` : 'Quartier non trouvé';
                                                        })()
                                                        : 'Aucun quartier assigné'
                                                }
                                                disabled
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed transition-all duration-200"
                                            />
                                            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                            <Info className="w-4 h-4 mr-1" />
                                            Le quartier est déterminé automatiquement par votre adresse et ne peut pas être modifié
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Security Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardContent className="p-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Lock className="w-5 h-5 mr-2" />
                                    Sécurité
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            placeholder="Laissez vide pour ne pas changer"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            placeholder="Confirmez le nouveau mot de passe"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-start">
                                        <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium mb-1">Exigences du mot de passe :</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Au moins 8 caractères</li>
                                                <li>Une majuscule et une minuscule</li>
                                                <li>Au moins un chiffre</li>
                                                <li>Au moins un caractère spécial</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-between"
                    >
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                    />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Enregistrer les modifications
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            variant="destructive"
                            className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-5 h-5 mr-2" />
                            Supprimer mon compte
                        </Button>
                    </motion.div>
                </form>
            </main>
        </div>
    );
};

export default Profile;

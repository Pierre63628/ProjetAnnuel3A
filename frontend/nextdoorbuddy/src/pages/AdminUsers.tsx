import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    Users,
    Search,
    Edit,
    Trash2,
    Shield,
    ShieldCheck,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    User
} from 'lucide-react';

interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    adresse?: string;
    telephone?: string;
    date_naissance?: string;
    quartier_id?: number;
    nom_quartier?: string;
    ville?: string;
    code_postal?: string;
    role: string;
    email_verified?: boolean;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

interface QuartierGroup {
    quartier: string;
    quartier_id?: number;
    ville?: string;
    users: User[];
}

const AdminUsers = () => {
    const { user, accessToken, refreshAccessToken } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [quartierGroups, setQuartierGroups] = useState<QuartierGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        adresse: '',
        telephone: '',
        date_naissance: '',
        quartier_id: '',
        role: '',
        email_verified: false,
        password: ''
    });
    const [quartiers, setQuartiers] = useState<any[]>([]);

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Organiser les utilisateurs par quartier
    const organizeUsersByQuartier = (users: User[]) => {
        const groups: { [key: string]: QuartierGroup } = {};

        users.forEach(user => {
            const quartierKey = user.nom_quartier || 'Sans Quartier';

            if (!groups[quartierKey]) {
                groups[quartierKey] = {
                    quartier: quartierKey,
                    quartier_id: user.quartier_id,
                    ville: user.ville,
                    users: []
                };
            }

            groups[quartierKey].users.push(user);
        });

        // Trier les groupes et les utilisateurs
        const sortedGroups = Object.values(groups).sort((a, b) => {
            // "Sans Quartier" en dernier
            if (a.quartier === 'Sans Quartier') return 1;
            if (b.quartier === 'Sans Quartier') return -1;
            return a.quartier.localeCompare(b.quartier);
        });

        // Trier les utilisateurs dans chaque groupe
        sortedGroups.forEach(group => {
            group.users.sort((a, b) => {
                const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
        });

        return sortedGroups;
    };

    // Charger les utilisateurs
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError('');

                // Rafraîchir le token d'accès si nécessaire
                const token = await refreshAccessToken() || accessToken;

                if (!token) {
                    throw new Error('Vous devez être connecté pour accéder à cette page');
                }

                const response = await fetch('https://doorbudy.cloud/api/users/with-quartier', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs');
                }

                const data = await response.json();
                setUsers(data);
                setQuartierGroups(organizeUsersByQuartier(data));
            } catch (error: any) {
                setError(error.message || 'Erreur lors de la récupération des utilisateurs');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [accessToken, refreshAccessToken]);

    // Filtrer les utilisateurs
    const getFilteredUsers = () => {
        let filtered = users;

        // Filtre par terme de recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                `${user.nom} ${user.prenom}`.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                (user.nom_quartier && user.nom_quartier.toLowerCase().includes(term)) ||
                (user.ville && user.ville.toLowerCase().includes(term))
            );
        }

        // Filtre par rôle
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Filtre par statut de vérification
        if (verificationFilter !== 'all') {
            const isVerified = verificationFilter === 'verified';
            filtered = filtered.filter(user => user.email_verified === isVerified);
        }

        return organizeUsersByQuartier(filtered);
    };

    // Mettre à jour les groupes filtrés quand les filtres changent
    useEffect(() => {
        setQuartierGroups(getFilteredUsers());
    }, [searchTerm, roleFilter, verificationFilter, users]);

    // Charger les quartiers
    useEffect(() => {
        const fetchQuartiers = async () => {
            try {
                const response = await fetch('https://doorbudy.cloud/api/quartiers');
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

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            adresse: user.adresse || '',
            telephone: user.telephone || '',
            date_naissance: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
            quartier_id: user.quartier_id ? user.quartier_id.toString() : '',
            role: user.role,
            email_verified: user.email_verified || false,
            password: ''
        });
        setShowEditModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            setError('');
            setSuccess('');

            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour modifier un utilisateur');
            }

            // Préparer les données à envoyer
            const dataToSend: any = {
                nom: formData.nom,
                prenom: formData.prenom,
                adresse: formData.adresse,
                telephone: formData.telephone || undefined,
                quartier_id: formData.quartier_id ? parseInt(formData.quartier_id) : undefined,
                role: formData.role,
                email_verified: formData.email_verified
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
            const response = await fetch(`https://doorbudy.cloud/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'utilisateur');
            }

            const data = await response.json();

            // Mettre à jour la liste des utilisateurs
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data.user } : u));

            setSuccess('Utilisateur mis à jour avec succès');
            setEditingUser(null);
            setShowEditModal(false);
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            // Rafraîchir le token d'accès si nécessaire
            const token = await refreshAccessToken() || accessToken;

            if (!token) {
                throw new Error('Vous devez être connecté pour supprimer un utilisateur');
            }

            // Envoyer la requête de suppression
            const response = await fetch(`https://doorbudy.cloud/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression de l\'utilisateur');
            }

            // Mettre à jour la liste des utilisateurs
            setUsers(users.filter(u => u.id !== userId));

            setSuccess('Utilisateur supprimé avec succès');
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setShowEditModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Chargement des utilisateurs...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />

            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative container mx-auto p-6">
                {/* Header Section */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div className="flex items-center mb-4 lg:mb-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                                <p className="text-gray-600">Administrer les comptes utilisateurs par quartier</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                <span className="text-sm text-gray-600">Total: </span>
                                <span className="font-semibold text-blue-600">{users.length} utilisateurs</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Alerts */}
                {error && (
                    <motion.div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <p className="text-green-800">{success}</p>
                        </div>
                    </motion.div>
                )}

                {/* Search and Filters */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher par nom, email ou quartier..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                        />
                                    </div>
                                </div>

                                {/* Role Filter */}
                                <div>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                    >
                                        <option value="all">Tous les rôles</option>
                                        <option value="admin">Administrateurs</option>
                                        <option value="user">Utilisateurs</option>
                                    </select>
                                </div>

                                {/* Verification Filter */}
                                <div>
                                    <select
                                        value={verificationFilter}
                                        onChange={(e) => setVerificationFilter(e.target.value as 'all' | 'verified' | 'unverified')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="verified">Email vérifié</option>
                                        <option value="unverified">Email non vérifié</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Users by Quartier */}
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {quartierGroups.map((group, groupIndex) => (
                        <motion.div
                            key={group.quartier}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * groupIndex }}
                        >
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                                {/* Quartier Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <MapPin className="w-5 h-5 text-white mr-3" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {group.quartier}
                                                </h3>
                                                {group.ville && (
                                                    <p className="text-blue-100 text-sm">{group.ville}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                                            <span className="text-white text-sm font-medium">
                                                {group.users.length} utilisateur{group.users.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Users List */}
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {group.users.map((user, userIndex) => (
                                            <motion.div
                                                key={user.id}
                                                className="p-6 hover:bg-gray-50 transition-colors duration-200"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.05 * userIndex }}
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                                    {/* User Info */}
                                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:mb-0">
                                                        {/* Basic Info */}
                                                        <div className="flex items-center">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-4">
                                                                {user.nom.charAt(0)}{user.prenom.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {user.nom} {user.prenom}
                                                                </h4>
                                                                <div className="flex items-center mt-1">
                                                                    <Mail className="w-3 h-3 text-gray-400 mr-1" />
                                                                    <span className="text-sm text-gray-600">{user.email}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Contact & Details */}
                                                        <div className="space-y-2">
                                                            {user.telephone && (
                                                                <div className="flex items-center">
                                                                    <Phone className="w-3 h-3 text-gray-400 mr-2" />
                                                                    <span className="text-sm text-gray-600">{user.telephone}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center">
                                                                <Calendar className="w-3 h-3 text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-600">
                                                                    Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Status & Role */}
                                                        <div className="flex flex-col space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    user.role === 'admin'
                                                                        ? 'bg-purple-100 text-purple-800'
                                                                        : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {user.role === 'admin' ? (
                                                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                                                    ) : (
                                                                        <User className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                {user.email_verified ? (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        Email vérifié
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        <XCircle className="w-3 h-3 mr-1" />
                                                                        Email non vérifié
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            onClick={() => handleEditUser(user)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-white/50 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Modifier
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-white/50 backdrop-blur-sm border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {quartierGroups.length === 0 && (
                        <motion.div
                            className="text-center py-12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                            <p className="text-gray-500">
                                {searchTerm || roleFilter !== 'all' || verificationFilter !== 'all'
                                    ? 'Aucun utilisateur ne correspond aux critères de recherche.'
                                    : 'Aucun utilisateur n\'est encore inscrit.'}
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Edit Modal */}
                {showEditModal && editingUser && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.target === e.currentTarget && cancelEdit()}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Edit className="w-6 h-6 text-white mr-3" />
                                        <h2 className="text-xl font-semibold text-white">
                                            Modifier l'utilisateur
                                        </h2>
                                    </div>
                                    <button
                                        onClick={cancelEdit}
                                        className="text-white hover:text-gray-200 transition-colors"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Personal Information Section */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <User className="w-5 h-5 mr-2" />
                                            Informations personnelles
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nom
                                                </label>
                                                <input
                                                    type="text"
                                                    id="nom"
                                                    name="nom"
                                                    value={formData.nom}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Prénom
                                                </label>
                                                <input
                                                    type="text"
                                                    id="prenom"
                                                    name="prenom"
                                                    value={formData.prenom}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information Section */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <Mail className="w-5 h-5 mr-2" />
                                            Informations de contact
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    disabled
                                                />
                                                <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                                            </div>

                                            <div>
                                                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Téléphone
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="telephone"
                                                    name="telephone"
                                                    value={formData.telephone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresse
                                            </label>
                                            <input
                                                type="text"
                                                id="adresse"
                                                name="adresse"
                                                value={formData.adresse}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Location & Administrative Section */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <MapPin className="w-5 h-5 mr-2" />
                                            Localisation et administration
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700 mb-2">
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

                                            <div>
                                                <label htmlFor="quartier_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quartier
                                                </label>
                                                <select
                                                    id="quartier_id"
                                                    name="quartier_id"
                                                    value={formData.quartier_id}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                >
                                                    <option value="">Sélectionnez un quartier</option>
                                                    {quartiers.map((quartier) => (
                                                        <option key={quartier.id} value={quartier.id}>
                                                            {quartier.nom_quartier} ({quartier.ville})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rôle
                                                </label>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                >
                                                    <option value="user">Utilisateur</option>
                                                    <option value="admin">Administrateur</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="email_verified"
                                                    name="email_verified"
                                                    checked={formData.email_verified}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <label htmlFor="email_verified" className="ml-2 text-sm font-medium text-gray-700">
                                                    Email vérifié
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Section */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <Shield className="w-5 h-5 mr-2" />
                                            Sécurité
                                        </h3>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nouveau mot de passe (optionnel)
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">Laissez vide pour ne pas changer le mot de passe</p>
                                        </div>
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            onClick={cancelEdit}
                                            variant="outline"
                                            className="bg-white/50 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Enregistrer
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;

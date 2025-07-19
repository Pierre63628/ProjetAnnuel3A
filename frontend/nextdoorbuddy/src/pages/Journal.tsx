import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import RejectModal from '../components/RejectModal';
import {
    BookOpen,
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    Shield,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    Image
} from 'lucide-react';
import journalService, { JournalArticle, Edition } from '../services/journal.service';
import uploadService from '../services/upload.service';

const Journal: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<JournalArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedStatus, setSelectedStatus] = useState<'all' | 'brouillon' | 'a_valider' | 'valide' | 'refuse'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'Actualités', 'Événements', 'Améliorations', 'Environnement', 'Culture', 'Sport', 'Autres'];
    const [activeTab, setActiveTab] = useState<'articles' | 'journals' | 'editions'>('articles');
    const [validatedArticles, setValidatedArticles] = useState<JournalArticle[]>([]);
    const [loadingValidated, setLoadingValidated] = useState<boolean>(false);
    const [editions, setEditions] = useState<Edition[]>([]);
    const [loadingEditions, setLoadingEditions] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        article: JournalArticle | null;
    }>({
        isOpen: false,
        article: null
    });

    const [rejectModal, setRejectModal] = useState<{
        isOpen: boolean;
        article: JournalArticle | null;
    }>({
        isOpen: false,
        article: null
    });

    useEffect(() => {
        loadArticles();
    }, []);

    useEffect(() => {
        // Si l'utilisateur n'est pas admin et essaie d'accéder à l'onglet journals, rediriger vers articles
        if (activeTab === 'journals' && user?.role !== 'admin') {
            setActiveTab('articles');
            return;
        }
        
        if (activeTab === 'journals') {
            loadValidatedArticles();
        } else if (activeTab === 'editions') {
            loadEditions();
        }
    }, [activeTab, user?.role]);

    const loadArticles = async () => {
        try {
            console.log('=== FRONTEND: Début du chargement des articles ===');
            console.log('User:', user);
            console.log('User role:', user?.role);
            console.log('User ID:', user?.id);
            
            setIsLoading(true);
            setError(null);
            
            let data: JournalArticle[];
            if (user?.role === 'admin') {
                console.log('FRONTEND: Mode ADMIN - Chargement de tous les articles');
                data = await journalService.getAllArticles();
                
                // Filtrer les brouillons des autres utilisateurs pour les admins
                data = data.filter(article => {
                    // Les admins peuvent voir :
                    // 1. Tous leurs propres articles (quel que soit le statut)
                    // 2. Les articles des autres utilisateurs seulement s'ils ne sont pas en brouillon
                    if (article.authorId === user?.id) {
                        return true; // L'admin peut voir tous ses propres articles
                    } else {
                        return article.status !== 'brouillon'; // L'admin ne peut pas voir les brouillons des autres
                    }
                });
                
                console.log('FRONTEND: Articles filtrés pour admin:', data.length);
            } else {
                console.log('FRONTEND: Mode USER - Chargement des articles de l\'utilisateur');
                data = await journalService.getMyArticles();
            }
            
            console.log('FRONTEND: Articles reçus:', data);
            console.log('FRONTEND: Nombre d\'articles:', data.length);
            
            setArticles(data);
            console.log('FRONTEND: Articles mis à jour dans le state');
        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement des articles:', err);
            setError('Erreur lors du chargement des articles');
        } finally {
            setIsLoading(false);
            console.log('FRONTEND: Chargement terminé');
        }
    };

    const loadValidatedArticles = async () => {
        try {
            console.log('=== FRONTEND: Chargement des articles validés sans édition ===');
            setLoadingValidated(true);
            setError(null);
            
            const data = await journalService.getValidatedArticlesWithoutEdition();
            
            console.log('FRONTEND: Articles validés sans édition reçus:', data);
            console.log('FRONTEND: Nombre d\'articles validés sans édition:', data.length);
            
            setValidatedArticles(data);
            console.log('FRONTEND: Articles validés sans édition mis à jour dans le state');
        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement des articles validés sans édition:', err);
            setError('Erreur lors du chargement des articles validés sans édition');
        } finally {
            setLoadingValidated(false);
            console.log('FRONTEND: Chargement des articles validés sans édition terminé');
        }
    };

    const loadEditions = async () => {
        try {
            console.log('=== FRONTEND: Chargement des éditions ===');
            setLoadingEditions(true);
            setError(null);
            
            const data = await journalService.getEditions();
            
            console.log('FRONTEND: Éditions reçues:', data);
            console.log('FRONTEND: Nombre d\'éditions:', data.length);
            
            // Debug: Vérifier la structure de chaque édition
            if (data.length > 0) {
                console.log('FRONTEND: Structure de la première édition:', data[0]);
                console.log('FRONTEND: UUID de la première édition:', data[0].uuid);
                console.log('FRONTEND: Toutes les propriétés de la première édition:', Object.keys(data[0]));
            }
            
            setEditions(data);
            console.log('FRONTEND: Éditions mises à jour dans le state');
        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement des éditions:', err);
            setError('Erreur lors du chargement des éditions');
        } finally {
            setLoadingEditions(false);
            console.log('FRONTEND: Chargement des éditions terminé');
        }
    };

    const handleDeleteArticle = (article: JournalArticle) => {
        setDeleteModal({
            isOpen: true,
            article
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.article) return;
        
        try {
            await journalService.deleteArticle(deleteModal.article._id);
            setArticles(articles.filter(a => a._id !== deleteModal.article!._id));
            setDeleteModal({ isOpen: false, article: null });
        } catch (err) {
            setError('Erreur lors de la suppression');
            console.error('Error deleting article:', err);
            setDeleteModal({ isOpen: false, article: null });
        }
    };

    const handleSubmitForValidation = async (article: JournalArticle) => {
        try {
            await journalService.submitForValidation(article._id);
            await loadArticles(); // Recharger les articles
        } catch (err) {
            setError('Erreur lors de la soumission');
            console.error('Error submitting article:', err);
        }
    };

    const handleValidate = async (article: JournalArticle) => {
        try {
            await journalService.validateArticle(article._id, 'Article validé par l\'administrateur');
            await loadArticles(); // Recharger les articles
        } catch (err) {
            setError('Erreur lors de la validation');
            console.error('Error validating article:', err);
        }
    };

    const handleReject = (article: JournalArticle) => {
        setRejectModal({
            isOpen: true,
            article
        });
    };

    const confirmReject = async (comment: string) => {
        if (!rejectModal.article) return;
        
        try {
            await journalService.rejectArticle(rejectModal.article._id, comment);
            await loadArticles(); // Recharger les articles
        } catch (err) {
            setError('Erreur lors du rejet');
            console.error('Error rejecting article:', err);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            brouillon: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Brouillon' },
            a_valider: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'À valider' },
            valide: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Validé' },
            refuse: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Refusé' }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };



    // Fonctions utilitaires pour les semaines
    const getWeekNumber = (date: Date): string => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    };

    const getWeekLabel = (weekKey: string): string => {
        if (weekKey === 'all') return 'Toutes les semaines';
        const [year, week] = weekKey.split('-W');
        const startDate = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        return `Semaine ${week} (${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')})`;
    };

    const getAvailableWeeks = (): string[] => {
        const weeks = new Set<string>();
        articles.forEach(article => {
            const articleDate = new Date(article.date);
            weeks.add(getWeekNumber(articleDate));
        });
        return ['all', ...Array.from(weeks).sort().reverse()];
    };

    const getAvailableWeeksForValidated = (): string[] => {
        const weeks = new Set<string>();
        validatedArticles.forEach(article => {
            const articleDate = new Date(article.date);
            weeks.add(getWeekNumber(articleDate));
        });
        return ['all', ...Array.from(weeks).sort().reverse()];
    };

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            article.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const filteredValidatedArticles = validatedArticles; // Pas de filtrage pour les articles validés sans journal

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Chargement des articles...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                                Journal du quartier
                                {user?.role === 'admin' && (
                                    <span className="ml-3 flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        <Shield className="w-4 h-4 mr-1" />
                                        Admin
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-600 text-lg mb-6">
                                {user?.role === 'admin' 
                                    ? 'Gérez tous les articles du quartier'
                                    : 'Gérez vos articles et consultez le journal du quartier'
                                }
                            </p>

                            {/* Onglets */}
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('articles')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                            activeTab === 'articles'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Gestion des articles
                                        </div>
                                    </button>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => setActiveTab('journals')}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                                activeTab === 'journals'
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                Articles sans édition
                                            </div>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTab('editions')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                            activeTab === 'editions'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            Journaux
                                        </div>
                                    </button>
                                </nav>
                            </div>
                        </div>
                        
                        {(activeTab !== 'editions' || user?.role === 'admin') && (
                            <Button 
                                onClick={() => {
                                    if (activeTab === 'journals') {
                                        navigate('/journal/new');
                                    } else if (activeTab === 'editions') {
                                        navigate('/journal/new');
                                    } else {
                                        navigate('/journal/create');
                                    }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                {activeTab === 'journals' || activeTab === 'editions' ? 'Nouveau journal' : 'Nouvel article'}
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-center text-red-800">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}

                {/* Contenu selon l'onglet actif */}
                {activeTab === 'articles' ? (
                    <>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
                                    <div className="text-sm text-gray-600">Total d'articles</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {articles.filter(a => a.status === 'valide').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Articles publiés</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {articles.filter(a => a.status === 'brouillon').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Articles en brouillon</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {articles.filter(a => a.status === 'a_valider').length}
                                    </div>
                                    <div className="text-sm text-gray-600">En attente</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6"
                >
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher dans les articles..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="md:w-56">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category === 'all' ? 'Toutes les catégories' : category}
                                            </option>
                                        ))}
                                    </select>
                                </div>



                                {/* Status Filter (Admin only) */}
                                {user?.role === 'admin' && (
                                    <div className="md:w-48">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        >
                                            <option value="all">Tous les statuts</option>
                                            <option value="brouillon">Brouillons</option>
                                            <option value="a_valider">À valider</option>
                                            <option value="valide">Validés</option>
                                            <option value="refuse">Refusés</option>
                                        </select>
                                    </div>
                                )}


                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Articles List */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4"
                >
                    {filteredArticles.length === 0 ? (
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Aucun article trouvé
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                                        ? 'Aucun article ne correspond à vos critères de recherche'
                                        : user?.role === 'admin' 
                                            ? 'Aucun article dans le système'
                                            : 'Vous n\'avez pas encore créé d\'articles'
                                    }
                                </p>
                                {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
                                    <Button 
                                        onClick={() => navigate('/journal/create')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {user?.role === 'admin' ? 'Créer un article' : 'Créer votre premier article'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredArticles.map((article) => (
                            <motion.div
                                key={article._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Image à gauche */}
                                            {article.imageUrl && (
                                                <div className="flex-shrink-0 lg:w-48">
                                                    <img 
                                                        src={uploadService.getImageUrl(article.imageUrl)} 
                                                        alt={`Image de l'article : ${article.title}`}
                                                        className="w-full h-32 lg:h-40 object-cover rounded-lg shadow-md"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {article.title}
                                                    </h3>
                                                    {getStatusBadge(article.status)}
                                                </div>
                                                <p className="text-gray-600 mb-2">
                                                    Par <span className="font-medium">{article.authorName}</span> • 
                                                    {new Date(article.date).toLocaleDateString('fr-FR')} • 
                                                    <span className="text-blue-600 font-medium">Semaine {getWeekNumber(new Date(article.date)).split('-W')[1]}</span> • 
                                                    Catégorie: <span className="font-medium">{article.category}</span> • 
                                                    Quartier: <span className="font-medium">{article.quartierName}</span>
                                                </p>
                                                <div 
                                                    className="text-gray-700 mb-4 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{
                                                        __html: article.content.length > 200 
                                                            ? `${article.content.substring(0, 200)}...`
                                                            : article.content
                                                    }}
                                                />

                                                {/* Affichage des images multiples (si pas d'image principale) */}
                                                {!article.imageUrl && article.images && article.images.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Image className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Images ({article.images.length})
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                                            {article.images.slice(0, 3).map((imageUrl, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                                                                >
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={`Image ${index + 1} de l'article`}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg2MFY2MEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI1IDI1SDM1VjM1SDI1VjI1WiIgZmlsbD0iI0M3Q0ZEMiIvPgo8cGF0aCBkPSJNMzAgNDBMMjAgNTBINjBMMzAgNDBaIiBmaWxsPSIjQzdDRkQyIi8+Cjwvc3ZnPgo=';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                            {article.images.length > 3 && (
                                                                <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-500">
                                                                        +{article.images.length - 3}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/journal/${article._id}`)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Voir
                                            </Button>

                                            {/* Actions pour les utilisateurs normaux (auteurs) */}
                                            {user?.role !== 'admin' && article.authorId === user?.id && (
                                                <>
                                                    {/* Boutons pour les brouillons */}
                                                    {article.status === 'brouillon' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/journal/edit/${article._id}`)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Modifier
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleSubmitForValidation(article)}
                                                            >
                                                                Soumettre
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteArticle(article)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Supprimer
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Boutons pour les articles refusés */}
                                                    {article.status === 'refuse' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/journal/edit/${article._id}`)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Modifier
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteArticle(article)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Supprimer
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {/* Actions pour les admins */}
                                            {user?.role === 'admin' && (
                                                <>
                                                    {/* Boutons pour les brouillons (admin peut modifier/supprimer ses propres articles) */}
                                                    {article.status === 'brouillon' && article.authorId === user?.id && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/journal/edit/${article._id}`)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Modifier
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleSubmitForValidation(article)}
                                                            >
                                                                Soumettre
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteArticle(article)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Supprimer
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Boutons pour les articles refusés (admin peut modifier/supprimer ses propres articles) */}
                                                    {article.status === 'refuse' && article.authorId === user?.id && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/journal/edit/${article._id}`)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Modifier
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteArticle(article)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Supprimer
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Boutons de validation/rejet pour tous les articles à valider */}
                                                    {article.status === 'a_valider' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-green-600 border-green-600 hover:bg-green-50"
                                                                onClick={() => handleValidate(article)}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Valider
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleReject(article)}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Rejeter
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </motion.div>

                {/* Modal de confirmation de suppression */}
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, article: null })}
                    onConfirm={confirmDelete}
                    title="Confirmer la suppression"
                    message={`Êtes-vous sûr de vouloir supprimer l'article "${deleteModal.article?.title}" ? Cette action est irréversible.`}
                    confirmText="Supprimer"
                    cancelText="Annuler"
                    type="danger"
                />

                {/* Modal de rejet d'article */}
                <RejectModal
                    isOpen={rejectModal.isOpen}
                    onClose={() => setRejectModal({ isOpen: false, article: null })}
                    onConfirm={confirmReject}
                    articleTitle={rejectModal.article?.title || ''}
                />
                    </>
                ) : activeTab === 'journals' && user?.role === 'admin' ? (
                    /* Onglet Articles sans édition - Articles validés (Admin uniquement) */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Stats des articles validés */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-6"
                        >
                            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{validatedArticles.length}</div>
                                            <div className="text-sm text-gray-600">Articles validés sans édition</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {new Set(validatedArticles.map(a => a.quartierName)).size}
                                            </div>
                                            <div className="text-sm text-gray-600">Quartiers</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {new Set(validatedArticles.map(a => a.authorId)).size}
                                            </div>
                                            <div className="text-sm text-gray-600">Auteurs</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>



                        {/* Liste des articles validés */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-4"
                        >
                            {loadingValidated ? (
                                <Card className="shadow-lg border-0">
                                    <CardContent className="p-12 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Chargement des articles validés...</p>
                                    </CardContent>
                                </Card>
                            ) : filteredValidatedArticles.length === 0 ? (
                                <Card className="shadow-lg border-0">
                                    <CardContent className="p-12 text-center">
                                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Aucun article validé sans édition trouvé
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            Aucun article validé sans édition n'est disponible
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredValidatedArticles.map((article) => (
                                    <motion.div
                                        key={article._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-50 to-white">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    {/* Image à gauche */}
                                                    {article.imageUrl && (
                                                        <div className="flex-shrink-0 lg:w-48">
                                                            <img 
                                                                src={uploadService.getImageUrl(article.imageUrl)} 
                                                                alt={`Image de l'article : ${article.title}`}
                                                                className="w-full h-32 lg:h-40 object-cover rounded-lg shadow-md"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-xl font-semibold text-gray-900">
                                                                {article.title}
                                                            </h3>
                                                            {getStatusBadge(article.status)}
                                                        </div>
                                                        <p className="text-gray-600 mb-2">
                                                            Par <span className="font-medium">{article.authorName}</span> • 
                                                            {new Date(article.date).toLocaleDateString('fr-FR')} • 
                                                            <span className="text-green-600 font-medium">Semaine {getWeekNumber(new Date(article.date)).split('-W')[1]}</span> • 
                                                            Catégorie: <span className="font-medium">{article.category}</span> • 
                                                            Quartier: <span className="font-medium">{article.quartierName}</span>
                                                        </p>
                                                        <div 
                                                            className="text-gray-700 mb-4 prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{
                                                                __html: article.content.length > 300 
                                                                    ? `${article.content.substring(0, 300)}...`
                                                                    : article.content
                                                            }}
                                                        />

                                                        {/* Affichage des images multiples (si pas d'image principale) */}
                                                        {!article.imageUrl && article.images && article.images.length > 0 && (
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Image className="w-4 h-4 text-green-600" />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        Images ({article.images.length})
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                                    {article.images.slice(0, 3).map((imageUrl, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                                                                        >
                                                                            <img
                                                                                src={imageUrl}
                                                                                alt={`Image ${index + 1} de l'article`}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg2MFY2MEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI1IDI1SDM1VjM1SDI1VjI1WiIgZmlsbD0iI0M3Q0ZEMiIvPgo8cGF0aCBkPSJNMzAgNDBMMjAgNTBINjBMMzAgNDBaIiBmaWxsPSIjQzdDRkQyIi8+Cjwvc3ZnPgo=';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                    {article.images.length > 3 && (
                                                                        <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                                                            <span className="text-sm font-medium text-gray-500">
                                                                                +{article.images.length - 3}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/journal/${article._id}`)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Lire l'article complet
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </motion.div>
                ) : (
                    /* Onglet Journaux - Liste des éditions avec style cartes événements */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >

                        {/* Grille des éditions avec style cartes événements */}
                        {loadingEditions ? (
                            <motion.div
                                className="text-center py-12"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement des journaux...</p>
                            </motion.div>
                        ) : editions.length === 0 ? (
                            <motion.div
                                className="text-center py-16"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="text-gray-400 text-8xl mb-6">📰</div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Aucun journal créé
                                </h2>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    {user?.role === 'admin' 
                                        ? 'Aucun journal n\'a encore été créé. Créez votre premier journal en sélectionnant des articles validés.'
                                        : 'Aucun journal n\'a encore été créé. Les administrateurs peuvent créer des journaux en sélectionnant des articles validés.'
                                    }
                                </p>
                                {user?.role === 'admin' && (
                                    <Button 
                                        onClick={() => navigate('/journal/new')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Créer le premier journal
                                    </Button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {editions.map((edition, index) => {
                                    const isRecent = (dateString: string) => {
                                        const date = new Date(dateString);
                                        const now = new Date();
                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays <= 30;
                                    };

                                    const isOld = (dateString: string) => {
                                        const date = new Date(dateString);
                                        const now = new Date();
                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays > 90;
                                    };

                                    const isRecentEdition = isRecent(edition.createdAt);
                                    const isOldEdition = isOld(edition.createdAt);

                                    return (
                                        <motion.div
                                            key={edition._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            className="group"
                                        >
                                            <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
                                                {/* Edition Image/Icon */}
                                                <div className="relative">
                                                    <div className="h-48 w-full bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
                                                        <BookOpen className="w-16 h-16 text-purple-400" />
                                                    </div>
                                                    

                                                    {/* Status Badges */}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                        {isRecentEdition && (
                                                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
                                                                Récent
                                                            </span>
                                                        )}
                                                        {isOldEdition && (
                                                            <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
                                                                Archive
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <CardContent className="p-6 flex-1 flex flex-col">
                                                    {/* Edition Title */}
                                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                                                        {edition.title}
                                                    </h3>

                                                    {/* Edition Details */}
                                                    <div className="space-y-3 mb-4 flex-1">
                                                        {edition.description && (
                                                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 font-medium">
                                                                {edition.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="w-4 h-4 mr-3 text-purple-500" />
                                                            <div>
                                                                <p className="font-medium">Créé le {new Date(edition.createdAt).toLocaleDateString('fr-FR')}</p>
                                                                <p className="text-sm text-gray-500">{new Date(edition.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 mt-auto">
                                                        <Button asChild size="md" className="w-full shadow-md hover:shadow-lg transition-shadow">
                                                            <Link to={`/journal/edition/${edition.uuid}`}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Voir l'édition
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Results Summary */}
                        {!loadingEditions && !error && editions.length > 0 && (
                            <motion.div
                                className="mt-8 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <p className="text-gray-600">
                                    {editions.length} édition{editions.length > 1 ? 's' : ''} du journal
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Journal; 
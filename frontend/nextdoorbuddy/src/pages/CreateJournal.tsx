import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import {
    BookOpen,
    ArrowLeft,
    Save,
    AlertCircle,
    CheckCircle,
    X
} from 'lucide-react';
import journalService, { JournalArticle } from '../services/journal.service';

interface LocationState {
    selectedArticles: string[];
}

const CreateJournal: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [articles, setArticles] = useState<JournalArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // Vérifier que l'utilisateur est admin
        if (user?.role !== 'admin') {
            navigate('/journal');
            return;
        }
        
        if (!state?.selectedArticles || state.selectedArticles.length === 0) {
            navigate('/journal/new');
            return;
        }
        loadSelectedArticles();
    }, [state, navigate, user?.role]);

    const loadSelectedArticles = async () => {
        try {
            console.log('=== FRONTEND: Chargement des articles sélectionnés ===');
            setIsLoading(true);
            setError(null);
            
            // Récupérer tous les articles et filtrer ceux qui sont sélectionnés
            const allArticles = await journalService.getValidatedArticlesWithoutEdition();
            const selectedArticles = allArticles.filter(article => 
                state.selectedArticles.includes(article._id)
            );
            
            console.log('FRONTEND: Articles sélectionnés reçus:', selectedArticles);
            console.log('FRONTEND: Nombre d\'articles sélectionnés:', selectedArticles.length);
            
            setArticles(selectedArticles);
            console.log('FRONTEND: Articles sélectionnés mis à jour dans le state');
        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement des articles sélectionnés:', err);
            setError('Erreur lors du chargement des articles sélectionnés');
        } finally {
            setIsLoading(false);
            console.log('FRONTEND: Chargement des articles sélectionnés terminé');
        }
    };

    const removeArticle = (articleId: string) => {
        setArticles(articles.filter(article => article._id !== articleId));
    };

    const handleCreateJournal = async () => {
        if (!title.trim()) {
            setError('Le titre du journal est requis');
            return;
        }

        if (articles.length === 0) {
            setError('Au moins un article doit être sélectionné');
            return;
        }

        try {
            console.log('=== FRONTEND: Création du journal ===');
            setIsCreating(true);
            setError(null);
            setSuccess(null);
            
            const journalData = {
                title: title.trim(),
                description: description.trim(),
                articleIds: articles.map(article => article._id)
            };
            
            console.log('FRONTEND: Données du journal à créer:', journalData);
            
            // Appeler l'API pour créer le journal
            await journalService.createJournal(journalData);
            
            console.log('FRONTEND: Journal créé avec succès');
            setSuccess('Journal créé avec succès !');
            
            // Rediriger vers la page journal après 2 secondes
            setTimeout(() => {
                navigate('/journal');
            }, 2000);
            
        } catch (err) {
            console.error('FRONTEND: Erreur lors de la création du journal:', err);
            setError('Erreur lors de la création du journal');
        } finally {
            setIsCreating(false);
            console.log('FRONTEND: Création du journal terminée');
        }
    };

    const handleBackToSelection = () => {
        navigate('/journal/new');
    };

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
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={handleBackToSelection}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la sélection
                        </Button>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                        <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                        Créer un nouveau journal
                        {user?.role === 'admin' && (
                            <span className="ml-3 flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                Admin
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Finalisez la création de votre journal en ajoutant un titre et une description
                    </p>
                </motion.div>

                {/* Error/Success Messages */}
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

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-center text-green-800">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span>{success}</span>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulaire de création */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                                    Informations du journal
                                </h2>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                            Titre du journal *
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Journal du quartier - Édition de printemps"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            maxLength={100}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            {title.length}/100 caractères
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (optionnel)
                                        </label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Décrivez le contenu de ce journal..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                            maxLength={500}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            {description.length}/500 caractères
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handleCreateJournal}
                                            disabled={isCreating || !title.trim() || articles.length === 0}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Création en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Créer le journal ({articles.length} articles)
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Liste des articles sélectionnés */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Articles sélectionnés
                                    </h2>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {articles.length} article{articles.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {articles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Aucun article sélectionné</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {articles.map((article, index) => (
                                            <motion.div
                                                key={article._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                            >
                                                <Card className="border border-gray-200 hover:shadow-md transition-all duration-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                                                                        #{index + 1}
                                                                    </span>
                                                                    <h3 className="font-semibold text-gray-900">
                                                                        {article.title}
                                                                    </h3>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    Par <span className="font-medium">{article.authorName}</span> • 
                                                                    {new Date(article.date).toLocaleDateString('fr-FR')} • 
                                                                    <span className="font-medium"> {article.quartierName}</span>
                                                                </p>
                                                                <div 
                                                                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: article.content.length > 150 
                                                                            ? `${article.content.substring(0, 150)}...`
                                                                            : article.content
                                                                    }}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeArticle(article._id)}
                                                                className="ml-4 flex-shrink-0"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CreateJournal; 
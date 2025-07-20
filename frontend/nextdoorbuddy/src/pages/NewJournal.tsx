import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import {
    BookOpen,
    Plus,
    ArrowLeft,
    Eye,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import journalService, { JournalArticle } from '../services/journal.service';
import uploadService from '../services/upload.service';

const NewJournal: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<JournalArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Vérifier que l'utilisateur est admin
        if (user?.role !== 'admin') {
            navigate('/journal');
            return;
        }
        
        loadUnassignedArticles();
    }, [user?.role, navigate]);

    const loadUnassignedArticles = async () => {
        try {
            console.log('=== FRONTEND: Chargement des articles non attribués ===');
            setIsLoading(true);
            setError(null);
            
            const data = await journalService.getValidatedArticlesWithoutEdition();
            
            console.log('FRONTEND: Articles non attribués reçus:', data);
            console.log('FRONTEND: Nombre d\'articles non attribués:', data.length);
            
            setArticles(data);
            console.log('FRONTEND: Articles non attribués mis à jour dans le state');
        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement des articles non attribués:', err);
            setError('Erreur lors du chargement des articles non attribués');
        } finally {
            setIsLoading(false);
            console.log('FRONTEND: Chargement des articles non attribués terminé');
        }
    };

    const toggleArticleSelection = (articleId: string) => {
        const newSelected = new Set(selectedArticles);
        if (newSelected.has(articleId)) {
            newSelected.delete(articleId);
        } else {
            newSelected.add(articleId);
        }
        setSelectedArticles(newSelected);
    };

    const selectAllArticles = () => {
        const allArticleIds = articles.map(article => article._id);
        setSelectedArticles(new Set(allArticleIds));
    };

    const deselectAllArticles = () => {
        setSelectedArticles(new Set());
    };

    const handleCreateJournal = () => {
        // TODO: Implémenter la création du journal avec les articles sélectionnés
        console.log('Articles sélectionnés pour le nouveau journal:', Array.from(selectedArticles));
        // Naviguer vers une page de création de journal avec les articles sélectionnés
        navigate('/journal/create-journal', { 
            state: { selectedArticles: Array.from(selectedArticles) }
        });
    };

    const handleViewArticle = (articleId: string) => () => {
        navigate(`/journal/${articleId}`);
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/journal')}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Retour
                                </Button>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                                Nouveau journal
                                {user?.role === 'admin' && (
                                    <span className="ml-3 flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        Admin
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-600 text-lg mb-6">
                                Sélectionnez les articles validés pour créer un nouveau journal
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                onClick={selectAllArticles}
                                variant="outline"
                                className="px-4 py-2"
                            >
                                Tout sélectionner
                            </Button>
                            <Button 
                                onClick={deselectAllArticles}
                                variant="outline"
                                className="px-4 py-2"
                            >
                                Tout désélectionner
                            </Button>
                            <Button 
                                onClick={handleCreateJournal}
                                disabled={selectedArticles.size === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                                Créer le journal ({selectedArticles.size})
                            </Button>
                        </div>
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

                {/* Stats */}
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
                                    <div className="text-2xl font-bold text-green-600">{articles.length}</div>
                                    <div className="text-sm text-gray-600">Articles disponibles</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{selectedArticles.size}</div>
                                    <div className="text-sm text-gray-600">Articles sélectionnés</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {new Set(articles.map(a => a.quartierName)).size}
                                    </div>
                                    <div className="text-sm text-gray-600">Quartiers représentés</div>
                                </div>
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
                    {articles.length === 0 ? (
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-12 text-center">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Aucun article disponible
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Tous les articles validés sont déjà attribués à un journal
                                </p>
                                <Button 
                                    onClick={() => navigate('/journal')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour au journal
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        articles.map((article) => (
                            <motion.div
                                key={article._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className={`shadow-lg border-0 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                                    selectedArticles.has(article._id) 
                                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                                        : 'bg-white'
                                }`}
                                onClick={() => toggleArticleSelection(article._id)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <div className="flex-shrink-0 mt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedArticles.has(article._id)}
                                                    onChange={() => toggleArticleSelection(article._id)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            {/* Image à gauche */}
                                            {article.imageUrl && (
                                                <div className="flex-shrink-0 w-32">
                                                    <img
                                                        src={uploadService.getImageUrl(article.imageUrl)}
                                                        alt={`Image de l'article : ${article.title}`}
                                                        className="w-full h-24 object-cover rounded-lg shadow-md"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Article content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {article.title}
                                                    </h3>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Validé
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-2">
                                                    Par <span className="font-medium">{article.authorName}</span> • 
                                                    {new Date(article.date).toLocaleDateString('fr-FR')} • 
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
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleViewArticle(article._id)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Voir
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default NewJournal; 
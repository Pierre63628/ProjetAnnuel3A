import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
    Search,
    Eye,
    Calendar,
    User,
    BookOpen,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import journalService, { JournalArticle } from '../services/journal.service';
import uploadService from '../services/upload.service';

interface JournalViewProps {
    selectedWeek?: string | undefined;
    onViewArticle: (article: JournalArticle) => void;
}

const JournalView: React.FC<JournalViewProps> = ({
    selectedWeek,
    onViewArticle
}) => {
    const { user } = useAuth();
    const [articles, setArticles] = useState<JournalArticle[]>([]);
    const [stats, setStats] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadArticles();
        loadStats();
    }, [selectedWeek]);

    const loadArticles = async () => {
        try {
            console.log('=== CHARGEMENT ARTICLES DANS JOURNALVIEW ===');
            console.log('selectedWeek:', selectedWeek);
            console.log('User:', user);
            
            setIsLoading(true);
            setError(null);
            
            console.log('Appel de journalService.getPublicArticles()...');
            const data = await journalService.getPublicArticles();
            
            console.log('Articles reçus dans JournalView:', {
                count: data.length,
                articles: data.map(article => ({
                    _id: article._id,
                    title: article.title,
                    status: article.status,
                    date: article.date
                }))
            });
            
            setArticles(data);
        } catch (err) {
            console.error('Erreur dans loadArticles:', err);
            setError('Erreur lors du chargement du journal');
        } finally {
            setIsLoading(false);
            console.log('Chargement terminé');
        }
    };

    const loadStats = async () => {
        try {
            // Stats simplifiées basées sur les articles chargés
            const stats = {
                total: articles.length,
                byCategory: articles.reduce((acc, article) => {
                    acc[article.category] = (acc[article.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                byMonth: articles.reduce((acc, article) => {
                    const month = new Date(article.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            };
            setStats(stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const categories = ['all', 'Événements', 'Améliorations', 'Environnement', 'Culture', 'Sport', 'Actualités'];

    // Fonction pour extraire le texte brut du HTML
    const stripHtml = (html: string): string => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    // Fonction pour tronquer le HTML proprement
    const truncateHtml = (html: string, maxLength: number = 300): string => {
        const textContent = stripHtml(html);
        if (textContent.length <= maxLength) {
            return html;
        }
        
        // Tronquer le texte et ajouter "..."
        const truncatedText = textContent.substring(0, maxLength) + '...';
        return `<p>${truncatedText}</p>`;
    };

    const filteredArticles = (articles || []).filter(article => {
        const contentText = stripHtml(article.content);
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            contentText.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatWeekRange = (weekStart?: string): string => {
        if (!weekStart) {
            return 'Tous les articles';
        }
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        
        return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du journal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                    <div className="flex items-center text-red-800">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span>{error}</span>
                    </div>
                </motion.div>
            )}

            {/* Week Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                                    <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                                    Journal du quartier
                                </h2>
                                <p className="text-gray-600 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {selectedWeek ? formatWeekRange(selectedWeek) : 'Tous les articles'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{filteredArticles.length}</div>
                                <div className="text-sm text-gray-600">Articles au total</div>
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
                                        placeholder="Rechercher dans le journal..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="md:w-48">
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
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Articles List */}
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {filteredArticles.length === 0 ? (
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                Aucun article trouvé
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || selectedCategory !== 'all' 
                                    ? 'Essayez de modifier vos critères de recherche'
                                    : 'Le journal est vide'
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredArticles.map((article, index) => (
                        <motion.div
                            key={article._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                        >
                            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
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
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                        {article.title}
                                                    </h2>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                        <span className="flex items-center">
                                                            <User className="w-4 h-4 mr-1" />
                                                            {article.authorName}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {new Date(article.date).toLocaleDateString('fr-FR')}
                                                        </span>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                            {article.category}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {new Date(article.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div 
                                                className="text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{
                                                    __html: truncateHtml(article.content, 300)
                                                }}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 lg:w-48">
                                            <Button 
                                                variant="solid" 
                                                size="sm"
                                                onClick={() => onViewArticle(article)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Lire l'article
                                            </Button>
                                            
                                            <div className="text-xs text-gray-500 text-center">
                                                Article public du quartier
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Stats Footer */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                                    <div className="text-sm text-gray-600">Total d'articles</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-green-600">
                                        {Object.keys(stats.byCategory).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Catégories</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-purple-600">
                                        {Object.keys(stats.byMonth).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Mois actifs</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-orange-600">
                                        {filteredArticles.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Cette semaine</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default JournalView; 
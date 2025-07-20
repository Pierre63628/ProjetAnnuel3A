import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    ArrowLeft,
    Edit,
    Trash2,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    MapPin,
    User,
    Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import journalService, { JournalArticle } from '../services/journal.service';
import uploadService from '../services/upload.service';
import RejectModal from '../components/RejectModal';

const ArticleDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    
    const [article, setArticle] = useState<JournalArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{
        isOpen: boolean;
        article: JournalArticle | null;
    }>({
        isOpen: false,
        article: null
    });

    useEffect(() => {
        if (id) {
            loadArticle();
        }
    }, [id]);

    const loadArticle = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const articleData = await journalService.getArticleById(id!);
            
            if (!articleData) {
                throw new Error('Article non trouvé');
            }
            
            setArticle(articleData);
        } catch (err) {
            setError('Erreur lors du chargement de l\'article');
            console.error('Error loading article:', err);
        } finally {
            setIsLoading(false);
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4 mr-2" />
                {config.label}
            </span>
        );
    };

    const handleDelete = async () => {
        if (!article) return;
        
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.title}" ?`)) {
            try {
                await journalService.deleteArticle(article._id);
                navigate('/journal');
            } catch (err) {
                setError('Erreur lors de la suppression');
                console.error('Error deleting article:', err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement de l'article...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/journal')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour
                        </Button>
                    </div>
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Article non trouvé
                            </h3>
                            <p className="text-gray-600">
                                {error || 'L\'article que vous recherchez n\'existe pas ou a été supprimé.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/journal')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Retour
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {article.title}
                                </h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {article.authorName}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(article.date).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {article.quartierName}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Tag className="w-4 h-4" />
                                        {article.category}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusBadge(article.status)}
                        </div>
                    </div>
                </motion.div>

                {/* Image de l'article */}
                {article.imageUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="shadow-lg border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="relative">
                                    <img
                                        src={uploadService.getImageUrl(article.imageUrl)}
                                        alt={`Image de l'article : ${article.title}`}
                                        className="w-full h-64 md:h-80 object-cover"
                                        onError={(e) => {
                                            console.error('Erreur de chargement de l\'image:', article.imageUrl);
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                        onLoad={() => {
                                            console.log('Image chargée avec succès:', article.imageUrl);
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Article Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-8">
                            <div 
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-end gap-2"
                >
                    {/* Actions pour les utilisateurs normaux (auteurs) */}
                    {user?.role !== 'admin' && article.authorId === user?.id && (
                        <>
                            {(article.status === 'brouillon' || article.status === 'refuse') && (
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/journal/edit/${article._id}`)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                </Button>
                            )}
                            {(article.status === 'brouillon' || article.status === 'refuse') && (
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                </Button>
                            )}
                        </>
                    )}

                    {/* Actions pour les admins */}
                    {user?.role === 'admin' && (
                        <>
                            {(article.status === 'brouillon' || article.status === 'refuse') && article.authorId === user?.id && (
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/journal/edit/${article._id}`)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                </Button>
                            )}
                            {article.status === 'a_valider' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={async () => {
                                            try {
                                                await journalService.validateArticle(article._id, 'Article validé par l\'administrateur');
                                                navigate('/journal');
                                            } catch (err) {
                                                setError('Erreur lors de la validation');
                                            }
                                        }}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Valider
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            setRejectModal({
                                                isOpen: true,
                                                article
                                            });
                                        }}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rejeter
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>

                {/* Modal de rejet d'article */}
                <RejectModal
                    isOpen={rejectModal.isOpen}
                    onClose={() => setRejectModal({ isOpen: false, article: null })}
                    onConfirm={async (comment: string) => {
                        try {
                            await journalService.rejectArticle(article!._id, comment);
                            navigate('/journal');
                        } catch (err) {
                            setError('Erreur lors du rejet');
                        }
                    }}
                    articleTitle={rejectModal.article?.title || ''}
                />
            </div>
        </div>
    );
};

export default ArticleDetail; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    BookOpen,
    ArrowLeft,
    Calendar,
    User,
    MapPin,
    Tag,
    Eye,
    Clock,
    FileDown
} from 'lucide-react';
import journalService, { JournalArticle, Edition } from '../services/journal.service';
import uploadService from '../services/upload.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EditionDetail: React.FC = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const [edition, setEdition] = useState<Edition | null>(null);
    const [articles, setArticles] = useState<JournalArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (uuid) {
            loadEditionAndArticles();
        }
    }, [uuid]);

    const loadEditionAndArticles = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('=== FRONTEND: Chargement de l\'édition et ses articles ===');
            console.log('UUID:', uuid);

            // Charger l'édition
            const editionData = await journalService.getEditionByUUID(uuid!);
            if (!editionData) {
                setError('Édition non trouvée');
                return;
            }
            setEdition(editionData);

            // Charger les articles de l'édition
            const articlesData = await journalService.getArticlesByEdition(uuid!);
            setArticles(articlesData);

            console.log('FRONTEND: Édition chargée:', editionData);
            console.log('FRONTEND: Articles chargés:', articlesData.length);

        } catch (err) {
            console.error('FRONTEND: Erreur lors du chargement:', err);
            setError('Erreur lors du chargement de l\'édition');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const generatePDF = async () => {
        if (!edition || articles.length === 0) return;

        try {
            // Créer un élément temporaire pour le contenu PDF
            const pdfContent = document.createElement('div');
            pdfContent.style.position = 'absolute';
            pdfContent.style.left = '-9999px';
            pdfContent.style.top = '0';
            pdfContent.style.width = '800px';
            pdfContent.style.padding = '40px';
            pdfContent.style.backgroundColor = 'white';
            pdfContent.style.fontFamily = 'Arial, sans-serif';
            pdfContent.style.fontSize = '12px';
            pdfContent.style.lineHeight = '1.6';
            pdfContent.style.color = '#333';

            // En-tête de l'édition
            const header = document.createElement('div');
            header.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 28px; font-weight: bold; color: #333; margin: 0 0 10px 0;">${edition.title}</h1>
                    ${edition.description ? `<p style="font-size: 16px; color: #666; margin: 0;">${edition.description}</p>` : ''}
                    <p style="font-size: 14px; color: #888; margin: 10px 0 0 0;">${formatDate(edition.createdAt)}</p>
                </div>
            `;
            pdfContent.appendChild(header);

            // Articles
            articles.forEach((article) => {
                const articleDiv = document.createElement('div');
                articleDiv.style.marginBottom = '30px';
                articleDiv.style.pageBreakInside = 'avoid';
                
                // Préparer le contenu HTML pour le PDF avec images
                let processedContent = article.content;
                
                // Remplacer les entités HTML
                processedContent = processedContent
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");

                // Préparer la mise en page avec image au-dessus du texte
                let articleLayout = '';
                
                if (article.imageUrl) {
                    const imageUrl = uploadService.getImageUrl(article.imageUrl);
                    articleLayout = `
                        <div style="margin-bottom: 20px;">
                            <div style="text-align: center; margin-bottom: 15px;">
                                <img src="${imageUrl}" 
                                     alt="Image de l'article : ${article.title}"
                                     style="max-width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                     onerror="this.style.display='none';"
                                />
                            </div>
                            <div style="font-size: 12px; line-height: 1.6; text-align: justify;">
                                ${processedContent}
                            </div>
                        </div>
                    `;
                } else {
                    articleLayout = `
                        <div style="font-size: 12px; line-height: 1.6; text-align: justify;">
                            ${processedContent}
                        </div>
                    `;
                }

                articleDiv.innerHTML = `
                    <h2 style="font-size: 20px; font-weight: bold; color: #333; margin: 0 0 10px 0;">
                        ${article.title}
                    </h2>
                    <div style="font-size: 11px; color: #666; margin-bottom: 15px;">
                        <span style="margin-right: 15px;">👤 ${article.authorName}</span>
                        <span style="margin-right: 15px;">📅 ${formatDate(article.date)}</span>
                        <span style="margin-right: 15px;">📍 ${article.quartierName}</span>
                        <span>🏷️ ${article.category}</span>
                    </div>
                    ${articleLayout}
                `;
                
                pdfContent.appendChild(articleDiv);
            });

            // Ajouter à la page
            document.body.appendChild(pdfContent);

            // Générer le PDF
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            // Supprimer l'élément temporaire
            document.body.removeChild(pdfContent);

            // Créer le PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Ouvrir dans un nouvel onglet
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

            // Nettoyer l'URL
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Chargement de l'édition...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !edition) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-white">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                        <p className="text-red-600 mb-6">{error || 'Édition non trouvée'}</p>
                        <Button onClick={() => navigate('/journal')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour au journal
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-white">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header avec bouton retour */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/journal')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour au journal
                        </Button>
                    </div>

                    {/* Informations de l'édition */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <BookOpen className="w-8 h-8 text-purple-600" />
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {edition.title}
                                    </h1>
                                </div>

                                {edition.description && (
                                    <div className="mb-6">
                                        <p className="text-gray-700 text-lg leading-relaxed font-medium">
                                            {edition.description}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-purple-500" />
                                        <span>Créé le {formatDate(edition.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        <span>{formatTime(edition.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Bouton PDF */}
                                {articles.length > 0 && (
                                    <div className="mt-6">
                                        <Button
                                            onClick={generatePDF}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <FileDown className="w-5 h-5" />
                                            Visualiser le PDF
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </motion.div>

                {/* Liste des articles */}
                {articles.length === 0 ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-gray-400 text-8xl mb-6">📰</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Aucun article dans cette édition
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Cette édition ne contient pas encore d'articles.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <motion.h2
                            className="text-2xl font-bold text-gray-900 mb-6"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Articles de l'édition
                        </motion.h2>

                        <div className="grid grid-cols-1 gap-6">
                            {articles.map((article, index) => (
                                <motion.div
                                    key={article._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="group"
                                >
                                    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
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

                                                {/* Contenu principal */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200">
                                                                {article.title}
                                                            </h3>
                                                            
                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-4 h-4" />
                                                                    <span>{article.authorName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>{formatDate(article.date)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-4 h-4" />
                                                                    <span>{article.quartierName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Tag className="w-4 h-4" />
                                                                    <span>{article.category}</span>
                                                                </div>
                                                            </div>

                                                            <div 
                                                                className="text-gray-700 prose prose-sm max-w-none line-clamp-3"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: article.content.length > 300 
                                                                        ? `${article.content.substring(0, 300)}...`
                                                                        : article.content
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 lg:flex-shrink-0">
                                                    <Button asChild size="md" className="shadow-md hover:shadow-lg transition-shadow">
                                                        <Link to={`/journal/${article._id}`}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Lire l'article complet
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Résumé */}
                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <p className="text-gray-600">
                                {articles.length} article{articles.length > 1 ? 's' : ''} dans cette édition
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditionDetail; 
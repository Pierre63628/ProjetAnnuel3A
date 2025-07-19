import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import RichTextEditor from '../components/RichTextEditor';
import {
    Save,
    ArrowLeft,
    FileText,
    AlertCircle,
    CheckCircle,
    Upload,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import journalService, { CreateArticleData, UpdateArticleData } from '../services/journal.service';
import uploadService from '../services/upload.service';

const ArticleForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Actualités',
        quartier_id: user?.quartier_id || undefined,
        imageUrl: ''
    });

    const categories = [
        'Actualités',
        'Événements', 
        'Améliorations',
        'Environnement',
        'Culture',
        'Sport',
        'Autres'
    ];

    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing && id) {
            loadArticle();
        }
    }, [id, isEditing]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        console.log('ARTICLE FORM: Drag over detected');
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        console.log('ARTICLE FORM: Drag leave detected');
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        console.log('ARTICLE FORM: Drop detected');
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        console.log('ARTICLE FORM: Dropped files:', files.length);
        
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            console.log('ARTICLE FORM: Image file found, starting upload');
            handleImageUpload(imageFile);
        } else {
            console.log('ARTICLE FORM: No image file found in dropped files');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('ARTICLE FORM: File select detected');
        const file = e.target.files?.[0];
        console.log('ARTICLE FORM: Selected file:', file?.name, file?.type);
        
        if (file && file.type.startsWith('image/')) {
            console.log('ARTICLE FORM: Image file selected, starting upload');
            handleImageUpload(file);
        } else {
            console.log('ARTICLE FORM: No valid image file selected');
        }
    };

    const handleImageUpload = async (file: File) => {
        try {
            console.log('=== ARTICLE FORM: Début upload image ===');
            console.log('File:', file.name, file.size, file.type);
            console.log('User authenticated:', !!localStorage.getItem('accessToken'));
            console.log('Access token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
            
            setUploadedImage(file);
            
            // Créer un aperçu de l'image
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            
            console.log('ARTICLE FORM: Appel du service d\'upload...');
            
            // Uploader l'image sur le serveur
            const uploadResponse = await uploadService.uploadImage(file);
            
            console.log('ARTICLE FORM: Upload response reçue:', uploadResponse);
            
            // Vérifier que la réponse contient l'URL de l'image
            if (!uploadResponse || !uploadResponse.imageUrl) {
                throw new Error('Réponse d\'upload invalide: URL d\'image manquante');
            }
            
            // Stocker l'URL de l'image uploadée
            setFormData(prev => ({ ...prev, imageUrl: uploadResponse.imageUrl }));
            
            console.log('ARTICLE FORM: Image uploadée avec succès:', uploadResponse);
        } catch (error: any) {
            console.error('ARTICLE FORM: Erreur détaillée lors de l\'upload:', error);
            console.error('ARTICLE FORM: Message d\'erreur:', error.message);
            console.error('ARTICLE FORM: Stack trace:', error.stack);
            setError(error.message || 'Erreur lors de l\'upload de l\'image');
            
            // Réinitialiser l'état en cas d'erreur
            setUploadedImage(null);
            setImagePreview(null);
        }
    };

    const removeImage = async () => {
        try {
            // Si une image a été uploadée, la supprimer du serveur
            if (uploadedImage && formData.imageUrl && formData.imageUrl.startsWith('/uploads/')) {
                const filename = formData.imageUrl.split('/').pop();
                if (filename) {
                    await uploadService.deleteImage(filename);
                    console.log('Image supprimée du serveur:', filename);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image du serveur:', error);
            // Continuer même si la suppression échoue
        }
        
        setUploadedImage(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, imageUrl: '' }));
    };

    const loadArticle = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const article = await journalService.getArticleById(id!);
            
            if (!article) {
                throw new Error('Article non trouvé');
            }
            
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category || 'Actualités',
                quartier_id: article.quartierId || user?.quartier_id || undefined,
                imageUrl: ''
            });
        } catch (err) {
            setError('Erreur lors du chargement de l\'article');
            console.error('Error loading article:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Le titre est requis');
            return;
        }

        if (!formData.content.trim()) {
            setError('Le contenu est requis');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);

            const articleData = {
                title: formData.title.trim(),
                content: formData.content,
                category: formData.category,
                quartier_id: formData.quartier_id,
                imageUrl: formData.imageUrl
            };

            if (isEditing) {
                await journalService.updateArticle(id!, articleData as UpdateArticleData);
                setSuccess('Article mis à jour avec succès');
            } else {
                await journalService.createArticle(articleData as CreateArticleData);
                setSuccess('Article créé avec succès');
            }

            // Rediriger après un délai
            setTimeout(() => {
                navigate('/journal');
            }, 2000);

        } catch (err) {
            setError('Erreur lors de la sauvegarde');
            console.error('Error saving article:', err);
        } finally {
            setIsSaving(false);
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
                                    {isEditing ? 'Modifier l\'article' : 'Créer un nouvel article'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEditing ? 'Modifiez votre article et sauvegardez les changements' : 'Rédigez votre article pour le journal du quartier'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Error/Success Messages */}
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

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                        <div className="flex items-center text-green-800">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span>{success}</span>
                        </div>
                    </motion.div>
                )}

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Basic Info */}
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Informations de base
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Titre de l'article *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        placeholder="Entrez le titre de votre article..."
                                        required
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image de l'article
                                    </label>
                                    
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img 
                                                src={imagePreview} 
                                                alt="Aperçu" 
                                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white border-red-300 text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                                                isDragOver 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-2">
                                                Glissez-déposez une image ici ou
                                            </p>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                    cliquez pour sélectionner
                                                </span>
                                            </label>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Formats acceptés : JPG, PNG, GIF, WebP
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* URL de fallback */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ou entrez une URL d'image
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl && !imagePreview ? formData.imageUrl : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                            placeholder="https://example.com/image.jpg"
                                            disabled={!!imagePreview}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {imagePreview ? 'Désactive quand une image est uploadée' : 'Entrez l\'URL d\'une image pour illustrer votre article'}
                                        </p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catégorie
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quartier */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quartier
                                    </label>
                                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                                        {formData.quartier_id ? (
                                            <span className="font-medium">Quartier #{formData.quartier_id}</span>
                                        ) : (
                                            <span className="text-gray-500 italic">Aucun quartier associé</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Le quartier est automatiquement associé à votre profil
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Editor */}
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Contenu de l'article *
                            </h2>
                            
                            <RichTextEditor
                                content={formData.content}
                                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                placeholder="Commencez à écrire votre article... Utilisez la barre d'outils pour formater votre texte et ajouter des images."
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <motion.div
                        className="flex justify-end gap-4 pt-6 border-t border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/journal')}
                            disabled={isSaving}
                        >
                            Annuler
                        </Button>
                        
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Sauvegarde...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isEditing ? 'Mettre à jour' : 'Créer l\'article'}
                                </>
                            )}
                        </Button>
                    </motion.div>
                </motion.form>
            </div>
        </div>
    );
};

export default ArticleForm; 
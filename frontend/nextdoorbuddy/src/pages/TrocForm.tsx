import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { trocService } from '../services/troc.service';
import { getImageUrl } from '../utils/imageUtils';
import ErrorBoundary from '../components/ErrorBoundary';

const CATEGORIES = [
    'Électronique', 'Mobilier', 'Vêtements', 'Livres', 'Jouets',
    'Sport', 'Jardinage', 'Décoration', 'Électroménager', 'Autre'
];

function TrocForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    // Function to safely process image data (same as in Troc.tsx)
    const processImageData = (images: any): string[] => {
        try {
            if (!images) return [];

            // If it's already an array, return it
            if (Array.isArray(images)) {
                return images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }

            // If it's a string that looks like an array (e.g., "{image1,image2}")
            if (typeof images === 'string') {
                // Handle PostgreSQL array format
                if (images.startsWith('{') && images.endsWith('}')) {
                    const cleanString = images.slice(1, -1); // Remove { and }
                    if (cleanString.trim() === '') return [];
                    return cleanString.split(',')
                        .map(img => img.trim().replace(/^"(.*)"$/, '$1')) // Remove surrounding quotes
                        .filter(img => img !== '');
                }
                // Handle single image as string
                return images.trim() !== '' ? [images] : [];
            }

            return [];
        } catch (error) {
            console.error('Error processing image data in TrocForm:', error, 'Original data:', images);
            return [];
        }
    };

    const [form, setForm] = useState({
        titre: '',
        description: '',
        objet_propose: '',
        objet_recherche: '',
        categorie: '',
        prix: '',
        budget_max: '',
        images: [] as string[]
    });

    const [trocType, setTrocType] = useState<'propose' | 'recherche'>('propose');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const MAX_IMAGES = 5;

    useEffect(() => {
        if (isEditing && id) {
            loadTrocForEdit(parseInt(id));
        }
    }, [isEditing, id]);

    const loadTrocForEdit = async (trocId: number) => {
        try {
            setLoading(true);
            const myTrocs = await trocService.getMyTrocs();
            const trocToEdit = myTrocs.find(t => t.id === trocId);

            if (trocToEdit) {
                // Process images using the same logic as the listing page
                const processedImages = processImageData(trocToEdit.images);
                // Debug: Log image processing for edit form
                if (processedImages.length > 0) {
                    console.log(`Loading troc ${trocToEdit.id} for edit with ${processedImages.length} image(s)`);
                }

                setForm({
                    titre: trocToEdit.titre,
                    description: trocToEdit.description,
                    objet_propose: trocToEdit.objet_propose,
                    objet_recherche: trocToEdit.objet_recherche,
                    categorie: trocToEdit.categorie || '',
                    prix: trocToEdit.prix?.toString() || '',
                    budget_max: trocToEdit.budget_max?.toString() || '',
                    images: processedImages
                });

                if (trocToEdit.objet_propose && !trocToEdit.objet_recherche) {
                    setTrocType('propose');
                } else if (trocToEdit.objet_recherche && !trocToEdit.objet_propose) {
                    setTrocType('recherche');
                } else {
                    setTrocType('propose');
                }
            } else {
                setError('Annonce non trouvée');
            }
        } catch (err) {
            setError('Erreur lors du chargement de l\'annonce');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleTrocTypeChange = (type: 'propose' | 'recherche') => {
        setTrocType(type);
        if (type === 'propose') {
            setForm({ ...form, objet_recherche: '' });
        } else {
            setForm({ ...form, objet_propose: '' });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Check total images limit
        const totalImages = form.images.length + imageFiles.length + files.length;
        if (totalImages > MAX_IMAGES) {
            setError(`Vous ne pouvez pas ajouter plus de ${MAX_IMAGES} images au total.`);
            return;
        }

        // Validate file types and sizes
        const validFiles: File[] = [];
        const validPreviews: string[] = [];

        files.forEach(file => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                setError(`Le fichier "${file.name}" n'est pas une image valide.`);
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setError(`Le fichier "${file.name}" est trop volumineux (max 5MB).`);
                return;
            }

            validFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                validPreviews.push(e.target?.result as string);
                if (validPreviews.length === validFiles.length) {
                    setImagePreviews(prev => [...prev, ...validPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });

        if (validFiles.length > 0) {
            setImageFiles(prev => [...prev, ...validFiles]);
            setError(null); // Clear any previous errors
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));

        // Reset file input
        const fileInput = document.getElementById('image_files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const uploadImages = async (): Promise<string[]> => {
        if (imageFiles.length === 0) return [];

        try {
            setUploadingImages(true);
            const formData = new FormData();

            // Add all selected images to FormData
            imageFiles.forEach(file => {
                formData.append('images', file);
            });

            const response = await fetch('/api/upload/images', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return data.imageUrls || [];
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status} lors de l'upload`);
            }
        } catch (error: any) {
            console.error('Erreur upload:', error);
            if (error.message.includes('401')) {
                setError('Session expirée. Veuillez vous reconnecter pour uploader des images.');
            } else {
                setError(`Erreur lors de l'upload des images: ${error.message}`);
            }
            return [];
        } finally {
            setUploadingImages(false);
        }
    };

    // Safe image component for edit form
    const SafeImageDisplay = ({ imageUrl, index, onRemove }: { imageUrl: string, index: number, onRemove: (url: string) => void }) => {
        const [imageError, setImageError] = useState(false);
        const finalUrl = getImageUrl(imageUrl);

        if (!finalUrl || imageError) {
            return (
                <div className="h-20 w-20 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">N/A</span>
                    <button
                        type="button"
                        onClick={() => onRemove(imageUrl)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Supprimer cette image"
                    >
                        ×
                    </button>
                </div>
            );
        }

        return (
            <div className="relative">
                <img
                    src={finalUrl}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                    onError={() => {
                        console.error('Failed to load image in edit form:', finalUrl);
                        setImageError(true);
                    }}

                />
                <button
                    type="button"
                    onClick={() => onRemove(imageUrl)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    title="Supprimer cette image"
                >
                    ×
                </button>
            </div>
        );
    };

    const handleRemoveExistingImage = async (imageUrl: string) => {
        if (!isEditing || !id) {
            // Si on n'est pas en mode édition, juste retirer de la liste locale
            setForm({
                ...form,
                images: form.images.filter(img => img !== imageUrl)
            });
            return;
        }

        try {
            setLoading(true);
            await trocService.removeTrocImage(parseInt(id));

            // Mettre à jour l'état local
            setForm({
                ...form,
                images: form.images.filter(img => img !== imageUrl)
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            setError('Erreur lors de la suppression de l\'image');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.titre.trim() || !form.description.trim()) {
            setError('Le titre et la description sont obligatoires');
            return;
        }

        if (!form.categorie.trim()) {
            setError('Veuillez sélectionner une catégorie');
            return;
        }

        if (trocType === 'propose' && !form.objet_propose.trim()) {
            setError('Veuillez spécifier l\'objet que vous proposez');
            return;
        }

        if (trocType === 'recherche' && !form.objet_recherche.trim()) {
            setError('Veuillez spécifier l\'objet que vous recherchez');
            return;
        }

        // Validation des prix/budget
        if (trocType === 'propose' && form.prix && parseFloat(form.prix) < 0) {
            setError('Le prix ne peut pas être négatif');
            return;
        }

        if (trocType === 'recherche' && form.budget_max && parseFloat(form.budget_max) < 0) {
            setError('Le budget maximum ne peut pas être négatif');
            return;
        }

        // Validation du nombre d'images
        const totalImages = form.images.length + imageFiles.length;
        if (totalImages > MAX_IMAGES) {
            setError(`Vous ne pouvez pas avoir plus de ${MAX_IMAGES} images au total`);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Upload des nouvelles images si des images sont sélectionnées
            let newImageUrls: string[] = [];
            if (imageFiles.length > 0) {
                newImageUrls = await uploadImages();
            }

            // Préparer le tableau d'images (existantes + nouvelles)
            const images = [...form.images];
            newImageUrls.forEach(url => {
                if (url && !images.includes(url)) {
                    images.push(url);
                }
            });

            const trocData = {
                titre: form.titre.trim(),
                description: form.description.trim(),
                objet_propose: trocType === 'propose' ? form.objet_propose.trim() : '',
                objet_recherche: trocType === 'recherche' ? form.objet_recherche.trim() : '',
                images: images.length > 0 ? images : undefined,
                type_annonce: trocType === 'propose' ? 'offre' as const : 'demande' as const,
                prix: trocType === 'propose' && form.prix ? parseFloat(form.prix) : undefined,
                budget_max: trocType === 'recherche' && form.budget_max ? parseFloat(form.budget_max) : undefined,
                categorie: form.categorie || undefined,
            };

            let result;
            if (isEditing && id) {
                result = await trocService.updateTroc(parseInt(id), trocData);
                console.log('Troc updated successfully:', result);
            } else {
                result = await trocService.createTroc(trocData);
                console.log('Troc created successfully:', result);
            }

            // Vérifier que la création/modification a réussi
            if (result) {
                console.log('Navigating to /trocs...');

                // Clear the form state
                setImageFiles([]);
                setImagePreviews([]);

                // Navigation immédiate - pas besoin de setTimeout
                navigate('/trocs', { replace: true });
            } else {
                console.error('Invalid response from server:', result);
                throw new Error('Réponse invalide du serveur');
            }
        } catch (err: any) {
            console.error('Erreur lors de la soumission:', err);

            // Gestion d'erreurs plus spécifique
            if (err?.message?.includes('401') || err?.message?.includes('authentifié')) {
                setError('Session expirée. Veuillez vous reconnecter.');
            } else if (err?.message?.includes('400')) {
                setError('Données invalides. Vérifiez les champs obligatoires.');
            } else if (err?.message?.includes('500')) {
                setError('Erreur serveur. Veuillez réessayer plus tard.');
            } else {
                setError(isEditing ? 'Erreur lors de la mise à jour de l\'annonce' : 'Erreur lors de la création de l\'annonce');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center">Chargement...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <ErrorBoundary>
                <div className="container mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? 'Modifier l\'annonce' : 'Créer une annonce de troc'}
                    </h1>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type de troc */}
                        <div>
                            <label className="mb-3 block text-sm font-medium text-gray-700">
                                Type d'annonce
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="trocType"
                                        value="propose"
                                        checked={trocType === 'propose'}
                                        onChange={() => handleTrocTypeChange('propose')}
                                        className="mr-2"
                                    />
                                    Je propose quelque chose
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="trocType"
                                        value="recherche"
                                        checked={trocType === 'recherche'}
                                        onChange={() => handleTrocTypeChange('recherche')}
                                        className="mr-2"
                                    />
                                    Je recherche quelque chose
                                </label>
                            </div>
                        </div>

                        {/* Titre */}
                        <div>
                            <label htmlFor="titre" className="mb-2 block text-sm font-medium text-gray-700">
                                Titre de l'annonce *
                            </label>
                            <input
                                type="text"
                                id="titre"
                                name="titre"
                                value={form.titre}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Ex: Échange livre contre DVD"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Décrivez votre annonce en détail..."
                                required
                            />
                        </div>

                        {/* Catégorie */}
                        <div>
                            <label htmlFor="categorie" className="mb-2 block text-sm font-medium text-gray-700">
                                Catégorie *
                            </label>
                            <select
                                id="categorie"
                                name="categorie"
                                value={form.categorie}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="">Sélectionnez une catégorie</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Objet proposé ou recherché */}
                        {trocType === 'propose' ? (
                            <div>
                                <label htmlFor="objet_propose" className="mb-2 block text-sm font-medium text-gray-700">
                                    Objet proposé *
                                </label>
                                <input
                                    type="text"
                                    id="objet_propose"
                                    name="objet_propose"
                                    value={form.objet_propose}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: Livre de cuisine"
                                    required
                                />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="objet_recherche" className="mb-2 block text-sm font-medium text-gray-700">
                                    Objet recherché *
                                </label>
                                <input
                                    type="text"
                                    id="objet_recherche"
                                    name="objet_recherche"
                                    value={form.objet_recherche}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: DVD de film"
                                    required
                                />
                            </div>
                        )}

                        {/* Prix ou Budget */}
                        {trocType === 'propose' ? (
                            <div>
                                <label htmlFor="prix" className="mb-2 block text-sm font-medium text-gray-700">
                                    Prix demandé (€)
                                </label>
                                <input
                                    type="number"
                                    id="prix"
                                    name="prix"
                                    value={form.prix}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: 25.00"
                                />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="budget_max" className="mb-2 block text-sm font-medium text-gray-700">
                                    Budget maximum (€)
                                </label>
                                <input
                                    type="number"
                                    id="budget_max"
                                    name="budget_max"
                                    value={form.budget_max}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: 50.00"
                                />
                            </div>
                        )}

                        {/* Upload d'images multiples */}
                        <div>
                            <label htmlFor="image_files" className="mb-2 block text-sm font-medium text-gray-700">
                                Images ({form.images.length + imageFiles.length}/{MAX_IMAGES})
                            </label>
                            <input
                                type="file"
                                id="image_files"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                disabled={form.images.length + imageFiles.length >= MAX_IMAGES}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Vous pouvez sélectionner jusqu'à {MAX_IMAGES} images (max 5MB chacune)
                            </p>

                            {/* Aperçu des images existantes */}
                            {form.images && form.images.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Images existantes ({form.images.length}) :
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.images.map((imageUrl: string, index: number) => (
                                            <SafeImageDisplay
                                                key={`${imageUrl}-${index}`}
                                                imageUrl={imageUrl}
                                                index={index}
                                                onRemove={handleRemoveExistingImage}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Aperçu des nouvelles images */}
                            {imagePreviews.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Nouvelles images ({imagePreviews.length}) :
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Aperçu nouvelle image ${index + 1}`}
                                                    className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                    title="Supprimer cette image"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uploadingImages && (
                                <p className="text-sm text-blue-600 mt-2">
                                    Upload de {imageFiles.length} image(s) en cours...
                                </p>
                            )}
                        </div>

                        {/* Boutons */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/trocs')}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'En cours...' : (isEditing ? 'Modifier' : 'Créer')}
                            </button>
                        </div>
                    </form>
                </div>
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default TrocForm;

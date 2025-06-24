import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { trocService } from '../services/troc.service';
import { getImageUrl } from '../utils/imageUtils';

const CATEGORIES = [
    'Électronique', 'Mobilier', 'Vêtements', 'Livres', 'Jouets',
    'Sport', 'Jardinage', 'Décoration', 'Électroménager', 'Autre'
];

function TrocForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setForm({
                    titre: trocToEdit.titre,
                    description: trocToEdit.description,
                    objet_propose: trocToEdit.objet_propose,
                    objet_recherche: trocToEdit.objet_recherche,
                    categorie: trocToEdit.categorie || '',
                    prix: trocToEdit.prix?.toString() || '',
                    budget_max: trocToEdit.budget_max?.toString() || '',
                    images: trocToEdit.images || []
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
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);

            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null;

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return data.imageUrl;
            } else {
                throw new Error('Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            setError('Erreur lors de l\'upload de l\'image');
            return null;
        } finally {
            setUploadingImage(false);
        }
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
            await trocService.removeTrocImage(parseInt(id), imageUrl);

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

        if (trocType === 'propose' && !form.objet_propose.trim()) {
            setError('Veuillez spécifier l\'objet que vous proposez');
            return;
        }

        if (trocType === 'recherche' && !form.objet_recherche.trim()) {
            setError('Veuillez spécifier l\'objet que vous recherchez');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Upload de l'image si une nouvelle image est sélectionnée
            let newImageUrl = null;
            if (imageFile) {
                newImageUrl = await uploadImage();
            }

            // Préparer le tableau d'images
            const images = [...form.images];
            if (newImageUrl && !images.includes(newImageUrl)) {
                images.push(newImageUrl);
            }

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

            if (isEditing && id) {
                await trocService.updateTroc(parseInt(id), trocData);
            } else {
                await trocService.createTroc(trocData);
            }

            navigate('/trocs');
        } catch (err) {
            setError(isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
            console.error('Erreur:', err);
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

                        {/* Upload d'image */}
                        <div>
                            <label htmlFor="image_file" className="mb-2 block text-sm font-medium text-gray-700">
                                Image
                            </label>
                            <input
                                type="file"
                                id="image_file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Aperçu des images existantes */}
                            {form.images && form.images.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">Images existantes :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.images.map((imageUrl: string, index: number) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={getImageUrl(imageUrl) || ''}
                                                    alt={`Image ${index + 1}`}
                                                    className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                                                    onError={(e: any) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                                {/* Bouton pour supprimer l'image existante */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(imageUrl)}
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

                            {/* Aperçu de la nouvelle image */}
                            {imagePreview && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">Nouvelle image :</p>
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu nouvelle image"
                                            className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                                        />

                                        {/* Bouton pour supprimer l'aperçu */}
                                        <div className="absolute top-1 right-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                    const fileInput = document.getElementById('image_file') as HTMLInputElement;
                                                    if (fileInput) fileInput.value = '';
                                                }}
                                                className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                title="Annuler la sélection"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {uploadingImage && (
                                <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
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
        </div>
    );
}

export default TrocForm;

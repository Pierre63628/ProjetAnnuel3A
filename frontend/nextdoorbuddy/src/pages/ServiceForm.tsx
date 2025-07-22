import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import serviceService, { Service } from '../services/service.service';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    AlertCircle,
    Calendar,
    MapPin,
    Euro,
    Users,
    Briefcase
} from 'lucide-react';

function ServiceForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [form, setForm] = useState({
        titre: '',
        description: '',
        type_service: 'offre' as 'offre' | 'demande',
        categorie: '',
        date_debut: '',
        date_fin: '',
        horaires: '',
        recurrence: 'ponctuel' as 'ponctuel' | 'hebdomadaire' | 'mensuel' | 'permanent',
        prix: '',
        budget_max: '',
        lieu: '',
        competences_requises: '',
        materiel_fourni: false,
        experience_requise: '',
        age_min: '',
        age_max: '',
        nombre_personnes: '1',
        urgence: 'normale' as 'faible' | 'normale' | 'elevee',
        contact_info: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Catégories de services disponibles
    const categories = [
        'baby-sitting',
        'jardinage',
        'bricolage',
        'ménage',
        'cours',
        'informatique',
        'cuisine',
        'transport',
        'animaux',
        'autre'
    ];

    useEffect(() => {
        if (isEditing && id) {
            loadServiceForEdit(parseInt(id));
        }
    }, [isEditing, id]);

    const loadServiceForEdit = async (serviceId: number) => {
        try {
            setLoading(true);
            const service = await serviceService.getServiceById(serviceId);

            setForm({
                titre: service.titre || '',
                description: service.description || '',
                type_service: service.type_service || 'offre',
                categorie: service.categorie || '',
                date_debut: service.date_debut ? service.date_debut.split('T')[0] : '',
                date_fin: service.date_fin ? service.date_fin.split('T')[0] : '',
                horaires: service.horaires || '',
                recurrence: service.recurrence || 'ponctuel',
                prix: service.prix ? service.prix.toString() : '',
                budget_max: service.budget_max ? service.budget_max.toString() : '',
                lieu: service.lieu || '',
                competences_requises: service.competences_requises || '',
                materiel_fourni: service.materiel_fourni || false,
                experience_requise: service.experience_requise || '',
                age_min: service.age_min ? service.age_min.toString() : '',
                age_max: service.age_max ? service.age_max.toString() : '',
                nombre_personnes: service.nombre_personnes ? service.nombre_personnes.toString() : '1',
                urgence: service.urgence || 'normale',
                contact_info: service.contact_info || ''
            });
        } catch (err: any) {
            console.error('Error loading service for edit:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement du service');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setForm(prev => ({ ...prev, [name]: checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = (): boolean => {
        if (!form.titre.trim()) {
            setError('Le titre est obligatoire');
            return false;
        }

        if (!form.description.trim()) {
            setError('La description est obligatoire');
            return false;
        }

        if (!form.categorie) {
            setError('La catégorie est obligatoire');
            return false;
        }

        // Validation des dates
        if (form.date_debut && form.date_fin) {
            const dateDebut = new Date(form.date_debut);
            const dateFin = new Date(form.date_fin);
            if (dateFin < dateDebut) {
                setError('La date de fin ne peut pas être antérieure à la date de début');
                return false;
            }
        }

        // Validation des âges
        if (form.age_min && form.age_max) {
            const ageMin = parseInt(form.age_min);
            const ageMax = parseInt(form.age_max);
            if (ageMax < ageMin) {
                setError('L\'âge maximum ne peut pas être inférieur à l\'âge minimum');
                return false;
            }
        }

        // Validation du prix/budget selon le type
        if (form.type_service === 'offre' && form.prix && parseFloat(form.prix) < 0) {
            setError('Le prix ne peut pas être négatif');
            return false;
        }

        if (form.type_service === 'demande' && form.budget_max && parseFloat(form.budget_max) < 0) {
            setError('Le budget maximum ne peut pas être négatif');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const serviceData: Service = {
                titre: form.titre.trim(),
                description: form.description.trim(),
                type_service: form.type_service,
                categorie: form.categorie,
                date_debut: form.date_debut || undefined,
                date_fin: form.date_fin || undefined,
                horaires: form.horaires || undefined,
                recurrence: form.recurrence,
                prix: form.type_service === 'offre' && form.prix ? parseFloat(form.prix) : undefined,
                budget_max: form.type_service === 'demande' && form.budget_max ? parseFloat(form.budget_max) : undefined,
                lieu: form.lieu || undefined,
                competences_requises: form.competences_requises || undefined,
                materiel_fourni: form.materiel_fourni,
                experience_requise: form.experience_requise || undefined,
                age_min: form.age_min ? parseInt(form.age_min) : undefined,
                age_max: form.age_max ? parseInt(form.age_max) : undefined,
                nombre_personnes: parseInt(form.nombre_personnes),
                urgence: form.urgence,
                contact_info: form.contact_info || undefined
            };

            if (isEditing && id) {
                await serviceService.updateService(parseInt(id), serviceData);
            } else {
                await serviceService.createService(serviceData);
            }

            navigate('/services');
        } catch (err: any) {
            console.error('Error saving service:', err);
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />
            <div className="container mx-auto p-6 max-w-4xl">
                {/* En-tête */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={() => navigate('/services')}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour aux services
                    </button>
                    <div className="flex items-center">
                        <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-800">
                            {isEditing ? 'Modifier le service' : 'Créer un service'}
                        </h1>
                    </div>
                </motion.div>

                {/* Message d'erreur */}
                {error && (
                    <motion.div
                        className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}

                {/* Formulaire */}
                <motion.div
                    className="bg-white rounded-lg shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations de base */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="type_service" className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de service *
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type_service"
                                            value="offre"
                                            checked={form.type_service === 'offre'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-green-700 font-medium">Je propose un service</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type_service"
                                            value="demande"
                                            checked={form.type_service === 'demande'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-blue-700 font-medium">Je cherche un service</span>
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    id="titre"
                                    name="titre"
                                    value={form.titre}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Baby-sitting le weekend, Cours de guitare, Aide au jardinage..."
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie *
                                </label>
                                <select
                                    id="categorie"
                                    name="categorie"
                                    value={form.categorie}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="urgence" className="block text-sm font-medium text-gray-700 mb-2">
                                    Urgence
                                </label>
                                <select
                                    id="urgence"
                                    name="urgence"
                                    value={form.urgence}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="faible">Pas pressé</option>
                                    <option value="normale">Normal</option>
                                    <option value="elevee">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Décrivez en détail le service proposé ou recherché..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Dates et horaires */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Dates et horaires
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de début
                                    </label>
                                    <input
                                        type="date"
                                        id="date_debut"
                                        name="date_debut"
                                        value={form.date_debut}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de fin
                                    </label>
                                    <input
                                        type="date"
                                        id="date_fin"
                                        name="date_fin"
                                        value={form.date_fin}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-2">
                                        Récurrence
                                    </label>
                                    <select
                                        id="recurrence"
                                        name="recurrence"
                                        value={form.recurrence}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="ponctuel">Ponctuel</option>
                                        <option value="hebdomadaire">Hebdomadaire</option>
                                        <option value="mensuel">Mensuel</option>
                                        <option value="permanent">Permanent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="horaires" className="block text-sm font-medium text-gray-700 mb-2">
                                    Horaires
                                </label>
                                <input
                                    type="text"
                                    id="horaires"
                                    name="horaires"
                                    value={form.horaires}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 9h-17h, Flexible, Soir uniquement..."
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Prix et budget */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                <Euro className="w-5 h-5 mr-2" />
                                Prix et budget
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {form.type_service === 'offre' && (
                                    <div>
                                        <label htmlFor="prix" className="block text-sm font-medium text-gray-700 mb-2">
                                            Prix proposé (€)
                                        </label>
                                        <input
                                            type="number"
                                            id="prix"
                                            name="prix"
                                            value={form.prix}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Prix en euros"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                                {form.type_service === 'demande' && (
                                    <div>
                                        <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                                            Budget maximum (€)
                                        </label>
                                        <input
                                            type="number"
                                            id="budget_max"
                                            name="budget_max"
                                            value={form.budget_max}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Budget maximum en euros"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Localisation */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                Localisation
                            </h3>
                            <div>
                                <label htmlFor="lieu" className="block text-sm font-medium text-gray-700 mb-2">
                                    Lieu
                                </label>
                                <input
                                    type="text"
                                    id="lieu"
                                    name="lieu"
                                    value={form.lieu}
                                    onChange={handleInputChange}
                                    placeholder="Ex: À domicile, Chez moi, Parc du quartier..."
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Critères et exigences */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Critères et exigences
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="nombre_personnes" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre de personnes
                                        </label>
                                        <input
                                            type="number"
                                            id="nombre_personnes"
                                            name="nombre_personnes"
                                            value={form.nombre_personnes}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="age_min" className="block text-sm font-medium text-gray-700 mb-2">
                                            Âge minimum
                                        </label>
                                        <input
                                            type="number"
                                            id="age_min"
                                            name="age_min"
                                            value={form.age_min}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            placeholder="Âge min"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="age_max" className="block text-sm font-medium text-gray-700 mb-2">
                                            Âge maximum
                                        </label>
                                        <input
                                            type="number"
                                            id="age_max"
                                            name="age_max"
                                            value={form.age_max}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            placeholder="Âge max"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="competences_requises" className="block text-sm font-medium text-gray-700 mb-2">
                                        Compétences requises
                                    </label>
                                    <textarea
                                        id="competences_requises"
                                        name="competences_requises"
                                        value={form.competences_requises}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Décrivez les compétences nécessaires..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="experience_requise" className="block text-sm font-medium text-gray-700 mb-2">
                                        Expérience requise
                                    </label>
                                    <input
                                        type="text"
                                        id="experience_requise"
                                        name="experience_requise"
                                        value={form.experience_requise}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 2 ans d'expérience, Débutant accepté..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="materiel_fourni"
                                        name="materiel_fourni"
                                        checked={form.materiel_fourni}
                                        onChange={handleInputChange}
                                        className="mr-2"
                                    />
                                    <label htmlFor="materiel_fourni" className="text-sm text-gray-700">
                                        Matériel fourni
                                    </label>
                                </div>

                                <div>
                                    <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-2">
                                        Informations de contact supplémentaires
                                    </label>
                                    <input
                                        type="text"
                                        id="contact_info"
                                        name="contact_info"
                                        value={form.contact_info}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Disponible par SMS, Préférence pour les appels..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => navigate('/services')}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {isEditing ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

export default ServiceForm;

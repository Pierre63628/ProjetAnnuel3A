import api from './api';

export interface Service {
    id?: number;
    titre: string;
    description: string;
    type_service: 'offre' | 'demande';
    categorie: string; // baby-sitting, jardinage, bricolage, ménage, cours, etc.
    date_debut?: string;
    date_fin?: string;
    horaires?: string; // "9h-17h", "flexible", etc.
    recurrence?: 'ponctuel' | 'hebdomadaire' | 'mensuel' | 'permanent';
    prix?: number;
    budget_max?: number;
    lieu?: string; // adresse ou zone
    competences_requises?: string;
    materiel_fourni?: boolean;
    experience_requise?: string;
    age_min?: number;
    age_max?: number;
    nombre_personnes?: number; // nombre de personnes recherchées pour le service
    urgence?: 'faible' | 'normale' | 'elevee';
    contact_info?: string;
    date_publication?: string;
    quartier_id?: number;
    utilisateur_id?: number;
    statut?: 'active' | 'inactive' | 'complete';
    nom?: string; // Nom de l'utilisateur (pour les services avec jointure)
    prenom?: string; // Prénom de l'utilisateur (pour les services avec jointure)
    email?: string;
    telephone?: string;
    nom_quartier?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceSearchFilters {
    type_service?: 'offre' | 'demande';
    categorie?: string;
    prix_max?: number;
    date_debut?: string;
    urgence?: string;
}

const serviceService = {
    // Créer un nouveau service
    async createService(serviceData: Service): Promise<Service> {
        try {
            const data = await api.post('/services', serviceData);
            return data.service;
        } catch (error) {
            console.error('Erreur lors de la création du service:', error);
            throw error;
        }
    },

    // Récupérer tous les services du quartier
    async getServices(): Promise<Service[]> {
        try {
            const data = await api.get('/services');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des services:', error);
            throw error;
        }
    },

    // Récupérer un service par ID
    async getServiceById(id: number): Promise<Service> {
        try {
            const data = await api.get(`/services/${id}`);
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération du service:', error);
            throw error;
        }
    },

    // Récupérer les services de l'utilisateur connecté
    async getMyServices(): Promise<Service[]> {
        try {
            const data = await api.get('/services/my-services');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de mes services:', error);
            throw error;
        }
    },

    // Mettre à jour un service
    async updateService(id: number, serviceData: Partial<Service>): Promise<Service> {
        try {
            const data = await api.put(`/services/${id}`, serviceData);
            return data.service;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du service:', error);
            throw error;
        }
    },

    // Supprimer un service
    async deleteService(id: number): Promise<void> {
        try {
            await api.delete(`/services/${id}`);
        } catch (error) {
            console.error('Erreur lors de la suppression du service:', error);
            throw error;
        }
    },

    // Recherche avancée de services
    async searchServices(filters: ServiceSearchFilters): Promise<Service[]> {
        try {
            const params = new URLSearchParams();
            
            if (filters.type_service) {
                params.append('type_service', filters.type_service);
            }
            if (filters.categorie) {
                params.append('categorie', filters.categorie);
            }
            if (filters.prix_max) {
                params.append('prix_max', filters.prix_max.toString());
            }
            if (filters.date_debut) {
                params.append('date_debut', filters.date_debut);
            }
            if (filters.urgence) {
                params.append('urgence', filters.urgence);
            }

            const data = await api.get(`/services/search?${params.toString()}`);
            return data;
        } catch (error) {
            console.error('Erreur lors de la recherche de services:', error);
            throw error;
        }
    },

    // Fonctions admin
    async getAllServicesAdmin(): Promise<Service[]> {
        try {
            const data = await api.get('/services/admin/all');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les services:', error);
            throw error;
        }
    },

    async updateServiceStatus(id: number | undefined, status: "active" | "inactive" | "complete"): Promise<void> {
        try {
            await api.patch(`/services/admin/${id}/status`, { statut: status });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    },

    async getServiceStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        complete: number;
        byCategory: Record<string, number>;
        byType: Record<string, number>;
    }> {
        try {
            const data = await api.get('/services/admin/stats');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }
};

export default serviceService;

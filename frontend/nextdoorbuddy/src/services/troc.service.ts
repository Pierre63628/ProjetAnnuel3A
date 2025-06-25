import api from './api';

export interface AnnonceTroc {
    id?: number;
    titre: string;
    description: string;
    objet_propose: string;
    objet_recherche: string;
    images?: string[]; // Array d'images
    date_publication?: string;
    quartier_id?: number;
    utilisateur_id?: number;
    statut?: 'active' | 'inactive';
    nom?: string; // Nom de l'utilisateur (pour les annonces avec jointure)
    prenom?: string; // Prénom de l'utilisateur (pour les annonces avec jointure)
    type_annonce: 'offre' | 'demande';
    prix?: number;
    budget_max?: number;
    etat_produit?: string;
    categorie?: string;
    urgence?: string;
    mode_echange?: 'vente' | 'troc' | 'don';
    criteres_specifiques?: string;
    disponibilite?: string;
}

export const trocService = {
    // Récupérer toutes les annonces du quartier de l'utilisateur
    async getAllTrocs(): Promise<AnnonceTroc[]> {
        try {
            const data = await api.get('/troc');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces de troc:', error);
            throw error;
        }
    },

    // Récupérer les annonces de l'utilisateur connecté
    async getMyTrocs(): Promise<AnnonceTroc[]> {
        try {
            const data = await api.get('/troc/my-trocs');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de mes annonces:', error);
            throw error;
        }
    },

    // Récupérer une annonce spécifique par ID
    async getTrocById(id: number): Promise<AnnonceTroc> {
        try {
            const data = await api.get(`/troc/${id}`);
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'annonce:', error);
            throw error;
        }
    },

    // Créer une nouvelle annonce
    async createTroc(trocData: Omit<AnnonceTroc, 'id' | 'date_publication' | 'quartier_id' | 'utilisateur_id' | 'statut'>): Promise<{ id: number }> {
        try {
            console.log('Creating troc with data:', trocData);
            const data = await api.post('/troc', trocData);
            console.log('Troc creation response:', data);
            return data;
        } catch (error) {
            console.error('Erreur lors de la création de l\'annonce:', error);
            throw error;
        }
    },

    // Mettre à jour une annonce
    async updateTroc(id: number, trocData: Partial<AnnonceTroc>): Promise<{ message: string }> {
        try {
            const data = await api.put(`/troc/${id}`, trocData);
            return data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'annonce:', error);
            throw error;
        }
    },

    // Supprimer une annonce
    async deleteTroc(id: number): Promise<{ message: string }> {
        try {
            const data = await api.delete(`/troc/${id}`);
            return data;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'annonce:', error);
            throw error;
        }
    },

    // Supprimer une image spécifique d'un troc
    async removeTrocImage(id: number, imageUrl?: string): Promise<{ message: string; images?: string[] }> {
        try {
            const data = await api.delete(`/troc/${id}/image`, imageUrl ? { imageUrl } : undefined);
            return data;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            throw error;
        }
    },

    // Méthodes admin
    async adminGetAllTrocs(): Promise<AnnonceTroc[]> {
        try {
            const data = await api.get('/troc/admin/all');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de toutes les annonces:', error);
            throw error;
        }
    },

    async updateTrocStatus(id: number, status: 'active' | 'inactive'): Promise<void> {
        try {
            await api.patch(`/troc/admin/${id}/status`, { statut: status });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    },

    async getTrocStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byCategory: Record<string, number>;
        byType: Record<string, number>;
    }> {
        try {
            const data = await api.get('/troc/admin/stats');
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }
};

export default trocService;

import api from './api';

export interface Quartier {
    id: number;
    nom_quartier: string;
    ville?: string;
    code_postal?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UserQuartier {
    id: number;
    utilisateur_id: number;
    quartier_id: number;
    est_principal: boolean;
    statut: string;
    nom_quartier?: string;
    ville?: string;
    code_postal?: string;
}

export const getQuartiers = async (): Promise<Quartier[]> => {
    try {
        const data = await api.get('/quartiers');
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        return [];
    }
};

export const getQuartierById = async (id: number): Promise<Quartier | null> => {
    try {
        const data = await api.get(`/quartiers/${id}`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération du quartier ${id}:`, error);
        return null;
    }
};

export const getQuartiersByVille = async (ville: string): Promise<Quartier[]> => {
    try {
        const data = await api.get(`/quartiers/ville/${encodeURIComponent(ville)}`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des quartiers de ${ville}:`, error);
        return [];
    }
};

export const searchQuartiers = async (query: string): Promise<Quartier[]> => {
    try {
        const data = await api.get(`/quartiers/search?q=${encodeURIComponent(query)}`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la recherche de quartiers avec "${query}":`, error);
        return [];
    }
};

export const createQuartier = async (quartier: Omit<Quartier, 'id'>): Promise<Quartier | null> => {
    try {
        const data = await api.post('/quartiers', quartier);
        return data;
    } catch (error) {
        console.error('Erreur lors de la création du quartier:', error);
        return null;
    }
};

export const updateQuartier = async (id: number, quartier: Partial<Quartier>): Promise<Quartier | null> => {
    try {
        const data = await api.put(`/quartiers/${id}`, quartier);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du quartier ${id}:`, error);
        return null;
    }
};

export const deleteQuartier = async (id: number): Promise<boolean> => {
    try {
        await api.delete(`/quartiers/${id}`);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la suppression du quartier ${id}:`, error);
        return false;
    }
};



export const getUserQuartiers = async (userId: number): Promise<UserQuartier[]> => {
    try {
        console.log(`Fetching quartiers for user ${userId}`);
        // Utiliser le service API pour une gestion cohérente des requêtes
        const data = await api.get(`/users/${userId}/quartiers`);
        console.log('Received quartiers data:', data);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des quartiers de l'utilisateur ${userId}:`, error);
        // Afficher plus de détails sur l'erreur pour le débogage
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        return [];
    }
};

export const addQuartierToUser = async (userId: number, quartierId: number, estPrincipal: boolean = false): Promise<boolean> => {
    try {
        await api.post(`/users/${userId}/quartiers`, {
            quartier_id: quartierId,
            est_principal: estPrincipal
        });
        return true;
    } catch (error) {
        console.error(`Erreur lors de l'ajout du quartier ${quartierId} à l'utilisateur ${userId}:`, error);
        return false;
    }
};

export const setQuartierAsPrincipal = async (userId: number, quartierId: number): Promise<boolean> => {
    try {
        await api.put(`/users/${userId}/quartiers/${quartierId}/principal`, {});
        return true;
    } catch (error) {
        console.error(`Erreur lors de la définition du quartier ${quartierId} comme principal pour l'utilisateur ${userId}:`, error);
        return false;
    }
};

export const removeQuartierFromUser = async (userId: number, relationId: number): Promise<boolean> => {
    try {
        await api.delete(`/users/${userId}/quartiers/${relationId}`);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la suppression du quartier ${relationId} de l'utilisateur ${userId}:`, error);
        return false;
    }
};

export default {
    getQuartiers,
    getQuartierById,
    getQuartiersByVille,
    searchQuartiers,
    createQuartier,
    updateQuartier,
    deleteQuartier,
    getUserQuartiers,
    addQuartierToUser,
    setQuartierAsPrincipal,
    removeQuartierFromUser
};
